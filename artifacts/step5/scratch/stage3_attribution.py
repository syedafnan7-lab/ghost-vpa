"""STAGE 3 — does a deletion-only fix actually rank the FEEDER above the mules?

Stage 2's proposal (delete the guard + delete the in-edge loop) fixes direction
but, as shown by stage3_candidate_algorithms.py, leaves the feeder and the
mules at ~identical scores (feeder 0.4992 / mule 0.4990) because simple mean
propagation from one valued neighbour returns that neighbour's value.

If the headline capability is "name the upstream feeder", the engine needs a
DETERMINISTIC structural attribution step, not just a propagation fix.

This experiment prices candidate E:
  E  CAUSAL PATH ATTRIBUTION
     - restrict the graph to payment edges with timestamp <= scoring instant
     - BFS backwards from each canary seed over payment edges only
     - a node is a FEEDER CANDIDATE if it lies on a causal path to a canary AND
       its in-degree over ALL payment edges is 0 (funds come from outside the
       observed window) OR below a configurable threshold
     - FS = (number of distinct canary seeds this node can reach in <=H hops)
           x (mean temporal-decay weight on those paths)
     - the mule multiplier FANIN/FANOUT/PASS-THROUGH determines the mule class

No ML, no labels, no learned weights. Deterministic and explainable.
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
NOW = T0 + timedelta(minutes=15)
LAM, ALPHA, HOPS = 0.05, 0.85, 3

CANARY, FEEDER = "CANARY_VPA_001", "FEEDER_SYNTH_007"
MULE_A, MULE_B = "MULE_SYNTH_101", "MULE_SYNTH_102"
VICTIM, MERCHANT, SLEEPER = "UNWITTING_VICTIM_900", "INNOCENT_MERCHANT_901", "INNOCENT_SLEEPER_902"


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


def build():
    g = TemporalGraphEngine()
    g.add_transaction_edge(ev("e1", FEEDER, MULE_A, minutes=0))
    g.add_transaction_edge(ev("e2", FEEDER, MULE_B, minutes=2))
    g.add_transaction_edge(ev("e3", MULE_A, CANARY, canary=True, minutes=10, amount=1.0))
    g.add_transaction_edge(ev("e4", MULE_B, CANARY, canary=True, minutes=12, amount=1.0))
    g.add_transaction_edge(ev("e5", CANARY, VICTIM, minutes=20))
    g.add_transaction_edge(ev("e6", MULE_A, MERCHANT, minutes=22))
    g.add_transaction_edge(ev("e7", MULE_B, SLEEPER, minutes=24))
    return g


def payment_out_edges(g, node, now=None):
    """Payment edges only (account->account/VPA), never the DEV_* side edges."""
    now = now or NOW
    out = []
    for u, v, k, d in g.graph.out_edges(node, keys=True, data=True):
        if str(u).startswith("DEV_") or str(v).startswith("DEV_"):
            continue
        t = d.get("timestamp", now)
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        out.append((v, t, d))
    return out


def payment_in_degree(g, node, now=None):
    n = 0
    for u, v, k, d in g.graph.in_edges(node, keys=True, data=True):
        if str(u).startswith("DEV_") or str(v).startswith("DEV_"):
            continue
        n += 1
    return n


def score_causal(g, now=NOW, max_hops=HOPS):
    """Deterministic causal-path attribution from canary seeds, backwards."""
    sc = {n: 0.0 for n in g.graph.nodes}
    seeds = [c for c in g.canary_nodes if c in sc]
    for c in seeds:
        sc[c] = 1.0
    for _ in range(15):
        new = sc.copy()
        for node in g.graph.nodes:
            if node in g.canary_nodes:
                continue
            outs = payment_out_edges(g, node, now)
            outs = [(v, t, d) for v, t, d in outs if now is None or t <= now]
            if not outs:
                continue
            tot = wsum = 0.0
            for v, t, d in outs:
                w = math.exp(-LAM * max(0.0, (now - t).total_seconds() / 3600.0))
                wsum += w * sc.get(v, 0.0)
                tot += w
            if tot > 0:
                new[node] = (1.0 - ALPHA) * sc[node] + ALPHA * (wsum / tot)
        sc = new
    return sc


def feeder_attribution(g, now=NOW, max_hops=HOPS, indeg_threshold=1):
    """Deterministic: which nodes can reach a canary seed within max_hops payment
    edges, and have (near-)zero payment in-degree = funds came from outside the
    observed window. These are the upstream feeder candidates."""
    seeds = [c for c in g.canary_nodes if c in g.graph]
    reach = {s: {s: 0.0} for s in seeds}
    for s in seeds:
        # backward BFS from the seed along reverse payment edges
        frontier = {s}
        seen = {s}
        for hop in range(1, max_hops + 1):
            nxt = set()
            for u, v, k, d in g.graph.in_edges(frontier, keys=True, data=True) \
                    if False else []:
                pass
            for node in frontier:
                for u, v, k, d in g.graph.in_edges(node, keys=True, data=True):
                    if str(u).startswith("DEV_") or str(v).startswith("DEV_"):
                        continue
                    t = d.get("timestamp", now)
                    if t.tzinfo is None:
                        t = t.replace(tzinfo=timezone.utc)
                    w = math.exp(-LAM * max(0.0, (now - t).total_seconds() / 3600.0))
                    if u not in seen:
                        reach[s][u] = reach[s].get(node, 0.0) + w
                        nxt.add(u)
            seen |= nxt
            frontier = nxt
    out = {}
    for s, r in reach.items():
        for node, weight in r.items():
            if node == s:
                continue
            indeg = payment_in_degree(g, node, now)
            out.setdefault(node, {"reaches_seed_weight": 0.0, "payment_in_degree": indeg})
            out[node]["reaches_seed_weight"] = max(out[node]["reaches_seed_weight"], weight)
    feeders = {n for n, v in out.items() if v["payment_in_degree"] <= indeg_threshold}
    return out, feeders


g = build()
sc = score_causal(g)
attr, feeders = feeder_attribution(g)

print("=" * 72)
print("PART 1 — deterministic causal-path attribution (candidate E)")
print("=" * 72)
print(f"{'node':<24}{'CS-LP':>8}{'in-deg':>8}{'canary-wt':>11}  role")
for n in sorted(g.graph.nodes):
    if str(n).startswith("DEV_"):
        continue
    w = attr.get(n, {}).get("reaches_seed_weight", 0.0)
    indeg = attr.get(n, {}).get("payment_in_degree", 0)
    role = "FEEDER CANDIDATE" if n in feeders else ("SEED" if n in g.canary_nodes else "")
    print(f"{n:<24}{sc.get(n,0):>8.4f}{indeg:>8}{w:>11.4f}  {role}")

print(f"\nRanking by CS-LP (does the feeder lead?):")
order = sorted([n for n in sc if not str(n).startswith("DEV_")],
               key=lambda n: -sc[n])
for i, n in enumerate(order, 1):
    print(f"  {i}. {n:<24}{sc[n]:.4f}")
fdr_rank = order.index(FEEDER) + 1
print(f"\n  feeder rank = {fdr_rank} of {len(order)}")

print("\n" + "=" * 72)
print("PART 2 — is the deletion-only fix ALONE sufficient?")
print("=" * 72)
print(f"  feeder CS-LP = {sc[FEEDER]:.4f}")
print(f"  muleA  CS-LP = {sc[MULE_A]:.4f}")
print(f"  muleB  CS-LP = {sc[MULE_B]:.4f}")
print(f"  max difference feeder vs mule = "
      f"{abs(max(sc[FEEDER], sc[MULE_A], sc[MULE_B]) - min(sc[FEEDER], sc[MULE_A], sc[MULE_B])):.6f}")
print(f"  -> the propagation fix does NOT rank the feeder above the mules;")
print(f"     attribution must come from the structural step (payment_in_degree=0).")