import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
import stix2
from backend.app.db.models import CaseModel

class STIX21Exporter:
    @staticmethod
    def export_case_bundle(case: CaseModel) -> Dict[str, Any]:
        """Generates a valid OASIS STIX 2.1 bundle for a verified mule case.
        All indicators are explicitly marked x_ghostvpa_synthetic: True."""
        now = datetime.now(timezone.utc)

        # 1. Identity (Reporting Bank Entity)
        identity = stix2.Identity(
            name=f"{case.target_bank} Fraud Intelligence Unit",
            identity_class="organization",
            description="Bank-side fraud intelligence and cyber-deception operations",
            sectors=["financial-services"],
            created=now,
            modified=now,
            allow_custom=True
        )

        # 2. Indicator (Flagged Mule VPA / Feeder)
        pattern = f"[payment-account:vpa = '{case.target_vpa}']"
        indicator = stix2.Indicator(
            name=f"Money Mule Account: {case.target_vpa}",
            description=f"Identified through canary tripwire correlation and temporal graph propagation. Case {case.case_id}.",
            indicator_types=["malicious-activity"],
            pattern=pattern,
            pattern_type="stix",
            valid_from=now,
            confidence=95,
            custom_properties={"x_ghostvpa_synthetic": True},
            allow_custom=True
        )

        # 3. Standard OASIS TLP:AMBER Marking Definition
        tlp_marking = stix2.TLP_AMBER

        # 4. Relationship
        rel = stix2.Relationship(
            relationship_type="indicates",
            source_ref=indicator.id,
            target_ref=identity.id,
            custom_properties={"x_ghostvpa_synthetic": True},
            allow_custom=True
        )

        # Create Bundle with allow_custom=True
        bundle = stix2.Bundle(objects=[identity, indicator, tlp_marking, rel], allow_custom=True)
        return json.loads(bundle.serialize())

stix_exporter = STIX21Exporter()
