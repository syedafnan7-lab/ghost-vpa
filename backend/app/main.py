from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import init_db, AsyncSessionLocal
from backend.app.core.honeypot_registry import honeypot_registry
from backend.app.simulator.rail import simulator
from backend.app.api.ingestion import router as ingestion_router
from backend.app.api.sim_control import router as sim_router
from backend.app.api.canaries import router as canaries_router
from backend.app.api.graph import router as graph_router
from backend.app.api.cases import router as cases_router
from backend.app.api.benchmark import router as benchmark_router
from backend.app.api.audit import router as audit_router
from backend.app.api.websocket import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite Database & Tables
    await init_db()

    # 2. Rehydrate / Seed Honeypot Registry Cache
    async with AsyncSessionLocal() as db:
        await honeypot_registry.initialize(db)

    # 3. Start Payment Rail Simulator
    simulator.start()

    yield

    # Shutdown
    simulator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Bank-Controlled Honeypot VPAs & Canary-Seeded Graph Intelligence Platform (Track 1: Digital Payments Fraud)",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Subsystem Routers
app.include_router(ingestion_router)
app.include_router(sim_router)
app.include_router(canaries_router)
app.include_router(graph_router)
app.include_router(cases_router)
app.include_router(benchmark_router)
app.include_router(audit_router)
app.include_router(ws_router)

@app.get("/healthz", tags=["System"])
async def healthz():
    return {
        "status": "HEALTHY",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "mode": "SIMULATION_ZERO_REAL_FUNDS"
    }
