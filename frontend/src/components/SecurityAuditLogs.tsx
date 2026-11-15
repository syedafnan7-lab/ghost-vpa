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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-raised border border-line text-ink2 rounded-chip text-caption font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-canary" />
            <span>Verifying SHA-256 Chain…</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-raised border border-line text-alarm rounded-chip text-caption font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Verification unavailable</span>
          </div>
        );
      case 'broken':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-alarm/15 border border-alarm/40 text-alarm rounded-chip text-caption font-mono font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chain broken — block {verify.data.broken_block?.log_id ?? 'unknown'}</span>
          </div>
        );
      case 'intact':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-benign/15 border border-benign/30 text-benign rounded-chip text-caption font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{verify.data.verified_blocks} Blocks Verified Intact</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Banner */}
      <div className="bg-panel border border-line rounded-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-canary" />
            <h3 className="font-display font-medium text-ink text-sm">
              Cryptographically Chained Immutable Forensic Audit Trail
            </h3>
          </div>
          <p className="font-sans text-caption text-ink2 mt-1 max-w-2xl leading-relaxed">
            Every state change, alert trigger, analyst note, and supervisor hold authorization is chained using SHA-256 block hashing:{' '}
            <code className="font-mono text-canary text-[11px]">hash_i = SHA256(prev_hash | timestamp | actor | action | payload)</code>.{' '}
            Any retroactive modification instantly breaks tip verification.
          </p>
          {verify.kind === 'broken' && verify.data.broken_block && (
            <p className="text-caption text-alarm mt-2 max-w-2xl font-mono leading-relaxed animate-fade-in">
              {verify.data.broken_block.reason} — expected{' '}
              <span className="text-ink">{verify.data.broken_block.expected.slice(0, 24)}…</span>, stored{' '}
              <span className="text-ink">{verify.data.broken_block.actual.slice(0, 24)}…</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {badge()}
          <button
            onClick={() => {
              fetchLogs();
              runVerification();
            }}
            disabled={loading || verify.kind === 'loading'}
            className="p-2 bg-raised hover:bg-raised/80 text-ink2 hover:text-ink rounded-chip border border-line transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Re-verify cryptographic chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-panel border border-line rounded-panel overflow-hidden shadow-panel">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between bg-panel">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-ink text-caption">Forensic Block Ledger</span>
            <span className="font-mono text-micro text-ink3 bg-raised px-2 py-0.5 rounded-chip border border-line">
              {logs.length} blocks
            </span>
          </div>
          <span className="text-micro text-ink3 font-mono" title={verify.kind === 'intact' ? verify.data.tip_hash : undefined}>
            {verify.kind === 'intact' && verify.data.tip_hash
              ? `Tip: ${verify.data.tip_hash.slice(0, 24)}…`
              : 'Genesis: 0000000000000000…'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left border-collapse text-caption font-mono">
            <thead className="bg-void/90 sticky top-0 border-b border-line text-ink3 text-micro">
              <tr>
                <th className="py-2.5 px-4 font-normal">Block ID</th>
                <th className="py-2.5 px-4 font-normal">Timestamp (UTC)</th>
                <th className="py-2.5 px-4 font-normal">Actor</th>
                <th className="py-2.5 px-4 font-normal">Action</th>
                <th className="py-2.5 px-4 font-normal">Entity ID</th>
                <th className="py-2.5 px-4 font-normal">SHA-256 Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-micro">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-raised/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-ink">#{log.log_id}</td>
                  <td className="py-2.5 px-4 text-ink3">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-ink">{log.actor_id}</span>
                    <span className="text-ink3 text-[10px] ml-1.5">({log.actor_role})</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-1.5 py-0.5 rounded-chip text-[10px] bg-raised text-canary border border-line">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-ink2">{log.entity_id}</td>
                  <td className="py-2.5 px-4 text-ink3 font-mono text-[10px]" title={log.current_hash}>
                    <span className="text-canary font-semibold">{log.current_hash.slice(0, 8)}</span>
                    <span>{log.current_hash.slice(8, 24)}…</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
