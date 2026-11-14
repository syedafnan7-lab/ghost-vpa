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

The synthetic dataset generation protocol (`backend/app/ml/dataset_generator.py`) produces a deterministic, realistic Indian domestic payments network with overlapping distributions to prevent artificial feature leakage:
- **Total Entities ($|V|$):** 100,000 nodes
  - 85,000 Benign Retail Accounts (salaries, peer transfers, daily UPI merchant QR payments).
  - 10,000 Benign MSME & Merchant Accounts (high-volume bursty legitimate payments, log-normal ticket sizes).
  - 4,950 Synthetic Syndicate Mule Accounts (organized into multi-hop layering rings, rapid fan-in/fan-out, and pass-through nodes).
  - 50 Bank-Designated Honeypot / Canary VPAs.
- **Leakage Prevention Guarantees:**
  - Log-normal ticket amounts with high continuous overlap across benign retail, merchants, and mule transfers.
  - Legitimate high-volume merchants exhibiting burst velocity without canary connection.
  - Unwitting victim intermediaries (1-hop accidental connections).
  - ~25% of fraud syndicates operate without interacting with honeypots (`canary_hop_distance = -1`, `cs_lp_risk_score = 0.0`), forcing the model to generalize based on structural motifs rather than memorizing a synthetic oracle.
  - No single feature directly encodes the ground-truth label.

---

## 3. Train / Validation / Holdout Split

To prevent temporal data leakage, we enforce a strict **chronological holdout split**:
- **Training Set:** Chronologically first 70% of transactions.
- **Testing Holdout:** Final 30% chronological holdout transactions (strictly unobserved during model fitting).
- **Evaluation Protocol:** All three models are evaluated on the exact same holdout split using deterministic random seed (`seed=42`).

---

## 4. Evaluated Model Architectures

### 4.1 Model 1: Rules-Based Engine (Traditional Bank Heuristic)
- Rules: Flagged as suspicious if `velocity_delta_sec < 180` AND `amount_inr > 1.8 * avg_amount` OR `historical_tx_count_24h > 25`.

### 4.2 Model 2: Tabular LightGBM Baseline (Transaction-Only)
- Features: `amount_inr`, `hour_of_day`, `is_weekend`, `historical_tx_count_24h`, `avg_amount_72h`, `velocity_delta_sec`.

### 4.3 Model 3: Graph-Enhanced LightGBM (Challenger)
- Incorporates all Model 2 features plus graph-extracted signals:
  - `canary_hop_distance`: Shortest path length to nearest tripped canary node ($\infty$ mapped to -1).
  - `cs_lp_risk_score`: Canary-Seeded Label Propagation score with temporal exponential decay.
  - `fan_in_ratio_60m`: Ratio of unique inbound remitters in the past 60 mins.
  - `fan_out_ratio_60m`: Ratio of outbound splits following an inbound deposit.
  - `amount_conservation_ratio`: Net balance retention ratio ($|Out - In| / In$).
  - `shared_device_mule_count`: Number of accounts sharing hardware token with flagged nodes.

---

## 5. Evaluation Metrics & Latency Profiling

- **Precision-Recall Area Under Curve (PR-AUC):** Primary metric for imbalanced fraud evaluation.
- **Precision, Recall, F1-Score & False Positive Rate (FPR):** Evaluated at operational classification threshold.
- **False-Positive Reduction:**
  $$\Delta \text{FPR} = \frac{\text{FPR}_{\text{tabular}} - \text{FPR}_{\text{graph}}}{\text{FPR}_{\text{tabular}}} \times 100\%$$
- **Authentic Latency Measurement:** Single-row inference latency profiled across 500 individual samples with 50-sample warm-up using high-resolution monotonic timer `time.perf_counter()`.
- **Feature Importance:** Measured as LightGBM tree split count / gain importance across decision trees.
