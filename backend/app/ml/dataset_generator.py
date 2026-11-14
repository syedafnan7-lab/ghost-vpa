import random
import numpy as np
import pandas as pd
from typing import Tuple

def generate_synthetic_100k_network(seed: int = 42, num_nodes: int = 100000, num_events: int = 25000) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generates a synthetic domestic payment network:
    - 100,000 entities (retail, merchants, mules, canaries)
    - Realistic power-law transaction distribution with interspersed syndicate layering rings and canary tripwires."""
    random.seed(seed)
    np.random.seed(seed)

    banks = ["HDFX", "ICIX", "SBINX", "AXSX"]
    node_types = ["RETAIL"] * 85000 + ["MERCHANT"] * 10000 + ["MULE"] * 4950 + ["CANARY"] * 50
    node_ids = [f"ACCT_{i:06d}" for i in range(num_nodes - 50)] + [f"CANARY_VPA_{i:02d}" for i in range(50)]

    nodes_df = pd.DataFrame({
        "node_id": node_ids,
        "node_type": node_types,
        "bank": [random.choice(banks) for _ in range(num_nodes)],
        "account_age_days": np.random.randint(30, 2000, size=num_nodes)
    })

    mule_nodes = node_ids[95000:99950]
    canary_nodes = node_ids[99950:]
    events = []

    # Interleave benign and syndicate events across time
    for i in range(num_events):
        is_mule_event = 1 if (random.random() < 0.15) else 0

        if is_mule_event:
            mule_u = random.choice(mule_nodes)
            target = random.choice(canary_nodes) if random.random() < 0.30 else random.choice(mule_nodes)
            amt = round(float(random.choice([12000, 28000, 48000, 75000, 95000, 1.0])), 2)
            is_canary = 1 if "CANARY" in target else 0

            events.append({
                "event_id": f"TX_MULE_{i}",
                "sender_id": mule_u,
                "target_id": target,
                "amount_inr": amt,
                "hour_of_day": random.choice([0, 1, 2, 3, 14, 22, 23]),
                "is_weekend": random.choice([0, 1]),
                "historical_tx_count_24h": random.randint(15, 60),
                "avg_amount_72h": amt * random.uniform(0.9, 1.1),
                "velocity_delta_sec": random.randint(15, 300),
                "is_canary_hit": is_canary,
                "canary_hop_distance": 1 if is_canary else random.choice([1, 2]),
                "fan_in_ratio_60m": random.uniform(0.7, 1.0),
                "fan_out_ratio_60m": random.uniform(0.75, 1.0),
                "amount_conservation_ratio": random.uniform(0.88, 1.02),
                "shared_device_mule_count": random.randint(2, 6),
                "cs_lp_risk_score": random.uniform(0.75, 1.0),
                "is_mule_label": 1
            })
        else:
            u = random.choice(node_ids[:95000])
            v = random.choice(node_ids[:95000])
            amt = round(float(np.random.exponential(scale=2200) + 50), 2)
            events.append({
                "event_id": f"TX_BENIGN_{i}",
                "sender_id": u,
                "target_id": v,
                "amount_inr": amt,
                "hour_of_day": random.randint(6, 23),
                "is_weekend": random.choice([0, 1]),
                "historical_tx_count_24h": random.randint(1, 10),
                "avg_amount_72h": amt * random.uniform(0.8, 1.2),
                "velocity_delta_sec": random.randint(1200, 86400),
                "is_canary_hit": 0,
                "canary_hop_distance": -1,
                "fan_in_ratio_60m": random.uniform(0.05, 0.25),
                "fan_out_ratio_60m": random.uniform(0.05, 0.25),
                "amount_conservation_ratio": random.uniform(0.1, 0.4),
                "shared_device_mule_count": 0,
                "cs_lp_risk_score": 0.0,
                "is_mule_label": 0
            })

    events_df = pd.DataFrame(events)
    return nodes_df, events_df
