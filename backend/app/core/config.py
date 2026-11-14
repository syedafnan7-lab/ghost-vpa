import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ghost-VPA Fraud Intelligence Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Binding
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    # Storage
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/ghost_vpa.db")

    # Simulation Defaults
    SIMULATOR_SEED: int = 42
    DEFAULT_SPEED_MULTIPLIER: int = 1
    TICK_INTERVAL_SECONDS: float = 1.0

    # Temporal Graph Engine Parameters
    GRAPH_WINDOW_HOURS: int = 72
    CSLP_DECAY_LAMBDA: float = 0.05
    CSLP_RESTART_ALPHA: float = 0.85
    CSLP_MAX_ITERATIONS: int = 15
    MAX_EGO_NODES: int = 50
    MAX_EGO_DEPTH: int = 2

    # Invariants
    SIMULATION_MODE_ONLY: bool = True
    ALLOW_REAL_PAYMENT_RAILS: bool = False

settings = Settings()
