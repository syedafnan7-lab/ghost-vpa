# Ghost-VPA Website — Creative Direction

**Project:** Ghost-VPA — Bank-Controlled Honeypot VPAs & Canary-Seeded Graph Intelligence
**Document:** `docs/website/creative-direction.md`
**Branch:** `feature/ghost-vpa-website`
**Status:** Approved for implementation
**Date:** 15 November 2026

---

## 1. The one-line concept

> **Signal in the noise.** A dark payments field, one amber canary, and a scroll that works like a forensic scan: the visitor watches a mule probe become an interception, then become evidence.

The website is built around a single visual metaphor that is native to the product: **the canary is the sensor**. Everything else — typography, colour, motion, layout — is disciplined around that amber point. This is deliberately not a generic fintech landing page and not a generic "AI cybersecurity" dark-neon page.

---

## 2. Brand personality

| Dimension | Decision |
|---|---|
| Voice | Forensic, calm, precise. Sentences are short. Claims are attributed. No hype adjectives. |
| Attitude | Confident because it is specific, not because it is loud. Shows the mechanism instead of asserting superiority. |
| Audience split | A first-time visitor gets the story; a banking/fintech judge gets the technical evidence. Both read the same page, at different depths. |
| Trust device | Every interactive demonstration is labelled **SIMULATED**. Every metric carries its protocol. Nothing pretends to be a live bank. |

---

## 3. Visual identity

### 3.1 Colour language

The palette extends the identity already established in the Ghost-VPA analyst workbench (`frontend/src/index.css`), so the website and the product are recognisably the same system.

| Token | Hex | Role |
|---|---|---|
| `--void` | `#04070C` | Page ground. Blue-black, never pure black. |
| `--panel` | `#0A0F17` | Raised surfaces, figure frames. |
| `--raised` | `#121A26` | Hover states, wells, code blocks. |
| `--ink` | `#E8EEF7` | Primary text. |
| `--ink-2` | `#9AA7B8` | Secondary text. |
| `--ink-3` | `#5C6B7E` | Captions, axes, decorative rules. |
| `--line` | `rgba(148,163,184,0.14)` | Hairlines, grid. |
| `--canary` | `#F5A524` | **The signal.** Reserved for the canary, live telemetry, and one accent per view. |
| `--alarm` | `#F04438` | Genuine alarm only (tripwire fired). Never decoration. |
| `--benign` | `#2DD4A7` | Cleared / benign / zero-connectivity verdicts. |
| `--feeder` | `#A78BFA` | Upstream feeder nodes. |
| `--device` | `#38BDF8` | Shared-device linkage. |

Rule: **one accent per view.** Amber is the canary; crimson is the alarm. They never appear together as decoration, and neither is used for gradients or glow.

### 3.2 Typography

Two families, each with one job.

- **Space Grotesk** — display, headings, body. Technical grotesk with a slightly squared, instrument-like character. Tight display tracking (`-0.03em` to `-0.05em`), generous body leading (`1.6`).
- **JetBrains Mono** — data, labels, figure captions, telemetry, code, coordinates. Tabular numerals so live values do not jitter.

Type scale (desktop): display 64–88px, section title 40–52px, subsection 22–26px, body 16–18px, caption 12–13px, micro 11px floor. No all-caps label reflex: labels are sentence case in mono, with letter-spacing used sparingly.

### 3.3 Layout system

- 1280px max container, 12-column grid, 24px gutters on desktop.
- A fixed **chapter rail** on the left at `xl` and above (section numbers 01–08, scroll-spy active state). This borrows the "fixed rail" idea from Trail of Bits and gives the long read a spatial anchor.
- Section padding 96–128px. Figures are framed in hairline panels with a mono caption row (figure number, title, protocol note).
- Alternating rhythm: full-bleed canvas moments → dense split text/visual → technical grid → full-bleed canvas moment. No repeated card row.

### 3.4 Graphic & illustration approach

No stock photography. The product is abstract and its subject is a network, so the artwork is **generative and data-derived**:

1. **The Canary Field** — a fixed 2D canvas behind the page: a living payments graph of benign nodes, mule trails, and one amber canary. It changes state per chapter (calm → probe → interception → expansion).
2. **Original SVG figures** — the four-tier architecture, the tripwire path, the integration boundary. Drawn as line diagrams, not screenshots.
3. **D3 data visualisations** — the ego network and the precision–recall curves, rendered from the project's real data.
4. **A single logotype mark** — a canary dot inside a hairline reticle, used at small sizes only.

### 3.5 Motion language

Motion is used for **explanation and state**, not decoration. The gate: if an animation does not help a person understand the mechanism, it does not ship.

- **Entrance:** one orchestrated hero sequence (field fade-in → mark → headline → telemetry). Stagger 40–60ms, `ease-out`, 300–500ms.
- **Scroll reveals:** IntersectionObserver + CSS transition, `transform` and `opacity` only, `cubic-bezier(0.23, 1, 0.32, 1)`, 250–400ms, 30–60ms stagger.
- **Tripwire demo:** click-triggered packet along an SVG path; state readout changes are the payload. Reduced motion: instant state change, no travel.
- **Graph:** D3 force simulation, drag and zoom; node selection crossfades an evidence drawer.
- **Canvas:** `requestAnimationFrame`, paused when the tab is hidden, node count reduced on mobile, static field under `prefers-reduced-motion`.
- **Never:** layout-property animation, `scale(0)` entrances, `transition: all`, continuous scroll-jacking, parallax on content.

---

## 4. Navigation & scrolling philosophy

- **Top bar:** wordmark + seven chapter links + a "Simulated prototype" badge + one external CTA (repository). It condenses to a menu on mobile.
- **Chapter rail:** `xl` only; clickable, with scroll-spy. It makes the long read legible without a progress bar gimmick.
- **Scrolling:** one continuous vertical narrative. The canvas is the continuity device; sections are "readouts" from the same system. Anchors are real and target real section IDs.
- **No horizontal scroll.** All wide figures reflow or scale down.

---

## 5. Information architecture

| # | Section | Job |
|---|---|---|
| — | Hero | Establish the metaphor, the product, the simulated-environment badge, live telemetry. |
| 01 | The laundering trilemma | Why transaction-by-transaction detection and reactive freezes fail. |
| 02 | The deception shift | Why the receiving endpoint is the sensor; the canary registry. |
| 03 | The tripwire | Interactive Scenario A: probe → registry match → intercept → `REVIEW_REQUIRED` → zero posting. |
| 04 | The graph | Interactive Scenarios B & D: canary-seeded ego network, motifs, temporal slider. |
| 05 | The evidence | Case dossier, RBI SOP timers, FIU-IND / NCRP / STIX 2.1 outputs. |
| 06 | The benchmark | Honest experimental 100k-node comparison + explicit caveats. |
| 07 | The architecture | Four tiers and the sidecar integration boundary. |
| 08 | The boundaries | Inviolable invariants, draft-regulation truthfulness, implemented vs proposed. |
| — | Footer | Repository, hackathon, licence, disclaimer. |

Scenario C (benign merchant lookalike) lives inside 04 and 06 as the false-positive counter-example, because that is where its evidence matters.

---

## 6. Interaction inventory

1. **Canary Field canvas** — reacts to scroll chapter and pointer; decorative-marketing tier, pointer-gated, reduced-motion safe.
2. **Laundering race** — scroll-triggered timeline (funds 4 hops in ~15 min vs complaint at 24–72 h).
3. **Canary registry table** — real registry records from `honeypot_registry.py`, with type/purpose/status.
4. **Tripwire simulator** — runs the actual Scenario A record; packet animation; status, latency, ledger readout; reset.
5. **Ego-network explorer** — D3 force graph of Scenario B/D, temporal slider, node evidence drawer, motif badges.
6. **Case dossier** — tabs for STR narrative / NCRP JSON / STIX bundle; download buttons.
7. **Benchmark studio** — PR curve hover, model toggles, confusion matrices, caveat panel.
8. **Architecture explorer** — four-tier diagram; selecting a tier reveals its modules and files.

Every control does something. Every interactive surface carries a "simulated" label where it could be mistaken for a live system.

---

## 7. Responsive behaviour

- **≥1280px:** full grid, chapter rail, side-by-side figures.
- **768–1279px:** two-column collapses to one; rail hidden; figures stack; canvas node count reduced.
- **<768px:** single column; top bar condenses; canvas node count reduced further; graph controls become a bottom sheet style panel; wide tables scroll inside their own container (never the page).
- Touch: all interactions work without hover; hover-only motion is gated behind `@media (hover: hover) and (pointer: fine)`.
- Keyboard: every control is a real button/link/input with a visible `:focus-visible` ring; the graph is operable via list fallback (node list + "focus" buttons).

---

## 8. Self-critique against generic defaults

The `frontend-design` skill's generic tells were checked explicitly:

| Generic tell | Decision here |
|---|---|
| Cream background + serif + terracotta | Rejected. The product's existing identity is a dark forensic console; the site extends it. |
| Near-black + single acid-green/vermilion accent | Rejected as a *look*. Dark ground yes, but the accent is a subject-specific amber canary and the discipline is one-accent-per-view, not neon. |
| Broadsheet hairline rules, zero radius | Partially adopted: hairline rules and a document-like figure system, because the content genuinely is a technical dossier. Radius kept at 0–4px. |
| SaaS card kit, identical rounded cards, soft grey shadow | Rejected. No card grid; figures are framed panels with captions, and surfaces are separated by hairlines and spacing, not shadows. |
| Tracked-out all-caps eyebrow on every heading | Rejected. Labels are sentence case mono; numbering is reserved for the eight real chapters. |
| Meta strings joined with middle dots | Rejected in copy; used only in the telemetry strip as a deliberate instrument convention. |
| Monospace small data labels everywhere | Adopted, because the subject is data and the product already uses mono numerics — but paired with a real display face so it is not a costume. |
| `→` appended to every link | Rejected. CTAs say what happens. |

The boldness is spent in one place: **the Canary Field and the two interactive demonstrations**. Everything else is quiet.

---

## 9. Research references

See `docs/website/creative-research-register.md` for the inspected references, what was learned from each, and which decision it influenced.

---

## 10. Non-negotiable accuracy constraints

1. The RBI September 2026 KYC Amendment Directions are described as a **draft proposal**, never an enacted mandate.
2. The canary tripwire produces `REVIEW_REQUIRED`, never an accusation, freeze, or automated punishment.
3. The 100k-node benchmark is **experimental, synthetic, and not independently validated real-world performance**. The reported 99.5% precision / 1.000 PR-AUC / 94.4% FPR reduction are shown with their protocol and an explicit caveat.
4. Zero real funds, zero live rails, zero synthetic KYC, zero NPCI switch changes — stated wherever a demonstration could be mistaken for production.
5. Implemented prototype vs proposed pilot deployment are separated in the architecture and boundaries sections.
