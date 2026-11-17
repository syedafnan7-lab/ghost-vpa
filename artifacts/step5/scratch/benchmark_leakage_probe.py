"""STAGE 1 PROBE 8 — benchmark label-leakage quantification (re-derived).

Re-establishes, after the scratch dir was deleted:
  1. Single-feature label separation (does any feature alone predict the label?)
  2. Ablation: does the 'graph lift' survive without cs_lp?
  3. Row-order vs chronological split — is a temporal split even possible?
  4. Honeypot oracle performance (precision/recall of the tripwire itself)
"""
import sys
sys.path.insert(0, "C:/Users/HP/ghost-vpa")
import pandas as pd, numpy as np
from backend.app.ml.dataset_generator import generate_synthetic_100k_network

events, nodes = generate_synthetic_100k_network(seed=42)
print(f"=== DATASET: {len(events)} events, columns={list(events.columns)}")
print(f"  has a timestamp column: {'timestamp' in events.columns}")
print(f"  has an event_time / sim_time column: "
      f"{[c for c in events.columns if 'time' in c.lower()]}")
print(f"  label rate: {events['is_mule_label'].mean():.4f}")
print()

y = events["is_mule_label"].values
print("=== 1. SINGLE-FEATURE LABEL SEPARATION (AUC of each feature alone) ===")
from sklearn.metrics import roc_auc_score
for c in events.columns:
    if c.startswith("is_") or c in ("event_id",):
        continue
    try:
        auc = roc_auc_score(y, pd.to_numeric(events[c], errors="coerce").fillna(-1))
        flag = "  <== ORACLE" if abs(auc - 0.5) > 0.45 else ""
        print(f"  {c:26s} solo AUC = {auc:.4f}{flag}")
    except Exception:
        pass
print()

print("=== 2. ABLATION: motif features WITHOUT cs_lp ===")
import lightgbm as lgb
from sklearn.model_selection import train_test_split

TAB = [c for c in events.columns
       if c in ("amount", "sender_payment_count", "sender_avg_amount",
                "sender_total_amount", "vpa_age_days")]
tab_feats = [c for c in events.columns if c not in
             ("event_id", "is_mule_label", "is_canary_hit")][:6] if False else None

# use benchmark's own definitions
import inspect, backend.app.ml.benchmark as bm
src = inspect.getsource(bm)
print("  benchmark TABULAR_FEATURES / GRAPH_FEATURES:")
import re
for name in ("TABULAR_FEATURES", "GRAPH_FEATURES"):
    m = re.search(name + r"\s*=\s*(\[[^\]]*\])", src, re.S)
    if m:
        print(f"    {name} = {m.group(1).replace(chr(10), ' ')}")