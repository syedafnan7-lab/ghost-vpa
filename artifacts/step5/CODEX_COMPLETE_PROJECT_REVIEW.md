# Codex Complete Project Review

**Review date:** 17 November 2026  
**Repository:** `C:\Users\HP\ghost-vpa`  
**Reviewed commit:** `61c86a3` (`main`, five commits ahead of `origin/main` at review start)  
**Scope:** Local repository review and safe prototype corrections. No bank or payment network access.

## Executive review

Ghost-VPA is a simulation prototype for exploring whether bank-controlled canary payment identifiers could provide an additional interaction signal for temporal graph investigations. It is not a deployed bank product, does not connect to UPI/IMPS/NPCI or payment gateways, and has no validated real-world fraud detection performance.

The project has a working FastAPI + SQLite/WAL backend, a React/Vite analyst UI, a separate Vite website, a NetworkX in-memory temporal graph, a simulator, an audit chain, prototype STIX output, and synthetic scenarios. The useful engineering core is strongest in the deterministic scenario workflows and safety boundary. The weakest areas were overstated benchmark claims, payment event semantics, unauthenticated case actions, and historical documentation that presented proposals as operational capabilities.

## Architecture map

- `backend/app/main.py`: FastAPI lifecycle, startup DB initialization and graph rehydration, router registration.
- `backend/app/api/`: ingestion, simulation control, canary registry, graph, cases, benchmark, audit, and websocket routes.
- `backend/app/schemas/`: Pydantic event, graph, case, alert, audit, and benchmark types.
- `backend/app/db/`: SQLAlchemy models and async SQLite session/bootstrap code. The graph itself is in-memory; recent event rows rebuild it at startup.
- `backend/app/core/`: configuration, synthetic canary registry, simulation clock, and chained audit logger.
- `backend/app/graph/temporal_engine.py`: NetworkX `MultiDiGraph`, 72-hour pruning, reverse propagation, feeder attribution, motifs, bounded ego graph.
- `backend/app/simulator/rail.py`: synthetic traffic and scenarios A–D; no external payment transport.
- `backend/app/ml/`: synthetic dataset generator and legacy LightGBM benchmark. The benchmark is now disabled because its data and split do not support its claims.
- `backend/app/threat_intel/stix_exporter.py`: prototype STIX-like case bundle generation; standards validation and production sharing are not established.
- `frontend/src/`: React dashboard, live monitor, network explorer, investigation workbench, canary registry, benchmark panel, API client, and shared types.
- `website/src/`: separate marketing/demo site with scenario, graph, dossier, architecture, boundary, evidence, and benchmark sections. The invalid benchmark display is replaced with a withdrawal notice.
- `docs/`: architecture, assumptions, threat model, privacy, data dictionary, benchmark, runbook, pitch, integration boundaries, and remediation history.
- `tests/`: audit-chain, benchmark state, graph, simulation clock, STIX, safety, and triage tests.
- `artifacts/step5/`: Stage 1/2 audits and registers, Gemini reviews, probes, and implementation report.

## Historical work reviewed

### Step 1 — Repository reality audit

`artifacts/step5/01_REPOSITORY_REALITY_AUDIT.md` and `01A`–`01D` found a sound zero-real-funds simulation boundary, synthetic IDs, working audit chain, tripwire triage, and usable app shell. The audit also found the old benchmark did not build a graph, had no timestamps, used label-conditioned generated features, and mislabeled a row split as chronological. It found that the original CS-LP direction was defective, attribution columns were unwritten, graph state was not persisted, and authentication was absent. The reports explicitly corrected earlier probe mistakes and should be read with their source registers.

### Step 2 — Competitive and judging research

`02_STAGE2_COMPETITIVE_AND_JUDGING_ANALYSIS.md` plus `02_STAGE2_SOURCE_REGISTER.md` narrow the proposed differentiation to a bank-side canary interaction signal that could seed graph investigation, complementary to existing fraud platforms. They also caution that generic “honeypot for mule detection” is not novel, central-bank and bank programs already cover broad graph, scoring, registry, and case-management capabilities, and several competitor/legal claims need careful sourcing. External competitor findings are inherited from the Stage 2 source register and were not independently re-established in this local code review.

### Step 5 and Gemini

The `artifacts/step5/` tree contains the source registers, Stage 1/2 outputs, Gemini canary discoverability review, technical red-team, claim/evidence register, competitive-value reports, final strategic correction, and Priority 0 implementation report. The expected `.gemini/antigravity-cli/brain/` directory is absent in this checkout; the corresponding independent Gemini summaries are present under `artifacts/step5/`. The scratch probes are present and were treated as supporting evidence, not authoritative product behavior.

Gemini’s core implementation claims are partly confirmed by the current code and tests: backward propagation, upstream feeder attribution storage, case fields, event-type schema, 72-hour startup rehydration, and UI attribution display exist. However, the prior report overstates completion: the original benchmark remained exposed through a cached API and UI, `PAYMENT_ATTEMPT` was still given a financial amount, the hold gate trusted `X-User-Role`, and the website repeated withdrawn metrics. Those gaps are corrected or explicitly registered below. The `+0.5964` synthetic separation is not a generalization result.

## Current repository state and evidence

- Initial `git status`: branch `main`, five commits ahead of `origin/main`; numerous modified files and untracked `artifacts/step5/` and `tests/test_graph_priority0_remediation.py` were already present. Those changes were preserved; no reset, clean, commit, or push was performed.
- A local SQLite database exists at `data/ghost_vpa.db` with WAL/SHM files. Tests exercised the default application database; no database files were deleted. A read-only integrity check returned `ok`. The benchmark endpoint no longer reads or writes its cached artifact.
- Before corrections, the complete suite reported 38 passing tests. After corrections, the complete suite passed 43 tests and the safety suite passed 3 tests.
- Frontend and website production builds both succeeded after the final UI and copy corrections (1613 and 89 modules respectively).
- The simulator has no live financial SDK or payment connection. The safety invariant suite passed.

## Corrections made in this execution

- `CREDIT_CONFIRMED` is the only event type that contributes an amount to graph fund-flow edges. `PAYMENT_ATTEMPT` remains a typed, zero-flow interaction edge; a direct canary attempt can still seed investigation. Synthetic completed-transfer scenarios are explicitly marked confirmed.
- Graph response edges expose `event_type` and `is_financial`; the explorer renders non-financial events with dashed lines.
- Case attribution filters transfer evidence by event time, the active graph window, confirmed status, and positive amount. Feeder structural amplification counts distinct suspect beneficiaries rather than parallel event edges.
- All case mutation requests return HTTP 503 before database access regardless of spoofed role/actor fields; the UI disables those actions. This is a deny-safe prototype boundary, not replacement authentication.
- The benchmark API, runner, CLI, frontend panel, and website benchmark section no longer serve or imply historical results. Results and methodology documents now state withdrawal and replacement criteria.
- README, pitch, demo runbook, security/privacy, threat-model, and website claims were revised to distinguish synthetic behaviors, proposals, prototypes, and absent integrations.

## Material limitations

- There is no authentication provider. Case mutations are disabled, but read endpoints are unauthenticated and the API is not production safe.
- Event ingestion is not fully idempotent or transactional across SQL and the in-memory graph. Duplicate event IDs can still fail persistence after graph mutation; restart rebuild consistency and concurrent writes need work.
- Case attribution uses a short, topology-based predecessor search. `connected_mule_count` is a legacy field and can include accounts linked by shared funding; it should be interpreted as connected accounts, not verified mules. Cluster IDs can change as membership changes.
- The graph is process-local. SQLite/WAL is the only configured store; no PostgreSQL, Neo4j, worker queue, SHAP, GNN, or live IAM integration is present.
- Motif thresholds and temporal edge handling need more boundary tests. Reversal evidence is not retained as a netted ledger; it removes the matching in-memory edge when found.
- CORS defaults to the local Vite origins; deployment origin values still need review. Read APIs remain unauthenticated, and benchmark generation code remains in the repository as disabled historical implementation.
- STIX output has a passing local bundle test but no independent STIX validator or redaction audit. FIU/NCRP outputs remain prototype previews only.
- Website scenarios and dossier visualizations include local illustrative data; they are not evidence from live backend integration.
- The current graph suite proves selected hand-built topology behaviors only. It does not establish precision, false-positive rate, model calibration, or field performance.
- The September 2026 RBI KYC amendment directions are referred to as a draft proposal. No institutional authorization, RBI/NPCI approval, or bank pilot is claimed.

See `CODEX_ENGINEERING_EXECUTION_REPORT.md` for changes and verification, and `CODEX_REMAINING_WORK_REGISTER.md` for acceptance criteria.
