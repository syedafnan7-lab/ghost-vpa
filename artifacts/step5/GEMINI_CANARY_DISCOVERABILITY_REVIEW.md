# GHOST-VPA — CANARY DISCOVERABILITY & REAL-WORLD DEPLOYMENT FEASIBILITY
**Operational Analysis, Regulatory Boundaries, Sensor Architecture & Deployment Roadmap**

**Author:** Independent Principal Banking Technology Architect, Financial Crime Intelligence Engineer & Payment Switch Specialist  
**Evaluator Platform:** Gemini 3.8 Flash via Antigravity CLI  
**Audit Target:** Ghost-VPA Architecture & Real-World UPI Deployment Models  
**Date:** 2026-11-17  
**Status:** READ-ONLY INVESTIGATION & FORMAL STRATEGIC REVIEW  
**Deliverable Path:** `artifacts/step5/GEMINI_CANARY_DISCOVERABILITY_REVIEW.md`

---

## 1. Executive Summary

A core question sits at the center of the Ghost-VPA value proposition:
> **"A bank-controlled canary VPA is not automatically part of ordinary UPI infrastructure. How would suspicious actors actually discover these identifiers and interact with them in the real world?"**

If canary identifiers are invisible, they receive zero traffic and produce zero intelligence. Conversely, if they are recklessly distributed or fabricated without strict adherence to banking law, they violate the Prevention of Money Laundering Act (PMLA 2002), breach NPCI operating guidelines, and risk entrapping innocent citizens.

```
                    ┌────────────────────────────────────────────────────────┐
                    │      THE CANARY PARADOX IN DOMESTIC FAST PAYMENTS      │
                    └────────────────────────────────────────────────────────┘
                                                 │
         ┌───────────────────────────────────────┴───────────────────────────────────────┐
         ▼                                                                               ▼
┌─────────────────────────────────┐                                             ┌─────────────────────────────────┐
│     THE "PASSIVE GHOST" TRAP    │                                             │   THE "ENTRAPMENT / KYC" TRAP   │
├─────────────────────────────────┤                                             ├─────────────────────────────────┤
│ • A static VPA on an internal GL│                                             │ • Fabricating fake KYC handles  │
│   sits unlisted and unknown.    │                                             │   violates PMLA Section 3/12.   │
│ • Fraudsters never touch it.    │                                             │ • Posing as fake scammers       │
│ • Intelligence output = ZERO.   │                                             │   breaches banking charter.     │
│ • Theoretical concept fails.    │                                             │ • Entraps innocent counterparties│
└─────────────────────────────────┘                                             └─────────────────────────────────┘
                                                 │
                                                 ▼
                    ┌────────────────────────────────────────────────────────┐
                    │          THE DEFENSIBLE REGULATORY SOLUTION            │
                    │   Dual-Sensor Architecture + Controlled Enumeration    │
                    │   Pre-Transaction ReqValAdd Interception on Bank GLs   │
                    └────────────────────────────────────────────────────────┘
```

### The Seven Architectural Verdicts
1. **Passive Dormant VPAs are INSUFFICIENT:** In standard UPI, NPCI Circular OC 180/2023-24 strictly mandates disabling inward credit on VPAs inactive for $>1$ year. Completely passive dormant handles will never receive syndicate traffic.
2. **Controlled Exposure is ESSENTIAL:** Decoy identifiers must be strategically exposed through legally defensible surfaces: (a) honeytoken credential dumps, (b) enumerated sequential phone-handle ranges, (c) automated beneficiary lookup probing sensors, and (d) bank-owned suspense collection handles.
3. **Live UPI Deployment is FEASIBLE Without Regulatory Exemption:** A bank cannot deploy unlinked "ghost" VPAs, but **can legally provision VPAs mapped to internal bank-owned General Ledger (GL) accounts** (e.g., `canary.alert@bank` mapped to a zero-debit Internal Suspense Escrow Account).
4. **Beneficiary Lookup (`ReqValAdd`) is the Primary Zero-Funds Sensor:** Under NPCI specifications, every time a user or bot types a VPA into a UPI app, a non-financial **`ReqValAdd` (Validate Address)** request is routed to the Beneficiary Bank switch *before any money moves*. This provides 100% pre-transaction visibility with zero fund leakage.
5. **A Dual-Sensor Architecture is MANDATORY:** The platform must split into **Identity Canary Sensors** (tracking enumeration, recon, and `ReqValAdd` lookups) and **Transaction Intelligence Sensors** (tracking financial `ReqPay` attempts, velocity, and amounts).
6. **Lookup Intent $\neq$ Financial Graph Edge:** A beneficiary lookup proves someone checked a handle; it does *not* prove a money laundering transfer occurred. Lookup events must annotate nodes as "Probing Suspects" rather than creating false financial graph edges.
7. **Demonstration Focus for the Hackathon:** The team must demonstrate **Scenario E (Dual-Sensor Pipeline)**: an automated adversary bot probing an exposed honeytoken handle via `ReqValAdd`, triggering pre-routing triage *before* a penny-drop `ReqPay` is attempted.

---

## 2. Canary Discoverability: Analysis of Seven Exposure Models

How does an adversary discover a bank-controlled canary identifier without the bank violating KYC regulations or exposing ordinary citizens?

```
                       CANARY DISCOVERABILITY TAXONOMY
                       
[EXPOSURE VECTOR]                     [ADVERSARY ACTION]             [CAPTURED SIGNAL]
1. Passive Dormant VPAs         ──►   Bulk List Re-testing     ──►   ReqValAdd / Penny Drop
2. Honeytoken Leaked Dumps      ──►   Credential Ingestion     ──►   API Resolution Scan
3. Directory Enumeration Bots   ──►   Algorithmic Scanning     ──►   High-Frequency ReqValAdd
4. Penny-Drop Probes (₹1)       ──►   Mule Account Validation  ──►   Pre-Cashout ReqPay
5. Controlled Cyber Ranges      ──►   Simulated Red-Teaming    ──►   Synthetic Telemetry
6. Bank-Authorized Decoy GLs    ──►   Fake Merchant Routing    ──►   Layering Infiltration
7. Post-Seizure LEA Feeds       ──►   Syndicate Re-use         ──►   Cross-Bank Feeder Hit
```

### Detailed Evaluation of the Seven Discoverability Models

| Model # | Discoverability Mechanism | Adversary Ingestion Behavior | Captured Event on Bank Rail | Evidentiary Value & Fraud Signal | Legal & Regulatory Feasibility |
|---|---|---|---|---|---|
| **1. Passive Dormant VPAs** | The bank monitors previously active customer VPAs that have become dormant or inoperative. | Fraud syndicates purchase stale account databases from rogue brokers and test whether closed/dormant accounts can still accept funds. | Inbound `ReqValAdd` or penny-drop `ReqPay` hitting a dormant identifier. | **High:** Proves the remitter is systematically probing bought stale databases. | **Restricted:** NPCI Circular OC 180/2023-24 requires disabling inward credit after 1 year. Must be mapped to bank suspense GL. |
| **2. Honeytoken Leaked Identifiers** | The bank intentionally seeds decoy VPAs into synthetic credential dumps, dark-web pastebins, or public breach repositories. | Automated syndicates ingest leaked data feeds and run automated batch validation scripts to identify usable accounts. | High-velocity API resolution bursts (`ReqValAdd`) originating from specific aggregators. | **Critical:** Proves the actor is actively utilizing dark-web data feeds for money-mule harvesting. | **100% Legal:** The bank creates and leaks its own synthetic honeytokens. Zero customer data involved. |
| **3. Account Enumeration & Validation Activity** | Scammers run automated bots across sequential mobile numbers (`98XXXXXXXX@upi`) or common dictionary words to harvest active names. | Script-driven botnets cycling through thousands of iterations per hour across UPI payment apps. | Sequential, high-entropy `ReqValAdd` queries hitting canary handles interleaved in the sequence. | **Very High:** Detects automated reconnaissance infrastructure before laundering begins. | **100% Legal:** Standard cyber-deception defense deployed within the bank's own switch domain. |
| **4. Penny-Drop Verification Probes** | Syndicates test newly acquired mule accounts using ₹1 or ₹2 micro-transfers before routing multi-lakh scam proceeds. | Muleherders executing penny-drops across newly provisioned handles to verify active routing. | Incoming low-value transaction ($A \le ₹10$) with `attempt_type=PENNY_DROP_PROBE`. | **Decisive:** Strongest possible operational early warning. Indicates immediate pending cash-out. | **100% Feasible:** Processed at the bank switch as an intercepted credit leg. |
| **5. Controlled Security-Research Ranges** | Decoy VPAs registered within isolated inter-bank sandbox environments or academic hackathons (e.g. RBIH NFPC). | White-hat attackers and red teams simulating realistic syndicate attack patterns. | Fully instrumented end-to-end telemetry across multi-hop scenarios. | **High for Benchmarking:** Establishes mathematical ground truth without production operational risk. | **100% Permissible:** Standard development and testing sandbox. |
| **6. Bank-Authorized Decoy Listings** | Bank creates verified merchant profiles for fictional utility services or institutional escrow on controlled platforms. | Syndicates searching for unverified digital payment endpoints to park stolen funds during layering. | Direct payment initiation (`ReqPay`) into a bank-owned institutional suspense handle. | **High:** Captures intentional placement of criminal proceeds into institutional handles. | **Permissible:** Fully legal if handles belong to the bank's own corporate balance sheet. |
| **7. Post-Seizure LEA / I4C Feed Sharing** | An active mule account seized by police or reported to I4C is converted into a monitored listening post. | Unaware syndicate operators continue transferring stolen funds into the compromised node. | Inbound payments from upstream feeder accounts attempting automated dispersion. | **Maximum Evidence:** Directly exposes the kingpin feeder network. | **Requires Legal Authorization:** Requires formal police/court order under Section 102 CrPC. |

---

## 3. Real UPI Operational Requirements (NPCI & RBI Architecture)

An enterprise-grade fraud architecture must operate within the actual engineering constraints of the Unified Payments Interface (UPI). We examine these requirements against official NPCI procedural guidelines and RBI regulations.

```mermaid
sequenceDiagram
    autonumber
    actor Adversary as Fraudster / Mule App
    participant PayerPSP as Remitter PSP (PhonePe/GPay)
    participant NPCI as NPCI Central UPI Switch
    participant BankSwitch as Beneficiary Bank Switch (Ghost-VPA)
    participant CBS as Bank Core Banking (CBS / GL)

    Note over Adversary,BankSwitch: PHASE 1: BENEFICIARY VALIDATION (ReqValAdd) - ZERO MONEY
    Adversary->>PayerPSP: Enters VPA: canary.alert.01@bank
    PayerPSP->>NPCI: ReqValAdd (Payee Address Validation)
    NPCI->>BankSwitch: ReqValAdd (Forwarded to Beneficiary Bank)
    Note over BankSwitch: SENSOR 1: Identity Canary Triggered!<br/>Log Reconnaissance Event.<br/>Zero Funds Moved.
    BankSwitch-->>NPCI: RespValAdd (Verified Name: "Institutional Escrow GL")
    NPCI-->>PayerPSP: RespValAdd (Display Payee Name)
    PayerPSP-->>Adversary: Shows Name on Screen

    Note over Adversary,CBS: PHASE 2: FINANCIAL EXECUTION (ReqPay) - PRE-ROUTING INTERCEPT
    Adversary->>PayerPSP: Authorizes Payment (Enters UPI PIN)
    PayerPSP->>NPCI: ReqPay (Financial Push Request)
    NPCI->>NPCI: Debits Remitter Account at Payer Bank
    NPCI->>BankSwitch: ReqPay (Credit Leg to Beneficiary)
    Note over BankSwitch: SENSOR 2: Transaction Intelligence Triggered!<br/>Sidecar Intercepts Credit Leg.
    alt Strategy A: Zero Core Posting (Decline & Auto-Reversal)
        BankSwitch-->>NPCI: RespPay (Error U31: Account Inoperative)
        NPCI->>NPCI: Auto-Reversal (Refunds Remitter Leg)
    else Strategy B: Suspense Quarantine (Zero Cash-Out)
        BankSwitch->>CBS: Post Credit to GL_SUSPECT_CANARY_ESCROW
        CBS-->>BankSwitch: Ledger Locked / Debit Lien Applied
        BankSwitch-->>NPCI: RespPay (00: Success - Quarantined)
    end
```

### 3.1 VPA Mapping and Account Association
- **Rule:** Under the **UPI 2.0 Operating Framework (Section 4.1)**, every Virtual Payment Address (VPA) must resolve to an active account identifier (Account Number + IFSC) registered in the bank's Core Banking System (CBS) and mapped in NPCI's Central Mapper.
- **The "Floating VPA" Myth:** A bank **cannot** create arbitrary unlinked string VPAs on the live switch. Any VPA queried on UPI that is not mapped in the Central Mapper or rejected by the beneficiary switch returns an immediate `ZM` ("Invalid Virtual Address") error from NPCI.
- **The Compliant Solution:** The bank provisions canaries mapped to **Internal General Ledger (GL) Suspense Accounts** (e.g. `Account: 999900100234`, `IFSC: HDFC0000001`, `Account Type: Internal Office Account`). This complies 100% with PMLA KYC rules because the account holder is the licensed banking institution itself.

### 3.2 Provisioning Authority & Scalability
- **Who Provisions:** Only a certified **UPI Acquiring / Issuing Member Bank** operating a certified UPI Switch can register handles on its domain (e.g. `@hdfcbank`, `@icicibank`, `@sbinx`).
- **Scale:** A Tier-1 bank can provision hundreds or thousands of institutional VPAs under its assigned corporate handle. These handles are managed via internal switch tables and do not incur third-party PSP fees.

### 3.3 Observability of Pre-Transaction Signals (`ReqValAdd`)
- When any payment application initiates a transfer to an identifier, it executes an **Address Resolution Request (`ReqValAdd`)**.
- **Switch Routing:** NPCI's central router inspects the handle domain (e.g., `@icicibank`) and immediately routes the `ReqValAdd` packet to the destination bank's switch.
- **Payload Data Captured:** The destination bank switch receives:
  1. Queried VPA handle.
  2. Transaction ID / RRN.
  3. Initiating PSP Bank Identifier (e.g., `PYTM`, `OKAXIS`, `YBL`).
  4. Device Fingerprint / IP Subnet (if relayed in the message header).
  5. Timestamp (millisecond precision).
- **Critical Architectural Fact:** **`ReqValAdd` is completely non-financial.** The bank observes the exact identity of the account querying the canary *without a single rupee being debited or transferred*.

### 3.4 Observability of Incomplete & Failed Payments
- **Remitter-Side Failures:** If a fraudster enters an incorrect UPI PIN or has insufficient funds at their remitter bank, the financial `ReqPay` is terminated at the remitter switch. NPCI never forwards `ReqPay` to the beneficiary bank. **However, the preceding `ReqValAdd` resolution was already logged by the beneficiary bank.**
- **Beneficiary-Side Interception:** When the remitter successfully authenticates, NPCI transmits the incoming credit leg of `ReqPay` to the beneficiary switch. The beneficiary switch has complete authority to accept, quarantine, or reject the transfer before it touches the general customer ledger.

### 3.5 Regulatory & Governance Matrix

| Governance Entity | Required Authority | Compliance Mandate | Practical Bank Implementation Path |
|---|---|---|---|
| **NPCI** | UPI Procedural Guidelines | Prohibits synthetic dummy customer accounts; mandates valid CBS account mapping. | Map canary VPAs to bank-owned **Internal Office / Escrow Suspense GLs**. Zero fictitious citizen identities created. |
| **RBI** | Master Direction on KYC (2016 / 2026 Draft) | Section 3/12 forbids opening accounts in anonymous or fictitious names. | Canary accounts are institutional assets owned by the bank's Financial Crime Unit (FCU), fully audited under bank PAN/CIN. |
| **Bank Internal** | Board Risk Committee & CISO | Authorization for cyber-deception operations and active honeypot monitoring. | Formal policy approval establishing the Canary Registry under the bank's Fraud Risk Management Policy (FRMP). |
| **PMLA 2002** | Section 12 (Reporting Obligations) | Requires filing Suspicious Transaction Reports (STRs) on attempted money laundering. | Automated export of canary interaction records to FIU-IND and NCRP-CFCFRMS. |

---

## 4. Ontological Separation of Three Signal Types

A catastrophic failure in naive fraud systems is treating all alerts identically. Querying a VPA must not be treated as a money laundering transaction; an innocent typo must not trigger an account freeze.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THREE DISTINCT SIGNAL TYPES                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  SIGNAL 1: DISCOVERY / RECONNAISSANCE                                  │
│  • Surface: Honeytoken leak, directory crawl, dark-web pastebin        │
│  • Proves: Identifier is known to external automated scrapers          │
│  • Does NOT Prove: Financial culpability or imminent payment           │
│  • Graph Impact: Node Flag = HONEYTOKEN_EXPOSED                        │
│                                                                        │
│  SIGNAL 2: BENEFICIARY LOOKUP / PAYMENT INTENT (ReqValAdd)             │
│  • Surface: Inbound NPCI Address Resolution Request                    │
│  • Proves: A specific user/bot actively queried the canary handle     │
│  • Does NOT Prove: A transfer was authorized or completed              │
│  • Graph Impact: Tentative Probing Edge (Weight=0.0, Zero Flow)        │
│                                                                        │
│  SIGNAL 3: ACTUAL TRANSACTION ATTEMPT (ReqPay)                         │
│  • Surface: Inbound Financial Credit Leg (PIN Authenticated)           │
│  • Proves: Authenticated intention to transfer real funds              │
│  • Does NOT Prove: Autonomous guilt (Mule vs Unwitting Victim)         │
│  • Graph Impact: Directed Financial Edge (Weight=f(A,t), CS-LP Update) │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Signal Characterization

#### Signal 1: Identifier Discovery or Exposure (Reconnaissance)
- **What it captures:** External monitoring of honeypots placed in pastebins, public GitHub repos, or synthetic leak archives.
- **What it PROVES:** The canary identifier has been indexed by threat actors, credential harvesters, or data brokers.
- **What it DOES NOT PROVE:** No banking transaction has occurred. It does not prove any specific bank customer is involved in crime.
- **System Action:** Increments threat exposure score; primes switch sidecar to expect incoming lookups on that specific handle.

#### Signal 2: Beneficiary Lookup / Payment Intent (`ReqValAdd`)
- **What it captures:** A customer or automated script enters the canary VPA into a payment app, triggering an NPCI `ReqValAdd` address resolution call.
- **What it PROVES:** An active payment app session specifically targeted this identifier and resolved its registered payee name.
- **What it DOES NOT PROVE:** 
  - It does **not** prove money was moved.
  - It does **not** prove criminal intent (an innocent citizen may have mis-typed a phone number or VPA by one digit).
- **Rule:** **A payment-intent signal must NOT create a financial payment edge in the temporal graph.** It creates an annotated "Tentative Probing" observation. The sender is marked for monitoring, but no debit holds or STR reports are generated.

#### Signal 3: Actual Transaction / Financial Credit Leg (`ReqPay`)
- **What it captures:** The remitter authenticates with their UPI PIN, and NPCI routes the financial credit leg to the beneficiary bank.
- **What it PROVES:** Real capital was committed by an authenticated remitter targeting the canary endpoint.
- **What it DOES NOT PROVE:** It does not prove whether the sender is a professional syndicate mule or an unwitting scam victim tricked into paying a "digital arrest" extortion handle.
- **System Action:** Triggers immediate pre-routing interception (zero cash-out); updates DU-RLP risk score; auto-provisions an investigation case under the RBI 20-day explanation SOP.

---

## 5. Redesigned Sensor Architecture

To ingest these signals without contaminating the financial graph, Ghost-VPA must implement a **Dual-Sensor Decoupled Pipeline**.

```mermaid
flowchart TD
    subgraph PaymentSwitch ["Bank Payment Switch Boundary"]
        INCOMING[Inbound NPCI Traffic] --> CLASSIFY{Traffic Type}
        CLASSIFY --> |"ReqValAdd (Non-Financial)"| SENSOR_ID[Identity Canary Sensor]
        CLASSIFY --> |"ReqPay (Financial Credit Leg)"| SENSOR_TX[Transaction Intelligence Sensor]
    end

    subgraph SensorPipeline ["Dual-Sensor Decoupled Processing"]
        SENSOR_ID --> ID_FILTER{Interaction Pattern}
        ID_FILTER --> |"High Velocity / Sequence"| ENUM_DETECTOR[Bot Enumeration Detector]
        ID_FILTER --> |"Isolated Lookup"| INTENT_CACHE[Payment Intent Cache (TTL 10m)]

        SENSOR_TX --> PRE_ROUTE{Canary Match?}
        PRE_ROUTE --> |Yes| QUARANTINE[Quarantine Credit Leg / Zero Cash-Out]
        PRE_ROUTE --> |No| NORMAL_POST[Normal CBS Ledger Posting]
        QUARANTINE --> TX_EVENT[Financial Payment Event]
    end

    subgraph TemporalGraph ["Graph Engine Intelligence Layers"]
        ENUM_DETECTOR --> |"Annotates Node (Recon Flag)"| GRAPH_STATE[(MultiDiGraph)]
        INTENT_CACHE -.-> |"Tentative Edge (Zero Weight)"| GRAPH_STATE
        TX_EVENT ==> |"DIRECTED FINANCIAL EDGE (Weight > 0)"| GRAPH_STATE
        GRAPH_STATE --> DURLP[Directed Upstream Reverse Propagation]
    end

    subgraph CaseManagement ["Investigation & Regulatory Triage"]
        DURLP --> CASE_MGR[RBI 60-Day Case Manager]
        CASE_MGR --> FIU[FIU-IND STR Narrative]
        CASE_MGR --> NCRP[NCRP-CFCFRMS Dispatch]
    end
```

### Sensor Category 1: Identity Canary Sensors (Non-Financial)
- **Domain:** Ingests non-financial switch packets (`ReqValAdd`), honeypot web beacons, and dark-web leak monitoring.
- **Role:** Measures adversary reconnaissance velocity, brute-force dictionary attacks, and pre-transaction payment intent.
- **Graph Ingestion Contract:** 
  - **Never** alters node financial risk scores or account balances.
  - Adds temporary metadata tags to nodes: `metadata={"last_lookup_timestamp": ts, "recon_channel": "PHONEPE_BOT"}`.
  - Correlates lookup bursts: If an IP subnet queries 50 dormant VPAs in 60 seconds, all originating devices are flagged as automated reconnaissance harvesters.

### Sensor Category 2: Transaction Intelligence Sensors (Financial)
- **Domain:** Ingests financial payment requests (`ReqPay`), penny-drop probes, inter-account transfers, and CBS ledger events.
- **Role:** Measures actual money flow, velocity ($\Delta t$), amount conservation ratios, and multi-hop layering.
- **Graph Ingestion Contract:**
  - Adds directed financial edges: $e = (u, v, t, A)$.
  - Fuels the **Directed Upstream Reverse Label Propagation (DU-RLP)** engine.
  - Propagates culpability strictly backwards against the direction of money transfer.

---

## 6. Zero-Real-Funds Experimental Prototype Plan

To validate both sensor categories and test all operational edge cases without live fund risk, we specify a comprehensive synthetic experimental harness.

```
                        EXPERIMENTAL TEST HARNESS SUITE
                        
[Test Entity]          [Event Type]       [Expected Engine Behavior]
1. Dormant Canary      ReqValAdd          Logged as Stale Probe; Zero Alert; No Graph Edge
2. Honeytoken Canary   ReqValAdd (Burst)  Botnet Enumeration Detected; Harvester Flagged
3. Payer Intent        ReqValAdd          Cached in Intent Buffer; Awaits Matching ReqPay
4. Suspicious Probe    ReqPay (₹1)        Tripwire Alert; Quarantined; Feeder DU-RLP Run
5. Benign Payment      ReqPay (₹150)      Identified as Isolated Typo; Customer Notice
6. Layering Transfer   ReqPay (₹45,000)   Multi-Hop DU-RLP Backpropagation; Feeder Tagged
7. Replayed Packet     ReqPay (Duplicate) Handled Idempotently; HTTP 200; Zero Double-Count
```

### Detailed Event Specification Matrix

| Event # | Scenario Description | Injected Payload Parameters | Sensor Triggered | Engine State Machine Transition | Produced Intelligence Artifact |
|---|---|---|---|---|---|
| **E1** | **Dormant Canary Probe** | `canary.dormant.01@bank`, `type: ReqValAdd`, `amt: 0.0`, `caller: UNKNOWN` | Identity Canary Sensor | Ingests lookup into cache; identifies VPA as dormant. | Zero financial edge added; increment dormant hit counter. |
| **E2** | **Exposed Honeytoken Burst** | 50 sequential queries to `honey.token.*@bank` within 10s from IP `10.200.5.0/24` | Identity Canary Sensor | Triggers `AUTOMATED_DICTIONARY_HARVESTING` rule. | Threat intel alert generated; originating IP subnet blacklisted in gateway. |
| **E3** | **Beneficiary Lookup (Intent)** | `user_alpha` queries `canary.trap.01@bank` via `ReqValAdd`. No payment follows. | Identity Canary Sensor | Stored in `PaymentIntentCache` with 10-minute TTL. | Node `user_alpha` annotated with `lookup_pending=True`. Zero case created. |
| **E4** | **Penny-Drop Verification** | `ACCT_MULE_101` sends ₹1.00 (`attempt_type: PENNY_DROP_PROBE`) to `canary.trap.01`. | Transaction Intelligence Sensor | Intercepted pre-routing; sender tagged `REVIEW_REQUIRED`; zero funds transferred. | Alert `ALT-PENNY-DROP`; case auto-provisioned; DU-RLP traverses upstream to feeder. |
| **E5** | **Benign Typo Payment** | Retail customer `ACCT_RETAIL_99` attempts ₹150 transfer to canary. Isolated event. | Transaction Intelligence Sensor | Intercepted pre-routing; tagged `REVIEW_REQUIRED`. Motif engine confirms zero layering. | Case created in `CUSTOMER_NOTICE_PENDING`; recommended for `RESOLVE_VICTIM` release. |
| **E6** | **Layering Transfer** | Feeder transfers ₹45k to Mule; Mule immediately sends ₹42k to canary within 4 mins. | Transaction Intelligence Sensor | High-velocity pass-through motif detected ($93\%$ conservation, $\Delta t = 4\text{m}$). | Feeder `FEEDER_007` attributed with score $0.4465$; case dossier populated with cluster ID. |
| **E7** | **Replayed Event Packet** | Exact duplicate of `TXN-SCEN-B-001` retransmitted after 500ms. | Switch Gateway Layer | Deduplication filter matches cached `event_id`. | Returned cached `PROCESSED` response; SQLite database avoids `IntegrityError` 500 crash. |

---

## 7. Strategic Conclusions & Technical Guidance

### 7.1 Are Passive VPAs Sufficient?
**NO.** Completely passive, unadvertised VPAs are functionally dead code. In real UPI networks, syndicates do not guess random string addresses. Without exposure, a canary receives zero interactions, producing a 100% false-negative rate on live fraud rings.

### 7.2 Is Controlled Exposure Necessary?
**YES.** Controlled, legally defensible exposure is an absolute structural prerequisite. The bank must utilize:
1. **Honeytoken canary leaks** seeded into known reconnaissance collection vectors.
2. **Sequential enumeration listening posts** capturing botnet scans on bank-owned handle blocks.
3. **Internal Office Suspense Handles** actively utilized for institutional collections.

### 7.3 Is Live UPI Deployment Feasible?
**YES, but strictly under bank-owned General Ledger (GL) accounts.**
- **Compliant Route:** Deploying canaries mapped to the bank's own internal suspense GL accounts (`canary@bank` $\to$ `Bank Office Suspense Account`). This requires zero customer KYC fabrication and operates within existing UPI switch specifications.
- **Prohibited Route:** Creating unlinked "ghost" handles or opening accounts under fictitious citizen names. This is illegal under PMLA Section 3 and will be rejected by NPCI's Central Mapper.

### 7.4 Is a Separate Transaction-Intelligence Sensor Needed?
**ABSOLUTELY YES.** Conflating `ReqValAdd` (lookup) with `ReqPay` (money movement) ruins the graph engine, producing false positives and attributing guilt to innocent users who merely mis-typed a handle. The **Dual-Sensor Architecture** permanently decouples identity reconnaissance from financial flow modeling.

### 7.5 Which Model Should Be Demonstrated in the Hackathon?
The team should demonstrate **The Two-Stage Penetration Scenario (Scenario E)**:
1. **Stage 1 (Reconnaissance):** An automated bot executes a `ReqValAdd` query against an exposed honeytoken canary. The UI shows the **Identity Canary Sensor** lighting up in real time, capturing device/IP metadata while moving ₹0.00.
2. **Stage 2 (Probing & Attribution):** The bot initiates a financial `ReqPay` probe from a mule account. The **Transaction Intelligence Sensor** intercepts the credit leg, triggers pre-routing quarantine, runs DU-RLP, and displays the upstream feeder in the Investigation Workbench.

### 7.6 What Requires NPCI, Bank or Legal Validation?
1. **Bank Board & Risk Management Committee (RMC):** Approval of the Cyber-Deception Fraud Policy authorizing the creation of internal GL canary handles.
2. **Bank CISO & Fraud Operations:** Definition of the zero-cash-out suspense quarantine ledger (`GL_SUSPECT_CANARY_ESCROW`).
3. **NPCI Switch Integration:** Coordination with the bank's switch vendor (e.g. FIS, Euronet, or in-house UPI switch) to install the pre-routing sidecar listener on incoming `ReqValAdd` and `ReqPay` queues.

---
*Report certified by Independent Technical Red Team Audit — Antigravity CLI.*
