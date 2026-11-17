from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/benchmark", tags=["Machine Learning Benchmark"])

@router.get("/results")
async def get_benchmark_results():
    """The prior synthetic benchmark is withdrawn pending valid evaluation."""
    raise HTTPException(
        status_code=503,
        detail="Benchmark results are unavailable: the prior generator did not construct a graph and used an invalid split.",
    )
