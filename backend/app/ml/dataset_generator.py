import random
import numpy as np
import pandas as pd
from typing import Tuple

def generate_synthetic_100k_network(seed: int = 42, num_nodes: int = 100000, num_events: int = 25000) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generates a synthetic domestic payment network:
    - 100,000 entities: 85,000 retail, 10,000 MSME/merchants, 4,950 mules, 50 canaries.
    - Realistic, overlapping transaction distributions without artificial single-feature oracle leakage.
    - Includes legitimate merchants, payroll bursts, unwitting intermediaries, and organized mule syndicates."""
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

    retail_nodes = node_ids[:85000]
    merchant_nodes = node_ids[85000:95000]
    mule_nodes = node_ids[95000:99950]
    canary_nodes = node_ids[99950:]

    events = []

    for i in range(num_events):
        p = random.random()

        # 1. Syndicate Mule Event (~15%)
        if p < 0.15:
            mule_type = random.random()
            mule_u = random.choice(mule_nodes)
            amt = round(float(np.clip(np.random.lognormal(mean=9.1, sigma=0.9), 200, 100000)), 2)
            hour = random.choices(list(range(24)), weights=[4,3,3,2,1,1,2,3,4,5,5,5,5,5,6,6,6,6,6,5,5,4,4,4])[0]

            # Subtype A: Organised Syndicate Rapid Split / Layer (65%)
            if mule_type < 0.65:
                touch_canary = random.random() < 0.30
                target = random.choice(canary_nodes) if touch_canary else random.choice(mule_nodes)
                is_canary = 1 if "CANARY" in target else 0

                if is_canary:
                    hop_dist = 1
                    cslp = random.uniform(0.55, 0.88)
                elif random.random() < 0.70:
                    hop_dist = random.choice([2, 3])
                    cslp = random.uniform(0.25, 0.72)
                else: # Unintercepted fraud ring
                    hop_dist = -1
                    cslp = random.uniform(0.08, 0.38)

                shared_devs = random.choices([0, 1, 2, 3], weights=[0.3, 0.4, 0.2, 0.1])[0]
                vel = int(np.clip(np.random.exponential(scale=350) + 20, 15, 7200))
                cnt = random.randint(10, 60)

                events.append({
                    "event_id": f"TX_MULE_{i}",
                    "sender_id": mule_u,
                    "target_id": target,
                    "amount_inr": amt,
                    "hour_of_day": hour,
                    "is_weekend": random.choice([0, 1]),
                    "historical_tx_count_24h": cnt,
                    "avg_amount_72h": amt * random.uniform(0.60, 1.50),
                    "velocity_delta_sec": vel,
                    "is_canary_hit": is_canary,
                    "canary_hop_distance": hop_dist,
                    "fan_in_ratio_60m": random.uniform(0.40, 0.90),
                    "fan_out_ratio_60m": random.uniform(0.40, 0.90),
                    "amount_conservation_ratio": random.uniform(0.45, 0.95),
                    "shared_device_mule_count": shared_devs,
                    "cs_lp_risk_score": cslp,
                    "is_mule_label": 1
                })

            # Subtype B: Unwitting Mule / Task Scam Intermediary (35%)
            else:
                target = random.choice(mule_nodes)
                events.append({
                    "event_id": f"TX_MULE_UNWITTING_{i}",
                    "sender_id": mule_u,
                    "target_id": target,
                    "amount_inr": amt,
                    "hour_of_day": hour,
                    "is_weekend": random.choice([0, 1]),
                    "historical_tx_count_24h": random.randint(4, 25),
                    "avg_amount_72h": amt * random.uniform(0.50, 1.70),
                    "velocity_delta_sec": int(np.clip(np.random.exponential(scale=1200) + 90, 60, 14400)),
                    "is_canary_hit": 0,
                    "canary_hop_distance": random.choice([2, 3, -1]),
                    "fan_in_ratio_60m": random.uniform(0.25, 0.65),
                    "fan_out_ratio_60m": random.uniform(0.25, 0.65),
                    "amount_conservation_ratio": random.uniform(0.35, 0.85),
                    "shared_device_mule_count": random.choice([0, 1]),
                    "cs_lp_risk_score": random.uniform(0.12, 0.50),
                    "is_mule_label": 1
                })

        # 2. High-Volume Merchant Benign Pattern (25%)
        elif p < 0.40:
            u = random.choice(retail_nodes)
            m = random.choice(merchant_nodes)
            amt = round(float(np.clip(np.random.lognormal(mean=8.6, sigma=1.0), 100, 90000)), 2)
            hour = random.randint(8, 23)
            indirect_proximity = random.random() < 0.15
            hop_dist = random.choice([2, 3]) if indirect_proximity else -1
            cslp = random.uniform(0.15, 0.45) if indirect_proximity else random.uniform(0.0, 0.20)

            events.append({
                "event_id": f"TX_MERCHANT_{i}",
                "sender_id": u,
                "target_id": m,
                "amount_inr": amt,
                "hour_of_day": hour,
                "is_weekend": random.choice([0, 1]),
                "historical_tx_count_24h": random.randint(15, 75),
                "avg_amount_72h": amt * random.uniform(0.5, 1.7),
                "velocity_delta_sec": int(np.clip(np.random.exponential(scale=450) + 30, 20, 3600)),
                "is_canary_hit": 0,
                "canary_hop_distance": hop_dist,
                "fan_in_ratio_60m": random.uniform(0.40, 0.85),
                "fan_out_ratio_60m": random.uniform(0.10, 0.45),
                "amount_conservation_ratio": random.uniform(0.10, 0.55),
                "shared_device_mule_count": 0,
                "cs_lp_risk_score": cslp,
                "is_mule_label": 0
            })

        # 3. Payroll / Business Disbursements (10%)
        elif p < 0.50:
            corp = random.choice(merchant_nodes)
            emp = random.choice(retail_nodes)
            amt = round(float(np.clip(np.random.lognormal(mean=9.8, sigma=0.6), 10000, 100000)), 2)
            events.append({
                "event_id": f"TX_PAYROLL_{i}",
                "sender_id": corp,
                "target_id": emp,
                "amount_inr": amt,
                "hour_of_day": random.randint(9, 18),
                "is_weekend": 0,
                "historical_tx_count_24h": random.randint(20, 80),
                "avg_amount_72h": amt * random.uniform(0.80, 1.20),
                "velocity_delta_sec": int(np.clip(np.random.exponential(scale=300) + 15, 10, 1800)),
                "is_canary_hit": 0,
                "canary_hop_distance": -1,
                "fan_in_ratio_60m": random.uniform(0.05, 0.30),
                "fan_out_ratio_60m": random.uniform(0.50, 0.92),
                "amount_conservation_ratio": random.uniform(0.15, 0.60),
                "shared_device_mule_count": 0,
                "cs_lp_risk_score": random.uniform(0.0, 0.15),
                "is_mule_label": 0
            })

        # 4. Standard Retail P2P / P2M (50%)
        else:
            u = random.choice(retail_nodes)
            v = random.choice(retail_nodes)
            is_burst = random.random() < 0.20
            amt = round(float(np.clip(np.random.lognormal(mean=8.0, sigma=1.2), 50, 75000)), 2)
            vel = int(np.clip(np.random.exponential(scale=400) + 30, 20, 3600)) if is_burst else int(np.clip(np.random.exponential(scale=7200) + 600, 600, 86400))
            cnt = random.randint(8, 30) if is_burst else random.randint(1, 10)
            cons = random.uniform(0.40, 0.85) if is_burst else random.uniform(0.05, 0.45)

            events.append({
                "event_id": f"TX_RETAIL_{i}",
                "sender_id": u,
                "target_id": v,
                "amount_inr": amt,
                "hour_of_day": random.randint(0, 23),
                "is_weekend": random.choice([0, 1]),
                "historical_tx_count_24h": cnt,
                "avg_amount_72h": amt * random.uniform(0.5, 1.8),
                "velocity_delta_sec": vel,
                "is_canary_hit": 0,
                "canary_hop_distance": -1,
                "fan_in_ratio_60m": random.uniform(0.05, 0.40),
                "fan_out_ratio_60m": random.uniform(0.05, 0.40),
                "amount_conservation_ratio": cons,
                "shared_device_mule_count": random.choice([0, 0, 0, 1]),
                "cs_lp_risk_score": random.uniform(0.0, 0.22),
                "is_mule_label": 0
            })

    events_df = pd.DataFrame(events)
    return nodes_df, events_df
