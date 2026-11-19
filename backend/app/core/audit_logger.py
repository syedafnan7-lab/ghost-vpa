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
        details: Dict[str, Any],
        commit: bool = True
    ) -> AuditLogEntry:
        # Fetch latest audit log for previous hash
        stmt = select(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(1)
        result = await db.execute(stmt)
        last_log = result.scalars().first()
        pending_logs = [
            obj for obj in (*db.new, *db.dirty)
            if isinstance(obj, AuditLogModel)
        ]
        if pending_logs:
            pending_last = max(pending_logs, key=lambda entry: entry.timestamp)
            if last_log is None or pending_last.timestamp > last_log.timestamp:
                last_log = pending_last

        prev_hash = last_log.current_hash if last_log else GENESIS_HASH
        log_id = f"AUD-{uuid.uuid4().hex[:12].upper()}"
        ts = datetime.now(timezone.utc)
        details_json = json.dumps(details, sort_keys=True)

        # actor_id is part of the hash input: the chain must break if WHO
        # performed an action is altered, not only what was done.
        current_hash = AuditLogger.compute_hash(
            prev_hash, ts, actor_id, actor_role, action, entity_id, details_json
        )

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
        if commit:
            await db.commit()
            await db.refresh(db_entry)
        else:
            await db.flush()

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

    @staticmethod
    def canonical_timestamp(timestamp: datetime) -> str:
        """Canonical UTC timestamp string for hashing.

        The database stores DateTime without tzinfo: an aware
        datetime.now(timezone.utc) written by log_action() comes back out of
        SQLite naive. Feeding isoformat() straight into the hash made the
        write-time string ("...+00:00") differ from the read-time string, so
        EVERY block failed verification - including a completely untouched
        ledger, which is the one failure an audit chain must never produce.
        Normalising both sides to a naive-UTC string makes write and verify
        agree."""
        ts = timestamp
        if ts.tzinfo is not None:
            ts = ts.astimezone(timezone.utc)
        return ts.replace(tzinfo=None).isoformat()

    @staticmethod
    def compute_hash(prev_hash: str, timestamp: datetime, actor_id: str,
                     actor_role: str, action: str, entity_id: str,
                     details_json: str) -> str:
        """Recompute a block hash from its parts. Single source of truth for
        the chain formula: log_action() and verify_chain() both go through this,
        so the two can never drift apart."""
        hash_input = (
            f"{prev_hash}|{AuditLogger.canonical_timestamp(timestamp)}|{actor_id}|{actor_role}"
            f"|{action}|{entity_id}|{details_json}"
        ).encode("utf-8")
        return hashlib.sha256(hash_input).hexdigest()

    @staticmethod
    async def verify_chain(db: AsyncSession, limit: int = 500) -> Dict[str, Any]:
        """Walk the ledger oldest-to-newest and recompute every block hash.

        Returns whether the chain is intact, plus the first broken block so a
        caller can point at the tamper point rather than just claim "verified".
        A missing prev_hash link (a gap or a reordered block) is a break too.
        """
        stmt = select(AuditLogModel).order_by(AuditLogModel.timestamp.asc()).limit(limit)
        result = await db.execute(stmt)
        rows = list(result.scalars().all())

        expected_prev = GENESIS_HASH
        for row in rows:
            if row.prev_hash != expected_prev:
                return {
                    "chain_intact": False,
                    "verified_blocks": len(rows),
                    "broken_block": {
                        "log_id": row.log_id,
                        "reason": "prev_hash mismatch (chain link broken)",
                        "expected": expected_prev,
                        "actual": row.prev_hash,
                    },
                }
            details_json = row.details_json if isinstance(row.details_json, str) \
                else json.dumps(row.details_json or {}, sort_keys=True)
            recomputed = AuditLogger.compute_hash(
                row.prev_hash, row.timestamp, row.actor_id, row.actor_role,
                row.action, row.entity_id, details_json
            )
            if recomputed != row.current_hash:
                return {
                    "chain_intact": False,
                    "verified_blocks": len(rows),
                    "broken_block": {
                        "log_id": row.log_id,
                        "reason": "recomputed hash mismatch (block content altered)",
                        "expected": recomputed,
                        "actual": row.current_hash,
                    },
                }
            expected_prev = row.current_hash

        return {
            "chain_intact": True,
            "verified_blocks": len(rows),
            "broken_block": None,
            "tip_hash": rows[-1].current_hash if rows else GENESIS_HASH,
        }

audit_logger = AuditLogger()
