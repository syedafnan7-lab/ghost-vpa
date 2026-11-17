import React, { useState } from 'react';
import { 
  Clock, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Send, 
  UserCheck, 
  Lock 
} from 'lucide-react';
import { CaseDossier, UserRole } from '../types';
import { api } from '../services/api';

interface InvestigationWorkbenchProps {
  cases: CaseDossier[];
  role: UserRole;
  onRefreshCases: () => void;
}

export const InvestigationWorkbench: React.FC<InvestigationWorkbenchProps> = ({
  cases,
  role,
  onRefreshCases
}) => {
  const [selectedCase, setSelectedCase] = useState<CaseDossier | null>(cases[0] || null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = async (action: 'DISPATCH_NOTICE' | 'APPLY_HOLD' | 'RESOLVE_VICTIM' | 'CONFIRM_MULE') => {
    if (!selectedCase) return;
    setActionError(null);
    try {
      const updated = await api.takeCaseAction(selectedCase.case_id, action, noteInput, role);
      setSelectedCase(updated);
      setNoteInput('');
      onRefreshCases();
    } catch (e: any) {
      setActionError(e.message || 'Action failed');
    }
  };

  const handleDownloadSTIX = async () => {
    if (!selectedCase) return;
    try {
      const bundle = await api.getSTIXBundle(selectedCase.case_id);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `STIX-2.1-${selectedCase.case_id}.json`;
      a.click();
    } catch (e) {
      console.error('Failed to export STIX', e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cases Master List (Left Column) */}
      <div className="bg-panel border border-line rounded-panel p-4 flex flex-col h-[660px] shadow-panel">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
          <div>
            <span className="font-mono text-micro uppercase tracking-wider text-ink3">Triage Queue</span>
              <h3 className="font-display font-medium text-ink text-caption">Simulation Cases</h3>
              <span className="text-micro text-ink3 font-sans">Prototype review dossiers</span>
          </div>
          <span className="font-mono text-micro bg-raised px-2 py-0.5 rounded-chip text-canary font-bold border border-line">
            {cases.length} Total
          </span>
        </div>

        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {cases.length === 0 ? (
            <div className="py-12 text-center text-ink3 font-mono text-caption">
              No active cases. Trigger Scenario A or B to auto-provision an investigation dossier.
            </div>
          ) : (
            cases.map((c) => {
              const isSelected = selectedCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => {
                    setSelectedCase(c);
                    setActionError(null);
                  }}
                  className={`p-3 rounded-card border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-raised border-canary/60 shadow-sm'
                      : 'bg-void/60 border-line hover:border-line-strong hover:bg-raised/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-caption font-bold text-canary">{c.case_id}</span>
                    <span className="font-mono text-micro font-semibold px-1.5 py-0.5 rounded-chip bg-canary/10 text-canary border border-canary/20">
                      {c.case_status}
                    </span>
                  </div>
                  <div className="font-mono text-caption text-ink mt-1.5 flex items-center justify-between">
                    <span>{c.target_account_id}</span>
                    {c.upstream_feeder_account && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-alarm/10 text-alarm border border-alarm/20">
                        Feeder: {c.upstream_feeder_account}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between font-mono text-micro text-ink3 mt-1.5">
                    <span>SLA: Day {c.sop_day_counter}/60</span>
                    <span className="text-canary font-medium">{c.explanation_days_left}d notice left</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Case Details & Action Workbench (Right Two Columns) */}
      <div className="lg:col-span-2 space-y-5">
        {selectedCase ? (
          <div className="bg-panel border border-line rounded-panel p-5 space-y-5 shadow-panel">
            {/* Header with Countdown Timers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-ink">{selectedCase.case_id}</h3>
                  <span className="font-mono text-micro font-semibold px-2 py-0.5 rounded-chip bg-canary/15 text-canary border border-canary/30">
                    {selectedCase.case_status}
                  </span>
                </div>
                <p className="font-mono text-caption text-ink3 mt-1">
                  Target: <strong className="text-ink">{selectedCase.target_account_id}</strong> ({selectedCase.target_vpa}) • Bank: {selectedCase.target_bank}
                </p>
              </div>

              {/* RBI Timers */}
              <div className="flex items-center gap-2">
                <div className="bg-void/80 px-3 py-1.5 rounded-chip border border-line text-center">
                  <span className="font-mono text-[10px] text-ink3 uppercase block">RBI 60-Day SLA:</span>
                  <span className="font-mono text-caption font-bold text-canary">Day {selectedCase.sop_day_counter} of 60</span>
                </div>
                <div className="bg-void/80 px-3 py-1.5 rounded-chip border border-line text-center">
                  <span className="font-mono text-[10px] text-ink3 uppercase block">Customer Notice:</span>
                  <span className="font-mono text-caption font-bold text-benign">{selectedCase.explanation_days_left} Days Left</span>
                </div>
              </div>
            </div>

            {/* Attribution & Syndicate Intelligence Evidence Card */}
            <div className="bg-void/80 p-3.5 rounded-card border border-line grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="font-mono text-[10px] text-ink3 uppercase block">Upstream Candidate:</span>
                <span className="font-mono text-caption font-bold text-alarm">
                  {selectedCase.upstream_feeder_account ? (
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-alarm inline" />
                      {selectedCase.upstream_feeder_account}
                    </span>
                  ) : (
                    <span className="text-ink3 font-normal">Direct / Unattributed</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-ink3 uppercase block">Shared Feeder Links:</span>
                <span className="font-mono text-caption font-semibold text-canary">
                  {selectedCase.connected_mule_count > 0 ? (
                    <span>{selectedCase.connected_mule_count} Connected Accounts</span>
                  ) : (
                    <span className="text-ink3 font-normal">Isolated Node</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-ink3 uppercase block">Topology Cluster ID (synthetic):</span>
                <span className="font-mono text-caption font-medium text-ink2">
                  {selectedCase.cluster_id || "ISOLATED-CASE"}
                </span>
              </div>
            </div>

            {/* Error Message if Role Unauthorized */}
            {actionError && (
              <div className="bg-alarm/10 border border-alarm/30 p-3 rounded-card text-caption text-alarm flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-alarm shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Action Bar (RBI SOP Transitions) */}
            <div className="bg-void/70 p-4 rounded-card border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption font-semibold text-ink uppercase tracking-wider">
                  Case Actions (Demo role: <strong className="text-canary">{role}</strong>)
                </span>
                <span className="font-mono text-micro text-ink3">Disabled: no authenticated identity</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  disabled
                  onClick={() => handleAction('DISPATCH_NOTICE')}
                  className="py-2 px-3 bg-raised hover:bg-raised/80 text-ink text-caption font-mono rounded-chip border border-line transition-colors"
                >
                  Dispatch Notice (20d)
                </button>
                <button
                  disabled
                  className="py-2 px-3 text-caption font-mono rounded-chip border border-line bg-void text-ink3 cursor-not-allowed opacity-60"
                  title="Disabled: authenticated authorization is not configured"
                >
                  <Lock className="w-3 h-3 inline mr-1 text-ink3" />
                  Holds Disabled
                </button>
                <button
                  disabled
                  onClick={() => handleAction('RESOLVE_VICTIM')}
                  className="py-2 px-3 bg-benign/15 hover:bg-benign/25 text-benign border border-benign/30 text-caption font-mono rounded-chip transition-colors"
                >
                  Resolve as Victim
                </button>
                <button
                  disabled
                  onClick={() => handleAction('CONFIRM_MULE')}
                  className="py-2 px-3 bg-alarm/15 hover:bg-alarm/25 text-alarm border border-alarm/30 text-caption font-mono rounded-chip transition-colors"
                >
                  Confirm Mule
                </button>
              </div>

              {/* Note input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Append auditable investigation note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 bg-void border border-line rounded-chip px-3 py-1.5 text-caption font-mono text-ink placeholder-ink3 focus:outline-none focus:border-canary transition-colors"
                />
                <button
                  disabled
                  onClick={() => handleAction('DISPATCH_NOTICE')}
                  className="px-3 py-1.5 bg-raised hover:bg-raised/80 text-ink text-caption font-mono rounded-chip border border-line transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-canary" />
                  <span>Log Note</span>
                </button>
              </div>
            </div>

            {/* Case Dossier Tabs: FIU STR & NCRP Payload & STIX Exporter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIU STR Narrative */}
              <div className="bg-void/70 p-4 rounded-card border border-line space-y-2">
                <span className="font-mono text-micro uppercase tracking-wider text-ink3 block">
                  FIU-IND STR Narrative Preview
                </span>
                <p className="text-caption font-mono text-ink2 leading-relaxed bg-void p-3 rounded-chip border border-line max-h-36 overflow-y-auto">
                  {selectedCase.fiu_str_narrative}
                </p>
              </div>

              {/* NCRP Payload & Threat Export */}
              <div className="bg-void/70 p-4 rounded-card border border-line flex flex-col justify-between">
                <div>
                  <span className="font-mono text-micro uppercase tracking-wider text-ink3 block mb-1">
                    NCRP-CFCFRMS Prototype Preview
                  </span>
                  <pre className="text-[10px] text-canary font-mono bg-void p-2.5 rounded-chip border border-line max-h-24 overflow-y-auto">
                    {JSON.stringify(selectedCase.ncrp_payload_preview, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={handleDownloadSTIX}
                  className="mt-3 w-full py-2 bg-raised hover:bg-raised/80 text-canary border border-canary/30 hover:border-canary text-caption font-mono font-medium rounded-chip flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-canary" />
                  <span>Download Prototype STIX Bundle</span>
                </button>
              </div>
            </div>

            {/* Case Notes History */}
            <div className="space-y-2 border-t border-line pt-4">
              <span className="font-mono text-micro uppercase tracking-wider text-ink3">
                Case Audit &amp; Note Timeline
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedCase.analyst_notes.map((note, idx) => (
                  <div key={idx} className="text-caption font-mono text-ink2 bg-void/60 p-2.5 rounded-chip border border-line">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-panel border border-line rounded-panel p-16 text-center text-ink3 font-mono text-caption shadow-panel">
            Select a case from the left to inspect evidence dossier and manage statutory lifecycle.
          </div>
        )}
      </div>
    </div>
  );
};
