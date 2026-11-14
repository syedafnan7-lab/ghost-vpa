# Ghost-VPA Machine Learning Benchmark Methodology

**Project:** Ghost-VPA  
**Document:** `docs/benchmark-methodology.md`  
**Scale:** 100,000-Node Synthetic Financial Network  
**Date:** November 2026  

---

## 1. Objective & Hypothesis

### 1.1 Objective
To quantitatively evaluate whether augmenting traditional transaction-level fraud features with **canary-seeded temporal graph motifs and topological proximity features** significantly improves money-mule detection precision and reduces false-positive alerts.

### 1.2 Target Hypothesis (From Hackathon Source Brief)
- **Target Precision:** $> 92\%$ for high-confidence mule ring attribution.
- **Target FPR Reduction:** $\ge 70\%$ fewer false-positive alerts at equivalent recall compared to the transaction-only tabular baseline.
- **Scientific Caveat:** In accordance with Section 6 & 8 of the Master Build Prompt, these numbers are **validation targets to be measured and validated**, not assumed or fabricated constants.

---

## 2. Dataset Synthesis (100,000-Node Network)

The synthetic dataset generation protocol (`backend/app/ml/dataset_generator.py`) produces a deterministic, realistic Indian domestic payments graph:
- **Total Entities ($|V|$):** 100,000 nodes
  - 85,000 Benign Retail Accounts (salaries, peer transfers, daily UPI merchant QR payments).
  - 10,000 Benign MSME & Merchant Accounts (high-volume bursty legitimate payments).
  - 4,950 Synthetic Syndicate Mule Accounts (organized into 150 distinct layering rings).
  - 50 Bank-Designated Honeypot / Canary VPAs.
- **Total Transactions ($|E|$):** $\approx 500,000$ timestamped transfer events spanning a 7-day simulated epoch.
- **Topological Structures Injected:**
  - **Legitimate Flows:** Power-law degree distribution, Poisson arrival times, weekend shopping spikes, merchant aggregation.
  - **Syndicate Layering Rings:** Fan-in collection, rapid fan-out split transfers, multi-hop chains ($3 \le \text{hops} \le 5$), shared device tokens, and periodic canary probing attempts (₹1 penny-drop validation).

---

## 3. Train / Validation / Holdout Split

To prevent temporal data leakage (a common flaw in static AML benchmarks), we enforce a strict **temporal holdout split**:
- **Training Epoch:** Day 0 to Day 4 (first 70% of chronological transactions).
- **Validation Epoch:** Day 4 to Day 5 (next 15% of chronological transactions for hyperparameter tuning).
- **Testing Holdout:** Day 5 to Day 7 (final 15% of chronological transactions).
- **Zero Future Leakage:** Graph metrics for holdout evaluation are calculated using strictly past edges up to time $t$ of the event.

---

## 4. Evaluated Model Architectures

### 4.1 Model 1: Rules-Based Engine (Traditional Bank Heuristic)
- Rules: Flag if Amount $> ₹50,000$ AND new counterparty, OR if $\text{transactions\_in\_10m} \ge 5$.

### 4.2 Model 2: Tabular LightGBM Baseline (Transaction-Only)
- Features: `amount_inr`, `hour_of_day`, `day_of_week`, `account_age_days`, `historical_tx_count_24h`, `avg_amount_7d`, `velocity_delta_last_tx_sec`.

### 4.3 Model 3: Graph-Enhanced LightGBM (Challenger)
- Incorporates all Model 2 features plus graph-extracted signals:
  - `canary_hop_distance`: Shortest path length to nearest tripped canary node ($\infty$ mapped to -1).
  - `cs_lp_risk_score`: Canary-Seeded Label Propagation score with temporal exponential decay.
  - `fan_in_ratio_60m`: Ratio of unique inbound remitters to outbound recipients in the past 60 mins.
  - `fan_out_ratio_60m`: Ratio of outbound splits following an inbound deposit.
  - `amount_conservation_ratio`: Net balance retention ratio ($|Out - In| / In$).
  - `shared_device_mule_count`: Number of other accounts sharing the device token with known flagged nodes.
  - `temporal_burst_score`: Peak transaction frequency per 5-minute interval.

### 4.4 Model 4: PyTorch Geometric Dynamic Graph Model (TGN / EvolveGCN)
- Temporal graph neural network maintaining continuous node memory updated on edge arrival events.

---

## 5. Evaluation Metrics

- **Precision-Recall Area Under Curve (PR-AUC):** Primary metric due to extreme class imbalance ($< 5\%$ fraud).
- **Precision at High-Confidence Threshold:** Precision evaluated at operational threshold $\tau = 0.85$.
- **Recall at High-Confidence Threshold:** Proportion of true syndicate accounts captured.
- **False-Positive Reduction:**
  $$\Delta \text{FPR} = \frac{\text{FP}_{\text{baseline}} - \text{FP}_{\text{challenger}}}{\text{FP}_{\text{baseline}}} \times 100\%$$
- **Inference Latency SLA:** p50, p95, and p99 latency in milliseconds.
