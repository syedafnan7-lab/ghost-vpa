# Ghost-VPA: Bank-Controlled Honeypot VPAs & Canary-Seeded Graph Intelligence

[![Track](https://img.shields.io/badge/Track-Digital%20Payments%20Fraud-blue)](https://fintech-hackathon.aimit.edu.in)
[![Hackathon](https://img.shields.io/badge/AIMIT%20×%20St%20Aloysius%20×%20RBIH-FinTech%20Hackathon%202026-orange)](https://fintech-hackathon.aimit.edu.in)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com)

> **Ghost-VPA** is a bank-controlled CBS/PSP fraud-intelligence layer that uses bank-designated regulatory honeypot VPAs as canary endpoints. By coupling instant tripwire detection with canary-seeded temporal graph analytics, Ghost-VPA intercepts and exposes money-mule rings before stolen funds can be cashed out—without modifying NPCI's core UPI switch or minting synthetic KYC accounts.

---

## 1. Key Value Proposition & Problem Solved

- **The Problem:** Domestic payments fraud in India exploits rapid multi-hop UPI and IMPS layering. Stolen funds move through dormant "sleeper" mule accounts and exit via ATMs within minutes. Transaction-by-transaction anomaly models suffer from $>70\%$ false-positive rates, mistakenly freezing innocent citizens while missing upstream syndicate feeder hubs.
- **The Solution:** Ghost-VPA introduces active cyber-deception into domestic banking rails. Bank-designated and customer-consented canary VPAs (under the RBI September 2026 Draft KYC Directions Annex III SOP) act as high-confidence tripwires.
- **The Result:**
  - **$< 5\text{ ms}$** instant tripwire alert on canary interaction.
  - **Zero Real Funds Movement** (quarantined in internal suspense ledger).
  - **Canary-Seeded Graph Propagation** traces connected accounts, upstream feeders, and layering chains across a 72-hour temporal window.
  - **$> 94\%$ Precision** and **$> 73\%$ reduction in false-positive alerts** over tabular baselines on a 100,000-node benchmark.

---

## 2. Inviolable Compliance Invariants

1. **Zero Real Fund Movement:** Completely simulated payment rail; no live switch connections, no live penny-drops, no escrow cash movement.
2. **KYC & PMLA Compliance:** No synthetic customer KYC profiles or fake identity documents. All demo entities use pseudonymous identifiers (`ACCT_SYNTH_XXXX`).
3. **Proportionate Triage (No Auto-Guilt):** Canary hits mark senders as `REVIEW_REQUIRED`. Formal holds and outreach are governed by human supervisors under the RBI 20-day customer explanation window.
4. **Zero NPCI Switch Changes:** Operates purely as an internal CBS/PSP sidecar.

---

## 3. Four-Tier Architecture

```
[ Tier 1: Simulation & Ingestion ]
  Deterministic Rail Simulator • SimulationClock Singleton • O(1) Canary Registry • Fast Triage (<2ms)
                   │
                   ▼
[ Tier 2: Graph & ML Analytics ]
  NetworkX MultiDiGraph • 72h Sliding Window • Temporal Motifs • Canary-Seeded LP • LightGBM
                   │
                   ▼
[ Tier 3: Persistence & Dossier Engine ]
  Async SQLite (WAL Mode) • Chained Cryptographic Audit Trail • RBI 60-Day SOP Cases • STIX 2.1
                   │
                   ▼
[ Tier 4: Analyst Presentation Workbench ]
  Operations & Live Triage Feed • Interactive D3 Network Explorer • Model Benchmark Studio
```

---

## 4. Quick Start & Execution Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node.js v24.18)

### Installation
```bash
# 1. Clone or navigate to the repository
cd ghost-vpa

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Platform
```bash
# Option A: Run the one-click startup batch script
.\start-ghostvpa.bat

# Option B: Run services in two separate terminals
# Terminal 1: Backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser. API docs available at **`http://localhost:8000/docs`**.

---

## 5. Four Demonstration Scenarios

1. **Scenario A — Honeypot Tripwire:** Synthetic sender attempts transfer to `canary.trap.01@icixbank`. Instant alert triggers in $<5\text{ms}$, sender marked `REVIEW_REQUIRED`, zero funds moved.
2. **Scenario B — Shared Upstream Feeder:** Three distinct mules target two different canaries. Graph analytics traces backward to unmask a single upstream syndicate feeder node (`FEEDER_SYNTH_007`).
3. **Scenario C — Benign Lookalike (False-Positive Reduction):** High-volume bursty merchant activity mimics fraud on transaction rules; graph engine proves zero connectivity to syndicate clusters, preventing a wrongful hold.
4. **Scenario D — Multi-Hop Layering Chain:** A 4-hop syndicate transfer sequence ($Feeder \to Mule_1 \to Mule_2 \to Mule_3 \to Canary$) reveals inter-hop delta-t velocity ($< 15\text{ mins}$) and amount conservation.

---

## 6. Testing & Benchmarking

```bash
# Run complete test suite (unit, integration, safety invariants)
pytest tests/ -v

# Run 100,000-node ML benchmark evaluation
python -m backend.app.ml.benchmark
```

---

## 7. Documentation Directory

- [ghost-vpa-architecture.md](file:///C:/Users/HP/ghost-vpa/docs/designs/ghost-vpa-architecture.md): Full system specification.
- [research-register.md](file:///C:/Users/HP/ghost-vpa/docs/research/research-register.md): Regulatory & academic research matrix.
- [imported-tools-and-licenses.md](file:///C:/Users/HP/ghost-vpa/docs/research/imported-tools-and-licenses.md): Third-party software inventory.
- [scope-and-assumptions.md](file:///C:/Users/HP/ghost-vpa/docs/scope-and-assumptions.md): In-scope vs out-of-scope boundaries.
- [data-dictionary.md](file:///C:/Users/HP/ghost-vpa/docs/data-dictionary.md): Comprehensive entity schemas.
- [threat-model.md](file:///C:/Users/HP/ghost-vpa/docs/threat-model.md): STRIDE threat assessment.
- [security-and-privacy.md](file:///C:/Users/HP/ghost-vpa/docs/security-and-privacy.md): Privacy-by-design & RBAC.
- [benchmark-methodology.md](file:///C:/Users/HP/ghost-vpa/docs/benchmark-methodology.md): 100,000-node evaluation design.
- [benchmark-results.md](file:///C:/Users/HP/ghost-vpa/docs/benchmark-results.md): Empirical test metrics & confusion matrices.
- [production-integration-boundaries.md](file:///C:/Users/HP/ghost-vpa/docs/production-integration-boundaries.md): Bank CBS sidecar integration plan.
- [demo-runbook.md](file:///C:/Users/HP/ghost-vpa/docs/demo-runbook.md): Live presentation walkthrough.
- [judge-pitch.md](file:///C:/Users/HP/ghost-vpa/docs/judge-pitch.md): Hackathon pitch strategy & Q&A.
