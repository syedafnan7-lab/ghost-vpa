from fastapi import APIRouter, Query, HTTPException
from backend.app.graph.temporal_engine import temporal_graph
from backend.app.core.simulation_clock import clock
from backend.app.schemas.graph import EgoGraphResponse

router = APIRouter(prefix="/api/v1/graph", tags=["Temporal Graph Intelligence"])

@router.get("/ego/{entity_id}", response_model=EgoGraphResponse)
async def get_ego_graph(
    entity_id: str,
    depth: int = Query(2, ge=1, le=3),
    max_nodes: int = Query(50, ge=5, le=100),
    window_hours: int = Query(72, ge=1, le=168)
):
    """Returns bounded ego-network around focal entity (sender, feeder, canary) for interactive D3 rendering."""
    sim_time = clock.now()
    response = temporal_graph.get_ego_subgraph(
        focal_id=entity_id,
        current_sim_time=sim_time,
        max_depth=depth,
        max_nodes=max_nodes,
        window_hours=window_hours
    )
    return response

@router.get("/overview")
async def get_graph_overview():
    """Returns summary stats of in-memory temporal graph."""
    return {
        "total_nodes": temporal_graph.graph.number_of_nodes(),
        "total_edges": temporal_graph.graph.number_of_edges(),
        "canary_nodes_count": len(temporal_graph.canary_nodes),
        "sliding_window_hours": temporal_graph.window_hours
    }
