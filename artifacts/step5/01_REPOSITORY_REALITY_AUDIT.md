# STEP 5 — STAGE 1: REPOSITORY REALITY AUDIT

**Project:** Ghost-VPA — Bank-Controlled Honeypot VPAs & Canary-Seeded Graph Intelligence
**Competition:** St Aloysius Foundation / AIMIT FinTech Hackathon 2026 × RBIH — Track 1, Digital Payments Fraud Detection & Prevention
**Audit date:** 2026-11-15 → 2026-11-16 · **Branch:** `main` @ `61c86a3`
**Method:** source inspection, live execution, ablation experiments, **no source modification** (see `01D`)

## Classification scale

1. **Fully implemented and verified** · 2. **Implemented, insufficiently tested** · 3. **Partially implemented** · 4. **Simulation-only** · 5. **Documentation-only** · 6. **Not implemented**

A capability is not counted as operational because it appears in a document, a
UI panel, or a passing test.

---

## 1. Executive summary

Ghost-VPA is a **well-built simulation with a real engineering core and a
credibility problem at its headline claims**.

What is genuinely strong, verified by execution:

- The zero-real-funds invariant is structurally sound — no payment library, no
  rail connection, no network I/O; `ALLOW_REAL_PAYMENT_RAILS=False` enforced in
  config and traceable end-to-end.
- The regulatory posture is honest where it matters: RBI Sept-2026 is cited as a
  **draft** throughout `research-register.md`, and a canary tripwire yields
  `REVIEW_REQUIRED`, never an auto-freeze. These are the constraints most likely
  to disqualify a submission, and they hold.
- The canary registry lookup, ingestion pipeline, RBAC hold barrier, SHA-256
  chained audit ledger, STIX export, RBI 60-day case workflow and the React
  workbench **all run end-to-end, live**. I exercised them; the audit chain
  verified intact.
- 23/23 tests pass; the frontend builds clean (1613 modules, exit 0).

What is not supportable, and what a technically-competent judge will find:

- The **"+27.1% precision lift" is a generator artefact**. Removing `cs_lp`
  costs **0.3 pp**. The six "graph features" are label-conditional `random.uniform`
  draws — no graph is constructed anywhere in the benchmark.
- **`cs_lp` alone predicts the label at 0.9518 AUC.** REM-01 claims "zero oracle
  features" and is marked "FIXED & VERIFIED". That verdict is wrong.
- **CS-LP cannot propagate upstream.** `temporal_engine.py:115-117` skips any
  node with zero in-edges — which is precisely the definition of a feeder. The
  project's headline capability is defeated by three lines of code.
- **The feeder-attribution chain is broken end-to-end.** `FEEDER_SYNTH_007` sits
  upstream of both mules in the Scenario B graph, scores **0.0**, and the case
  dossier returns `cluster_id=None`, `connected_mule_count=0`,
  `upstream_feeder_account=None`. Those columns are **never written** by any
  code path.
- **"Strict chronological split" is a row-order split.** No timestamp exists.
  A previous independent audit graded this "Gate 7: Leakage-Free Benchmark —
  PASSED" and "VERIFIED FOR HACKATHON DEMONSTRATION". On the evidence above, that
  verdict is not sustainable.
- **The honeypot is assumed a perfect oracle** (P=1.000, R=0.193) because the
  generator *cannot emit a benign canary hit*. Real VPA harvesting would break
  this; the benchmark never tests it.
- **Sanitisation, RBAC dependency guards, PostgreSQL/Neo4j/PyTorch-Geometric,
  an async worker pool, and a convergence check are documented but absent.**

**Net position:** the *architecture* is credible and defensible; the *measured
numbers* are not. The demo will work. The defence of the metrics will not.

---

## 2. Capability inventory

| # | Capability | Class | Evidence |
|---|---|---|---|
| 1 | Zero real fund movement | **1** | No payment SDK/rail/network call; `config.py` flags; live scenario A/B runs |
| 2 | Canary VPA registry, O(1) lookup | **1** | `honeypot_registry.py`; 4 rows live; hit counter increments |
| 3 | Canary tripwire → `REVIEW_REQUIRED` | **1** | `ingestion.py`; verified live; no auto-freeze path exists |
| 4 | Synthetic identifier scheme (no PII) | **1** | `rail.py` ID formats; DB inspection; all synthetic |
| 5 | SHA-256 audit ledger + `verify_chain` | **1** | Live: `{chain_intact: true, verified_blocks: 2}` |
| 6 | RBAC hold barrier (Analyst vs Supervisor) | **2** | Enforced server-side, but via client-settable header (C.7) |
| 7 | React/Vite workbench, D3 explorer | **1** | `npm run build` exit 0 |
| 8 | RBI 60-day case workflow, dynamic deadlines | **3** | Works; `REM-13` fixed a hardcode, but attribution never populated |
| 9 | STIX 2.1 export | **3** | Generates a bundle; non-standard pattern type; `stix2validator` absent |
| 10 | Simulated multi-bank payment rail | **4** | Deterministic by design (`seed=42`, fictional banks `HDFX/ICIX/SBINX/AXSX`) |
| 11 | **Temporal graph engine, NetworkX** | **3** | Exists and runs, but **CS-LP upstream propagation is broken** (§3.1) |
| 12 | **CS-LP risk scoring** | **3** | Implemented, mathematically wrong direction for the stated purpose |
| 13 | **Motif detection** | **3** | Runs; thresholds differ from documented values |
| 14 | **Graph-enhanced ML benchmark** | **4** | Trains on generator draws; **no graph is constructed** (01A §A.3) |
| 15 | **Upstream feeder attribution** | **6** | Columns exist, **never written**; live probe returns `None`/`0` |
| 16 | Base-rate / false-positive modelling | **6** | No benign-canary-hit injection anywhere |
| 17 | Authentication | **6** | 13 endpoints, zero auth dependency (01C §C.7) |
| 18 | Graph persistence / rehydration | **6** | In-memory singleton; restart empties graph, `payment_events` survive |
| 19 | PostgreSQL | **5** | Claimed in `source_brief.md:43`; only SQLite/WAL present |
| 20 | Neo4j + Cypher exporter | **5** | Claimed in `source_brief.md:43`, `research-register.md:92`; **no such code** |
| 21 | PyTorch Geometric / TGN / EvolveGCN | **5** | "Adopted" (`research-register.md:88,90`); **not in requirements, no code** |
| 22 | SHAP feature importance | **6** | Claimed line 91; **not implemented** (REM-05 relabelled to gain) |
| 23 | Async worker pool / `asyncio.Queue` | **5** | `architecture.md:34,83`; absent from `main.py` |
| 24 | CS-LP convergence check (<10⁻⁴) | **5** | `architecture.md`; no convergence test in the loop |
| 25 | `data/benchmark_100k.parquet` | **5** | Claimed offline artefact; **never written** |
| 26 | STIX "sanitisation" | **5** | `threat-model.md:29`; no redaction code; omission only (01C §C.4) |
| 27 | `require_role` FastAPI guard | **5** | `threat-model.md:31`; function does not exist |
| 28 | Inter-bank / TAXII sharing | **5** | Interface described; no adapter code |
| 29 | Zero-real-funds test | **2** | **Tautological**: passes the flag in, asserts it back |
| 30 | p95/p99 latency | **2** | Measured, but non-deterministic and mutates a tracked file |

---

## 3. Confirmed defects (ranked by damage to the submission)

### 3.1 CS-LP cannot propagate to upstream feeders — **the headline capability**

`backend/app/graph/temporal_engine.py:111-117`

```python
for node in self.graph.nodes:
    if node in self.canary_nodes:
        continue
    in_edges = self.graph.in_edges(node, data=True)
    if not in_edges:          # <-- feeders have in_degree 0
        continue              # <-- so their outbound edges are never read
```

The purpose of CS-LP is to trace **backwards** from a canary to the feeder that
funded the mules. A feeder is by definition a node with in-degree ~0 (funds come
from outside the observed window). The guard excludes exactly those nodes, so
the iteration never reads their outbound edges.

**Verified three ways:** (a) source trace, (b) live Scenario B run where
`FEEDER_SYNTH_007` scores **0.0** while its downstream mules score ~0.50,
(c) a control experiment in which adding a single inbound edge caused the
feeder's score to recover — isolating this guard as the cause.

### 3.2 The graph "lift" is generator artefact

Full ablation in `01B §B.2`. The decisive rows:

| Model | Precision | ROC-AUC | FP |
|---|---|---|---|
| Tabular (6 tx features) | 0.783 | 0.896 | 90 |
| Full "graph" (12) | 0.995 | **1.000** | 5 |
| Graph − `cs_lp` (11) | **0.993** | **1.000** | 8 |
| Graph − `cs_lp` − `hop_dist` (10) | 0.983 | 0.999 | 19 |

`cs_lp` — the mechanism in the project's name — contributes **0.3 pp**. The six
"graph features" are `random.uniform()` draws from label-conditional bands
(`dataset_generator.py:74-77, 127-130, 153-155, 182-184`), never computed from a
graph. ROC-AUC of exactly 1.000 is a signature of synthetic separability, not of
detection quality.

### 3.3 Label leakage contradicts the remediation register

`cs_lp_risk_score` solo AUC **0.9518**; `amount_conservation_ratio` **0.9219**.
Both are model inputs. `docs/remediation/remediation-register.md` REM-01 states
**"CONFIRMED → FIXED & VERIFIED … Zero oracle features."**

The genuine earlier audit
(`artifacts/verification/2026-11-14/04-benchmark-reproduction.md`) had defined
the exact test to run. REM-01 narrowed the bands (`0.75–1.0` → `0.55–0.88`) and
declared the fix without re-running the separability test. **The verdict was
recorded, not re-earned.**

### 3.4 The feeder attribution is never recorded

`cluster_id`, `connected_mule_count` and `upstream_feeder_account` exist in
`CaseModel`, are returned by the case API, and are rendered in the workbench —
but **no code path anywhere writes them**. Live Scenario B:

```
cluster_id = None · connected_mule_count = 0 · upstream_feeder_account = None
```

while the same request's graph *did* contain `FEEDER_SYNTH_007` as predecessor of
both mules. `docs/demo-runbook.md` tells the presenter to "click the central
purple feeder node: `FEEDER_SYNTH_007`" and open an Evidence Drawer showing
"delta-t velocity and shared device tokens". Those specific visuals are not
produced by the system.

### 3.5 The evaluation protocol label is false

No timestamp column exists. `benchmark.py:68` labels an `.iloc` row-order split
as `"Strict Chronological Train (70%) / Holdout Test (30%)"`, and the UI renders
it as a protocol badge. Measured train/test positive rates 0.1450 / 0.1492 —
random interleaving. `04-benchmark-reproduction.md` and
`FINAL-VERIFICATION-REPORT.md` "Gate 7: PASSED" both assert the opposite.

### 3.6 The honeypot's precision is assumed, not measured

`is_canary_hit` is set only inside the mule branch
(`dataset_generator.py:44-46`); **the generator cannot emit a benign canary
hit.** P=1.0000 / R=0.1931 (TP 706, FP 0, FN 2,950) is therefore tautological.
The corpus cannot represent an unwitting victim, a harvested VPA, or deliberate
syndicate discovery — the mechanisms that would detonate precision in
production. The "94.4% FPR reduction" and "0.1% FPR" claims inherit this
untested assumption.

---

## 4. Documentation ↔ code drift

| Claim | Source | Reality |
|---|---|---|
| PostgreSQL + Neo4j + Cypher exporter | `source_brief.md:43`, `research-register.md:92` | SQLite/WAL only; no Neo4j import |
| PyG / TGN / EvolveGCN "Adopted" | `research-register.md:88,90` | Absent from `requirements.txt` and code |
| SHAP interpretable features | `research-register.md:91` | Not implemented (REM-05 relabelled to gain) |
| Async Worker Pool (`to_thread`) | `architecture.md:34` | Absent from `main.py` |
| `asyncio.Queue` background ingestion | `architecture.md:83` | Absent |
| CS-LP convergence <10⁻⁴ | `architecture.md` | No convergence check |
| Fan-in ≥4 / fan-out ≥5 | `architecture.md` | Code uses ≥3 |
| Conservation [0.85, 1.05] | `architecture.md` | Code differs |
| `data/benchmark_100k.parquet` | `architecture.md` | Never written |
| STIX "sanitize all internal node IDs" | `threat-model.md:29` | No redaction code (01C §C.4) |
| `require_role("SUPERVISOR")` guards | `threat-model.md:31` | Function does not exist |
| RBAC as "server-side enforcement" | `FINAL-VERIFICATION-REPORT.md:42` | Client header, no authentication |
| Sub-15ms latency | `FINAL-VERIFICATION-REPORT.md:18` | `test_triage_engine.py` asserts **<50 ms** |
| "All 8 tests pass" | `FINAL-VERIFICATION-REPORT.md:45` | Now **23 tests**; the note is stale |
| "94.4% FPR reduction", "+27.1% lift", "0.1% FPR" | `README.md`, `benchmark-results.md`, `judge-pitch.md` | Generator artefact (§3.2) |

---

## 5. Verified findings (things that genuinely work)

I executed rather than assumed each of these:

1. **23/23 tests pass** in 12.02 s (exit 0). The suite is honest about what it
   covers but very weak in what it proves (§6).
2. **Frontend builds clean:** `tsc && vite build`, 1613 modules, 313.42 kB JS,
   gzip 91.83 kB, exit 0.
3. **Zero real money holds by construction.** No payment library, no outbound
   network call, fictional bank codes, `seed=42` determinism.
4. **Canary interception works live.** End-to-end scenario runs return
   `REVIEW_REQUIRED`, `ZERO_FUNDS_TRANSFERRED`, and a case dossier.
5. **Audit chain is real and verifies live:** `{chain_intact: true,
   verified_blocks: 2, broken_block: null}`. `canonical_timestamp()` fixes a
   genuine SQLite tz bug, covered by tests.
6. **RBAC barrier blocks Analyst holds.** Server-side, returns 403. The defect is
   authentication, not the barrier itself.
7. **STIX export produces a well-formed `stix2` bundle** with
   `x_ghostvpa_synthetic: true` — a defensible safety marker.
8. **No PII exists anywhere.** All identifiers are synthetic by construction
   (`ACCT_SYNTH_*`, `CANARY_VPA_*`, `DEV_TOK_*`), confirmed across `rail.py` and
   the local DB. A real strength — just not the "sanitisation" claimed.
9. **The DB is git-ignored** (`.gitignore:24-26`) and holds only synthetic rows.

---

## 6. Risks requiring further testing

1. **Multi-bank scale.** Entity resolution has a real defect: `sender_account_id`
   and `sender_vpa` are drawn from independent random pools (`rail.py`), and
   benign noise never targets canaries — so the corpus cannot test graph linkage
   across banks.
2. **Sustained ingestion load.** No graph persistence; a restart empties the
   graph while `payment_events` rows survive. Any resilience claim is untested.
3. **RBAC bypass.** Trivially bypassed by editing a header. If the judges ask
   "what stops a rogue analyst?", the honest answer is "nothing, in this
   prototype".
4. **Event replay.** `event_id` is a client-supplied primary key with no dedup;
   a replay raises an IntegrityError (500).
5. **Blocking benchmark endpoint.** `api/benchmark.py` calls a synchronous
   100k-node generation + 3 LightGBM trainings inside an `async` handler,
   directly on the event loop.

---

## 7. Failed or inconclusive experiments

| Experiment | Outcome |
|---|---|
| Is there a graph in the benchmark? | **No.** String scan: `networkx`, `MultiDiGraph`, `add_node`, `add_edge` all absent from `benchmark.py` and `dataset_generator.py`. |
| Does CS-LP give graph value? | **Not on this corpus** — 0.3 pp. Cannot be answered for the runtime engine, which the benchmark never exercises. |
| Can a chronological split be constructed? | **No** — no timestamp exists. Documented in `01B §B.3`. |
| Is the STIX schema-conformant? | **Inconclusive by tool, false by spec** — `stix2validator` not installed; `payment-account:vpa` is outside the SCO vocabulary. |
| Is `cs_lp` a single-cut oracle? | **No** — I disproved my own first reading; ranges overlap (0.080 vs 0.450). Defect is conditional *distributions*. |
| Generator unpacking | **No defect** — I initially recorded one; verified both sides are `(nodes_df, events_df)`. |
| Route count | Probe 1 reported 5; **actual 13** (`_IncludedRouter` mounts). Corrected. |

## 8. Unavailable evidence

- **RBI September 2026 instrument status** — not resolvable locally. Stage 1 is
  repository-only; no web research was performed. **Carried to Stage 3.**
  `research-register.md` documents it as a *draft* (public-comment deadline
  2 Oct 2026) and that treatment is correct and must be preserved.
- **Real-world honeypot precision** — structurally unmeasurable from a corpus
  whose generator forbids benign canary hits.
- **Peer benchmarks** — no prior-winner analysis yet. **Carried to Stage 2.**

---

## 9. Unresolved questions for later stages

1. Have final RBI directions been issued after the 2 Oct 2026 comment deadline,
   and do they differ from the draft Annex III SOP the product models? *(Stage 3)*
2. Does MuleHunter.ai (I4C–RBIH) already implement canary-seeded graph
   intelligence? *(Stage 3 — the differentiation question)*
3. What do prior Track-1 winners actually deliver, and what would a judge score
   highest against the six official criteria? *(Stage 2)*
4. Can the runtime `temporal_engine.py` CS-LP produce a score good enough to
   justify the ML claim — if fed real graph data instead of generator draws?
5. Is there an honest +lift story once leakage is removed, and if so what is it?
6. Do the official criteria reward architectural honesty over headline metrics?

---

## 10. Bottom line for the team

**Do not present the current benchmark numbers as evidence of detection
quality.** They are a correct computation over a corpus that cannot support
them, and the single most likely question from a technical judge — "show me what
happens when a benign user probes the canary" — currently has no answer in the
system.

The defensible story is different and stronger than you may think: **you built a
working honeypot that intercepts before money moves, with an honest zero-funds
invariant, an auditable chain, and a real NetworkX engine.** That scores on
criteria 2 and 3 without any exposure. The generator artefacts score nothing
once questioned, and cost credibility on criterion 5.

**Stage 1 complete. Awaiting authorisation for Stage 2.**