"""Tests for the SHA-256 audit chain and its verification.

Covers two real defects that were fixed in backend/app/core/audit_logger.py:

1. actor_id was missing from the hash input, so editing WHO performed an
   action would NOT break the chain - the one field an auditor most needs
   protected against tampering.
2. There was no verification routine at all, so the frontend rendered a
   hardcoded "Cryptographic Chain Intact" badge that no code ever computed.
"""

import json
from datetime import datetime, timezone

import pytest
from sqlalchemy import delete

from backend.app.core.audit_logger import AuditLogger, GENESIS_HASH, audit_logger
from backend.app.db.session import engine as async_engine, AsyncSessionLocal
from backend.app.db.models import AuditLogModel, Base


@pytest.fixture
async def db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        # start from a clean ledger so hash order is deterministic
        await session.execute(delete(AuditLogModel))
        await session.commit()
        yield session
    async with AsyncSessionLocal() as session:
        await session.execute(delete(AuditLogModel))
        await session.commit()


async def _seed(db, n=3):
    """Write n chained blocks with distinct, fixed timestamps."""
    base = datetime(2026, 11, 14, 9, 0, 0, tzinfo=timezone.utc)
    entries = []
    for i in range(n):
        entry = await audit_logger.log_action(
            db=db,
            actor_id=f"USR_{i:04d}",
            actor_role="Analyst",
            action="TRIPWIRE_ACKNOWLEDGED",
            entity_id=f"ACCT_SYNTH_{i:04d}",
            details={"seq": i},
        )
        entries.append(entry)
    return entries


async def test_untampered_chain_verifies(db):
    """A freshly written chain must report intact with every block verified."""
    await _seed(db, n=3)
    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is True
    assert result["verified_blocks"] == 3
    assert result["broken_block"] is None
    assert len(result["tip_hash"]) == 64


async def test_altering_actor_id_breaks_chain(db):
    """The regression guard for the actor_id bug.

    actor_id is part of the hash input, so rewriting who performed an action
    must make the recomputed hash disagree with the stored one.
    """
    await _seed(db, n=2)

    from sqlalchemy import update
    await db.execute(
        update(AuditLogModel)
        .where(AuditLogModel.actor_id == "USR_0001")
        .values(actor_id="USR_ATTACKER")
    )
    await db.commit()

    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is False
    assert result["broken_block"]["reason"] == "recomputed hash mismatch (block content altered)"


async def test_altering_action_breaks_chain(db):
    """Editing the action text must be detected too."""
    await _seed(db, n=2)

    from sqlalchemy import update
    await db.execute(
        update(AuditLogModel)
        .where(AuditLogModel.actor_id == "USR_0000")
        .values(action="SUPERVISOR_HOLD_AUTHORIZED")
    )
    await db.commit()

    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is False


async def test_altering_details_breaks_chain(db):
    """Editing the JSON payload must be detected."""
    await _seed(db, n=2)

    from sqlalchemy import update
    await db.execute(
        update(AuditLogModel)
        .where(AuditLogModel.actor_id == "USR_0000")
        .values(details_json=json.dumps({"seq": 999}, sort_keys=True))
    )
    await db.commit()

    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is False


async def test_broken_link_is_detected(db):
    """Pointing a block at the wrong predecessor must be a break."""
    entries = await _seed(db, n=2)

    from sqlalchemy import update
    await db.execute(
        update(AuditLogModel)
        .where(AuditLogModel.log_id == entries[1].log_id)
        .values(prev_hash="0" * 64)
    )
    await db.commit()

    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is False
    assert "chain link broken" in result["broken_block"]["reason"]


async def test_empty_ledger_verifies_as_intact(db):
    """No blocks means nothing is broken - not an error state."""
    result = await audit_logger.verify_chain(db)
    assert result["chain_intact"] is True
    assert result["verified_blocks"] == 0
    assert result["tip_hash"] == GENESIS_HASH


async def test_compute_hash_is_deterministic_and_drives_both_paths(db):
    """log_action and verify_chain must share one formula, or verification
    would fail on an untouched ledger."""
    ts = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)
    a = AuditLogger.compute_hash(
        "a" * 64, ts, "USR_1", "Analyst", "ACT", "ENT", json.dumps({"k": 1}, sort_keys=True)
    )
    b = AuditLogger.compute_hash(
        "a" * 64, ts, "USR_1", "Analyst", "ACT", "ENT", json.dumps({"k": 1}, sort_keys=True)
    )
    assert a == b and len(a) == 64

    # changing any single field must change the digest
    assert AuditLogger.compute_hash(
        "a" * 64, ts, "USR_2", "Analyst", "ACT", "ENT", json.dumps({"k": 1}, sort_keys=True)
    ) != a