import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from backend.app.db.session import Base

class CanaryModel(Base):
    __tablename__ = "canary_registry"

    canary_id = Column(String(64), primary_key=True, index=True)
    vpa = Column(String(128), unique=True, index=True, nullable=False)
    designated_bank = Column(String(16), nullable=False)
    canary_type = Column(String(32), default="REGULATORY_TRIPWIRE")
    status = Column(String(32), default="ACTIVE", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    hit_count = Column(Integer, default=0)
    synthetic_tag = Column(Boolean, default=True)
    purpose = Column(String(256), nullable=False)

class PaymentEventModel(Base):
    __tablename__ = "payment_events"

    event_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    sender_account_id = Column(String(64), index=True, nullable=False)
    sender_vpa = Column(String(128), nullable=False)
    sender_bank = Column(String(16), nullable=False)
    beneficiary_account_id = Column(String(64), nullable=True)
    beneficiary_vpa = Column(String(128), index=True, nullable=False)
    beneficiary_bank = Column(String(16), nullable=False)
    amount_inr = Column(Float, nullable=False)
    payment_rail = Column(String(16), default="UPI")
    attempt_type = Column(String(32), default="P2P")
    device_token = Column(String(64), index=True, nullable=False)
    ip_subnet = Column(String(32), nullable=False)
    is_canary_hit = Column(Boolean, default=False, index=True)
    simulated_result = Column(String(32), default="SETTLED_NORMAL")
    zero_funds_transferred = Column(Boolean, default=False)

class AlertModel(Base):
    __tablename__ = "canary_alerts"

    alert_id = Column(String(64), primary_key=True, index=True)
    event_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    canary_id = Column(String(64), index=True, nullable=False)
    canary_vpa = Column(String(128), nullable=False)
    sender_account_id = Column(String(64), index=True, nullable=False)
    sender_vpa = Column(String(128), nullable=False)
    sender_bank = Column(String(16), nullable=False)
    amount_inr = Column(Float, nullable=False)
    device_token = Column(String(64), nullable=False)
    risk_level = Column(String(16), default="CRITICAL")
    status = Column(String(32), default="NEW", index=True)
    detection_latency_ms = Column(Float, default=0.0)
    zero_funds_verified = Column(Boolean, default=True)
    context_metadata = Column(Text, default="{}")

class CaseModel(Base):
    __tablename__ = "investigation_cases"

    case_id = Column(String(64), primary_key=True, index=True)
    target_account_id = Column(String(64), index=True, nullable=False)
    target_vpa = Column(String(128), nullable=False)
    target_bank = Column(String(16), nullable=False)
    originating_alert_id = Column(String(64), nullable=False)
    case_status = Column(String(32), default="OPEN_TRIAGE", index=True)
    sop_day_counter = Column(Integer, default=1)
    explanation_days_left = Column(Integer, default=20)
    assigned_analyst = Column(String(64), default="analyst_sharma")
    cluster_id = Column(String(64), nullable=True)
    connected_mule_count = Column(Integer, default=0)
    upstream_feeder_account = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    analyst_notes_json = Column(Text, default="[]")
    audit_hash = Column(String(64), nullable=False)
    fiu_str_narrative = Column(Text, default="")
    ncrp_payload_json = Column(Text, default="{}")

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    actor_id = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    details_json = Column(Text, default="{}")
    prev_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False)
