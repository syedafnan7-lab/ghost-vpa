# Ghost-VPA

Ghost-VPA is a simulation prototype for investigating suspicious payment networks. It combines bank-designated canary endpoints, synthetic payment events, temporal graph analysis, and a case review workbench.

## What the prototype demonstrates

- A deterministic multi-bank payment simulator using synthetic identifiers and events.
- Canary endpoint matching that creates a `REVIEW_REQUIRED` triage case.
- Temporal graph exploration and scenario-driven investigation workflows.
- An audit ledger and STIX 2.1 export for simulated evidence.
- An ML benchmark interface that remains unavailable until a valid benchmark run exists.

All payment activity stays inside the simulator. The project does not connect to live UPI, IMPS, bank systems, or payment gateways, and it never moves real funds or creates synthetic KYC identities. A canary match is a review signal, not a finding of guilt or an account action. The September 2026 RBI KYC amendment directions are a draft proposal.

## Run locally

Requirements: Python 3.11 or newer, Node.js, and npm.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd frontend
npm install
npm run dev
```

In a second terminal, from the repository root:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open `http://127.0.0.1:5173`. The API documentation is at `http://127.0.0.1:8000/docs`.

On Windows, `start-ghostvpa.bat` launches both development servers.

## Project documentation

- [Architecture](docs/designs/ghost-vpa-architecture.md)
- [Demo runbook](docs/demo-runbook.md)
- [Benchmark methodology](docs/benchmark-methodology.md)
- [Benchmark results and limitations](docs/benchmark-results.md)
- [Security and privacy](docs/security-and-privacy.md)
- [Production integration boundaries](docs/production-integration-boundaries.md)
- [Remediation register](docs/remediation/remediation-register.md)

## Project status

This is a portfolio and research prototype. Its interfaces illustrate simulated workflows; they do not establish production readiness, validated fraud-detection performance, or regulatory approval. See the benchmark and architecture documentation for current implementation status and limitations.

## License

Apache-2.0. See [LICENSE](LICENSE).
