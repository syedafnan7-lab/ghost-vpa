import time
import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
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

    # 1. Fast Canary Lookup
    is_canary = honeypot_registry.is_canary(event.beneficiary_vpa)
    event.is_canary_hit = is_canary

    if is_canary:
        event.simulated_result = "TRIPWIRE_TRIGGERED"
        event.zero_funds_transferred = True
        sender_status = "REVIEW_REQUIRED"
        await honeypot_registry.record_hit(event.beneficiary_vpa, db)
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

    # 2. Ingest into Temporal Graph (Both Benign and Canary)
    temporal_graph.add_transaction_edge(event)

    # 3. Persist Event to DB
    event_db = PaymentEventModel(
        event_id=event.event_id,
        timestamp=event.timestamp,
        sender_account_id=event.sender_account_id,
        sender_vpa=event.sender_vpa,
        sender_bank=event.sender_bank,
        beneficiary_account_id=event.beneficiary_account_id,
        beneficiary_vpa=event.beneficiary_vpa,
        beneficiary_bank=event.beneficiary_bank,
        amount_inr=event.amount_inr,
        payment_rail=event.payment_rail,
        attempt_type=event.attempt_type,
        event_type=getattr(event, "event_type", "PAYMENT_ATTEMPT") or "PAYMENT_ATTEMPT",
        original_event_id=getattr(event, "original_event_id", None),
        device_token=event.device_token,
        ip_subnet=event.ip_subnet,
        is_canary_hit=is_canary,
        simulated_result=event.simulated_result,
        zero_funds_transferred=event.zero_funds_transferred
    )
    db.add(event_db)

    # 4. If Canary Match: Generate Immediate Alert & Case Dossier
    alert_payload = None
    if is_canary:
        canary = honeypot_registry.get_canary_by_vpa(event.beneficiary_vpa)
        canary_id = canary.canary_id if canary else "CANARY-UNKNOWN"

        alert_id = f"ALT-{uuid.uuid4().hex[:10].upper()}"
        alert_db = AlertModel(
            alert_id=alert_id,
            event_id=event.event_id,
            timestamp=sim_time,
            canary_id=canary_id,
            canary_vpa=event.beneficiary_vpa,
            sender_account_id=event.sender_account_id,
            sender_vpa=event.sender_vpa,
            sender_bank=event.sender_bank,
            amount_inr=event.amount_inr,
            device_token=event.device_token,
            risk_level="CRITICAL",
            status="NEW",
            detection_latency_ms=round((time.perf_counter() - start_time) * 1000, 2),
            zero_funds_verified=True,
            context_metadata=json.dumps({
                "purpose": canary.purpose if canary else "Regulatory Honeypot",
                "payment_rail": event.payment_rail
            })
        )
        db.add(alert_db)

        # Resolve network attribution from temporal graph
        attribution = temporal_graph.attribute_case_network(event.sender_account_id, sim_time)
        cluster_id = attribution.get("cluster_id")
        feeder_id = attribution.get("feeder_id")
        mule_count = attribution.get("connected_mule_count", 0)
        all_feeders = attribution.get("all_feeders", [])

        # Create or update Investigation Case Dossier under RBI 60-Day SOP
        case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
        case_db = CaseModel(
            case_id=case_id,
            target_account_id=event.sender_account_id,
            target_vpa=event.sender_vpa,
            target_bank=event.sender_bank,
            originating_alert_id=alert_id,
            case_status="OPEN_TRIAGE",
            sop_day_counter=1,
            explanation_days_left=20,
            assigned_analyst="analyst_sharma",
            cluster_id=cluster_id,
            connected_mule_count=mule_count,
            upstream_feeder_account=feeder_id,
            created_at=sim_time,
            updated_at=sim_time,
            analyst_notes_json=json.dumps([
                f"[{sim_time.strftime('%H:%M:%S')}] Tripwire triggered: Attempt of ₹{event.amount_inr:,.2f} on {event.beneficiary_vpa}. Zero funds moved.",
                f"[{sim_time.strftime('%H:%M:%S')}] Network attribution: Upstream Feeder={feeder_id or 'None'}, Cluster={cluster_id or 'Isolated'}, Connected Mules={mule_count}."
            ]),
            audit_hash="GENESIS_CASE_HASH",
            fiu_str_narrative=f"STR Narrative: Account {event.sender_account_id} probed canary {event.beneficiary_vpa}. Temporal graph analysis attributes funding to upstream feeder {feeder_id or 'None / Unattributed'} in syndicate cluster {cluster_id or 'ISOLATED'} with {mule_count} connected mule accounts. Zero funds transferred across payment rail.",
            ncrp_payload_json=json.dumps({
                "suspect_account": event.sender_account_id,
                "suspect_bank": event.sender_bank,
                "incident_type": "MONEY_MULE_PROBE",
                "canary_triggered": event.beneficiary_vpa,
                "upstream_feeder": feeder_id,
                "all_feeders": all_feeders,
                "syndicate_cluster_id": cluster_id,
                "connected_mule_count": mule_count
            })
        )
        db.add(case_db)

        # Audit log entry
        await audit_logger.log_action(
            db=db,
            actor_id="SYSTEM_CANARY_WATCH",
            actor_role="SYSTEM",
            action="TRIPWIRE_TRIGGERED",
            entity_id=event.sender_account_id,
            details={
                "alert_id": alert_id,
                "canary_vpa": event.beneficiary_vpa,
                "amount": event.amount_inr,
                "zero_funds_transferred": True
            }
        )

        alert_payload = {
            "alert_id": alert_id,
            "event_id": event.event_id,
            "timestamp": sim_time.isoformat(),
            "canary_vpa": event.beneficiary_vpa,
            "sender_account_id": event.sender_account_id,
            "sender_vpa": event.sender_vpa,
            "sender_bank": event.sender_bank,
            "amount_inr": event.amount_inr,
            "device_token": event.device_token,
            "risk_level": "CRITICAL",
            "zero_funds_verified": True
        }

    await db.commit()

    latency_ms = (time.perf_counter() - start_time) * 1000

    # 5. Broadcast to WebSocket clients
    await ws_manager.broadcast({
        "type": event.event_type,
        "data": {
            "event_id": event.event_id,
            "timestamp": sim_time.isoformat(),
            "sender_account_id": event.sender_account_id,
            "sender_vpa": event.sender_vpa,
            "sender_bank": event.sender_bank,
            "beneficiary_vpa": event.beneficiary_vpa,
            "beneficiary_bank": event.beneficiary_bank,
            "amount_inr": event.amount_inr,
            "payment_rail": event.payment_rail,
            "is_canary_hit": is_canary,
            "simulated_result": event.simulated_result,
            "sender_status": sender_status
        }
    })

    if alert_payload:
        await ws_manager.broadcast({
            "type": "TRIPWIRE_ALERT",
            "data": alert_payload
        })

    return IngestionResponse(
        event_id=event.event_id,
        status="PROCESSED",
        is_canary_hit=is_canary,
        sender_status=sender_status,
        latency_ms=round(latency_ms, 2),
        message=("Canary interaction recorded; Zero funds moved; sender tagged REVIEW_REQUIRED." if is_canary
                 else "Confirmed credit recorded." if event.event_type == "CREDIT_CONFIRMED"
                 else "Event recorded; no funds were transferred.")
    )
