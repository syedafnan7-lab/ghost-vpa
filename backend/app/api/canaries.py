from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.core.honeypot_registry import honeypot_registry
from backend.app.schemas.canary import CanaryVPARegister, CanaryVPAResponse

router = APIRouter(prefix="/api/v1/canaries", tags=["Honeypot Registry"])

@router.get("", response_model=List[CanaryVPAResponse])
async def list_canaries(db: AsyncSession = Depends(get_db)):
    return await honeypot_registry.list_canaries(db)

@router.post("", response_model=CanaryVPAResponse)
async def register_canary(data: CanaryVPARegister, db: AsyncSession = Depends(get_db)):
    return await honeypot_registry.register_canary(data, db)
