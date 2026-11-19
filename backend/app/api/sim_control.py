from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from backend.app.core.simulation_clock import clock
from backend.app.simulator.rail import simulator

router = APIRouter(prefix="/api/v1/sim", tags=["Simulation Control"])

class SimControlRequest(BaseModel):
    action: Literal["play", "pause", "resume", "reset", "set_speed", "run_scenario"]
    speed: Optional[int] = None
    scenario: Optional[Literal["A", "B", "C", "D", "E"]] = None

class SimStatusResponse(BaseModel):
    is_paused: bool
    speed_multiplier: int
    current_sim_time: str

@router.get("/status", response_model=SimStatusResponse)
async def get_simulation_status():
    return SimStatusResponse(
        is_paused=clock.is_paused(),
        speed_multiplier=clock.speed(),
        current_sim_time=clock.now().isoformat()
    )

@router.post("/control")
async def control_simulation(payload: SimControlRequest):
    if payload.action == "pause":
        clock.pause()
    elif payload.action in ("play", "resume"):
        clock.resume()
        simulator.start()
    elif payload.action == "reset":
        clock.reset()
    elif payload.action == "set_speed" and payload.speed:
        clock.set_speed(payload.speed)
    elif payload.action == "run_scenario":
        if payload.scenario == "A":
            res = await simulator.run_scenario_a_tripwire()
            return {"status": "SUCCESS", "scenario": "A", "result": res}
        elif payload.scenario == "B":
            res = await simulator.run_scenario_b_shared_feeder()
            return {"status": "SUCCESS", "scenario": "B", "result": res}
        elif payload.scenario == "C":
            res = await simulator.run_scenario_c_benign_lookalike()
            return {"status": "SUCCESS", "scenario": "C", "result": res}
        elif payload.scenario == "D":
            res = await simulator.run_scenario_d_multihop_network()
            return {"status": "SUCCESS", "scenario": "D", "result": res}
        elif payload.scenario == "E":
            res = await simulator.run_scenario_e_end_to_end_investigation()
            return {"status": "SUCCESS", "scenario": "E", "result": res}
        else:
            raise HTTPException(status_code=400, detail="Invalid scenario specified")

    return {
        "status": "UPDATED",
        "is_paused": clock.is_paused(),
        "speed": clock.speed(),
        "current_sim_time": clock.now().isoformat()
    }
