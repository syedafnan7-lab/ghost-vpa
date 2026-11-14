from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

CanaryType = Literal["REGULATORY_TRIPWIRE", "CONSENTED_TURNCOAT"]
CanaryStatus = Literal["ACTIVE", "PAUSED", "DECOMMISSIONED"]

class CanaryVPARegister(BaseModel):
    vpa: str = Field(..., description="Synthetic Canary VPA handle")
    designated_bank: str = Field(..., description="Bank identifier (e.g. ICIX)")
    canary_type: CanaryType = Field(default="REGULATORY_TRIPWIRE")
    purpose: str = Field(..., description="Operational reason or surrogate customer context")

class CanaryVPAResponse(BaseModel):
    canary_id: str
    vpa: str
    designated_bank: str
    canary_type: CanaryType
    status: CanaryStatus
    created_at: datetime
    hit_count: int
    synthetic_tag: bool = True
    purpose: str
