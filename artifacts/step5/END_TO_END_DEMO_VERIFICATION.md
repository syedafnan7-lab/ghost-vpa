# Ghost-VPA End-to-End Demo Verification

**Verification date:** 2026-11-17  
**Branch:** `c-improvements`  
**Baseline commit:** `15f6c3f` — `Harden Ghost-VPA simulation prototype`

## Repository baseline and scope

At the start of this task, the worktree was on `c-improvements` at `15f6c3f`. The two recent corrections in `backend/app/graph/temporal_engine.py` (timezone-safe graph timestamps) and `frontend/src/components/NetworkExplorer.tsx` (legend terminology and removed explanatory paragraph) were present and retained. The attached historical research and Step 5 reports listed in the request were present; `.gemini/antigravity-cli/brain` and its referenced historical handover were not present. No existing report was overwritten.

The end-to-end work adds deterministic scenario execution, event lifecycle provenance, case evidence retrieval, graph fixes, and UI data integration. A later graph visibility correction chooses a graph-backed case entity instead of the absent sample account, and sizes the SVG to the available canvas beside the evidence drawer. The legend remains **“Suspected Mule (triage flag)”**; the longer explanatory paragraph remains removed.

The original `data/ghost_vpa.db` was not used or modified. Runtime and test verification used isolated SQLite databases under `data/`. No commit or push was performed; the worktree also contained broad implementation changes, so a blanket commit would not meet the request to avoid committing unrelated work.

## Runtime configuration

- Backend: `http://127.0.0.1:8000/`, running the current code with `SIMULATOR_AUTOSTART=false` and isolated database `data/ghost_vpa_demo_e2e_run.sqlite3`.
- Frontend: `http://127.0.0.1:5173/`.
- Isolated API/restart validation: port `8001`, database `data/ghost_vpa_step5_api.sqlite3`, also with `SIMULATOR_AUTOSTART=false`.
- Unit suite and safety suite used separate isolated SQLite files. No live banking or payment service was configured.

## Deterministic scenario and event sequence

The real scenario runner is Scenario E (`DEMO-E2E-20261114`). It registers the reserved synthetic canary idempotently, sorts the six stable events chronologically, and calls the production application ingestion function for each event. It does not seed the case or graph directly.

| Time (UTC) | Stable event ID | Type | Synthetic flow | Amount |
|---|---|---|---|---:|
| 09:01 | `DEMO-E2E-20261114-01-FEEDER-MULE-101` | `CREDIT_CONFIRMED` | `FEEDER_SYNTH_007` → `MULE_SYNTH_101` | ₹50,000 |
| 09:02 | `DEMO-E2E-20261114-02-FEEDER-MULE-102` | `CREDIT_CONFIRMED` | `FEEDER_SYNTH_007` → `MULE_SYNTH_102` | ₹48,000 |
| 09:05 | `DEMO-E2E-20261114-03-MERCHANT-PAYMENT` | `CREDIT_CONFIRMED` | `MULE_SYNTH_101` → `MERCHANT_SYNTH_900` | ₹18,000 |
| 09:08 | `DEMO-E2E-20261114-05-MULE-102-CANARY` | `PAYMENT_ATTEMPT` | `MULE_SYNTH_102` → `CANARY_VPA_001` | ₹9,000 |
| 09:09 | `DEMO-E2E-20261114-04-MULE-101-CANARY` | `PAYMENT_ATTEMPT` | `MULE_SYNTH_101` → `CANARY_VPA_001` | ₹12,000 |
| 09:10 | `DEMO-E2E-20261114-06-CUSTOMER-CANARY` | `PAYMENT_ATTEMPT` | `CUSTOMER_SYNTH_901` → `CANARY_VPA_001` | ₹250 |

All identifiers and VPAs use synthetic or `.test` data. Confirmed credits are simulated ledger relationships; canary attempts are pre-routing tripwires with zero funds transferred.

## Ingestion and event lifecycle

The API validated all six lifecycle types through `POST /api/v1/simulate/attempt` on the isolated service:

| Event type | Observed handling |
|---|---|
| `IDENTIFIER_DISCOVERY` | `PROCESSED`; retained as non-financial provenance. |
| `BENEFICIARY_VALIDATION` | `PROCESSED`; retained as non-financial provenance. |
| `PAYMENT_ATTEMPT` | `PROCESSED`; retained distinctly from confirmed credit. It is the only event type allowed to seed a canary tripwire. |
| `CREDIT_CONFIRMED` | `PROCESSED`; records the completed directed fund-flow edge. |
| `PAYMENT_DECLINED` | `PROCESSED`; no completed-transfer edge. |
| `PAYMENT_REVERSED` | `PROCESSED`; linked to the matching confirmed credit; original graph credit marked reversed and excluded from active attribution. |

The six additional lifecycle API records used `LIFECYCLE-*` IDs and synthetic participants. The reversal test confirmed `original_event_id=LIFECYCLE-CREDIT_CONFIRMED`. Across scenario E, only its three canary `PAYMENT_ATTEMPT` events created tripwire alerts/cases. A confirmed credit to a canary is rejected by the ingestion contract.

## Graph, attribution, and case results

The isolated fresh API execution of Scenario E returned six event IDs, three distinct cases, and a primary case for `MULE_SYNTH_101`. The ego graph around that account returned 10 nodes and 12 edges immediately after scenario execution, including the feeder, both mules, the canary VPA, the merchant, and the separate customer. Rehydration after backend restart returned 12 nodes and 24 edges after the six lifecycle events had also been ingested.

The implemented temporal graph method is documented in code as **Canary-Seeded Label Propagation (DU-RLP)**. On the primary mule case it derived:

- `upstream_feeder_account`: `FEEDER_SYNTH_007`
- `connected_mule_count`: `1`
- `cluster_id`: `CLUST-SYN-81684F1E`
- sibling account: `MULE_SYNTH_102`
- evidence IDs: both confirmed feeder credits, the separate merchant payment, and both mule canary attempts.

The merchant appears as a downstream beneficiary in the graph and evidence, not as an upstream feeder candidate or mule. The customer canary interaction created its own `OPEN_TRIAGE` review case, with no feeder, no cluster, and zero connected mule count. This remains a review signal rather than a guilt finding or automatic freeze. A shared device alone does not create a mule cluster; a dedicated graph contract test covers this.

Scenario replay returned `DUPLICATE` for all six event IDs. Case count remained three. The ingestion idempotency contract also rejects the same event ID with a different payload (HTTP 409). The graph tests cover multi-hop paths, multiple feeders, cycles, event provenance, reversed/future credits, and downstream merchant separation.

## Persistence, APIs, and restart

The primary API validation used the real scenario endpoint `POST /api/v1/sim/control` with `{ "action": "run_scenario", "scenario": "E" }`. It then retrieved cases through `GET /api/v1/cases`, evidence through `GET /api/v1/cases/{case_id}/evidence`, alerts through `GET /api/v1/alerts`, and graph data through `GET /api/v1/graph/ego/{entity_id}`.

On the isolated API database, SQLite contained 12 event rows (six scenario events plus six lifecycle events) and three cases. `PRAGMA integrity_check` returned `ok`. After a clean backend stop and restart against the same file, the case list still returned all three cases; the primary case retained `FEEDER_SYNTH_007`, one connected mule, and `CLUST-SYN-81684F1E`. Its evidence endpoint still returned five source events. Graph rehydration reconstructed the mule/feeder/merchant/canary neighborhood and retained the reversal link and `is_reversed` state.

The alert route was added to the current API. The existing port 8000 process had been started from an older code load; after restarting it against the same isolated database, the alert endpoint returned the persisted alert and the browser console showed no request errors.

## Frontend verification

The live React dashboard was opened at `http://127.0.0.1:5173/`. The graph navigation selected a persisted case account (`MULE_SYNTH_101`) rather than the stale sample ID absent from the database. The browser DOM showed **9 graph nodes and 13 edges** for the current UI database; these are API-derived SVG marks, not a frontend fixture. The SVG now occupies the space beside the evidence drawer. The graph legend displayed “Suspected Mule (triage flag)” and did not display the removed “not a confirmed finding” paragraph.

Scenario E is available from the dashboard as **Run End-to-End**. It refreshes persisted cases and graph summary and opens the primary case in the Workbench. The Workbench retrieves case evidence from the API and displays event IDs, timestamps, directions, types, amounts, and results. Graph edges retain event IDs and reversal provenance in SVG titles. The dashboard’s graph, edge, case, canary, and alert values are API-backed.

The frontend code now chooses the first case with feeder or connected-mule attribution as its initial graph focus, falling back to the first persisted case when none has attribution. The SVG uses a shrinkable flex canvas so D3 lays out nodes in the visible space rather than centering them behind the drawer.

## Validation results

- `pytest tests/ -v`: **49 passed** (5.72 s), with isolated `DATABASE_URL`.
- `pytest tests/test_safety_invariants.py -v`: **3 passed** (0.24 s), with isolated `DATABASE_URL`.
- Frontend `npm run build`: TypeScript and Vite production build passed (1,613 modules).
- Website `npm run build`: TypeScript and Vite production build passed (89 modules).
- `python -m compileall -q backend`: passed.
- `git diff --check`: passed; Git emitted only its LF-to-CRLF working-copy notices for files with existing line ending settings.
- SQLite integrity and restart checks: passed on isolated demo database.
- Browser integration: current local UI loaded cases, alerts and graph; 9 nodes and 13 edges were rendered. The initial browser visit had 404s against the old backend process; restarting the current backend removed those errors.

## Safety verification

The three safety invariant tests passed. `ALLOW_REAL_PAYMENT_RAILS` remains false; no live UPI/IMPS API, ReqValAdd/ReqPay switch, payment SDK, or external payment gateway was added. Scenario records are synthetic. Canary attempts are review alerts with zero funds movement. There is no automatic account freeze. FIU/NCRP content remains preview-only; the application does not submit external filings. The September 2026 RBI KYC amendment directions continue to be labelled a draft proposal.

## Files changed for the end-to-end implementation

- Backend APIs and domain code: `backend/app/api/alerts.py` (new), `backend/app/api/cases.py`, `backend/app/api/ingestion.py`, `backend/app/api/sim_control.py`, `backend/app/core/audit_logger.py`, `backend/app/core/config.py`, `backend/app/core/honeypot_registry.py`, `backend/app/core/simulation_clock.py`, `backend/app/graph/temporal_engine.py`, `backend/app/main.py`, `backend/app/schemas/cases.py`, `backend/app/schemas/events.py`, `backend/app/schemas/graph.py`, and `backend/app/simulator/rail.py`.
- Frontend: `frontend/src/App.tsx`, `frontend/src/components/InvestigationWorkbench.tsx`, `frontend/src/components/LiveEventMonitor.tsx`, `frontend/src/components/NetworkExplorer.tsx`, `frontend/src/components/OperationsDashboard.tsx`, `frontend/src/services/api.ts`, and `frontend/src/types/index.ts`.
- Tests: `tests/test_e2e_investigation_contract.py` (new), `tests/test_simulation_clock.py`, and `tests/test_temporal_graph.py`.
- Documentation: this file and `artifacts/step5/DEMO_RUNBOOK.md`.

## Remaining defects and limitations

- This remains a local synthetic prototype, not a bank production service. API authorization is not integrated; consequential case actions are disabled. Do not expose the API publicly.
- The graph is process-local and reconstructed from the persisted 72-hour event window at startup. It is not a distributed graph store.
- The case listing and case-evidence routes are available, but there is no separate single-case dossier GET endpoint. The UI uses the case list plus the evidence route.
- The identified feeder is an evidence-supported candidate for analyst review, not a confirmed finding. Scoring is prototype research logic and is not calibrated for production decisions.
- `.gemini/antigravity-cli/brain` historical handover files referenced by the request were absent from the repository; this report records the files available during inspection.

## Local reproduction

See [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) for isolated database startup, deterministic execution, UI inspection, restart, and verification commands.

## Final Git status

Final branch remains `c-improvements`. The worktree is intentionally uncommitted. `git status --short --branch` reports these modified tracked files:

```text
backend/app/api/cases.py
backend/app/api/ingestion.py
backend/app/api/sim_control.py
backend/app/core/audit_logger.py
backend/app/core/config.py
backend/app/core/honeypot_registry.py
backend/app/core/simulation_clock.py
backend/app/graph/temporal_engine.py
backend/app/main.py
backend/app/schemas/cases.py
backend/app/schemas/events.py
backend/app/schemas/graph.py
backend/app/simulator/rail.py
frontend/src/App.tsx
frontend/src/components/InvestigationWorkbench.tsx
frontend/src/components/LiveEventMonitor.tsx
frontend/src/components/NetworkExplorer.tsx
frontend/src/components/OperationsDashboard.tsx
frontend/src/services/api.ts
frontend/src/types/index.ts
tests/test_simulation_clock.py
tests/test_temporal_graph.py
```

Untracked paths are `artifacts/step5/DEMO_RUNBOOK.md`, `artifacts/step5/END_TO_END_DEMO_VERIFICATION.md`, `backend/app/api/alerts.py`, `tests/test_e2e_investigation_contract.py`, `data/` (isolated local verification databases), and `.playwright-mcp/` (browser verification logs and snapshots). No files were staged or committed.
