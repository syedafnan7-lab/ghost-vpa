# Ghost-VPA End-to-End Demo Runbook

This runs the real local backend against synthetic events and a separate SQLite file. It never contacts a payment rail. Keep the demo database separate from `data/ghost_vpa.db`.

## 1. Start the backend

From the repository root in PowerShell:

```powershell
$env:DATABASE_URL = 'sqlite+aiosqlite:///./data/ghost_vpa_demo.sqlite3'
$env:SIMULATOR_AUTOSTART = 'false'
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The backend creates the isolated database if it does not exist and rehydrates the graph from its recent persisted events on startup.

## 2. Start the React application

In a second PowerShell window:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The UI uses the Vite API proxy to reach the backend on port 8000.

## 3. Execute the deterministic scenario

Either click **Run End-to-End** on the Operations dashboard or call the same real scenario endpoint:

```powershell
$body = @{ action = 'run_scenario'; scenario = 'E' } | ConvertTo-Json
$run = Invoke-RestMethod -Method Post `
  -Uri 'http://127.0.0.1:8000/api/v1/sim/control' `
  -ContentType 'application/json' -Body $body
$run.result | ConvertTo-Json -Depth 5
```

Scenario E uses stable event IDs in the `DEMO-E2E-20261114-*` namespace and synthetic accounts `FEEDER_SYNTH_007`, `MULE_SYNTH_101`, `MULE_SYNTH_102`, `MERCHANT_SYNTH_900`, `CUSTOMER_SYNTH_901`, and `CANARY_VPA_001`. Replaying it returns `DUPLICATE` outcomes and does not create additional cases.

## 4. Inspect API results

```powershell
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/cases' | ConvertTo-Json -Depth 6
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/alerts' | ConvertTo-Json -Depth 4
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/graph/ego/MULE_SYNTH_101?depth=3&max_nodes=50&window_hours=72' | ConvertTo-Json -Depth 5
```

Choose the primary case ID from the case response, then inspect its persisted source events:

```powershell
$caseId = '<CASE-ID-FOR-MULE_SYNTH_101>'
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/cases/$caseId/evidence" | ConvertTo-Json -Depth 5
```

Expected observations: the mule case has feeder candidate `FEEDER_SYNTH_007`, one independently canary-interacting connected mule, a stable `CLUST-SYN-*` value, and source event IDs for feeder funding, the downstream merchant payment, and the two canary attempts. `MERCHANT_SYNTH_900` appears downstream. `CUSTOMER_SYNTH_901` has an isolated review case without a feeder or cluster.

## 5. Inspect the React workbench and graph

- On Operations, confirm graph counts, active canaries, persisted open cases, and alerts are loaded from the API.
- Click **Run End-to-End** to open the primary case in Case Dossiers, or use **3 Graph Explorer** and enter `MULE_SYNTH_101`.
- Inspect the graph direction and evidence drawer; event IDs and reversal provenance appear in edge titles.
- The legend keeps **Suspected Mule (triage flag)**. Canary contact is not rendered as a confirmed criminal classification.
- In Case Dossiers, inspect persisted evidence IDs, timestamps, event types, directions, amounts, and simulated results.

## 6. Restart and verify persistence

Stop the backend with `Ctrl+C`, then run the same startup command with the same `DATABASE_URL`. Verify that the case list, case evidence, alerts, and graph endpoint still return the investigation. To check SQLite integrity:

```powershell
python -c "import sqlite3; c=sqlite3.connect('data/ghost_vpa_demo.sqlite3'); print(c.execute('PRAGMA integrity_check').fetchone()[0])"
```

Expected result: `ok`. Scenario E can be run again safely; stable event IDs return duplicate outcomes. Use a fresh isolated filename only when you intentionally want a new blank demo dataset; never point this workflow at the primary user database.

## Routes

- Frontend: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- Backend OpenAPI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Case list: `GET /api/v1/cases`
- Case evidence: `GET /api/v1/cases/{case_id}/evidence`
- Alerts: `GET /api/v1/alerts`
- Ego graph: `GET /api/v1/graph/ego/{entity_id}`
- Scenario execution: `POST /api/v1/sim/control`
- Event ingestion: `POST /api/v1/simulate/attempt`
