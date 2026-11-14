from fastapi import APIRouter
from backend.app.ml.benchmark import benchmark_runner
from backend.app.schemas.benchmark import BenchmarkResultsResponse

router = APIRouter(prefix="/api/v1/benchmark", tags=["Machine Learning Benchmark"])

@router.get("/results", response_model=BenchmarkResultsResponse)
async def get_benchmark_results():
    """Returns empirical metrics comparing Tabular LightGBM Baseline vs Graph-Enhanced Challenger on 100k-node network."""
    return benchmark_runner.run_benchmark()
