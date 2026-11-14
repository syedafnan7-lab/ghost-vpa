# Phase 3: Four Demonstration Scenarios End-to-End Audit

**Target:** `POST /api/v1/sim/control` & UI Demonstration Scenarios  
**Audit Focus:** Reproducibility, state changes, and evidence generation  
**Timestamp:** 2026-11-14T23:05:45+05:30  

---

## 1. Scenario Execution Evidence Matrix

All four scenarios were executed against the live running FastAPI backend (`http://127.0.0.1:8000`) and observed on the React frontend (`http://127.0.0.1:5173`).

### Scenario A — Honeypot Tripwire
- **Trigger:** `POST /api/v1/sim/control {"action": "run_scenario", "scenario": "A"}`
- **Sender:** `ACCT_SYNTH_HDFX_9912` (`sender.mule01@hdfxbank`)
- **Target Canary:** `canary.trap.01@icixbank` (Designated Bank: ICIX)
- **Amount:** ₹5,000.00 (UPI P2P)
- **Backend Response:**
  - Status: HTTP 200 `SUCCESS`
  - Event ID: `TXN-SCEN-A-3D1CBEE8`
  - Ingestion Status: `PROCESSED`
  - Canary Match: `is_canary_hit: true`
  - Result: `sender_status: "REVIEW_REQUIRED"`
  - Latency: **10.04 ms**
- **State Changes:**
  - `canary_alerts` table: Alert created (`risk_level="CRITICAL"`, `zero_funds_verified=true`).
  - `investigation_cases` table: New dossier created (`CASE-CE61709F`, `status="OPEN_TRIAGE"`, `sop_day_counter=1`, `explanation_days_left=20`).
  - `audit_logs` table: Forensic block written with action `TRIPWIRE_TRIGGERED`.
- **Verdict:** **PASS**

---

### Scenario B — Shared Upstream Feeder Unmasking
- **Trigger:** `POST /api/v1/sim/control {"action": "run_scenario", "scenario": "B"}`
- **Upstream Mastermind:** `FEEDER_SYNTH_007` (`master.feeder@hdfxbank`)
- **Feeder Transfer:** ₹45,000.00 IMPS deposit to 3 distinct mule accounts:
  1. `ACCT_SYNTH_ICIX_4401` (`mule.alpha@icixbank`)
  2. `ACCT_SYNTH_HDFX_4402` (`mule.beta@hdfxbank`)
  3. `ACCT_SYNTH_SBINX_4403` (`mule.gamma@sbinxbank`)
- **Downstream Canary Probes:** Mules 1 and 2 target `canary.trap.01@icixbank` and `canary.alert.02@hdfxbank`.
- **Backend Response:**
  - Status: HTTP 200 `SUCCESS`
  - Canary Hits: 2 intercepted (`TXN-SCEN-B-CECA201A` in 6.1 ms, `TXN-SCEN-B-EA76A5FC` in 5.51 ms).
- **Temporal Graph Trace:**
  - Feeder edges (`FEEDER_SYNTH_007 -> Mules`) exist in the in-memory multigraph.
  - Querying `/api/v1/graph/ego/ACCT_SYNTH_ICIX_4401` shows connectivity backward to `FEEDER_SYNTH_007`.
- **Verdict:** **PASS**

---

### Scenario C — Benign Lookalike (False Positive Mitigation)
- **Trigger:** `POST /api/v1/sim/control {"action": "run_scenario", "scenario": "C"}`
- **Merchant:** `MERCHANT_MSME_901` (`freshfoods.merchant@icixbank`)
- **Traffic Pattern:** 5 high-velocity retail payments in burst (₹800 to ₹4,500).
- **Backend Response:**
  - Status: HTTP 200 `SUCCESS`
  - Canary Hits: 0. All transactions settled with `simulated_result="SETTLED_NORMAL"`.
- **Graph Verification:** Zero edges to any registered honeypot canary nodes. No account hold or `REVIEW_REQUIRED` tag applied.
- **Verdict:** **PASS**

---

### Scenario D — Multi-Hop Layering Chain
- **Trigger:** `POST /api/v1/sim/control {"action": "run_scenario", "scenario": "D"}`
- **Transfer Chain:** 4-hop syndicate layering within 25 minutes:
  1. `FEEDER_SYNTH_009` → `ACCT_SYNTH_MULE_HOP1`: ₹75,000.00 (T-25 mins)
  2. `ACCT_SYNTH_MULE_HOP1` → `ACCT_SYNTH_MULE_HOP2`: ₹73,500.00 (T-18 mins)
  3. `ACCT_SYNTH_MULE_HOP2` → `ACCT_SYNTH_MULE_HOP3`: ₹72,000.00 (T-10 mins)
  4. `ACCT_SYNTH_MULE_HOP3` → `canary.tripwire.03@sbinxbank`: ₹70,000.00 (T-2 mins)
- **Backend Response:**
  - Intermediate hops settled; final canary hop intercepted.
  - Amount conservation: ₹75,000 → ₹73,500 → ₹72,000 → ₹70,000 (93.3% conservation ratio).
  - Inter-hop velocity: `< 8 mins` per hop (exceeds typical `< 15 min` rapid pass-through motif threshold).
- **Verdict:** **PASS**
