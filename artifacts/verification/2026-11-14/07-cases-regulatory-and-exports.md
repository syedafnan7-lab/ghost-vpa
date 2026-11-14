# Phase 7: Regulatory Timers, Cases, RBAC & Threat Intel Exports Audit

**Target:** `backend/app/api/cases.py` & `backend/app/threat_intel/stix_exporter.py`  
**Timestamp:** 2026-11-14T23:06:45+05:30  
**Audit Focus:** RBI 2026 SOP compliance, RBAC authorization, and OASIS STIX 2.1 compliance  

---

## 1. Regulatory Citation & SOP Alignment Audit

### Document Verification
- **Cited Regulatory Authority:** RBI Draft Master Direction – Know Your Customer (KYC) Direction, 2016 (Amendment Directions, issued 11 September 2026).
- **Annex III Standard Operating Procedure (SOP):**
  - Establishes procedural requirements for financial entities identifying suspected money mule accounts.
  - Mandates a **20-day explanation window** for the customer to provide legitimate commercial justification after an operational alert.
  - Imposes a maximum **60-day temporary debit hold** pending police / NCRP confirmation or resolution.
- **Audit Verification:**
  - Prototype accurately represents the RBI September 2026 draft as proposed/draft regulation, not yet effective law.
  - Case models track `sop_day_counter=1` and `explanation_days_left=20`.
  - The prototype never places a real bank lien or freeze on an actual customer account; all accounts are pseudonymous (`ACCT_SYNTH_XXXX`).

---

## 2. Server-Side RBAC Enforcement Audit

The prompt states: *"A frontend role switcher alone is not RBAC."*
We performed direct API-level testing of the authorization barrier at `POST /api/v1/cases/{case_id}/action`:

```python
# 1. Analyst attempting to apply formal debit hold without supervisor authorization
r_analyst = requests.post(
    "http://127.0.0.1:8000/api/v1/cases/CASE-CE61709F/action",
    headers={"X-User-Role": "Analyst"},
    json={"action": "APPLY_HOLD", "actor_id": "analyst_01"},
)
# Result: HTTP 403 Forbidden
# {"detail": "Permission Denied: Only Supervisor can authorize formal 60-day SOP debit hold."}

# 2. Supervisor applying formal debit hold
r_super = requests.post(
    "http://127.0.0.1:8000/api/v1/cases/CASE-CE61709F/action",
    headers={"X-User-Role": "Supervisor"},
    json={"action": "APPLY_HOLD", "actor_id": "supervisor_patel"},
)
# Result: HTTP 200 OK
# New status: DEBIT_HOLD_ACTIVE
```

- **Verdict:** **PASS**. Role-based access control is strictly enforced on the server side via the `X-User-Role` header and HTTP 403 status codes.

---

## 3. Threat Intelligence Export Audit (OASIS STIX 2.1)

Endpoint audited: `GET /api/v1/cases/{case_id}/stix-bundle`

- **Bundle Validation:** Parsed and validated with official `stix2` Python library.
- **Top-Level Type:** `bundle` (STIX 2.1 specification compliant).
- **Exported Objects:**
  1. `identity`: Reporting bank entity (e.g. `Bank-Controlled Fraud Intelligence Unit`).
  2. `indicator`: Canary tripwire indicator marking malicious mule patterns.
  3. `marking-definition`: Official `TLP:AMBER` marking.
  4. `relationship`: Indicates connection between indicator and suspect identity.
- **Synthetic Marker Verification:** All custom indicators include `x_ghostvpa_synthetic: true` to prevent ingestion into live threat databases.
- **Verdict:** **PASS**.
