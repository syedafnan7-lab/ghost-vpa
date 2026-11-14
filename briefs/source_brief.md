# GHOST-VPA — SOURCE BRIEF & CONCEPT NOTE
**Track:** Track 1: Digital Payments Fraud Detection and Prevention  
**Hackathon:** AIMIT × St Aloysius × RBIH FinTech Innovation Hackathon 2026  
**Theme:** Canary-Seeded Graph Intelligence for Pre-Cash-Out Mule-Network Interdiction

---

## 1. Executive Summary
A bank-side fraud-intelligence layer that uses bank-authorised, customer-consented compromised VPAs as controlled canary signals, then applies temporal graph analytics to expose connected mule networks before funds leave the banking system — without creating synthetic KYC identities or modifying NPCI's core UPI switch.

---

## 2. Problem Statement
Existing banking fraud controls rely largely on reactive detection, waiting until syndicates route stolen funds through layered money-mule accounts before initiating post-complaint freezes. Because fraudsters recruit dormant "sleeper" accounts with clean KYC records and split transfers across rapid multi-hop UPI and IMPS chains, conventional anomaly models generate high false-positive rates that freeze legitimate citizens and merchants while missing upstream feeder accounts prior to cash-out.

Furthermore, under the RBI's September 2026 Draft KYC Amendment Directions (Annex III SOP on Suspected Money Mule Accounts), banks must enforce strict 60-day time-bound debit holds, issue mandatory customer notices, and file NCRP-CFCFRMS reports. Meeting these timelines requires deterministic, high-precision attribution rather than probabilistic guesswork.

---

## 3. Proposed Solution
Ghost-VPA applies active cyber-deception (honeypots and canary tokens) to domestic payment rails without violating KYC regulations. Rather than minting fictitious accounts (which contravenes PMLA and RBI KYC norms), the system operates a bank-controlled canary registry integrated directly into the bank's RBI-mandated Mule SOP workflow.

When an attempted transfer targets a registered honeypot/canary VPA:
1. The interaction immediately triggers an alert.
2. The sending account is marked for mule review (`REVIEW_REQUIRED`).
3. **No funds are transferred** (in live concept: ring-fenced suspense ledger; in prototype: simulated zero-funds payment rail).
4. Permitted event metadata is captured.
5. Temporal graph analytics investigate connected entities and upstream feeder nodes.
6. Analysts receive explainable network intelligence and an auditable investigation case.

---

## 4. Key Innovations
- **KYC-Conscious Deception:** Uses an approved state for an existing, consented/bank-designated VPA rather than fabricated identities or synthetic KYC accounts.
- **Canary-Seeded Graph Propagation:** Combines verified signals with temporal motifs and label propagation to uncover multi-hop networks missed by isolated transaction scores. Verified hits act as high-confidence ground-truth seeds (target precision >92%).
- **Victim-Safe Upstream Triage:** Distinguishes likely unwitting pass-through scam victims (who receive protective alerts) from repeat syndicate feeder nodes and shared device fingerprints (which receive proportionate review under RBI SOP guidelines).

---

## 5. Technical Scope & Architecture
- **Simulated Payment Rail:** Deterministic multi-bank UPI/IMPS simulator generating payment events, canary probes, burst transfers, and normal merchant/peer flows.
- **Canary/Honeypot Registry:** Bank-designated regulatory honeypot endpoints, synthetic bank IDs, and approval metadata.
- **Data & Persistence:** FastAPI backend, PostgreSQL for events/alerts/audit trails, NetworkX and Neo4j for entity-relationship and temporal graph operations.
- **Machine Learning & Benchmarking:**
  - Tabular baseline: LightGBM transaction-only classifier.
  - Graph-enhanced detection: LightGBM with graph topological and temporal motif features (fan-in, fan-out, delta-t velocity, amount conservation, canary proximity).
  - Benchmark targets: Evaluate PR-AUC, Precision, Recall, False-Positive Rate on a 100,000-node synthetic network.
- **Analyst Workbench & Visualization:** React + D3.js interactive graph visualization, SLA tracking, case evidence drawer, FIU-IND STR narrative preview, NCRP-CFCFRMS JSON generator, and STIX 2.1 threat intelligence exporter.

---

## 6. Non-Negotiable Operational & Ethical Boundaries
- Zero real money movement. Zero live payment switch modification. Zero synthetic KYC fabrication.
- Zero scraping of private groups or dark web.
- Honeypot interaction triggers an immediate review flag (`REVIEW_REQUIRED`), NOT automatic guilt or instant account freeze.
