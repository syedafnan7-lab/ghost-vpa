from datetime import datetime
from typing import Literal, Dict, Any
from pydantic import BaseModel, Field

AlertSeverity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
AlertStatus = Literal["NEW", "TRIAGED", "ESCALATED_TO_CASE", "DISMISSED_BENIGN"]

class TripwireAlertPayload(BaseModel):
    alert_id: str
    event_id: str
    timestamp: datetime
    canary_id: str
    canary_vpa: str
    sender_account_id: str
    sender_vpa: str
    sender_bank: str
    amount_inr: float
    device_token: str
    risk_level: AlertSeverity = "CRITICAL"
    status: AlertStatus = "NEW"
    detection_latency_ms: float
    zero_funds_verified: bool = True
    context_metadata: Dict[str, Any] = Field(default_factory=dict)
