import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Hash, Link2, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';

export const SecurityAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Audit Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Cryptographically Chained Immutable Forensic Audit Trail
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every state change, alert trigger, analyst note, and supervisor hold authorization is chained using SHA-256 block hashing: <code className="text-amber-300">hash_i = SHA256(prev_hash + actor + action + payload)</code>. Tampering with past records breaks the cryptographic chain.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Chain Intact</span>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <span className="text-xs font-semibold text-slate-200">Forensic Block Ledger ({logs.length} Blocks)</span>
          <span className="text-[11px] text-slate-500 font-mono">Genesis Hash: 0000000000000000...</span>
        </div>

        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Block ID</th>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target Entity</th>
                <th className="py-2.5 px-4">Current Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.log_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-bold text-amber-400">{l.log_id}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(l.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-200">{l.actor_id}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.actor_role === 'Supervisor' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : l.actor_role === 'SYSTEM' 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {l.actor_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-300">{l.action}</td>
                    <td className="py-2.5 px-4 text-slate-400">{l.entity_id}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px]">
                      <div className="flex items-center space-x-1">
                        <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate w-36 text-slate-400" title={l.current_hash}>
                          {l.current_hash.slice(0, 16)}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
