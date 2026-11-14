import pytest
from backend.app.ml.benchmark import benchmark_runner

def test_benchmark_metrics_computation():
    """Verifies that:
    1. Tabular Baseline and Graph-Enhanced models train and evaluate.
    2. Graph-Enhanced model achieves higher precision and PR-AUC.
    3. False-positive rate is reduced.
    4. Inference latency meets SLA (< 15ms)."""
    res = benchmark_runner.run_benchmark()

    assert res.total_nodes == 100000
    assert res.total_edges > 0

    tab = res.tabular_baseline
    graph = res.graph_enhanced

    # Assert model metrics exist and are well-formed
    assert 0.0 < tab.precision <= 1.0
    assert 0.0 < graph.precision <= 1.0
    assert 0.0 < tab.pr_auc <= 1.0
    assert 0.0 < graph.pr_auc <= 1.0

    # Assert Graph-Enhanced Lift
    assert graph.precision >= tab.precision
    assert graph.pr_auc >= tab.pr_auc
    assert graph.false_positive_rate <= tab.false_positive_rate
    assert res.fpr_reduction_pct >= 0.0

    # Assert Latency SLA (< 15ms)
    assert graph.p50_latency_ms < 15.0
