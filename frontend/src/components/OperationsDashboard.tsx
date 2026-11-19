import React from 'react';
import { 
  ShieldAlert, 
  Target, 
  Users, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Lock,
  ArrowRight,
  ShieldCheck,
  Scale,
  GitFork,
  Share2,
  Radio,
  ExternalLink
} from 'lucide-react';
import { ActiveTab, CanaryItem, CaseDossier, TripwireAlert, GraphOverview } from '../types';

interface OperationsDashboardProps {
  canaries: CanaryItem[];
  cases: CaseDossier[];
  alerts: TripwireAlert[];
  graphOverview: GraphOverview | null;
  setActiveTab: (tab: ActiveTab) => void;
  onRunScenario: (scenario: 'A' | 'B' | 'C' | 'D' | 'E') => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  canaries,
  cases,
  alerts,
  graphOverview,
  setActiveTab,
  onRunScenario
}) => {
  const activeCases = cases.filter(c => c.case_status !== 'CLOSED_UNWITTING_VICTIM' && c.case_status !== 'CLOSED_CONFIRMED_MULE').length;
  const activeCanaries = canaries.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-4">
      {/* 1. Unified Real-Time Telemetry Bar (No cluttered separate cards) */}
      <div className="border-y border-line/80 bg-panel/30 px-2 py-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-line/60">
          {/* Metric 1: Monitored Nodes */}
          <div className="p-2.5 lg:px-3 group">
            <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
              <span>Graph Entities</span>
              <Users className="w-3.5 h-3.5 text-device group-hover:scale-110 transition-transform duration-fast" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-ink tabular-nums">{graphOverview?.total_nodes.toLocaleString() ?? '—'}</span>
              <span className="font-mono text-micro text-benign font-medium">In graph</span>
            </div>
            <div className="font-sans text-micro text-ink3 mt-0.5">Loaded from the temporal graph</div>
          </div>

          {/* Metric 2: Canary Honeypots */}
          <div className="p-2.5 lg:px-3 pt-3 lg:pt-2.5 group">
            <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
              <span>Honeypot Decoys</span>
              <Target className="w-3.5 h-3.5 text-canary group-hover:rotate-45 transition-transform duration-normal" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-canary tabular-nums">{activeCanaries}</span>
              <span className="font-mono text-micro text-ink3">Active VPAs</span>
            </div>
            <div className="font-sans text-micro text-ink3 mt-0.5">Tripwires &amp; Consented Turncoats</div>
          </div>

          {/* Metric 3: Intercepted Attacks */}
          <div className="p-2.5 lg:px-3 pt-3 lg:pt-2.5 group">
            <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
              <span>Open Review Cases</span>
              <ShieldAlert className="w-3.5 h-3.5 text-alarm group-hover:scale-110 transition-transform duration-fast" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-alarm tabular-nums">{activeCases}</span>
              <span className="font-mono text-micro text-ink3 font-semibold">Human review queue</span>
            </div>
            <div className="font-sans text-micro text-ink3 mt-0.5">Loaded from persistent case records</div>
          </div>

          {/* Metric 4: CBS Intercept Latency */}
          <div className="p-2.5 lg:px-3 pt-3 lg:pt-2.5 group">
            <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
              <span>Graph Relationships</span>
              <Zap className="w-3.5 h-3.5 text-benign group-hover:scale-110 transition-transform duration-fast" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-benign tabular-nums">{graphOverview?.total_edges.toLocaleString() ?? '—'}</span>
              <span className="font-mono text-micro text-ink3">Current edges</span>
            </div>
            <div className="font-sans text-micro text-ink3 mt-0.5">Loaded from the temporal graph</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Cockpit Grid: Threat Director (Left 2/3) + Statutory Compliance (Right 1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column: Interactive Scenario Director & Live Stream (2 Columns) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tactical Scenario Director */}
          <div className="border-y border-line/80 bg-panel/25 px-3 py-3 md:px-4">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-line/70">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-canary animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-ink">
                  Deterministic Attack &amp; Defense Scenarios
                </h3>
              </div>
              <span className="font-mono text-micro text-ink3">Reproducible Test Matrix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {/* Scenario A: Tripwire */}
              <div className="group flex min-w-0 flex-col justify-between border-b border-line/60 px-2 py-3 transition-colors hover:bg-panel/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-chip bg-alarm/15 text-alarm group-hover:scale-110 transition-transform duration-fast">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-caption font-bold text-alarm">Scenario A</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-alarm/90">
                      Canary Tripwire
                    </span>
                  </div>
                  <p className="font-sans text-micro text-ink2 mt-2 leading-relaxed">
                    Synthetic mule probes decoy <code className="font-mono text-canary text-[11px]">canary.trap.01@icixbank</code>. Sidecar tags sender for review with ₹0.00 posted.
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario('A')}
                  className="mt-2 self-start inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-caption font-semibold text-alarm hover:bg-alarm/10 active:scale-[0.98] transition-colors"
                >
                  <span>Trigger Tripwire</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Scenario B: Feeder Unmasking */}
              <div className="group flex min-w-0 flex-col justify-between border-b border-line/60 px-2 py-3 transition-colors hover:bg-panel/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-chip bg-feeder/15 text-feeder group-hover:scale-110 transition-transform duration-fast">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-caption font-bold text-feeder">Scenario B</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-feeder/90">
                      Feeder Unmasking
                    </span>
                  </div>
                  <p className="font-sans text-micro text-ink2 mt-2 leading-relaxed">
                    Two synthetic accounts share confirmed upstream credits and canary interactions. The graph traces a feeder candidate <code className="font-mono text-feeder text-[11px]">FEEDER_SYNTH_007</code>.
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario('B')}
                  className="mt-2 self-start inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-caption font-semibold text-feeder hover:bg-feeder/10 active:scale-[0.98] transition-colors"
                >
                  <span>Unmask Feeder</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Scenario C: Benign Merchant False-Positive Guard */}
              <div className="group flex min-w-0 flex-col justify-between border-b border-line/60 px-2 py-3 transition-colors hover:bg-panel/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-chip bg-benign/15 text-benign group-hover:scale-110 transition-transform duration-fast">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-caption font-bold text-benign">Scenario C</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-benign/90">
                      False-Positive Guard
                    </span>
                  </div>
                  <p className="font-sans text-micro text-ink2 mt-2 leading-relaxed">
                    Synthetic merchant payments appear downstream of an investigated account and remain distinct from upstream funding evidence.
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario('C')}
                  className="mt-2 self-start inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-caption font-semibold text-benign hover:bg-benign/10 active:scale-[0.98] transition-colors"
                >
                  <span>Verify Merchant</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Scenario E: End-to-End Investigation */}
              <div className="group flex min-w-0 flex-col justify-between border-b border-line/60 px-2 py-3 transition-colors hover:bg-panel/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-chip bg-canary/15 text-canary group-hover:scale-110 transition-transform duration-fast">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-caption font-bold text-canary">Scenario E</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-canary/90">
                      Full Investigation
                    </span>
                  </div>
                  <p className="font-sans text-micro text-ink2 mt-2 leading-relaxed">
                    Ingest stable synthetic events, trace upstream funding, retain merchant and customer evidence, and open the persisted case.
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario('E')}
                  className="mt-2 self-start inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-caption font-semibold text-canary hover:bg-canary/10 active:scale-[0.98] transition-colors"
                >
                  <span>Run End-to-End</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Scenario D: Layering Network */}
              <div className="group flex min-w-0 flex-col justify-between border-b border-line/60 px-2 py-3 transition-colors hover:bg-panel/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-chip bg-device/15 text-device group-hover:scale-110 transition-transform duration-fast">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-caption font-bold text-device">Scenario D</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-device/90">
                      Layering Chain
                    </span>
                  </div>
                  <p className="font-sans text-micro text-ink2 mt-2 leading-relaxed">
                    4-hop syndicate transfer chain revealing rapid velocity &amp; amount conservation across intermediate money hops.
                  </p>
                </div>
                <button
                  onClick={() => onRunScenario('D')}
                  className="mt-2 self-start inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-caption font-semibold text-device hover:bg-device/10 active:scale-[0.98] transition-colors"
                >
                  <span>Trace 4-Hop Ring</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Feed (Recent Honeypot Interceptions) */}
          <div className="border-y border-line/80 bg-panel/25 px-3 py-3 md:px-4">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-line/70">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-canary animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-ink">Recent Honeypot Tripwire Interceptions</h3>
              </div>
              <button 
                onClick={() => setActiveTab('monitor')}
                className="group text-caption font-mono text-canary hover:underline flex items-center gap-1 transition-colors"
              >
                <span>Live Ingestion Rail</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8 text-ink3 text-caption font-mono bg-void/40 rounded-card border border-line/60">
                Awaiting canary interactions.
                <div className="mt-1">
                  Run a synthetic scenario to populate the local simulation view.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {alerts.slice(0, 4).map((a) => (
                  <div 
                    key={a.alert_id} 
                    className="group flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-panel/45"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-alarm animate-pulse shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-caption font-bold text-alarm">{a.sender_account_id}</span>
                          <span className="text-micro text-ink3">targeted</span>
                          <span className="font-mono text-caption text-canary font-semibold">{a.canary_vpa}</span>
                        </div>
                        <div className="flex items-center gap-3 text-micro font-mono text-ink3 mt-0.5">
                          <span>₹{a.amount_inr.toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-canary">REVIEW_REQUIRED</span>
                          <span>•</span>
                          <span className="text-benign">0 Ledger Impact</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveTab('workbench')}
                        className="px-2.5 py-1 bg-raised hover:bg-raised/80 text-ink text-micro font-mono rounded-chip border border-line active:scale-95 transition-all"
                      >
                        Case Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statutory RBI 60-Day SLA & Triage Queue (1 Column) */}
        <div className="space-y-4">
          {/* Statutory SLA Stepper Card */}
          <div className="border-y border-line/80 bg-panel/25 px-3 py-3 md:px-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-canary" />
                  <h3 className="font-display text-sm font-semibold text-ink">Draft SOP Timeline Simulation</h3>
                </div>
                <span className="whitespace-nowrap font-mono text-micro uppercase tracking-wide text-ink3">
                  Prototype
                </span>
              </div>

              {/* 3-Stage Visual Pipeline */}
              <div className="mt-3 space-y-3">
                {/* Stage 1 */}
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-benign/15 text-benign shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-micro text-ink font-semibold block">STAGE 1: SYNTHETIC CANARY MATCH</span>
                    <p className="font-sans text-micro text-ink3 leading-relaxed mt-0.5">
                      A synthetic interaction creates REVIEW_REQUIRED. No live payment is intercepted.
                    </p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-canary/15 text-canary shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-micro text-ink font-semibold block">STAGE 2: DRAFT-PROPOSAL TIMELINE</span>
                    <p className="font-sans text-micro text-ink3 leading-relaxed mt-0.5">
                      A displayed simulation value; September 2026 RBI KYC amendment directions remain a draft proposal.
                    </p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-canary/15 text-canary shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-micro text-ink font-semibold block">STAGE 3: HOLD ACTION DISABLED</span>
                    <p className="font-sans text-micro text-ink3 leading-relaxed mt-0.5">
                      No hold or external filing is performed. Generated STIX/FIU/NCRP content is prototype output only.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Workbench Action */}
            <div className="mt-5 pt-4 border-t border-line">
              <button
                onClick={() => setActiveTab('workbench')}
                className="group w-full py-2.5 px-3 bg-canary hover:bg-canary/90 text-void font-mono text-caption font-bold rounded-chip transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Manage Investigation Cases ({activeCases})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Cryptographic Audit Trail Card */}
          <div className="border-y border-line/80 bg-panel/25 px-3 py-3 md:px-4">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-canary" />
                <h4 className="font-display text-sm font-semibold text-ink">Forensic Ledger Hash</h4>
              </div>
              <span className="font-mono text-micro text-benign">SHA-256 INTACT</span>
            </div>
            <p className="font-sans text-micro text-ink3 leading-relaxed">
              Every supervisor hold, victim relief action, and tripwire trigger forms an immutable cryptographic block hash:
            </p>
            <div className="mt-2.5 p-2 bg-void/80 rounded-chip border border-line font-mono text-[11px] text-canary truncate">
              hash_i = SHA256(prev_hash | ts | actor | action | entity)
            </div>
            <button
              onClick={() => setActiveTab('audit')}
              className="mt-3 text-caption font-mono text-ink2 hover:text-ink flex items-center gap-1 transition-colors"
            >
              <span>Inspect Chained Blocks</span>
              <ExternalLink className="w-3 h-3 text-canary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
