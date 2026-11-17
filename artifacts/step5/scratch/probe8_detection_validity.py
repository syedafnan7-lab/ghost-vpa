"""STAGE 1 PROBE 8 — Detection Validity (Deliverable B, parts A-D).

Methodological note: this probe re-derives the headline metrics from the real
generator. It does not modify anything.

A. Single-feature label separation
B. Graph ablation (motif features WITHOUT cs_lp)
C. Chronological split feasibility
D. Honeypot oracle performance
"""
import sys, json
sys.path.insert(0, "C:/Users/HP/ghost-vpa")
import numpy as np
import pandas as pd
from sklearn.metrics import (precision_score, recall_score, f1_score,
                             precision_recall_curve, roc_auc_score, auc,
                             confusion_matrix)
import lightgbm as lgb
from backend.app.ml.dataset_generator import generate_synthetic_100k_network

nodes_df, events_df = generate_synthetic_100k_network(seed=42)
print("### BENCHMARK DATAFRAME INTEGRITY ###")
print(f"  nodes_df:     shape={nodes_df.shape} cols={list(nodes_df.columns)}")
print(f"  events_df:    shape={events_df.shape} cols={list(events_df.columns)}")
print("  benchmark.py:66  nodes_df, events_df = generate(...)")
print("  dataset_generator.py:191  return nodes_df, events_df")
print("  => UNPACKING IS CORRECT. (An earlier probe read the order backwards;")
print("     corrected here. No bug.)")
print(f"  total_nodes reported  = len(nodes_df) = {len(nodes_df)}")
print(f"  total_edges  reported = len(events_df) = {len(events_df)}")
print("  => NOTE: 'total_edges' is 25,000 EVENTS ROWS, not graph edges. The")
print("     100k figure is entity rows, while 25k is a *sample* of events drawn")
print("     from those entities. Docs say '100,000-node network' — the actual")
print("     benchmark graph has only 25,000 event rows over 100k nodes.")
print()

LABEL = "is_mule_label"
y = events_df[LABEL].values
split_idx = int(len(events_df) * 0.70)
train_df, test_df = events_df.iloc[:split_idx], events_df.iloc[split_idx:]
y_train, y_test = train_df[LABEL].values, test_df[LABEL].values

print("### A. SINGLE-FEATURE LABEL SEPARATION (solo ROC-AUC on full set) ###")
print(f"  label rate overall: {y.mean():.4f}  (n={len(y)})")
feats = [c for c in events_df.columns
         if c not in ("event_id", "sender_id", "target_id", LABEL)]
solo = {}
for c in feats:
    s = pd.to_numeric(events_df[c], errors="coerce").fillna(-1)
    a = roc_auc_score(y, s)
    a = max(a, 1 - a) if a < 0.5 else a
    solo[c] = a
for c, a in sorted(solo.items(), key=lambda kv: -kv[1]):
    verdict = "ORACLE-GRADE LEAKAGE" if a >= 0.95 else ("strong" if a >= 0.80 else "ok")
    print(f"  {c:28s} solo AUC = {a:.4f}   {verdict}")
print()

print("### B. GRAPH ABLATION ###")
TAB = ["amount_inr", "hour_of_day", "is_weekend",
       "historical_tx_count_24h", "avg_amount_72h", "velocity_delta_sec"]
GRAPH = TAB + ["canary_hop_distance", "cs_lp_risk_score", "fan_in_ratio_60m",
               "fan_out_ratio_60m", "amount_conservation_ratio",
               "shared_device_mule_count"]
MOTIF = [c for c in GRAPH if c != "cs_lp_risk_score"]


def run(cols, name):
    clf = lgb.LGBMClassifier(n_estimators=60, learning_rate=0.08,
                             random_state=42, verbose=-1)
    clf.fit(train_df[cols], y_train)
    pr = clf.predict_proba(test_df[cols])[:, 1]
    pred = (pr >= 0.5).astype(int)
    p = precision_score(y_test, pred, zero_division=0)
    r = recall_score(y_test, pred, zero_division=0)
    f1 = f1_score(y_test, pred, zero_division=0)
    ra = roc_auc_score(y_test, pr)
    pc, rc, _ = precision_recall_curve(y_test, pr)
    pa = auc(rc, pc)
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    print(f"  {name:32s} P={p:.3f} R={r:.3f} F1={f1:.3f} "
          f"ROC={ra:.3f} PR={pa:.3f} FP={fp} FN={fn}")
    return p, r, f1, ra, pa, fp, fn


print("  model                        precision  recall   F1     ROC    PR     FP    FN")
b_tab = run(TAB, "1. Tabular (6 tx features)")
b_grf = run(GRAPH, "2. Full Graph (12 features)")
b_mot = run(MOTIF, "3. Graph - cs_lp (11 features)")
b_hop = run([c for c in MOTIF if c != "canary_hop_distance"],
            "4. Graph - cs_lp - hop_dist")
print()
print(f"  Lift from adding cs_lp+motifs over tabular: "
      f"{(b_grf[0]-b_tab[0])*100:+.1f} pp precision")
print(f"  Motif-only (NO cs_lp) precision: {b_mot[0]:.3f}  "
      f"=> removes only {(b_grf[0]-b_mot[0])*100:.1f} pp of the lift")
print(f"  Motif-only, also dropping hop_dist: P={b_hop[0]:.3f} PR={b_hop[4]:.3f}")
print("  => CONCLUSION: performance is carried by the label-conditional MOTIF")
print("     bands (fan_in/out, conservation), not by any graph algorithm.")
print("     No NetworkX graph is constructed; the 'graph' features are")
print("     generator-side random draws, not computed graph statistics.")
print()

print("### C. CHRONOLOGICAL SPLIT FEASIBILITY ###")
print(f"  columns containing time info: "
      f"{[c for c in events_df.columns if 'time' in c.lower() or 'hour' in c.lower() or 'day' in c.lower()]}")
print("  hour_of_day exists but it is a *time-of-day* value, not a date.")
print("  => There is NO event timestamp. Rows are emitted in Python loop order")
print("     for i in range(num_events), with the class chosen by random.random()")
print("     per row (dataset_generator.py:33). Row order therefore carries NO")
print("     chronological signal; label composition is randomly interleaved.")
print("  benchmark.py:68 labels this 'Strict Chronological Train (70%)/Holdout Test (30%)'")
print("  => The label is FALSE. It is a row-order split on a randomly-ordered frame.")
print(f"  Check: class rate train={y_train.mean():.4f} test={y_test.mean():.4f}")
print("     (near-identical => random interleaving, i.e. an implicit RANDOM split)")
print("  => RECOMMENDATION: add a monotonic event_ts (simulated UTC) at")
print("     generation time and split on it, so the claim becomes true.")
print()

print("### D. HONEYPOT ORACLE PERFORMANCE ###")
trip = events_df["is_canary_hit"].values
tp = int(((trip == 1) & (y == 1)).sum())
fp = int(((trip == 1) & (y == 0)).sum())
fn = int(((trip == 0) & (y == 1)).sum())
tn = int(((trip == 0) & (y == 0)).sum())
prec = tp / (tp + fp) if tp + fp else float("nan")
rec = tp / (tp + fn) if tp + fn else float("nan")
print(f"  TP={tp} FP={fp} FN={fn} TN={tn}")
print(f"  Precision={prec:.4f}  Recall={rec:.4f}")
print()
print("  LABEL DEFINITION WARNING: 'is_canary_hit' is generated as a property of")
print("  the SYNTHETIC generator, not an independent ground truth. The generator")
print("  sets is_canary_hit=1 only inside the mule branch (dataset_generator.py:44-46),")
print("  so a perfect 1.00 precision here is TAUTOLOGICAL: canary hits can only")
print("  occur where the generator already decided the row is a mule.")
print()
print("  Consequence: the honeypot tripwire's real-world precision is UNMEASURED.")
print("  The synthetic corpus cannot test: unwitting victims who probe a canary,")
print("  fraud-harvested VPA reuse, or canary discovery by the syndicate.")
print(f"  Recall ceiling={rec:.3f}: {fn} of {tp+fn} mules never touch a canary.")