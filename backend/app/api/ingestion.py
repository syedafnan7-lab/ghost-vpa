import time
import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.db.models import PaymentEventModel, AlertModel, CaseModel
from backend.app.core.honeypot_registry import honeypot_registry
from backend.app.core.simulation_clock import clock
from backend.app.core.audit_logger import audit_logger
from backend.app.graph.temporal_engine import temporal_graph
from backend.app.schemas.events import PaymentAttemptEvent, IngestionResponse
from backend.app.schemas.alerts import TripwireAlertPayload
from backend.app.api.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/simulate", tags=["Ingestion & Rail Simulation"])

@router.post("/attempt", response_model=IngestionResponse)
async def ingest_payment_attempt(event: PaymentAttemptEvent, db: AsyncSession = Depends(get_db)):
    """Fast triage pipeline (<15ms SLA):
    1. Canary Registry Lookup (in-memory O(1))
    2. Tripwire Alert Generation
    3. Sender Tagging: REVIEW_REQUIRED
    4. Pre-Routing Sidecar Intercept (Zero Core Posting / Zero Funds Moved)
    5. Graph Ingestion & Event Persistence"""
    start_time = time.perf_counter()
    sim_time = event.timestamp or clock.now()

    # Event IDs are idempotency keys. A replay returns the stored outcome and
    # must not increment a canary, create another case, or duplicate graph edges.
    existing_result = await db.execute(
        select(PaymentEventModel).where(PaymentEventModel.event_id == event.event_id)
    )
    existing = existing_result.scalars().first()
    if existing:
        stored_time = existing.timestamp
        incoming_time = event.timestamp
        if stored_time.tzinfo is None:
            stored_time = stored_time.replace(tzinfo=timezone.utc)
        if incoming_time.tzinfo is None:
            incoming_time = incoming_time.replace(tzinfo=timezone.utc)
        same_payload = (
            stored_time.astimezone(timezone.utc) == incoming_time.astimezone(timezone.utc)
            and existing.sender_account_id == event.sender_account_id
            and existing.sender_vpa == event.sender_vpa
            and existing.sender_bank == event.sender_bank
            and existing.beneficiary_account_id == event.beneficiary_account_id
            and existing.beneficiary_vpa == event.beneficiary_vpa
            and existing.beneficiary_bank == event.beneficiary_bank
            and float(existing.amount_inr) == float(event.amount_inr)
            and existing.payment_rail == event.payment_rail
            and existing.attempt_type == event.attempt_type
            and existing.event_type == event.event_type
            and existing.original_event_id == event.original_event_id
            and existing.device_token == event.device_token
            and existing.ip_subnet == event.ip_subnet
        )
        if not same_payload:
            raise HTTPException(status_code=409, detail="event_id already exists with a different event payload.")
        alert_result = await db.execute(select(AlertModel).where(AlertModel.event_id == event.event_id))
        alert = alert_result.scalars().first()
        case_result = await db.execute(
            select(CaseModel).where(CaseModel.originating_alert_id == alert.alert_id)
        ) if alert else None
        case = case_result.scalars().first() if case_result else None
        return IngestionResponse(
            event_id=existing.event_id,
            status="DUPLICATE",
            is_canary_hit=bool(existing.is_canary_hit),
            sender_status="REVIEW_REQUIRED" if existing.is_canary_hit else "BENIGN",
            latency_ms=round((time.perf_counter() - start_time) * 1000, 2),
            message="Event already processed; stored result returned.",
            alert_id=alert.alert_id if alert else None,
            case_id=case.case_id if case else None,
        )

    registered_canary = honeypot_registry.is_canary(event.beneficiary_vpa)
    is_canary = registered_canary and event.event_type == "PAYMENT_ATTEMPT"
    if registered_canary and event.event_type == "CREDIT_CONFIRMED":
        raise HTTPException(status_code=422, detail="A canary endpoint cannot receive a confirmed credit in the simulation rail.")
    if event.event_type == "PAYMENT_REVERSED":
        if not event.original_event_id:
            raise HTTPException(status_code=422, detail="PAYMENT_REVERSED requires original_event_id.")
        original_result = await db.execute(
            select(PaymentEventModel).where(PaymentEventModel.event_id == event.original_event_id)
        )
        original = original_result.scalars().first()
        if (not original or original.event_type != "CREDIT_CONFIRMED"
                or original.sender_account_id != event.sender_account_id
                or original.beneficiary_account_id != event.beneficiary_account_id):
            raise HTTPException(status_code=422, detail="Reversal must reference a confirmed credit with matching participants.")
        original_time = original.timestamp
        if original_time.tzinfo is None:
            original_time = original_time.replace(tzinfo=timezone.utc)
        event_time = event.timestamp
        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)
        if event_time < original_time.astimezone(timezone.utc):
            raise HTTPException(status_code=422, detail="Reversal timestamp cannot precede its confirmed credit.")

    event.is_canary_hit = is_canary
    if is_canary:
        event.simulated_result = "TRIPWIRE_TRIGGERED"
        event.zero_funds_transferred = True
        sender_status = "REVIEW_REQUIRED"
    elif event.event_type == "CREDIT_CONFIRMED":
        event.simulated_result = "SETTLED_NORMAL"
        event.zero_funds_transferred = False
        sender_status = "BENIGN"
    elif event.event_type == "PAYMENT_DECLINED":
        event.simulated_result = "DECLINED_BENIGN"
        event.zero_funds_transferred = True
        sender_status = "BENIGN"
    else:
        event.simulated_result = "ATTEMPT_RECORDED"
        event.zero_funds_transferred = True
        sender_status = "BENIGN"

    # The canary edge is temporarily projected so attribution sees the seed.
    # All durable rows and the audit entry commit in one SQL transaction.
    if is_canary:
        temporal_graph.add_transaction_edge(event)
    alert_payload = None
    case_id = None
    alert_id = None
    try:
        event_db = PaymentEventModel(
            event_id=event.event_id, timestamp=event.timestamp,
            sender_account_id=event.sender_account_id, sender_vpa=event.sender_vpa,
            sender_bank=event.sender_bank, beneficiary_account_id=event.beneficiary_account_id,
            beneficiary_vpa=event.beneficiary_vpa, beneficiary_bank=event.beneficiary_bank,
            amount_inr=event.amount_inr, payment_rail=event.payment_rail,
            attempt_type=event.attempt_type, event_type=event.event_type,
            original_event_id=event.original_event_id, device_token=event.device_token,
            ip_subnet=event.ip_subnet, is_canary_hit=is_canary,
            simulated_result=event.simulated_result,
            zero_funds_transferred=event.zero_funds_transferred
        )
        db.add(event_db)

        if is_canary:
            canary = honeypot_registry.get_canary_by_vpa(event.beneficiary_vpa)
            await honeypot_registry.record_hit(event.beneficiary_vpa, db, commit=False)
            attribution = temporal_graph.attribute_case_network(event.sender_account_id, sim_time)
            evidence = attribution.get("evidence", {})
            event_ids = sorted(set(evidence.get("event_ids", [])) | {event.event_id})
            refreshed_case_ids = []
            if attribution.get("cluster_id"):
                open_cases_result = await db.execute(
                    select(CaseModel).where(CaseModel.case_status == "OPEN_TRIAGE")
                )
                open_cases = open_cases_result.scalars().all()
                newly_connected = set(evidence.get("connected_mules", []))
                for open_case in open_cases:
                    if open_case.target_account_id not in newly_connected:
                        continue
                    case_attribution = temporal_graph.attribute_case_network(open_case.target_account_id, sim_time)
                    case_evidence = case_attribution.get("evidence", {})
                    case_event_ids = sorted(set(case_evidence.get("event_ids", [])) | {event.event_id})
                    previous = json.loads(open_case.ncrp_payload_json or "{}")
                    previous["upstream_feeder_candidate"] = case_attribution.get("feeder_id")
                    previous["upstream_feeder"] = case_attribution.get("feeder_id")
                    previous["all_feeders"] = case_attribution.get("all_feeders", [])
                    previous["cluster_id"] = case_attribution.get("cluster_id")
                    previous["syndicate_cluster_id"] = case_attribution.get("cluster_id")
                    previous["connected_mule_count"] = case_attribution.get("connected_mule_count", 0)
                    previous["evidence_event_ids"] = sorted(
                        set(previous.get("evidence_event_ids", [])) | set(case_event_ids)
                    )
                    previous["evidence"] = case_evidence
                    open_case.cluster_id = case_attribution.get("cluster_id")
                    open_case.upstream_feeder_account = case_attribution.get("feeder_id")
                    open_case.connected_mule_count = case_attribution.get("connected_mule_count", 0)
                    open_case.fiu_str_narrative = (
                        "Prototype narrative preview; not submitted. Canary interaction from "
                        f"{open_case.target_account_id}; upstream candidate "
                        f"{case_attribution.get('feeder_id') or 'unattributed'}; cluster "
                        f"{case_attribution.get('cluster_id') or 'none'}; source events "
                        f"{', '.join(case_event_ids)}."
                    )
                    open_case.updated_at = sim_time
                    open_case.ncrp_payload_json = json.dumps(previous)
                    notes = json.loads(open_case.analyst_notes_json or "[]")
                    notes.append(
                        f"[{sim_time.strftime('%H:%M:%S')}] Network evidence refreshed from event {event.event_id}."
                    )
                    open_case.analyst_notes_json = json.dumps(notes)
                    refreshed_case_ids.append(open_case.case_id)
            alert_id = f"ALT-{uuid.uuid4().hex[:10].upper()}"
            case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
            db.add(AlertModel(
                alert_id=alert_id, event_id=event.event_id, timestamp=sim_time,
                canary_id=canary.canary_id if canary else "CANARY-UNKNOWN",
                canary_vpa=event.beneficiary_vpa, sender_account_id=event.sender_account_id,
                sender_vpa=event.sender_vpa, sender_bank=event.sender_bank,
                amount_inr=event.amount_inr, device_token=event.device_token,
                risk_level="HIGH", status="NEW",
                detection_latency_ms=round((time.perf_counter() - start_time) * 1000, 2),
                zero_funds_verified=True,
                context_metadata=json.dumps({"payment_rail": event.payment_rail, "event_id": event.event_id})
            ))
            feeder_id = attribution.get("feeder_id")
            cluster_id = attribution.get("cluster_id")
            mule_count = attribution.get("connected_mule_count", 0)
            all_feeders = attribution.get("all_feeders", [])
            case_record = CaseModel(
                case_id=case_id, target_account_id=event.sender_account_id,
                target_vpa=event.sender_vpa, target_bank=event.sender_bank,
                originating_alert_id=alert_id, case_status="OPEN_TRIAGE",
                sop_day_counter=1, explanation_days_left=20,
                assigned_analyst="analyst_sharma", cluster_id=cluster_id,
                connected_mule_count=mule_count, upstream_feeder_account=feeder_id,
                created_at=sim_time, updated_at=sim_time,
                analyst_notes_json=json.dumps([
                    f"[{sim_time.strftime('%H:%M:%S')}] Canary interaction recorded from event {event.event_id}; no funds transferred.",
                    f"[{sim_time.strftime('%H:%M:%S')}] Graph evidence: feeder candidate={feeder_id or 'none'}, connected canary-interacting accounts={mule_count}, cluster={cluster_id or 'none'}.",
                ]),
                audit_hash="GENESIS_CASE_HASH",
                fiu_str_narrative=(
                    "Prototype narrative preview; not submitted. Canary interaction from "
                    f"{event.sender_account_id}; upstream candidate {feeder_id or 'unattributed'}; "
                    f"cluster {cluster_id or 'none'}; source events {', '.join(event_ids)}."
                ),
                ncrp_payload_json=json.dumps({
                    "preview_only": True, "target_account": event.sender_account_id,
                    "canary_id": canary.canary_id if canary else None,
                    "canary_event_id": event.event_id,
                    "upstream_feeder": feeder_id,
                    "upstream_feeder_candidate": feeder_id, "all_feeders": all_feeders,
                    "cluster_id": cluster_id, "syndicate_cluster_id": cluster_id,
                    "connected_mule_count": mule_count,
                    "evidence_event_ids": event_ids,
                    "evidence": evidence,
                })
            )
            db.add(case_record)
            tripwire_audit = await audit_logger.log_action(
                db=db, actor_id="SYSTEM_CANARY_WATCH", actor_role="SYSTEM",
                action="CANARY_INTERACTION_RECORDED", entity_id=event.sender_account_id,
                details={"alert_id": alert_id, "event_id": event.event_id, "zero_funds_transferred": True},
                commit=False,
            )
            case_record.audit_hash = tripwire_audit.current_hash
            if refreshed_case_ids:
                refreshed_audit = await audit_logger.log_action(
                    db=db, actor_id="SYSTEM_GRAPH_REVIEW", actor_role="SYSTEM",
                    action="CASE_GRAPH_EVIDENCE_REFRESHED", entity_id=attribution["cluster_id"],
                    details={"case_ids": refreshed_case_ids, "source_event_id": event.event_id},
                    commit=False,
                )
                for open_case in open_cases:
                    if open_case.case_id in refreshed_case_ids:
                        open_case.audit_hash = refreshed_audit.current_hash
            alert_payload = {
                "alert_id": alert_id, "event_id": event.event_id,
                "timestamp": sim_time.isoformat(), "canary_vpa": event.beneficiary_vpa,
                "sender_account_id": event.sender_account_id, "sender_vpa": event.sender_vpa,
                "sender_bank": event.sender_bank, "amount_inr": event.amount_inr,
                "device_token": event.device_token, "risk_level": "HIGH", "zero_funds_verified": True,
            }

        await db.commit()
    except Exception:
        await db.rollback()
        if is_canary:
            temporal_graph.remove_event(event.event_id)
        raise

    # Other event projections follow the durable commit. Reversals keep both
    # original and reversal event provenance in the temporal graph.
    if not is_canary:
        temporal_graph.add_transaction_edge(event)

    latency_ms = (time.perf_counter() - start_time) * 1000
    await ws_manager.broadcast({
        "type": event.event_type,
        "data": {
            "event_id": event.event_id, "timestamp": sim_time.isoformat(),
            "sender_account_id": event.sender_account_id, "sender_vpa": event.sender_vpa,
            "sender_bank": event.sender_bank, "beneficiary_vpa": event.beneficiary_vpa,
            "beneficiary_bank": event.beneficiary_bank, "amount_inr": event.amount_inr,
            "payment_rail": event.payment_rail, "event_type": event.event_type,
            "original_event_id": event.original_event_id, "is_canary_hit": is_canary,
            "simulated_result": event.simulated_result,
            "zero_funds_transferred": event.zero_funds_transferred,
            "sender_status": sender_status,
        }
    })
    if alert_payload:
        await ws_manager.broadcast({"type": "TRIPWIRE_ALERT", "data": alert_payload})

    return IngestionResponse(
        event_id=event.event_id, status="PROCESSED", is_canary_hit=is_canary,
        sender_status=sender_status, latency_ms=round(latency_ms, 2),
        message=("Canary interaction recorded; Zero funds moved; sender marked REVIEW_REQUIRED."
                 if is_canary else "Confirmed credit recorded." if event.event_type == "CREDIT_CONFIRMED"
                 else "Event recorded; no funds were transferred."),
        alert_id=alert_id, case_id=case_id,
    )
