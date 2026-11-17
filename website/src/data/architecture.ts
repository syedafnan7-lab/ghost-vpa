export type BoundaryStatus = 'implemented' | 'prototype' | 'proposed';

export interface Tier {
  index: string;
  name: string;
  role: string;
  modules: string[];
  files: string[];
  status: BoundaryStatus;
}

export const TIERS: Tier[] = [
  {
    index: '01',
    name: 'Simulation & Ingestion',
    role: 'Deterministic rail, O(1) canary lookup, sub-5 ms fast triage.',
    modules: ['SimulationClock singleton', 'Multi-bank rail (HDFX / ICIX / SBINX / AXSX)', 'Honeypot registry', 'REVIEW_REQUIRED triage'],
    files: ['backend/app/simulator/rail.py', 'backend/app/core/simulation_clock.py', 'backend/app/core/honeypot_registry.py'],
    status: 'implemented',
  },
  {
    index: '02',
    name: 'Temporal Graph Investigation',
    role: 'In-memory temporal graph and selected scenario-based propagation.',
    modules: ['NetworkX MultiDiGraph', '72-hour event window', 'Canary interaction seeds', 'Synthetic topology scenarios'],
    files: ['backend/app/graph/temporal_engine.py', 'backend/app/ml/dataset_generator.py', 'backend/app/ml/benchmark.py'],
    status: 'implemented',
  },
  {
    index: '03',
    name: 'Persistence & Dossier',
    role: 'SQLite/WAL persistence, audit chain, prototype cases, and export.',
    modules: ['Async SQLite + SQLAlchemy 2.0', 'Chained audit log', 'Read-only case dossiers', 'Prototype STIX bundle exporter'],
    files: ['backend/app/db/session.py', 'backend/app/core/audit_logger.py', 'backend/app/threat_intel/stix_exporter.py'],
    status: 'implemented',
  },
  {
    index: '04',
    name: 'Analyst Workbench',
    role: 'Synthetic operations feed, D3 network explorer, withdrawn benchmark status, audit view.',
    modules: ['Simulated event monitor', 'Force-directed ego network', 'Benchmark withdrawal notice', 'Audit-chain view'],
    files: ['frontend/src/components/OperationsDashboard.tsx', 'frontend/src/components/NetworkExplorer.tsx', 'frontend/src/components/ModelBenchmarking.tsx'],
    status: 'implemented',
  },
];

export interface Boundary {
  name: string;
  status: BoundaryStatus;
  detail: string;
}

export const BOUNDARIES: Boundary[] = [
  {
    name: 'Passive payment event mirror',
    status: 'proposed',
    detail: 'Kafka topic upi.events.inbound.v1 or a low-latency gRPC stream carrying stripped metadata. Read-only; never blocks settlement.',
  },
  {
    name: 'Simulated canary triage',
    status: 'prototype',
    detail: 'The simulator marks a canary interaction TRIPWIRE_TRIGGERED and moves no real funds. A pilot hook is unimplemented and requires bank, legal, security, and rail approvals.',
  },
  {
    name: 'Lien / GL routing',
    status: 'proposed',
    detail: 'A pilot could route a canary-bound credit to a dedicated GL code under a debit-hold posting restriction. Not implemented; shown as a governance-gated integration.',
  },
  {
    name: 'NCRP-CFCFRMS connector',
    status: 'prototype',
    detail: 'The workbench emits a standardized JSON dossier. A production connector would sign and submit it through the I4C channel.',
  },
  {
    name: 'FIU-IND STR narrative',
    status: 'prototype',
    detail: 'The case dossier generates a structured STR narrative. Filing remains a human, supervised act.',
  },
  {
    name: 'STIX 2.1 / TAXII sharing',
    status: 'prototype',
    detail: 'Bundles are generated and validated with x_ghostvpa_synthetic = true. Cross-bank sharing would run over a bank CTI channel.',
  },
];

export const STATUS_LABEL: Record<BoundaryStatus, string> = {
  implemented: 'Implemented',
  prototype: 'Prototype (simulated)',
  proposed: 'Proposed pilot',
};
