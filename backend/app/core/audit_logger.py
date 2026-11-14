import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.models import AuditLogModel
from backend.app.schemas.audit import AuditLogEntry

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditLogger:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        actor_id: str,
        actor_role: str,
        action: str,
        entity_id: str,
        details: Dict[str, Any]
    ) -> AuditLogEntry:
        # Fetch latest audit log for previous hash
        stmt = select(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(1)
        result = await db.execute(stmt)
        last_log = result.scalars().first()

        prev_hash = last_log.current_hash if last_log else GENESIS_HASH
        log_id = f"AUD-{uuid.uuid4().hex[:12].upper()}"
        ts = datetime.now(timezone.utc)
        details_json = json.dumps(details, sort_keys=True)

        # Hash computation
        hash_input = f"{prev_hash}|{ts.isoformat()}|{actor_role}|{action}|{entity_id}|{details_json}".encode("utf-8")
        current_hash = hashlib.sha256(hash_input).hexdigest()

        db_entry = AuditLogModel(
            log_id=log_id,
            timestamp=ts,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            entity_id=entity_id,
            details_json=details_json,
            prev_hash=prev_hash,
            current_hash=current_hash
        )
        db.add(db_entry)
        await db.commit()
        await db.refresh(db_entry)

        return AuditLogEntry(
            log_id=log_id,
            timestamp=ts,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            entity_id=entity_id,
            details=details,
            prev_hash=prev_hash,
            current_hash=current_hash
        )

audit_logger = AuditLogger()
