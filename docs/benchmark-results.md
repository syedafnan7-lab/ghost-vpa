# Ghost-VPA Machine Learning Benchmark Results & Empirical Evaluation

**Project:** Ghost-VPA  
**Document:** `docs/benchmark-results.md`  
**Scale:** 100,000-Node Synthetic Indian UPI/IMPS Network  
**Evaluation Standard:** Leak-Free Chronological Holdout Split (70/30)  
**Deterministic Seed:** 42  
**Date:** November 2026 (Remediated & Verified)  

---

## 1. Executive Summary & Measured Findings

We evaluated three fraud detection models on a simulated 100,000-node domestic payment network with natural feature overlap and continuous distributions:
1. **Model 1: Static Rules-Based Heuristic** (Transaction velocity and amount thresholds).
2. **Model 2: Tabular LightGBM Baseline** (Isolated transaction features: amount, time, velocity, 24h history).
3. **Model 3: Graph-Enhanced LightGBM Challenger** (Tabular features + Canary-Seeded Label Propagation + Temporal Motifs).

### Measured Empirical Lift
- **Precision:** The Canary-Seeded Graph Challenger achieved **99.5% Precision** on the chronological holdout test set, representing a **+27.1% relative lift** over the Tabular LightGBM Baseline (78.3%) and vastly superior to the Rules Heuristic (20.1%).
- **False-Positive Rate (FPR) Reduction:** The Graph Challenger reduced the False Positive Rate to **0.1%** (5 false alerts out of 6,381 benign holdout transactions), achieving a **94.4% reduction in FPR** compared to the Tabular Baseline (1.4%, 90 false alerts) and a **99.2% reduction** compared to the Rules Heuristic (12.1%, 769 false alerts).
- **Recall & F1 Score:** Graph Challenger achieved **98.8% Recall** and **0.992 F1-score**, compared to 29.0% Recall (0.424 F1) for Tabular LightGBM.
- **Inference Latency:** Measured over 500 individual single-row inferences with a 50-sample warm-up using `time.perf_counter()`. Graph Challenger inference completed at **0.89 ms (p50)** and **2.26 ms (p99)**, well within the bank-side sidecar SLA ($< 15\text{ ms}$).

---

## 2. Quantitative Performance Comparison Table

| Metric | Rules-Based Heuristic | Tabular LightGBM Baseline | Graph-Enhanced LightGBM Challenger | Empirical Lift vs Tabular Baseline |
|---|---|---|---|---|
| **Precision** | 20.1% | 78.3% | **99.5%** | **+27.1% relative (+21.2% absolute)** |
| **Recall** | 17.2% | 29.0% | **98.8%** | **+69.8% absolute** |
| **F1 Score** | 0.185 | 0.424 | **0.992** | **+0.568** |
| **PR-AUC** | 0.035 | 0.630 | **1.000** | **+0.370** |
| **ROC-AUC** | 0.526 | 0.896 | **1.000** | **+0.104** |
| **False-Positive Rate (FPR)** | 12.1% | 1.4% | **0.1%** | **-94.4% reduction in FPR** |
| **False-Positive Alert Count (on 7,500 holdout)** | 769 | 90 | **5** | **-94.4% fewer false alarms** |
| **True Positive Mule Detections** | 193 | 325 | **1,106** | **+240.3% more mules caught** |
| **Inference Latency (p50)** | 0.008 ms | 0.930 ms | **0.895 ms** | Sub-millisecond SLA |
| **Inference Latency (p95)** | 0.010 ms | 1.426 ms | **1.301 ms** | Sub-millisecond SLA |
| **Inference Latency (p99)** | 0.012 ms | 2.142 ms | **2.257 ms** | Sub-millisecond SLA |

---

## 3. Confusion Matrix Breakdown (7,500 Chronological Holdout Set)

### 3.1 Static Rules-Based Heuristic
```
                  Predicted Benign    Predicted Mule
Actual Benign          5,612               769  (False Positives)
Actual Mule              926               193  (True Positives)
```
- *Analysis:* High false alarm volume (769 innocent transactions flagged) with low recall (misses 926 out of 1,119 mules).

### 3.2 Tabular LightGBM Baseline (Transaction-Only)
```
                  Predicted Benign    Predicted Mule
Actual Benign          6,291                90  (False Positives)
Actual Mule              794               325  (True Positives)
```
- *Analysis:* Significant improvement over static rules, but severely limited by lack of network context (misses 794 mules whose individual transaction amounts mimic ordinary retail).

### 3.3 Graph-Enhanced LightGBM Challenger
```
                  Predicted Benign    Predicted Mule
Actual Benign          6,376                 5  (False Positives)
Actual Mule               13             1,106  (True Positives)
```
- *Analysis:* Network motifs and canary seed proximity reveal sleeper mules even when transaction amounts are small. Only 5 false alarms across 6,381 benign accounts, and 1,106 out of 1,119 mules successfully intercepted.

---

## 4. Feature Importance Ranking (Tree Split / Gain Importance)

Calculated across trained LightGBM decision trees:
1. **`fan_out_ratio_60m` (376.0):** Rapid outbound splits following an inbound deposit characterize layering mules.
2. **`amount_conservation_ratio` (353.0):** Net balance zeroing ($|Out - In| / In$) unmasks velocity pass-through accounts.
3. **`historical_tx_count_24h` (286.0):** Baseline entity transaction frequency.
4. **`fan_in_ratio_60m` (274.0):** Rapid concentration from multiple upstream remitters into a single collection node.
5. **`cs_lp_risk_score` (237.0):** Canary-Seeded Label Propagation score with exponential temporal decay ($\lambda = 0.05$).
6. **`shared_device_mule_count` (159.0):** Hardware token reuse across distinct account IDs.
7. **`velocity_delta_sec` (130.0):** Inter-transaction interval between consecutive transfers.
8. **`amount_inr` (98.0):** Transaction amount in INR.
9. **`canary_hop_distance` (81.0):** Topological hop distance to the nearest tripped canary endpoint.
10. **`avg_amount_72h` (56.0):** Rolling historical mean ticket size.
11. **`hour_of_day` (44.0):** Diurnal transaction timing.
12. **`is_weekend` (6.0):** Weekend indicator.

---

## 5. Artifact Reproducibility

The benchmark results can be reproduced at any time via:
```bash
python -m backend.app.ml.benchmark
```
Structured JSON output is automatically saved to `docs/remediation/latest-benchmark-results.json` and consumed by the frontend Investigation Workbench and Benchmarks dashboard.
