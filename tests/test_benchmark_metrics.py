import asyncio
import pytest
from fastapi import HTTPException
from backend.app.api.cases import take_case_action
from backend.app.api.benchmark import get_benchmark_results
from backend.app.schemas.cases import CaseActionPayload


def test_invalid_historical_benchmark_is_disabled():
    """The legacy synthetic benchmark must not serve unvalidated metrics."""
    with pytest.raises(NotImplementedError, match="withdrawn"):
        from backend.app.ml.benchmark import benchmark_runner
        benchmark_runner.run_benchmark()


def test_case_mutations_are_disabled_even_with_spoofed_supervisor_header():
    """Unauthenticated client data cannot authorize case state changes."""
    async def run():
        with pytest.raises(HTTPException) as raised:
            await take_case_action(
                "CASE-TEST",
                CaseActionPayload(action="CONFIRM_MULE", notes="test", actor_id="spoofed"),
                db=None,
                x_user_role="Supervisor",
            )
        assert raised.value.status_code == 503
    asyncio.run(run())


def test_benchmark_api_is_explicitly_unavailable():
    async def run():
        with pytest.raises(HTTPException) as raised:
            await get_benchmark_results()
        assert raised.value.status_code == 503
    asyncio.run(run())
