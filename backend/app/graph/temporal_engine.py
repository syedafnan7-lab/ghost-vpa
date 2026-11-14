import math
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
import networkx as nx
from backend.app.schemas.events import PaymentAttemptEvent
from backend.app.schemas.graph import GraphNode, GraphEdge, EgoGraphResponse

class TemporalGraphEngine:
    def __init__(self, window_hours: int = 72, decay_lambda: float = 0.05, restart_alpha: float = 0.85):
        self.window_hours = window_hours
        self.decay_lambda = decay_lambda
        self.restart_alpha = restart_alpha
        # Directed multigraph: G.nodes have type, bank, etc. Edges have amount, timestamp, etc.
        self.graph = nx.MultiDiGraph()
        self.canary_nodes: Set[str] = set()

    def add_transaction_edge(self, event: PaymentAttemptEvent):
        """Ingests transaction into temporal multigraph. Both benign and canary flows are recorded."""
        u = event.sender_account_id
        # If target is canary, node id is the canary VPA
        v = event.beneficiary_vpa if event.is_canary_hit else (event.beneficiary_account_id or event.beneficiary_vpa)

        # Ensure sender node exists
        if u not in self.graph:
            self.graph.add_node(
                u,
                label=u,
                node_type="SENDER_MULE" if event.is_canary_hit else "BENIGN_ACCOUNT",
                bank=event.sender_bank,
                is_canary=False,
                device_token=event.device_token,
                created_at=event.timestamp
            )
        elif event.is_canary_hit:
            self.graph.nodes[u]["node_type"] = "SENDER_MULE"

        # Ensure beneficiary node exists
        if v not in self.graph:
            self.graph.add_node(
                v,
                label=v,
                node_type="CANARY" if event.is_canary_hit else "BENIGN_ACCOUNT",
                bank=event.beneficiary_bank,
                is_canary=event.is_canary_hit,
                created_at=event.timestamp
            )
            if event.is_canary_hit:
                self.canary_nodes.add(v)

        # Add directed payment edge
        self.graph.add_edge(
            u,
            v,
            key=event.event_id,
            amount_inr=event.amount_inr,
            timestamp=event.timestamp,
            payment_rail=event.payment_rail,
            is_tripwire=event.is_canary_hit,
            device_token=event.device_token
        )

        # Add hardware device linkage edge if device token provided
        dev_id = f"DEV_{event.device_token}"
        if dev_id not in self.graph:
            self.graph.add_node(dev_id, label=dev_id, node_type="DEVICE_TOKEN", is_canary=False)
        self.graph.add_edge(u, dev_id, key=f"DEV_{event.event_id}", amount_inr=0.0, timestamp=event.timestamp, is_tripwire=False)

        # Enforce 72-hour sliding window expiration on ingestion
        if event.timestamp:
            self.prune_expired_edges(event.timestamp)

    def prune_expired_edges(self, current_sim_time: datetime) -> int:
        """Removes edges older than the 72-hour sliding window and purges isolated benign nodes."""
        if current_sim_time.tzinfo is None:
            current_sim_time = current_sim_time.replace(tzinfo=timezone.utc)
        cutoff = current_sim_time - timedelta(hours=self.window_hours)
        edges_to_remove = []

        for u, v, k, data in self.graph.edges(keys=True, data=True):
            edge_time = data.get("timestamp")
            if edge_time:
                if edge_time.tzinfo is None:
                    edge_time = edge_time.replace(tzinfo=timezone.utc)
                if edge_time < cutoff:
                    edges_to_remove.append((u, v, k))

        for u, v, k in edges_to_remove:
            self.graph.remove_edge(u, v, key=k)

        # Clean isolated non-canary nodes
        isolated = [n for n, deg in self.graph.degree() if deg == 0 and n not in self.canary_nodes]
        for n in isolated:
            self.graph.remove_node(n)

        return len(edges_to_remove)

    def compute_cslp_scores(self, current_sim_time: datetime) -> Dict[str, float]:
        """Canary-Seeded Label Propagation (CS-LP).
        Seed canaries S0 = 1.0. Propagates upstream (reverse edges) with exponential temporal decay."""
        scores: Dict[str, float] = {node: 0.0 for node in self.graph.nodes}
        for c in self.canary_nodes:
            if c in scores:
                scores[c] = 1.0

        if not self.canary_nodes:
            return scores

        # Reverse graph for upstream propagation
        for _ in range(self.CSLP_MAX_ITERATIONS if hasattr(self, 'CSLP_MAX_ITERATIONS') else 15):
            new_scores = scores.copy()
            for node in self.graph.nodes:
                if node in self.canary_nodes:
                    continue
                # Inbound neighbors in standard graph = successors in reverse traversal
                in_edges = self.graph.in_edges(node, data=True)
                if not in_edges:
                    continue

                total_weight = 0.0
                weighted_sum = 0.0
                for remitter, _, data in in_edges:
                    t = data.get("timestamp", current_sim_time)
                    delta_h = max(0.0, (current_sim_time - t).total_seconds() / 3600.0)
                    w = math.exp(-self.decay_lambda * delta_h)
                    weighted_sum += w * scores.get(remitter, 0.0)
                    total_weight += w

                out_edges = self.graph.out_edges(node, data=True)
                for _, benef, data in out_edges:
                    t = data.get("timestamp", current_sim_time)
                    delta_h = max(0.0, (current_sim_time - t).total_seconds() / 3600.0)
                    w = math.exp(-self.decay_lambda * delta_h)
                    # Outbound risk influence (connected to known mule/canary)
                    weighted_sum += w * scores.get(benef, 0.0)
                    total_weight += w

                if total_weight > 0:
                    propagated = weighted_sum / total_weight
                    new_scores[node] = (1.0 - self.restart_alpha) * scores[node] + self.restart_alpha * propagated

            scores = new_scores

        return scores

    def detect_motifs(self, focal_entity_id: str, current_sim_time: datetime) -> List[Dict[str, Any]]:
        """Detects rapid fan-in, rapid fan-out, high velocity pass-through, and feeder funnels."""
        motifs = []
        if focal_entity_id not in self.graph:
            return motifs

        in_edges = list(self.graph.in_edges(focal_entity_id, data=True))
        out_edges = list(self.graph.out_edges(focal_entity_id, data=True))

        # 1. Rapid Fan-In (Aggregation into Mule): >= 3 remitters within 60 mins
        recent_in = [e for e in in_edges if (current_sim_time - e[2].get("timestamp", current_sim_time)).total_seconds() <= 3600]
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
        recent_out = [e for e in out_edges if (current_sim_time - e[2].get("timestamp", current_sim_time)).total_seconds() <= 1800]
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
            latest_in = max(e[2].get("timestamp", current_sim_time) for e in recent_in)
            earliest_out = min(e[2].get("timestamp", current_sim_time) for e in recent_out)
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

        if current_sim_time.tzinfo is None:
            current_sim_time = current_sim_time.replace(tzinfo=timezone.utc)
        cutoff = current_sim_time - timedelta(hours=window_hours)

        def is_edge_active(edge_data: Dict[str, Any]) -> bool:
            t = edge_data.get("timestamp")
            if not t:
                return True
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            return t >= cutoff

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
                    source=u,
                    target=v,
                    amount_inr=data.get("amount_inr", 0.0),
                    timestamp=data.get("timestamp", current_sim_time),
                    rail=data.get("payment_rail", "UPI"),
                    is_tripwire=data.get("is_tripwire", False)
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
