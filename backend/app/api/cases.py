import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.db.models import CaseModel
from backend.app.core.audit_logger import audit_logger
from backend.app.schemas.cases import CaseDossierResponse, CaseActionPayload
from backend.app.threat_intel.stix_exporter import stix_exporter

router = APIRouter(prefix="/api/v1/cases", tags=["Investigation Workbench & Cases"])

@router.get("", response_model=List[CaseDossierResponse])
async def list_cases(db: AsyncSession = Depends(get_db)):
    stmt = select(CaseModel).order_by(CaseModel.created_at.desc())
    result = await db.execute(stmt)
    cases = result.scalars().all()
    out = []
    for c in cases:
        out.append(CaseDossierResponse(
            case_id=c.case_id,
            target_account_id=c.target_account_id,
            target_vpa=c.target_vpa,
            target_bank=c.target_bank,
            originating_alert_id=c.originating_alert_id,
            case_status=c.case_status,
            sop_day_counter=c.sop_day_counter,
            explanation_days_left=c.explanation_days_left,
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
    stmt = select(CaseModel).where(CaseModel.case_id == case_id)
    result = await db.execute(stmt)
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # RBAC Enforcement: Only Supervisor can apply formal debit hold
    if payload.action == "APPLY_HOLD" and x_user_role != "Supervisor":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Supervisor can authorize formal 60-day SOP debit hold.")

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

    return CaseDossierResponse(
        case_id=case.case_id,
        target_account_id=case.target_account_id,
        target_vpa=case.target_vpa,
        target_bank=case.target_bank,
        originating_alert_id=case.originating_alert_id,
        case_status=case.case_status,
        sop_day_counter=case.sop_day_counter,
        explanation_days_left=case.explanation_days_left,
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

@router.get("/{case_id}/stix-bundle")
async def download_case_stix_bundle(case_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CaseModel).where(CaseModel.case_id == case_id)
    result = await db.execute(stmt)
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    bundle = stix_exporter.export_case_bundle(case)
    return bundle
