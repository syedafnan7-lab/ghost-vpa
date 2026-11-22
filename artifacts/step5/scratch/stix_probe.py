"""STAGE 1 PROBE 7 — STIX export: validity, sanitisation, and confidence.

Claims under test:
  - threat-model.md:29 "STIX 2.1 bundles sanitize all internal node IDs before export"
  - Earlier verification report "valid OASIS STIX 2.1 JSON bundle"
  - demo-runbook "validated threat bundle"
"""
import sys, re, json
sys.path.insert(0, "C:/Users/HP/ghost-vpa")
from datetime import datetime, timezone
from backend.app.db.models import CaseModel
from backend.app.threat_intel.stix_exporter import stix_exporter

case = CaseModel(
    case_id="CASE-TEST-001",
    target_account_id="ACCT_SYNTH_HDFX_9912",
    target_vpa="sender.mule01@hdfxbank",
    target_bank="HDFX",
    originating_alert_id="ALT-TEST-001",
    case_status="OPEN_TRIAGE",
    created_at=datetime(2026, 11, 15, tzinfo=timezone.utc),
    updated_at=datetime(2026, 11, 15, tzinfo=timezone.utc),
    ncrp_payload_json=json.dumps({"suspect_account": "ACCT_SYNTH_HDFX_9912"}),
)
bundle = stix_exporter.export_case_bundle(case)
raw = json.dumps(bundle, indent=2)
print(raw)
print()

print("=== SANITISATION CLAIM (threat-model.md:29) ===")
for tok in ["ACCT_SYNTH_HDFX_9912", "HDFX", "CASE-TEST-001", "ALT-TEST-001",
            "sender.mule01@hdfxbank"]:
    print(f"  '{tok}' present in exported bundle: {tok in raw}")
print("  => threat-model claims 'sanitize all internal node IDs'.")
print("  stix_exporter.py contains no redaction/pseudonymisation step at all.")
print()

print("=== IS 'payment-account:vpa' A VALID STIX SCO TYPE? ===")
frame = json.loads(raw)
ind = next(o for o in frame["objects"] if o["type"] == "indicator")
pattern = ind.get("pattern", "")
print(f"  pattern = {pattern}")
m = re.search(r"\[([a-zA-Z0-9_\-:]+)", pattern)
declared = m.group(1) if m else None
STD_SCO = {"domain-name", "ipv4-addr", "ipv6-addr", "autonomous-system", "url",
           "file", "email-addr", "windows-registry-key", "mutex", "user-account",
           "process", "network-traffic", "artifact", "x509-certificate", "software"}
print(f"  declared observation type: {declared}")
print(f"  in standard STIX 2.1 SCO vocabulary: {declared in STD_SCO}")
print("  => NON-STANDARD observation type. A strict STIX 2.1 validator")
print("     rejects 'payment-account:vpa'. stix2validator is not installed,")
print("     so the 'validated against OASIS STIX 2.1' claim cannot be reproduced.")
print()

print("=== CONFIDENCE / VALIDITY PROVENANCE ===")
print(f"  confidence (hardcoded): {ind.get('confidence')}")
print(f"  valid_from (export time, not evidence time): {ind.get('valid_from')}")
print("  => Static 95% confidence with no derivation from the underlying evidence.")
print("     valid_from stamped at export, not at the observed transaction.")
print()

print("=== WHO says this? comparison with the verified report claim ===")
print("  Earlier verification report: 'STIX 2.1 JSON schema validated' ->")
print("  cannot be reproduced; stix2validator absent; pattern type invalid.")
