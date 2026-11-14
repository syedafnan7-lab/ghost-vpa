import pytest
from datetime import datetime, timezone, timedelta
from backend.app.graph.temporal_engine import TemporalGraphEngine
from backend.app.schemas.events import PaymentAttemptEvent

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
