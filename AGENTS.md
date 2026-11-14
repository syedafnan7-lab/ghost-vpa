# Ghost-VPA Autonomous Agent Operational Guide

**Project:** Ghost-VPA — Bank-Controlled Honeypot VPAs  
**Document:** `AGENTS.md`  
**Purpose:** Instructions, boundaries, and tool contracts for autonomous AI engineering agents working on this codebase.

---

## 1. Prime Directives for All Agents

1. **Safety & Zero Real Money Invariant:**
   - NEVER add code that communicates with live UPI/IMPS production switches, bank production APIs, or real payment gateways.
   - NEVER implement penny-drop payments, ₹1 transfers, or suspense movement using real fiat currency.
   - NEVER create synthetic customer KYC records, fake PAN numbers, or forged identity documents.
   - All tests and demonstration data MUST use the internal simulation rail and synthetic pseudonymous identifiers.

2. **Regulatory Truthfulness:**
   - Always refer to the RBI September 2026 KYC Amendment Directions as a **draft proposal**, never an enacted, active statutory mandate.
   - A canary tripwire creates an operational triage flag (`REVIEW_REQUIRED`), NOT an automatic accusation of guilt or instant account freeze.

3. **Codebase Preservation:**
   - Preserve existing architecture and working modules. Do not execute unnecessary wholesale rewrites.
   - Maintain clean modular separation between `backend/`, `frontend/`, `docs/`, and `tests/`.

---

## 2. Directory Layout & Key Modules

- `backend/app/main.py`: FastAPI application entry point.
- `backend/app/simulator/rail.py`: Multi-bank simulated payment rail and scenario execution.
- `backend/app/core/honeypot_registry.py`: Bank-designated canary VPA storage and lookup.
- `backend/app/graph/temporal_engine.py`: NetworkX temporal graph, motif analysis, and CS-LP.
- `backend/app/ml/baseline_lightgbm.py`: Tabular LightGBM transaction-only baseline.
- `backend/app/ml/graph_lightgbm.py`: Graph-enhanced LightGBM challenger.
- `backend/app/ml/benchmark.py`: 100,000-node evaluation harness and metric calculation.
- `backend/app/threat_intel/stix_exporter.py`: OASIS STIX 2.1 JSON bundle generator.
- `frontend/src/`: React 18 + Vite + Tailwind CSS + D3.js dashboard and network explorer.
- `docs/`: Comprehensive architecture, threat model, research, and benchmarking specs.
- `tests/`: Automated unit, integration, and safety tests.

---

## 3. Mandatory Development Commands

```bash
# Run backend tests
pytest tests/ -v

# Run safety invariant verification
pytest tests/test_safety_invariants.py -v

# Run ML benchmark
python -m backend.app.ml.benchmark
```
