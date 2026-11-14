import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight, Filter, Search, Zap, ExternalLink } from 'lucide-react';
import { PaymentAttempt, TripwireAlert, ActiveTab } from '../types';

interface LiveEventMonitorProps {
  events: PaymentAttempt[];
  alerts: TripwireAlert[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectEntityForGraph: (entityId: string) => void;
}

export const LiveEventMonitor: React.FC<LiveEventMonitorProps> = ({
  events,
  alerts,
  setActiveTab,
  onSelectEntityForGraph
}) => {
  const [bankFilter, setBankFilter] = useState<string>('ALL');
  const [canaryOnly, setCanaryOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((ev) => {
    if (canaryOnly && !ev.is_canary_hit) return false;
    if (bankFilter !== 'ALL' && ev.sender_bank !== bankFilter && ev.beneficiary_bank !== bankFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.sender_account_id.toLowerCase().includes(q) ||
        ev.sender_vpa.toLowerCase().includes(q) ||
        ev.beneficiary_vpa.toLowerCase().includes(q) ||
        ev.event_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Active Tripwire Alert Toasts */}
      {alerts.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 shadow-lg shadow-red-950/20">
          <div className="flex items-center space-x-2 text-red-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Latest Canary Tripwire Interception:</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-lg border border-red-800/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-100">{alerts[0].sender_account_id}</span>
                  <span className="text-xs text-slate-400 font-mono">({alerts[0].sender_vpa})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-mono text-xs font-bold text-amber-300">{alerts[0].canary_vpa}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-3">
                  <span>Amount: <strong className="text-slate-200">₹{alerts[0].amount_inr.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Sender Status: <strong className="text-amber-400">REVIEW_REQUIRED</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Zero Funds Transferred (Ring-Fenced)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onSelectEntityForGraph(alerts[0].sender_account_id);
                  setActiveTab('network');
                }}
                className="px-3 py-1.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold rounded-lg transition flex items-center space-x-1"
              >
                <span>Inspect in Graph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Account, VPA, or Tx ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Canary Only Toggle */}
          <button
            onClick={() => setCanaryOnly(!canaryOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              canaryOnly
                ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Canary Hits Only
          </button>
        </div>

        {/* Bank Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto justify-end">
          <span className="text-[11px] text-slate-500 uppercase font-semibold mr-1">Bank:</span>
          {['ALL', 'HDFX', 'ICIX', 'SBINX', 'AXSX'].map((b) => (
            <button
              key={b}
              onClick={() => setBankFilter(b)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                bankFilter === b
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-900'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Ingestion Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-slate-200 text-xs">Simulated UPI / IMPS Inbound Stream</h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              {filteredEvents.length} transactions
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time Ingestion SLA: <strong className="text-emerald-400">&lt; 15 ms</strong>
          </span>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Sender Account</th>
                <th className="py-2.5 px-4">Beneficiary VPA</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Rail</th>
                <th className="py-2.5 px-4">Triage Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No payment attempts matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((ev) => {
                  const isCanary = ev.is_canary_hit;
                  return (
                    <tr
                      key={ev.event_id}
                      className={`hover:bg-slate-800/50 transition ${
                        isCanary ? 'bg-red-950/20 hover:bg-red-950/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-400 font-bold">{ev.event_id}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={isCanary ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          {ev.sender_account_id}
                        </span>
                        <div className="text-[10px] text-slate-500">{ev.sender_vpa}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={isCanary ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {ev.beneficiary_vpa}
                        </span>
                        {isCanary && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-red-500/20 text-red-400 rounded border border-red-500/30">
                            CANARY
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-200 font-bold">
                        ₹{ev.amount_inr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{ev.payment_rail}</td>
                      <td className="py-2.5 px-4 font-sans">
                        {isCanary ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            REVIEW_REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            SETTLED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => {
                            onSelectEntityForGraph(ev.sender_account_id);
                            setActiveTab('network');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded transition"
                        >
                          Graph
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
