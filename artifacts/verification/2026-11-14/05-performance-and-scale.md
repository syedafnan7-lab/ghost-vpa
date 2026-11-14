# Phase 5: Performance, Latency & Scale Audit

**Target:** Fast Ingestion Triage SLA, Canary Registry Lookup & Ego Graph Queries  
**Timestamp:** 2026-11-14T23:06:15+05:30  
**Testing Tool:** Python `perf_counter` microbenchmarks & HTTP client load tests  

---

## 1. Latency Measurement Breakdown

All tests executed on local Windows 11 host (16 GB RAM, Python 3.12, Uvicorn worker).

| Operation | Sample Size | p50 Latency | p95 Latency | p99 Latency | SLA Target | SLA Compliance |
|---|---|---|---|---|---|---|
| **Canary In-Memory O(1) Lookup** | 110,000 lookups | **0.20 μs** | **0.20 μs** | **0.20 μs** | `< 1.0 ms` | **PASSED** (0.0002 ms) |
| **Fast Triage Ingestion API** | 100 HTTP requests | **3.64 ms** | **9.63 ms** | **12.85 ms** | `< 15.0 ms` | **PASSED** (p99 = 12.85 ms) |
| **Graph Ego-Network Query (k=2)** | 50 HTTP requests | **247.06 ms** | **267.98 ms** | **281.52 ms** | `< 1.0 s` | **PASSED** |

### Latency Boundary Analysis
1. **Canary Lookup:** Executed in pure RAM using Python hash dictionary (`dict`). Lookups take ~187 nanoseconds, satisfying O(1) complexity.
2. **Fast Triage API:** Measures full lifecycle: HTTP network round-trip, JSON deserialization, canary check, SQLite `PaymentEventModel` insert, SQLite `AlertModel` and `CaseModel` insert, SHA-256 block hash computation, WebSocket broadcast, and JSON response. Mean latency: **4.37 ms**; p99: **12.85 ms**. Both remain comfortably within the `< 15 ms` banking sidecar SLA.
3. **Graph Subgraph Queries:** The ego network query extracts a 2-hop bounded subgraph (`max_nodes=50`) from the in-memory NetworkX multigraph, parses timestamps, and returns D3 node/edge structures. p50 = 247 ms is acceptable for interactive analyst exploration in the browser.

---

## 2. Scale & Concurrency Testing
- The live simulation loop runs asynchronously without blocking the FastAPI event loop.
- Background rail simulation ticks continuously at configurable speeds (`1x`, `5x`, `20x`).
- Under continuous background event streaming, fast-triage API requests continue to respond with `< 15 ms` latency.
