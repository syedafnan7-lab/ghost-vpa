from typing import List, Dict, Any
from pydantic import BaseModel, Field

class CurvePoint(BaseModel):
    threshold: float
    precision: float
    recall: float
    fpr: float

class ConfusionMatrix(BaseModel):
    true_positive: int
    false_positive: int
    true_negative: int
    false_negative: int

class ModelMetricSummary(BaseModel):
    model_name: str
    precision: float
    recall: float
    f1_score: float
    pr_auc: float
    roc_auc: float
    false_positive_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    confusion_matrix: ConfusionMatrix
    top_features: Dict[str, float]

class BenchmarkResultsResponse(BaseModel):
    dataset_name: str
    total_nodes: int
    total_edges: int
    tabular_baseline: ModelMetricSummary
    graph_enhanced: ModelMetricSummary
    fpr_reduction_pct: float
    precision_lift_pct: float
    curve_data: List[Dict[str, Any]]
