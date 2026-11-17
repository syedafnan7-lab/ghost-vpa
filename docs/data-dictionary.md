# Ghost-VPA Data Dictionary & Entity Schemas

> **Prototype status (17 Nov 2026):** Fields named after RBI SOP timelines are simulation values only. The September 2026 RBI KYC amendment directions remain a draft proposal; case mutations are disabled and no regulatory action is performed.

**Project:** Ghost-VPA  
**Document:** `docs/data-dictionary.md`  
**Version:** 1.0.0  

---

## 1. Core Data Entities

### 1.1 `CanaryEndpoint` (Honeypot Registry)
Represents a bank-designated or customer-consented canary VPA.

| Field Name | Data Type | Nullable | Description | Example Value |
|---|---|---|---|---|
| `canary_id` | String (UUID) | No | Unique identifier of the canary endpoint | `"CANARY-BLR-001"` |
| `vpa` | String | No | Non-routable synthetic VPA address | `"canary.trap.01@icixbank"` |
| `designated_bank` | String (Code) | No | Synthetic bank managing this canary | `"ICIX"` |
| `canary_type` | Enum | No | Type of canary deployment (`REGULATORY_TRIPWIRE`, `INTERNAL_GL_SUSPENSE`) | `"REGULATORY_TRIPWIRE"` |
| `status` | Enum | No | Lifecycle status (`ACTIVE`, `PAUSED`, `DECOMMISSIONED`) | `"ACTIVE"` |
| `created_at` | ISO 8601 UTC | No | Timestamp of canary registration | `"2026-11-14T10:00:00Z"` |
| `hit_count` | Integer | No | Total simulated interaction attempts | `14` |
| `synthetic_tag` | Boolean | No | Explicit synthetic confirmation invariant | `true` |

---

### 1.2 `PaymentAttemptEvent` (Simulated Rail Stream)
Represents an incoming simulated payment transaction.

| Field Name | Data Type | Nullable | Description | Example Value |
|---|---|---|---|---|
| `event_id` | String (UUID) | No | Unique simulated transaction reference | `"TXN-SYNTH-984210"` |
| `timestamp` | ISO 8601 UTC | No | Event creation timestamp | `"2026-11-14T14:22:10Z"` |
| `sender_account_id` | String | No | Synthetic remitter account identifier | `"ACCT_SYNTH_88412"` |
| `sender_vpa` | String | No | Remitter VPA | `"sender.mule02@hdfxbank"` |
| `sender_bank` | String (Code) | No | Remitter bank identifier | `"HDFX"` |
| `beneficiary_vpa` | String | No | Beneficiary VPA | `"canary.trap.01@icixbank"` |
| `beneficiary_bank` | String (Code) | No | Beneficiary bank identifier | `"ICIX"` |
| `amount_inr` | Float | No | Simulated event amount in Indian Rupees; an attempt amount unless the event is confirmed settled | `5000.00` |
| `payment_rail` | Enum | No | Rail type (`UPI`, `IMPS`) | `"UPI"` |
| `attempt_type` | Enum | No | Transfer mode (`P2P`, `P2M`, `PENNY_DROP_PROBE`) | `"PENNY_DROP_PROBE"` |
| `device_token` | String | No | Synthetic device fingerprint hash | `"DEV_TOK_99A4F"` |
| `ip_subnet` | String | No | Pseudonymous IP subnet | `"192.168.10.0/24"` |
| `is_canary_hit` | Boolean | No | Whether target matches active canary | `true` |
| `simulated_result` | Enum | No | Outcome (`SETTLED_NORMAL`, `TRIPWIRE_TRIGGERED`, `DECLINED`) | `"TRIPWIRE_TRIGGERED"` |

---

### 1.3 `CanaryAlert` (Operational Flag)
Generated immediately upon canary tripwire activation.

| Field Name | Data Type | Nullable | Description | Example Value |
|---|---|---|---|---|
| `alert_id` | String (UUID) | No | Unique alert identifier | `"ALT-2026-0042"` |
| `event_id` | String | No | Triggering payment attempt event ID | `"TXN-SYNTH-984210"` |
| `canary_id` | String | No | Associated canary endpoint ID | `"CANARY-BLR-001"` |
| `sender_account_id` | String | No | Remitter account tagged for review | `"ACCT_SYNTH_88412"` |
| `risk_level` | Enum | No | Triage severity (`CRITICAL`, `HIGH`, `MEDIUM`) | `"CRITICAL"` |
| `status` | Enum | No | Alert status (`NEW`, `TRIAGED`, `CASE_CREATED`, `DISMISSED`) | `"NEW"` |
| `created_at` | ISO 8601 UTC | No | Alert generation timestamp | `"2026-11-14T14:22:10.015Z"` |
| `detection_latency_ms`| Float | No | Latency from event to alert in milliseconds | `4.2` |
| `zero_funds_verified` | Boolean | No | Invariant verification that zero funds transferred | `true` |

---

### 1.4 `InvestigationCase` (RBI 60-Day SOP Case Dossier)
Auditable case record managing the lifecycle under RBI Mule SOP.

| Field Name | Data Type | Nullable | Description | Example Value |
|---|---|---|---|---|
| `case_id` | String (UUID) | No | Formal investigation dossier ID | `"CASE-2026-0012"` |
| `target_account_id` | String | No | Primary suspected mule account | `"ACCT_SYNTH_88412"` |
| `originating_alert_id`| String | No | Canary alert triggering the investigation | `"ALT-2026-0042"` |
| `case_status` | Enum | No | Status (`OPEN_TRIAGE`, `CUSTOMER_NOTICE_ISSUED`, `DEBIT_HOLD_ACTIVE`, `ESCALATED_LEA`, `CLOSED_BENIGN`, `CLOSED_MULE_CONFIRMED`) | `"OPEN_TRIAGE"` |
| `sop_day_counter` | Integer | No | Elapsed days under the RBI 60-day SOP | `1` |
| `explanation_days_left`| Integer | No | Remaining days in 20-day customer explanation window | `19` |
| `cluster_id` | String | Yes | Associated mule syndicate cluster ID | `"CLUSTER-SYND-04"` |
| `assigned_analyst` | String | No | Analyst handling case | `"analyst_sharma"` |
| `analyst_notes` | Array[String] | No | Timestamped auditable analyst observations | `["Canary tripwire hit; reverse graph reveals shared feeder FEEDER_007."]` |
| `audit_hash` | String | No | SHA-256 cryptographic seal of case state | `"e3b0c44298fc1c149afbf4c8996fb924..."` |
