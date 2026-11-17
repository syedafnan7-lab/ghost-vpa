# Ghost-VPA Demonstration Runbook

## Scope

This runbook demonstrates a local simulation only. It uses synthetic identifiers and events. It does not connect to UPI, IMPS, NPCI, a bank, or a payment gateway; it moves no real funds. A canary interaction produces a `REVIEW_REQUIRED` triage flag, not a finding of guilt. Formal holds are disabled. The September 2026 RBI KYC amendment directions are a draft proposal.

## Start the prototype

```powershell
pip install -r backend/requirements.txt
cd frontend
npm install
npm run dev
```

In another terminal from the repository root:

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open `http://localhost:5173`.

## Scenario walkthrough

1. Run Scenario A to observe a synthetic canary interaction, the `REVIEW_REQUIRED` flag, and zero-real-funds behavior in the simulator.
2. Run Scenario B to inspect a constructed feeder → confirmed-credit → mule → canary-interaction path. Treat the graph and attribution as scenario-derived evidence, not a real-world criminality determination.
3. Run Scenario C to view benign synthetic merchant activity. The prototype does not establish a false-positive reduction rate.
4. Run Scenario D to inspect a synthetic multi-hop graph. Only events marked `CREDIT_CONFIRMED` carry fund-flow amounts; the final canary interaction is not a completed transfer.
5. In the Benchmark view, explain that the old evaluation is withdrawn. Do not quote its previous scores.
6. In the workbench, identify STR/NCRP material as prototype previews, STIX as generated prototype output, and the RBI timelines as simulation fields rather than active statutory obligations.

## Known demonstration limits

Authentication is not implemented. Formal hold actions are disabled; other case actions are not production safe. Graph state is in memory and rebuilt from recent SQLite events on startup. The comparative fraud benchmark is disabled pending a valid timestamped graph experiment.
