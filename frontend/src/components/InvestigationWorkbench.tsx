import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Download,
  FileText,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { CaseDossier, CaseEvidenceEvent } from '../types';
import { api } from '../services/api';

interface InvestigationWorkbenchProps {
  cases: CaseDossier[];
  preferredCaseId?: string | null;
  onOpenGraph: (entityId: string) => void;
}

const formatAmount = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount);

const formatTimestamp = (timestamp: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(timestamp));

const displayStatus = (status: string) => status.toLowerCase().replace(/_/g, ' ');

export const InvestigationWorkbench: React.FC<InvestigationWorkbenchProps> = ({
  cases,
  preferredCaseId,
  onOpenGraph,
}) => {
  const [selectedCase, setSelectedCase] = useState<CaseDossier | null>(cases[0] || null);
  const [evidenceEvents, setEvidenceEvents] = useState<CaseEvidenceEvent[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    const preferred = cases.find((item) => item.case_id === preferredCaseId);
    setSelectedCase((current) => preferred || cases.find((item) => item.case_id === current?.case_id) || cases[0] || null);
  }, [cases, preferredCaseId]);

  useEffect(() => {
    if (!selectedCase) {
      setEvidenceEvents([]);
      setEvidenceError(null);
      return;
    }

    let cancelled = false;
    setEvidenceEvents([]);
    setEvidenceLoading(true);
    setEvidenceError(null);
    api.getCaseEvidence(selectedCase.case_id)
      .then((items: CaseEvidenceEvent[]) => {
        if (!cancelled) setEvidenceEvents(items);
      })
      .catch((error: Error) => {
        if (!cancelled) setEvidenceError(error.message);
      })
      .finally(() => {
        if (!cancelled) setEvidenceLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedCase?.case_id]);

  const handleDownloadSTIX = async () => {
    if (!selectedCase) return;
    try {
      const bundle = await api.getSTIXBundle(selectedCase.case_id);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `STIX-2.1-${selectedCase.case_id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export STIX', error);
    }
  };

  const openCases = cases.filter((item) => item.case_status.startsWith('OPEN')).length;

  return (
    <section className="case-workbench space-y-5" aria-labelledby="workbench-title">
      <header className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="workbench-title" className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            Case workbench
          </h2>
          <p className="mt-1 text-sm text-ink2">Review case context, source events, and network attribution.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink2">
          <span className="font-mono text-sm tabular-nums text-ink">{openCases}</span>
          <span>open reviews</span>
          <span className="mx-1 h-4 border-l border-line" aria-hidden="true" />
          <span className="font-mono text-sm tabular-nums text-ink">{cases.length}</span>
          <span>total cases</span>
        </div>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel px-6 py-14 text-center">
          <FileText className="mx-auto h-6 w-6 text-ink3" aria-hidden="true" />
          <h3 className="mt-3 text-base font-medium text-ink">No cases to review</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink2">
            Run a synthetic scenario from Operations to create a case and its supporting evidence.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
          <div className="rounded-lg border border-line bg-panel px-4 py-3 lg:hidden">
            <label htmlFor="mobile-case-select" className="block text-xs font-medium text-ink2">Choose a case</label>
            <select
              id="mobile-case-select"
              value={selectedCase?.case_id || ''}
              onChange={(event) => {
                const next = cases.find((item) => item.case_id === event.target.value);
                if (next) setSelectedCase(next);
              }}
              className="focus-console mt-2 min-h-10 w-full rounded-md border border-line-strong bg-void px-3 text-sm text-ink"
            >
              {cases.map((item) => (
                <option key={item.case_id} value={item.case_id}>
                  {item.case_id} · {item.target_account_id}
                </option>
              ))}
            </select>
          </div>

          <aside className="hidden min-h-0 max-h-72 flex-col rounded-lg border border-line bg-panel lg:flex lg:max-h-[calc(100vh-13rem)]" aria-label="Case queue">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-sm font-semibold text-ink">Review queue</h3>
              <span className="font-mono text-xs tabular-nums text-ink2">{cases.length}</span>
            </div>
            <div className="divide-y divide-line overflow-y-auto">
              {cases.map((item) => {
                const isSelected = selectedCase?.case_id === item.case_id;
                return (
                  <button
                    key={item.case_id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCase(item)}
                    className={`focus-console block w-full px-4 py-3.5 text-left transition-colors ${
                      isSelected ? 'bg-raised' : 'hover:bg-raised/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-medium text-ink">{item.case_id}</span>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium capitalize ${
                        isSelected ? 'bg-canary/15 text-canary' : 'bg-void text-ink2'
                      }`}>
                        {displayStatus(item.case_status)}
                      </span>
                    </div>
                    <span className="mt-2 block break-all text-sm font-medium text-ink">{item.target_account_id}</span>
                    <span className="mt-1 block text-xs text-ink2">
                      {item.upstream_feeder_account
                        ? `Feeder candidate · ${item.upstream_feeder_account}`
                        : 'No feeder attributed'}
                    </span>
                    <span className="mt-2 flex items-center justify-between text-xs text-ink3">
                      <span>Review day {item.sop_day_counter} / 60</span>
                      <span>{item.explanation_days_left} days remaining</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedCase && (
            <article className="min-w-0 overflow-hidden rounded-lg border border-line bg-panel" aria-label={`Case ${selectedCase.case_id}`}>
              <header className="border-b border-line px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h3 className="font-mono text-lg font-semibold tracking-tight text-ink">{selectedCase.case_id}</h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-canary/35 bg-canary/10 px-2.5 py-1 text-xs font-medium capitalize text-canary">
                        <span className="h-1.5 w-1.5 rounded-full bg-canary" aria-hidden="true" />
                        {displayStatus(selectedCase.case_status)}
                      </span>
                    </div>
                    <p className="mt-3 break-all text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                      {selectedCase.target_account_id}
                    </p>
                    <p className="mt-1 text-sm text-ink2">
                      <span className="break-all">{selectedCase.target_vpa}</span>
                      <span className="px-1 text-ink3">/</span>
                      <span className="whitespace-nowrap">{selectedCase.target_bank}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 2xl:justify-end">
                    <div>
                      <p className="text-xs text-ink3">Review clock</p>
                      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-ink">
                        Day {selectedCase.sop_day_counter} <span className="text-ink3">/ 60</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink3">Customer response</p>
                      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-ink">
                        {selectedCase.explanation_days_left} days
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenGraph(selectedCase.target_account_id)}
                      className="focus-console inline-flex min-h-10 items-center gap-2 rounded-md border border-line-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-raised"
                    >
                      <Network className="h-4 w-4 text-canary" aria-hidden="true" />
                      Open graph
                    </button>
                  </div>
                </div>
              </header>

              <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <section className="min-w-0 px-5 py-5 sm:px-6" aria-labelledby="evidence-title">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <h4 id="evidence-title" className="text-base font-semibold text-ink">Event history</h4>
                      <p className="mt-1 text-sm text-ink2">Persisted source events for this case</p>
                    </div>
                    {!evidenceLoading && !evidenceError && (
                      <span className="font-mono text-xs tabular-nums text-ink3">{evidenceEvents.length} events</span>
                    )}
                  </div>

                  {evidenceError ? (
                    <div role="alert" className="mt-4 flex items-start gap-2 text-sm text-alarm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{evidenceError}</span>
                    </div>
                  ) : evidenceLoading ? (
                    <p className="py-8 text-sm text-ink2" role="status">Loading case events…</p>
                  ) : evidenceEvents.length === 0 ? (
                    <p className="py-8 text-sm text-ink2">No source events are linked to this case.</p>
                  ) : (
                    <ol className="divide-y divide-line" aria-label="Persisted case event history">
                      {evidenceEvents.map((event) => {
                        const isInbound = event.beneficiary_account_id === selectedCase.target_account_id;
                        return (
                          <li key={event.event_id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 py-4 first:pt-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {isInbound
                                  ? <ArrowDownRight className="h-4 w-4 shrink-0 text-benign" aria-label="Funds directed to this account" />
                                  : <ArrowUpRight className="h-4 w-4 shrink-0 text-ink2" aria-label="Funds directed from this account" />}
                                <span className="font-mono text-xs font-medium text-ink">{event.event_id}</span>
                              </div>
                              <p className="mt-1.5 break-words text-sm text-ink2">
                                {event.sender_account_id} <span className="px-1 text-ink3">→</span> {event.beneficiary_account_id || event.beneficiary_vpa}
                              </p>
                              <p className="mt-1 text-xs text-ink3">
                                <span className="font-medium text-ink2">{event.event_type.replace(/_/g, ' ')}</span>
                                <span className="px-1.5">·</span>{formatTimestamp(event.timestamp)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-medium tabular-nums text-ink">{formatAmount(event.amount_inr)}</p>
                              <p className={`mt-1 text-xs ${event.is_canary_hit ? 'text-canary' : 'text-ink3'}`}>
                                {event.is_canary_hit ? 'Review required' : event.simulated_result.replace(/_/g, ' ').toLowerCase()}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  <div className="mt-5 border-t border-line pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Clock3 className="h-4 w-4 text-ink3" aria-hidden="true" />
                      Case activity
                    </div>
                    {selectedCase.analyst_notes.length > 0 ? (
                      <ol className="mt-3 space-y-3 border-l border-line pl-4">
                        {selectedCase.analyst_notes.map((note, index) => (
                          <li key={`${index}-${note}`} className="relative text-sm leading-6 text-ink2 before:absolute before:-left-[21px] before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-raised before:ring-2 before:ring-panel">
                            {note}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-sm text-ink3">No case activity has been recorded.</p>
                    )}
                  </div>

                  <details className="group mt-5 border-t border-line pt-4">
                    <summary className="focus-console flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                      <span>Export previews</span>
                      <span className="text-xs text-ink3 group-open:hidden">Show</span>
                      <span className="hidden text-xs text-ink3 group-open:inline">Hide</span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-ink">FIU-IND STR narrative preview</h5>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink2">{selectedCase.fiu_str_narrative}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-ink">NCRP-CFCFRMS prototype preview</h5>
                        <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-void p-3 font-mono text-xs leading-5 text-ink2">
                          {JSON.stringify(selectedCase.ncrp_payload_preview, null, 2)}
                        </pre>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadSTIX}
                        className="focus-console inline-flex min-h-10 items-center gap-2 rounded-md border border-line-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-raised"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Download STIX preview
                      </button>
                    </div>
                  </details>
                </section>

                <aside className="space-y-6 border-t border-line bg-void/40 px-5 py-5 lg:border-l lg:border-t-0" aria-label="Case context">
                  <section aria-labelledby="attribution-title">
                    <h4 id="attribution-title" className="text-sm font-semibold text-ink">Network attribution</h4>
                    <dl className="mt-4 space-y-4">
                      <div>
                        <dt className="text-xs text-ink3">Upstream feeder candidate</dt>
                        <dd className="mt-1 break-all font-mono text-sm font-medium text-ink">
                          {selectedCase.upstream_feeder_account || <span className="font-sans font-normal text-ink2">No feeder attributed</span>}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink3">Connected canary-interacting accounts</dt>
                        <dd className="mt-1 font-mono text-sm font-medium tabular-nums text-ink">{selectedCase.connected_mule_count}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink3">Synthetic cluster</dt>
                        <dd className="mt-1 break-all font-mono text-xs leading-5 text-ink2">{selectedCase.cluster_id || 'No cluster attributed'}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="border-t border-line pt-5" aria-labelledby="record-title">
                    <h4 id="record-title" className="text-sm font-semibold text-ink">Case record</h4>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink3">Assigned analyst</dt>
                        <dd className="break-all text-right text-ink2">{selectedCase.assigned_analyst}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink3">Opened</dt>
                        <dd className="text-right text-ink2">{formatTimestamp(selectedCase.created_at)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink3">Review state</dt>
                        <dd className="capitalize text-right text-ink2">{displayStatus(selectedCase.case_status)}</dd>
                      </div>
                    </dl>
                  </section>

                  <div className="flex items-start gap-2 border-t border-line pt-5 text-xs leading-5 text-ink3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>Case actions are disabled until authenticated analyst access is configured.</p>
                  </div>
                </aside>
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
};
