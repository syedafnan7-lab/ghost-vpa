"""STAGE 3 — specify and test candidate upstream-blame algorithms.

Defects this experiment is designed to price:
  D1  zero-in-degree guard excludes feeders from scoring entirely
  D2  propagation along in_edges flows blame DOWNSTREAM to innocent beneficiaries
  D3  device-token side-edges (account -> DEV_x) are non-payment edges but are
      counted in both the numerator search and the denominator, diluting blame
      by a factor of 1/(real_out_degree + device_edges)

Candidate algorithms, all seeded only from the canary:
  A  SHIPPED          in+out, guard
  B  DELETE_ONLY      out only, guard removed  (device edges still included)
  C  PAYMENT_OUT      out only over PAYMENT edges only, guard removed
  D  PAYMENT_OUT_TIME C + require the payment to precede the seed in time
                      (no blame for money that arrived after the tripwire)

All candidates are run on the same base graph plus an adversarial variant that
adds a cycle and a post-tripwire payment, to check cycles and temporal ordering.
"""
import math
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from backend.app.graph.temporal_engine import TemporalGraphEngine  # noqa: E402
from backend.app.schemas.events import PaymentAttemptEvent  # noqa: E402

T0 = datetime(2026, 11, 16, 12, 0, 0, tzinfo=timezone.utc)
ALPHA = 0.85
LAM = 0.05
ITERS = 15

CANARY, FEEDER = "CANARY_VPA_001", "FEEDER_SYNTH_007"
MULE_A, MULE_B = "MULE_SYNTH_101", "MULE_SYNTH_102"
VICTIM, MERCHANT, SLEEPER = "UNWITTING_VICTIM_900", "INNOCENT_MERCHANT_901", "INNOCENT_SLEEPER_902"
CYCLE_X, CYCLE_Y = "MULE_SYNTH_103", "MULE_SYNTH_104"
LATE = "LATE_BENEF_903"

TP = {CANARY, FEEDER, MULE_A, MULE_B, CYCLE_X, CYCLE_Y}
INNOCENT = {VICTIM, MERCHANT, SLEEPER, LATE}


def ev(eid, frm, to, canary=False, minutes=0, amount=50000.0):
    return PaymentAttemptEvent(
        event_id=eid, timestamp=T0 + timedelta(minutes=minutes),
        sender_account_id=frm, sender_vpa=f"{frm.lower()}@bank", sender_bank="HDFX",
        beneficiary_account_id=None if canary else to,
        beneficiary_vpa=to if canary else f"{to.lower()}@bank", beneficiary_bank="ICIX",
        amount_inr=amount, payment_rail="UPI",
        attempt_type="PENNY_DROP_PROBE" if canary else "P2P",
        device_token=f"DEV_{frm}", ip_subnet="10.0.0.0/24",
        is_canary_hit=canary,
        simulated_result="TRIPWIRE_TRIGGERED" if canary else "SETTLED_NORMAL",
        zero_funds_transferred=True)


def build(with_cycle=False, with_late=False):
    g = TemporalGraphEngine()
    g.add_transaction_edge(ev("e1", FEEDER, MULE_A, minutes=0))
    g.add_transaction_edge(ev("e2", FEEDER, MULE_B, minutes=2))
    g.add_transaction_edge(ev("e3", MULE_A, CANARY, canary=True, minutes=10, amount=1.0))
    g.add_transaction_edge(ev("e4", MULE_B, CANARY, canary=True, minutes=12, amount=1.0))
    g.add_transaction_edge(ev("e5", CANARY, VICTIM, minutes=20))
    g.add_transaction_edge(ev("e6", MULE_A, MERCHANT, minutes=22))
    g.add_transaction_edge(ev("e7", MULE_B, SLEEPER, minutes=24))
    if with_cycle:
        # a laundering cycle: two mules paying each other, one of which feeds the canary
        g.add_transaction_edge(ev("c1", FEEDER, CYCLE_X, minutes=4))
        g.add_transaction_edge(ev("c2", CYCLE_X, CYCLE_Y, minutes=6))
        g.add_transaction_edge(ev("c3", CYCLE_Y, CYCLE_X, minutes=7))   # cycle
        g.add_transaction_edge(ev("c4", CYCLE_Y, CANARY, canary=True, minutes=14, amount=1.0))
    if with_late:
        # an innocent beneficiary paid AFTER the tripwire detonated - must not be blamed
        g.add_transaction_edge(ev("l1", FEEDER, LATE, minutes=40))
    return g


def is_payment(g, u, v, k):
    """A payment edge connects two account/VPA nodes.
    Device side-edges connect an account node to a DEV_* node in either direction.
    The engine stores no discriminator on the edge, so we infer from the endpoints."""
    return not str(u).startswith("DEV_") and not str(v).startswith("DEV_")


def run(g, mode, now=T0):
    seeds = {CANARY}
    sc = {n: 0.0 for n in g.graph.nodes}
    for s in seeds:
        if s in sc:
            sc[s] = 1.0
    for _ in range(ITERS):
        new = sc.copy()
        for node in g.graph.nodes:
            if node in seeds:
                continue
            outs = []
            for u, v, k, d in g.graph.out_edges(node, keys=True, data=True):
                if mode in ("B",) or (is_payment(g, u, v, k)):
                    if mode == "D":
                        t = d.get("timestamp", now)
                        if t.tzinfo is None:
                            t = t.replace(tzinfo=timezone.utc)
                        if t > now:
                            continue
                    outs.append((v, d))
            if not outs:
                continue
            tot, wsum = 0.0, 0.0
            for v, d in outs:
                t = d.get("timestamp", now)
                dh = max(0.0, (now - t).total_seconds() / 3600.0)
                w = math.exp(-LAM * dh)
                wsum += w * sc.get(v, 0.0)
                tot += w
            if tot > 0:
                new[node] = (1.0 - ALPHA) * sc[node] + ALPHA * (wsum / tot)
        sc = new
    return sc


def shipped(g, now=T0):
    return g.compute_cslp_scores(now)


def show(label, sc, tp, inn):
    tp_s = {n: sc.get(n, 0.0) for n in tp}
    in_s = {n: sc.get(n, 0.0) for n in inn}
    sep = min(tp_s.values()) - max(in_s.values())
    fdr = sc.get(FEEDER, 0.0)
    print(f"\n{label}")
    print(f"    feeder={fdr:.4f}  muleA={sc.get(MULE_A,0):.4f}  muleB={sc.get(MULE_B,0):.4f}"
          f"  canary={sc.get(CANARY,0):.4f}")
    print(f"    victim={sc.get(VICTIM,0):.4f}  merchant={sc.get(MERCHANT,0):.4f}"
          f"  sleeper={sc.get(SLEEPER,0):.4f}")
    if CYCLE_X in g_node_set:
        print(f"    cycleX={sc.get(CYCLE_X,0):.4f}  cycleY={sc.get(CYCLE_Y,0):.4f}")
    if LATE in g_node_set:
        print(f"    LATE(paid after tripwire)={sc.get(LATE,0):.4f}  <-- must be 0")
    print(f"    separation = {sep:+.4f}   feeder_attributable = {'YES' if fdr > 0 else 'NO'}")
    return sep


g_node_set = set(build().graph.nodes) | {CYCLE_X, CYCLE_Y, LATE}

print("=" * 72)
print("PART 1 — base graph (feeder, 2 mules, canary, 3 innocents)")
print("=" * 72)
NOW = T0 + timedelta(minutes=15)   # score immediately after the last tripwire (minute 14)
g1 = build()
g_node_set = set(g1.graph.nodes) | set(build(with_cycle=True).graph.nodes) | {LATE}
show("A  SHIPPED", shipped(g1, NOW), TP := {CANARY, FEEDER, MULE_A, MULE_B}, INNOCENT)
show("B  DELETE_ONLY (out only, device edges included)", run(g1, "B", NOW), TP, INNOCENT)
show("C  PAYMENT_OUT (payment edges only)", run(g1, "C", NOW), TP, INNOCENT)
show("D  PAYMENT_OUT + TEMPORAL", run(g1, "D", NOW), TP, INNOCENT)

print("\n" + "=" * 72)
print("PART 2 — adversarial: cycle + post-tripwire payment")
print("=" * 72)
g2 = build(with_cycle=True, with_late=True)
g_node_set = set(g2.graph.nodes)
tp2 = {CANARY, FEEDER, MULE_A, MULE_B, CYCLE_X, CYCLE_Y}
in2 = {VICTIM, MERCHANT, SLEEPER, LATE}
show("A  SHIPPED", shipped(g2, NOW), tp2, in2)
show("C  PAYMENT_OUT", run(g2, "C", NOW), tp2, in2)
show("D  PAYMENT_OUT + TEMPORAL", run(g2, "D", NOW), tp2, in2)

print("\n" + "=" * 72)
print("PART 3 — does the cycle diverge or self-limit?")
print("=" * 72)
sc = run(g2, "C", NOW)
print(f"    cycleX={sc.get(CYCLE_X, 0):.6f}  cycleY={sc.get(CYCLE_Y, 0):.6f}  (bounded in [0,1]: "
      f"{0 <= sc.get(CYCLE_X,0) <= 1 and 0 <= sc.get(CYCLE_Y,0) <= 1})")
print(f"    max score across all nodes = {max(sc.values()):.6f}")