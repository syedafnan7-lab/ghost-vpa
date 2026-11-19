import math
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
import networkx as nx
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.schemas.graph import GraphNode, GraphEdge, EgoGraphResponse


def _utc_datetime(value: datetime) -> datetime:
    """Normalize persisted SQLite timestamps before comparing them to the UTC clock."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def event_type_is_canary_seed(event_type: str) -> bool:
    return event_type == "PAYMENT_ATTEMPT"

class TemporalGraphEngine:
    def __init__(self, window_hours: int = 72, decay_lambda: float = 0.05, restart_alpha: float = 0.85):
        self.window_hours = window_hours
        self.decay_lambda = decay_lambda
        self.restart_alpha = restart_alpha
        # Directed multigraph: G.nodes have type, bank, etc. Edges have amount, timestamp, etc.
        self.graph = nx.MultiDiGraph()
        self.canary_nodes: Set[str] = set()

    def add_transaction_edge(self, event: PaymentAttemptEvent, prune: bool = True):
        """Ingests transaction into temporal multigraph with strict event semantics.

        Rules:
        - IDENTIFIER_DISCOVERY / BENEFICIARY_VALIDATION: Records entity/device presence, NO financial edge.
        - PAYMENT_DECLINED: Records attempt presence, NO financial edge.
        - PAYMENT_REVERSED: Links to original_event_id and neutralizes previous financial transfer.
        - PAYMENT_ATTEMPT / CREDIT_CONFIRMED: Adds directed payment edge (amount > 0).
        """
        event_type = getattr(event, "event_type", "PAYMENT_ATTEMPT") or "PAYMENT_ATTEMPT"
        is_canary_seed = event.is_canary_hit and event_type_is_canary_seed(event_type)
        u = event.sender_account_id
        # If target is a canary interaction, node id is the canary VPA.
        v = event.beneficiary_vpa if is_canary_seed else (event.beneficiary_account_id or event.beneficiary_vpa)

        # Ensure sender node exists
        if u not in self.graph:
            self.graph.add_node(
                u,
                label=u,
                node_type="SENDER_MULE" if is_canary_seed else "BENIGN_ACCOUNT",
                bank=event.sender_bank,
                is_canary=False,
                device_token=event.device_token,
                created_at=event.timestamp
            )
        elif is_canary_seed:
            self.graph.nodes[u]["node_type"] = "SENDER_MULE"

        # Ensure beneficiary node exists
        if v not in self.graph:
            self.graph.add_node(
                v,
                label=v,
                node_type="CANARY" if is_canary_seed else "BENIGN_ACCOUNT",
                bank=event.beneficiary_bank,
                is_canary=is_canary_seed,
                created_at=event.timestamp
            )
            if is_canary_seed:
                self.canary_nodes.add(v)

        # Add hardware device linkage edge if device token provided
        if event.device_token:
            dev_id = f"DEV_{event.device_token}"
            if dev_id not in self.graph:
                self.graph.add_node(dev_id, label=dev_id, node_type="DEVICE_TOKEN", is_canary=False)
            self.graph.add_edge(
                u, dev_id, key=f"DEV_{event.event_id}", event_id=event.event_id,
                amount_inr=0.0, timestamp=event.timestamp, is_tripwire=False,
                is_financial=False, is_device_link=True, event_type="DEVICE_ASSOCIATION",
            )

        if event_type == "PAYMENT_REVERSED":
            # Preserve the original event and mark it reversed for auditability.
            orig_id = getattr(event, "original_event_id", None)
            if orig_id:
                for edge_u, edge_v, edge_k, edge_data in list(self.graph.edges(keys=True, data=True)):
                    if edge_k == orig_id:
                        edge_data["is_reversed"] = True
                        edge_data["reversed_by_event_id"] = event.event_id
                        break

        # Preserve lifecycle evidence, while only confirmed credits count as
        # transferred funds. A canary attempt is an interaction seed, not a
        # completed payment.
        is_financial = event_type == "CREDIT_CONFIRMED"
        is_tripwire = is_canary_seed and event_type == "PAYMENT_ATTEMPT"
        self.graph.add_edge(
            u,
            v,
            key=event.event_id,
            amount_inr=event.amount_inr if is_financial else 0.0,
            attempted_amount_inr=event.amount_inr,
            is_financial=is_financial,
            timestamp=event.timestamp,
            payment_rail=event.payment_rail,
            is_tripwire=is_tripwire,
            device_token=event.device_token,
            event_type=event_type,
            original_event_id=event.original_event_id,
            is_reversed=False
        )

        # Enforce 72-hour sliding window expiration on ingestion
        if prune and event.timestamp:
            self.prune_expired_edges(event.timestamp)

    def prune_expired_edges(self, current_sim_time: datetime) -> int:
        """Removes edges older than the 72-hour sliding window and purges isolated benign nodes."""
        current_sim_time = _utc_datetime(current_sim_time)
        cutoff = current_sim_time - timedelta(hours=self.window_hours)

        edges_to_remove = []

        for u, v, k, data in self.graph.edges(keys=True, data=True):
            edge_time = data.get("timestamp")
            if edge_time:
                edge_time = _utc_datetime(edge_time)
                if edge_time < cutoff:
                    edges_to_remove.append((u, v, k))

        for u, v, k in edges_to_remove:
            self.graph.remove_edge(u, v, key=k)

        # Clean isolated non-canary nodes
        isolated = [n for n, deg in self.graph.degree() if deg == 0 and n not in self.canary_nodes]
        for n in isolated:
            self.graph.remove_node(n)

        return len(edges_to_remove)

    def remove_event(self, event_id: str) -> None:
        """Remove an uncommitted event projection after a persistence failure."""
        for source, target, key, data in list(self.graph.edges(keys=True, data=True)):
            if key == event_id or key == f"DEV_{event_id}":
                if data.get("is_reversed"):
                    original_id = data.get("original_event_id")
                    for _, _, original_key, original in self.graph.edges(keys=True, data=True):
                        if original_key == original_id:
                            original.pop("is_reversed", None)
                            original.pop("reversed_by_event_id", None)
                            break
                self.graph.remove_edge(source, target, key=key)

        for node in list(self.graph.nodes):
            if self.graph.degree(node) == 0 and node not in self.canary_nodes:
                self.graph.remove_node(node)

        for canary in list(self.canary_nodes):
            if not any(
                data.get("is_tripwire")
                for _, _, _, data in self.graph.in_edges(canary, keys=True, data=True)
            ) and not any(
                data.get("is_tripwire")
                for _, _, _, data in self.graph.out_edges(canary, keys=True, data=True)
            ):
                self.canary_nodes.remove(canary)
                if canary in self.graph:
                    self.graph.remove_node(canary)

    def compute_cslp_scores(self, current_sim_time: datetime) -> Dict[str, float]:
        """Canary-Seeded Label Propagation (DU-RLP).

        Mathematical Principle:
        Risk propagates strictly BACKWARD along payment edges (against fund movement direction).
        An entity earns risk if it transferred money to a known suspect, mule, or canary.

        Zero-in-degree feeder accounts participate fully because they have outbound payment edges.
        Downstream innocent payees/merchants have no outbound payments to suspects, earning 0.0000.
        """
        if current_sim_time.tzinfo is None:
            current_sim_time = current_sim_time.replace(tzinfo=timezone.utc)

        scores: Dict[str, float] = {node: 0.0 for node in self.graph.nodes if not node.startswith("DEV_")}
        for c in self.canary_nodes:
            if c in scores:
                scores[c] = 1.0

        if not self.canary_nodes:
            return scores

        epsilon = 1e-4
        max_iterations = getattr(self, "CSLP_MAX_ITERATIONS", 15)

        for _ in range(max_iterations):
            new_scores = scores.copy()
            max_delta = 0.0

            for node in list(self.graph.nodes):
                if node in self.canary_nodes or node.startswith("DEV_"):
                    continue

                # Traverse ONLY outbound payment edges (excluding device nodes)
                out_edges = [
                    (u, v, k, d) for u, v, k, d in self.graph.out_edges(node, keys=True, data=True)
                    if not v.startswith("DEV_")
                ]
                if not out_edges:
                    continue

                total_weight = 0.0
                weighted_sum = 0.0
                for _, benef, _, data in out_edges:
                    t = data.get("timestamp", current_sim_time)
                    t = _utc_datetime(t)
                    # Ignore transactions that have not occurred yet relative to current_sim_time
                    if t > current_sim_time:
                        continue
                    delta_seconds = (current_sim_time - t).total_seconds()
                    # Ignore transactions outside the sliding window
                    if delta_seconds > self.window_hours * 3600.0:
                        continue

                    delta_h = max(0.0, delta_seconds / 3600.0)
                    amt = data.get("amount_inr", 1000.0)

                    # Only completed transfers carry fund-flow risk. A direct
                    # canary attempt remains an independent interaction seed.
                    is_tripwire = data.get("is_tripwire", False)
                    if ((not data.get("is_financial", False) and not is_tripwire)
                            or data.get("is_reversed", False)):
                        continue
                    w = 4.0 if is_tripwire else math.exp(-self.decay_lambda * delta_h) * math.log(1.0 + max(0.0, amt) / 100.0)
                    weighted_sum += w * scores.get(benef, 0.0)
                    total_weight += w

                if total_weight > 0:
                    propagated = weighted_sum / total_weight
                    updated_val = (1.0 - self.restart_alpha) * scores[node] + self.restart_alpha * propagated

                    # Structural Feeder amplification:
                    # Root nodes (in_degree == 0 among payment accounts) funding >= 2 suspects receive boost
                    non_dev_in_degree = sum(1 for p in self.graph.predecessors(node) if not p.startswith("DEV_"))
                    suspect_benefs = {
                        b for _, b, _, edge_data in out_edges
                        if scores.get(b, 0.0) > 0.15
                        and not edge_data.get("is_reversed", False)
                        and (edge_data.get("is_financial", False) or edge_data.get("is_tripwire", False))
                        and _utc_datetime(edge_data.get("timestamp", current_sim_time)) <= current_sim_time
                        and (current_sim_time - _utc_datetime(edge_data.get("timestamp", current_sim_time))).total_seconds()
                        <= self.window_hours * 3600.0
                    }
                    if non_dev_in_degree == 0 and len(suspect_benefs) >= 2:
                        boost = 1.0 + 0.25 * math.log2(len(suspect_benefs))
                        updated_val = min(1.0, updated_val * boost)

                    delta = abs(updated_val - scores[node])
                    if delta > max_delta:
                        max_delta = delta
                    new_scores[node] = updated_val

            scores = new_scores
            if max_delta < epsilon:
                break

        return scores

    def attribute_case_network(self, focal_account_id: str, current_sim_time: datetime) -> Dict[str, Any]:
        """Attributes network context around a focal account (e.g. canary tripper or suspect):
        1. Identifies upstream feeder candidates (accounts that funded focal_account_id).
        2. Identifies sibling mules (other accounts funded by the same feeder or sharing devices).
        3. Computes a deterministic, topology-derived syndicate cluster ID.
        4. Distinguishes direct interaction from inferred network attribution.
        """
        current_sim_time = _utc_datetime(current_sim_time)

        cutoff = current_sim_time - timedelta(hours=self.window_hours)

        def is_active_event_edge(data: Dict[str, Any]) -> bool:
            timestamp = data.get("timestamp")
            if timestamp is None:
                return False
            timestamp = _utc_datetime(timestamp)
            return cutoff <= timestamp <= current_sim_time

        def is_active_payment_edge(data: Dict[str, Any]) -> bool:
            return (data.get("is_financial", False)
                    and not data.get("is_reversed", False)
                    and data.get("amount_inr", 0.0) > 0
                    and is_active_event_edge(data))

        if focal_account_id not in self.graph:
            return {
                "feeder_id": None,
                "all_feeders": [],
                "connected_mule_count": 0,
                "cluster_id": None,
                "syndicate_members": [],
                "cslp_score": 0.0,
                "evidence": {}
            }

        scores = self.compute_cslp_scores(current_sim_time)
        focal_score = scores.get(focal_account_id, 0.0)

        # 1. Trace upstream funding predecessors along payment edges (excluding DEV_ nodes)
        upstream_funding_nodes: Set[str] = set()
        for pred in self.graph.predecessors(focal_account_id):
            if pred.startswith("DEV_") or pred in self.canary_nodes:
                continue
            edges_dict = self.graph.get_edge_data(pred, focal_account_id) or {}
            for k, data in edges_dict.items():
                if is_active_payment_edge(data):
                    upstream_funding_nodes.add(pred)
                    break

        # Walk every confirmed-payment predecessor. The visited set handles
        # cycles and preserves each distinct upstream path.
        extended_feeders: Set[str] = set()
        frontier = list(upstream_funding_nodes)
        while frontier:
            upstream = frontier.pop()
            if upstream in extended_feeders:
                continue
            extended_feeders.add(upstream)
            for predecessor in self.graph.predecessors(upstream):
                if predecessor.startswith("DEV_") or predecessor in self.canary_nodes:
                    continue
                if any(is_active_payment_edge(d) for d in (self.graph.get_edge_data(predecessor, upstream) or {}).values()):
                    frontier.append(predecessor)

        # Rank candidate feeders: prefer root nodes (in_degree == 0), then disbursed volume, then out-degree
        candidate_feeders = []
        for f in extended_feeders:
            in_deg = sum(1 for p in self.graph.predecessors(f) if any(
                is_active_payment_edge(d) for d in (self.graph.get_edge_data(p, f) or {}).values()
            ))
            out_deg = sum(1 for s in self.graph.successors(f) if any(
                is_active_payment_edge(d) for d in (self.graph.get_edge_data(f, s) or {}).values()
            ))
            score = scores.get(f, 0.0)
            total_disbursed = 0.0
            for _, s, _, d in self.graph.out_edges(f, keys=True, data=True):
                if not s.startswith("DEV_") and is_active_payment_edge(d):
                    total_disbursed += d.get("amount_inr", 0.0)
            candidate_feeders.append({
                "feeder_id": f,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "score": score,
                "total_disbursed": total_disbursed
            })

        candidate_feeders.sort(
            key=lambda x: (1 if x["in_degree"] == 0 else 0, x["total_disbursed"], x["out_degree"], x["feeder_id"]),
            reverse=True
        )

        primary_feeder = candidate_feeders[0]["feeder_id"] if candidate_feeders else None
        all_feeders = [cf["feeder_id"] for cf in candidate_feeders]

        # 2. Identify connected sibling candidates with their own canary
        # interaction. A shared feeder/device alone does not create a cluster.
        sibling_mules: Set[str] = set()

        def has_canary_interaction(account_id: str) -> bool:
            return any(
                edge_data.get("is_tripwire") and is_active_event_edge(edge_data)
                for _, target, _, edge_data in self.graph.out_edges(account_id, keys=True, data=True)
                if target in self.canary_nodes
            )
        for f in all_feeders:
            for _, succ, _, edge_data in self.graph.out_edges(f, keys=True, data=True):
                if (succ != focal_account_id and not succ.startswith("DEV_")
                        and succ not in self.canary_nodes and is_active_payment_edge(edge_data)
                        and has_canary_interaction(succ)):
                    sibling_mules.add(succ)

        # Also identify mules linked via shared device tokens
        shared_devices: Set[str] = set()
        for _, succ, _, edge_data in self.graph.out_edges(focal_account_id, keys=True, data=True):
            if succ.startswith("DEV_") and is_active_event_edge(edge_data):
                shared_devices.add(succ)
                for other, _, _, other_edge in self.graph.in_edges(succ, keys=True, data=True):
                    if (other != focal_account_id and not other.startswith("DEV_")
                            and other not in self.canary_nodes and is_active_event_edge(other_edge)):
                        if has_canary_interaction(other):
                            sibling_mules.add(other)

        connected_mule_count = len(sibling_mules)

        # 3. Generate defensible syndicate cluster ID
        # A cluster is formed only if there is genuine multi-node syndicate structure
        # (e.g. at least one upstream feeder, or at least one sibling mule)
        cluster_id = None
        if primary_feeder is not None or len(sibling_mules) > 0:
            syndicate_members: Set[str] = {focal_account_id}
            if primary_feeder:
                syndicate_members.update(all_feeders)
            syndicate_members.update(sibling_mules)
            # Shared devices remain supporting evidence, not cluster membership.

            sorted_members = sorted(list(syndicate_members))
            comp_hash = hashlib.sha256(":".join(sorted_members).encode("utf-8")).hexdigest()[:8].upper()
            cluster_id = f"CLUST-SYN-{comp_hash}"
        else:
            syndicate_members = {focal_account_id}

        evidence_event_ids: Set[str] = set()
        evidence_accounts = {focal_account_id, *all_feeders, *sibling_mules}
        for source, target, key, edge_data in self.graph.edges(keys=True, data=True):
            if (source in evidence_accounts or target in evidence_accounts) and is_active_event_edge(edge_data):
                if not source.startswith("DEV_") and not target.startswith("DEV_"):
                    evidence_event_ids.add(str(key))

        return {
            "feeder_id": primary_feeder,
            "all_feeders": all_feeders,
            "connected_mule_count": connected_mule_count,
            "cluster_id": cluster_id,
            "syndicate_members": sorted(list(syndicate_members)),
            "cslp_score": round(focal_score, 4),
            "evidence": {
                "primary_feeder": primary_feeder,
                "all_feeders": all_feeders,
                "connected_mules": sorted(list(sibling_mules)),
                "shared_devices": sorted(list(shared_devices)),
                "event_ids": sorted(evidence_event_ids),
                "direct_canary_hit": focal_account_id in self.graph and any(
                    succ in self.canary_nodes and any(is_active_event_edge(edge_data) and edge_data.get("is_tripwire")
                        for edge_data in (self.graph.get_edge_data(focal_account_id, succ) or {}).values())
                    for succ in self.graph.successors(focal_account_id)
                )
            }
        }

    def detect_motifs(self, focal_entity_id: str, current_sim_time: datetime) -> List[Dict[str, Any]]:
        """Detects rapid fan-in, rapid fan-out, high velocity pass-through, and feeder funnels."""
        motifs = []
        if focal_entity_id not in self.graph:
            return motifs

        in_edges = list(self.graph.in_edges(focal_entity_id, data=True))
        out_edges = list(self.graph.out_edges(focal_entity_id, data=True))

        # 1. Rapid Fan-In (Aggregation into Mule): >= 3 remitters within 60 mins
        current_sim_time = _utc_datetime(current_sim_time)
        recent_in = [e for e in in_edges if e[2].get("is_financial") and not e[2].get("is_reversed")
                     and 0 <= (current_sim_time - _utc_datetime(e[2].get("timestamp", current_sim_time))).total_seconds() <= 3600]
        unique_remitters = {e[0] for e in recent_in}
        if len(unique_remitters) >= 3:
            total_in = sum(e[2].get("amount_inr", 0) for e in recent_in)
            motifs.append({
                "type": "RAPID_FAN_IN_AGGREGATION",
                "severity": "HIGH",
                "description": f"Rapid fan-in detected: {len(unique_remitters)} distinct senders aggregated ₹{total_in:,.2f} within 60 minutes.",
                "remitters": list(unique_remitters)
            })

        # 2. Rapid Fan-Out (Layering Dispersion): >= 3 recipients within 30 mins
        recent_out = [e for e in out_edges if e[2].get("is_financial") and not e[2].get("is_reversed")
                      and 0 <= (current_sim_time - _utc_datetime(e[2].get("timestamp", current_sim_time))).total_seconds() <= 1800]
        unique_beneficiaries = {e[1] for e in recent_out}
        if len(unique_beneficiaries) >= 3:
            total_out = sum(e[2].get("amount_inr", 0) for e in recent_out)
            motifs.append({
                "type": "RAPID_FAN_OUT_DISPERSION",
                "severity": "CRITICAL",
                "description": f"Rapid layering fan-out: {len(unique_beneficiaries)} outbound splits dispersing ₹{total_out:,.2f} within 30 minutes.",
                "beneficiaries": list(unique_beneficiaries)
            })

        # 3. High Velocity Pass-Through & Amount Conservation
        if recent_in and recent_out:
            latest_in = max(_utc_datetime(e[2].get("timestamp", current_sim_time)) for e in recent_in)
            earliest_out = min(_utc_datetime(e[2].get("timestamp", current_sim_time)) for e in recent_out)
            delta_t_min = (earliest_out - latest_in).total_seconds() / 60.0
            sum_in = sum(e[2].get("amount_inr", 0) for e in recent_in)
            sum_out = sum(e[2].get("amount_inr", 0) for e in recent_out)
            ratio = (sum_out / sum_in) if sum_in > 0 else 0.0

            if 0.0 <= delta_t_min <= 15.0 and 0.80 <= ratio <= 1.10:
                motifs.append({
                    "type": "HIGH_VELOCITY_PASS_THROUGH",
                    "severity": "CRITICAL",
                    "description": f"Velocity Pass-Through: Stolen funds passed through in {delta_t_min:.1f} mins with {ratio*100:.1f}% amount conservation.",
                    "delta_t_minutes": delta_t_min,
                    "retention_ratio": ratio
                })

        return motifs

    def get_ego_subgraph(
        self,
        focal_id: str,
        current_sim_time: datetime,
        max_depth: int = 2,
        max_nodes: int = 50,
        window_hours: int = 72
    ) -> EgoGraphResponse:
        """Returns bounded ego-network around focal entity for D3 visualization,
        filtered by the temporal sliding window (window_hours)."""
        if focal_id not in self.graph:
            return EgoGraphResponse(
                focal_entity_id=focal_id,
                depth=max_depth,
                total_nodes=0,
                total_edges=0,
                nodes=[],
                edges=[],
                detected_motifs=[]
            )

        current_sim_time = _utc_datetime(current_sim_time)
        cutoff = current_sim_time - timedelta(hours=window_hours)

        def is_edge_active(edge_data: Dict[str, Any]) -> bool:
            t = edge_data.get("timestamp")
            if not t:
                return True
            t = _utc_datetime(t)
            return cutoff <= t <= current_sim_time

        # BFS bounded ego expansion traversing only active edges within window_hours
        visited_nodes: Set[str] = {focal_id}
        queue = [(focal_id, 0)]
        while queue and len(visited_nodes) < max_nodes:
            curr, d = queue.pop(0)
            if d >= max_depth:
                continue

            # Inbound neighbors (upstream feeders) with at least one active edge
            for pred in self.graph.predecessors(curr):
                edges_dict = self.graph.get_edge_data(pred, curr) or {}
                if any(is_edge_active(data) for data in edges_dict.values()):
                    if pred not in visited_nodes:
                        visited_nodes.add(pred)
                        queue.append((pred, d + 1))
                        if len(visited_nodes) >= max_nodes:
                            break

            # Outbound neighbors (layering mules) with at least one active edge
            for succ in self.graph.successors(curr):
                edges_dict = self.graph.get_edge_data(curr, succ) or {}
                if any(is_edge_active(data) for data in edges_dict.values()):
                    if succ not in visited_nodes:
                        visited_nodes.add(succ)
                        queue.append((succ, d + 1))
                        if len(visited_nodes) >= max_nodes:
                            break

        # Collect active edges within the visited ego subgraph
        sub_edges: List[GraphEdge] = []
        nodes_with_edges: Set[str] = {focal_id}
        for u, v, k, data in self.graph.edges(keys=True, data=True):
            if u in visited_nodes and v in visited_nodes and is_edge_active(data):
                nodes_with_edges.add(u)
                nodes_with_edges.add(v)
                sub_edges.append(GraphEdge(
                    event_id=str(data.get("event_id", k.removeprefix("DEV_") if data.get("is_device_link") else k)),
                    original_event_id=data.get("original_event_id"),
                    source=u,
                    target=v,
                    amount_inr=data.get("amount_inr", 0.0),
                    timestamp=data.get("timestamp", current_sim_time),
                    rail=data.get("payment_rail", "UPI"),
                    is_tripwire=data.get("is_tripwire", False),
                    is_financial=data.get("is_financial", False),
                    event_type=data.get("event_type", "PAYMENT_ATTEMPT"),
                    is_reversed=data.get("is_reversed", False)
                ))

        # Only retain nodes that are either focal or incident to an active edge
        active_nodes = visited_nodes.intersection(nodes_with_edges)

        cslp_scores = self.compute_cslp_scores(current_sim_time)
        sub_nodes: List[GraphNode] = []
        for n in active_nodes:
            data = self.graph.nodes[n]
            ntype = data.get("node_type", "BENIGN_ACCOUNT")
            is_canary = data.get("is_canary", False)
            cslp = cslp_scores.get(n, 0.0)

            # Heuristic node classification if upstream feeder
            if self.graph.out_degree(n) >= 2 and self.graph.in_degree(n) == 0 and not is_canary:
                ntype = "FEEDER_NODE"
            elif is_canary:
                ntype = "CANARY"

            sub_nodes.append(GraphNode(
                id=n,
                label=data.get("label", n),
                type=ntype,
                bank=data.get("bank"),
                risk_score=min(1.0, cslp * 1.2),
                cslp_score=round(cslp, 4),
                is_seed=is_canary,
                in_degree=self.graph.in_degree(n),
                out_degree=self.graph.out_degree(n),
                metadata={"created_at": str(data.get("created_at", ""))}
            ))

        detected_motifs = self.detect_motifs(focal_id, current_sim_time)

        return EgoGraphResponse(
            focal_entity_id=focal_id,
            depth=max_depth,
            total_nodes=len(sub_nodes),
            total_edges=len(sub_edges),
            nodes=sub_nodes,
            edges=sub_edges,
            detected_motifs=detected_motifs
        )

temporal_graph = TemporalGraphEngine()
