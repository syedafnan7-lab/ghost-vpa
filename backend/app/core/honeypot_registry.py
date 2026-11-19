import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.models import CanaryModel
from backend.app.schemas.canary import CanaryVPAResponse, CanaryVPARegister

class HoneypotRegistry:
    def __init__(self):
        # In-memory fast cache for O(1) tripwire lookup
        self._active_canary_vpas: set[str] = set()
        self._canary_cache: Dict[str, CanaryModel] = {}

    async def initialize(self, db: AsyncSession):
        """Loads canaries from DB into fast memory cache. Seeds defaults if table is empty."""
        stmt = select(CanaryModel)
        result = await db.execute(stmt)
        canaries = result.scalars().all()

        if not canaries:
            default_canaries = [
                CanaryModel(
                    canary_id="CANARY-BLR-001",
                    vpa="canary.trap.01@icixbank",
                    designated_bank="ICIX",
                    canary_type="REGULATORY_TRIPWIRE",
                    status="ACTIVE",
                    purpose="Regulatory Honeypot for Southern Region Mule Detection",
                    hit_count=0,
                    synthetic_tag=True,
                    created_at=datetime.now(timezone.utc)
                ),
                CanaryModel(
                    canary_id="CANARY-MUM-002",
                    vpa="canary.alert.02@hdfxbank",
                    designated_bank="HDFX",
                    canary_type="REGULATORY_TRIPWIRE",
                    status="ACTIVE",
                    purpose="Layering Trap for High-Velocity Rapid Splits",
                    hit_count=0,
                    synthetic_tag=True,
                    created_at=datetime.now(timezone.utc)
                ),
                CanaryModel(
                    canary_id="CANARY-DEL-003",
                    vpa="canary.tripwire.03@sbinxbank",
                    designated_bank="SBINX",
                    canary_type="REGULATORY_TRIPWIRE",
                    status="ACTIVE",
                    purpose="Canary for Micro-Transfer Penny-Drop Probing",
                    hit_count=0,
                    synthetic_tag=True,
                    created_at=datetime.now(timezone.utc)
                ),
                CanaryModel(
                    canary_id="CANARY-SOP-004",
                    vpa="turncoat.surrender.04@axsxbank",
                    designated_bank="AXSX",
                    canary_type="CONSENTED_TURNCOAT",
                    status="ACTIVE",
                    purpose="Consented Surrendered VPA under RBI 20-Day Explanation Window",
                    hit_count=0,
                    synthetic_tag=True,
                    created_at=datetime.now(timezone.utc)
                )
            ]
            for c in default_canaries:
                db.add(c)
            await db.commit()
            stmt = select(CanaryModel)
            result = await db.execute(stmt)
            canaries = result.scalars().all()

        self._active_canary_vpas.clear()
        self._canary_cache.clear()
        for c in canaries:
            self._canary_cache[c.vpa.lower()] = c
            if c.status == "ACTIVE":
                self._active_canary_vpas.add(c.vpa.lower())

    async def ensure_demo_canary(self, db: AsyncSession) -> CanaryModel:
        """Create the stable, reserved synthetic endpoint used by Scenario E."""
        stmt = select(CanaryModel).where(CanaryModel.canary_id == "CANARY_VPA_001")
        result = await db.execute(stmt)
        canary = result.scalars().first()
        if canary is None:
            stmt = select(CanaryModel).where(CanaryModel.vpa == "canary_vpa_001@synthetic.test")
            result = await db.execute(stmt)
            canary = result.scalars().first()
        if canary is None:
            canary = CanaryModel(
                canary_id="CANARY_VPA_001",
                vpa="canary_vpa_001@synthetic.test",
                designated_bank="SYNTH",
                canary_type="REGULATORY_TRIPWIRE",
                status="ACTIVE",
                purpose="Deterministic end-to-end synthetic investigation scenario",
                hit_count=0,
                synthetic_tag=True,
                created_at=datetime(2026, 11, 14, 9, 0, tzinfo=timezone.utc),
            )
            db.add(canary)
            await db.commit()
        elif canary.status != "ACTIVE":
            canary.status = "ACTIVE"
            await db.commit()
        await self.initialize(db)
        return self.get_canary_by_vpa(canary.vpa) or canary

    def is_canary(self, vpa: str) -> bool:
        """Sub-microsecond O(1) in-memory check."""
        return vpa.lower() in self._active_canary_vpas

    def get_canary_by_vpa(self, vpa: str) -> Optional[CanaryModel]:
        return self._canary_cache.get(vpa.lower())

    async def record_hit(self, vpa: str, db: AsyncSession, commit: bool = True):
        """Increments hit count while keeping canary ACTIVE so ongoing probes are tracked."""
        c = self._canary_cache.get(vpa.lower())
        if c:
            stmt = select(CanaryModel).where(CanaryModel.canary_id == c.canary_id)
            res = await db.execute(stmt)
            db_canary = res.scalars().first()
            if db_canary:
                db_canary.hit_count += 1
                if commit:
                    await db.commit()
                    c.hit_count = db_canary.hit_count

    async def register_canary(self, data: CanaryVPARegister, db: AsyncSession) -> CanaryVPAResponse:
        canary_id = f"CANARY-{uuid.uuid4().hex[:8].upper()}"
        model = CanaryModel(
            canary_id=canary_id,
            vpa=data.vpa.lower(),
            designated_bank=data.designated_bank.upper(),
            canary_type=data.canary_type,
            status="ACTIVE",
            purpose=data.purpose,
            hit_count=0,
            synthetic_tag=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(model)
        await db.commit()
        await db.refresh(model)

        self._canary_cache[model.vpa.lower()] = model
        self._active_canary_vpas.add(model.vpa.lower())

        return CanaryVPAResponse(
            canary_id=model.canary_id,
            vpa=model.vpa,
            designated_bank=model.designated_bank,
            canary_type=model.canary_type,
            status=model.status,
            created_at=model.created_at,
            hit_count=model.hit_count,
            synthetic_tag=model.synthetic_tag,
            purpose=model.purpose
        )

    async def list_canaries(self, db: AsyncSession) -> List[CanaryVPAResponse]:
        stmt = select(CanaryModel)
        result = await db.execute(stmt)
        canaries = result.scalars().all()
        return [
            CanaryVPAResponse(
                canary_id=c.canary_id,
                vpa=c.vpa,
                designated_bank=c.designated_bank,
                canary_type=c.canary_type,
                status=c.status,
                created_at=c.created_at,
                hit_count=c.hit_count,
                synthetic_tag=c.synthetic_tag,
                purpose=c.purpose
            )
            for c in canaries
        ]

honeypot_registry = HoneypotRegistry()
