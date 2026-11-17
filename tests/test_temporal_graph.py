import pytest
from datetime import datetime, timezone, timedelta
from backend.app.graph.temporal_engine import TemporalGraphEngine
from backend.app.schemas.events import PaymentAttemptEvent

_PaymentAttemptEvent = PaymentAttemptEvent

def PaymentAttemptEvent(**kwargs):
    """Test helper defaults ordinary topology edges to settled credits."""
    kwargs.setdefault(
        "event_type",
        "PAYMENT_ATTEMPT" if kwargs.get("is_canary_hit", False) else "CREDIT_CONFIRMED",
    )
    return _PaymentAttemptEvent(**kwargs)

def test_temporal_graph_edge_addition_and_motifs():
    engine = TemporalGraphEngine(window_hours=72)
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)

    # 1. Simulate rapid fan-in to MULE_NODE
    mule_id = "ACCT_SYNTH_MULE_1"
    for i in range(4):
        remitter = f"ACCT_FEEDER_{i}"
        ev = PaymentAttemptEvent(
            event_id=f"TXN_IN_{i}",
            timestamp=now - timedelta(minutes=20 - i * 2),
            sender_account_id=remitter,
            sender_vpa=f"feeder{i}@bank",
            sender_bank="HDFX",
            beneficiary_account_id=mule_id,
            beneficiary_vpa="mule1@bank",
            beneficiary_bank="ICIX",
            amount_inr=10000.0,
            event_type="CREDIT_CONFIRMED",
            device_token=f"DEV_{i}",
            ip_subnet="10.0.0.0/24"
        )
        engine.add_transaction_edge(ev)

    # 2. Add outbound payment to a canary
    canary_hit = PaymentAttemptEvent(
        event_id="TXN_CANARY_OUT",
        timestamp=now - timedelta(minutes=5),
        sender_account_id=mule_id,
        sender_vpa="mule1@bank",
        sender_bank="ICIX",
        beneficiary_account_id=None,
        beneficiary_vpa="canary.trap.01@icixbank",
        beneficiary_bank="ICIX",
        amount_inr=39500.0,
        event_type="PAYMENT_ATTEMPT",
        is_canary_hit=True,
        device_token="DEV_MULE",
        ip_subnet="10.0.0.0/24"
    )
    engine.add_transaction_edge(canary_hit)

    # Detect motifs on mule_id
    motifs = engine.detect_motifs(mule_id, now)
    assert len(motifs) > 0
    motif_types = [m["type"] for m in motifs]
    assert "RAPID_FAN_IN_AGGREGATION" in motif_types

    # Compute CS-LP scores
    scores = engine.compute_cslp_scores(now)
    assert "canary.trap.01@icixbank" in scores
    assert scores["canary.trap.01@icixbank"] == 1.0
    # MULE_NODE should have received upstream propagated risk
    assert scores[mule_id] > 0.0

    # Ego subgraph bounded test
    ego = engine.get_ego_subgraph(mule_id, now, max_depth=2, max_nodes=50)
    assert ego.total_nodes >= 5
    assert ego.total_edges >= 5

def test_72_hour_temporal_sliding_window_pruning():
    engine = TemporalGraphEngine(window_hours=72)
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)

    # 1. Edge older than 72 hours (80 hours ago)
    ev_old = PaymentAttemptEvent(
        event_id="TXN_OLD_80H",
        timestamp=now - timedelta(hours=80),
        sender_account_id="ACCT_OLD_SENDER",
        sender_vpa="old.sender@bank",
        sender_bank="HDFX",
        beneficiary_account_id="ACCT_OLD_BENEF",
        beneficiary_vpa="old.benef@bank",
        beneficiary_bank="ICIX",
        amount_inr=5000.0,
        device_token="DEV_OLD",
        ip_subnet="10.0.0.0/24"
    )
    engine.add_transaction_edge(ev_old)

    # 2. Edge within 72 hours (20 hours ago)
    ev_recent = PaymentAttemptEvent(
        event_id="TXN_RECENT_20H",
        timestamp=now - timedelta(hours=20),
        sender_account_id="ACCT_RECENT_SENDER",
        sender_vpa="recent.sender@bank",
        sender_bank="HDFX",
        beneficiary_account_id="ACCT_RECENT_BENEF",
        beneficiary_vpa="recent.benef@bank",
        beneficiary_bank="ICIX",
        amount_inr=15000.0,
        device_token="DEV_RECENT",
        ip_subnet="10.0.0.0/24"
    )
    engine.add_transaction_edge(ev_recent)

    # Prune expired edges as of `now`
    pruned_count = engine.prune_expired_edges(now)
    assert pruned_count > 0

    # Old transaction edge should be pruned
    all_edge_keys = [k for _, _, k, _ in engine.graph.edges(keys=True, data=True)]
    assert "TXN_OLD_80H" not in all_edge_keys

    # Recent transaction edge must remain
    assert "TXN_RECENT_20H" in all_edge_keys
    assert "ACCT_RECENT_SENDER" in engine.graph
    assert "ACCT_RECENT_BENEF" in engine.graph

    # Isolated old nodes should be cleaned up
    assert "ACCT_OLD_SENDER" not in engine.graph
    assert "ACCT_OLD_BENEF" not in engine.graph

def test_ego_subgraph_sliding_window_filtering():
    engine = TemporalGraphEngine(window_hours=72)
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)
    focal = "ACCT_FOCAL_TEST"

    # Edge 1: 18 hours ago
    ev_18h = PaymentAttemptEvent(
        event_id="TXN_18H_AGO",
        timestamp=now - timedelta(hours=18),
        sender_account_id="FEEDER_18H",
        sender_vpa="feeder18@bank",
        sender_bank="HDFX",
        beneficiary_account_id=focal,
        beneficiary_vpa="focal@bank",
        beneficiary_bank="ICIX",
        amount_inr=20000.0,
        device_token="DEV_18H",
        ip_subnet="10.0.0.0/24"
    )
    engine.add_transaction_edge(ev_18h)

    # Edge 2: 2 hours ago
    ev_2h = PaymentAttemptEvent(
        event_id="TXN_2H_AGO",
        timestamp=now - timedelta(hours=2),
        sender_account_id="FEEDER_2H",
        sender_vpa="feeder2@bank",
        sender_bank="HDFX",
        beneficiary_account_id=focal,
        beneficiary_vpa="focal@bank",
        beneficiary_bank="ICIX",
        amount_inr=30000.0,
        device_token="DEV_2H",
        ip_subnet="10.0.0.0/24"
    )
    engine.add_transaction_edge(ev_2h)

    # 1. 12-hour window: should only contain the 2h transaction
    ego_12h = engine.get_ego_subgraph(focal, now, max_depth=2, max_nodes=50, window_hours=12)
    edge_sources_12h = [e.source for e in ego_12h.edges]
    assert "FEEDER_2H" in edge_sources_12h
    assert "FEEDER_18H" not in edge_sources_12h

    # 2. 24-hour window: should contain both 2h and 18h transactions
    ego_24h = engine.get_ego_subgraph(focal, now, max_depth=2, max_nodes=50, window_hours=24)
    edge_sources_24h = [e.source for e in ego_24h.edges]
    assert "FEEDER_2H" in edge_sources_24h
    assert "FEEDER_18H" in edge_sources_24h

def test_dynamic_case_deadlines():
    from backend.app.api.cases import compute_case_deadlines
    now = datetime(2026, 11, 20, 12, 0, 0, tzinfo=timezone.utc)

    # Case created today (0 days elapsed)
    sop_day, exp_left = compute_case_deadlines(now, now)
    assert sop_day == 1
    assert exp_left == 20

    # Case created 5 days ago
    created_5d = now - timedelta(days=5)
    sop_day, exp_left = compute_case_deadlines(created_5d, now)
    assert sop_day == 6
    assert exp_left == 15

    # Case created 22 days ago (explanation window expired)
    created_22d = now - timedelta(days=22)
    sop_day, exp_left = compute_case_deadlines(created_22d, now)
    assert sop_day == 23
    assert exp_left == 0

    # Case created 70 days ago (capped at statutory 60 days)
    created_70d = now - timedelta(days=70)
    sop_day, exp_left = compute_case_deadlines(created_70d, now)
    assert sop_day == 60
    assert exp_left == 0

def test_cslp_directional_separation_and_feeder_scoring():
    """Verifies that Directed Upstream Reverse Label Propagation (DU-RLP):
    1. Propagates risk strictly backwards from canary to mules and upstream feeders.
    2. Feeder account receives substantial risk score (feeder > 0.30).
    3. Innocent downstream beneficiaries (merchants, unwitting victims) score 0.0000.
    4. Achieves clean positive separation between suspects and innocent entities."""
    engine = TemporalGraphEngine()
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)

    # Feeder -> Mules
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_FEED_1", timestamp=now - timedelta(minutes=40),
        sender_account_id="FEEDER_SYNTH_007", sender_vpa="feeder@hdfxbank", sender_bank="HDFX",
        beneficiary_account_id="MULE_SYNTH_101", beneficiary_vpa="mule1@icixbank", beneficiary_bank="ICIX",
        amount_inr=50000.0, device_token="DEV_FEEDER", ip_subnet="10.0.0.0/24"
    ))
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_FEED_2", timestamp=now - timedelta(minutes=35),
        sender_account_id="FEEDER_SYNTH_007", sender_vpa="feeder@hdfxbank", sender_bank="HDFX",
        beneficiary_account_id="MULE_SYNTH_102", beneficiary_vpa="mule2@icixbank", beneficiary_bank="ICIX",
        amount_inr=45000.0, device_token="DEV_FEEDER", ip_subnet="10.0.0.0/24"
    ))

    # Mules -> Canary
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_CANARY_1", timestamp=now - timedelta(minutes=10),
        sender_account_id="MULE_SYNTH_101", sender_vpa="mule1@icixbank", sender_bank="ICIX",
        beneficiary_account_id=None, beneficiary_vpa="canary.trap.01@icixbank", beneficiary_bank="ICIX",
        amount_inr=40000.0, is_canary_hit=True, device_token="DEV_MULE_1", ip_subnet="10.0.0.0/24"
    ))
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_CANARY_2", timestamp=now - timedelta(minutes=8),
        sender_account_id="MULE_SYNTH_102", sender_vpa="mule2@icixbank", sender_bank="ICIX",
        beneficiary_account_id=None, beneficiary_vpa="canary.trap.01@icixbank", beneficiary_bank="ICIX",
        amount_inr=38000.0, is_canary_hit=True, device_token="DEV_MULE_2", ip_subnet="10.0.0.0/24"
    ))

    # Mule -> Innocent Merchant
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_INNOCENT_1", timestamp=now - timedelta(minutes=5),
        sender_account_id="MULE_SYNTH_101", sender_vpa="mule1@icixbank", sender_bank="ICIX",
        beneficiary_account_id="MERCHANT_SUPERMARKET", beneficiary_vpa="merchant@icixbank", beneficiary_bank="ICIX",
        amount_inr=2500.0, device_token="DEV_MULE_1", ip_subnet="10.0.0.0/24"
    ))

    scores = engine.compute_cslp_scores(now)

    # True positives: Mules and Feeder
    assert scores["FEEDER_SYNTH_007"] > 0.30
    assert scores["MULE_SYNTH_101"] > 0.35
    assert scores["MULE_SYNTH_102"] > 0.35

    # False positive risk: Innocent merchant must earn 0.0000
    assert scores.get("MERCHANT_SUPERMARKET", 0.0) == 0.0000

    # Separation metric: min(TP) - max(FP)
    tp_scores = [scores["FEEDER_SYNTH_007"], scores["MULE_SYNTH_101"], scores["MULE_SYNTH_102"]]
    fp_scores = [scores.get("MERCHANT_SUPERMARKET", 0.0)]
    separation = min(tp_scores) - max(fp_scores)
    assert separation >= 0.30

def test_case_network_attribution():
    """Verifies that attribute_case_network correctly extracts feeder,
    connected mules count, and deterministic cluster ID."""
    engine = TemporalGraphEngine()
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)

    # Feeder -> Mule 1 & Mule 2
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_1", timestamp=now - timedelta(minutes=20),
        sender_account_id="FEEDER_ROOT", sender_vpa="feeder@bank", sender_bank="HDFX",
        beneficiary_account_id="MULE_ALPHA", beneficiary_vpa="mule_a@bank", beneficiary_bank="ICIX",
        amount_inr=50000.0, device_token="DEV_F", ip_subnet="10.0.0.0/24"
    ))
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_2", timestamp=now - timedelta(minutes=18),
        sender_account_id="FEEDER_ROOT", sender_vpa="feeder@bank", sender_bank="HDFX",
        beneficiary_account_id="MULE_BETA", beneficiary_vpa="mule_b@bank", beneficiary_bank="ICIX",
        amount_inr=45000.0, device_token="DEV_F", ip_subnet="10.0.0.0/24"
    ))
    # Mule 1 hits canary
    engine.add_transaction_edge(PaymentAttemptEvent(
        event_id="TX_3", timestamp=now - timedelta(minutes=5),
        sender_account_id="MULE_ALPHA", sender_vpa="mule_a@bank", sender_bank="ICIX",
        beneficiary_account_id=None, beneficiary_vpa="canary.trap@bank", beneficiary_bank="ICIX",
        amount_inr=42000.0, is_canary_hit=True, device_token="DEV_MULE_SHARED", ip_subnet="10.0.0.0/24"
    ))

    attr = engine.attribute_case_network("MULE_ALPHA", now)
    assert attr["feeder_id"] == "FEEDER_ROOT"
    assert "FEEDER_ROOT" in attr["all_feeders"]
    assert "MULE_BETA" in attr["evidence"]["connected_mules"]
    assert attr["connected_mule_count"] >= 1
    assert attr["cluster_id"] is not None
    assert attr["cluster_id"].startswith("CLUST-SYN-")
