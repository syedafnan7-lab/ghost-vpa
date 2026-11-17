# Codex Engineering Execution Report

**Date:** 17 November 2026  
**Repository commit at start:** `61c86a3`  
**Execution mode:** Local simulation-only code and documentation; no commits or external integrations.

## Changes made

### Backend and event semantics

- `backend/app/graph/temporal_engine.py`: distinguish evidence/attempt edges from financial edges; only `CREDIT_CONFIRMED` carries a fund amount. Direct canary interaction contributes a fixed evidence seed weight without using the attempted amount as transferred funds. Feeder attribution checks active-window, past-time confirmed credits. Structural amplification counts distinct suspect beneficiaries.
- `backend/app/schemas/graph.py`, `frontend/src/types/index.ts`: include edge financial status and lifecycle event type in graph responses.
- `backend/app/simulator/rail.py`: mark synthetic completed movements `CREDIT_CONFIRMED`, while canary probes stay `PAYMENT_ATTEMPT`.
- `backend/app/api/ingestion.py`: set settled/zero-funds result fields from lifecycle type and broadcast the actual event type; attempts and declines no longer report funds moved.
- `backend/app/api/cases.py`: deny all case mutations with HTTP 503 before DB lookup; client-supplied role/actor fields are not trusted identity.
- `backend/app/core/config.py`, `backend/app/main.py`, `start-ghostvpa.bat`, `README.md`: bind the demo to loopback and use only the two local frontend origins for CORS instead of wildcard origins.
- `backend/app/api/benchmark.py` and `backend/app/ml/benchmark.py`: disable benchmark API and runner so cached, invalid scores cannot be served or regenerated.

### Frontend and website

- `frontend/src/components/NetworkExplorer.tsx`: visually distinguish non-financial graph events using dashed edges.
- `frontend/src/components/InvestigationWorkbench.tsx`: disable case mutations and describe linked accounts without asserting they are all verified mules.
- `frontend/src/components/ModelBenchmarking.tsx`: show a clear withdrawn-results explanation.
- `frontend/src/components/HoneypotRegistry.tsx`: remove claims about production/customer-surrendered identifiers and live lookup behavior.
- `website/src/components/sections/Benchmark.tsx`: replace fabricated metric charts with a withdrawal statement and evaluation requirements.
- `website/src/components/sections/Problem.tsx` and `Boundaries.tsx`: remove unsupported production false-positive claim and update capability status.

### Docs and tests

- Updated README, benchmark methodology/results, judge pitch, demo runbook, security/privacy, and threat model to reflect prototype reality and draft regulatory status.
- `tests/test_graph_priority0_remediation.py`: added attempt-vs-credit fund-flow assertion and future-funding attribution check.
- `tests/test_temporal_graph.py`: tests now distinguish synthetic confirmed credits from canary attempts.
- `tests/test_benchmark_metrics.py`: replaced invalid metric assertions with checks that historical benchmark results and all case mutations are disabled.
- `tests/test_triage_engine.py`: added an ingestion test proving an unconfirmed attempt is stored with `ATTEMPT_RECORDED`, zero transferred funds, and a non-financial graph edge.

## Root causes addressed

1. An event schema had lifecycle types, but the graph assigned amount to attempts and propagated as if funds moved. The graph now separates interaction evidence from confirmed monetary flow.
2. Case-action authorization relied on a user-editable request header. All case mutations are disabled until authenticated authorization can be supplied.
3. The app served cached benchmark values despite known synthetic leakage and an invalid split. Both API and runner now refuse the retired benchmark, and the UI no longer plots the figures.
4. The site retained hardcoded benchmark charts and unsupported production claims after the product docs had begun to disclose limitations.

## Database and API changes

No schema migration was introduced in this execution. Existing attribution/event columns from the pre-existing worktree remain. `/api/v1/benchmark/results` returns HTTP 503 with a reason. `POST /api/v1/cases/{case_id}/action` returns HTTP 503 for every action, even if `X-User-Role: Supervisor` is supplied. Read endpoints remain unauthenticated and the app is unsafe for deployment.

## Verification

- `pytest tests/ -v`: final result **43 passed** in 6.00 seconds. The initial baseline before this execution was 38 passed. A first post-change run found failures (hold rejection order and score thresholds after separating attempt amounts); these were corrected.
- `pytest tests/test_safety_invariants.py -v`: **3 passed**.
- `npm run build` in `frontend/`: passed (TypeScript + Vite; 1613 modules).
- `npm run build` in `website/`: passed (TypeScript + Vite; 89 modules).
- `python -m backend.app.ml.benchmark`: intentionally exits with a withdrawal error; it does not produce metrics or write the legacy result artifact.
- `git diff --check`: passed after removing trailing whitespace from modified files.
- SQLite database integrity: read-only `PRAGMA integrity_check` returned `ok`. Tests exercised the default application DB; no database or WAL files were deleted.

## Regression and scope notes

- A post-change full test run initially found failures; all were corrected, and the final complete suite passed.
- The uncommitted worktree existed before this execution and included numerous edits. No pre-existing user files were reverted. No files were staged or committed.
- The SQLite database and WAL files were present; tests used the application DB. Integrity was checked read-only and returned `ok`. No database files were deleted.
- No live APIs, banking services, external institutions, or credentials were used.
