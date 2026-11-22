# Ghost-VPA Architecture Specification & System Blueprint

**Document:** `docs/designs/ghost-vpa-architecture.md`
**Version:** 2.0.0-POST-GOLDFISH-APPROVED
**Author:** Coordinated Senior FinTech Engineering Team
**Review Harness:** Elephant-Goldfish Model (EGM)
**Status:** Historical target architecture; not an implementation inventory

---

## 1. Executive Blueprint & Core Invariants

Ghost-VPA is a simulation prototype exploring bank-controlled canary identifiers and temporal graph investigation. The sidecar, UPI/IMPS deployment, live event queue, production ML scoring, and payment interception shown below are proposed architecture only. No bank or payment rail is connected.

> Current implementation note (17 Nov 2026): the backend uses synthetic events, SQLite/WAL, an in-memory NetworkX graph, and a React workbench. Graph propagation uses confirmed synthetic credits; canary attempts are interaction evidence. Comparative benchmark results have been withdrawn. Case mutations are disabled because authenticated authorization is absent. See `artifacts/step5/CODEX_COMPLETE_PROJECT_REVIEW.md` for the verified map and remaining defects.

```
       [ Deterministic Simulated Payment Rail (HDFX, ICIX, SBINX, AXSX) ]
                                      │
            (Payment Attempt: ReqValAdd / ReqPay Metadata)
                                      ▼
             [ TIER 1: SIMULATION & INGESTION SIDECARE ]
           ┌──────────────────────────────────────────────┐
           │ 1. Centralized SimulationClock               │
           │ 2. O(1) Canary Registry Lookup (In-Mem Set)  │
           │ 3. Instant Triage (< 2ms): Canary Alert?     │
           └──────────────────────┬───────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │ (Canary Match: Immediate Alert)                 │ (All Flows: Benign & Canary)
         ▼                                                 ▼
   [ Fast Triage Broadcast ]                     [ Background Event Queue ]
   - Set SENDER: REVIEW_REQUIRED                           │
   - Emit WebSocket Alert (< 5ms)                          ▼
   - Pre-Routing CBS Intercept (Zero Fund Move)  [ Async Worker Pool (to_thread) ]
                                                           │
                                                           ▼
                             [ TIER 2: GRAPH & ML ANALYTICS ENGINE ]
                           ┌───────────────────────────────────────────┐
                           │ 1. In-Memory NetworkX MultiDiGraph Update │
                           │ 2. 72h Sliding Window Edge Eviction       │
                           │ 3. Upstream Feeder Tracing & Motifs       │
                           │ 4. Canary-Seeded Label Propagation (CS-LP)│
                           │ 5. Graph-Enhanced LightGBM Scoring        │
                           └───────────────────────┬───────────────────┘
                                                   │
                                                   ▼
                             [ TIER 3: PERSISTENCE & DOSSIER ENGINE ]
                           ┌───────────────────────────────────────────┐
                           │ 1. Async SQLite (WAL Mode via aiosqlite)  │
                           │ 2. SHA-256 Chained Immutable Audit Trail  │
                           │ 3. RBI 60-Day SOP Case Dossier Manager    │
                           │ 4. STIX 2.1 Threat Intel Bundle Serializer│
                           └───────────────────────┬───────────────────┘
                                                   │
                                                   ▼
                             [ TIER 4: ANALYST PRESENTATION WORKBENCH ]
                           ┌───────────────────────────────────────────┐
                           │ 1. Operations & Live Canary Triage Feed   │
                           │ 2. Investigation Workbench (D3 Graph)     │
                           │ 3. Model Benchmark Studio (PR/ROC Curves) │
                           └───────────────────────────────────────────┘
```

### Inviolable Invariants (Non-Negotiable)
1. **Zero Real Fund Movement:** No live UPI/IMPS switch connections, no live penny-drop transfers, no live escrow movement. All transfers run through the deterministic multi-bank simulator.
2. **KYC & PMLA Compliance:** No synthetic customer KYC profiles or fabricated documents. All accounts use pseudonymous identifiers (`ACCT_SYNTH_XXXX`).
3. **No Automatic Guilt / Freezing:** A canary hit triggers `REVIEW_REQUIRED`. Formal account restrictions or customer notices follow the RBI 20-day explanation window and require human supervisor authorization.
4. **Zero NPCI Switch Changes:** Operates purely as an internal bank-side CBS/PSP sidecar.

---

## 2. Four-Tier Technical Architecture

### Tier 1: Simulation & Ingestion Engine
- **Files:** `backend/app/simulator/rail.py`, `backend/app/core/simulation_clock.py`, `backend/app/core/honeypot_registry.py`
- **Simulation Clock:** Centralized singleton `SimulationClock` synchronizes simulation time ($t_{sim}$) across all modules. Supports play, pause, resume, and speed multipliers ($1\times, 5\times, 20\times$).
- **Multi-Bank Deterministic Rail:** Generates payment attempt events across 4 synthetic bank codes (`HDFX`, `ICIX`, `SBINX`, `AXSX`) with fixed random seed (`seed=42`).
- **Canary Registry & O(1) Lookup:**
  - Maintains in-memory set of registered canary VPAs (`vpa in active_canaries_set`).
  - Canaries remain **`ACTIVE`** upon tripwire activation, incrementing `hit_count` so continuous probes are tracked.
- **Decoupled Fast Triage ($< 2\text{ ms}$):**
  - If target matches canary: instantly set `event.simulated_result = "TRIPWIRE_TRIGGERED"`, set `sender_status = "REVIEW_REQUIRED"`, and dispatch `TripwireAlert` via in-process WebSocket broadcaster.
  - Push event to an internal `asyncio.Queue` for background graph ingestion.

### Tier 2: Graph & ML Analytics Engine
- **Files:** `backend/app/graph/temporal_engine.py`, `backend/app/ml/dataset_generator.py`, `backend/app/ml/benchmark.py`
- **Graph Topology:** In-memory `networkx.MultiDiGraph` updated with **every transaction** (both benign and canary) so upstream multi-hop paths exist.
- **72-Hour Sliding Window & Pruning:** Pruning routine `prune_expired_edges(t_cutoff)` evicts edges older than $t_{sim} - 72\text{ hours}$ to prevent unbounded memory growth.
- **Motif Detection:**
  1. *Rapid Fan-In:* $\ge 4$ distinct remitters to 1 destination within 60 minutes.
  2. *Rapid Fan-Out:* $\ge 5$ outbound splits within 30 minutes of deposit.
  3. *High Velocity Pass-Through:* $|t_{out} - t_{in}| < 15\text{ minutes}$.
  4. *Amount Conservation Ratio:* $\rho = \frac{\sum Amount_{out}}{\sum Amount_{in}} \in [0.85, 1.05]$.
- **Canary-Seeded Label Propagation (CS-LP):**
  - Seed nodes (canaries) initialized with $S^{(0)} = 1.0$.
  - Temporal edge weight: $w(u, v) = \exp(-\lambda \cdot (t_{sim} - t_e))$ with $\lambda = 0.05\text{ hr}^{-1}$.
  - Upstream propagation along reverse edges with restart parameter $\alpha = 0.85$, terminating when convergence $< 10^{-4}$ or 15 iterations.
- **Bounded Ego Serving:** Queries serve bounded subgraphs capped at $k \le 2$ hops and $N \le 50$ nodes to guarantee sub-millisecond API response and smooth D3 rendering.
- **Machine Learning Benchmark:**
  - Evaluated on a 100,000-node synthetic network generated offline into `data/benchmark_100k.parquet` or `.db`.
  - Compares Tabular LightGBM (transaction-only) vs Graph-Enhanced LightGBM (topological & motif features) across temporal holdout test splits.

### Tier 3: Persistence, Audit & Dossier Engine
- **Files:** `backend/app/db/session.py`, `backend/app/db/models.py`, `backend/app/threat_intel/stix_exporter.py`
- **Database Engine:** Async SQLite with Write-Ahead Logging (WAL mode) via `aiosqlite` and SQLAlchemy 2.0 async. Configured via `DATABASE_URL` (default: `sqlite+aiosqlite:///./data/ghost_vpa.db`).
- **Cryptographic Chained Audit Trail:**
  - Immutable audit logs computed as:
    $$\text{hash}_i = \text{SHA256}(\text{hash}_{i-1} \,\|\, \text{timestamp} \,\|\, \text{actor\_role} \,\|\, \text{action} \,\|\, \text{canonical\_json}(\text{details}))$$
  - Genesis hash: `0000000000000000000000000000000000000000000000000000000000000000`.
- **RBI 60-Day SOP Case Dossier:**
  - Tracks 60-day maximum statutory hold SLA and 20-day customer explanation window.
  - Compiles auto-generated FIU-IND STR narrative text and NCRP-CFCFRMS JSON format.
- **OASIS STIX 2.1 Threat Intel Exporter:**
  - Emits valid STIX 2.1 JSON bundle marking all indicators with `"x_ghostvpa_synthetic": true` and `"confidence": 95`.

### Tier 4: Analyst Presentation Workbench
- **Files:** `frontend/src/` (React 18 + Vite + Tailwind CSS + D3.js)
- **Consolidated Unified Surfaces:**
  1. **Operations & Live Canary Triage:** Real-time incoming event stream, pause/speed/scenario controls, instant tripwire alert popups, active canary status table.
  2. **Investigation Workbench:** Interactive D3 force-directed network explorer with 72-hour temporal scrubber, ego-network search, and expandable RBI 60-day SOP case dossier drawer.
  3. **Model Benchmark Studio:** Empirical PR/ROC curves, confusion matrices, feature importance charts, and latency metrics comparing Tabular vs Graph-Enhanced models.

---

## 3. Concrete API Contract Specification

### 3.1 REST Endpoints
| HTTP Method | Route Path | Description | Request Payload | Response Model |
|---|---|---|---|---|
| `POST` | `/api/v1/sim/control` | Control simulation clock & scenarios | `{"action": "play"\|"pause"\|"reset", "speed": 1\|5\|20, "scenario": "A"\|"B"\|"C"\|"D"}` | `SimulationStatusResponse` |
| `GET` | `/api/v1/sim/status` | Current clock & queue status | None | `SimulationStatusResponse` |
| `GET` | `/api/v1/canaries` | List registered canary endpoints | None | `List[CanaryResponse]` |
| `POST` | `/api/v1/canaries` | Register new canary VPA | `CanaryRegisterRequest` | `CanaryResponse` |
| `GET` | `/api/v1/graph/ego/{entity_id}` | Bounded ego-network for D3 | Query params: `depth=2&max_nodes=50` | `EgoGraphResponse` |
| `GET` | `/api/v1/cases` | List active investigation dossiers | None | `List[CaseDossierResponse]` |
| `POST` | `/api/v1/cases/{case_id}/action` | Update case status under RBI SOP | `{"action": "DISPATCH_NOTICE"\|"APPLY_HOLD"\|"RESOLVE", "notes": "..."}` | `CaseDossierResponse` |
| `GET` | `/api/v1/benchmark/results` | Load 100k-node benchmark metrics | None | `BenchmarkResultsResponse` |
| `GET` | `/api/v1/threat-intel/stix/{case_id}` | Download STIX 2.1 JSON bundle | None | OASIS STIX 2.1 JSON Bundle |

### 3.2 WebSocket Streaming Contract
- **Endpoint:** `WS /ws/live-stream`
- **Outbound Message Framing:**
```json
{
  "type": "PAYMENT_ATTEMPT" | "TRIPWIRE_ALERT" | "CLOCK_TICK",
  "data": { ... },
  "sim_timestamp": "2026-11-14T14:22:10Z"
}
```

---

## 4. Testing & Verification Suite

1. **Safety & Invariant Tests (`tests/test_safety_invariants.py`):**
   - Asserts zero outbound network calls to external payment rails.
   - Asserts zero money movement in database ledgers.
   - Asserts all generated identifiers contain synthetic markers.
2. **Honeypot & Triage Tests (`tests/test_triage_engine.py`):**
   - Asserts sub-15ms fast-triage latency on canary hit.
   - Asserts non-canary transactions do not trigger tripwires.
   - Asserts remitter is marked `REVIEW_REQUIRED`.
3. **Temporal Graph Tests (`tests/test_temporal_graph.py`):**
   - Asserts fan-in, fan-out, and high-velocity motif detection.
   - Asserts CS-LP upstream risk score convergence.
   - Asserts 72h edge eviction leaves memory bounded.
4. **Benchmark Model Tests (`tests/test_benchmark_metrics.py`):**
   - Asserts LightGBM Graph challenger achieves higher PR-AUC and lower FPR than tabular baseline.
5. **STIX Exporter Validation (`tests/test_stix_exporter.py`):**
   - Validates JSON against OASIS STIX 2.1 specification with `x_ghostvpa_synthetic: true`.
