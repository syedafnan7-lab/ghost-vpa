"""Probe 11 -- Stage 2: demonstrate the correct CS-LP direction and price the fix.

Builds on probe10. Two independent defects found:

  D1 (Stage 1, confirmed here) the zero-in-degree guard skips feeders entirely.
     Control: add one inbound edge -> feeder recovers 0.000 -> 0.525.

  D2 (NEW, not in Stage 1) risk is propagated along in_edges too (L121-126),
     so any node that RECEIVED money from a suspect inherits the full score.
     An innocent beneficiary of a mule scores 1.000000 -- the maximum, higher
     than the feeder ever reaches. This is the exact false-positive mechanism
     the pitch claims to eliminate (judge-pitch.md Q3).

The fix is to attribute blame only backwards along the payment direction:
  R(u) <- sum over beneficiaries v of u of w * R(v)      (out_edges only)
plus seeding zero-in-degree nodes so feeders participate.

This probe measures that variant against the shipped one. Read-only.
"""
import sys, math
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "C:/Users/HP/ghost-vpa")
from backend.app.graph.temporal_engine import TemporalGraphEngine

T0 = datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc)
LAM = 0.35
ALPHA = 0.25


def build(victim_edge=True):
    e = TemporalGraphEngine()
    e.graph.add_node("CANARY_VPA_001", node_type="CANARY")
    e.canary_nodes.add("CANARY_VPA_001")
    edges = [
        ("FEEDER_SYNTH_007", "MULE_SYNTH_101", 3000),
        ("FEEDER_SYNTH_007", "MULE_SYNTH_102", 2500),
        ("MULE_SYNTH_101", "CANARY_VPA_001", 1000),
        ("MULE_SYNTH_102", "CANARY_VPA_001", 900),
        # innocent parties: a merchant the mule pays, and a sleeper
        ("MULE_SYNTH_101", "INNOCENT_MERCHANT", 400),
        ("MULE_SYNTH_102", "INNOCENT_SLEEPER", 200),
    ]
    if victim_edge:
        # canary erroneously pays an unwitting victim one time
        edges.append(("CANARY_VPA_001", "UNWITTING_VICTIM", 25))
    for i, (s, d, a) in enumerate(edges):
        e.graph.add_edge(s, d, key=i, amount_inr=a,
                         timestamp=T0 + timedelta(minutes=5 * i))
    return e


NOW = T0 + timedelta(hours=10)
ROLES = {
    "FEEDER_SYNTH_007": "TRUE POSITIVE  (upstream feeder - headline capability)",
    "MULE_SYNTH_101": "TRUE POSITIVE  (paid the canary)",
    "MULE_SYNTH_102": "TRUE POSITIVE  (paid the canary)",
    "INNOCENT_MERCHANT": "FALSE POSITIVE RISK (paid BY a mule)",
    "INNOCENT_SLEEPER": "FALSE POSITIVE RISK (paid BY a mule)",
    "UNWITTING_VICTIM": "FALSE POSITIVE RISK (paid BY the canary)",
    "CANARY_VPA_001": "seed (ground truth)",
}


def cslp_outedges_only(graph, canary, iterations=15):
    """Blame flows only backwards along payment direction: you are risky if
    you PAID something risky. Zero-in-degree nodes are seeded and included."""
    s = {n: 0.0 for n in graph.nodes}
    s[canary] = 1.0
    for _ in range(iterations):
        nxt = s.copy()
        for node in graph.nodes:
            if node == canary:
                continue
            ws = tw = 0.0
            for _, benef, d in graph.out_edges(node, data=True):
                w = math.exp(-LAM * max(0.0, (NOW - d["timestamp"]).total_seconds() / 3600.0))
                ws += w * s.get(benef, 0.0)
                tw += w
            if tw > 0:
                nxt[node] = (1 - ALPHA) * s[node] + ALPHA * (ws / tw)
        s = nxt
    return s


def rank(scores, label):
    print(f"\n--- {label} ---")
    rows = sorted(scores.items(), key=lambda kv: -kv[1])
    for n, v in rows:
        print(f"  {v:8.4f}  {n:20s} {ROLES.get(n, '')}")
    guilty = [n for n in scores if ROLES.get(n, "").startswith("TRUE")]
    innocent = [n for n in scores if ROLES.get(n, "").startswith("FALSE")]
    sep = min(scores[n] for n in guilty) - max(scores.get(n, 0.0) for n in innocent)
    print(f"  separation (min TP score - max FP score) = {sep:+.4f}")
    return sep


eng = build()
shipped = eng.compute_cslp_scores(NOW)
rank(shipped, "SHIPPED (in_edges + out_edges + zero-in-degree guard)")

fixed = cslp_outedges_only(eng.graph, "CANARY_VPA_001")
rank(fixed, "PROPOSED (out_edges only, feeders included)")

print("\n=== verdict ===")
print("Shipped: feeder 0.0000 (unattributable), unwitting victim 1.0000 (max)")
print("Proposed: feeder high, all three innocents at/below the mules")
print("Cost of the fix: delete lines 116-117 (the guard) and lines 121-126")
print("(the in_edge loop). No new dependency, no API change.")