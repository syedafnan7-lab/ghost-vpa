import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { CanaryItem } from '../types';
import { api } from '../services/api';

interface HoneypotRegistryProps {
  canaries: CanaryItem[];
  onRefreshCanaries: () => void;
}

export const HoneypotRegistry: React.FC<HoneypotRegistryProps> = ({
  canaries,
  onRefreshCanaries
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [vpa, setVpa] = useState<string>('');
  const [bank, setBank] = useState<string>('ICIX');
  const [type, setType] = useState<string>('REGULATORY_TRIPWIRE');
  const [purpose, setPurpose] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpa || !purpose) return;
    setSubmitting(true);
    try {
      await api.registerCanary({
        vpa: vpa.toLowerCase(),
        designated_bank: bank,
        canary_type: type,
        purpose
      });
      setShowModal(false);
      setVpa('');
      setPurpose('');
      onRefreshCanaries();
    } catch (err) {
      console.error('Failed to register canary', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining the Legal Deception Boundary */}
      <div className="bg-panel border border-line rounded-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-canary" />
            <h3 className="font-display font-medium text-ink text-sm">
              Synthetic Canary Registry
            </h3>
          </div>
          <p className="font-sans text-caption text-ink2 mt-1 max-w-3xl leading-relaxed">
            This inventory contains synthetic canary identifiers only. Bank endpoints, customer-surrendered VPAs, beneficiary lookup, and production payment behavior are not integrated or legally validated here. The September 2026 RBI KYC amendment directions remain a draft proposal.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-canary hover:bg-canary/90 text-void text-caption font-mono font-bold rounded-chip transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Canary</span>
        </button>
      </div>

      {/* Canary Inventory Table */}
      <div className="bg-panel border border-line rounded-panel overflow-hidden shadow-panel">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between bg-panel">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-ink text-caption">Registered Tripwire Inventory</span>
            <span className="font-mono text-micro text-ink3 bg-raised px-2 py-0.5 rounded-chip border border-line">
              {canaries.length} total
            </span>
          </div>
          <span className="font-mono text-micro text-benign font-medium">All Endpoints Active &amp; Instrumented</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-caption">
            <thead className="bg-void/90 border-b border-line text-ink3 font-mono text-micro">
              <tr>
                <th className="py-2.5 px-4 font-normal">Canary ID</th>
                <th className="py-2.5 px-4 font-normal">VPA Handle</th>
                <th className="py-2.5 px-4 font-normal">Bank</th>
                <th className="py-2.5 px-4 font-normal">Deception Class</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal">Intercepted Hits</th>
                <th className="py-2.5 px-4 font-normal">Purpose / Surveillance Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono text-micro">
              {canaries.map((c) => (
                <tr key={c.canary_id} className="hover:bg-raised/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-canary">{c.canary_id}</td>
                  <td className="py-3 px-4 text-ink font-semibold">{c.vpa}</td>
                  <td className="py-3 px-4 text-ink3">{c.designated_bank}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`px-2 py-0.5 rounded-chip text-micro font-mono font-bold ${
                      c.canary_type === 'CONSENTED_TURNCOAT'
                        ? 'bg-feeder/15 text-feeder border border-feeder/30'
                        : 'bg-canary/15 text-canary border border-canary/30'
                    }`}>
                      {c.canary_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded-chip text-micro font-mono font-medium bg-benign/10 text-benign border border-benign/20">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-alarm tabular-nums">{c.hit_count}</td>
                  <td className="py-3 px-4 text-ink2 font-sans text-caption">{c.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Canary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-panel border border-line-strong rounded-panel max-w-md w-full p-6 shadow-panel space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-semibold text-ink">Register Bank Regulatory Canary VPA</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-ink3 hover:text-ink p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-3 font-sans">
              <div>
                <label className="text-micro font-mono text-ink3 block mb-1">Synthetic VPA Handle:</label>
                <input
                  type="text"
                  placeholder="e.g. decoy.vault.05@icixbank"
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  className="w-full bg-void border border-line rounded-chip p-2 text-caption text-ink font-mono focus:border-canary focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-mono text-ink3 block mb-1">Designated Bank:</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-void border border-line rounded-chip p-2 text-caption font-mono text-ink focus:border-canary focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="ICIX">ICIX (ICICI Sim)</option>
                    <option value="HDFX">HDFX (HDFC Sim)</option>
                    <option value="SBINX">SBINX (SBI Sim)</option>
                    <option value="AXSX">AXSX (Axis Sim)</option>
                  </select>
                </div>
                <div>
                  <label className="text-micro font-mono text-ink3 block mb-1">Deception Type:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-void border border-line rounded-chip p-2 text-caption font-mono text-ink focus:border-canary focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="REGULATORY_TRIPWIRE">Regulatory Tripwire</option>
                    <option value="CONSENTED_TURNCOAT">Consented Turncoat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-micro font-mono text-ink3 block mb-1">Surveillance Purpose:</label>
                <textarea
                  rows={2}
                  placeholder="Operational purpose or victim surrender notes..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-void border border-line rounded-chip p-2 text-caption font-mono text-ink focus:border-canary focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-raised hover:bg-raised/80 text-ink2 hover:text-ink text-caption font-mono rounded-chip transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-canary hover:bg-canary/90 text-void text-caption font-mono font-bold rounded-chip transition-colors shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
