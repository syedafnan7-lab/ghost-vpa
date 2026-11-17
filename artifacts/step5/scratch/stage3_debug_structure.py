"""STAGE 3 — instrument the exact graph structure that produced the numbers.

The device-token side-edges added by TemporalGraphEngine.add_transaction_edge
change the effective out-degree of every node, which changes the mean-based
propagation. This prints the true edge multiset so the numbers can be explained.
"""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from backend.app.graph.temporal_engine import TemporalGraphEngine  # noqa: E402
from backend.app.schemas.events import PaymentAttemptEvent  # noqa: E402

T0 = datetime(2026, 11, 16, 12, 0, 0, tzinfo=timezone.utc)
CANARY = "CANARY_VPA_001"
FEEDER = "FEEDER_SYNTH_007"
MULE_A, MULE_B = "MULE_SYNTH_101", "MULE_SYNTH_102"
VICTIM, MERCHANT, SLEEPER = "UNWITTING_VICTIM_900", "INNOCENT_MERCHANT_901", "INNOCENT_SLEEPER_902"


def ev(eid, frm, to, canary=False, minutes=0, amount=50000.0, dev=None):
    return PaymentAttemptEvent(
        event_id=eid, timestamp=T0 + timedelta(minutes=minutes),
        sender_account_id=frm, sender_vpa=f"{frm.lower()}@bank", sender_bank="HDFX",
        beneficiary_account_id=None if canary else to,
        beneficiary_vpa=to if canary else f"{to.lower()}@bank", beneficiary_bank="ICIX",
        amount_inr=amount, payment_rail="UPI",
        attempt_type="PENNY_DROP_PROBE" if canary else "P2P",
        device_token=dev or f"DEV_{frm}", ip_subnet="10.0.0.0/24",
        is_canary_hit=canary,
        simulated_result="TRIPWIRE_TRIGGERED" if canary else "SETTLED_NORMAL",
        zero_funds_transferred=True,
    )


g = TemporalGraphEngine()
g.add_transaction_edge(ev("e1", FEEDER, MULE_A, minutes=0))
g.add_transaction_edge(ev("e2", FEEDER, MULE_B, minutes=2))
g.add_transaction_edge(ev("e3", MULE_A, CANARY, canary=True, minutes=10, amount=1.0))
g.add_transaction_edge(ev("e4", MULE_B, CANARY, canary=True, minutes=12, amount=1.0))
g.add_transaction_edge(ev("e5", CANARY, VICTIM, minutes=20))
g.add_transaction_edge(ev("e6", MULE_A, MERCHANT, minutes=22))
g.add_transaction_edge(ev("e7", MULE_B, SLEEPER, minutes=24))

print(f"nodes={g.graph.number_of_nodes()}  edges={g.graph.number_of_edges()}")
print(f"canary_nodes={sorted(g.canary_nodes)}\n")
for n in sorted(g.graph.nodes):
    ins = [f"{u}--{k}" for u, v, k in g.graph.in_edges(n, keys=True)]
    outs = [f"{k}-->{v}" for u, v, k in g.graph.out_edges(n, keys=True)]
    print(f"{n}")
    print(f"    in  ({len(ins)}): {ins}")
    print(f"    out ({len(outs)}): {outs}")