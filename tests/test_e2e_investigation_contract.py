from datetime import datetime, timedelta, timezone

from backend.app.graph.temporal_engine import TemporalGraphEngine
from backend.app.schemas.events import PaymentAttemptEvent


NOW = datetime(2026, 11, 14, 10, 0, tzinfo=timezone.utc)


def event(event_id, sender, beneficiary, *, event_type="CREDIT_CONFIRMED", minutes_ago=1,
          amount=1000.0, canary=False, original_event_id=None, device="DEV_SHARED"):
    return PaymentAttemptEvent(
        event_id=event_id,
        timestamp=NOW - timedelta(minutes=minutes_ago),
        sender_account_id=sender,
        sender_vpa=f"{sender.lower()}@synthetic.test",
        sender_bank="SYNTH",
        beneficiary_account_id=None if canary else beneficiary,
        beneficiary_vpa=beneficiary if canary else f"{beneficiary.lower()}@synthetic.test",
        beneficiary_bank="SYNTH",
        amount_inr=amount,
        event_type=event_type,
        original_event_id=original_event_id,
        device_token=device,
        ip_subnet="192.0.2.0/24",
        is_canary_hit=canary,
    )


def test_canary_seed_is_only_a_payment_attempt_and_all_lifecycle_events_keep_provenance():
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(event("credit-1", "FEEDER", "MULE"))
    engine.add_transaction_edge(event("canary-attempt", "MULE", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True))
    engine.add_transaction_edge(event("discovery", "LOOKER", "discovery@synthetic.test",
                                      event_type="IDENTIFIER_DISCOVERY", canary=True))
    engine.add_transaction_edge(event("validation", "CHECKER", "validation@synthetic.test",
                                      event_type="BENEFICIARY_VALIDATION", canary=True))
    engine.add_transaction_edge(event("declined", "DECLINER", "recipient",
                                      event_type="PAYMENT_DECLINED"))
    engine.add_transaction_edge(event("reverse", "FEEDER", "MULE",
                                      event_type="PAYMENT_REVERSED", original_event_id="credit-1"))

    assert engine.canary_nodes == {"canary@synthetic.test"}
    assert engine.graph["FEEDER"]["MULE"]["credit-1"]["is_reversed"] is True
    assert engine.graph["FEEDER"]["MULE"]["reverse"]["original_event_id"] == "credit-1"
    assert engine.graph["MULE"]["canary@synthetic.test"]["canary-attempt"]["is_tripwire"] is True
    assert engine.graph["LOOKER"]["discovery@synthetic.test"]["discovery"]["is_financial"] is False
    assert engine.graph["CHECKER"]["validation@synthetic.test"]["validation"]["event_type"] == "BENEFICIARY_VALIDATION"
    assert engine.graph["DECLINER"]["recipient"]["declined"]["is_financial"] is False
    assert engine.graph.number_of_edges("FEEDER", "MULE") == 2


def test_upstream_candidates_exclude_downstream_merchant_and_customer_stays_unattributed():
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(event("fund-101", "FEEDER_SYNTH_007", "MULE_SYNTH_101", amount=50000))
    engine.add_transaction_edge(event("fund-102", "FEEDER_SYNTH_007", "MULE_SYNTH_102", amount=48000))
    engine.add_transaction_edge(event("merchant", "MULE_SYNTH_101", "MERCHANT_SYNTH_900", amount=18000))
    engine.add_transaction_edge(event("hit-102", "MULE_SYNTH_102", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True))
    engine.add_transaction_edge(event("hit-101", "MULE_SYNTH_101", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True))
    engine.add_transaction_edge(event("customer-hit", "CUSTOMER_SYNTH_901", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True, device="DEV_CUSTOMER"))

    attribution = engine.attribute_case_network("MULE_SYNTH_101", NOW)
    assert attribution["feeder_id"] == "FEEDER_SYNTH_007"
    assert attribution["connected_mule_count"] == 1
    assert attribution["cluster_id"]
    assert "MERCHANT_SYNTH_900" not in attribution["all_feeders"]
    assert {"fund-101", "fund-102", "merchant", "hit-101", "hit-102"}.issubset(
        set(attribution["evidence"]["event_ids"])
    )

    customer = engine.attribute_case_network("CUSTOMER_SYNTH_901", NOW)
    assert customer["feeder_id"] is None
    assert customer["connected_mule_count"] == 0
    assert customer["cluster_id"] is None


def test_multiple_upstream_paths_and_cycles_terminate_with_stable_cluster():
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(event("f1-m", "FEEDER_A", "MULE", minutes_ago=5))
    engine.add_transaction_edge(event("f2-m", "FEEDER_B", "MULE", minutes_ago=4))
    engine.add_transaction_edge(event("cycle-a-b", "FEEDER_A", "FEEDER_B", minutes_ago=6))
    engine.add_transaction_edge(event("cycle-b-a", "FEEDER_B", "FEEDER_A", minutes_ago=6))
    engine.add_transaction_edge(event("hit", "MULE", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True))

    attribution = engine.attribute_case_network("MULE", NOW)
    assert set(attribution["all_feeders"]) == {"FEEDER_A", "FEEDER_B"}
    assert attribution["feeder_id"] in {"FEEDER_A", "FEEDER_B"}
    assert attribution["cluster_id"]
    assert engine.attribute_case_network("MULE", NOW)["cluster_id"] == attribution["cluster_id"]


def test_shared_device_alone_does_not_create_cluster_or_sibling_count():
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(event("a-device", "ACCOUNT_A", "MERCHANT_A", device="DEVICE_SAME"))
    engine.add_transaction_edge(event("b-device", "ACCOUNT_B", "MERCHANT_B", device="DEVICE_SAME"))

    attribution = engine.attribute_case_network("ACCOUNT_A", NOW)
    assert attribution["cluster_id"] is None
    assert attribution["connected_mule_count"] == 0
    assert attribution["evidence"]["shared_devices"]


def test_future_credit_is_not_used_for_attribution_or_ego_graph():
    engine = TemporalGraphEngine()
    engine.add_transaction_edge(event("future-funding", "FUTURE_FEEDER", "MULE",
                                      minutes_ago=-2, device="DEV_FUTURE"))
    engine.add_transaction_edge(event("hit", "MULE", "canary@synthetic.test",
                                      event_type="PAYMENT_ATTEMPT", canary=True, minutes_ago=1))

    attribution = engine.attribute_case_network("MULE", NOW)
    ego = engine.get_ego_subgraph("MULE", NOW, max_depth=2)
    assert attribution["feeder_id"] is None
    assert "FUTURE_FEEDER" not in {node.id for node in ego.nodes}
