# Ghost-VPA: RFC Concepts Brief & Problem Formulation

**Project:** Ghost-VPA — Bank-Controlled Honeypot VPAs  
**Target File:** `concepts_brief.md`  
**Author:** Coordinated Senior FinTech Engineering Team  
**Review Standard:** Elephant-Goldfish Model (EGM) RFC Standard  
**Date:** November 2026  

---

## 1. Problem Statement & Root Cause

### 1.1 The Money-Mule Laundering Trilemma in Domestic Fast Payments
In modern domestic instant payment rails (UPI and IMPS in India), financial crime syndicates exploit structural vulnerabilities:
1. **Velocity Mismatch:** Funds are transferred across 3 to 6 hops of mule accounts within seconds to minutes, while victim complaints and inter-bank freezing requests (via NCRP/CFCFRMS) operate on multi-hour or multi-day latencies.
2. **Tabular Anomaly Blindspots:** Fraud models evaluating isolated transactions (amount, device IP, geo-velocity) produce unacceptable false-positive rates (often >70% false alerts), indiscriminately freezing innocent citizens, students, and small merchants whose transaction patterns resemble bursty activity.
3. **Upstream Feeder Invisibility:** Current bank controls only flag destination accounts reported by victims. The upstream syndicate feeders, script-driven routing hubs, and coordinated feeder networks remain unidentified and continue operating uninhibited.

### 1.2 Regulatory Compulsion: The RBI September 2026 Draft KYC Directions
The Reserve Bank of India's Draft KYC Amendment Directions, 2026 (published 11 Sep 2026 for consultation, targeting 1 Apr 2027 commencement) introduces Annex III: *Standard Operating Procedure (SOP) for Suspected Money Mule Accounts*. Key compliance mandates include:
- Strict **60-day maximum time-bound debit hold** (prohibiting open-ended freezes without court/LEA orders).
- Mandatory **20-day explanation window** for the registered customer to respond to inquiries.
- Separation of unwitting scam victims from repeat syndicate mules.
- Standardized reporting to NCRP-CFCFRMS and FIU-IND (Suspicious Transaction Reports).

Banks currently lack the deterministic network attribution tooling necessary to meet these statutory deadlines with evidence-grade confidence.

---

## 2. The Ghost-VPA Concept: Active Cyber-Deception

### 2.1 Core Mechanism
Ghost-VPA introduces **bank-controlled, bank-designated regulatory canary VPAs** into domestic payment ecosystems.
- Instead of relying solely on reactive post-fraud victim reports, banks maintain an instrumented inventory of honeypot endpoints (e.g. `canary.alert.01@bank`, `tripwire.vault.04@bank`).
- In addition, under the RBI 2026 20-day explanation SOP, verified customers who report an account compromise or surrender an exploited mule VPA can grant informed consent to convert the burned VPA into a monitored "Consented Turncoat Canary".
- When an attacker or automated syndicate script initiates a transfer attempt to a registered Ghost-VPA:
  1. **Instant Tripwire Alert:** The canary match triggers a high-confidence alert within $< 10\text{ ms}$.
  2. **Sender Triaged:** The sending account is immediately tagged `REVIEW_REQUIRED` (not an automatic criminal accusation or premature debit hold).
  3. **Zero Funds Leakage:** In the simulated prototype, zero funds move. In an actual bank pilot, funds are quarantined in an internal suspense ledger (`GL_SUSPECT_CANARY_ESCROW`) preventing any cash-out.
  4. **Canary-Seeded Temporal Graph Propagation:** The canary hit acts as a high-precision ground-truth seed node ($Y = 1.0$). A temporal graph engine fans outward and upstream across a 72-hour window to trace connected accounts, calculate inter-hop velocity ($\Delta t$), analyze amount conservation ratios, and expose coordinated mule rings.
  5. **Explainable Case Dossier:** An auditable investigation record is created with visual graph evidence, FIU-IND narrative previews, and STIX 2.1 cyber-threat indicator bundles.

---

## 3. Inviolable Constraints & Operational Boundaries

| Constraint Vector | Rule & Verification Standard |
|---|---|
| **Zero Live Rails** | No connection to NPCI production switch, live CBS, or live payment gateways. All events run through an internal deterministic simulator. |
| **Zero Real Money Movement** | Absolutely no penny-drop tests (₹1/₹10), no real UPI collect requests, no suspense-ledger real cash movement. |
| **No Fictitious KYC** | Strictly forbidden under PMLA 2002. No synthetic identity documents, no fabricated customer profiles. Only synthetic, pseudonymous identifiers (`ACCT_SYNTH_XXXX`) are used. |
| **No Automatic Guilt / Freezing** | A canary hit marks an account for `REVIEW_REQUIRED`. Human analysts and supervisors govern formal holds and customer outreach under the RBI 20-day window. |
| **No Illicit Scraping** | No infiltration of private Telegram/WhatsApp channels, no dark-web credential scraping. |
| **Draft Regulatory Citation** | The RBI KYC Amendment Directions are strictly described as a 2026 draft proposal, not an active enacted mandate. |

---

## 4. Multi-Lens Stress-Testing & Contrarian Challenges

### 4.1 Contrarian / YAGNI Lens
- *Challenge:* Why do we need honeypot VPAs at all? Can't banks simply tune their existing transaction monitoring rules or run graph analytics on all UPI transactions?
- *Rebuttal & Resolution:* Running real-time full-graph clustering on hundreds of millions of daily UPI transactions is computationally intractable and creates massive false-positive fatigue (ratio of false alerts to true fraud exceeds 95:1). A canary tripwire provides a **deterministic ground-truth anchor** ($Precision > 92\%$). Instead of searching blindly for needles in a haystack, the canary provides the exact coordinates of the magnet, allowing bounded, high-precision k-hop graph expansion ($< 50\text{ ms}$) precisely when and where syndicate activity occurs.

### 4.2 Cost, Quota & Token Economics Lens
- *Challenge:* Will graph expansion and temporal GNN inference blow up database query limits and memory footprints on a 100,000-node network?
- *Rebuttal & Resolution:*
  1. We enforce bounded subgraphs: ego networks are restricted to 2 hops or max 50-100 nodes around the trigger event.
  2. Bounded temporal sliding window (72 hours default) caps the edge traversal volume.
  3. Hybrid graph architecture: In-memory NetworkX handles ultra-low latency feature extraction (< 15ms) for simulated streams; persistent Neo4j stores historical topologies.
  4. LightGBM serves as the sub-5ms operational classifier; temporal GNN (PyG) is reserved for offline benchmark validation.

### 4.3 UX & Developer Ergonomics Lens
- *Challenge:* Will analysts be overwhelmed by complex D3 graph spaghetti and cryptic graph metrics?
- *Rebuttal & Resolution:*
  1. The analyst interface separates high-level triage (Operations Dashboard with key SLAs and RBI 60-day timers) from deep investigation (Network Explorer).
  2. The graph visualization uses color-coded semantic nodes (Canary Beacon = Red Crimson, Mules = Orange/Amber, Upstream Feeders = Purple, Benign Nodes = Emerald).
  3. Clicking any node opens an Evidence Drawer with clear, plain-language risk factors (e.g. "Hop 1 from Canary, Transferred ₹45,000 within 4 mins of feeder deposit, Shared Device Token with ACCT_891").

### 4.4 Rollout, Compatibility & Migration Lens
- *Challenge:* How would this deploy into an actual Tier-1 commercial bank without disrupting existing CBS/PSP systems?
- *Rebuttal & Resolution:* Ghost-VPA acts strictly as a passive sidecar/webhook subscriber. It subscribes to simulated ISO 8583 / UPI `ReqValAdd` metadata. In production, it requires zero core banking schema migrations—only a read-only event listener and a hook into the existing suspense GL / lien management module.

---

## 5. Proposed Demonstration Scenarios

1. **Scenario A — Honeypot Tripwire:** Synthetic sender attempts ₹5,000 transfer to `canary.alert.01@bank`. Tripwire fires in 4ms, flags sender as `REVIEW_REQUIRED`, logs event metadata, confirms zero funds moved.
2. **Scenario B — Shared Upstream Feeder:** Three distinct synthetic mule accounts transfer funds to two different canaries. Graph analytics traces backward to reveal a single upstream feeder node (`FEEDER_SYNTH_007`) funneling ₹1,50,000 across the accounts.
3. **Scenario C — Benign Lookalike (False Positive Mitigation):** A legitimate high-volume MSME merchant account exhibits rapid burst transactions. Conventional transaction rules flag it; Ghost-VPA's canary-seeded graph proves zero connectivity to any canary or known syndicate cluster, preventing an unjustified freeze.
4. **Scenario D — Multi-Hop Layering Chain:** A 4-hop syndicate transfer sequence ($Feeder \to Mule_1 \to Mule_2 \to Mule_3 \to Canary$) executed within a 30-minute window. Temporal motif detector highlights inter-hop velocity and amount-conservation ratios.
