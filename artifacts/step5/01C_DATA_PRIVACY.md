# STAGE 1 — DELIVERABLE C: DATA PRIVACY AND IDENTIFIER HANDLING REPORT

**Scope:** What identifiers exist, how they are handled, whether sanitisation
actually exists, and where they can leak.

---

## C.1 Identifier inventory

Formats observed in `backend/app/simulator/rail.py`:

| Identifier | Format | Real PII? |
|---|---|---|
| Bank account | `ACCT_SYNTH_{BANK}_{1000-9999}`, `ACCT_SYNTH_RETAIL_{n}`, `ACCT_{i:06d}` | No |
| Canary VPA | `CANARY_VPA_{i:02d}` (benchmark) / `canary.trap.NN@icixbank` (rail) | No |
| Customer VPA | `user.pay412@hdfxbank` style | No |
| Device token | `DEV_TOK_CUST_{i}`, `DEV_TOK_{nn}_{BANK}` | No |
| Transaction | `TXN-FEED-{uuid4[:8]}`, `TXN-SCEN-{A,B,C,D}-{uuid4[:8]}` | No |
| Bank codes | `HDFX`, `ICIX`, `SBINX`, `AXSX` (deliberately fictional) | No |

Benchmark identifiers: `ACCT_{i:06d}` and `CANARY_VPA_{i:02d}`
(`dataset_generator.py:16`).

## C.2 Classification of the control

**This is pseudonymisation-by-construction, not sanitisation, masking, hashing,
or anonymisation.**

The distinction matters and should be stated plainly:

- **Anonymisation** — irreversible de-identification. Not performed; not
  applicable, since there is nothing to anonymise.
- **Pseudonymisation** — replacing identifiers with tokens. This IS the design:
  no real identifier is ever generated, so every identifier is a synthetic
  token from birth.
- **Hashing / masking / redaction** — cryptographic or format-based suppression
  of existing sensitive values. **None exists in the codebase** (regex scan of
  `rail.py` and `stix_exporter.py`: zero matches for
  `hashlib|sha256|hmac|blake2|mask|anonym|pseudonym|redact|obfuscat`).

**Verdict:** a genuine strength — the system cannot leak customer PII because it
never holds any. It is **not** the sanitisation that `docs/threat-model.md:29`
claims.

## C.3 Where identifiers are stored

Local SQLite (`data/ghost_vpa.db`, 6.7 MB + 4.2 MB WAL), git-ignored
(`.gitignore:24-26`):

| Table | Rows |
|---|---|
| `payment_events` | 17,053 |
| `canary_alerts` | 45 |
| `investigation_cases` | 45 |
| `canary_registry` | 4 |
| `audit_logs` | 2 |

All synthetic. `audit_logs` is the only table with a genuine cryptographic
control: SHA-256 chaining over
`prev_hash|timestamp|actor_id|actor_role|action|entity_id|details_json`, with
`canonical_timestamp()` normalising tz-aware→naive UTC (a real fix for a genuine
SQLite timestamp bug).

## C.4 CONFIRMED DEFECT — sanitisation is claimed but not implemented

`docs/threat-model.md:29`:
> "STIX 2.1 bundles sanitize all internal node IDs before export."

`docs/research/research-register.md:44`:
> "STIX 2.1 exports redact all personal identity"

Probe P8 evidence — an exported bundle contains:

- the VPA in the indicator name **and** the pattern:
  `"name": "Money Mule Account: sender.mule01@hdfxbank"`,
  `"pattern": "[payment-account:vpa = 'sender.mule01@hdfxbank']"`
- the internal case ID in the description: `"Case CASE-TEST-001."`
- the bank code in the identity name: `"HDFX Fraud Intelligence Unit"`

What is absent: `ACCT_SYNTH_HDFX_9912`. But it is absent because the exporter
**template omits that field** — not because anything strips it.

**Omission ≠ sanitisation.** No redaction step exists. If the template ever
included the account ID, it would be exported verbatim. The claim is currently
true by accident and unfalsifiable by a reviewer.

## C.5 CONFIRMED DEFECT — exported STIX is not schema-conformant

Pattern observation type: `payment-account:vpa`.

Checked against the STIX 2.1 SCO vocabulary
(`domain-name, ipv4-addr, ipv6-addr, autonomous-system, url, file, email-addr,
windows-registry-key, mutex, user-account, process, network-traffic, artifact,
x509-certificate, software`): **not present.**

- `stix2validator` is **not installed** in this environment, so the claim in
  `FINAL-VERIFICATION-REPORT.md:44` ("OASIS STIX 2.1 JSON schema validated")
  **cannot be reproduced**.
- A strict validator rejects `payment-account:vpa`.
- Interoperability: `ncrp_cfcfrms` / `TAXII` consumers parsing this pattern
  would fail. The "inter-bank threat sharing" capability is unvalidated.

## C.6 CONFIRMED DEFECT — static confidence and export-time validity

```json
"valid_from": "2026-11-15T20:03:30.306902Z",   // export moment
"confidence": 95                                  // hardcoded
```

- `confidence=95` appears in no derivation. It is a constant, identical for a
  single canary hit and for a 4-hop traced ring.
- `valid_from` is stamped at **export time**, not the observed transaction time.
  An indicator's validity window should begin when the behaviour was observed.

For a compliance artefact an auditor may rely on, presenting a fixed 95% with no
evidence linkage is a misleading signal — and this is exactly the kind of claim
the brief's "regulatory truthfulness" rule targets.

## C.7 CONFIRMED DEFECT — access control does not protect identifiers

No authentication exists on the API (Deliverable A / route inventory):

- 13 endpoints; **0** have any auth dependency. No `require_role`, OAuth2,
  JWT, bearer, or API-key check in any API module (regex verified).
- The only control is a **client-supplied header**: `X-User-Role` read at
  `backend/app/api/cases.py`, used solely to allow/deny `APPLY_HOLD`.
- `docs/threat-model.md:31` claims "FastAPI dependency guards
  (`require_role(\"SUPERVISOR\")`)" — **no such function exists anywhere.**
- CORS is hardcoded at `backend/app/main.py:41-47`:
  `allow_origins=["*"], allow_credentials=True`. `settings.CORS_ORIGINS`
  (including `.env.example`) is **dead configuration**.
- Live probe P6 confirmed: preflight from `http://evil.example` returns HTTP 200
  with `access-control-allow-origin: http://evil.example` and
  `access-control-allow-credentials: true`.

Because the data is synthetic, the *impact today* is nil. The defect is that the
documented security posture — IAM integration, RBAC guards, sanitised exports —
does not correspond to any implemented control. A judge scoring "techncal
feasibility, security and prototype quality" (official criterion 3) who inspects
the code will find this.

## C.8 Recommended remediation (privacy)

1. Delete or reword the sanitisation claims in `threat-model.md` and
   `research-register.md`. Recommend instead: *"No PII is generated; identifiers
   are synthetic by construction."* — true and defensible.
2. If STIX export is to be trusted, either use standard SCO types
   (`email-addr` / `domain-name` / `user-account`) or document
   `payment-account:vpa` as a project extension; add `stix2validator` to
   requirements and run it in CI.
3. Derive confidence from evidence (e.g. hop distance, corroborating motifs) and
   set `valid_from` from the earliest evidence timestamp.
4. If a real access control is ever added, remove the hardcoded CORS wildcard
   first — `allow_origins=["*"]` with credentials fails in browsers the moment
   real auth exists.