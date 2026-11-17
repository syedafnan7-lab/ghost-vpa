# STEP 5 — STAGE 2 SOURCE REGISTER (EXTERNAL)

Every external claim in `02_STAGE2_COMPETITIVE_AND_JUDGING_ANALYSIS.md` traces to
an entry below. All Stage 1 claims stay traced to `00_SOURCE_REGISTER.md`.

**Method:** Tavily MCP search + page extraction. Context7 MCP authenticated and
used for the NetworkX library check. No Firecrawl/GitHub MCP in this session —
not used, not claimed.

| # | Source | URL | Retrieved | Confidence | Used for |
|---|---|---|---|---|---|
| W1 | Official hackathon site (primary) | `https://fintech-hackathon.aimit.edu.in` | 2026-11-16 | **High** — primary source, full text extracted | Six judging criteria; six-stage timeline; team size 1–2; Track-1 focus areas; "Design for Trust" pillars; partners; boot camp dates; prize structure |
| W2 | RBI press release 2026-2027/1109, 11 Sep 2026 | `https://m.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63587` | 2026-11-16 | **High** — RBI primary | Draft status confirmed; SC order 4 Aug 2026; comment deadline 2 Oct 2026; applies to Commercial Banks + UCBs |
| W3 | RBI draft text, Annex III SOP (full) | `https://m.rbi.org.in/scripts/bs_viewcontent.aspx?Id=5170` | 2026-11-16 | **High** — RBI primary | 20-day / 10-day / 30-day / 60-day step structure; NCRP-CFCFRMS referral; 60-day outer limit; internal-policy requirement for "tech solutions" |
| W4 | ETBFSI, RBI proposes 60-day cap | `https://bfsi.economictimes.b[indiatimes].com/articles/rbi-proposes-60-day-cap-on-temporary-debit-holds-for-suspected-money-mule-accounts/134114446` | 2026-11-16 | Medium-High — tier-1 trade press | ₹1,000 trigger threshold; account-level hold as last resort; effective 1 Apr 2027 or earlier |
| W5 | CorpLawUpdates analysis of draft | `https://www.corplawupdates.in/updates/rbi-draft-kyc-money-mule-sop-2026` | 2026-11-16 | Medium | 20→10/30 structure; same-day notification; 5-yr/10-yr retention; Annex III inserted after Annex II |
| W6 | MediaNama, SC digital-arrest hearing | `https://www.medianama.com/2026/11/223-supreme-court-whatsapp-digital-arrest` | 2026-11-16 | Medium-High | **Notification status**: SC recorded plan to notify by 30 Nov 2026, in force by 31 Dec 2026 — supersedes the draft's 1 Apr 2027 date |
| W7 | India Today video / ET coverage of 29 Oct order | `https://www.youtube.com/watch?v=E9BIRLJoNcY` | 2026-11-16 | Medium — video transcript | Corroborates 30 Nov / 31 Dec dates and SC examination of the proposed directions |
| W8 | RBI press release 2026-2027/1088, HaRBInger 4th edition | `https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=62590` | 2026-11-16 | **High** — RBI primary | Proxy for RBI-style judging: "Enhancing Trust" PS had **no first prize**; a real-time transaction risk-scoring platform took runner-up |
| W9 | arXiv 2610.21314 (Oct 2026) | `https://arxiv.org/html/2610.21314v1` | 2026-11-16 | **High** — peer-reviewed-form preprint | Relational-learning mule detection on the RBIH NFPC dataset: ROC-AUC 0.959 / PR-AUC 0.815; **83.2% precision @ 0.50% false-alarm rate**; trees match graphs at k=100, graphs pull ahead at k=500 |
| W10 | RBIH NFPC hackathon (IIT Delhi TRYST) | `https://www.linkedin.com/posts/tryst-iit-delhi_...` + RBIH posts | 2026-11-16 | Medium | ₹10 lakh prize pool; real-world fraud datasets; internship pipeline — the senior venue for this problem |
| W11 | ETBFSI, MuleHunter.ai adoption | `https://bfsi.economictimes.b[indiatimes].com/articles/rbih-promotes-mulehunterai-for-combatting-cyber-fraud-in-banking/131185297` | 2026-11-16 | Medium-High | 28–30 banks integrated; free to banks; 19 behavioural patterns; Canara Bank ~95% detection claim |
| W12 | I4C × RBIH MoU, PIB | `https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260277` | 2026-11-16 | **High** — Government primary | 12 May 2026 MoU; Suspect Registry fed into MuleHunter.ai — the state already does shared-intelligence detection |
| W13 | I4C initiatives page | `https://i4c.mha.gov.in/initiative.aspx` | 2026-11-16 | **High** — Government primary | Suspect Registry live since 10 Sep 2024, shared across 61+ banks; CFCFRMS / NCRP / Zero-e-FIR landscape |
| W14 | RBI DPIP coverage (multiple) | ETBFSI / CAalley / ET | 2026-11-16 | Medium-High | DPIP: Phase 1 shared negative registry (5→12+ banks), Phase 2 real-time pre-transaction risk scoring |
| W15 | BIS PIETF fraud report 2026 | `https://www.bis.org/pages/cpmi-cross-border-payments-programme/pietf-fraud-report-2026.pdf` | 2026-11-16 | **High** — multilateral primary | Names MuleHunter.AI, cites 2-PSB pilot, confirms RBI's DPIP plan — an independent, citable anchor |
| W16 | Deception-technology canon (Tracebit / Acalvio / NHI Mgmt) | various | 2026-11-16 | Medium | Canary/honeytoken provenance and the known weakness: "bargain-bin deception that an attacker can immediately fingerprint is detected and avoided" |
| L1 | Local: `backend/requirements.txt` + import scan | — | 2026-11-16 | **High** | Declares 16 packages; actual third-party imports = 7 (`fastapi`, `pydantic`, `pydantic_settings`, `sqlalchemy`, `networkx`, `lightgbm`, `sklearn`, `numpy`, `pandas`, `stix2`). No PyTorch-Geometric, no Neo4j driver, no SHAP, no `psycopg`/`asyncpg` |
| L2 | Local: `probe10_cslp_direction.py` / `probe11_cslp_correct_direction.py` | `artifacts/step5/scratch/` | 2026-11-16 | **High** — executed | Stage 1 §3.1 mechanism corrected + **new defect D2** found |
| L3 | Local: `docs/judge-pitch.md`, `briefs/source_brief.md`, `docs/research/research-register.md` | — | 2026-11-16 | **High** | Claims audited against W1–W15 |

## Addendum 2 — second research pass (retrieved 2026-11-16)

| # | Source | URL | Retrieved | Confidence | Used for |
|---|---|---|---|---|---|
| W17 | NFPC 2026 programme page (hackathonradar mirror) | `https://www.hackathonradar.com/database/hackathon/national-fraud-prevention-challenge-2026` | 2026-11-16 | Medium — aggregator mirroring RBIH's own brochure | NFPC explicitly frames its objective as *"Enhance and expand AI/ML capabilities for MuleHunter AI and DPIP"*; ₹10L/₹5L/₹2.5L; teams 2–4; Phase 1 24 Feb 2026, Phase 2 27 Feb–1 Mar 2026 at IIT Delhi |
| W18 | NFPC winner's public GitHub profile | `https://github.com/rupeshbharambe24` | 2026-11-16 | **Low-Medium — self-reported, uncorroborated** | Winning NFPC approach: stacking ensemble (LightGBM + CatBoost + XGBoost), **615 engineered features**, DuckDB streaming on 16 GB RAM, claimed 0.999 AUC-ROC on "400M txns". Prize recorded as ₹5L. **Discrepancy:** W17 lists ₹5L as *second* prize; the profile describes the holder as national winner. Treat the ranking as unverified |
| W19 | NFPC Phase-1 winning repository | `https://github.com/rupeshbharambe24/National-Fraud-Prevention-Challenge-Phase-1` | 2026-11-16 | **High** — primary source, repo content | The canonical public EDA on the real RBIH dataset: 7.4M txns / 40K accounts / 6 relational tables. **Already computes fan-in/fan-out topology, pass-through ratios, dormancy, burstiness, structuring, channel entropy, counterparty metrics.** Directly relevant to whether Ghost-VPA's motif set is novel |
| W20 | RBI press release 2026-2027/1088 — full results table (extracted) | `https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=62590` | 2026-11-16 | **High** — RBI primary | *Enhancing Trust* PS: **winner: none** ("Runners-up" printed where the other two PS sections print "Winner"); runner-up **Team Fraud Lens**, an "AI-Driven fraud detection and compliance platform" doing real-time transaction scoring, risk classification, and prompt action (block / authorise / step-up auth). 496 proposals → 49 shortlisted → 21 in development. **This is the single most direct precedent for how a central-bank jury scored a fraud-detection submission** |
| W21 | RBIH TechSprint 2026 — EDD problem statement | `https://www.linkedin.com/posts/reserve-bank-innovation-hub_edd-fraudprevention-aml-activity-7494233916443340800-j6Qa` | 2026-11-16 | Medium-High — RBIH's own channel | RBIH is procuring, *right now*: a **pre-EDD triage engine**, unified digital EDD case management, de-duplication and prioritisation of alerts, digital investigation and approvals, **CBS-integrated freeze/unfreeze**, escalation, audit trails, automated MIS. Equity-free bank pilot with Bandhan / RBL / UCO / Union Bank. **This is the exact capability area Ghost-VPA's case workflow sits in — stated as a solved-for-hire problem, not an open research question** |
| W22 | Recorded Future / CYBERA money-mule intelligence | `https://www.recordedfuture.com/blog/recorded-future-money-mule-intelligence-cybera` + `https://www.recordedfuture.com/blog/money-mule-solution` | 2026-11-16 | Medium-High — vendor primary | CYBERA uses **agentic personas to engage active scammers and extract verified mule-account details**; "verified through direct engagement, not inferred through probabilistic scoring"; 16,000+ confirmed mule accounts across 72 countries in H2 2025; "On-Us Mule Detection" add-on. **The nearest external analogue to Ghost-VPA's core thesis: obtain ground truth by interaction rather than by scoring** |
| W23 | Facephi mule-account detection (launch + product page) | `https://facephi.com/en/mule-account-detection` · `https://kommunikasjon.ntb.no/pressemelding/18462924/` · `https://leadiq.com/c/facephi/5a1d8afe240000240065b5df` | 2026-11-16 | Medium-High — vendor primary | Facephi lists **honeypots** as one of three named pre-fraud signal sources for mule detection, publicly since **19 Mar 2025**, and classifies accounts as mule / victim / launderer / clean. 5-year Central America mule-detection contract (31 Mar 2026). **"Honeypots for mule detection" is therefore already a commercialised, contract-backed claim — but aimed at onboarding/synthetic-identity signals, not at bank-controlled decoy *payment endpoints* with graph propagation** |
| W24 | BioCach/BioCatch mule-network precision case study | `https://www.biocatch.com/blog/the-value-of-precision-in-disrupting-mule-networks` | 2026-11-16 | Medium — vendor marketing | The bar for "deployment evidence" a jury may compare against: a leading European bank **prevented €12.4M in mule transfers (−33% H2-2025 vs H1-2024), detection +54%, mule false positives −30%**. Five named mule personas. **Ghost-VPA has no figure of this kind and cannot produce one from a synthetic corpus** |
| W25 | RIFT 2026 hackathon project "RIFT EYE" | `https://www.linkedin.com/posts/sainiyash11_rifthackathon-moneymulingdetection-financialcrime-activity-7430440289095471104-Ic9m` | 2026-11-16 | Low-Medium — participant post | Defines the *commoditised floor* of this problem at hackathon level: **upload a transaction CSV, render it as a directed graph, run circular-flow / fan-in / fan-out pattern detection, present a dashboard.** Ghost-VPA is materially above this floor — but a judge who has seen three such demos needs the delta stated in one sentence |
| W26 | arXiv 2607.17586 — explainable mule pipeline | `https://arxiv.org/html/2607.17586v1` | 2026-11-16 | **High** — preprint | LightGBM on **280 engineered features** + **TreeSHAP** attribution + self-hosted LLM narration, with *live production deployment* claimed. **This is the standard the "explainability" criterion is judged against — and Ghost-VPA has no SHAP and no LLM narrative layer** |
| W27 | SAS Hackathon 2026 / HaRBInger structural data (W20) | — | 2026-11-16 | — | Funnel arithmetic: 496 proposals → 49 shortlisted → 21 developed → 3 PS × (1 winner + 1 runner-up) + 1 team award = **7 awards**. Selection rate shortlist/finalist ≈ 21/496 ≈ 4.2%; award rate ≈ 7/496 ≈ 1.4% |

## Corrections to Stage 1 recorded by this register

1. **Stage 1 §3.1 mechanism was stated imprecisely.** The guard does not prevent
   the *outbound* edges from being read; the node itself is skipped, so it never
   receives a score at all. Same conclusion, different fix. See `02_...md` §4.1.
2. **A second, independent CS-LP defect was not found in Stage 1.** Risk is also
   propagated along **inbound** edges, so anyone who received money from a
   suspect inherits the suspect's score. Measured: an innocent beneficiary of a
   mule scores **1.000000** — the maximum, higher than a real feeder ever
   reaches. This directly contradicts `judge-pitch.md` Q3. See §4.2.

## Instrument status as verified on 2026-11-16

| Date | Event | Status |
|---|---|---|
| 4 Aug 2026 | SC directs RBI to adopt and circulate an SOP | Done (W2) |
| 11 Sep 2026 | Draft RBI (KYC) Amendment Directions, 2026 issued | **Draft** (W2) |
| 2 Oct 2026 | Public comment deadline | Closed (W2) |
| 29 Oct 2026 | SC records plan: notify by 30 Nov, in force by 31 Dec 2026 | Court-recorded plan, **not yet a notification** (W6, W7) |
| 30 Nov 2026 | Projected notification | Pending as of this report |
| 1 Apr 2027 | Draft's own proposed commencement, or earlier if a bank opts in | Superseded in practice by W6 — re-verify before the 4 Dec boot camp |

3. **A "canary/honeypot for mule detection at a bank" is not novel as a phrase.**
   Facephi has publicly listed honeypots as a named input to mule detection since
   19 Mar 2025 (W23) and has commercial contracts on it (W23). What Ghost-VPA
   claims is narrower and more specific — a *bank-controlled payment endpoint
   whose probe is a ground-truth seed for temporal graph propagation* — and that
   narrower claim must be stated as such, or the team is claiming something a
   vendor press release already covers.
4. **The Cybera/CYBERA analogue is the closest external competitor to the
   thesis.** It also obtains ground truth by *interaction* with the adversary
   (agentic personas engaging scammers), not by scoring. Ghost-VPA's difference
   is institutional (inside the bank, KYC-safe, auditable, RBI-SOP-aligned)
   versus adversarial (outside, persona-based, vendor-mediated). That
   distinction is defensible and must be stated explicitly, because the naive
   reading is "someone already did this."
5. **RBIH is not open to a new EDD/case-management idea.** TechSprint 2026 (W21)
   is an active, rolling procurement for exactly that capability with named
   partner banks. A hackathon entry that presents case management as its
   innovation will be read as "you have restated our procurement brief."

**Standing instruction (unchanged from Stage 1 and from `AGENTS.md`):** cite this
as a *draft* unless and until RBI's final notification is confirmed on
rbi.org.in. The draft treatment in `research-register.md` is correct and must be
kept.