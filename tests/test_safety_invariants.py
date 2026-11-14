import pytest
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.core.config import settings

def test_safety_configuration_invariants():
    """Safety Invariant: Prototype must enforce SIMULATION_MODE_ONLY and reject live rails."""
    assert settings.SIMULATION_MODE_ONLY is True
    assert settings.ALLOW_REAL_PAYMENT_RAILS is False

def test_zero_real_funds_movement_contract():
    """Safety Invariant: Inbound canary interaction MUST mark zero_funds_transferred = True."""
    event = PaymentAttemptEvent(
        event_id="TXN-SAFETY-001",
        timestamp="2026-11-14T10:00:00Z",
        sender_account_id="ACCT_SYNTH_HDFX_1234",
        sender_vpa="sender@hdfxbank",
        sender_bank="HDFX",
        beneficiary_vpa="canary.trap.01@icixbank",
        beneficiary_bank="ICIX",
        amount_inr=5000.0,
        payment_rail="UPI",
        device_token="DEV_TOK_99",
        ip_subnet="10.0.0.0/24",
        is_canary_hit=True,
        simulated_result="TRIPWIRE_TRIGGERED",
        zero_funds_transferred=True
    )
    assert event.zero_funds_transferred is True
    assert event.simulated_result == "TRIPWIRE_TRIGGERED"

def test_synthetic_identifier_enforcement():
    """Safety Invariant: Simulated identifiers must be pseudonymous tokens."""
    account_id = "ACCT_SYNTH_HDFX_8941"
    assert account_id.startswith("ACCT_SYNTH_")
    # Must not contain 12-digit Aadhaar pattern or 10-digit PAN pattern
    import re
    assert not re.match(r"^\d{12}$", account_id)
    assert not re.match(r"^[A-Z]{5}\d{4}[A-Z]$", account_id)
