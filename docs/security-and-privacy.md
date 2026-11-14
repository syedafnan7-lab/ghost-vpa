# Ghost-VPA Security & Privacy Architecture

**Project:** Ghost-VPA  
**Document:** `docs/security-and-privacy.md`  
**Compliance Standards:** DPDP Act 2023, PMLA 2002, RBI Master Direction on Information Security  
**Date:** November 2026  

---

## 1. Data Minimization & Privacy-by-Design

### 1.1 Synthetic Identifier Scheme
To prevent any possibility of real customer PII leakage, Ghost-VPA enforces a strict pseudonymous token format across all storage tiers:
- **Accounts:** `ACCT_SYNTH_[BANK]_[5-DIGIT-HEX]` (e.g. `ACCT_SYNTH_ICIX_B82F1`)
- **VPAs:** `[category].[purpose].[sequence]@[bank]` (e.g. `user.pay412@hdfxbank`, `canary.trap.01@icixbank`)
- **Device Tokens:** SHA-256 hash of simulated hardware attributes (e.g. `DEV_TOK_4A89C`)
- **IP Subnets:** Masked Class C CIDR blocks (e.g. `10.240.12.0/24`)

### 1.2 Invariant Guarantees
- Zero storage of 12-digit Aadhaar numbers, 10-digit PANs, voter IDs, passport numbers, or residential addresses.
- Zero storage of plaintext mobile phone numbers.
- In-memory processing with explicit garbage collection for transient payload buffers.

---

## 2. Role-Based Access Control (RBAC) Specification

> **Architectural Note:** In this demonstration prototype, RBAC is implemented as **Simulated Role-Based Action Gating** enforced via the `X-User-Role` request header and UI role selector with strict backend endpoint validation (e.g., 403 Forbidden on hold attempts by non-Supervisors). In a production bank environment, this layer interfaces with enterprise IAM (Active Directory / Okta / SAML 2.0).

The system implements 3 distinct operational roles:

| Role Name | Scope & Permissions | Permitted Actions | Prohibited Actions |
|---|---|---|---|
| **Analyst** | Operational alert triage and case documentation. | View live monitor, triage alerts, inspect D3 graphs, add case notes, recommend hold. | Authorize formal debit hold, delete records, modify canary configs. |
| **Supervisor** | Case escalation, compliance oversight, and hold approval. | Approve 60-day SOP debit holds, escalate to NCRP/FIU-IND, activate/pause canary endpoints, export STIX threat intel. | Direct database modification, bypassing audit logs. |
| **Auditor** | Read-only compliance verification and audit review. | View immutable audit logs, inspect SLA compliance, review resolved cases and benchmarking metrics. | Modifying any case, alert, or canary state; initiating simulation events. |

---

## 3. Cryptographic Audit Trail (Tamper-Evident Chaining)

All security-critical actions (alert creation, case state change, hold authorization, canary status change, STIX export) generate an entry in the `audit_logs` table:
```json
{
  "log_id": "AUD-2026-0089",
  "timestamp": "2026-11-14T14:30:00Z",
  "actor_id": "supervisor_patel",
  "role": "SUPERVISOR",
  "action": "AUTHORIZE_DEBIT_HOLD",
  "entity_id": "CASE-2026-0012",
  "details": {"hold_type": "PROPORTIONATE_60D", "reason": "Canary hit + 4-hop syndicate feeder verified"},
  "prev_hash": "a1b2c3d4...",
  "current_hash": "e5f6g7h8..."
}
```
The `current_hash` is computed as:
$$\text{current\_hash} = \text{SHA256}(\text{log\_id} \,\|\, \text{timestamp} \,\|\, \text{actor\_id} \,\|\, \text{action} \,\|\, \text{entity\_id} \,\|\, \text{prev\_hash})$$
Any retroactive row modification breaks the cryptographic chain, providing tamper-evident forensic guarantees.
