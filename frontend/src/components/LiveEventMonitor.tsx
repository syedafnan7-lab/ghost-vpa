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
      {/* Active Tripwire Alert Toast / Banner */}
      {alerts.length > 0 && (
        <div className="bg-panel border border-alarm/40 rounded-panel p-4 shadow-panel">
          <div className="flex items-center gap-2 text-alarm font-mono text-micro uppercase tracking-wider mb-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-alarm animate-ping" />
            <span>Latest Canary Tripwire Interception:</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-void/80 p-3 rounded-card border border-alarm/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-alarm/10 text-alarm rounded-chip">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-caption font-bold text-ink">{alerts[0].sender_account_id}</span>
                  <span className="text-micro text-ink3 font-mono">({alerts[0].sender_vpa})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-alarm" />
                  <span className="font-mono text-caption font-bold text-canary">{alerts[0].canary_vpa}</span>
                </div>
                <div className="text-micro font-mono text-ink3 mt-0.5 flex items-center gap-3">
                  <span>Attempt amount: <strong className="text-ink">₹{alerts[0].amount_inr.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Sender Status: <strong className="text-canary">REVIEW_REQUIRED</strong></span>
                  <span>•</span>
                  <span className="text-benign font-semibold">Zero Funds Transferred (Ring-Fenced)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectEntityForGraph(alerts[0].sender_account_id);
                  setActiveTab('network');
                }}
                className="px-3 py-1.5 bg-canary text-void hover:bg-canary/90 text-caption font-mono font-bold rounded-chip transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Inspect in Graph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="bg-panel border border-line rounded-panel p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-panel">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 text-ink3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Account, VPA, or Tx ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-void/80 border border-line rounded-chip pl-8 pr-3 py-1.5 text-caption font-mono text-ink placeholder-ink3 focus:outline-none focus:border-canary transition-colors"
            />
          </div>

          {/* Canary Only Toggle */}
          <button
            onClick={() => setCanaryOnly(!canaryOnly)}
            className={`px-3 py-1.5 rounded-chip text-caption font-mono border transition ${
              canaryOnly
                ? 'bg-alarm/15 text-alarm border-alarm/40 font-semibold'
                : 'bg-void/80 text-ink2 border-line hover:text-ink hover:bg-raised'
            }`}
          >
            Canary Hits Only
          </button>
        </div>

        {/* Bank Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto justify-end">
          <span className="text-micro font-mono text-ink3 uppercase tracking-wider mr-1">Bank:</span>
          {['ALL', 'HDFX', 'ICIX', 'SBINX', 'AXSX'].map((b) => (
            <button
              key={b}
              onClick={() => setBankFilter(b)}
              className={`px-2.5 py-1 rounded-chip text-caption font-mono transition ${
                bankFilter === b
                  ? 'bg-raised text-canary border border-canary/40 font-bold'
                  : 'text-ink3 hover:text-ink bg-void/60 border border-line'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Ingestion Stream Table */}
      <div className="bg-panel border border-line rounded-panel overflow-hidden shadow-panel">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between bg-panel">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-canary" />
            <h3 className="font-display font-medium text-ink text-caption">Simulated UPI / IMPS Inbound Stream</h3>
            <span className="text-micro text-ink3 bg-raised px-2 py-0.5 rounded-chip font-mono border border-line">
              {filteredEvents.length} events
            </span>
          </div>
          <span className="font-mono text-micro text-ink3">
            Real-time Ingestion SLA: <strong className="text-benign">&lt; 15 ms</strong>
          </span>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left border-collapse text-caption">
            <thead className="bg-void/90 sticky top-0 border-b border-line text-ink3 font-mono text-micro">
              <tr>
                <th className="py-2.5 px-4 font-normal">Event ID</th>
                <th className="py-2.5 px-4 font-normal">Timestamp</th>
                <th className="py-2.5 px-4 font-normal">Sender Account</th>
                <th className="py-2.5 px-4 font-normal">Beneficiary VPA</th>
                <th className="py-2.5 px-4 font-normal">Amount</th>
                <th className="py-2.5 px-4 font-normal">Rail</th>
                <th className="py-2.5 px-4 font-normal">Triage Status</th>
                <th className="py-2.5 px-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono text-micro">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-ink3 font-sans">
                    No payment attempts matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((ev) => {
                  const isCanary = ev.is_canary_hit;
                  return (
                    <tr
                      key={ev.event_id}
                      className={`hover:bg-raised/40 transition-colors ${
                        isCanary ? 'bg-alarm/5 hover:bg-alarm/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-ink3 font-semibold">{ev.event_id}</td>
                      <td className="py-2.5 px-4 text-ink3">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={isCanary ? 'text-alarm font-bold' : 'text-ink'}>
                          {ev.sender_account_id}
                        </span>
                        <div className="text-[10px] text-ink3">{ev.sender_vpa}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={isCanary ? 'text-canary font-bold' : 'text-ink2'}>
                          {ev.beneficiary_vpa}
                        </span>
                        {isCanary && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-alarm/20 text-alarm rounded-chip border border-alarm/30">
                            CANARY
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-ink font-bold tabular-nums">
                        {ev.simulated_result === 'SETTLED_NORMAL' ? 'Settled: ' : 'Attempt: '}
                        ₹{ev.amount_inr.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-ink3">{ev.payment_rail}</td>
                      <td className="py-2.5 px-4 font-sans">
                        {isCanary ? (
                          <span className="px-2 py-0.5 rounded-chip text-micro font-mono font-bold bg-canary/15 text-canary border border-canary/30">
                            REVIEW_REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-chip text-micro font-mono font-medium bg-benign/10 text-benign border border-benign/20">
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
                          className="px-2 py-1 bg-raised hover:bg-raised/80 text-ink text-micro font-mono rounded-chip border border-line transition-colors"
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
