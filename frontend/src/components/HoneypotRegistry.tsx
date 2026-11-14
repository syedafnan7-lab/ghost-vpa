import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Bank-Designated Regulatory Honeypot &amp; Consented Turncoat Vault
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            All endpoints are strictly non-routable synthetic canary tokens. In production, these include bank operational endpoints and customer-surrendered VPAs under the RBI Annex III 20-day explanation window. Beneficiary name lookup authenticates normally while outgoing debits remain permanently locked at 0.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Canary</span>
        </button>
      </div>

      {/* Canary Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <span className="text-xs font-semibold text-slate-200">Registered Tripwire Inventory ({canaries.length})</span>
          <span className="text-[11px] text-emerald-400 font-medium">All Endpoints Active &amp; Instrumented</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Canary ID</th>
                <th className="py-2.5 px-4">VPA Handle</th>
                <th className="py-2.5 px-4">Bank</th>
                <th className="py-2.5 px-4">Deception Class</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Intercepted Hits</th>
                <th className="py-2.5 px-4">Purpose / Surveillance Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {canaries.map((c) => (
                <tr key={c.canary_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-amber-400">{c.canary_id}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{c.vpa}</td>
                  <td className="py-3 px-4 text-slate-400">{c.designated_bank}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.canary_type === 'CONSENTED_TURNCOAT'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {c.canary_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-red-400">{c.hit_count}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans text-xs">{c.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Canary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Register Bank Regulatory Canary VPA</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Synthetic VPA Handle:</label>
                <input
                  type="text"
                  placeholder="e.g. decoy.vault.05@icixbank"
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Designated Bank:</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ICIX">ICIX (ICICI Sim)</option>
                    <option value="HDFX">HDFX (HDFC Sim)</option>
                    <option value="SBINX">SBINX (SBI Sim)</option>
                    <option value="AXSX">AXSX (Axis Sim)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Deception Type:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="REGULATORY_TRIPWIRE">Regulatory Tripwire</option>
                    <option value="CONSENTED_TURNCOAT">Consented Turncoat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Surveillance Purpose:</label>
                <textarea
                  rows={2}
                  placeholder="Operational purpose or victim surrender notes..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
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
