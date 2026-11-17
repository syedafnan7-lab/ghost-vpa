# STAGE 1 — DELIVERABLE B: REPRODUCIBLE DETECTION VALIDITY REPORT

**Script:** `artifacts/step5/scratch/probe8_detection_validity.py`
**Corpus:** `generate_synthetic_100k_network(seed=42)` → 25,000 events, 100,000 nodes
**Label rate:** 0.1462 (3,656 positives / 21,344 negatives)
**Reproducibility:** seed=42 fixed; ran clean (exit 0)

All figures below are printed output, not estimates. Model hyperparameters were
copied verbatim from `benchmark.py:120,163` (`n_estimators` differed by design —
see §B.2 note).

---

## B.1 Single-feature label separation

Solo ROC-AUC of each feature against `is_mule_label`, full corpus:

| Feature | Solo AUC | Assessment |
|---|---|---|
| `cs_lp_risk_score` | **0.9518** | **ORACLE-GRADE LEAKAGE** |
| `amount_conservation_ratio` | **0.9219** | Strong leakage |
| `fan_out_ratio_60m` | **0.8816** | Strong leakage |
| `canary_hop_distance` | **0.8430** | Strong leakage |
| `fan_in_ratio_60m` | **0.8135** | Strong leakage |
| `shared_device_mule_count` | 0.7589 | Weak signal |
| `velocity_delta_sec` | 0.6840 | Weak signal |
| `amount_inr` | 0.6727 | Weak signal |
| `avg_amount_72h` | 0.6584 | Weak signal |
| `historical_tx_count_24h` | 0.6158 | Weak signal |
| `is_canary_hit` | 0.5966 | Weak (not a model feature) |
| `is_weekend` | 0.5274 | Noise |
| `hour_of_day` | 0.5050 | Noise |

**Mechanism.** `dataset_generator.py` draws these six "graph" features from
*disjoint label-conditional bands*, e.g. a canary-touching mule gets
`cs_lp = random.uniform(0.55, 0.88)` (line 50) while benign payroll gets
`random.uniform(0.0, 0.15)` (line 156). No graph is consulted. `cs_lp` alone
reaches 0.9518 AUC; adding `amount_conservation_ratio` at 0.9219 means the
model's job is essentially a two-threshold lookup.

**Distinguishing signal from leakage.** `amount_inr`, `velocity_delta_sec`,
`hour_of_day` and `is_weekend` (all ≤0.68) are the only features with plausible
real-world semantics. The five at ≥0.84 are the ones labelled "graph
features" — every one is a generator-injected conditional draw. The leakage is
concentrated exactly where the differentiation claim lives.

**Status of the "no oracle" claim.** `docs/benchmark-methodology.md` asserts
"No single feature directly encodes the ground-truth label."
`docs/remediation/remediation-register.md` REM-01 asserts "FIXED & VERIFIED …
Zero oracle features." **Both are false against the running code.**
The remediation moved the bands (`0.75–1.0` → `0.55–0.88`) but did not remove
the label-conditionality, and REM-01's "fixed" verdict was recorded without
re-running the separability test that the earlier audit
(`04-benchmark-reproduction.md`) had defined.

## B.2 Graph ablation — does value survive without `cs_lp`?

Trained with `random_state=42`, `learning_rate=0.08`. Threshold 0.50.

| # | Feature set | Precision | Recall | F1 | ROC-AUC | PR-AUC | FP | FN |
|---|---|---|---|---|---|---|---|---|
| 1 | Tabular (6 tx features) | 0.783 | 0.290 | 0.424 | 0.896 | 0.630 | 90 | 794 |
| 2 | **Full "graph" (12)** | **0.995** | 0.988 | 0.992 | **1.000** | 1.000 | 5 | 13 |
| 3 | Graph − `cs_lp` (11) | **0.993** | 0.975 | 0.984 | 1.000 | 0.998 | 8 | 28 |
| 4 | Graph − `cs_lp` − `hop_dist` (10) | 0.983 | 0.961 | 0.972 | 0.999 | 0.997 | 19 | 44 |

- Precision lift, tabular → full graph: **+21.2 pp**
- Removing `cs_lp` costs: **0.3 pp** (0.995 → 0.993)
- Also removing `canary_hop_distance`: **1.2 pp total** (0.995 → 0.983)

**Interpretation.** The headline "+27.1% precision lift" is preserved almost
entirely by the motif bands alone. `cs_lp` — the Canary-Seeded Label Propagation
score, the mechanism the project is named after — contributes **0.3 pp** on this
corpus. ROC-AUC remains 1.000 without it.

**Therefore:** on this dataset, **graph intelligence as implemented does not
demonstrate incremental value**. The lift comes from label-conditional random
number generation, and the CS-LP *concept* is not what is producing the number.

Two honest caveats:

- I used `n_estimators=60` for all rows; `benchmark.py:163` uses 70 for the graph
  model. Re-running the graph rows at 70 does not change the ranking materially
  (both are already at ROC 1.000).
- This proves the *benchmark* fails to demonstrate graph value. It does **not**
  prove the runtime `temporal_engine.py` CS-LP is useless — that code cannot be
  evaluated by this corpus at all (see Deliverable §A.3).

## B.3 Chronological split feasibility

**Columns containing any time signal:** `hour_of_day` only.

- `hour_of_day` is time-of-day (0–23), not a date. It carries no ordering.
- No `event_ts`, `timestamp`, `created_at`, or `sim_time` exists on `events_df`.
- Rows are emitted in Python loop order (`for i in range(num_events)`, line 32),
  with the class chosen per-row by `random.random()` (line 33). Row index is
  therefore **independent of time**.

**Measured:** train positive rate 0.1450, test 0.1492.

**Conclusion:** a genuine chronological split is **impossible** with this corpus.
The existing split is an implicit *random* split (labels interleave uniformly),
so "Strict Chronological Train (70%) / Holdout Test (30%)" at
`benchmark.py:68,232` is a false statement.

**What is needed to make it true:** add a monotonic `event_ts`
(simulated UTC, monotonically increasing with loop index) at generation time,
set the split on `event_ts` rather than position, and only then claim
chronological holdout. Until then the label should read "row-order split",
and the UI badge should say so.

## B.4 Honeypot oracle performance

Tripwire (`is_canary_hit`) vs `is_mule_label`, full corpus:

| | Predicted mule | Predicted benign |
|---|---|---|
| **Actual mule** | TP = 706 | FN = 2,950 |
| **Actual benign** | FP = 0 | TN = 21,344 |

- **Precision = 1.0000** (706 / 706)
- **Recall = 0.1931** (706 / 3,656)
- Sample size 25,000; class imbalance 1:5.8

**Label definition — read this before quoting the number.**
`is_canary_hit` is *not* independent ground truth. It is a property of the
synthetic generator: `is_canary=1` is set only inside the mule branch
(`dataset_generator.py:44-46`), and the benign branches (`elif`, lines 106/135/
160) never set it. **The generator cannot emit a benign canary hit.** Precision
of 1.000 is therefore a tautology — the field is a deterministic function of the
generator's own label decision.

**So: is honeypot detection independently substantiated? No.**
The synthetic corpus cannot test any of the failure modes that determine
real-world precision:

- an **unwitting victim** (scam recipient) who probes a canary;
- **VPA harvesting** — a syndicate reading a canary VPA off a leaked list and
  probing it deliberately;
- **canary discovery** by the syndicate, after which the endpoint is salted with
  adversarial traffic;
- legitimate misdirected payments to a plausible-looking handle.

Any of these converts precision from 1.000 toward something materially lower.
The benchmark never models them, so the "+27.1% lift" and "0.1% FPR" claims
rest on an untested assumption that the tripwire is a perfect oracle.

**Remember:** `is_canary_hit` is not even a feature in either model. The adjacent
feature `canary_hop_distance` IS used, and shares the same generator lineage
(solo AUC 0.843) — so the proxy leakage is real even though the flag itself is
withheld.

## B.5 What would make these claims honest

1. Generate features by **running the graph engine**, not by `random.uniform`.
2. Add `event_ts` and split on it.
3. Inject benign canary hits (victims, harvested VPAs, discovery) so precision
   is measured rather than assumed.
4. Report CS-LP's incremental contribution after (1)–(3) — if it is 0.3 pp, say
   so, or find out whether the runtime engine produces a better score than the
   generator's fake.