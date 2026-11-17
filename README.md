# Ghost-VPA: Bank-Controlled Honeypot VPAs & Canary-Seeded Graph Intelligence

[![Track](https://img.shields.io/badge/Track-Digital%20Payments%20Fraud-blue)](https://fintech-hackathon.aimit.edu.in)
[![Hackathon](https://img.shields.io/badge/AIMIT%20×%20St%20Aloysius%20×%20RBIH-FinTech%20Hackathon%202026-orange)](https://fintech-hackathon.aimit.edu.in)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com)

> **Ghost-VPA** is a simulation prototype exploring bank-controlled canary payment identifiers and canary-seeded temporal graph investigation. It demonstrates synthetic interaction events, review triage, and graph-derived upstream candidates. It has no live bank, NPCI, UPI, IMPS, or payment-gateway integration; operational feasibility and detection value remain unvalidated.

---

## 1. Key Value Proposition & Problem Solved

- **The Problem:** Domestic payments fraud in India exploits rapid multi-hop UPI and IMPS layering. Stolen funds move through dormant "sleeper" mule accounts and exit via ATMs within minutes. Transaction-by-transaction anomaly models suffer from high false-positive rates, mistakenly freezing innocent citizens while missing upstream syndicate feeder hubs.
- **The Solution:** Ghost-VPA introduces active cyber-deception into domestic banking rails. Bank-designated internal canary VPAs (mapped to internal General Ledger suspense accounts under the Draft RBI September 2026 KYC Directions Annex III SOP) act as high-confidence tripwires.
- **The Result:**
  - Synthetic canary interactions create a `REVIEW_REQUIRED` triage case.
  - Directed propagation over confirmed synthetic credits identifies upstream candidates in constructed graph scenarios.
  - These are prototype behaviors, not measured fraud detection performance or production integration capabilities.

---

## 2. Inviolable Compliance Invariants

1. **Zero Real Fund Movement:** Completely simulated payment rail; no live switch connections, no live penny-drops, no escrow cash movement.
2. **KYC & PMLA Compliance:** No synthetic customer KYC profiles or fake identity documents. All demo entities use pseudonymous identifiers (`ACCT_SYNTH_XXXX`).
3. **Proportionate Triage (No Auto-Guilt):** Canary hits mark senders as `REVIEW_REQUIRED`. Formal holds are disabled in this prototype. The September 2026 RBI KYC amendment directions remain a draft proposal.
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
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser. API docs available at **`http://localhost:8000/docs`**.

---

## 5. Four Demonstration Scenarios

1. **Scenario A — Synthetic Canary Interaction:** A synthetic event targets `canary.trap.01@icixbank`, producing `REVIEW_REQUIRED`; no live payment occurs.
2. **Scenario B — Shared Funding Topology:** Synthetic confirmed-credit edges and canary interaction events illustrate upstream candidate attribution in a constructed graph.
3. **Scenario C — Benign Lookalike:** Synthetic merchant activity provides a topology example. It does not demonstrate a measured false-positive reduction.
4. **Scenario D — Multi-Hop Example:** Synthetic confirmed credits followed by a canary attempt illustrate temporal graph propagation; the attempt is not treated as a completed transfer.

---

## 6. Testing & Benchmarking

```bash
# Run complete test suite (unit, integration, safety invariants)
pytest tests/ -v

# The previous synthetic benchmark was withdrawn; results are disabled pending valid evaluation.
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
