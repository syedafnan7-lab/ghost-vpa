import json
from datetime import datetime, timezone
from typing import List, Tuple
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.db.models import CaseModel, PaymentEventModel
from backend.app.core.audit_logger import audit_logger
from backend.app.core.simulation_clock import clock
from backend.app.schemas.cases import CaseDossierResponse, CaseActionPayload, CaseEvidenceEvent
from backend.app.threat_intel.stix_exporter import stix_exporter

router = APIRouter(prefix="/api/v1/cases", tags=["Investigation Workbench & Cases"])

def compute_case_deadlines(created_at: datetime, sim_now: datetime) -> Tuple[int, int]:
    """Dynamically computes the 60-day SOP Day Counter and 20-Day Customer Explanation Window
    relative to the advancing simulation clock."""
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if sim_now.tzinfo is None:
        sim_now = sim_now.replace(tzinfo=timezone.utc)
    elapsed_seconds = max(0.0, (sim_now - created_at).total_seconds())
    elapsed_days = int(elapsed_seconds // 86400)
    sop_day_counter = min(60, max(1, elapsed_days + 1))
    explanation_days_left = max(0, 20 - elapsed_days)
    return sop_day_counter, explanation_days_left

@router.get("", response_model=List[CaseDossierResponse])
async def list_cases(db: AsyncSession = Depends(get_db)):
    stmt = select(CaseModel).order_by(CaseModel.created_at.desc())
    result = await db.execute(stmt)
    cases = result.scalars().all()
    sim_now = clock.now()
    out = []
    for c in cases:
        sop_day, exp_days = compute_case_deadlines(c.created_at, sim_now)
        # If case is closed, explanation days left is 0
        active_exp_days = exp_days if c.case_status not in ["CLOSED_UNWITTING_VICTIM", "CLOSED_CONFIRMED_MULE"] else 0
        out.append(CaseDossierResponse(
            case_id=c.case_id,
            target_account_id=c.target_account_id,
            target_vpa=c.target_vpa,
            target_bank=c.target_bank,
            originating_alert_id=c.originating_alert_id,
            case_status=c.case_status,
            sop_day_counter=sop_day,
            explanation_days_left=active_exp_days,
            assigned_analyst=c.assigned_analyst,
            cluster_id=c.cluster_id,
            connected_mule_count=c.connected_mule_count,
            upstream_feeder_account=c.upstream_feeder_account,
            created_at=c.created_at,
            updated_at=c.updated_at,
            analyst_notes=json.loads(c.analyst_notes_json or "[]"),
            audit_hash=c.audit_hash,
            fiu_str_narrative=c.fiu_str_narrative,
            ncrp_payload_preview=json.loads(c.ncrp_payload_json or "{}")
        ))
    return out

@router.post("/{case_id}/action", response_model=CaseDossierResponse)
async def take_case_action(
    case_id: str,
    payload: CaseActionPayload,
    db: AsyncSession = Depends(get_db),
    x_user_role: str = Header("Analyst", alias="X-User-Role")
):
    # The role header and actor ID are client-controlled. Disable every case
    # mutation until a trusted authorization provider and audit identity exist.
    raise HTTPException(
        status_code=503,
        detail="Case actions are disabled: this prototype has no authenticated authorization provider.",
    )

    stmt = select(CaseModel).where(CaseModel.case_id == case_id)
    result = await db.execute(stmt)
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    notes = json.loads(case.analyst_notes_json or "[]")
    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")

    if payload.action == "DISPATCH_NOTICE":
        case.case_status = "CUSTOMER_NOTICE_ISSUED"
        case.explanation_days_left = 20
        notes.append(f"[{now_str}] 20-Day Customer Explanation Notice issued via registered SMS/e-mail by {payload.actor_id}.")
    elif payload.action == "APPLY_HOLD":
        case.case_status = "DEBIT_HOLD_ACTIVE"
        notes.append(f"[{now_str}] 60-Day Temporary Debit Hold authorized by {payload.actor_id} (Role: {x_user_role}).")
    elif payload.action == "RESOLVE_VICTIM":
        case.case_status = "CLOSED_UNWITTING_VICTIM"
        notes.append(f"[{now_str}] Case resolved as Unwitting Scam Victim. Protective advisory issued; hold released.")
    elif payload.action == "CONFIRM_MULE":
        case.case_status = "CLOSED_CONFIRMED_MULE"
        notes.append(f"[{now_str}] Account confirmed as active syndicate mule. Escalated to NCRP and FIU-IND.")

    if payload.notes:
        notes.append(f"[{now_str}] Note ({payload.actor_id}): {payload.notes}")

    case.analyst_notes_json = json.dumps(notes)
    case.updated_at = datetime.now(timezone.utc)

    # Log to tamper-evident audit trail
    audit_entry = await audit_logger.log_action(
        db=db,
        actor_id=payload.actor_id,
        actor_role=x_user_role,
        action=f"CASE_ACTION_{payload.action}",
        entity_id=case.case_id,
        details={"status": case.case_status, "note": payload.notes}
    )
    case.audit_hash = audit_entry.current_hash

    await db.commit()
    await db.refresh(case)

    sim_now = clock.now()
    sop_day, exp_days = compute_case_deadlines(case.created_at, sim_now)
    active_exp_days = exp_days if case.case_status not in ["CLOSED_UNWITTING_VICTIM", "CLOSED_CONFIRMED_MULE"] else 0

    return CaseDossierResponse(
        case_id=case.case_id,
        target_account_id=case.target_account_id,
        target_vpa=case.target_vpa,
        target_bank=case.target_bank,
        originating_alert_id=case.originating_alert_id,
        case_status=case.case_status,
        sop_day_counter=sop_day,
        explanation_days_left=active_exp_days,
        assigned_analyst=case.assigned_analyst,
        cluster_id=case.cluster_id,
        connected_mule_count=case.connected_mule_count,
        upstream_feeder_account=case.upstream_feeder_account,
        created_at=case.created_at,
        updated_at=case.updated_at,
        analyst_notes=notes,
        audit_hash=case.audit_hash,
        fiu_str_narrative=case.fiu_str_narrative,
        ncrp_payload_preview=json.loads(case.ncrp_payload_json or "{}")
    )


@router.get("/{case_id}/evidence", response_model=List[CaseEvidenceEvent])
async def get_case_evidence(case_id: str, db: AsyncSession = Depends(get_db)):
    case_result = await db.execute(select(CaseModel).where(CaseModel.case_id == case_id))
    case = case_result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    payload = json.loads(case.ncrp_payload_json or "{}")
    event_ids = set(payload.get("evidence_event_ids", []))
    if not event_ids:
        from backend.app.db.models import AlertModel
        alert_result = await db.execute(select(AlertModel).where(AlertModel.alert_id == case.originating_alert_id))
        alert = alert_result.scalars().first()
        if alert:
            event_ids.add(alert.event_id)
    if not event_ids:
        return []

    events_result = await db.execute(
        select(PaymentEventModel)
        .where(PaymentEventModel.event_id.in_(event_ids))
        .order_by(PaymentEventModel.timestamp.asc(), PaymentEventModel.event_id.asc())
    )
    return [CaseEvidenceEvent(
        event_id=e.event_id, timestamp=e.timestamp, event_type=e.event_type or "PAYMENT_ATTEMPT",
        original_event_id=e.original_event_id, sender_account_id=e.sender_account_id,
        beneficiary_account_id=e.beneficiary_account_id, beneficiary_vpa=e.beneficiary_vpa,
        amount_inr=e.amount_inr, is_canary_hit=bool(e.is_canary_hit),
        simulated_result=e.simulated_result or "ATTEMPT_RECORDED",
        zero_funds_transferred=bool(e.zero_funds_transferred),
    ) for e in events_result.scalars().all()]

@router.get("/{case_id}/stix-bundle")
async def download_case_stix_bundle(case_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CaseModel).where(CaseModel.case_id == case_id)
    result = await db.execute(stmt)
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    bundle = stix_exporter.export_case_bundle(case)
    return bundle
