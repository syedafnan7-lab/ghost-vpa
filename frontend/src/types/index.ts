export type ActiveTab = 
  | 'operations'
  | 'monitor'
  | 'network'
  | 'workbench'
  | 'canaries'
  | 'benchmarks'
  | 'audit';

export type UserRole = 'Analyst' | 'Supervisor' | 'Auditor';

export interface CanaryItem {
  canary_id: string;
  vpa: string;
  designated_bank: string;
  canary_type: string;
  status: string;
  created_at: string;
  hit_count: number;
  synthetic_tag: boolean;
  purpose: string;
}

export interface PaymentAttempt {
  event_id: string;
  timestamp: string;
  sender_account_id: string;
  sender_vpa: string;
  sender_bank: string;
  beneficiary_vpa: string;
  beneficiary_bank: string;
  amount_inr: number;
  payment_rail: string;
  is_canary_hit: boolean;
  simulated_result: string;
  sender_status: string;
  event_type?: string;
  original_event_id?: string | null;
  zero_funds_transferred?: boolean;
}

export interface TripwireAlert {
  alert_id: string;
  event_id: string;
  timestamp: string;
  canary_vpa: string;
  sender_account_id: string;
  sender_vpa: string;
  sender_bank: string;
  amount_inr: number;
  device_token: string;
  risk_level: string;
  zero_funds_verified: boolean;
}

export interface CaseDossier {
  case_id: string;
  target_account_id: string;
  target_vpa: string;
  target_bank: string;
  originating_alert_id: string;
  case_status: string;
  sop_day_counter: number;
  explanation_days_left: number;
  assigned_analyst: string;
  cluster_id?: string;
  connected_mule_count: number;
  upstream_feeder_account?: string;
  created_at: string;
  updated_at: string;
  analyst_notes: string[];
  audit_hash: string;
  fiu_str_narrative: string;
  ncrp_payload_preview: Record<string, any>;
}

export interface CaseEvidenceEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  original_event_id?: string | null;
  sender_account_id: string;
  beneficiary_account_id?: string | null;
  beneficiary_vpa: string;
  amount_inr: number;
  is_canary_hit: boolean;
  simulated_result: string;
  zero_funds_transferred: boolean;
}

export interface GraphOverview {
  total_nodes: number;
  total_edges: number;
  canary_nodes_count: number;
  sliding_window_hours: number;
}

export interface GraphNodeItem {
  id: string;
  label: string;
  type: 'CANARY' | 'SENDER_MULE' | 'FEEDER_NODE' | 'BENIGN_ACCOUNT' | 'DEVICE_TOKEN';
  bank?: string;
  risk_score: number;
  cslp_score: number;
  is_seed: boolean;
  in_degree: number;
  out_degree: number;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdgeItem {
  event_id: string;
  original_event_id?: string | null;
  source: string | GraphNodeItem;
  target: string | GraphNodeItem;
  amount_inr: number;
  timestamp: string;
  rail: string;
  is_tripwire: boolean;
  is_financial: boolean;
  event_type: string;
  is_reversed: boolean;
}

export interface EgoGraphData {
  focal_entity_id: string;
  depth: number;
  total_nodes: number;
  total_edges: number;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  detected_motifs: Array<{
    type: string;
    severity: string;
    description: string;
    [key: string]: any;
  }>;
}

export interface BenchmarkMetrics {
  dataset_name: string;
  total_nodes: number;
  total_edges: number;
  rules_baseline: {
    model_name: string;
    precision: number;
    recall: number;
    f1_score: number;
    pr_auc: number;
    roc_auc: number;
    false_positive_rate: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms?: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    top_features: Record<string, number>;
  };
  tabular_baseline: {
    model_name: string;
    precision: number;
    recall: number;
    f1_score: number;
    pr_auc: number;
    roc_auc: number;
    false_positive_rate: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms?: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    top_features: Record<string, number>;
  };
  graph_enhanced: {
    model_name: string;
    precision: number;
    recall: number;
    f1_score: number;
    pr_auc: number;
    roc_auc: number;
    false_positive_rate: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms?: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    top_features: Record<string, number>;
  };
  fpr_reduction_pct: number;
  precision_lift_pct: number;
  curve_data: Array<{
    threshold: number;
    tab_precision: number;
    tab_recall: number;
    graph_precision: number;
    graph_recall: number;
  }>;
  feature_importance_type?: string;
  evaluation_protocol?: string;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_id: string;
  details: Record<string, any>;
  prev_hash: string;
  current_hash: string;
}
