import React from 'react';
import { 
  ShieldAlert, 
  Target, 
  Users, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  ArrowUpRight, 
  Lock 
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
      {/* Top Banner Alert Notice */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3.5 shadow-lg">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-100 text-sm">
              Operational Regulatory Sandbox: RBI September 2026 Draft KYC Directions (Annex III SOP)
            </h3>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
              DRAFT SOP SIMULATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Canary interactions trigger immediate operational flags (<code className="text-amber-300">REVIEW_REQUIRED</code>) with zero real funds movement. Ring-fenced suspense ledger prevents outbound leakage while analysts enforce the 20-day customer explanation window and 60-day maximum statutory hold SLA.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Entities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Synthetic Monitored Network</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-100">100,000</span>
            <span className="text-xs text-emerald-400 font-medium">Active Graph Nodes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">85k Retail, 10k MSME, 4.95k Mules, 50 Canaries</p>
        </div>

        {/* Canary Honeypots */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Registered Canary Honeypots</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{canaries.length}</span>
            <span className="text-xs text-slate-400">Deployed VPAs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Regulatory Tripwires & Consented Turncoats</p>
        </div>

        {/* Intercepted Canary Hits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Canary Probes Intercepted</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-red-400">{totalHits}</span>
            <span className="text-xs text-emerald-400 font-medium">Zero Leakage</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">₹0.00 Lost • Ring-Fenced Suspense GL</p>
        </div>

        {/* Triage Latency SLA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Triage Latency SLA</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">&lt; 3.8 ms</span>
            <span className="text-xs text-emerald-400 font-medium">Target: &lt; 15 ms</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">O(1) Memory Lookup • Async Graph Dispatch</p>
        </div>
      </div>

      {/* Demonstration Scenario Quick Launcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Deterministic Demonstration Scenarios</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch pre-programmed reproducible scenarios with fixed random seeds for live judging.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Scenario A */}
          <div className="bg-slate-950/70 border border-red-900/40 hover:border-red-600/60 transition rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Scenario A</span>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded">Tripwire</span>
              </div>
              <h4 className="font-medium text-slate-200 text-sm mt-2">Honeypot Canary Tripwire</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A synthetic mule attempts a ₹5,000 transfer to registered canary <code className="text-slate-300">canary.trap.01@icixbank</code>.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('A')}
              className="mt-4 w-full py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <span>Trigger Scenario A</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario B */}
          <div className="bg-slate-950/70 border border-purple-900/40 hover:border-purple-600/60 transition rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Scenario B</span>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-semibold rounded">Feeder Unmasking</span>
              </div>
              <h4 className="font-medium text-slate-200 text-sm mt-2">Shared Upstream Feeder</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Three distinct mules target canaries. Graph propagation traces backward to unmask mastermind <code className="text-slate-300">FEEDER_SYNTH_007</code>.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('B')}
              className="mt-4 w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <span>Trigger Scenario B</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario C */}
          <div className="bg-slate-950/70 border border-emerald-900/40 hover:border-emerald-600/60 transition rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Scenario C</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded">False Positive Guard</span>
              </div>
              <h4 className="font-medium text-slate-200 text-sm mt-2">Benign Lookalike Merchant</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                High-volume bursty QR transactions trigger tabular fraud rules, but the graph confirms zero canary links—avoiding a wrongful hold!
              </p>
            </div>
            <button
              onClick={() => onRunScenario('C')}
              className="mt-4 w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <span>Trigger Scenario C</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario D */}
          <div className="bg-slate-950/70 border border-blue-900/40 hover:border-blue-600/60 transition rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Scenario D</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-semibold rounded">Layering Chain</span>
              </div>
              <h4 className="font-medium text-slate-200 text-sm mt-2">Multi-Hop Layering Network</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A 4-hop syndicate transfer chain (<code className="text-slate-300">Feeder→M1→M2→M3→Canary</code>) reveals velocity &amp; amount conservation.
              </p>
            </div>
            <button
              onClick={() => onRunScenario('D')}
              className="mt-4 w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <span>Trigger Scenario D</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Triage Queue & Architecture Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100 text-sm">Recent Honeypot Tripwire Interceptions</h3>
            <button 
              onClick={() => setActiveTab('monitor')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1"
            >
              <span>View Live Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No tripwire alerts recorded yet. Click <span className="text-amber-400 font-semibold cursor-pointer" onClick={() => onRunScenario('A')}>Trigger Scenario A</span> to launch a live canary attempt.
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.alert_id} className="bg-slate-950/80 border border-red-900/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-red-400">{a.sender_account_id}</span>
                        <span className="text-[10px] text-slate-400">attempted</span>
                        <span className="font-mono text-xs text-amber-300 font-semibold">{a.canary_vpa}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                        <span>Amt: ₹{a.amount_inr.toLocaleString()}</span>
                        <span>•</span>
                        <span>Status: <strong className="text-amber-400">REVIEW_REQUIRED</strong></span>
                        <span>•</span>
                        <span>Zero Funds Moved</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('workbench')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-medium transition"
                  >
                    Open Case
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RBI 60-Day SOP Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>RBI Annex III Mule SOP Mandates</span>
            </h3>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>60-Day Time-Bound Holds:</strong> Open-ended indefinite freezes replaced by strict statutory countdown.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>20-Day Customer Notice:</strong> Mandatory explanation period before permanent account action.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Proportionate Triage:</strong> Unwitting victims separated from repeat syndicate feeder nodes.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>NCRP &amp; FIU-IND:</strong> Automatic generation of STR narratives and CFCFRMS payload bundles.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => setActiveTab('workbench')}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Review Active SOP Cases ({activeCases})
          </button>
        </div>
      </div>
    </div>
  );
};
