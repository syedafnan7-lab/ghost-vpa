import json
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models import AlertModel
from backend.app.db.session import get_db
from backend.app.schemas.alerts import TripwireAlertPayload

router = APIRouter(prefix="/api/v1/alerts", tags=["Canary Interaction Alerts"])


@router.get("", response_model=List[TripwireAlertPayload])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertModel).order_by(AlertModel.timestamp.desc()).limit(100))
    alerts = result.scalars().all()
    return [TripwireAlertPayload(
        alert_id=alert.alert_id,
        event_id=alert.event_id,
        timestamp=alert.timestamp,
        canary_id=alert.canary_id,
        canary_vpa=alert.canary_vpa,
        sender_account_id=alert.sender_account_id,
        sender_vpa=alert.sender_vpa,
        sender_bank=alert.sender_bank,
        amount_inr=alert.amount_inr,
        device_token=alert.device_token,
        risk_level=alert.risk_level or "HIGH",
        status=alert.status or "NEW",
        detection_latency_ms=alert.detection_latency_ms or 0.0,
        zero_funds_verified=bool(alert.zero_funds_verified),
        context_metadata=json.loads(alert.context_metadata or "{}"),
    ) for alert in alerts]
