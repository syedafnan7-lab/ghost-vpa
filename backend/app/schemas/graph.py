from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

NodeType = Literal["CANARY", "SENDER_MULE", "FEEDER_NODE", "BENIGN_ACCOUNT", "DEVICE_TOKEN"]

class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    bank: Optional[str] = None
    risk_score: float = 0.0
    cslp_score: float = 0.0
    is_seed: bool = False
    in_degree: int = 0
    out_degree: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    event_id: str
    original_event_id: Optional[str] = None
    source: str
    target: str
    amount_inr: float
    timestamp: datetime
    delta_t_sec: Optional[float] = None
    rail: str = "UPI"
    is_tripwire: bool = False
    is_financial: bool = False
    event_type: str = "PAYMENT_ATTEMPT"
    is_reversed: bool = False

class EgoGraphResponse(BaseModel):
    focal_entity_id: str
    depth: int
    total_nodes: int
    total_edges: int
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    detected_motifs: List[Dict[str, Any]] = Field(default_factory=list)
