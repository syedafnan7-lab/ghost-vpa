# STEP 5 — STAGE 2: COMPETITIVE & JUDGING ANALYSIS

**Project:** Ghost-VPA — Bank-Controlled Honeypot VPAs / Canary-Seeded Graph Intelligence
**Competition:** St Aloysius Foundation × AIMIT × RBIH FinTech Innovation Hackathon 2026 — **Track 1: Digital Payments Fraud Detection & Prevention**
**Report date:** 2026-11-16 · **Branch:** `main` @ `61c86a3`
**Method:** external competitive research (Tavily MCP, sources W1–W27 in
`02_STAGE2_SOURCE_REGISTER.md`) cross-referenced against Stage 1's verified
repository audit (`01_REPOSITORY_REALITY_AUDIT.md`, `01A`–`01D`).

**Nothing in this report is inferred from documentation.** Every capability
statement about Ghost-VPA is either Stage 1's executed evidence or one of the
probes in this report. Every external claim carries a W-number.

---

## 1. What the competition actually is, measured

Before comparing solutions, establish the arithmetic, because it determines what
"winning" requires.

### 1.1 The funnel (W1, W20)

| Stage | Count | Note |
|---|---|---|
| Registrations | unknown; registration closed **15 Nov 2026** | Site overrides the brochure/poster: "The 15 November 2026 deadline takes precedence over any earlier date in the brochure or poster" |
| Shortlisted (screening) | notification window **16–20 Nov 2026** — **we are inside this window today** | |
| Semi-finalists | top 50 | online design-thinking workshop |
| Finalists | top 30 | 3-day residential boot camp, AIMIT, **4–6 Dec 2026** |
| Winners | top 3 | ₹3,00,000 pool (₹1 lakh each, per W1's earlier LinkedIn post) |
| Incubation | top 10 | seed-fund support, mentoring; internships at RBIH in 2027 |

**The one directly analogous central-bank funnel is HaRBInger 2025** (W20): 496
proposals → 49 shortlisted → 21 into solution development → **7 awards across
three problem statements plus one all-women team award**. That is a shortlist
rate of 49/496 ≈ 9.9%, a finalist rate of 21/496 ≈ 4.2%, and an award rate of
≈ 1.4%.

Ghost-VPA's funnel is shallower at the top (a ₹3 lakh pool, not RBI's, and a
regional organiser) but the same shape: a large field, a screening gate that is
now closing, and a small final round. **The useful inference is that the gating
step is the written submission, not the demo** — in HaRBInger, 476 of 496 teams
never reached a jury at all.

### 1.2 The six official judging criteria (W1 — primary, full site text)

1. Relevance to the challenge track
2. Innovation and originality
3. Technical feasibility, security and prototype quality
4. User impact, inclusion and scalability
5. Business potential
6. Team capability and quality of presentation

W1 also publishes the "Design for Trust" pillars — **Security, Trust,
Resilience, Inclusiveness, Privacy, Explainability, Responsible Use of Data** —
and the Track 1 focus areas, which are worth reading as a checklist rather than
as prose:

> Mule-account detection · KYC and onboarding fraud · real-time transaction
> anomaly detection · account takeover · UPI, QR-code and deepfake-enabled
> fraud · **explainable AI models for fraud decisions** ·
> **privacy-preserving fraud-intelligence sharing among institutions** · loan,
> document and field-collection fraud in NBFC/MSME lending · verified identity
> and reputation systems using UIDAI, DigiLocker and ONDC.

Note that two of the ten focus areas are **explicitly about inter-institution
sharing and explainability**. Ghost-VPA's own capability inventory (Stage 1 §2)
classifies inter-bank/TAXII sharing as **class 5 — documented, not
implemented** and has no SHAP. Those two criteria-adjacent gaps are not
peripheral; they are named on the problem statement.

### 1.3 The RBI precedent is unambiguous and uncomfortable (W20)

In HaRBInger 2025's third problem statement, *Enhancing Trust in Digital
Financial Services*, the RBI press release prints:

> **"III. Enhancing Trust — Runners-up — Team Fraud Lens (Group of Individual)
> — 'FraudLens' is an AI-Driven fraud detection and compliance platform that
> evaluates transactions in real time and assigns a risk probability and risk
> classification. This enables financial institutions to take prompt action,
> such as blocking suspicious transactions, authorising genuine transactions, or
> triggering additional authentication."**

The other two problem statements in the same release each print a **"Winner"**
and then a **"Runners-up"**. The *Enhancing Trust* section prints **only a
runner-up**. The central bank's own jury **declined to award a first prize to a
real-time transaction risk-scoring fraud platform** (W8, W20).

FraudLens is, in capability terms, exactly what Ghost-VPA's own differentiation
table in `docs/judge-pitch.md` §2 derides as the "Standard AI Fraud Model"
column: transaction scoring, risk classification, block/authorise/step-up. It
reached RBI's final 21 on a proposal out of 496 and did not win.

**Consequences for Ghost-VPA, stated plainly:**

- A real-time risk-scoring platform, however well built, is **demonstrably
  insufficient** at the highest level of this judging style. Ghost-VPA must not
  present itself as that, even though its own `benchmark.py` currently *is* that.
- Conversely: the jury that withholds a first prize is not a jury that rewards
  volume of claims. **A clean, narrow, verifiable claim has a better path than a
  broad impressive one.** This is the single most actionable competitive finding
  in this report.
- FraudLens won runner-up with a *transaction scorer*. Ghost-VPA has a
  *honeypot + graph engine + auditable case workflow + policy-aligned demo*. On
  criterion 2 (innovation) the delta is real. On criterion 3 (prototype
  quality) it depends entirely on whether the team presents the working
  components or the broken headline.

---

## 2. The competitive field: five distinct classes of competitor

Stage 1 §9 Q3 asked what prior winners actually deliver. The research found
*no directly comparable winner* — no Indian or international hackathon winner
has deployed bank-controlled canary VPAs with canary-seeded graph propagation.
That absence is genuine and is worth stating precisely, because it can be read
in two opposite ways and both readings matter.

### 2.1 Class A — The in-house incumbent: MuleHunter.ai / DPIP (W11, W12, W14, W15, W17)

- **What exists:** MuleHunter.AI, built in-house by RBIH. **19 behavioural
  patterns**, **28–30 banks integrated**, **free to banks** (W11). Canara Bank
  reports ~95% detection (W11 — vendor/industry claim, not independently
  audited).
- **What is being developed:** RBI's DPIP (Digital Payments Intelligence
  Platform) — **Phase 1 shared negative registry (5 → 12+ banks)**, **Phase 2
  real-time pre-transaction risk scoring** (W14). W15 (BIS PIETF fraud report
  2026, a multilateral primary source) independently names MuleHunter.AI and
  confirms RBI's DPIP plan.
- **What is deployed:** I4C's Suspect Registry is **live since 10 Sep 2024**
  and shared across **61+ banks**; under the **12 May 2026 I4C×RBIH MoU** it is
  fed into MuleHunter.ai (W12, W13 — both government primary).

**The decisive fact for Stage 2:** RBIH's own NFPC 2026 brief defines its
objective as *"Enhance and expand AI/ML capabilities for MuleHunter AI and
DPIP"* (W17). **RBIH — the knowledge partner of this very hackathon — is
running a national competition whose stated purpose is to improve its incumbent
mule-detection platform, and its winning solution is a stacking ensemble of
LightGBM + CatBoost + XGBoost over 615 engineered features on a 7.4M-transaction
/ 40K-account 6-table relational dataset (W18, W19).**

Therefore: **the state of the art that this jury's own institution has already
adjudicated is a 615-feature gradient-boosted ensemble on a real relational
bank schema.** Ghost-VPA's benchmark is a 12-feature LightGBM over 25,000
generator-drawn events where no graph exists (Stage 1 `01A`, `01B`). That
comparison is the most dangerous single fact in this report and it is fully
sourced to RBIH's own challenge.

### 2.2 Class B — The commercialised adjacency: "honeypots" are already a named mule-detection input (W23)

Facephi has publicly listed **honeypots** as one of three pre-fraud signal
sources for mule-account detection **since 19 March 2025**, and its product page
describes identifying "connections to suspicious activities through intelligent
honeypots" and classifying every account as **mule / victim / launderer /
clean**. It has a 5-year mule-detection contract with a US$14bn Central American
bank as of 31 Mar 2026 (W23).

This is a real finding and it must be handled honestly rather than glossed:

- **What it does NOT defeat:** Facephi's honeypots are a *pre-onboarding /
  synthetic-identity signal*, sitting alongside biometrics and device networks.
  Ghost-VPA's specific mechanism — a **bank-operated payment endpoint whose probe
  becomes a 1.0 confidence seed for temporal graph propagation backwards through
  the payment graph** — is not what Facephi describes.
- **What it DOES defeat:** the sentence "we are the first to use honeypots for
  mule detection." A judge who has read a press release can find that sentence
  false, and once one sentence is false the rest of the deck is read
  sceptically. **The claim must be narrowed to the mechanism, not the technique.**
- **The safer formulation** is a mechanism claim, not a novelty claim: *"a
  canary hit supplies a verified seed that no behavioural model can supply, and
  our engine propagates from it along payment direction."* That is
  defensible against W23 because Facephi does not do the propagation.

### 2.3 Class C — The closest analogue to the thesis: Recorded Future / CYBERA (W22)

CYBERA uses **agentic AI personas to engage active scammers and extract verified
mule-account details**, "verified through direct engagement, not inferred
through probabilistic scoring", collecting **16,000+ confirmed mule accounts
across 72 countries in H2 2025**, and now ships "On-Us Mule Detection" as an
add-on to Recorded Future Payment Fraud Intelligence (W22, and Mastercard's own
2026 write-up of it in the same search set).

**Why this is the most important competitive comparison in the report:** CYBERA
independently arrived at the same core insight Ghost-VPA is built on — *that the
actionable signal is ground truth obtained by interacting with the adversary,
not a probabilistic score.* It then built a commercial product on it and sold it
to banks.

The honest differentiation is therefore **not "no one else does
interaction-sourced ground truth"** (false — W22) but:

| | CYBERA (W22) | Ghost-VPA |
|---|---|---|
| Where the interaction happens | Outside the bank, with the scammer | Inside the bank's payments rail |
| Who operates it | A commercial vendor | The bank itself |
| What is obtained | Confirmed mule account identifiers | Confirmed **probe of a bank-controlled endpoint** by an account inside this bank's own graph |
| Regulatory posture | Intelligence feed; bank decides | Bank-controlled, KYC-safe, no synthetic identities, RBI SOP-aligned |
| What it produces | A list of accounts to block | A **seeded graph with upstream attribution** and an auditable case |

That is a defensible and *real* differentiation. It is also the strongest thing
in the current pitch that the team is not currently emphasising — because the
team is emphasising a precision number that is a generator artefact.

### 2.4 Class D — The academic state of the art on the real dataset (W9, W19, W26)

- **W9 (arXiv 2610.21314, Oct 2026):** mule detection as *relational learning*
  on the RBIH NFPC dataset — the bank's own schema read as a heterogeneous graph,
  per-account temporal cutting at pre-flag dates, HeteroGraphSAGE.
  **ROC-AUC 0.959, PR-AUC 0.815, 83.2% precision at a 0.50% false-alarm rate,
  recovering 337/373 held-out mules — 115 more than the best tree given the
  same evidence.** Critically: **trees match graphs at k=100, graphs pull ahead
  only at k=500.** That last finding is the honest floor for any
  graph-superiority claim, including Ghost-VPA's.
- **W19:** the NFPC Phase-1 public EDA *already computes* fan-in/fan-out
  topology, pass-through ratios, dormancy, burstiness, structuring below
  reporting thresholds, channel entropy and counterparty metrics. **Ghost-VPA's
  entire motif vocabulary in `detect_motifs()` — fan-in ≥3, fan-out ≥3,
  pass-through with 0.80–1.10 retention — is a subset of what RBIH's own
  winning participants published first.** On criterion 2 this is a hard
  constraint: motif detection cannot be the innovation claim.
- **W26 (arXiv 2607.17586):** LightGBM on **280 features** + **TreeSHAP**
  per-feature attribution + a self-hosted LLM producing analyst-facing narrative
  explanations, with **live production deployment** claimed. This is the
  standard the "explainable AI models for fraud decisions" focus area is being
  judged at. Ghost-VPA has **no SHAP** (Stage 1 §2 item 22, class 6) and no
  narrative layer — its explainability is the D3 ego-graph.

**Net on Class D:** the graph-vs-trees question has been answered on the real
dataset and the answer is *not "graphs win"* — it is *"graphs win if you need
the top 500, trees get you the top 100."* Ghost-VPA's own benchmark cannot
answer this question at all, because it never constructs a graph.

### 2.5 Class E — The commoditised floor (W25, and the open-web corpus generally)

RIFT 2026's "RIFT EYE" is the baseline a frustrated judge will have in mind:
**upload a transaction CSV, render it as a directed graph, run circular-flow /
fan-in / fan-out detection, show a dashboard** (W25). The open web is saturated
with equivalent student UPI-fraud projects (the second search returned
`Medium`, `IJSREM`, `IJIRT`, `IJRPR`, `IJARSET`, `IJARSCT`, `EUDL` papers and
GitHub repos all doing the same thing with claimed 92–98.5% accuracy on
public/analogous datasets).

**Ghost-VPA is materially above this floor** — it has a real registry, a real
audit chain, a real case workflow, a real policy-aligned hold barrier, and a
frontend that builds. But "above the floor" is not a winning claim, and the
saturation means criterion 2 must be answered with the mechanism, not the
stack.

---

## 3. Ghost-VPA against the six official criteria — evidence-based

Each row is anchored to Stage 1 evidence (local, executed) and to the
competitive findings above. Grading is deliberately conservative: **what is
demonstrable today**, not what could be built.

| # | Criterion (W1) | What Ghost-VPA actually has (Stage 1) | Competitive position | Honest grade |
|---|---|---|---|---|
| 1 | Relevance to track | Track 1's **first named focus area is "mule-account detection"** (W1). Ghost-VPA targets exactly that, pre-cash-out, and additionally models the RBI Annex III SOP the problem is governed by | **Strong.** Most student entries answer "detect fraud"; Ghost-VPA answers "meet the statutory SOP while detecting" | **A−** |
| 2 | Innovation & originality | The **mechanism** (canary probe → verified seed → temporal graph propagation → upstream feeder) is genuinely not found in any prior winner in the search set. But (a) Facephi published "honeypots" as a mule-detection input in Mar 2025 (W23); (b) CYBERA commercialised interaction-sourced ground truth (W22); (c) the motif vocabulary is a subset of RBIH's own NFPC EDA (W19) | **Real but narrow.** The novelty is *seeding from a bank-controlled payment endpoint inside the bank's own graph*, not honeypots, not graphs, not motifs. And it is **currently broken in the shipped code** (§4) | **C+ → B− if the mechanism claim is narrowed and the CS-LP fix lands** |
| 3 | Technical feasibility, security, prototype quality | Zero-real-funds invariant is structural and verified; 23/23 tests pass; frontend builds clean; SHA-256 audit chain verifies live; RBAC barrier returns 403; STIX bundle is well-formed. **But:** no authentication on 13 endpoints; RBAC is a client-settable header; no graph persistence; RBAC/PostgreSQL/Neo4j/PyG/SHAP documented but absent; the headline CS-LP cannot reach a feeder (§4) | **Competent prototype with two exposed flanks.** FraudLens (W20) reached RBI's final 21 as a scorer; Ghost-VPA's *engineering* is better than that, its *authentication* and *persistence* are weaker than a jury expects from a "security" submission | **B−** |
| 4 | User impact, inclusion, scalability | The **victim-safety story is the genuine differentiator** — an unwitting pass-through recipient gets a protective alert, not a freeze; this maps to the RBI SOP's 20-day explanation window. **But** Stage 1's probe 11 shows the shipped CS-LP scores an innocent beneficiary of a mule at **1.000000 — the maximum**, which is the *exact opposite* of the stated capability. Scalability: 100k nodes are claimed, the benchmark trains on 25,000 events, no graph is built, no persistence, blocking endpoint inside an async handler | **Best conceptual claim in the submission; currently contradicted by executed code.** W24 (BioCatch) shows the class of evidence this criterion is judged against: −30% mule FPs, +54% detection, €12.4M prevented | **C+ → B if §4.2 is fixed and demonstrated** |
| 5 | Business potential | RBIH TechSprint 2026 is **actively procuring, on rolling applications, an equity-free bank pilot** for pre-EDD triage, unified EDD case management, de-duplication, CBS-integrated freeze/unfreeze, escalation, audit trails, MIS (W21). Top 10 teams here get incubation and RBIH internships (W1). **But:** the team is presenting case management as innovation in a market where the sponsor is buying it | **Strong market fit, weak framing.** The business case is *"we are the detection layer that feeds EDD, and here is the audit-grade case it emits"* — not *"we built case management"* | **B** |
| 6 | Team capability & presentation | Cannot be graded from the repository — no team roster, no presentation artefact, no design doc for the pitch | **Not assessable.** Stage 1 §9 Q3's answer is that a 1–2 person team (W1) against 496→21-style odds wins on **focus and honesty**, not on breadth. This is the criterion where the current documentation drift (Stage 1 §4, 7 rows of false claims) does the most damage if a judge reads the repo | **⏸ pending** |

---

## 4. The finding that decides this competition: CS-LP is directionally wrong

This is Stage 2's most important result and it is **not** in Stage 1. Two
probes were written and executed
(`artifacts/step5/scratch/probe10_cslp_direction.py`,
`probe11_cslp_correct_direction.py`). Both are read-only with respect to tracked
source.

### 4.1 Correction to Stage 1 §3.1 — the mechanism

Stage 1 stated that the guard at `temporal_engine.py:111-117` means the feeder's
"outbound edges are never read." **Probe 10 disproved that specific mechanism.**
The guard skips the *node*, so the feeder is never scored at all:

```
FEEDER_SYNTH_007  in=0 out=2        VICTIM_SYNTH_900  in=1 out=0

=== CS-LP scores as shipped ===
  FEEDER_SYNTH_007       0.000000     <-- the headline capability: unattributable
  MULE_SYNTH_101         0.501042
  MULE_SYNTH_102         0.502083
  CANARY_VPA_001         1.000000
  VICTIM_SYNTH_900       1.000000     <-- innocent recipient, MAXIMUM

=== H1 test: score the feeder with the shipped formula, no guard ===
  FEEDER_SYNTH_007       0.983820     <-- the guard is the cause

=== control: give the feeder a single inbound edge, rerun SHIPPED code ===
  FEEDER_SYNTH_007       0.524697     <-- isolating the guard as the sole cause
```

Same conclusion as Stage 1, **different fix**: seed zero-in-degree nodes rather
than skipping them.

### 4.2 A second, independent defect — not found in Stage 1

`compute_cslp_scores` propagates along **`in_edges` (lines 121–126)** *and*
`out_edges` (lines 128–135). Risk therefore flows *towards* innocent
beneficiaries. Probe 11 added three innocent parties and measured **separation
= min(true-positive score) − max(innocent score)**:

```
--- SHIPPED (in_edges + out_edges + zero-in-degree guard) ---
  1.0000  CANARY_VPA_001      seed (ground truth)
  1.0000  UNWITTING_VICTIM    FALSE POSITIVE RISK (paid BY the canary)
  1.0000  INNOCENT_MERCHANT   FALSE POSITIVE RISK (paid BY a mule)
  0.5247  FEEDER_SYNTH_007    TRUE POSITIVE  (upstream feeder - headline capability)
  0.5247  MULE_SYNTH_102      TRUE POSITIVE  (paid the canary)
  0.5247  MULE_SYNTH_101      TRUE POSITIVE  (paid the canary)
  0.5247  INNOCENT_SLEEPER    FALSE POSITIVE RISK (paid BY a mule)
  separation (min TP score - max FP score) = -1.0000

--- PROPOSED (out_edges only, feeders included) ---
  1.0000  CANARY_VPA_001      seed (ground truth)
  0.4465  FEEDER_SYNTH_007    TRUE POSITIVE  (upstream feeder - headline capability)
  0.3837  MULE_SYNTH_102      TRUE POSITIVE
  0.3837  MULE_SYNTH_101      TRUE POSITIVE
  0.0000  INNOCENT_MERCHANT   FALSE POSITIVE RISK (paid BY a mule)
  0.0000  INNOCENT_SLEEPER    FALSE POSITIVE RISK (paid BY a mule)
  0.0000  UNWITTING_VICTIM    FALSE POSITIVE RISK (paid BY the canary)
  separation (min TP score - max FP score) = +0.4465
```

**Read that carefully. In the shipped engine:**

- An **innocent merchant paid by a mule scores 1.000000** — the maximum, higher
  than the true feeder (0.5247) and higher than the mules themselves.
- **Separation is −1.0000**: the engine ranks every innocent party above every
  guilty party. It is not merely weak; the ranking is inverted.
- The **headline capability — upstream feeder attribution — returns 0.5247 at
  best** and, with a true zero-in-degree feeder (the normal case, since funds
  come from outside the observed window), **0.0000**.

This directly and severally contradicts `docs/judge-pitch.md` Q3:

> *"…we separate unwitting victims (who made a one-off mistaken transfer) from
> repeat syndicate feeder nodes. This reduces the false-positive rate by 94.4%
> compared to transaction-only baseline models (0.1% vs 1.4% FPR)."*

The engine currently does the **precise inverse**: it maximises the score of
exactly the unwitting parties the Q3 answer describes protecting. And the
0.1%/1.4% FPR figures are unsupported by any measurement (Stage 1 `01B §B.4`:
the generator cannot emit a benign canary hit, so precision 1.000 is a
tautology).

### 4.3 The fix is priced, cheap, and unblocked

The proposed variant is a **deletion**:

```python
# temporal_engine.py — DELETE lines 116-117 (the guard)
    if not in_edges:
        continue

# and DELETE lines 121-126 (the inbound propagation loop)
    for remitter, _, data in in_edges:
        ...
```

Blame then flows only backwards along payment direction — *you are risky if you
paid something risky* — and zero-in-degree feeders are seeded and included.

**Cost: no new dependency, no API change, no schema change, no test rewrite.**
Effect on the measured metric: separation flips from **−1.0000 to +0.4465**.

This is the highest-value action available to the team before 4–6 December,
and it converts the two weakest criterion grades (2 and 4) into defensible ones.
It is also the difference between a demo that holds under one judge question and
a demo that collapses.

### 4.4 What this means competitively

| Question a judge asks | Answer available today | Answer after the fix |
|---|---|---|
| "Show me the feeder you detected." | `upstream_feeder_account = None`, `FEEDER_SYNTH_007` scores 0.0 or 0.52 | Feeder scores **0.4465**, ranked above the mules, innocents at 0.0 |
| "Show me that a victim is not scored the same as a mule." | Victim scores **1.0000** — worse than the mule | Victim scores **0.0000** |
| "Why is your CS-LP better than a graph neural net?" | Cannot be answered — no graph in the benchmark; and W9 says trees match graphs at k=100 | Can be answered on mechanism: *the seed is verified, so we do not need to learn from labels* |

The third answer is the interesting one and it is the actual competitive
thesis. W9 shows that relational learning needs 83.2% precision at a 0.50%
false-alarm rate **because it must infer** mule-ness from patterns. Ghost-VPA
does not infer — it **observes a probe against a bank-controlled endpoint**.
That is a categorically stronger observation channel, and it is the one thing
in this submission that no W1–W27 competitor, vendor, or researcher has.

---

## 5. Novelty audit — claim by claim

`docs/judge-pitch.md` §2 and `briefs/source_brief.md` §4 make specific
differentiation claims. Each is tested against W1–W27.

| Ghost-VPA claim | Source | Verdict against the evidence |
|---|---|---|
| "Proactive Canary Tripwires — millisecond detection at Hop 1 or 2" | `judge-pitch.md` §2 | **Partially supported.** The registry lookup is O(1) and live (Stage 1 §2 item 2, class 1). But "millisecond" is unmeasured and latency is non-deterministic (Stage 1 §2 item 30), and p95/p99 tests assert <50 ms, not <15 ms (Stage 1 §4). **Downgrade to "sub-50 ms measured, single-digit-ms lookup."** |
| "Explainable Temporal Graph Motifs … shows shared feeders, delta-t velocity, device links" | `judge-pitch.md` §2 | **Contradicted by executed code.** Stage 1 §3.4: `cluster_id=None`, `connected_mule_count=0`, `upstream_feeder_account=None` — **never written by any code path.** The motif vocabulary itself is a **subset of RBIH's own NFPC winning EDA** (W19). Against W26 (LightGBM + TreeSHAP + LLM narrative, deployed) the explainability story is weak on methodology. |
| "No Ground-Truth Seeds: Graph algorithms suffer from label drift" | `judge-pitch.md` §2 | **This is the one genuinely defensible and *unclaimed by anyone else's product* claim** — provided the team does not claim it as "we invented seeds." W9's whole apparatus exists *because* GNNs must infer; W18's 615-feature ensemble exists for the same reason. **This should be the pitch's opening line.** |
| "RBI Annex III SOP Compliance … 60-day hold tracking, 20-day explanation SLA, zero-KYC-fabrication" | `judge-pitch.md` §2 | **Supported as the strongest single asset.** The workflow works (Stage 1 §2 item 8), the zero-KYC invariant is structural (item 4), and the draft/draft/draft framing is correct throughout. This is the answer to criterion 1 and much of 5. |
| "94.4% FPR reduction … 0.1% vs 1.4% FPR" | `judge-pitch.md` Q3, `README.md` | **Unsupported.** No measurement exists. Stage 1 `01B §B.4`: precision 1.000 is a tautology because **the generator cannot emit a benign canary hit.** Must be withdrawn before a judge asks. |
| "+27.1% precision lift" | `README.md`, `benchmark-results.md` | **Unsupported.** `cs_lp` contributes **0.3 pp** (Stage 1 `01B §B.2`); the lift is label-conditional `random.uniform` bands. Must be withdrawn. |
| "Zero switch changes … O(1) memory lookup … 100% compliant with UPI 2.0" | `judge-pitch.md` Q2 | **Architecturally sound, unverifiable here.** No UPI spec conformance test exists in the repo. Present as a design argument, not a compliance claim. |
| "Consented Turncoat VPAs" — converting a surrendered customer handle into a monitored trap | `judge-pitch.md` Q1 | **The most exposed claim in the deck.** No consent framework, no customer-facing artefact, no retention rule, no refusal path is implemented (Stage 1: nothing in items 1–30 covers it). It is a *design idea*, and it should be labelled as one. A bank compliance officer in a jury would ask three questions the team cannot currently answer: who consents, how is it withdrawn, and what happens to the handle when the trap is burned. |
| "100,000-node synthetic network" | `source_brief.md` §5 | **Misleading.** 100,000 node **rows**, 25,000 event rows, ~0.5 events per node — "overwhelmingly disconnected" (Stage 1 `01A §A.2`). No graph is constructed. |
| PostgreSQL + NetworkX + Neo4j | `source_brief.md:43` | **False.** SQLite/WAL only; no Neo4j import (Stage 1 §2 items 19–20). |
| PyTorch Geometric / TGN / EvolveGCN "Adopted" | `research-register.md:88,90` | **False.** Absent from `requirements.txt` and from code. |
| SHAP interpretable features | `research-register.md:91` | **False.** Not implemented. |

**Summary of §5:** of eleven differentation claims, **one** (verified-seed
propagation) survives contact with the evidence as a *novel* claim, **three**
(Zero-KYC, REVIEW_REQUIRED, RBI SOP workflow) survive as *sound engineering*,
and **five** are unsupported or false. The false five are all in documents a
judge can read. **That is the single most fixable risk in the submission and it
is fixed by deletion, not by building.**

---

## 6. What actually wins, given the evidence

Three precedents were examined for how juries in this exact problem domain
decided. All three point the same way.

### 6.1 HaRBInger 2025 — the central-bank jury (W20)

496 proposals → 21 finalists → **no first prize in the fraud/trust problem
statement**. Runner-up was a real-time transaction risk-scoring platform. The
winners that *did* take first prizes were: a reusable privacy-preserving
tokenised-KYC layer with a user-controlled wallet (EarthId, UK), and an offline
CBDC solution. **The pattern: prizes went to the two problem statements with a
crisp architectural mechanism and a defined integration point. The "score
transactions better" problem statement did not produce a winner.**

Ghost-VPA has a crisp architectural mechanism (canary endpoint → seeded graph →
attribution → auditable case) and a defined integration point (the bank's CBS
sidecar, per `judge-pitch.md` Q2). It currently *presents* itself as a
transaction scorer with a graph sidecar, which is the category that lost.

### 6.2 NFPC 2026 — RBIH's own challenge on the real dataset (W17, W18, W19)

The winning approach was **615 engineered features, a LightGBM+CatBoost+XGBoost
stack, DuckDB streaming on 16 GB RAM, on 7.4M real transactions across 40K
accounts and 6 relational tables** (W18, W19). The programme's own objective:
"Enhance and expand AI/ML capabilities for MuleHunter AI and DPIP" (W17).

Three lessons for Ghost-VPA:

1. **Feature engineering depth on a real schema beats architectural novelty at
   the RBIH-aligned level of judging.** Ghost-VPA has 12 features, six of which
   are `random.uniform` draws. **Do not compete here.** Compete on the
   observation channel instead — that is the one axis where a 12-feature system
   with a verified seed beats a 615-feature system that must infer.
2. **The stack was commodity.** LightGBM/CatBoost/XGBoost/DuckDB. Nothing
   exotic. Ghost-VPA's own stack (FastAPI/NetworkX/LightGBM/SQLite) is entirely
   credible by comparison — **the team's documented Neo4j/PyG ambitions (Stage 1
   §4) are actively harmful here, because they are false and because the winner
   did not need them.**
3. **RBIH is the knowledge partner of *this* hackathon** (W1). Whoever sits on
   the panel knows NFPC's results. **A judge with that knowledge will ask, in
   effect: "your graph model has 12 features drawn by a random number generator;
   our NFPC winner had 615 features on real data. Why should this win?"** The
   answer must be prepared and it is the observation-channel argument.

### 6.3 The market — Facephi and CYBERA (W22, W23)

Both are commercially live in adjacent territory: Facephi with honeypots as a
named pre-fraud input since Mar 2025 and a 5-year bank contract; CYBERA with
interaction-sourced verified mule intelligence and 16,000+ accounts across 72
countries. Neither is a competitor to the *specific* mechanism, but together
they close the "no one has thought of interaction-sourced ground truth" claim.

**The correct competitive statement, and the one the team should be able to
recite:**

> *"Verified mule intelligence exists commercially — CYBERA extracts it by
> engaging scammers with AI personas and sells it as a feed; Facephi lists
> honeypots among its pre-fraud signals. What does not exist is a
> bank-internal, KYC-safe, auditable version of that idea, where the ground
> truth is not a bought account identifier but a **probe against the bank's own
> controlled endpoint**, and where that probe seeds temporal graph attribution
> backwards to the feeder before cash-out — inside the RBI Annex III SOP
> timeline."*

That sentence is true against every source found, is specific, and directly
answers criterion 2.

---

## 7. Stage 2 conclusions

1. **The competition is currently in its screening window (16–20 Nov 2026); the
   gating step is the written submission, not the demo** (W1). In the one
   directly comparable funnel (W20), 96% of teams were eliminated before any
   jury saw them. **Priority order for the next 72 hours is therefore
   documentation, not code.**
2. **The central-bank precedent withholds first prizes from transaction
   risk-scoring platforms** (W20). Ghost-VPA must not present as one — and its
   current `benchmark.py` *is* one, so the benchmark must be reframed or
   withdrawn from the deck.
3. **RBIH is the knowledge partner** (W1) and its own national challenge's
   winner used 615 features on 7.4M real transactions (W18, W19). **The team
   will be judged against that context whether or not it is mentioned.**
4. **The motif vocabulary and the "honeypot for mules" phrase are both
   pre-occupied** (W19, W23). The surviving novelty claim is narrow: *a
   verified seed from a bank-controlled payment endpoint, propagated along
   payment direction, inside a KYC-safe, auditable, SOP-aligned workflow.*
5. **Two executed probes found that the shipped CS-LP ranks innocent parties
   above guilty ones (separation −1.0000) and cannot attribute a feeder at all
   (0.0), while a deletion-only fix yields +0.4465.** This single finding
   determines whether criteria 2 and 4 are defensible.
6. **Five of eleven differentiation claims in the pitch documents are false or
   unsupported** (§5). All are fixable by deletion. **None should survive into
   the boot camp.**

**Stage 2 complete. Stage 3 (RBI/RBIH ecosystem, including §9 Q1 RBI instrument
status and Q2 MuleHunter overlap) begins next and must not repeat the
satisfactory work above.**

---