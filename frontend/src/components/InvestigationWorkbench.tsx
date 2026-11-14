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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[640px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Active RBI SOP Cases</h3>
            <span className="text-[11px] text-slate-400">Annex III Mule Investigation Dossiers</span>
          </div>
          <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">
            {cases.length} Total
          </span>
        </div>

        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {cases.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No active cases. Trigger Scenario A or B to auto-provision an investigation case.
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
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300">{c.case_id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {c.case_status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-200 mt-1.5">{c.target_account_id}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>SLA: Day {c.sop_day_counter}/60</span>
                    <span className="text-amber-400 font-medium">{c.explanation_days_left}d notice left</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Header with Countdown Timers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-100">{selectedCase.case_id}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {selectedCase.case_status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Target Account: <strong className="text-slate-200">{selectedCase.target_account_id}</strong> ({selectedCase.target_vpa}) • Bank: {selectedCase.target_bank}
                </p>
              </div>

              {/* RBI Timers */}
              <div className="flex items-center space-x-3">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">RBI 60-Day SLA:</span>
                  <span className="font-mono text-xs font-bold text-amber-400">Day {selectedCase.sop_day_counter} of 60</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Notice:</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">{selectedCase.explanation_days_left} Days Left</span>
                </div>
              </div>
            </div>

            {/* Error Message if Role Unauthorized */}
            {actionError && (
              <div className="bg-red-950/40 border border-red-500/50 p-3 rounded-lg text-xs text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Action Bar (RBI SOP Transitions) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  RBI SOP Case Actions (Current Actor Role: <strong className="text-amber-400">{role}</strong>)
                </span>
                <span className="text-[11px] text-slate-500">Separation of Duties Enforced</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => handleAction('DISPATCH_NOTICE')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                >
                  Dispatch Notice (20d)
                </button>
                <button
                  onClick={() => handleAction('APPLY_HOLD')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition ${
                    role === 'Supervisor'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  }`}
                  title={role !== 'Supervisor' ? 'Supervisor Role Required' : 'Authorize 60-day hold'}
                >
                  {role !== 'Supervisor' && <Lock className="w-3 h-3 inline mr-1" />}
                  Apply 60d Hold
                </button>
                <button
                  onClick={() => handleAction('RESOLVE_VICTIM')}
                  className="py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 text-xs font-medium rounded-lg transition"
                >
                  Resolve as Victim
                </button>
                <button
                  onClick={() => handleAction('CONFIRM_MULE')}
                  className="py-2 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/40 text-xs font-medium rounded-lg transition"
                >
                  Confirm Mule
                </button>
              </div>

              {/* Note input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Append auditable investigation note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleAction('DISPATCH_NOTICE')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </div>
            </div>

            {/* Case Dossier Tabs: FIU STR & NCRP Payload & STIX Exporter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIU STR Narrative */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">FIU-IND STR Narrative Preview:</span>
                <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-900/80 p-2.5 rounded border border-slate-800/60 max-h-36 overflow-y-auto">
                  {selectedCase.fiu_str_narrative}
                </p>
              </div>

              {/* NCRP Payload & Threat Export */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1">NCRP-CFCFRMS Compliance JSON:</span>
                  <pre className="text-[10px] text-amber-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800/60 max-h-24 overflow-y-auto">
                    {JSON.stringify(selectedCase.ncrp_payload_preview, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={handleDownloadSTIX}
                  className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download OASIS STIX 2.1 Threat Intel Bundle</span>
                </button>
              </div>
            </div>

            {/* Case Notes History */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Case Audit &amp; Note Timeline:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedCase.analyst_notes.map((note, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/40">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            Select a case from the left to inspect evidence dossier and manage lifecycle.
          </div>
        )}
      </div>
    </div>
  );
};
