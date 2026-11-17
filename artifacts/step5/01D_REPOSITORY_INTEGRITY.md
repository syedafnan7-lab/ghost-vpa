# STAGE 1 — DELIVERABLE D: REPOSITORY CHANGE INTEGRITY REPORT

**Question:** did this audit modify application source code?
**Answer: No.** All modified files were already modified at session start, before
any audit activity. One tracked file was transiently altered *by the project's
own code* during a test run; it has been restored.

---

## D.1 State at audit start

`git status --short` at the beginning of this session (recorded in the session
context snapshot):

```
 M frontend/src/components/NetworkExplorer.tsx
 M frontend/src/index.css
 M frontend/tailwind.config.js
 M website/src/styles.css
?? artifacts/step5/
```

## D.2 Current state

`git status --short`:

```
 M frontend/src/components/NetworkExplorer.tsx
 M frontend/src/index.css
 M frontend/tailwind.config.js
 M website/src/styles.css
?? artifacts/step5/
```

**Identical.** No file was added, edited, reverted, or deleted by this audit.

## D.3 Provenance of each pre-existing modification

These are **user work, not audit artefacts**. They correspond to commits
`61c86a3`, `442aaed`, `a72d189`, `e55d723` ("workbench revamp", "frontend
elevation", "website showcase UX") — uncommitted follow-on UI/styling changes
(afternoon of 2026-11-16 00:47, i.e. before the audit's first probe at 00:10 and
independent of it).

| File | Δ | Nature | Affects production detection? |
|---|---|---|---|
| `frontend/src/components/NetworkExplorer.tsx` | 14 lines | Frontend display | No |
| `frontend/src/index.css` | 2 lines | Styling | No |
| `frontend/tailwind.config.js` | 2 lines | Styling tokens | No |
| `website/src/styles.css` | 2 lines | Marketing site | No |

None touch `backend/`, detection logic, data model, or configuration.

## D.4 One transient modification — caused by the repository's own code

During Deliverable A I ran `pytest tests/test_benchmark_metrics.py -q` to confirm
a suspected side effect. It produced:

```
 M docs/remediation/latest-benchmark-results.json
```

**Cause, not audit error:** `benchmark.py:236-239` writes that tracked file every
time the benchmark runs. `tests/test_benchmark_metrics.py` invokes the runner, so
running the test suite mutates version-controlled documentation.

**Action taken:** restored to the committed state with
`git checkout docs/remediation/latest-benchmark-results.json`; verified clean.
No user content was lost — the run had only rewritten latency fields.

This is recorded as a **confirmed defect** in Deliverable A §A.5, not as an audit
mistake, because any contributor running `pytest` hits the same behaviour.

## D.5 Files created by this audit

All under the authorised path `artifacts/step5/`, none touching application code:

**Reports (this deliverable set):**

| Path | Deliverable |
|---|---|
| `artifacts/step5/00_SOURCE_REGISTER.md` | Source register (provenance for all claims) |
| `artifacts/step5/01A_BENCHMARK_INTEGRITY.md` | A — Benchmark integrity |
| `artifacts/step5/01B_DETECTION_VALIDITY.md` | B — Detection validity |
| `artifacts/step5/01C_DATA_PRIVACY.md` | C — Privacy & identifier handling |
| `artifacts/step5/01D_REPOSITORY_INTEGRITY.md` | D — This report |
| `artifacts/step5/01_REPOSITORY_REALITY_AUDIT.md` | Consolidated Stage 1 report |

**Scratch probes:**

| Path | Purpose |
|---|---|
| `artifacts/step5/scratch/benchmark_leakage_probe.py` | Initial attempt; exposed return-order trap |
| `artifacts/step5/scratch/probe8_detection_validity.py` | **Deliverable B numbers** |
| `artifacts/step5/scratch/probe9_graph_and_identifiers.py` | Graph-construction & identifier evidence |
| `artifacts/step5/scratch/route_inventory_correct.py` | Corrected route/auth inventory |
| `artifacts/step5/scratch/security_probe.py` | Superseded (bad middleware detection) |
| `artifacts/step5/scratch/security_probe2.py` | Corrected CORS preflight evidence |
| `artifacts/step5/scratch/router_registration_probe.py` | Diagnosed `_IncludedRouter` anomaly |
| `artifacts/step5/scratch/stix_probe.py` | STIX validity / sanitisation evidence |
| `artifacts/step5/scratch/out_probe8.txt`, `out_probe9.txt` | Raw captured output |

## D.6 Explicit non-actions

- No edit to any file under `backend/`, `frontend/`, `website/`, `docs/`,
  `tests/`, `briefs/`, `AGENTS.md`, `concepts_brief.md`.
- No dependency installed or removed.
- No commit created, no branch switched, no stash used.
- No reset, no `--hard`, no force.
- No contact with any live payment rail, network endpoint, or banking system.

## D.7 Self-corrections worth recording

Three errors I made and corrected during Stage 1, retained because a reviewer
should be able to see the audit is not cherry-picked:

1. **Return-order misread.** I first recorded a generator unpacking defect.
   Verified against `dataset_generator.py:191` vs `benchmark.py:66`: both
   `(nodes_df, events_df)`. **No defect.** Corrected in `01A`.
2. **Route inventory undercount.** My first security probe reported "5 routes /
   0 dependencies". Cause: FastAPI mounts routers as lazy `_IncludedRouter`
   entries; iterating `app.routes` missed them. Corrected by enumerating each
   `APIRoute` via its own router: **13 endpoints, 5 with no dependency**. The
   "no auth" conclusion survived; the "5 routes" number did not.
3. **Overstated leakage.** My first pass called the `cs_lp` ranges "disjoint /
   perfectly separable". They overlap (mule min 0.080 vs benign max 0.450). The
   defect is **label-conditional distributions** (solo AUC 0.9518), not a
   single-cut oracle. Corrected in `01B`.