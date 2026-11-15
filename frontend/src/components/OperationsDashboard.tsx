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
  Scale
} from 'lucide-react';
import { ActiveTab, CanaryItem, CaseDossier, TripwireAlert } from '../types';

interface OperationsDashboardProps {
  canaries: CanaryItem[];
  cases: CaseDossier[];
  alerts: TripwireAlert[];
  setActiveTab: (tab: ActiveTab) => void;
  onRunScenario: (scenario: 'A' | 'B' | 'C' | 'D') => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  canaries,
  cases,
  alerts,
  setActiveTab,
  onRunScenario
}) => {
  const totalHits = canaries.reduce((sum, c) => sum + c.hit_count, 0) + alerts.length;
  const activeCases = cases.filter(c => c.case_status !== 'CLOSED_UNWITTING_VICTIM' && c.case_status !== 'CLOSED_CONFIRMED_MULE').length;

  return (
    <div className="space-y-6">
      {/* Top Regulatory Sandbox Institutional Panel */}
      <div className="bg-panel border border-line rounded-panel p-5 relative overflow-hidden shadow-panel">
        <div className="absolute top-0 right-0 w-80 h-32 bg-canary/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-micro uppercase tracking-wider px-2 py-0.5 rounded-chip bg-canary/10 text-canary border border-canary/20 font-semibold">
                RBI September 2026 Draft KYC Directions • Annex III SOP
              </span>
              <span className="font-mono text-micro text-ink3 hidden sm:inline">
                Simulated Pre-Routing Interdiction Rail
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
              Operational Cyber-Deception &amp; Canary-Seeded Interdiction Environment
            </h2>
            <p className="font-sans text-caption text-ink2 max-w-4xl leading-relaxed">
              Canary interactions trigger immediate operational flags (<code className="font-mono text-canary font-semibold">REVIEW_REQUIRED</code>) with zero real funds movement. 
              The pre-routing CBS sidecar intercepts transactions before ledger posting, preserving evidence for statutory 20-day customer explanation notices and 60-day maximum holds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
            <div className="text-right">
              <div className="font-mono text-micro uppercase tracking-wider text-ink3">SLA Status</div>
              <div className="font-mono text-caption text-benign font-semibold">100% IN COMPLIANCE</div>
            </div>
            <div className="h-8 w-px bg-line" />
            <button
              onClick={() => setActiveTab('audit')}
              className="px-3 py-1.5 rounded-chip bg-raised hover:bg-raised/80 text-ink text-caption font-mono border border-line flex items-center gap-1.5 transition-colors"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="w-3 h-3 text-canary" />
            </button>
          </div>
        </div>

        {/* Statutory Pillars Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-line">
          <div className="flex items-center gap-2 text-caption">
            <ShieldCheck className="w-4 h-4 text-benign shrink-0" />
            <span className="font-mono text-micro text-ink3">RULE 01:</span>
            <span className="text-ink font-medium">Pre-Routing CBS Sidecar (Zero Core Ledger Posting)</span>
          </div>
          <div className="flex items-center gap-2 text-caption">
            <Clock className="w-4 h-4 text-canary shrink-0" />
            <span className="font-mono text-micro text-ink3">RULE 02:</span>
            <span className="text-ink font-medium">Mandatory 20-Day Customer Explanation Notice</span>
          </div>
          <div className="flex items-center gap-2 text-caption">
            <Scale className="w-4 h-4 text-canary shrink-0" />
            <span className="font-mono text-micro text-ink3">RULE 03:</span>
            <span className="text-ink font-medium">Strict 60-Day Maximum Statutory Hold SLA</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Styled like Showcase Hero Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Entities */}
        <div className="bg-panel border border-line hover:border-line-strong rounded-panel p-4 shadow-panel transition-all">
          <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
            <span>Synthetic Monitored Network</span>
            <Users className="w-3.5 h-3.5 text-device" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-ink tabular-nums">100,000</span>
            <span className="text-micro font-mono text-benign font-medium">Nodes</span>
          </div>
          <p className="font-sans text-micro text-ink3 mt-1.5">
            85k Retail • 10k MSME • 4,950 Mules • 50 Canaries
          </p>
        </div>

        {/* Canary Honeypots */}
        <div className="bg-panel border border-line hover:border-line-strong rounded-panel p-4 shadow-panel transition-all">
          <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
            <span>Active Canary Honeypots</span>
            <Target className="w-3.5 h-3.5 text-canary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-canary tabular-nums">{canaries.length}</span>
            <span className="text-micro font-mono text-ink3">Deployed VPAs</span>
          </div>
          <p className="font-sans text-micro text-ink3 mt-1.5">
            Bank Regulatory Tripwires &amp; Consented Turncoats
          </p>
        </div>

        {/* Intercepted Canary Hits */}
        <div className="bg-panel border border-line hover:border-line-strong rounded-panel p-4 shadow-panel transition-all">
          <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
            <span>Canary Probes Intercepted</span>
            <AlertTriangle className="w-3.5 h-3.5 text-alarm" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-alarm tabular-nums">{totalHits}</span>
            <span className="text-micro font-mono text-benign font-medium">₹0.00 Lost</span>
          </div>
          <p className="font-sans text-micro text-ink3 mt-1.5">
            Zero Real Funds Leaked • CBS Sidecar Intercept
          </p>
        </div>

        {/* Triage Latency SLA */}
        <div className="bg-panel border border-line hover:border-line-strong rounded-panel p-4 shadow-panel transition-all">
          <div className="flex items-center justify-between font-mono text-micro text-ink3 uppercase tracking-wider">
            <span>Triage Latency SLA</span>
            <Zap className="w-3.5 h-3.5 text-benign" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-benign tabular-nums">&lt; 3.8 ms</span>
            <span className="text-micro font-mono text-ink3">Target: &lt; 15 ms</span>
          </div>
          <p className="font-sans text-micro text-ink3 mt-1.5">
            O(1) Hash Map Pre-Routing • Async Graph Queue
          </p>
        </div>
      </div>

      {/* Deterministic Demonstration Scenarios */}
      <div className="bg-panel border border-line rounded-panel p-5 shadow-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-micro uppercase tracking-wider text-canary font-semibold">
                Reproducible Test Matrix
              </span>
            </div>
            <h3 className="font-display text-base font-semibold text-ink mt-0.5">
              Deterministic Demonstration Scenarios
            </h3>
            <p className="font-sans text-caption text-ink2 mt-0.5">
              Launch pre-programmed reproducible attack vectors with fixed seeds for live verification and judging.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Scenario A */}
          <div className="bg-void/60 border border-line hover:border-alarm/40 transition-all rounded-card p-4 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-bold text-alarm">Scenario A</span>
                <span className="font-mono text-micro px-1.5 py-0.5 rounded-chip bg-alarm/10 text-alarm border border-alarm/20">
                  Tripwire
                </span>
              </div>
              <h4 className="font-display font-medium text-ink text-caption mt-2.5">
                Honeypot Canary Tripwire
              </h4>
              <p className="font-sans text-micro text-ink2 mt-1 leading-relaxed">
                Synthetic mule attempts ₹5,000 transfer to canary <code className="font-mono text-canary">canary.trap.01@icixbank</code>. Instant review flag with zero posting.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('A')}
              className="mt-4 w-full py-2 bg-alarm/10 hover:bg-alarm/20 border border-alarm/30 text-alarm text-caption font-mono font-medium rounded-chip flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Trigger Scenario A</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario B */}
          <div className="bg-void/60 border border-line hover:border-feeder/40 transition-all rounded-card p-4 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-bold text-feeder">Scenario B</span>
                <span className="font-mono text-micro px-1.5 py-0.5 rounded-chip bg-feeder/10 text-feeder border border-feeder/20">
                  Feeder Unmasking
                </span>
              </div>
              <h4 className="font-display font-medium text-ink text-caption mt-2.5">
                Shared Upstream Feeder
              </h4>
              <p className="font-sans text-micro text-ink2 mt-1 leading-relaxed">
                Three distinct mules target canaries. Graph propagation traces backward to unmask mastermind <code className="font-mono text-feeder font-medium">FEEDER_SYNTH_007</code>.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('B')}
              className="mt-4 w-full py-2 bg-feeder/10 hover:bg-feeder/20 border border-feeder/30 text-feeder text-caption font-mono font-medium rounded-chip flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Trigger Scenario B</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario C */}
          <div className="bg-void/60 border border-line hover:border-benign/40 transition-all rounded-card p-4 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-bold text-benign">Scenario C</span>
                <span className="font-mono text-micro px-1.5 py-0.5 rounded-chip bg-benign/10 text-benign border border-benign/20">
                  False-Positive Guard
                </span>
              </div>
              <h4 className="font-display font-medium text-ink text-caption mt-2.5">
                Benign Lookalike Merchant
              </h4>
              <p className="font-sans text-micro text-ink2 mt-1 leading-relaxed">
                High-burst QR merchant flagged by tabular rules is verified with 0 canary links—preventing a wrongful statutory account freeze!
              </p>
            </div>
            <button
              onClick={() => onRunScenario('C')}
              className="mt-4 w-full py-2 bg-benign/10 hover:bg-benign/20 border border-benign/30 text-benign text-caption font-mono font-medium rounded-chip flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Trigger Scenario C</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario D */}
          <div className="bg-void/60 border border-line hover:border-device/40 transition-all rounded-card p-4 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-bold text-device">Scenario D</span>
                <span className="font-mono text-micro px-1.5 py-0.5 rounded-chip bg-device/10 text-device border border-device/20">
                  Layering Chain
                </span>
              </div>
              <h4 className="font-display font-medium text-ink text-caption mt-2.5">
                Multi-Hop Layering Network
              </h4>
              <p className="font-sans text-micro text-ink2 mt-1 leading-relaxed">
                4-hop syndicate transfer chain (<code className="font-mono text-device text-[10px]">Feeder→M1→M2→M3→Canary</code>) revealing rapid velocity &amp; amount conservation.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('D')}
              className="mt-4 w-full py-2 bg-device/10 hover:bg-device/20 border border-device/30 text-device text-caption font-mono font-medium rounded-chip flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Trigger Scenario D</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Triage Queue & RBI Architecture Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 bg-panel border border-line rounded-panel p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
            <div>
              <span className="font-mono text-micro uppercase tracking-wider text-ink3">Telemetry Feed</span>
              <h3 className="font-display text-sm font-semibold text-ink">Recent Honeypot Tripwire Interceptions</h3>
            </div>
            <button 
              onClick={() => setActiveTab('monitor')}
              className="text-caption font-mono text-canary hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Full Stream</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-10 text-ink3 text-caption font-mono">
              No tripwire alerts recorded in current session.
              <div className="mt-2">
                Click <button onClick={() => onRunScenario('A')} className="text-canary underline hover:text-ink">Trigger Scenario A</button> to launch an intercepted canary transfer.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <div 
                  key={a.alert_id} 
                  className="bg-void/70 border border-line hover:border-alarm/40 rounded-card p-3 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-alarm animate-pulse shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-caption font-bold text-alarm">{a.sender_account_id}</span>
                        <span className="text-micro text-ink3">attempted</span>
                        <span className="font-mono text-caption text-canary font-semibold">{a.canary_vpa}</span>
                      </div>
                      <div className="flex items-center gap-3 text-micro font-mono text-ink3 mt-0.5">
                        <span>Amt: <strong className="text-ink">₹{a.amount_inr.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Flag: <strong className="text-canary">REVIEW_REQUIRED</strong></span>
                        <span>•</span>
                        <span className="text-benign">0 Ledger Impact</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('workbench')}
                    className="px-2.5 py-1 bg-raised hover:bg-raised/80 text-ink text-micro font-mono rounded-chip border border-line transition-colors"
                  >
                    Open Case
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RBI 60-Day SOP Summary */}
        <div className="bg-panel border border-line rounded-panel p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line">
              <Clock className="w-4 h-4 text-canary" />
              <h3 className="font-display text-sm font-semibold text-ink">RBI Annex III SOP Mandates</h3>
            </div>
            <ul className="space-y-3 text-caption text-ink2 font-sans">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-benign shrink-0 mt-0.5" />
                <span><strong className="text-ink font-semibold">60-Day Time-Bound Holds:</strong> Open-ended indefinite freezes replaced by strict statutory countdown.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-benign shrink-0 mt-0.5" />
                <span><strong className="text-ink font-semibold">20-Day Customer Notice:</strong> Mandatory explanation period before permanent account action.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-benign shrink-0 mt-0.5" />
                <span><strong className="text-ink font-semibold">Proportionate Triage:</strong> Unwitting victims separated from repeat syndicate feeder nodes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-benign shrink-0 mt-0.5" />
                <span><strong className="text-ink font-semibold">NCRP &amp; FIU-IND:</strong> Automatic generation of STIX 2.1 bundles and STR narratives.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setActiveTab('workbench')}
            className="mt-5 w-full py-2 bg-raised hover:bg-raised/80 text-canary text-caption font-mono font-semibold rounded-chip border border-canary/30 hover:border-canary transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Review Active SOP Cases ({activeCases})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
