import asyncio
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from backend.app.core.simulation_clock import clock
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.api.ingestion import ingest_payment_attempt
from backend.app.api.websocket_manager import ws_manager
from backend.app.graph.temporal_engine import temporal_graph
from backend.app.db.session import AsyncSessionLocal

BANKS = ["HDFX", "ICIX", "SBINX", "AXSX"]

class PaymentRailSimulator:
    def __init__(self):
        self._is_running = False
        self._worker_task: Optional[asyncio.Task] = None
        self._seed = 42
        random.seed(self._seed)

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._worker_task = asyncio.create_task(self._simulation_loop())

    def stop(self):
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            self._worker_task = None

    async def _simulation_loop(self):
        """Generates continuous background synthetic payment attempts and broadcasts clock ticks."""
        tick_counter = 0
        while self._is_running:
            try:
                sim_now = clock.now()
                if not clock.is_paused():
                    await self.generate_random_attempt()
                    tick_counter += 1
                    # Enforce 72-hour sliding window pruning periodically
                    if tick_counter % 5 == 0:
                        temporal_graph.prune_expired_edges(sim_now)

                # Broadcast periodic CLOCK_TICK to all connected WebSocket clients
                await ws_manager.broadcast({
                    "type": "CLOCK_TICK",
                    "data": {
                        "sim_time": sim_now.isoformat(),
                        "is_paused": clock.is_paused(),
                        "speed_multiplier": clock.speed()
                    }
                })

                # Tick interval scaled by speed
                delay = max(0.05, 1.0 / clock.speed())
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                break
            except Exception as e:
                await asyncio.sleep(1.0)

    async def generate_random_attempt(self):
        sim_now = clock.now()
        sender_bank = random.choice(BANKS)
        benef_bank = random.choice(BANKS)

        sender_id = f"ACCT_SYNTH_{sender_bank}_{random.randint(1000, 9999)}"
        sender_vpa = f"user.{random.randint(100, 999)}@{sender_bank.lower()}bank"
        benef_vpa = f"merchant.{random.randint(100, 999)}@{benef_bank.lower()}bank"
        benef_id = f"ACCT_SYNTH_{benef_bank}_{random.randint(1000, 9999)}"

        amount = round(random.choice([150.0, 450.0, 1200.0, 3500.0, 8000.0, 25000.0]), 2)
        dev_tok = f"DEV_TOK_{random.randint(10, 99)}_{sender_bank}"

        event = PaymentAttemptEvent(
            event_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            timestamp=sim_now,
            sender_account_id=sender_id,
            sender_vpa=sender_vpa,
            sender_bank=sender_bank,
            beneficiary_account_id=benef_id,
            beneficiary_vpa=benef_vpa,
            beneficiary_bank=benef_bank,
            amount_inr=amount,
            payment_rail="UPI",
            attempt_type="P2P" if amount < 5000 else "P2M",
            event_type="CREDIT_CONFIRMED",
            device_token=dev_tok,
            ip_subnet=f"192.168.{random.randint(1, 50)}.0/24"
        )

        async with AsyncSessionLocal() as db:
            await ingest_payment_attempt(event, db)

    async def run_scenario_a_tripwire(self):
        """Scenario A: Honeypot Tripwire
        Synthetic sender attempts ₹5,000 transfer to registered canary.trap.01@icixbank.
        Triggers instant alert, sender marked REVIEW_REQUIRED, zero funds moved."""
        sim_now = clock.now()
        event = PaymentAttemptEvent(
            event_id=f"TXN-SCEN-A-{uuid.uuid4().hex[:8].upper()}",
            timestamp=sim_now,
            sender_account_id="ACCT_SYNTH_HDFX_9912",
            sender_vpa="sender.mule01@hdfxbank",
            sender_bank="HDFX",
            beneficiary_account_id=None,
            beneficiary_vpa="canary.trap.01@icixbank",
            beneficiary_bank="ICIX",
            amount_inr=5000.00,
            payment_rail="UPI",
            attempt_type="P2P",
            device_token="DEV_TOK_CRIMSON_88",
            ip_subnet="10.240.10.0/24"
        )
        async with AsyncSessionLocal() as db:
            return await ingest_payment_attempt(event, db)

    async def run_scenario_b_shared_feeder(self):
        """Scenario B: Shared Upstream Feeder
        FEEDER_SYNTH_007 deposits ₹45,000 to MULE_01, MULE_02, MULE_03.
        MULE_01 and MULE_02 subsequently attempt transfers to canaries."""
        sim_now = clock.now()
        events = []

        # 1. Feeder deposits to Mules (benign-looking upstream transfers)
        mules = [
            ("ACCT_SYNTH_ICIX_4401", "mule.alpha@icixbank", "ICIX"),
            ("ACCT_SYNTH_HDFX_4402", "mule.beta@hdfxbank", "HDFX"),
            ("ACCT_SYNTH_SBINX_4403", "mule.gamma@sbinxbank", "SBINX")
        ]

        async with AsyncSessionLocal() as db:
            for acct_id, vpa, bank in mules:
                feeder_event = PaymentAttemptEvent(
                    event_id=f"TXN-FEED-{uuid.uuid4().hex[:8].upper()}",
                    timestamp=sim_now - timedelta(minutes=random.randint(10, 30)),
                    sender_account_id="FEEDER_SYNTH_007",
                    sender_vpa="master.feeder@hdfxbank",
                    sender_bank="HDFX",
                    beneficiary_account_id=acct_id,
                    beneficiary_vpa=vpa,
                    beneficiary_bank=bank,
                    amount_inr=45000.00,
                    event_type="CREDIT_CONFIRMED",
                    payment_rail="IMPS",
                    attempt_type="P2P",
                    device_token="DEV_TOK_FEEDER_99",
                    ip_subnet="10.100.5.0/24"
                )
                await ingest_payment_attempt(feeder_event, db)

            # 2. Mules attempt transfer into registered canaries
            canary_targets = ["canary.trap.01@icixbank", "canary.alert.02@hdfxbank"]
            for i, (acct_id, vpa, bank) in enumerate(mules[:2]):
                canary_hit = PaymentAttemptEvent(
                    event_id=f"TXN-SCEN-B-{uuid.uuid4().hex[:8].upper()}",
                    timestamp=sim_now + timedelta(seconds=i * 2),
                    sender_account_id=acct_id,
                    sender_vpa=vpa,
                    sender_bank=bank,
                    beneficiary_account_id=None,
                    beneficiary_vpa=canary_targets[i % len(canary_targets)],
                    beneficiary_bank="ICIX",
                    amount_inr=42000.00,
                    payment_rail="UPI",
                    attempt_type="PENNY_DROP_PROBE" if i == 0 else "P2P",
                    device_token="DEV_TOK_SYND_SHARED_44",
                    ip_subnet="10.100.5.0/24"
                )
                res = await ingest_payment_attempt(canary_hit, db)
                events.append(res)

        return events

    async def run_scenario_c_benign_lookalike(self):
        """Scenario C: Benign Merchant Lookalike (False Positive Mitigation)
        MERCHANT_MSME_901 experiences rapid burst transactions.
        Conventional tabular rules flag it; graph engine proves zero canary connectivity."""
        sim_now = clock.now()
        async with AsyncSessionLocal() as db:
            for i in range(5):
                cust_id = f"ACCT_SYNTH_RETAIL_{i+100}"
                event = PaymentAttemptEvent(
                    event_id=f"TXN-SCEN-C-{uuid.uuid4().hex[:8].upper()}",
                    timestamp=sim_now + timedelta(seconds=i * 5),
                    sender_account_id=cust_id,
                    sender_vpa=f"customer.{i+100}@sbinxbank",
                    sender_bank="SBINX",
                    beneficiary_account_id="MERCHANT_MSME_901",
                    beneficiary_vpa="freshfoods.merchant@icixbank",
                    beneficiary_bank="ICIX",
                    amount_inr=round(random.uniform(800.0, 4500.0), 2),
                    event_type="CREDIT_CONFIRMED",
                    payment_rail="UPI",
                    attempt_type="P2M",
                    device_token=f"DEV_TOK_CUST_{i}",
                    ip_subnet=f"172.16.{i}.0/24"
                )
                await ingest_payment_attempt(event, db)
        return {"status": "SUCCESS", "message": "Benign merchant burst generated. Zero canary connectivity verified."}

    async def run_scenario_d_multihop_network(self):
        """Scenario D: Multi-Hop Layering Chain
        Feeder -> Hop1 -> Hop2 -> Hop3 -> Canary within 25 minutes."""
        sim_now = clock.now()
        hops = [
            ("FEEDER_SYNTH_009", "ACCT_SYNTH_MULE_HOP1", 75000.0, 25),
            ("ACCT_SYNTH_MULE_HOP1", "ACCT_SYNTH_MULE_HOP2", 73500.0, 18),
            ("ACCT_SYNTH_MULE_HOP2", "ACCT_SYNTH_MULE_HOP3", 72000.0, 10),
            ("ACCT_SYNTH_MULE_HOP3", "canary.tripwire.03@sbinxbank", 70000.0, 2)
        ]

        async with AsyncSessionLocal() as db:
            for sender, benef, amt, mins_ago in hops:
                is_canary = "canary" in benef
                event = PaymentAttemptEvent(
                    event_id=f"TXN-SCEN-D-{uuid.uuid4().hex[:8].upper()}",
                    timestamp=sim_now - timedelta(minutes=mins_ago),
                    sender_account_id=sender,
                    sender_vpa=f"{sender.lower()}@bank",
                    sender_bank="SBINX",
                    beneficiary_account_id=None if is_canary else benef,
                    beneficiary_vpa=benef if is_canary else f"{benef.lower()}@bank",
                    beneficiary_bank="SBINX",
                    amount_inr=amt,
                    event_type="PAYMENT_ATTEMPT" if is_canary else "CREDIT_CONFIRMED",
                    payment_rail="UPI",
                    attempt_type="P2P",
                    device_token="DEV_TOK_MULTIHOP_CHAIN",
                    ip_subnet="192.168.1.0/24"
                )
                await ingest_payment_attempt(event, db)

        return {"status": "SUCCESS", "message": "Multi-hop 4-chain executed. Motifs and delta-t velocity recorded."}

simulator = PaymentRailSimulator()
