# Phase 9: Reproducibility, Git State & Delivery Audit

**Target:** Setup instructions, startup scripts, and clean execution reproducibility  
**Timestamp:** 2026-11-14T23:07:15+05:30  

---

## 1. Documentation & Repository Consistency

| File | Claimed Purpose | Verified Reality | Status |
|---|---|---|---|
| `README.md` | Quickstart, architecture overview, safety invariants | Complete, contains exact setup commands, no placeholders | **PASS** |
| `AGENTS.md` | Autonomous agent boundaries | Explicitly prohibits live payments, fake KYC, and scraping | **PASS** |
| `.env.example` | Environment template | Present, contains zero leaked secrets, defaults to safe simulation | **PASS** |
| `docs/designs/ghost-vpa-architecture.md` | System architecture v2.0 | Incorporates all EGM Goldfish review resolutions | **PASS** |
| `docs/benchmark-results.md` | ML evaluation metrics | Contains benchmark table and confusion matrices | **PASS** |
| `docs/demo-runbook.md` | Prototype walkthrough | Step-by-step workflow guide with fallback options | **PASS** |
| `start-ghostvpa.bat` | One-click parallel launcher | Automates Uvicorn backend + Vite frontend startup | **PASS** |

---

## 2. Startup & Reproducibility Verification

- **Batch Startup Script:** `start-ghostvpa.bat` launches both processes in distinct command windows.
- **Backend Swagger UI:** Verified accessible at `http://localhost:8000/docs`.
- **Frontend Vite Server:** Verified accessible at `http://localhost:5173`.
- **No Hidden Steps:** No manual SQLite database migration scripts or untracked binary dependencies are required. The database tables, initial canary registry cache, and simulated rail self-initialize on application startup (`lifespan` in `backend/app/main.py`).
