"""Probe 10 -- Stage 2: exact mechanism of the CS-LP directional defect.

Stage 1 (01_REPOSITORY_REALITY_AUDIT.md S3.1) stated the guard at
temporal_engine.py:115-117 means "their outbound edges are never read".
This probe tests that specific claim, because the two possible mechanisms
imply different fixes:

  (H1) the feeder is never scored at all (guard skips the node entirely)
  (H2) the feeder is scored but only from its OUTBOUND edges

and tests whether that is the only defect, or whether the downstream
component of the update (lines 128-135) independently scores *victims*.

Read-only: builds its own graph, imports the engine, mutates nothing tracked.
"""
import sys, math
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "C:/Users/HP/ghost-vpa")
from backend.app.graph.temporal_engine import TemporalGraphEngine

T0 = datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc)
eng = TemporalGraphEngine()

# Topology mirroring Scenario B: one upstream feeder funds two mules,
# both mules probe the same canary. Plus one innocent downstream victim
# who receives a payment FROM a mule (the case the SOP must protect).
ENG = {
    "FEEDER_SYNTH_007": [("MULE_SYNTH_101", 3000), ("MULE_SYNTH_102", 2500)],
    "MULE_SYNTH_101": [("CANARY_VPA_001", 1000)],
    "MULE_SYNTH_102": [("CANARY_VPA_001", 900)],
    "CANARY_VPA_001": [("VICTIM_SYNTH_900", 50)],  # innocent recipient, downstream
}
eng.graph.add_node("CANARY_VPA_001", node_type="CANARY")
eng.canary_nodes.add("CANARY_VPA_001")
for i, (src, outs) in enumerate(ENG.items()):
    for dst, amt in outs:
        eng.graph.add_edge(
            src, dst, key=i,
            amount_inr=amt, timestamp=T0 + timedelta(minutes=5 * i))

print("=== topology (in-degree / out-degree) ===")
for n in eng.graph.nodes:
    print(f"  {n:22s} in={eng.graph.in_degree(n)} out={eng.graph.out_degree(n)}")

now = T0 + timedelta(hours=10)
base = eng.compute_cslp_scores(now)
print("\n=== CS-LP scores as shipped ===")
for n in ["FEEDER_SYNTH_007", "MULE_SYNTH_101", "MULE_SYNTH_102",
          "CANARY_VPA_001", "VICTIM_SYNTH_900"]:
    print(f"  {n:22s} {base.get(n, 0.0):.6f}")

# --- Test H1: is the feeder skipped because of in-degree 0? --------------
# Re-score with the guard bypassed by hand, using the SAME arithmetic as the
# shipped loop but without the `continue`, to see what the guard costs.
print("\n=== H1 test: score the feeder with the shipped formula, no guard ===")
scores = {n: 0.0 for n in eng.graph.nodes}
scores["CANARY_VPA_001"] = 1.0
alpha, lam = eng.restart_alpha, eng.decay_lambda
for _ in range(15):
    new = scores.copy()
    for node in eng.graph.nodes:
        if node in eng.canary_nodes:
            continue
        ws = tw = 0.0
        for rem, _, d in eng.graph.in_edges(node, data=True):
            w = math.exp(-lam * max(0.0, (now - d["timestamp"]).total_seconds() / 3600.0))
            ws += w * scores.get(rem, 0.0); tw += w
        for _, ben, d in eng.graph.out_edges(node, data=True):
            w = math.exp(-lam * max(0.0, (now - d["timestamp"]).total_seconds() / 3600.0))
            ws += w * scores.get(ben, 0.0); tw += w
        if tw > 0:
            new[node] = (1 - alpha) * scores[node] + alpha * (ws / tw)
    scores = new
for n in ["FEEDER_SYNTH_007", "MULE_SYNTH_101", "VICTIM_SYNTH_900"]:
    print(f"  {n:22s} {scores.get(n, 0.0):.6f}")

# --- Test: pure upstream (reverse-edge) propagation -----------------------
print("\n=== upstream-only propagation (reverse edges only) ===")
us = {n: 0.0 for n in eng.graph.nodes}
us["CANARY_VPA_001"] = 1.0
for _ in range(15):
    nx_ = us.copy()
    for node in eng.graph.nodes:
        if node in eng.canary_nodes:
            continue
        ws = tw = 0.0
        for rem, _, d in eng.graph.in_edges(node, data=True):
            w = math.exp(-lam * max(0.0, (now - d["timestamp"]).total_seconds() / 3600.0))
            ws += w * us.get(rem, 0.0); tw += w
        if tw > 0:
            nx_[node] = (1 - alpha) * us[node] + alpha * (ws / tw)
    us = nx_
for n in ["FEEDER_SYNTH_007", "MULE_SYNTH_101", "MULE_SYNTH_102", "VICTIM_SYNTH_900"]:
    print(f"  {n:22s} {us.get(n, 0.0):.6f}")

# --- Control: add ONE inbound edge to the feeder, rerun shipped code ------
print("\n=== control: give the feeder a single inbound edge, rerun SHIPPED code ===")
eng2 = TemporalGraphEngine()
eng2.graph.add_node("CANARY_VPA_001", node_type="CANARY")
eng2.canary_nodes.add("CANARY_VPA_001")
for i, (src, outs) in enumerate(ENG.items()):
    for dst, amt in outs:
        eng2.graph.add_edge(src, dst, key=i, amount_inr=amt,
                            timestamp=T0 + timedelta(minutes=5 * i))
# an outside-window funding source for the feeder (in-degree 1)
eng2.graph.add_edge("EXTERNAL_SOURCE", "FEEDER_SYNTH_007", key=99,
                    amount_inr=5000, timestamp=T0 - timedelta(hours=2))
ctrl = eng2.compute_cslp_scores(now)
for n in ["FEEDER_SYNTH_007", "EXTERNAL_SOURCE", "MULE_SYNTH_101",
          "VICTIM_SYNTH_900"]:
    print(f"  {n:22s} {ctrl.get(n, 0.0):.6f}")

print("\n=== interpretation ===")
print("* If 'no guard' recovers the feeder, H1 holds: the guard is the cause")
print("  and the fix is to seed zero-in-degree nodes instead of skipping them.")
print("* If VICTIM_SYNTH_900 scores above FEEDER, the downstream term (L128-135)")
print("  is a second, independent defect: it scores innocent recipients.")