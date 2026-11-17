# Ghost-VPA Threat Model (STRIDE Methodology)

**Project:** Ghost-VPA  
**Document:** `docs/threat-model.md`  
**Methodology:** Microsoft STRIDE & Financial Cyber-Deception Framework  
**Date:** November 2026  

---

## 1. System Decomposition & Attack Surface

The Ghost-VPA architecture comprises five primary interaction interfaces:
1. **Simulated Payment Ingestion Endpoint (`/api/v1/simulate/attempt`)**: Ingests payment attempt metadata.
2. **Honeypot Canary Registry (`/api/v1/canary`)**: Stores and manages active tripwires.
3. **Temporal Graph Query API (`/api/v1/graph/ego`)**: Serves bounded ego-networks to analysts.
4. **Analyst Workbench Interface (Web UI)**: Provides triage, case updates, and hold authorizations.
5. **Threat Intelligence Exporter (`/api/v1/threat-intel/stix`)**: Exports synthetic STIX 2.1 bundles.

---

## 2. STRIDE Threat Analysis & Mitigations

| STRIDE Category | Threat Scenario | Impact | Severity | Mitigating Control & Architectural Safeguard |
|---|---|---|---|---|
| **Spoofing** | Syndicate probes canary endpoints using spoofed remitter bank identifiers or randomized VPAs to identify honeypots without attribution. | Syndicate discovers honeypots and adapts routing to bypass them. | High | **Internal GL Suspense Mapping & Bank-Managed Canary Obfuscation:** Canaries mimic authentic bank handle namespace (`name.dept@bank`). Beneficiary name lookups resolve authentic office names. All remitter telemetry (device fingerprint, IP subnet) is bound to the attempt. |
| **Tampering** | Rogue actor attempts to modify case audit records or retroactively alter canary alert records to shield an accomplice mule account. | Integrity of court/LEA evidence compromised; regulatory sanctions under RBI SOP. | Critical | **Cryptographic Audit Log Hashing:** Every case update and alert is hashed using SHA-256 with previous-block chaining (`prev_hash`), creating an immutable tamper-evident ledger. |
| **Repudiation** | An analyst denies authorizing a 60-day debit hold or an auditor denies viewing confidential syndicate indicators. | Operational dispute; compliance failure. | Medium | **Role-Based Audit Logging:** Every state transition records `actor_id`, `role`, `timestamp_utc`, and `action_type`. Analyst actions are strictly segregated from Supervisor approvals. |
| **Information Disclosure** | Leakage of customer banking records, Aadhaar numbers, or actual transaction amounts to external observers. | Violation of DPDP Act 2023, RBI KYC Directions, and Banking Secrecy Act. | Critical | **Strict Pseudonymization & Synthetic Isolation:** No actual customer PII is ever ingested or stored. Accounts are pseudonymous tokens (`ACCT_SYNTH_XXXX`). STIX 2.1 bundles sanitize all internal node IDs before export. |
| **Denial of Service** | Syndicate floods the payment rail simulator with millions of rapid микро-transfers to exhaust memory and crash the graph analytics engine. | Ingestion latency exceeds 15ms SLA; graph queries time out. | High | **Bounded Ego Graphs & Trie Ingestion:** Canary matching is executed in $O(1)$ memory lookup. Subgraph expansion is strictly bounded to $k \le 2$ hops and $N \le 50$ nodes. Full graph calculations run asynchronously. |
| **Elevation of Privilege** | A caller spoofs `X-User-Role` or `actor_id` to execute case actions. | Unauthorized workflow changes and misleading audit attribution. | High | Formal holds are disabled (HTTP 503); remaining case actions still lack authenticated identity and require a trusted authorization provider before any deployment. |

---

## 3. Cyber-Deception Operational Risks & Safeguards

1. **The Entrapment Defense:**
   - *Risk:* Accusations that the bank induced criminal activity by advertising open honeypot accounts.
   - *Safeguard:* Ghost-VPA uses **passive observation**. Canaries never solicit funds, initiate requests, post fraudulent tasks, or send UPI collect requests. They act purely as silent destinations for transfers initiated entirely by the syndicate.
2. **Unwitting Victim Protection:**
   - *Risk:* An innocent citizen tricked by a scammer transfers funds directly to a honeypot and is erroneously prosecuted.
   - *Safeguard:* A canary hit results in `REVIEW_REQUIRED`, not a criminal complaint. The 20-day explanation window and reverse graph tracing identify one-off victim characteristics (lack of syndicate device tokens, lack of fan-out) and trigger protective alerts.
