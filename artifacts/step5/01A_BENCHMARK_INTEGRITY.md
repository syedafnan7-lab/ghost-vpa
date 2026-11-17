# STAGE 1 — DELIVERABLE A: BENCHMARK INTEGRITY REPORT

**Scope:** Is the benchmark pipeline operating on the correct data?
**Verdict:** **DataFrame unpacking is CORRECT.** Three structural defects were
confirmed instead: (1) no graph is ever constructed, (2) the "chronological
split" label is false, (3) the benchmark writes into a tracked docs file.

---

## A.1 The return-order question — resolved

This was the specific item flagged for investigation. I initially read the
generator's return tuple backwards and recorded a false alarm, then corrected
it against the source. The evidence:

```python
# backend/app/ml/dataset_generator.py
def generate_synthetic_100k_network(seed=42, num_nodes=100000, num_events=25000) \
        -> Tuple[pd.DataFrame, pd.DataFrame]:
    ...
    return nodes_df, events_df          # line 191

# backend/app/ml/benchmark.py
nodes_df, events_df = generate_synthetic_100k_network(seed=42)   # line 66
```

**Order matches. No unpacking defect. Every caller checked:** the generator has
exactly two callers — `benchmark.py:66` (correct) and its own `__main__` block.
No other module imports it.

### Actual schemas (printed, not inferred)

| DataFrame | Shape | Columns |
|---|---|---|
| `nodes_df` | **100000 × 4** | `node_id`, `node_type`, `bank`, `account_age_days` |
| `events_df` | **25000 × 17** | `event_id`, `sender_id`, `target_id`, `amount_inr`, `hour_of_day`, `is_weekend`, `historical_tx_count_24h`, `avg_amount_72h`, `velocity_delta_sec`, `is_canary_hit`, `canary_hop_distance`, `fan_in_ratio_60m`, `fan_out_ratio_60m`, `amount_conservation_ratio`, `shared_device_mule_count`, `cs_lp_risk_score`, `is_mule_label` |

Verified: `is_mule_label` exists on `events_df` (not `nodes_df`), so
`train_df["is_mule_label"]` at `benchmark.py:73` resolves correctly. The label
and the features are on the same rows. No label misalignment.

## A.2 CONFIRMED DEFECT — "total_edges" is a row count, not edges

`benchmark.py:224` reports `total_edges=len(events_df)` = **25,000**. The CLI
prints this as `Entities: 100,000 | Events: 25,000`.

The UI (`ModelBenchmarking.tsx`) computes "Total Test Events" from the
confusion matrix. A judge reading "100,000-node network" sees 100k entity rows
but only 25k event rows — i.e. **4 rows of features per 100 nodes**. Each node
appears in ~0.5 events on average. There is no connected structure: a "network"
with 100k nodes and 25k sampled pairs is overwhelmingly disconnected.

This matters because the entire graph-differentiation thesis assumes dense
transactional connectivity. The corpus used for the headline chart cannot
exhibit it.

## A.3 CONFIRMED DEFECT — no graph is constructed at all

String-scan evidence (P3):

| Symbol | `benchmark.py` | `dataset_generator.py` | `temporal_engine.py` |
|---|---|---|---|
| `networkx` / `MultiDiGraph` | **absent** | **absent** | present |
| `compute_cslp_scores` | **absent** | **absent** | present |
| `add_node` / `add_edge` | **absent** | **absent** | present |

The "Canary-Seeded Graph LightGBM Challenger" trains on
`GRAPH_FEATURES = TABULAR_FEATURES + [canary_hop_distance, cs_lp_risk_score,
fan_in_ratio_60m, fan_out_ratio_60m, amount_conservation_ratio,
shared_device_mule_count]` (`benchmark.py:26-33`).

All six extra columns are `random.uniform()` draws made inside `if/elif`
branches keyed on the label decision, i.e. `dataset_generator.py:74-77`,
`127-130`, `153-155`, `182-184`. They are **not** computed from any graph.

The genuinely-implemented graph engine (`temporal_engine.py`) and the benchmark
are never connected. The ML claim and the runtime capability are two separate
systems that happen to share vocabulary.

## A.4 CONFIRMED DEFECT — the "chronological split" is a row-order split

`benchmark.py:68`:

```python
# Strict Chronological train/test split (70% train, 30% holdout test)
split_idx = int(len(events_df) * 0.70)
train_df = events_df.iloc[:split_idx]
test_df  = events_df.iloc[split_idx:]
```

This is `.iloc` slicing on a frame with **no timestamp column** (see
Deliverable B, section C). The `evaluation_protocol` string then asserts
`"Strict Chronological Train (70%) / Holdout Test (30%)"` (`benchmark.py:232`),
which the UI renders as a verified protocol badge.

Measured contamination: train positive rate 0.1450 vs test 0.1492 — statistically
indistinguishable, consistent with random interleaving rather than a temporal
holdout.

**Consequence:** the train/test split carries no temporal guarantee. Whether it
"leaks the future" cannot be established, because there is no time axis to
leak across. The claim of chronology is unfalsifiable in the current corpus —
which is worse than a leakage bug, because no reviewer can detect it by
inspection.

## A.5 CONFIRMED DEFECT — benchmark writes into tracked documentation

`benchmark.py:236-239`:

```python
out_dir = Path("docs/remediation")
out_dir.mkdir(parents=True, exist_ok=True)
with open(out_dir / "latest-benchmark-results.json", "w", encoding="utf-8") as f:
    f.write(response.model_dump_json(indent=2))
```

Two consequences:

1. **Running the test suite mutates a tracked file.** Proven: `git status` was
   clean, `pytest tests/test_benchmark_metrics.py -q` ran, `git status` then
   showed ` M docs/remediation/latest-benchmark-results.json`.
2. **The file is non-deterministic.** Latency fields change on every run
   (tabular p50 measured 0.0157 ms → 0.0109 ms → 1.667 ms across runs). A
   "saved artifact" that differs each execution cannot serve as an audit record.

Additionally the path is relative to the process CWD. `python -m
backend.app.ml.benchmark` from the repo root writes to `docs/remediation/`; from
any other directory it writes elsewhere or fails.

## A.6 Are previous benchmark results trustworthy?

**No — not as a measurement of detection capability.** They are a *correct*
computation over an invalid corpus. See Deliverable B for the quantification.