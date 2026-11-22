# Ghost-VPA Website — Creative Research Register

**Document:** `docs/website/creative-research-register.md`
**Branch:** `feature/ghost-vpa-website`
**Date:** 15 November 2026
**Method:** Public web search and public-page inspection only. No authentication, paywall, or anti-bot circumvention. No proprietary assets were copied; all references are cited for learning, and all website artwork is original or generated from project data.

---

## 1. Product sources of truth (primary)

| Source | What was inspected | What it taught the design |
|---|---|---|
| `github.com/syedafnan7-lab/ghost-vpa` | `README.md`, `AGENTS.md`, `concepts_brief.md`, `docs/designs/ghost-vpa-architecture.md`, `docs/demo-runbook.md`, `docs/scope-and-assumptions.md`, `docs/production-integration-boundaries.md`, `docs/remediation/*`, `docs/benchmark-methodology.md` | The exact mechanism, the four scenarios, the canary registry records, the four-tier architecture, the API contract, and the credibility-remediation history. All interactive demonstrations use this data rather than invented numbers. |
| `backend/app/simulator/rail.py` | Scenario A–D event records | Exact senders, beneficiaries, amounts, device tokens and timestamps used in the tripwire simulator and graph explorer. |
| `backend/app/core/honeypot_registry.py` | Default canary records | The four real canary VPAs, their types (`REGULATORY_TRIPWIRE`, `CONSENTED_TURNOAT`) and purposes shown in the registry table. |
| `backend/app/graph/temporal_engine.py` | Motif thresholds, CS-LP constants | Fan-in ≥3 remitters/60 min; fan-out ≥3 recipients/30 min; pass-through Δt ≤15 min with conservation 0.80–1.10; CS-LP λ=0.05/h, α=0.85. Used verbatim in the graph explorer and its explanations. |
| `docs/remediation/latest-benchmark-results.json` | Three-model metrics, PR curve points, confusion matrices | The benchmark studio renders the actual artifact. The register also records the discrepancy history (REM-01…REM-14) so the site never repeats the retracted oracle-feature claims. |
| `frontend/src/index.css` (working tree) | Existing design tokens | The workbench already defines the "forensic instrument panel" palette and node colours. The website extends this system instead of inventing a competing one. |

---

## 2. Design references (secondary)

### 2.1 Cybersecurity & financial-infrastructure websites

| Reference | URL | What was learned | Design decision influenced |
|---|---|---|---|
| Trail of Bits | https://trailofbits.com (analysed in the Websitely survey below) | Fixed icon rail reclaims vertical space; huge grotesk headline at 80px / −0.025em; three type voices with one job each; near-monochrome with a single red used on ~60 characters. | Adopted the **fixed chapter rail** and the "one accent, one job" discipline. Rejected its light monochrome palette — Ghost-VPA's product identity is dark. |
| Expel | https://expel.com (Wesitely survey) | One accent colour used on one word, one button and section labels makes a black page feel designed rather than dark. | Adopted **one-accent-per-view**. Amber is the canary; crimson is the alarm; nothing else is saturated. |
| Deepwatch | https://deepwatch.com (Wesitely survey) | A timestamped threat feed in the hero proves the system is running; a 600-unit weight swing between headline and body. | Adopted the **live telemetry strip** in the hero (tripwire latency, zero funds, window, canary count) and a large display/body weight contrast. |
| Binary Defense | https://binarydefense.com (Wesitely survey) | When the headline poses a choice, label the two buttons with the two answers; zero radius; 16-column grid. | Adopted the idea that CTAs state the outcome ("Watch the interception"), and a strict hairline/zero-radius figure language. |
| A-lign | https://a-lign.com (Wesitely survey) | Overlay real product numbers on the hero visual instead of adding a second paragraph. | Adopted: the hero canvas carries the telemetry, not a separate stats band. |
| Raxis | https://raxis.com (Wesitely survey) | A single family (Schibsted Grotesk) can carry a whole page; a red accent at ~6.8% coverage. | Reinforced the two-family type system and restrained accent coverage. |
| Websitely, "18 Cyber Security Website Designs That Build Trust" | https://websitely.io/cyber-security-website-design | Category-wide pattern: dark field, one hot accent, dot/hex lattice. The differentiators are type, spacing and a real product visual. | Confirmed the category default to avoid; pushed the concept toward a **data-derived canary field** rather than a decorative dot lattice. |

### 2.2 Data visualisation & scrollytelling

| Reference | URL | What was learned | Design decision influenced |
|---|---|---|---|
| D3 force docs | https://d3js.org/d3-force | Velocity-Verlet integrator; link/charge/center/collide/radial forces; alpha decay. | The ego-network explorer uses link + charge + collide + radial forces and bounded node counts for mobile. |
| Elijah Meeks, network visualisation | http://elijahmeeks.com/networkviz | "How networks lie" — filtering and interactive topology editing change what a network means. | The graph explorer filters by the 72-hour window and lets the visitor select a focal node, rather than dumping the whole edge list. |
| Robin Weser, dynamic force graphs | https://weser.io/blog/interactive-dynamic-force-directed-graphs-with-d3js | Mutate-then-replace update pattern; hide sub-nodes until needed. | The explorer reveals neighbours on selection instead of rendering everything at once. |
| Diana Ow, D3 + PIXI large graph | https://dianaow.com/posts/pixijs-d3-graph | WebGL rendering matters at thousands of nodes. | Informed the **node budget**: the ego view is capped at ~50 nodes (matching the backend `max_nodes=50`); the canvas field uses a small hand-rolled simulation, not a full D3 render. |
| Awwwards — "State of AI 2025" (data visualisation) | https://www.awwwards.com/inspiration/data-visualization-state-of-ai-2025 | On-scroll animation, timeline and transition elements used as narrative structure. | Reinforced the chapter/figure structure; rejected auto-playing scroll sequences. |
| Awwwards — "Searching for Birds" (scrollytelling) | https://www.awwwards.com/inspiration/interactive-data-visualization-scrollytelling-searching-for-birds | Scrollytelling works when each step changes the data, not just the scroll position. | Each website chapter changes the **state of the field and the data**, not only the text. |
| Awwwards — "Knowledge Graph — Interactive Portfolio Network" | https://www.awwwards.com/inspiration/knowledge-graph-interactive-portfolio-network-blackbook-talk-to-my-agent | Network-as-interface can carry a whole page. | Validated the canary-field hero, but the Ghost-VPA version is data-derived and labelled simulated rather than decorative. |
| Godly.website | https://godly.website/ | Browsed recent interface/editorial entries for type and art-direction range. | Confirmed that restrained type systems with one strong visual idea outperform maximal layouts. |

---

## 3. What was deliberately *not* copied

- No stock photography or proprietary website assets.
- No dot-matrix/hexagon background used as pure decoration (the category default).
- No hooded-figure / hoodie hacker imagery.
- No fake terminal windows, no invented dashboards, no gradient meshes.
- No cloned layout from any referenced site; the rail, figure system and field are original compositions.

---

## 4. Research → decision traceability

| Design decision | Primary evidence |
|---|---|
| "Signal in the noise" concept | Product mechanism (canary as sensor) + category pattern audit |
| Dark forensic palette, amber canary, crimson alarm | Existing `frontend/src/index.css` tokens + Expel/Trail-of-Bits restraint |
| Fixed chapter rail | Trail of Bits rail analysis |
| Two-family type system (Space Grotesk + JetBrains Mono) | Raxis/Expel single-family discipline, adapted to a data subject |
| Hero telemetry strip | Deepwatch live-feed proof + A-lign overlay-numbers idea |
| Interactive tripwire + ego graph as the two centrepieces | Product's four scenarios + D3 force/meeks filtering research |
| Benchmark caveat panel | `docs/remediation/*` discrepancy history |
| No Three.js / no motion library | Animation skill gate: CSS/rAF covers the predetermined and state-driven motion; 3D would add weight without explaining more |
