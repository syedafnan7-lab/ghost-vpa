from datetime import datetime, timezone
from backend.app.db.models import CaseModel
from backend.app.threat_intel.stix_exporter import stix_exporter

def test_stix_exporter_generates_valid_bundle():
    case = CaseModel(
        case_id="CASE-TEST-001",
        target_account_id="ACCT_SYNTH_HDFX_9912",
        target_vpa="sender.mule01@hdfxbank",
        target_bank="HDFX",
        originating_alert_id="ALT-TEST-001",
        case_status="OPEN_TRIAGE",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    bundle = stix_exporter.export_case_bundle(case)
    assert bundle["type"] == "bundle"
    assert "objects" in bundle
    assert len(bundle["objects"]) >= 3

    # Check for custom synthetic tag and indicator
    indicator_obj = next(o for o in bundle["objects"] if o["type"] == "indicator")
    assert indicator_obj["x_ghostvpa_synthetic"] is True
    assert "sender.mule01@hdfxbank" in indicator_obj["pattern"]
