# Ghost-VPA Demonstration Runbook & Presentation Guide

**Project:** Ghost-VPA  
**Hackathon:** St Aloysius × RBIH FinTech Innovation Hackathon 2026  
**Document:** `docs/demo-runbook.md`  
**Duration:** 4–6 Minutes Live Pitch & Demonstration  

---

## 1. Quick-Start Demonstration Commands

### Step 1: Environment Setup
```bash
# In repository root
cd C:\Users\HP\ghost-vpa

# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Install Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Launch Ghost-VPA Platform
```bash
# Option A: One-click launcher batch script (Windows)
.\start-ghostvpa.bat

# Option B: Manual terminal launches
# Terminal 1: Backend API (FastAPI)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend (Vite + React)
cd frontend
npm run dev
```

The application opens at `http://localhost:5173`. Backend docs available at `http://localhost:8000/docs`.

---

## 2. Four-Minute Live Judge Demonstration Script

### Minute 0:00 - 1:00: The Problem & The Deception Shift
- **Visual:** Operations Dashboard.
- **Narrative:**
  > *"Judges, domestic payment fraud in India moves faster than post-complaint freezes. By the time a victim files an NCRP complaint, stolen funds have been split across 4 hops of sleeper mule accounts and withdrawn at ATMs. Transaction-by-transaction anomaly models flag innocent merchants while missing upstream syndicate feeder hubs.
  > Under RBI's September 2026 Draft KYC Directions, banks must enforce 60-day time-bound holds with high-precision evidence.
  > Enter **Ghost-VPA**: bank-controlled regulatory canary VPAs deployed directly on domestic payment rails. Zero real money moves, zero synthetic KYC fabricated, and zero changes to NPCI's core UPI switch."*

### Minute 1:00 - 2:00: Scenario A — The Honeypot Tripwire
- **Action:** Open **Live Event Monitor**, click **"Run Scenario A: Canary Tripwire"**.
- **Visual:** A simulated transfer attempt targets `canary.trap.01@icixbank`.
- **Observation:**
  - In $< 5\text{ ms}$, the canary tripwire activates.
  - A crimson alert fires on screen.
  - The remitter account `ACCT_SYNTH_HDFX_9912` is instantly marked `REVIEW_REQUIRED`.
  - Point to the ledger invariant badge: **"ZERO FUNDS TRANSFERRED (Ring-Fenced Suspense)"**.

### Minute 2:00 - 3:15: Scenario B & Network Explorer — Upstream Feeder Unmasking
- **Action:** Click **"Run Scenario B: Shared Upstream Feeder"**, then navigate to **Network Explorer**.
- **Visual:** Interactive D3 force-directed graph renders the bounded ego network.
- **Key Interactions:**
  - Drag nodes, zoom in/out, scrub the **72-hour temporal slider**.
  - Show how 3 distinct mule accounts targeted two different canaries.
  - Click on the central purple feeder node: `FEEDER_SYNTH_007`.
  - Open the **Evidence Drawer**: Show how temporal delta-t velocity ($< 8\text{ mins}$) and shared device tokens connect the entire ring to one syndicate mastermind before cash-out.

### Minute 3:15 - 4:15: Scenario C — False-Positive Reduction & Investigation Case
- **Action:** Click **"Run Scenario C: Benign Merchant Lookalike"**.
- **Observation:** High-volume burst transactions mimic fraud, but the graph confirms zero connectivity to canaries or syndicate clusters. No wrongful freeze occurs!
- **Action:** Navigate to **Investigation Workbench**.
- **Visual:** Show the active Case Dossier:
  - RBI Annex III **60-Day SOP Countdown Timer** (59 days remaining).
  - **20-Day Customer Explanation Window** countdown.
  - Pre-generated **FIU-IND STR Narrative** and **NCRP-CFCFRMS JSON**.
  - Click **"Export STIX 2.1 Threat Intel Bundle"** to download the validated threat bundle.

### Minute 4:15 - 5:00: Model Benchmarking & Feasibility
- **Action:** Navigate to **Model Benchmarking**.
- **Visual:** Compare Tabular LightGBM Baseline vs Graph-Enhanced Challenger on the 100,000-node network.
- **Observation:**
  - Point to measured Precision ($> 92\%$), PR-AUC lift, and $> 70\%$ reduction in false-positive alerts.
  - Conclude with the Bank CBS Sidecar deployment architecture.
