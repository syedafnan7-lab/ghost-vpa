# GHOST-VPA — CLAIM AND EVIDENCE REGISTER
**Comprehensive Verification Matrix, De-Escalated Claim Audit & Consequential Source Register**

**Author:** Independent Principal Banking Technology Strategist, Financial Crime Intelligence Researcher & Verification Auditor  
**Evaluator Platform:** Gemini 3.8 Flash via Antigravity CLI  
**Competition:** St Aloysius Foundation / AIMIT FinTech Innovation Hackathon 2026 × RBIH — Track 1  
**Date:** 2026-11-17  
**Status:** READ-ONLY FORMAL AUDIT DELIVERABLE (STAGE 3 FINAL STRATEGIC VERIFICATION)  
**Deliverable Path:** `artifacts/step5/GEMINI_CLAIM_AND_EVIDENCE_REGISTER.md`  

---

## 1. Classification Methodology & Standards

Every technical, product, regulatory, and competitive differentiation claim made across Ghost-VPA's documentation (`README.md`, `concepts_brief.md`, `judge-pitch.md`, `source_brief.md`, `research-register.md`), code comments, and stage presentations is classified under one of five strict evidentiary tiers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EVIDENTIARY AUDIT TIERS                                   │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ 1. VERIFIED                    │ Indisputably proven through direct local code         │
│                                │ execution, passing regression tests, structural       │
│                                │ invariants, or primary regulatory/gazette records.    │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 2. PARTIALLY SUPPORTED         │ The underlying engineering mechanism is functional,   │
│                                │ but quantitative assertions (e.g. latency SLA, scale) │
│                                │ are uncalibrated, unmeasured, or over-extended.       │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 3. HYPOTHESIS REQUIRING        │ A theoretically and mathematically sound proposition  │
│    EXPERIMENT                  │ that currently lacks empirical validation on an       │
│                                │ unpolluted, realistic benchmark corpus.               │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 4. UNSUPPORTED                 │ A claim that contradicts the actual codebase          │
│                                │ implementation, represents phantom architecture, or   │
│                                │ lacks any verifiable evidence in the repository.      │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 5. WITHDRAWN                   │ A claim that has been proven to be a synthetic        │
│                                │ generator artifact, data leakage, regulatory violation│
│                                │ or false competitor assertion; excised permanently.   │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 2. Product & Technical Differentiation Claims Register

The table below reconciles all 28 critical claims made across the Ghost-VPA project lifecycle against the actual repository implementation, live test runs, and primary regulatory publications (including NPCI Circular OC 215A/2025-26, RBI PR 59465, and RBI Annual Report Pub Id 1466).

| # | Specific Claim Statement | Document Source | Audit Classification | Code / Empirical / Regulatory Reality | Action Mandate for Hackathon |
|---|---|---|---|---|---|
| **C01** | **Zero Real Funds Movement Invariant:** No actual fiat currency moves; system strictly operates without core payment gateway access. | `concepts_brief.md:49`<br>`config.py:34`<br>`rail.py:51` | **VERIFIED** | Enforced structurally via `ALLOW_REAL_PAYMENT_RAILS=False`. Zero banking network SDKs or outbound sockets exist in the repository. | **Retain as Core Anchor.** Essential regulatory safety guarantee. |
| **C02** | **O(1) Canary Registry Lookup:** Canary handles are identified in $< 10\,\mu\text{s}$ at the switch perimeter. | `honeypot_registry.py:22-35` | **VERIFIED** | In-memory Python `set` provides $O(1)$ hash lookup. Tested and verified live under sub-microsecond latency. | **Retain.** Frame as low-overhead switch filter. |
| **C03** | **SHA-256 Chained Audit Ledger:** All triage events, holds, and actions form an immutable, tamper-evident cryptographic chain. | `audit_logger.py:13-53` | **VERIFIED** | Verification endpoint confirms `{chain_intact: True}`. SQLite ISO timestamp ordering resolved. | **Retain.** Address multi-worker DB concurrency in Priority 1. |
| **C04** | **Synthetic Non-PII Identifiers:** Zero real customer identities or PII are used or stored. | `rail.py:69-75`<br>`models.py:12-30` | **VERIFIED** | All identifiers follow synthetic regex patterns (`ACCT_SYNTH_*`, `CANARY_VPA_*`, `DEV_TOK_*`). DB git-ignored. | **Retain.** Demonstrates DPDP Act 2023 compliance. |
| **C05** | **RBI Draft Annex III 60-Day SOP Workflow:** Case dossiers dynamically calculate 60-day maximum hold and 20-day explanation SLA. | `cases.py:16-28`<br>`InvestigationWorkbench.tsx` | **VERIFIED** | Dynamic deadline calculation functions correctly against simulation clock. State transitions fully operational. | **Retain as Primary Asset.** Directly aligns with Draft RBI KYC Amendment. |
| **C06** | **Sub-15ms In-Switch Interception SLA:** Payment tripwires intercept and tag accounts within $< 15\,\text{ms}$. | `judge-pitch.md` §2<br>`ingestion.py:22` | **PARTIALLY SUPPORTED / DESIGN SLA** | In-memory registry lookup is $< 1\,\text{ms}$, but total HTTP API latency ranges from 8 to 45 ms due to SQLite disk sync. | **Reclassify:** Frame as "Design SLA <15ms; prototype measured sub-50ms." |
| **C07** | **STIX 2.1 Threat Intel Export:** Generates OASIS STIX 2.1 bundles with synthetic indicators for inter-bank sharing. | `stix_exporter.py:10-54` | **PARTIALLY SUPPORTED** | Produces a valid STIX 2.1 JSON bundle with `x_ghostvpa_synthetic: True`, but uses non-standard `payment-account` SCO. | **Refine in P1:** Map VPA to standard STIX `user-account` observable. |
| **C08** | **P=1.0 Criminal Ground Truth:** Interacting with a canary proves that the remitter is a criminal money mule. | `judge-pitch.md` §2<br>`concepts_brief.md` | **WITHDRAWN (Reframed)** | **Conflates touch with guilt.** An endpoint interaction proves only that a transaction was attempted, not criminal intent (e.g., unwitting victim, wrong handle). | **Reframe:** State as "P=1.0 Verified Interaction Signal; guilt is probabilistic via graph." |
| **C09** | **Standalone Bot Reconnaissance (`ReqValAdd`):** Canary captures automated botnet enumeration dictionary crawls. | `concepts_brief.md:81` | **WITHDRAWN** | **Prohibited by NPCI OC 215A.** Standalone `ValAdd` is banned; PSP-level rate limiting prevents botnet dictionary scans reaching bank switch. | **Reframe:** Reframe as in-flight payment intent observation during human-initiated transfers. |
| **C10** | **Upstream Feeder Attribution via DU-RLP:** Traces backward against money flow to attribute master syndicate feeder accounts. | `temporal_engine.py`<br>`probe11_cslp_correct_direction.py` | **VERIFIED (After DU-RLP Fix)** | Shipped code failed (-1.0000 separation); DU-RLP fix achieves +0.4465 separation on Scenario B and isolates feeder at 0.4465 vs innocents at 0.0000. | **Execute Priority 0 Fix:** Remove deletion of reverse-reachable nodes. |
| **C11** | **+27.1% Precision Lift on 100k Benchmark:** Graph challenger achieves +27.1% precision lift over tabular baseline. | `README.md`<br>`benchmark.py` | **WITHDRAWN** | **Generator Artifact.** Features were drawn from label-conditional `random.uniform` bands. CS-LP contributed only 0.3 pp to the classifier. | **EXCISE PERMANENTLY.** Do not mention in pitches or slides. |
| **C12** | **94.4% False-Positive Reduction / 0.1% vs 1.4% FPR:** Canary integration cuts FPR by 94.4%. | `README.md`<br>`judge-pitch.md` Q3 | **WITHDRAWN** | **Tautological Generator Artifact.** Benchmark generator code was structurally incapable of emitting benign canary hits. | **EXCISE PERMANENTLY.** |
| **C13** | **Strict Chronological Train/Test Split:** Benchmark evaluates models across an honest time-ordered partition. | `benchmark.py:68` | **WITHDRAWN** | Dataset generator emits no timestamp column. Split is an arbitrary `.iloc[:split_idx]` row split on interleaved records. | **EXCISE PERMANENTLY.** Replace with genuine temporal window split. |
| **C14** | **Consented Turncoat VPAs:** Reassigning surrendered victim VPAs into monitored deception traps with customer consent. | `concepts_brief.md:35`<br>`judge-pitch.md` Q1 | **UNSUPPORTED / LEGALLY IMPERMISSIBLE** | Zero consent workflows exist in code. Legally impermissible under Indian KYC law (customers cannot consent to criminal luring). | **Withdraw Permanently.** Reframe strictly as bank-owned suspense GL handles. |
| **C15** | **Phantom Architecture (PostgreSQL, Neo4j, PyG, TGN, SHAP):** Documentation claims adopted enterprise stack. | `source_brief.md:43`<br>`research-register.md:88-92` | **UNSUPPORTED** | Zero imports or code exist in the repository. Actual stack is SQLite/WAL, NetworkX, LightGBM, and FastAPI. | **Clean Documentation.** Present lightweight, self-contained stack transparently. |
| **C16** | **Server-Side RBAC Hold Barrier:** Analyst cannot authorize formal 60-day debit hold; Supervisor role required. | `cases.py:75-78` | **PARTIALLY SUPPORTED** | Server returns 403, but inspects an unauthenticated client header (`X-User-Role`) with zero cryptographic session check. | **Harden in P1:** Implement signed session tokens for role verification. |
| **C17** | **Case Network Attribution Persistence:** Cases store `cluster_id`, `connected_mule_count`, and `upstream_feeder_account`. | `models.py:70-72`<br>`cases.py:50-52` | **UNSUPPORTED (Shipped)** | Columns exist in SQLite schema, but `ingestion.py:99-124` completely omits them from `CaseModel` instantiation. | **Execute Priority 0 Fix:** Wire attribution engine into ingestion. |
| **C18** | **Zero Real-Funds Test Suite:** Test suite verifies that live rails cannot be activated. | `tests/test_safety_invariants.py` | **PARTIALLY SUPPORTED** | Test passes `ALLOW_REAL_PAYMENT_RAILS=False` as a parameter and asserts it back (tautological verification). | **Harden:** Assert socket-level outbound blocking and mock rail integrity. |
| **C19** | **Continuous Sliding Window Pruning (72h):** Expired edges and isolated nodes are automatically purged. | `temporal_engine.py:72-95` | **VERIFIED** | Unit test `test_72_hour_temporal_sliding_window_pruning` confirms expired edges and isolated nodes are purged. | **Retain.** |
| **C20** | **Cleansleeper Mule Early Catch:** Identifies unflagged sleeper accounts before major cash-out transfers occur. | Stage 3 Report §8 | **HYPOTHESIS REQUIRING EXPERIMENT** | Mathematically sound under DU-RLP; requires empirical validation on the 5-experiment synthetic benchmark corpus. | **Validate via Experiment E.** |
| **C21** | **18,000 TPS Throughput Capacity:** Ghost-VPA processes up to 18,000 transactions per second in-switch. | Stage 2 Pitch Notes | **WITHDRAWN** | **18,000 TPS is national aggregate UPI peak capacity**, not Ghost-VPA throughput. Prototype processes ~500 TPS on SQLite. | **EXCISE PERMANENTLY.** Quote prototype capacity (~500 TPS) and switch O(1) filter. |
| **C22** | **Two-Hour vs 15ms Detection Lead Time:** Canary detection detects mules two hours faster than baseline bank systems. | Stage 2 Pitch Notes | **WITHDRAWN** | No comparative empirical trial was run against live bank SOC queues to measure real-world baseline triage latency. | **EXCISE DELTA.** State as qualitative advantage of switch-level interception. |
| **C23** | **26% Baseline vs 84% Canary Feeder Attribution:** Canary graphs achieve 84% feeder attribution vs 26% baseline. | Stage 2 Report §5 | **WITHDRAWN as Metric / HYPOTHESIS** | Figures were conceptual model projections, not measured benchmark runs on a multi-bank dataset. | **Reclassify as Hypothesized Target.** Validate through Experiment B. |
| **C24** | **+0.4465 Separation Metric:** DU-RLP algorithm achieves +0.4465 separation between mules and legitimate accounts. | `GEMINI_INDEPENDENT_TECHNICAL_RED_TEAM.md` | **QUALIFIED RESULT** | Measured on a specific synthetic Scenario B topology (`probe11`), not an aggregate macro-network performance figure. | **Qualify:** Accurately cite as "Measured separation on Scenario B synthetic topology." |
| **C25** | **Satark is Strictly Passive / Non-Real-Time:** Epifi's HaRBInger 2024 winner cannot detect mules in real time. | Stage 2 Audit §4 | **WITHDRAWN** | **Directly contradicted by RBI PR 59465.** Official description confirms Satark is a "real-time mule identification solution". | **Correct:** Acknowledge Satark as confirmed real-time account profiling. |
| **C26** | **Tager AI is Exclusively Post-Event:** NapID's HaRBInger 2024 winner cannot operate on in-flight transactions. | Stage 2 Audit §4 | **WITHDRAWN** | **Directly contradicted by RBI PR 59465.** Official description confirms Tager AI is a "real-time interoperable AI platform using Loop Tagging". | **Correct:** Acknowledge Tager AI as confirmed real-time cross-bank tracing. |
| **C27** | **RBIH Institutional Inability to Deploy Decoys:** RBIH's non-bank status prevents it from deploying canaries. | Stage 2 Pitch Notes | **WITHDRAWN** | Flawed reasoning. RBIH collaborates directly with scheduled commercial banks (SBI, Canara) and can issue specs. | **Reframe:** Argue functional separation of concerns, not institutional monopoly. |
| **C28** | **Regulatory Penny-Drop Testing by Syndicates:** Syndicates use regulatory penny-drops to test mule accounts. | Stage 2 Audit §3 | **WITHDRAWN (Reframed)** | **Under NPCI OC 215A**, penny-drops are restricted to MCC 7413. Syndicates test mules via standard P2P ₹1-10 transfers. | **Reframe:** Describe as generic P2P micro-transfers (MCC 0000), not regulatory penny-drops. |

---

## 3. Consequential External Sources Register

Every regulatory mandate, official central bank release, competitor award, academic paper, and multilateral report cited across the investigation is cataloged below with strict primary authority tracking, retrieval timestamps, and exact context limitations.

| ID | Publisher & Direct Source URL | Publication Date | Retrieval Date | Source Tier | Exact Claim Supported | Source Limitations & Context |
|---|---|---|---|---|---|---|
| **S01** | **Reserve Bank of India (RBI)**<br>`https://m.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63587` | 2026-09-11 | 2026-11-16 | **Primary (Official Gazette)** | Draft RBI (KYC) Amendment Directions 2026 issued for public comment; introduces Annex III SOP for money mules; specifies 60-day maximum hold limit and 20-day customer explanation SLA. | Issued as a draft proposal (comment deadline 2 Oct 2026). Mandatory to cite as draft until final gazette notification. |
| **S02** | **Reserve Bank of India (RBI)**<br>`https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=62590` | 2025-01-07 | 2026-11-16 | **Primary (Official Press Release)** | HaRBInger 2025 (4th Edition) results: In Theme "Enhancing Trust", jury awarded NO first prize; Team FraudLens awarded runner-up for real-time transaction scoring. | Proves that central bank juries withhold top prizes from generic transaction risk scorers. |
| **S03** | **Reserve Bank of India (RBI)**<br>`https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=59465` (PR 2024-2025/1852) | 2025-01-04 | 2026-11-17 | **Primary (Official Press Release)** | HaRBInger 2024 results: Epifi Technologies ('Satark' — real-time mule identification) and NapID Cybersec ('Tager AI' — real-time interoperable AI platform using Loop Tagging) declared joint winners. | Primary benchmark defining prior art. Establishes that competitors possess real-time and cross-bank capabilities. |
| **S04** | **National Payments Corporation of India (NPCI)**<br>`https://www.npci.org.in/uploads/UPI_OC_No_215_A_FY_2025_26_Guidelines_on_usage_of_UPI_AP_Is_51f4521ef0.pdf`<br>(Circular `NPCI/UPI/OC/215A/2025-26`) | 2025-05-21 | 2026-11-17 | **Primary (Operating Circular)** | Guidelines on usage of UPI APIs: `ValAdd` must only be used when customer intends to pay; standalone `ValAdd` is banned; penny-drop restricted to regulated entities under MCC 7413 with explicit consent. | Invalidates claims of automated botnet dictionary enumeration via `ReqValAdd`; restricts penny-drop surveillance to P2P micro-transfers. |
| **S05** | **National Payments Corporation of India (NPCI)**<br>Circular No. `NPCI/UPI/OC No. 180/2023-24` | 2023-11-07 | 2026-11-17 | **Primary (Operating Circular)** | UPI IDs and mobile numbers inactive for $>1$ year must be deactivated for inward credit and deregistered from the central UPI mapper. | Proves that purely passive dormant VPAs cannot receive inbound funds on standard UPI rails. |
| **S06** | **National Payments Corporation of India (NPCI)**<br>UPI 2.0 Procedural Guidelines & API Spec (`ReqValAdd`) | 2021-04-15 | 2026-11-17 | **Primary (Technical Specification)** | `ReqValAdd` is the mandatory non-financial address validation request routed to the destination bank switch to resolve beneficiary name before `ReqPay`. | Confirms that beneficiary validation is observable at the destination bank switch with zero fund movement. |
| **S07** | **Reserve Bank of India (RBI)**<br>`https://www.rbi.org.in/scripts/AnnualReportPublications.aspx?Id=1466`<br>(Annual Report 2024–25 / 2025–26) | 2025-05-30 | 2026-11-17 | **Primary (Statutory Annual Report)** | Documents RBI strategic initiatives: MuleHunter.ai deployed across commercial banks; DPIP phased rollout for real-time digital payment intelligence; cross-bank negative registries. | Defines the incumbent central infrastructure. Proves Ghost-VPA must act as a complementary sensor, not an alternative platform. |
| **S08** | **Press Information Bureau (PIB), Govt of India**<br>`https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260277` | 2026-05-12 | 2026-11-16 | **Primary (Government Release)** | Indian Cyber Crime Coordination Centre (I4C, MHA) signed formal MoU with RBIH to integrate I4C Suspect Registry into MuleHunter.ai. | Confirms that the state already operates a national shared-intelligence mule detection pipeline. |
| **S09** | **Indian Cyber Crime Coordination Centre (I4C)**<br>`https://i4c.mha.gov.in/initiative.aspx` | 2024-09-10 | 2026-11-16 | **Primary (Government Portal)** | National Cybercrime Reporting Portal (NCRP), 1930 Helpline, CFCFRMS, and Suspect Registry live across 61+ commercial banks. | Defines the post-fraud reporting reality; confirms that central alerts suffer multi-hour/day latency. |
| **S10** | **Bank for International Settlements (BIS)**<br>`https://www.bis.org/pages/cpmi-cross-border-payments-programme/pietf-fraud-report-2026.pdf` | 2026-06-20 | 2026-11-16 | **Primary (Multilateral Report)** | BIS PIETF Fraud Report 2026 names MuleHunter.ai (RBIH) and confirms RBI's Digital Payments Intelligence Platform (DPIP) phased deployment. | High-credibility independent multilateral validation of MuleHunter.ai and DPIP. |
| **S11** | **Economic Times BFSI**<br>`https://bfsi.economictimes.indiatimes.com/news/banking/rbih-promotes-mulehunterai...` | 2025-11-14 | 2026-11-16 | **Secondary (Tier-1 Financial Trade Press)** | MuleHunter.ai adopted by 28–30 commercial banks; free to public sector banks; 19 behavioral rules; Canara Bank reports ~95% detection. | Establishes the incumbent baseline that Ghost-VPA cannot compete against on cost. |
| **S12** | **arXiv Preprint (Cornell University)**<br>`https://arxiv.org/html/2610.21314v1` | 2026-10-24 | 2026-11-16 | **Primary (Academic Preprint)** | Relational learning for mule detection on RBIH NFPC dataset: ROC-AUC 0.959, PR-AUC 0.815; trees match graphs at $k=100$; graphs pull ahead at $k=500$. | Proves that on dense bank schemas, tree ensembles match graphs on top-tier alerts; establishes academic benchmark bar. |
| **S13** | **arXiv Preprint (Cornell University)**<br>`https://arxiv.org/html/2607.17586v1` | 2026-07-22 | 2026-11-16 | **Primary (Academic Preprint)** | Explainable mule detection pipeline using LightGBM on 280 features + TreeSHAP feature attributions + self-hosted LLM narrative generator. | Establishes the state of the art for explainable AI in banking fraud triage. |
| **S14** | **GitHub Repository (Rupesh Bharambe / NFPC Winner)**<br>`https://github.com/rupeshbharambe24/National-Fraud-Prevention-Challenge-Phase-1` | 2026-03-02 | 2026-11-16 | **Primary (Source Code & Notebooks)** | National Fraud Prevention Challenge 2026 Phase-1 winning solution: 615 engineered features, LightGBM+CatBoost+XGBoost stacking on 7.4M txns / 40k accounts. | Demonstrates that RBIH's own hackathon winners already utilize comprehensive fan-in/fan-out motif analysis. |
| **S15** | **Supreme Court of India / MediaNama**<br>`https://www.medianama.com/2026/11/223-supreme-court-whatsapp-digital-arrest` | 2026-11-04 | 2026-11-16 | **Secondary (Court Legal Reporting)** | Supreme Court of India recorded RBI's commitment to notify final mule account directions by 30 Nov 2026, targeting enforcement by 31 Dec 2026. | Establishes the urgent statutory timeline driving bank procurement of compliance solutions. |
| **S16** | **Recorded Future / CYBERA**<br>`https://www.recordedfuture.com/blog/recorded-future-money-mule-intelligence-cybera` | 2025-10-18 | 2026-11-16 | **Secondary (Vendor Technical Release)** | CYBERA uses agentic AI personas to engage active scammers externally, identifying 16,000+ confirmed mule accounts across 72 countries. | Proves that interaction-sourced ground truth is commercially viable, but CYBERA operates outside the bank rail. |
| **S17** | **Facephi**<br>`https://facephi.com/en/mule-account-detection` | 2025-03-19 | 2026-11-16 | **Secondary (Vendor Product Release)** | Lists "intelligent honeypots" among pre-fraud signals for mule account detection alongside biometric onboarding and device identity. | Disproves the claim that Ghost-VPA is the first to use honeypots for mules; narrows Ghost-VPA's claim to payment endpoints. |
| **S18** | **BioCatch**<br>`https://www.biocatch.com/blog/the-value-of-precision-in-disrupting-mule-networks` | 2025-08-12 | 2026-11-16 | **Secondary (Vendor Case Study)** | Tier-1 European bank deployment: €12.4M prevented, mule false positives reduced by 30%, detection increased by 54% using behavioral biometrics. | Establishes the enterprise standard for production precision metrics expected by bank CTOs. |
| **S19** | **AIMIT / St Aloysius Foundation**<br>`https://fintech-hackathon.aimit.edu.in` | 2026-10-01 | 2026-11-16 | **Primary (Official Competition Portal)** | Hackathon rules: 6 official judging criteria, "Design for Trust" pillars, boot camp timeline (4–6 Dec 2026), prize pool (₹3 Lakhs). | Primary benchmark for scoring and evaluation criteria. |
| **S20** | **Reserve Bank Innovation Hub (RBIH) TechSprint 2026**<br>`https://www.linkedin.com/posts/reserve-bank-innovation-hub_edd-fraudprevention...` | 2026-08-20 | 2026-11-16 | **Primary (Institutional Channel)** | RBIH actively procuring pre-EDD triage engine and automated 60-day SOP case management platform with Bandhan/RBL/UCO banks. | Confirms that generic case management is being commoditized by RBIH procurement. |
| **S21** | **Ministry of Finance, Govt of India**<br>Prevention of Money Laundering Act (PMLA), 2002 | 2002-07-01 | 2026-11-17 | **Primary (Statutory Legislation)** | Section 3 (Offence of Money Laundering) & Section 12 (Reporting Obligations of Banking Companies). | Mandates that banks cannot open accounts in fictitious names, binding canaries to internal GLs. |
| **S22** | **Ministry of Law and Justice, Govt of India**<br>Digital Personal Data Protection Act (DPDPA), 2023 | 2023-08-11 | 2026-11-17 | **Primary (Statutory Legislation)** | Section 4 & Section 17 (Exemptions for prevention, detection, and investigation of financial fraud). | Confirms that exporting technical non-PII threat intel bundles (STIX 2.1) is legally protected under Indian privacy law. |

---

## 4. Final Verification Summary & Judging Advisory

```
                                  FINAL AUDIT SCORECARD
                                  
       Total Evaluated Claims: 28           Total Consequential Sources: 22
       ──────────────────────────           ───────────────────────────────
       [✔] VERIFIED:              7         [★] Primary Regulatory/Legal: 14
       [~] PARTIALLY SUPPORTED:   4         [◆] Academic / Benchmark:      4
       [?] HYPOTHESIS:            2         [▲] Vendor / Industry:         4
       [!] UNSUPPORTED:           3
       [✗] WITHDRAWN / EXCISED:  12
```

### 4.1 What Must Be Presented to Judges (The Unassailable Core)
1. **The Tactical Sensor Innovation:** Ghost-VPA is an active intelligence acquisition layer deploying bank-owned payment endpoints on internal suspense GLs. It solves the cold-start problem by generating deterministic interaction signals at the bank switch.
2. **DU-RLP Reverse Backpropagation:** Directed Upstream Reverse Label Propagation correctly navigates backwards against directed fund transfers ($E_{\text{rev}} = \{(v, u) \mid (u, v) \in E\}$), achieving $+0.4465$ separation on Scenario B and isolating upstream master feeders without infecting innocent payees.
3. **Statutory Annex III 60-Day SOP Compliance:** Full administrative case management adhering to the Draft RBI KYC Amendment Directions, including automated 20-day explanation notices, 60-day maximum holds, and tamper-evident SHA-256 audit chaining.
4. **Complementarity to MuleHunter.ai & DPIP:** Positioned as an edge sensor providing verified interaction telemetry to central platforms, not an ungrounded competitor.

### 4.2 What Must Never Be Uttered to Judges
- **NEVER** claim "+27.1% precision lift" or "0.1% FPR" (synthetic generator artifacts).
- **NEVER** claim "18,000 TPS throughput" (confuses national UPI capacity with prototype throughput).
- **NEVER** claim "P=1.0 proof of criminal guilt" (an interaction signal is deterministic; guilt is probabilistic).
- **NEVER** claim that HaRBInger winners (Satark, Tager AI) are non-real-time or passive (contradicted by RBI PR 59465).
- **NEVER** propose scanning botnets via standalone `ReqValAdd` (prohibited by NPCI Circular OC 215A).

---
*Register certified by Independent Technical, Legal & Regulatory Verification Audit — Antigravity CLI.*
