import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.db.models import AuditLogModel
from backend.app.schemas.audit import AuditLogEntry

router = APIRouter(prefix="/api/v1/audit", tags=["Security & Audit Logs"])

@router.get("", response_model=List[AuditLogEntry])
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(100)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return [
        AuditLogEntry(
            log_id=l.log_id,
            timestamp=l.timestamp,
            actor_id=l.actor_id,
            actor_role=l.actor_role,
            action=l.action,
            entity_id=l.entity_id,
            details=json.loads(l.details_json or "{}"),
            prev_hash=l.prev_hash,
            current_hash=l.current_hash
        )
        for l in logs
    ]
