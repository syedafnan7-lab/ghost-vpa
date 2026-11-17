# Ghost-VPA: Hackathon Pitch & Strategic Positioning

**Project:** Ghost-VPA: Canary-Seeded Graph Intelligence for Pre-Cash-Out Mule-Network Interdiction  
**Track:** Track 1: Digital Payments Fraud Detection and Prevention  
**Hackathon:** AIMIT × St Aloysius × RBIH FinTech Innovation Hackathon 2026  
**Document:** `docs/judge-pitch.md`  

---

## 1. The Value Proposition in One Sentence
> *"Ghost-VPA transforms domestic payment rails into an active cyber-defense honeynet using bank-designated canary VPAs and temporal graph propagation to neutralize money-mule rings before stolen funds can be cashed out."*

---

## 2. Competitive Differentiation: Why Ghost-VPA Wins

| Traditional Bank Approaches | Standard AI Fraud Models | Ghost-VPA Active Deception |
|---|---|---|
| **Reactive Victim Reports:** Freezes happen hours/days after funds have left the banking system. | **Transaction-Only Scoring:** High false positives (>70%), mistakenly freezing legitimate students, gig workers, and MSMEs. | **Proactive Canary Tripwires:** Millisecond detection at Hop 1 or 2 as syndicates test or route through honeypots. |
| **Isolated Account View:** Banks look only at their own beneficiary accounts without multi-hop linkage. | **Black-Box Probabilistic ML:** Difficult to defend during customer ombudsman complaints or court appeals. | **Explainable Temporal Graph Motifs:** Transparent, evidence-grade attribution showing shared feeders, delta-t velocity, and device links. |
| **Reactive response:** Post-incident reports may arrive after funds move. | **Behavioral inference:** Models infer risk from observed activity. | **Research question:** Could a bank-controlled canary interaction add a distinct, reviewable signal to temporal graph investigation? |

---

## 3. Anticipated Judge Questions & Bulletproof Answers

### Q1: *"Does setting up honeypot VPAs violate RBI KYC guidelines or PMLA?"*
**Answer:**
> *"This prototype uses only pseudonymous synthetic identifiers on an internal simulation rail. A bank-owned canary endpoint is a proposed deployment concept; it has not been provisioned or legally approved in this project."*

### Q2: *"Does this require changing NPCI's core UPI switch?"*
**Answer:**
> *"There is no live UPI or NPCI integration in this prototype. A bank-side event interface is a future design proposal that requires bank, regulatory, legal, and payment-rail review."*

### Q3: *"How does this stop false positives on innocent users?"*
**Answer:**
> *"The prototype creates a `REVIEW_REQUIRED` triage flag and never makes a guilt determination or applies a hold. Its graph tests show backward propagation on constructed synthetic cases; they do not establish real-world false-positive rates. The September 2026 RBI KYC amendment directions remain a draft proposal."*

### Q4: *"Can fraud syndicates easily identify and avoid these honeypot VPAs?"*
**Answer:**
> *"Discoverability and operational feasibility have not been tested. The demo's canary interactions are synthetic, and no real payment request, address lookup, suspense routing, or fund movement occurs."*
