# Phase 4: 100,000-Node Dataset & Machine Learning Benchmark Audit

**Target:** `backend/app/ml/dataset_generator.py` & `backend/app/ml/benchmark.py`  
**Audit Focus:** Dataset composition, empirical reproduction, label leakage, and metric validity  
**Timestamp:** 2026-11-14T23:06:00+05:30  

---

## 1. Dataset Generation & Composition Audit

Command executed:
```python
generate_synthetic_100k_network(seed=42, num_nodes=100000, num_events=25000)
```

### Empirical Node Count & Classification

| Entity Type | Claimed Count | Actual Generated Count | Match Status |
|---|---|---|---|
| **Retail Accounts** | 85,000 | 85,000 | **MATCH** |
| **Merchant / MSME Accounts** | 10,000 | 10,000 | **MATCH** |
| **Syndicate Mule Accounts** | 4,950 | 4,950 | **MATCH** |
| **Canary Honeypot Endpoints** | 50 | 50 | **MATCH** |
| **Total Monitored Nodes** | **100,000** | **100,000** | **MATCH** |

- **Total Generated Transactions:** 25,000
- **Mule Transactions (`is_mule_label=1`):** 3,695 (~14.8%)
- **Benign Transactions (`is_mule_label=0`):** 21,305 (~85.2%)
- **Canary Hit Transactions (`is_canary_hit=1`):** 1,131 (~4.5%)
- **Reproducibility:** 100% reproducible with fixed random seed (`seed=42`).

---

## 2. Benchmark Reproduction & Discrepancy Findings

### Comparison of Claimed vs. Actual Computed Metrics

| Metric | Claimed (Docs / Narrative) | Actual Computed (Test Split 7,500 events) | Independent Audit Finding |
|---|---|---|---|
| **Tabular Precision** | 68.4% | **14.3%** (`prec=0.143`) | **DISCREPANCY** |
| **Tabular Recall** | 72.6% | **100.0%** (`rec=1.000`) | **DISCREPANCY** |
| **Tabular FPR** | Reference | **100.0%** (`fpr=1.000`, 6,427 false positives) | **DISCREPANCY** |
| **Graph Precision** | 94.2% | **100.0%** (`prec=1.000`) | **DISCREPANCY** |
| **Graph Recall** | 89.5% | **100.0%** (`rec=1.000`) | **DISCREPANCY** |
| **Graph FPR** | -73.8% | **0.0%** (`fpr=0.000`, 0 false positives) | **DISCREPANCY** |
| **Precision Lift** | +25.8% abs | **+599.0%** | **DISCREPANCY** |
| **FPR Reduction** | -73.8% | **-100.0%** | **DISCREPANCY** |

### Root Cause Analysis of the Discrepancy
Why did the actual code execution produce `100% precision` and `0% FPR` for the Graph model, while the written documentation reported `94.2% precision` and `-73.8% FPR`?

1. **Synthetic Feature Separability in `dataset_generator.py`:**
   In lines 54 and 77 of `dataset_generator.py`:
   - Benign events are generated with:
     ```python
     cs_lp_risk_score = 0.0
     canary_hop_distance = -1
     fan_in_ratio_60m = random.uniform(0.05, 0.25)
     ```
   - Mule events are generated with:
     ```python
     cs_lp_risk_score = random.uniform(0.75, 1.0)
     canary_hop_distance = 1 if is_canary else random.choice([1, 2])
     fan_in_ratio_60m = random.uniform(0.7, 1.0)
     ```
2. **Impact on Machine Learning:**
   Because `cs_lp_risk_score` has non-overlapping ranges (`0.0` vs. `[0.75, 1.0]`), the LightGBM classifier on graph features achieves **100% linear separability** on the holdout split.
3. **Audit Verdict on Claim:**
   The documentation in `benchmark-results.md` reflects an earlier or theoretical benchmark target table, whereas the actual live running backend executes the deterministic synthetic distribution. The benchmark code runs in `< 0.1s` and is 100% reproducible, but the synthetic features are overly separable compared to noisy real-world banking telemetry.
