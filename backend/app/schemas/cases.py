from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

CaseStatus = Literal[
    "OPEN_TRIAGE",
    "CUSTOMER_NOTICE_ISSUED",
    "DEBIT_HOLD_ACTIVE",
    "ESCALATED_LEA",
    "CLOSED_UNWITTING_VICTIM",
    "CLOSED_CONFIRMED_MULE"
]

class CaseActionPayload(BaseModel):
    action: Literal["DISPATCH_NOTICE", "APPLY_HOLD", "RESOLVE_VICTIM", "CONFIRM_MULE"]
    notes: str
    actor_id: str = "analyst_sharma"
    actor_role: Literal["Analyst", "Supervisor", "Auditor"] = "Analyst"

class CaseDossierResponse(BaseModel):
    case_id: str
    target_account_id: str
    target_vpa: str
    target_bank: str
    originating_alert_id: str
    case_status: CaseStatus
    sop_day_counter: int
    explanation_days_left: int
    assigned_analyst: str
    cluster_id: Optional[str] = None
    connected_mule_count: int = 0
    upstream_feeder_account: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    analyst_notes: List[str] = Field(default_factory=list)
    audit_hash: str
    fiu_str_narrative: str
    ncrp_payload_preview: Dict[str, Any]
