from datetime import datetime
from typing import Dict, Any, Literal
from pydantic import BaseModel, Field

class AuditLogEntry(BaseModel):
    log_id: str
    timestamp: datetime
    actor_id: str
    actor_role: Literal["Analyst", "Supervisor", "Auditor", "SYSTEM"]
    action: str
    entity_id: str
    details: Dict[str, Any]
    prev_hash: str
    current_hash: str
