# STEP 5 — STAGE 1 SOURCE REGISTER

**Audit type:** Repository reality audit (read-only analysis of tracked sources)
**Audit date:** 2026-11-15 → 2026-11-16
**Working directory:** `C:\Users\HP\ghost-vpa`
**Branch:** `main` (HEAD `61c86a3`)

Every claim in the Stage 1 reports is traceable to an entry below. No external
network sources were used in Stage 1; all evidence is local and reproducible.

---

## 1. Repository source files inspected

| # | Path | Lines | What was verified |
|---|---|---|---|
| S1 | `backend/app/ml/dataset_generator.py` | 191 | Benchmark corpus construction, label-conditional feature bands, absence of timestamps, return order |
| S2 | `backend/app/ml/benchmark.py` | 269 | 3-way evaluation, split protocol label, feature lists, no graph usage, docs side-effect write |
| S3 | `backend/app/graph/temporal_engine.py` | 317 | CS-LP propagation direction, motif thresholds, ego-graph bounding, `FEEDER_NODE` reclassification |
| S4 | `backend/app/api/ingestion.py` | 191 | Canary O(1) check, hardcoded alert/case fields |
| S5 | `backend/app/api/cases.py` | 150 | `X-User-Role` gate, unpopulated attribution fields |
| S6 | `backend/app/main.py` | 67 | CORS hardcoding, router registration, no auth |
| S7 | `backend/app/core/config.py` | — | `SIMULATION_MODE_ONLY`, `ALLOW_REAL_PAYMENT_RAILS=False`, `CORS_ORIGINS` dead config |
| S8 | `backend/app/core/audit_logger.py` | 147 | SHA-256 chain, `canonical_timestamp` |
| S9 | `backend/app/db/models.py` | 91 | 5 models; attribution columns present but unpopulated |
| S10 | `backend/app/threat_intel/stix_exporter.py` | — | Template contents, no redaction, hardcoded confidence |
| S11 | `backend/app/simulator/rail.py` | 234 | ID formats, entity resolution, no hashing |
| S12 | `backend/app/api/benchmark.py` | 11 | `run_benchmark()` called in async handler |
| S13 | `backend/app/api/websocket.py` | 16 | WS endpoint |
| S14 | `backend/app/api/websocket_manager.py` | 25 | Broadcast manager |
| S15 | `backend/app/api/{canaries,graph,audit,sim_control}.py` | — | Route inventory |

## 2. Documentation files inspected

| # | Path | Claim compared against code |
|---|---|---|
| D1 | `AGENTS.md` | Over-describes codebase (claims vs actual) |
| D2 | `README.md` | Headline metrics 99.5% / +27.1% / −94.4% |
| D3 | `docs/benchmark-results.md` | Same headline metrics |
| D4 | `docs/benchmark-methodology.md` | "No single feature encodes the label"; "strict chronological split" |
| D5 | `docs/judge-pitch.md` | Pitch claims |
| D6 | `concepts_brief.md` | Concept claims |
| D7 | `docs/designs/ghost-vpa-architecture.md` | Async worker pool, motif thresholds ≥4/≥5, convergence <10⁻⁴, parquet artifact |
| D8 | `docs/research/research-register.md` | Neo4j/PyG/TGN "Adopted"; CS-LP >92% precision |
| D9 | `docs/threat-model.md` | `require_role` guards; STIX sanitisation |
| D10 | `docs/security-and-privacy.md` | RBAC as simulated gating |
| D11 | `docs/production-integration-boundaries.md` | Suspense GL code, adapter status |
| D12 | `docs/demo-runbook.md` | On-stage visual promises |
| D13 | `docs/remediation/remediation-register.md` | "REM-01 Fixed & Verified / Zero oracle features" |
| D14 | `artifacts/verification/2026-11-14/FINAL-VERIFICATION-REPORT.md` | "VERIFIED FOR HACKATHON DEMONSTRATION"; "8 tests pass"; STIX "validated" |
| D15 | `artifacts/verification/2026-11-14/04-benchmark-reproduction.md` | Original leakage finding, superseded |
| D16 | `briefs/source_brief.md` | PostgreSQL/Neo4j/Cypher exporter claims |
| D17 | `frontend/src/components/ModelBenchmarking.tsx` | Live metric display, hardcoded 20.1/17.2/12.1 fallbacks |
| D18 | `frontend/src/components/InvestigationWorkbench.tsx` | Case dossier UI |
| D19 | `frontend/src/services/api.ts` | API client, role header |

## 3. Tests executed

| # | Command | Result |
|---|---|---|
| T1 | `pytest tests/ -v` | **23/23 pass in 12.02s** (exit 0) |
| T2 | `pytest tests/ --collect-only -q` | 23 tests collected |
| T3 | `pytest tests/test_benchmark_metrics.py -q` | 1 passed — **and mutates a tracked docs file** |
| T4 | `cd frontend && npm run build` | exit 0, 4.44s, 1613 modules, 313.42 kB JS |
| T5 | `python -m backend.app.ml.benchmark` | runs, writes `docs/remediation/latest-benchmark-results.json` |

## 4. Reproducible probes executed (all under `artifacts/step5/scratch/`)

| # | Script | Deliverable it supports |
|---|---|---|
| P1 | `benchmark_leakage_probe.py` | B — initial run; exposed the generator return-order trap and my own probe bug |
| P2 | `probe8_detection_validity.py` | B — deliverable analyses A–D (final numbers) |
| P3 | `probe9_graph_and_identifiers.py` | A (no graph built), C (identifier handling) |
| P4 | `route_inventory_correct.py` | A (route + auth inventory) |
| P5 | `security_probe.py` | A (superseded — see P6) |
| P6 | `security_probe2.py` | A — corrected; CORS preflight evidence |
| P7 | `router_registration_probe.py` | A — diagnosed the `_IncludedRouter` route-mount anomaly |
| P8 | `stix_probe.py` | C — STIX validity, sanitisation, confidence |
| P9 | `out_probe8.txt`, `out_probe9.txt` | Captured raw outputs |

## 5. Commands used for state verification

```bash
git status --short
git diff --stat
git diff docs/remediation/latest-benchmark-results.json
git checkout docs/remediation/latest-benchmark-results.json
git log --oneline -5
python -I <probe>.py
```

## 6. Deliberately NOT done

- No file under `backend/`, `frontend/`, `website/`, `docs/`, `tests/`, `briefs/`,
  `concepts_brief.md`, `AGENTS.md`, or any tracked source was created, edited,
  reverted, or deleted.
- `docs/remediation/latest-benchmark-results.json` was in one place overwritten
  **by the repository's own code** (`benchmark.py:238`) as a side effect of
  running its test suite; I restored it to its committed state with
  `git checkout` and recorded the event in Deliverable D.
- No live payment, network, or banking endpoint was contacted.