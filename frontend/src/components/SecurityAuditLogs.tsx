import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Hash, Link2, RefreshCw, Loader2 } from 'lucide-react';
import { AuditLog } from '../types';
import { api, ChainVerification } from '../services/api';

type VerifyState =
  | { kind: 'loading' }
  | { kind: 'intact'; data: ChainVerification }
  | { kind: 'broken'; data: ChainVerification }
  | { kind: 'error'; message: string };

export const SecurityAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verify, setVerify] = useState<VerifyState>({ kind: 'loading' });

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

  const runVerification = async () => {
    setVerify({ kind: 'loading' });
    try {
      const result = await api.verifyAuditChain();
      setVerify(
        result.chain_intact
          ? { kind: 'intact', data: result }
          : { kind: 'broken', data: result }
      );
    } catch (e) {
      setVerify({ kind: 'error', message: e instanceof Error ? e.message : 'Verification request failed' });
    }
  };

  useEffect(() => {
    fetchLogs();
    runVerification();
  }, []);

  const badge = () => {
    switch (verify.kind) {
      case 'loading':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying…</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Verification unavailable</span>
          </div>
        );
      case 'broken':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/50 border border-red-500/40 text-red-300 rounded-lg text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Chain broken — block {verify.data.broken_block?.log_id ?? 'unknown'}</span>
          </div>
        );
      case 'intact':
      default:
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>{verify.data.verified_blocks} blocks verified</span>
          </div>
        );
    }
  };

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
            Every state change, alert trigger, analyst note, and supervisor hold authorization is chained using SHA-256 block hashing:{' '}
            <code className="text-amber-300">hash_i = SHA256(prev_hash | timestamp | actor_id | actor_role | action | entity_id | payload)</code>.{' '}
            Tampering with past records breaks the cryptographic chain.
          </p>
          {verify.kind === 'broken' && verify.data.broken_block && (
            <p className="text-xs text-red-300 mt-2 max-w-2xl font-mono leading-relaxed animate-fade-in">
              {verify.data.broken_block.reason} — expected{' '}
              <span className="text-red-200">{verify.data.broken_block.expected.slice(0, 24)}…</span>, stored{' '}
              <span className="text-red-200">{verify.data.broken_block.actual.slice(0, 24)}…</span>
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {badge()}
          <button
            onClick={() => {
              fetchLogs();
              runVerification();
            }}
            disabled={loading || verify.kind === 'loading'}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Re-verify chain"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <span className="text-xs font-semibold text-slate-200">Forensic Block Ledger ({logs.length} Blocks)</span>
          <span className="text-[11px] text-slate-400 font-mono" title={verify.kind === 'intact' ? verify.data.tip_hash : undefined}>
            {verify.kind === 'intact' && verify.data.tip_hash
              ? `Tip Hash: ${verify.data.tip_hash.slice(0, 20)}…`
              : 'Genesis Hash: 0000000000000000…'}
          </span>
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
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.log_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-bold text-amber-400">{l.log_id}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(l.timestamp).toISOString().replace('T', ' ').slice(0, 23)}
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
                    <td className="py-2.5 px-4 font-mono text-[10px]">
                      <div className="flex items-center space-x-1">
                        <Link2 className={`w-3 h-3 shrink-0 ${verify.kind === 'broken' ? 'text-red-400' : 'text-emerald-400'}`} />
                        <span className="truncate w-36 text-slate-400" title={l.current_hash}>
                          {l.current_hash.slice(0, 16)}…
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