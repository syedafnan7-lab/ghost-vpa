import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        if "sqlite" in settings.DATABASE_URL:
            # Enable WAL mode for high concurrency
            await conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            await conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in settings.DATABASE_URL:
            # Safe backward-compatible migrations for existing SQLite schemas
            for col_sql in [
                "ALTER TABLE payment_events ADD COLUMN event_type VARCHAR(32) DEFAULT 'PAYMENT_ATTEMPT';",
                "ALTER TABLE payment_events ADD COLUMN original_event_id VARCHAR(64);",
                "ALTER TABLE investigation_cases ADD COLUMN cluster_id VARCHAR(64);",
                "ALTER TABLE investigation_cases ADD COLUMN connected_mule_count INTEGER DEFAULT 0;",
                "ALTER TABLE investigation_cases ADD COLUMN upstream_feeder_account VARCHAR(64);"
            ]:
                try:
                    await conn.exec_driver_sql(col_sql)
                except Exception:
                    pass
