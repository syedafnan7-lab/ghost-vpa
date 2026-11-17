from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

PaymentRailType = Literal["UPI", "IMPS"]
AttemptType = Literal["P2P", "P2M", "PENNY_DROP_PROBE"]
SimulatedResultType = Literal["SETTLED_NORMAL", "TRIPWIRE_TRIGGERED", "DECLINED_BENIGN", "ATTEMPT_RECORDED"]
EventType = Literal[
    "IDENTIFIER_DISCOVERY",
    "BENEFICIARY_VALIDATION",
    "PAYMENT_ATTEMPT",
    "CREDIT_CONFIRMED",
    "PAYMENT_DECLINED",
    "PAYMENT_REVERSED"
]

class PaymentAttemptEvent(BaseModel):
    event_id: str = Field(..., description="Unique transaction event ID")
    timestamp: datetime = Field(..., description="Simulated timestamp of transfer attempt")
    sender_account_id: str = Field(..., description="Synthetic sender account ID")
    sender_vpa: str = Field(..., description="Sender virtual payment address")
    sender_bank: str = Field(..., description="Sender bank identifier (e.g. HDFX, ICIX)")
    beneficiary_account_id: Optional[str] = Field(None, description="Synthetic beneficiary account ID")
    beneficiary_vpa: str = Field(..., description="Beneficiary virtual payment address")
    beneficiary_bank: str = Field(..., description="Beneficiary bank identifier")
    amount_inr: float = Field(..., ge=0.0, description="Transaction amount in INR")
    payment_rail: PaymentRailType = Field(default="UPI", description="Domestic rail")
    attempt_type: AttemptType = Field(default="P2P", description="Attempt mode")
    event_type: EventType = Field(default="PAYMENT_ATTEMPT", description="Lifecycle event semantic type")
    original_event_id: Optional[str] = Field(None, description="Linked event ID for PAYMENT_REVERSED")
    device_token: str = Field(..., description="Synthetic device fingerprint hash")
    ip_subnet: str = Field(..., description="Pseudonymous IP subnet")
    is_canary_hit: bool = Field(default=False, description="Whether target matches a registered canary VPA")
    simulated_result: SimulatedResultType = Field(default="SETTLED_NORMAL", description="Result of attempt")
    zero_funds_transferred: bool = Field(default=False, description="Invariant check verifying zero money moved")

class IngestionResponse(BaseModel):
    event_id: str
    status: str
    is_canary_hit: bool
    sender_status: str
    latency_ms: float
    message: str
