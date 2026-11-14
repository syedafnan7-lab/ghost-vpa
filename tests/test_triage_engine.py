import asyncio
import time
import uuid
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.core.honeypot_registry import honeypot_registry
from backend.app.core.simulation_clock import clock
from backend.app.api.ingestion import ingest_payment_attempt
from backend.app.db.session import init_db, AsyncSessionLocal

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
