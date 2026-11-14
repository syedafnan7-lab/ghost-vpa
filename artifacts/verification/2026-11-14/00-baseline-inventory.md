# Phase 0: Baseline Inventory & Environment Freeze

**Target Repository:** `C:\Users\HP\ghost-vpa`  
**Reported Branches:** `main` (active), `feature/ghost-vpa-canary-engine`  
**Audit Timestamp:** 2026-11-14T23:05:00+05:30  
**Auditor Mode:** Read-Only Verification Audit  

---

## 1. Git State & Repository Identity

| Field | Value | Verification Status |
|---|---|---|
| **Repository Root** | `C:\Users\HP\ghost-vpa` | VERIFIED |
| **Active Branch** | `main` (tracks `origin/main`) | VERIFIED |
| **Feature Branch** | `feature/ghost-vpa-canary-engine` | VERIFIED (commit `c7250b0`) |
| **HEAD Commit** | `dd86446` (`feat(core): complete Ghost-VPA...`) | VERIFIED |
| **Working Tree Status** | Clean (0 uncommitted changes, 0 staged changes) | VERIFIED |
| **Remote URL** | `https://github.com/syedafnan7-lab/ghost-vpa.git` | VERIFIED (Fetch & Push configured) |
| **Total Tracked Files** | Exactly 77 files | VERIFIED (`git ls-files | wc -l == 77`) |

---

## 2. Runtime & Hardware Baseline

- **Operating System:** Microsoft Windows 11 Home Single Language (Build 26300)
- **Host Architecture:** x86_64, AMI F.15 BIOS
- **Total Physical Memory:** 15,599 MB (~16 GB RAM)
- **Python Version:** Python 3.12.10 (`C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe`)
- **Node.js Version:** v24.18.0
- **npm Version:** 11.16.0
- **Key Installed Packages:**
  - `fastapi 0.162.2`, `uvicorn 0.54.0`
  - `aiosqlite 0.22.1`, `SQLAlchemy 2.1.8`
  - `networkx 3.7`, `lightgbm 4.7.0`, `scikit-learn 1.9.1`, `pandas 3.1.1`, `numpy 2.5.4`
  - `stix2 3.0.2`, `stix2-patterns 2.1.2`
  - `pytest 9.2.0`, `ruff 0.17.4`, `semgrep 1.184.0`

---

## 3. Inventory of Tracked Source Files (77 Files)

### Configuration & Root (7 files)
- `.env.example`, `.gitignore`, `AGENTS.md`, `LICENSE`, `README.md`, `concepts_brief.md`, `pytest.ini`

### Briefs & Launchers (4 files)
- `briefs/Ghost-VPA Concept Note.pdf`
- `briefs/Ghost-VPA_One-Page_Hackathon-Writeup.pdf`
- `briefs/source_brief.md`
- `start-ghostvpa.bat`

### Backend Subsystems (28 files)
- `backend/requirements.txt`, `backend/app/main.py`
- Core: `config.py`, `honeypot_registry.py`, `simulation_clock.py`, `audit_logger.py`
- DB: `models.py`, `session.py`
- Graph: `temporal_engine.py`
- ML: `benchmark.py`, `dataset_generator.py`
- Simulator: `rail.py`
- Threat Intel: `stix_exporter.py`
- API Routers: `ingestion.py`, `sim_control.py`, `canaries.py`, `graph.py`, `cases.py`, `benchmark.py`, `audit.py`, `websocket.py`, `websocket_manager.py`
- Schemas: `events.py`, `alerts.py`, `canary.py`, `cases.py`, `graph.py`, `benchmark.py`, `audit.py`

### Documentation (13 files)
- `docs/designs/ghost-vpa-architecture.md`
- `docs/research/research-register.md`, `docs/research/imported-tools-and-licenses.md`
- `docs/benchmark-methodology.md`, `docs/benchmark-results.md`
- `docs/data-dictionary.md`, `docs/demo-runbook.md`, `docs/judge-pitch.md`
- `docs/production-integration-boundaries.md`, `docs/scope-and-assumptions.md`
- `docs/security-and-privacy.md`, `docs/threat-model.md`

### Frontend Application (20 files)
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/index.html`
- `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`
- Components: `Navbar.tsx`, `OperationsDashboard.tsx`, `LiveEventMonitor.tsx`, `NetworkExplorer.tsx`, `InvestigationWorkbench.tsx`, `HoneypotRegistry.tsx`, `ModelBenchmarking.tsx`, `SecurityAuditLogs.tsx`
- Services & Types: `services/api.ts`, `types/index.ts`

### Test Suite (5 files)
- `tests/test_safety_invariants.py`
- `tests/test_temporal_graph.py`
- `tests/test_triage_engine.py`
- `tests/test_benchmark_metrics.py`
- `tests/test_stix_exporter.py`

**Audit Baseline Freeze Status:** Confirmed and Frozen.
