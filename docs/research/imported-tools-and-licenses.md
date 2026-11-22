# Ghost-VPA Imported Tools, Dependencies & License Inventory

**Project:** Ghost-VPA  
**Version:** 1.0.0
**License:** Apache-2.0 (Prototype Source)

---

## 1. Third-Party Software & Dependency Registry

| Package / Tool | Version Target | Primary License | Upstream Source | Purpose in Architecture | Security & Permissibility Assessment |
|---|---|---|---|---|---|
| **Python** | 3.12.x | PSF License | python.org | Core runtime engine | Verified official build, zero known CVEs. |
| **FastAPI** | ^0.115.0 | MIT | github.com/tiangolo/fastapi | REST API & Event ingestion sidecar | Industry-standard async API framework; strict OpenAPI type contracts. |
| **Uvicorn** | ^0.32.0 | BSD-3-Clause | github.com/encode/uvicorn | ASGI web server | Production-grade lightweight server. |
| **Pydantic** | ^2.9.0 | MIT | github.com/pydantic/pydantic | Data validation & event schemas | Memory-safe, high-speed Rust-backed validation core. |
| **NetworkX** | ^3.4.0 | BSD-3-Clause | github.com/networkx/networkx | Temporal graph analytics & ego graphs | Pure Python, robust topological algorithms, zero native exploit surface. |
| **LightGBM** | ^4.5.0 | MIT | github.com/microsoft/LightGBM | Tabular baseline & graph-augmented classifier | High-efficiency gradient boosting; deterministic random seed support. |
| **Scikit-learn** | ^1.5.0 | BSD-3-Clause | scikit-learn.org | PR-AUC, metrics, baseline evaluators | Standard scientific suite, trusted and verified. |
| **NumPy & Pandas** | ^2.1.0 / ^2.2.0 | BSD-3-Clause | numpy.org / pandas.pydata.org | Feature matrix computation | Foundation math libraries. |
| **PyTorch Geometric (PyG)** | ^2.6.0 | MIT | pyg.org | Dynamic Graph Neural Networks | Evaluated for temporal GNN benchmarks; isolated in benchmarking module. |
| **stix2** | ^3.0.1 | OASIS / BSD-3 | github.com/oasis-open/cti-python-stix2 | STIX 2.1 JSON bundle serialization | Official OASIS Open threat intelligence schema validator. |
| **React** | ^18.3.0 | MIT | react.dev | Frontend Single Page Application | Standard frontend UI library. |
| **TypeScript** | ^5.6.0 | Apache-2.0 | typescriptlang.org | Type-safe frontend client | Strong type contracts preventing client runtime failures. |
| **Vite** | ^5.4.0 | MIT | vitejs.dev | Frontend tooling & build harness | Ultra-fast HMR and bundling. |
| **Tailwind CSS** | ^3.4.0 | MIT | tailwindcss.com | Design system styling | Zero runtime CSS injection overhead. |
| **Lucide React** | ^0.454.0 | ISC | lucide.dev | UI Iconography | Minimal SVG footprint, tree-shakeable. |
| **D3.js** | ^7.9.0 | ISC | d3js.org | Interactive force-directed graph visualization | Fine-grained Canvas/SVG control for 2D entity topologies. |
| **Elephant-Goldfish Model (EGM)** | ^0.1.1 | Apache-2.0 | github.com/google/elephant-goldfish-model | Design review & SDD harness | Installed in `~/.gemini/config/plugins/egm`; zero production runtime impact. |

---

## 2. Dependency Invariants & Supply Chain Hygiene

1. **No GPL-Incompatible Leaks in Proprietary Banking Adapters:** All core components use MIT, BSD-3, Apache-2.0, or ISC licenses.
2. **Zero Insecure Native Code Modules:** No untrusted pre-compiled C/C++ binaries or closed-source DLLs.
3. **No External Network Telemetry:** The platform functions completely offline and air-gapped without making unauthorized outbound connections.
4. **Synthetic Data Only:** No external live scraping tools or unverified data scrapers are included.
