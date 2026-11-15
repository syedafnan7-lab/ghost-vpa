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
    name: 'Graph & ML Analytics',
    role: 'Temporal multigraph, 72 h sliding window, motifs, CS-LP, LightGBM.',
    modules: ['NetworkX MultiDiGraph', 'Rapid fan-in / fan-out / pass-through motifs', 'Canary-Seeded Label Propagation', 'Graph-Enhanced LightGBM'],
    files: ['backend/app/graph/temporal_engine.py', 'backend/app/ml/dataset_generator.py', 'backend/app/ml/benchmark.py'],
    status: 'implemented',
  },
  {
    index: '03',
    name: 'Persistence & Dossier',
    role: 'Async SQLite (WAL), SHA-256 chained audit, SOP cases, STIX 2.1.',
    modules: ['Async SQLite + SQLAlchemy 2.0', 'Chained cryptographic audit trail', 'RBI 60-day SOP case manager', 'OASIS STIX 2.1 exporter'],
    files: ['backend/app/db/session.py', 'backend/app/core/audit_logger.py', 'backend/app/threat_intel/stix_exporter.py'],
    status: 'implemented',
  },
  {
    index: '04',
    name: 'Analyst Workbench',
    role: 'Operations feed, D3 network explorer, benchmark studio, audit log.',
    modules: ['Live event monitor', 'Force-directed ego network', 'Model benchmark studio', 'Tamper-evident audit view'],
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
    name: 'Pre-routing CBS sidecar intercept',
    status: 'prototype',
    detail: 'In the prototype the attempt is marked TRIPWIRE_TRIGGERED with zero core posting. In a pilot this is the bank CBS hook that stops the posting instruction.',
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
