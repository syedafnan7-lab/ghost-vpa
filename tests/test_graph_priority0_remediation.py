import math
from datetime import datetime, timezone, timedelta
import pytest
from backend.app.graph.temporal_engine import TemporalGraphEngine
from backend.app.schemas.events import PaymentAttemptEvent

T0 = datetime(2026, 11, 1, 10, 0, tzinfo=timezone.utc)

def make_event(
    event_id: str,
    sender: str,
    beneficiary: str,
    amount: float = 1000.0,
    timestamp: datetime = None,
    is_canary: bool = False,
    event_type: str = None,
    device_token: str = "DEV_TOK_DEFAULT",
    original_event_id: str = None
) -> PaymentAttemptEvent:
    return PaymentAttemptEvent(
        event_id=event_id,
        timestamp=timestamp or T0,
        sender_account_id=sender,
        sender_vpa=f"{sender.lower()}@bank",
        sender_bank="HDFX",
        beneficiary_account_id=None if is_canary else beneficiary,
        beneficiary_vpa=beneficiary if is_canary else f"{beneficiary.lower()}@bank",
        beneficiary_bank="ICIX",
        amount_inr=amount,
        payment_rail="UPI",
        attempt_type="P2P",
        event_type=event_type or ("PAYMENT_ATTEMPT" if is_canary else "CREDIT_CONFIRMED"),
        original_event_id=original_event_id,
        device_token=device_token,
        ip_subnet="192.168.1.0/24",
        is_canary_hit=is_canary,
        simulated_result="TRIPWIRE_TRIGGERED" if is_canary else "SETTLED_NORMAL",
        zero_funds_transferred=is_canary
    )


# ---------------------------------------------------------------------------
# Test 1: FEEDER -> MULE -> CANARY
# ---------------------------------------------------------------------------
def test_scenario_1_feeder_mule_canary():
    """FEEDER -> MULE -> CANARY:
    Feeder and Mule receive positive suspicion; Feeder is identified as upstream root."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_01", "MULE_01", 50000.0, T0))
    engine.add_transaction_edge(make_event("E2", "MULE_01", "canary.trap@bank", 50000.0, T0 + timedelta(minutes=5), is_canary=True, event_type="PAYMENT_ATTEMPT"))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=10))
    assert scores["canary.trap@bank"] == 1.0
    assert scores["MULE_01"] > 0.30
    assert scores["FEEDER_01"] > 0.20

    attr = engine.attribute_case_network("MULE_01", T0 + timedelta(minutes=10))
    assert attr["feeder_id"] == "FEEDER_01"
    assert attr["cluster_id"] is not None


# ---------------------------------------------------------------------------
# Test 2: Two Feeders Funding One Mule
# ---------------------------------------------------------------------------
def test_scenario_2_two_feeders_one_mule():
    """Two Feeders funding one mule:
    Both feeders receive risk when mule hits canary. Primary feeder ranked by volume."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_ALPHA", "MULE_SHARED", 60000.0, T0))
    engine.add_transaction_edge(make_event("E2", "FEEDER_BETA", "MULE_SHARED", 20000.0, T0 + timedelta(minutes=2)))
    engine.add_transaction_edge(make_event("E3", "MULE_SHARED", "canary.trap@bank", 80000.0, T0 + timedelta(minutes=10), is_canary=True))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=15))
    assert scores["FEEDER_ALPHA"] > 0.20
    assert scores["FEEDER_BETA"] > 0.20

    attr = engine.attribute_case_network("MULE_SHARED", T0 + timedelta(minutes=15))
    assert "FEEDER_ALPHA" in attr["all_feeders"]
    assert "FEEDER_BETA" in attr["all_feeders"]
    assert attr["feeder_id"] == "FEEDER_ALPHA"  # Highest volume funder


# ---------------------------------------------------------------------------
# Test 3: One Feeder Funding Multiple Mules
# ---------------------------------------------------------------------------
def test_scenario_3_one_feeder_multiple_mules():
    """One feeder funding multiple mules:
    Feeder receives reinforced risk and structural feeder boost."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_MASTER", "MULE_A", 40000.0, T0))
    engine.add_transaction_edge(make_event("E2", "FEEDER_MASTER", "MULE_B", 40000.0, T0 + timedelta(minutes=2)))
    engine.add_transaction_edge(make_event("E3", "MULE_A", "canary.trap@bank", 35000.0, T0 + timedelta(minutes=10), is_canary=True))
    engine.add_transaction_edge(make_event("E4", "MULE_B", "canary.trap@bank", 35000.0, T0 + timedelta(minutes=12), is_canary=True))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=20))
    assert scores["FEEDER_MASTER"] > scores["MULE_A"] * 0.80

    attr_a = engine.attribute_case_network("MULE_A", T0 + timedelta(minutes=20))
    assert attr_a["feeder_id"] == "FEEDER_MASTER"
    assert "MULE_B" in attr_a["evidence"]["connected_mules"]
    assert attr_a["connected_mule_count"] >= 1


# ---------------------------------------------------------------------------
# Test 4: Mule Paying an Innocent Merchant
# ---------------------------------------------------------------------------
def test_scenario_4_mule_pays_innocent_merchant():
    """Mule paying an innocent merchant:
    Merchant received funds from mule, but never sent money to suspects.
    Merchant score MUST be 0.0000."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_X", "MULE_X", 30000.0, T0))
    engine.add_transaction_edge(make_event("E2", "MULE_X", "canary.trap@bank", 25000.0, T0 + timedelta(minutes=5), is_canary=True))
    engine.add_transaction_edge(make_event("E3", "MULE_X", "INNOCENT_GROCERY_STORE", 5000.0, T0 + timedelta(minutes=7)))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=15))
    assert scores["MULE_X"] > 0.30
    assert scores["FEEDER_X"] > 0.20
    assert scores.get("INNOCENT_GROCERY_STORE", 0.0) == 0.0000  # Strict zero-score invariant


# ---------------------------------------------------------------------------
# Test 5: Innocent Customer Accidentally Paying a Canary
# ---------------------------------------------------------------------------
def test_scenario_5_innocent_customer_accidental_canary():
    """Innocent customer makes an isolated mistaken transfer to a canary:
    Direct interaction is recorded, but network attribution shows NO upstream feeder,
    NO connected mules, and NO syndicate cluster."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "INNOCENT_RETAIL_USER", "canary.trap@bank", 150.0, T0, is_canary=True))

    attr = engine.attribute_case_network("INNOCENT_RETAIL_USER", T0 + timedelta(minutes=5))
    assert attr["feeder_id"] is None
    assert attr["connected_mule_count"] == 0
    assert attr["cluster_id"] is None
    assert attr["evidence"]["direct_canary_hit"] is True


# ---------------------------------------------------------------------------
# Test 6: Benign Canary Interaction
# ---------------------------------------------------------------------------
def test_scenario_6_benign_lookup_and_payment():
    """Benign lookup without money movement:
    BENEFICIARY_VALIDATION does not create a financial flow edge."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(
        make_event("E_VAL", "USER_LOOKUP", "canary.trap@bank", 0.0, T0, is_canary=True, event_type="BENEFICIARY_VALIDATION")
    )
    # The canary node exists, but no payment edges exist between USER_LOOKUP and canary
    assert "USER_LOOKUP" in engine.graph
    assert "canary.trap@bank" in engine.graph
    payment_edges = [
        (u, v) for u, v, d in engine.graph.edges(data=True)
        if not v.startswith("DEV_") and d.get("amount_inr", 0.0) > 0
    ]
    assert len(payment_edges) == 0


def test_payment_attempt_is_not_counted_as_transferred_funds():
    engine = TemporalGraphEngine()
    attempt = make_event(
        "ATTEMPT_ONLY", "SENDER", "BENEFICIARY", 900.0,
        event_type="PAYMENT_ATTEMPT",
    )
    engine.add_transaction_edge(attempt)
    attempt_data = engine.graph.get_edge_data("SENDER", "BENEFICIARY")["ATTEMPT_ONLY"]
    assert attempt_data["is_financial"] is False
    assert attempt_data["amount_inr"] == 0.0
    assert attempt_data["attempted_amount_inr"] == 900.0

    confirmed = make_event(
        "CREDIT_ONLY", "SENDER", "BENEFICIARY", 900.0,
        event_type="CREDIT_CONFIRMED",
    )
    engine.add_transaction_edge(confirmed)
    confirmed_data = engine.graph.get_edge_data("SENDER", "BENEFICIARY")["CREDIT_ONLY"]
    assert confirmed_data["is_financial"] is True
    assert confirmed_data["amount_inr"] == 900.0


def test_case_attribution_ignores_future_funding_edges():
    engine = TemporalGraphEngine()
    now = T0 + timedelta(hours=2)
    engine.add_transaction_edge(make_event(
        "FUTURE_FUND", "FUTURE_FEEDER", "MULE", 5000.0,
        now + timedelta(minutes=5),
    ))
    engine.add_transaction_edge(make_event(
        "CANARY_NOW", "MULE", "canary.trap@bank", 5000.0,
        now, is_canary=True,
    ))

    attribution = engine.attribute_case_network("MULE", now)
    assert attribution["feeder_id"] is None
    assert attribution["cluster_id"] is None


# ---------------------------------------------------------------------------
# Test 7: Multi-Hop Propagation
# ---------------------------------------------------------------------------
def test_scenario_7_multihop_layering_chain():
    """FEEDER -> HOP1 -> HOP2 -> HOP3 -> CANARY:
    Risk propagates all the way back to FEEDER across 4 hops."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_ROOT", "HOP1", 80000.0, T0))
    engine.add_transaction_edge(make_event("E2", "HOP1", "HOP2", 78000.0, T0 + timedelta(minutes=5)))
    engine.add_transaction_edge(make_event("E3", "HOP2", "HOP3", 76000.0, T0 + timedelta(minutes=10)))
    engine.add_transaction_edge(make_event("E4", "HOP3", "canary.trap@bank", 75000.0, T0 + timedelta(minutes=15), is_canary=True))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=25))
    assert scores["HOP3"] > 0.35
    assert scores["HOP2"] > 0.25
    assert scores["HOP1"] > 0.15
    assert scores["FEEDER_ROOT"] > 0.10


# ---------------------------------------------------------------------------
# Test 8: Graph Cycles Handling
# ---------------------------------------------------------------------------
def test_scenario_8_graph_cycles():
    """A -> B -> C -> A with C -> CANARY:
    Algorithm terminates cleanly without infinite recursion or score overflow."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "NODE_A", "NODE_B", 10000.0, T0))
    engine.add_transaction_edge(make_event("E2", "NODE_B", "NODE_C", 10000.0, T0 + timedelta(minutes=2)))
    engine.add_transaction_edge(make_event("E3", "NODE_C", "NODE_A", 5000.0, T0 + timedelta(minutes=4)))
    engine.add_transaction_edge(make_event("E4", "NODE_C", "canary.trap@bank", 5000.0, T0 + timedelta(minutes=6), is_canary=True))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=15))
    for score in scores.values():
        assert 0.0 <= score <= 1.0  # Mathematically bounded contract


# ---------------------------------------------------------------------------
# Test 9: Multiple Payment Paths
# ---------------------------------------------------------------------------
def test_scenario_9_multiple_payment_paths():
    """FEEDER funds MULE via two distinct paths:
    Path 1: FEEDER -> MULE (direct)
    Path 2: FEEDER -> INTERMEDIARY -> MULE
    MULE -> CANARY
    Both paths reinforce feeder attribution."""
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(make_event("E1", "FEEDER_MULTI", "MULE_TARGET", 20000.0, T0))
    engine.add_transaction_edge(make_event("E2", "FEEDER_MULTI", "INTERMEDIARY", 25000.0, T0 + timedelta(minutes=1)))
    engine.add_transaction_edge(make_event("E3", "INTERMEDIARY", "MULE_TARGET", 24000.0, T0 + timedelta(minutes=3)))
    engine.add_transaction_edge(make_event("E4", "MULE_TARGET", "canary.trap@bank", 40000.0, T0 + timedelta(minutes=6), is_canary=True))

    scores = engine.compute_cslp_scores(T0 + timedelta(minutes=12))
    assert scores["FEEDER_MULTI"] > 0.25

    attr = engine.attribute_case_network("MULE_TARGET", T0 + timedelta(minutes=12))
    assert attr["feeder_id"] == "FEEDER_MULTI"


# ---------------------------------------------------------------------------
# Test 10: Incorrect Chronological Ordering
# ---------------------------------------------------------------------------
def test_scenario_10_chronological_ordering():
    """Transaction from FEEDER -> MULE occurs AFTER the canary hit:
    A payment that occurred in the future cannot have funded the canary tripwire."""
    engine = TemporalGraphEngine()
    # Canary hit happens at T0
    engine.add_transaction_edge(make_event("E1", "MULE_CHRONO", "canary.trap@bank", 5000.0, T0, is_canary=True))
    # Feeder pays mule 5 hours later
    engine.add_transaction_edge(make_event("E2", "LATE_SENDER", "MULE_CHRONO", 50000.0, T0 + timedelta(hours=5)))

    # When evaluated at T0 + 10 mins (canary hit time):
    scores_at_tripwire = engine.compute_cslp_scores(T0 + timedelta(minutes=10))
    assert scores_at_tripwire["MULE_CHRONO"] > 0.35
    assert scores_at_tripwire.get("LATE_SENDER", 0.0) == 0.0000


# ---------------------------------------------------------------------------
# Test 11: Missing Historical Transactions (Truncated Window)
# ---------------------------------------------------------------------------
def test_scenario_11_missing_historical_transactions():
    """Feeder transfer occurred outside the 72-hour window and was pruned:
    Mule still scores on canary hit, but feeder is cleanly unattributed without crashing."""
    engine = TemporalGraphEngine(window_hours=72)
    # Feeder transfer 100 hours ago
    engine.add_transaction_edge(make_event("E_OLD", "OLD_FEEDER", "MULE_PERSIST", 50000.0, T0 - timedelta(hours=100)))
    # Mule canary hit at T0
    engine.add_transaction_edge(make_event("E_NOW", "MULE_PERSIST", "canary.trap@bank", 50000.0, T0, is_canary=True))

    # Old edge should be pruned
    scores = engine.compute_cslp_scores(T0)
    assert scores["MULE_PERSIST"] > 0.35
    assert "OLD_FEEDER" not in scores or scores["OLD_FEEDER"] == 0.0

    attr = engine.attribute_case_network("MULE_PERSIST", T0)
    assert attr["feeder_id"] is None
    assert attr["cluster_id"] is None


# ---------------------------------------------------------------------------
# Test 12: Repeated Event Delivery (Idempotence)
# ---------------------------------------------------------------------------
def test_scenario_12_repeated_event_delivery():
    """The same event delivered twice:
    Multigraph does not double-count duplicate event_ids."""
    engine = TemporalGraphEngine()
    ev = make_event("EVENT_DUP_01", "SENDER_DUP", "canary.trap@bank", 5000.0, T0, is_canary=True)
    engine.add_transaction_edge(ev)

    # Deliver exact same event ID again
    engine.add_transaction_edge(ev)

    # Key is unique per event_id; degree should not explode
    out_edges = list(engine.graph.out_edges("SENDER_DUP", keys=True))
    # One payment edge + one device edge
    payment_edges = [e for e in out_edges if not e[1].startswith("DEV_")]
    assert len(payment_edges) == 1
