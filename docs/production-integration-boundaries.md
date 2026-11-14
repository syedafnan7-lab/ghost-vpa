# Ghost-VPA Production Integration Boundaries & Pilot Architecture

**Project:** Ghost-VPA  
**Document:** `docs/production-integration-boundaries.md`  
**Target Audience:** Bank IT Architecture, Chief Information Security Officers (CISO), Chief Risk Officers (CRO)  
**Date:** November 2026  

---

## 1. Executive Deployment Summary

Ghost-VPA is explicitly engineered to deploy as a **non-intrusive, read-mostly Core Banking System (CBS) and Payment Service Provider (PSP) sidecar**. It requires:
- **Zero changes to NPCI core switches or UPI Central Mapper protocols.**
- **Zero modification to standard ISO 8583 / ISO 20022 message flows.**
- **Zero synthetic account creation on production general ledgers.**

---

## 2. Integration Architecture & System Boundaries

```
[ NPCI UPI Switch ] ──(ReqValAdd / ReqPay)──► [ Bank PSP Server ]
                                                     │
                                       (Internal Event Mirror)
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │   Ghost-VPA CBS/PSP Sidecar  │
                                      │                              │
                                      │  1. Canary Registry Lookup   │
                                      │  2. Suspense GL Routing      │
                                      │  3. Temporal Graph Tracing   │
                                      │  4. Case / STR Auto-Dossier  │
                                      └──────────────┬───────────────┘
                                                     │
               ┌─────────────────────────────────────┼──────────────────────────────────┐
               ▼                                     ▼                                  ▼
      [ CBS Lien / GL API ]               [ Bank Case Mgmt / NCRP ]             [ Threat Sharing ]
     (Suspense Ring-Fencing)             (CFCFRMS Webhook Connector)             (STIX 2.1 via TAXII)
```

---

## 3. Integration Interface Specifications

### 3.1 Interface 1: CBS Inbound Payment Mirror (Webhook / Kafka)
- **Protocol:** High-throughput internal Kafka topic (`upi.events.inbound.v1`) or low-latency gRPC stream.
- **Payload:** Stripped transaction metadata (Remitter VPA, Beneficiary VPA, Amount, Device Token Hash, IP Subnet, Timestamp).
- **CBS Impact:** Completely passive; does not block normal transaction settlement for non-canary events.

### 3.2 Interface 2: Suspense Ledger & Lien Routing (`CBSLienAdapter`)
- **Production GL Setup:**
  - Dedicated General Ledger Code: `GL_18490_SUSPECT_CANARY_ESCROW`.
  - When an inbound payment targets a registered canary, the beneficiary bank CBS routes the credit to `GL_18490` rather than the compromised customer ledger.
  - Outbound debit privileges are locked at the CBS account parameter level (`POSTING_RESTRICTION_CODE = "DEBIT_HOLD_RBI_SOP"`).
- **Prototype Status:** Fully mocked via simulation event status `TRIPWIRE_TRIGGERED` and zero-funds invariant validator.

### 3.3 Interface 3: National Cybercrime Portal (`NCRPCFCFRMSAdapter`)
- **Regulatory Standard:** Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / I4C).
- **Integration Payload:** Standardized JSON payload reporting:
  - Suspected Mule Account Number & IFSC.
  - Linked Mobile Number (pseudonymized).
  - Associated Canary VPA Hit.
  - Upstream Feeder Accounts identified by temporal graph propagation.
  - Timestamp of 20-day notice issuance.
- **Prototype Status:** Formatted as downloadable compliance JSON dossier in the Investigation Workbench.

### 3.4 Interface 4: Financial Intelligence Unit (`FIU_IND_STR_Adapter`)
- **Regulatory Standard:** Suspicious Transaction Report (STR) under PMLA Rules.
- **Output:** Structured narrative text detailing the multi-hop layering motif, amount conservation velocity, and canary trigger points.
- **Prototype Status:** Live narrative generator embedded in the Case Dossier view.

---

## 4. Institutional Approvals & Governance Checklist

Prior to production pilot rollout in a commercial bank, the following institutional approvals are legally mandatory:
1. **Board Risk Management Committee (BRMC) Approval:** Authorizing the deployment of active cyber-deception endpoints.
2. **Chief Compliance Officer (CCO) Concurrence:** Formal sign-off on the 20-day customer explanation window and Annex III SOP alignment.
3. **CISO & Cyber Threat Intelligence (CTI) Review:** Validation of Canary namespace isolation to ensure honeypots cannot be exploited for unintended lateral movement.
4. **NPCI & RBI Regulatory Sandbox Filing:** Formal notification under the regulatory sandbox framework for cross-bank canary intelligence sharing.
