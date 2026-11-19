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
from backend.app.api.alerts import router as alerts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite Database & Tables
    await init_db()

    # 2. Rehydrate / Seed Honeypot Registry Cache & Temporal Graph
    async with AsyncSessionLocal() as db:
        await honeypot_registry.initialize(db)

        from backend.app.db.models import PaymentEventModel
        from sqlalchemy.future import select
        from datetime import timedelta, timezone
        from backend.app.core.simulation_clock import clock
        from backend.app.schemas.events import PaymentAttemptEvent
        from backend.app.graph.temporal_engine import temporal_graph

        sim_now = clock.now()
        cutoff = sim_now - timedelta(hours=settings.GRAPH_WINDOW_HOURS)
        stmt = (
            select(PaymentEventModel)
            .where(PaymentEventModel.timestamp >= cutoff)
            .order_by(PaymentEventModel.timestamp.asc())
        )
        result = await db.execute(stmt)
        events = result.scalars().all()
        if events:
            latest_event_time = max(ev.timestamp for ev in events)
            if latest_event_time.tzinfo is None:
                latest_event_time = latest_event_time.replace(tzinfo=timezone.utc)
            clock.advance_to(latest_event_time)
            sim_now = clock.now()
        for ev in events:
            attempt = PaymentAttemptEvent(
                event_id=ev.event_id,
                timestamp=ev.timestamp,
                sender_account_id=ev.sender_account_id,
                sender_vpa=ev.sender_vpa,
                sender_bank=ev.sender_bank,
                beneficiary_account_id=ev.beneficiary_account_id,
                beneficiary_vpa=ev.beneficiary_vpa,
                beneficiary_bank=ev.beneficiary_bank,
                amount_inr=ev.amount_inr,
                payment_rail=ev.payment_rail or "UPI",
                attempt_type=ev.attempt_type or "P2P",
                event_type=getattr(ev, "event_type", "PAYMENT_ATTEMPT") or "PAYMENT_ATTEMPT",
                original_event_id=getattr(ev, "original_event_id", None),
                device_token=ev.device_token,
                ip_subnet=ev.ip_subnet or "10.0.0.0/24",
                is_canary_hit=ev.is_canary_hit,
                simulated_result=ev.simulated_result or "SETTLED_NORMAL",
                zero_funds_transferred=ev.zero_funds_transferred
            )
            temporal_graph.add_transaction_edge(attempt, prune=False)
        temporal_graph.prune_expired_edges(sim_now)

    # 3. Start Payment Rail Simulator
    if settings.SIMULATOR_AUTOSTART:
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
    allow_origins=settings.CORS_ORIGINS,
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
app.include_router(alerts_router)

@app.get("/healthz", tags=["System"])
async def healthz():
    return {
        "status": "HEALTHY",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "mode": "SIMULATION_ZERO_REAL_FUNDS"
    }
