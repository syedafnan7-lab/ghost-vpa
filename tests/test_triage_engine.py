import asyncio
import time
import uuid
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.core.honeypot_registry import honeypot_registry
from backend.app.core.simulation_clock import clock
from backend.app.api.ingestion import ingest_payment_attempt
from backend.app.db.session import init_db, AsyncSessionLocal
from backend.app.graph.temporal_engine import temporal_graph

def test_canary_tripwire_fast_triage():
    """Verifies that a payment targeting a registered canary VPA:
    1. Intercepts within < 15ms SLA
    2. Tags sender as REVIEW_REQUIRED
    3. Confirms zero funds moved
    4. Triggers tripwire alert"""
    async def _run():
        await init_db()
        async with AsyncSessionLocal() as db:
            await honeypot_registry.initialize(db)

            sim_now = clock.now()
            event = PaymentAttemptEvent(
                event_id=f"TXN-TRIAGE-{uuid.uuid4().hex[:8].upper()}",
                timestamp=sim_now,
                sender_account_id=f"ACCT_SYNTH_TEST_{uuid.uuid4().hex[:4]}",
                sender_vpa="sender.test@hdfxbank",
                sender_bank="HDFX",
                beneficiary_vpa="canary.trap.01@icixbank",
                beneficiary_bank="ICIX",
                amount_inr=15000.0,
                payment_rail="UPI",
                device_token="DEV_TOK_TEST_1",
                ip_subnet="192.168.1.0/24"
            )

            t0 = time.perf_counter()
            resp = await ingest_payment_attempt(event, db)
            elapsed_ms = (time.perf_counter() - t0) * 1000

            # Assertions
            assert resp.is_canary_hit is True
            assert resp.sender_status == "REVIEW_REQUIRED"
            assert elapsed_ms < 50.0  # Test execution tolerance
            assert "Zero funds moved" in resp.message

    asyncio.run(_run())

def test_benign_transfer_does_not_trip_canary():
    """Verifies that a payment targeting a normal account does NOT trigger tripwires."""
    async def _run():
        await init_db()
        async with AsyncSessionLocal() as db:
            await honeypot_registry.initialize(db)

            sim_now = clock.now()
            event = PaymentAttemptEvent(
                event_id=f"TXN-BENIGN-{uuid.uuid4().hex[:8].upper()}",
                timestamp=sim_now,
                sender_account_id=f"ACCT_SYNTH_TEST_{uuid.uuid4().hex[:4]}",
                sender_vpa="normal.customer@hdfxbank",
                sender_bank="HDFX",
                beneficiary_vpa="grocery.merchant@icixbank",
                beneficiary_bank="ICIX",
                amount_inr=350.0,
                payment_rail="UPI",
                device_token="DEV_TOK_TEST_2",
                ip_subnet="192.168.1.0/24"
            )

            resp = await ingest_payment_attempt(event, db)
            assert resp.is_canary_hit is False
            assert resp.sender_status == "BENIGN"

    asyncio.run(_run())


def test_unconfirmed_attempt_does_not_record_funds_moved():
    async def _run():
        await init_db()
        event_id = f"TXN-ATTEMPT-{uuid.uuid4().hex[:8].upper()}"
        sender = f"ACCT_SYNTH_ATTEMPT_{uuid.uuid4().hex[:6]}"
        beneficiary = f"ACCT_SYNTH_BENEF_{uuid.uuid4().hex[:6]}"
        event = PaymentAttemptEvent(
            event_id=event_id,
            timestamp=clock.now(),
            sender_account_id=sender,
            sender_vpa="sender.attempt@hdfxbank",
            sender_bank="HDFX",
            beneficiary_account_id=beneficiary,
            beneficiary_vpa="recipient.attempt@icixbank",
            beneficiary_bank="ICIX",
            amount_inr=1200.0,
            event_type="PAYMENT_ATTEMPT",
            device_token="DEV_TOK_ATTEMPT",
            ip_subnet="192.168.1.0/24",
        )
        async with AsyncSessionLocal() as db:
            response = await ingest_payment_attempt(event, db)

        edge = temporal_graph.graph.get_edge_data(sender, beneficiary)[event_id]
        assert response.status == "PROCESSED"
        assert event.simulated_result == "ATTEMPT_RECORDED"
        assert event.zero_funds_transferred is True
        assert edge["is_financial"] is False
        assert edge["amount_inr"] == 0.0
        assert edge["attempted_amount_inr"] == 1200.0
    asyncio.run(_run())

def test_scenario_b_populates_case_attribution_fields():
    """Verifies that executing Scenario B (Shared Feeder Syndicate) creates
    investigation cases with correctly populated graph attribution fields:
    - upstream_feeder_account
    - connected_mule_count
    - cluster_id
    - ncrp and fiu narrative metadata"""
    import json
    from sqlalchemy.future import select
    from backend.app.db.models import CaseModel
    from backend.app.simulator.rail import simulator

    async def _run():
        await init_db()
        async with AsyncSessionLocal() as db:
            await honeypot_registry.initialize(db)

        # Run Scenario B
        events = await simulator.run_scenario_b_shared_feeder()
        assert len(events) >= 1
        event_ids = {e.event_id for e in events}

        async with AsyncSessionLocal() as db:
            from backend.app.db.models import AlertModel
            # Find alerts generated by these canary attempt events
            stmt_alert = select(AlertModel).where(AlertModel.event_id.in_(event_ids))
            res_alert = await db.execute(stmt_alert)
            alert_ids = {a.alert_id for a in res_alert.scalars().all()}
            assert len(alert_ids) >= 1

            # Find the exact cases originating from these alerts
            stmt_case = select(CaseModel).where(CaseModel.originating_alert_id.in_(alert_ids))
            res_case = await db.execute(stmt_case)
            cases = res_case.scalars().all()
            assert len(cases) > 0

            scen_b_case = cases[0]
            assert scen_b_case.target_account_id in ["ACCT_SYNTH_ICIX_4401", "ACCT_SYNTH_HDFX_4402"]
            assert scen_b_case.upstream_feeder_account == "FEEDER_SYNTH_007"
            assert scen_b_case.connected_mule_count >= 1
            assert scen_b_case.cluster_id is not None
            assert scen_b_case.cluster_id.startswith("CLUST-SYN-")

            # Check NCRP payload preview
            ncrp = json.loads(scen_b_case.ncrp_payload_json)
            assert ncrp["upstream_feeder"] == "FEEDER_SYNTH_007"
            assert ncrp["syndicate_cluster_id"] == scen_b_case.cluster_id

            # Check FIU STR narrative
            assert "FEEDER_SYNTH_007" in scen_b_case.fiu_str_narrative
            assert scen_b_case.cluster_id in scen_b_case.fiu_str_narrative

    asyncio.run(_run())
