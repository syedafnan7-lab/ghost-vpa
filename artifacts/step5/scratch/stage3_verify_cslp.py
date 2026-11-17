"""STAGE 3 — Independent verification of the Stage 2 CS-LP findings.

READ-ONLY with respect to tracked source. Imports the shipped
TemporalGraphEngine and runs it against a purpose-built graph containing:
  - one canary seed (ground truth)
  - one true upstream feeder (in-degree 0)
  - two mules paid BY the feeder and paying the canary
  - three innocent parties downstream of a mule
  - one innocent sleeper downstream of a mule

Then it computes:
  separation = min(score over true positives) - max(score over innocents)

and runs the same harness against three candidate algorithms so the fix is
priced on evidence, not asserted:
  A. SHIPPED          : in_edges + out_edges, zero-in-degree guard
  B. PROPOSED_DELETE  : out_edges only, guard removed
  C. BIDIRECTIONAL_UP : out_edges only, guard removed, feeder seeded at 1.0-independent
                        (i.e. the "seed the feer" variant)
"""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from backend.app.graph.temporal_engine import TemporalGraphEngine  # noqa: E402
from backend.app.schemas.events import PaymentAttemptEvent  # noqa: E402

T0 = datetime(2026, 11, 16, 12, 0, 0, tzinfo=timezone.utc)


def ev(eid, frm, to, canary=False, minutes=0, amount=50000.0, dev=None):
    return PaymentAttemptEvent(
        event_id=eid,
        timestamp=T0 + timedelta(minutes=minutes),
        sender_account_id=frm,
        sender_vpa=f"{frm.lower()}@bank",
        sender_bank="HDFX",
        beneficiary_account_id=None if canary else to,
        beneficiary_vpa=to if canary else f"{to.lower()}@bank",
        beneficiary_bank="ICIX",
        amount_inr=amount,
        payment_rail="UPI",
        attempt_type="PENNY_DROP_PROBE" if canary else "P2P",
        device_token=dev or f"DEV_{frm}",
        ip_subnet="10.0.0.0/24",
        is_canary_hit=canary,
        simulated_result="TRIPWIRE_TRIGGERED" if canary else "SETTLED_NORMAL",
        zero_funds_transferred=True,
    )


CANARY = "CANARY_VPA_001"
FEEDER = "FEEDER_SYNTH_007"
MULE_A, MULE_B = "MULE_SYNTH_101", "MULE_SYNTH_102"
VICTIM = "UNWITTING_VICTIM_900"      # paid BY the canary (i.e. canary->victim)
MERCHANT = "INNOCENT_MERCHANT_901"   # paid BY a mule
SLEEPER = "INNOCENT_SLEEPER_902"     # paid BY a mule

TRUE_POSITIVES = {CANARY: "canary seed", FEEDER: "upstream feeder",
                  MULE_A: "mule paid feeder, paid canary",
                  MULE_B: "mule paid feeder, paid canary"}
INNOCENTS = {VICTIM: "paid BY the canary",
             MERCHANT: "paid BY a mule",
             SLEEPER: "paid BY a mule"}


def build():
    g = TemporalGraphEngine()
    # feeder -> mules
    g.add_transaction_edge(ev("e1", FEEDER, MULE_A, minutes=0))
    g.add_transaction_edge(ev("e2", FEEDER, MULE_B, minutes=2))
    # mules -> canary  (the tripwire)
    g.add_transaction_edge(ev("e3", MULE_A, CANARY, canary=True, minutes=10, amount=1.0))
    g.add_transaction_edge(ev("e4", MULE_B, CANARY, canary=True, minutes=12, amount=1.0))
    # canary -> victim (an unwitting user who once paid the canary handle)
    g.add_transaction_edge(ev("e5", CANARY, VICTIM, minutes=20))
    # mule -> merchant, mule -> sleeper (innocent beneficiaries of a guilty payer)
    g.add_transaction_edge(ev("e6", MULE_A, MERCHANT, minutes=22))
    g.add_transaction_edge(ev("e7", MULE_B, SLEEPER, minutes=24))
    return g


def report(label, scores):
    tp = {n: scores.get(n, 0.0) for n in TRUE_POSITIVES}
    fp = {n: scores.get(n, 0.0) for n in INNOCENTS}
    min_tp = min(tp.values())
    max_fp = max(fp.values())
    print(f"\n--- {label} ---")
    for n, d in {**{k: f"TP ({v})" for k, v in TRUE_POSITIVES.items()},
                 **{k: f"INNOCENT ({v})" for k, v in INNOCENTS.items()}}.items():
        s = scores.get(n, 0.0)
        tag = "  <-- INNOCENT SCORES HIGHER THAN A TRUE POSITIVE" if s > min_tp else ""
        print(f"  {s:.4f}  {n:<22} {d}{tag}")
    print(f"  separation (min TP - max INNOCENT) = {min_tp - max_fp:+.4f}")
    return min_tp - max_fp


def main():
    # ---- A. shipped engine ----
    a = build()
    sa = a.compute_cslp_scores(T0)
    sep_a = report("A. SHIPPED  (in_edges + out_edges + zero-in-degree guard)", sa)

    # ---- B. deletion-only fix: propagate along out_edges only, no guard ----
    b = build()
    b.canary_nodes = {CANARY}
    # emulate the proposed fix without editing source
    import math
    scores = {n: 0.0 for n in b.graph.nodes}
    scores[CANARY] = 1.0
    for _ in range(15):
        new = scores.copy()
        for node in b.graph.nodes:
            if node in b.canary_nodes:
                continue
            outs = list(b.graph.out_edges(node, data=True))
            if not outs:
                continue
            tot, wsum = 0.0, 0.0
            for _, benef, data in outs:
                t = data.get("timestamp", T0)
                dh = max(0.0, (T0 - t).total_seconds() / 3600.0)
                w = math.exp(-b.decay_lambda * dh)
                wsum += w * scores.get(benef, 0.0)
                tot += w
            if tot > 0:
                new[node] = (1.0 - b.restart_alpha) * scores[node] + b.restart_alpha * (wsum / tot)
        scores = new
    sep_b = report("B. PROPOSED_DELETE  (out_edges only, guard removed)", scores)

    # ---- C. seed-the-feeder variant: feeder gets an independent seed ----
    c = build()
    c.canary_nodes = {CANARY}
    # A feeder with in-degree 0 cannot receive blame; instead seed it positively
    # because "it funded a canary-hit mule" is itself evidence.
    scores_c = {n: 0.0 for n in c.graph.nodes}
    scores_c[CANARY] = 1.0
    for _ in range(15):
        new = scores_c.copy()
        for node in c.graph.nodes:
            if node in c.canary_nodes:
                continue
            outs = list(c.graph.out_edges(node, data=True))
            if not outs:
                continue
            tot, wsum = 0.0, 0.0
            for _, benef, data in outs:
                t = data.get("timestamp", T0)
                dh = max(0.0, (T0 - t).total_seconds() / 3600.0)
                w = math.exp(-c.decay_lambda * dh)
                wsum += w * scores_c.get(benef, 0.0)
                tot += w
            if tot > 0:
                new[node] = (1.0 - c.restart_alpha) * scores_c[node] + c.restart_alpha * (wsum / tot)
            # a node that fed something now-risky earns blame even with no in-edges
            if node not in c.canary_nodes and any(
                scores_c.get(b, 0.0) > 0.5 for _, b, _ in outs
            ):
                new[node] = max(new[node], 0.5 * max(scores_c.get(b, 0.0) for _, b, _ in outs))
        scores_c = new
    sep_c = report("C. SEED_THE_FEEDER  (out_edges only + feeder boost)", scores_c)

    print("\n================ SUMMARY ================")
    print(f"A shipped      separation = {sep_a:+.4f}")
    print(f"B delete-only  separation = {sep_b:+.4f}")
    print(f"C feeder-seed  separation = {sep_c:+.4f}")
    print("\nAlso observed in A: does the feeder receive a score at all?",
          "NO" if sa.get(FEEDER, 0.0) == 0.0 else f"yes ({sa[FEEDER]:.4f})")
    print("Innocent beneficiary of the canary in A:", f"{sa.get(VICTIM, 0.0):.6f}")


if __name__ == "__main__":
    main()