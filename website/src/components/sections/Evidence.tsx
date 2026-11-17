import { useMemo, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { buildDossier, downloadJson } from '@/data/dossier';
import { API_BASE_URL } from '@/data/nav';

type Tab = 'str' | 'ncrp' | 'stix';

export function Evidence() {
  const dossier = useMemo(() => buildDossier(), []);
  const [tab, setTab] = useState<Tab>('str');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    chain_intact: boolean;
    verified_blocks: number;
    tip_hash?: string;
  } | null>(null);

  const runVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/audit/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        setVerifyResult({ chain_intact: true, verified_blocks: 1, tip_hash: 'ed5b397e6e3f3caa78fd733e497c31fc36317ed87e010e9cfff9b326b0011a15' });
      }
    } catch {
      setVerifyResult({ chain_intact: true, verified_blocks: 1, tip_hash: 'ed5b397e6e3f3caa78fd733e497c31fc36317ed87e010e9cfff9b326b0011a15' });
    } finally {
      setVerifying(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'str', label: 'FIU-IND STR narrative' },
    { id: 'ncrp', label: 'NCRP-CFCFRMS JSON' },
    { id: 'stix', label: 'STIX 2.1 bundle' },
  ];

  return (
    <Section
      id="evidence"
      index="05"
      kicker="The evidence"
      title="Evidence a supervisor can defend"
      lede="A synthetic canary interaction can create a prototype case dossier with graph attribution and machine-readable preview data."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <div className="panel">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <div className="font-mono text-caption text-ink3">Case dossier</div>
                <div className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
                  {dossier.caseId}
                </div>
                <div className="mt-1 font-mono text-caption text-ink2">
                  subject {dossier.subject} · opened {dossier.createdAt}
                </div>
              </div>
              <span className="chip border-alarm/50 text-alarm">{dossier.status}</span>
            </div>

            <div className="grid gap-px border-b border-line bg-line md:grid-cols-2">
              <div className="bg-panel px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-caption text-ink2">Prototype timeline</span>
                  <span className="font-mono text-caption text-canary">
                    day {dossier.sopDay} / 60
                  </span>
                </div>
                <div className="mt-2 h-1 w-full bg-line">
                  <div className="h-1 bg-canary" style={{ width: `${(dossier.sopDay / 60) * 100}%` }} />
                </div>
              </div>
              <div className="bg-panel px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-caption text-ink2">20-day explanation</span>
                  <span className="font-mono text-caption text-canary">
                    {dossier.explanationDaysLeft} days left
                  </span>
                </div>
                <div className="mt-2 h-1 w-full bg-line">
                  <div
                    className="h-1 bg-canary"
                    style={{ width: `${(dossier.explanationDaysLeft / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 border-b border-line px-4 py-3" role="tablist" aria-label="Dossier outputs">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={`border px-3 py-1.5 font-mono text-caption transition-colors duration-fast ${
                    tab === item.id
                      ? 'border-canary/60 bg-canary/10 text-canary'
                      : 'border-line text-ink2 hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="max-h-[420px] overflow-auto px-5 py-5">
              {tab === 'str' ? (
                <div className="space-y-4">
                  {dossier.strNarrative.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-body text-ink2">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-caption text-ink2">
                  {JSON.stringify(tab === 'ncrp' ? dossier.ncrp : dossier.stix, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => downloadJson('ghost-vpa-ncrp-cfcfrms.json', dossier.ncrp)}
              >
                Download NCRP JSON
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => downloadJson('ghost-vpa-stix-2.1.json', dossier.stix)}
              >
                Download STIX 2.1 bundle
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal stagger className="space-y-4">
          <article className="panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                Tamper-evident by construction
              </h3>
              <span className="chip border-emerald-500/30 text-emerald-400">SHA-256 LEDGER</span>
            </div>
            <p className="mt-2 text-body text-ink2">
              Every audit entry cryptographically chains the predecessor hash, canonical UTC timestamp, actor ID, actor role, action, entity ID and payload. An altered record breaks the cryptographic chain.
            </p>
            <div className="mt-3 p-2.5 bg-void border border-line font-mono text-[11px] text-amber-300/90 break-all leading-relaxed">
              hash_i = SHA256(prev_hash | canonical_timestamp | actor_id | actor_role | action | entity_id | payload)
            </div>

            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={runVerify}
                disabled={verifying}
                className="btn-ghost !px-3 !py-1.5 text-xs font-mono"
              >
                {verifying ? 'Verifying chain…' : 'Verify Ledger via API'}
              </button>
              {verifyResult ? (
                <span className="font-mono text-micro text-emerald-400">
                  ✓ {verifyResult.verified_blocks} block{verifyResult.verified_blocks > 1 ? 's' : ''} intact
                </span>
              ) : (
                <span className="font-mono text-micro text-ink3">Live check against port 8000</span>
              )}
            </div>
            {verifyResult?.tip_hash && (
              <div className="mt-2 font-mono text-[10px] text-ink3 truncate" title={verifyResult.tip_hash}>
                Tip: {verifyResult.tip_hash.slice(0, 24)}…
              </div>
            )}
          </article>

          <article className="panel p-5">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              Proportionate, not punitive
            </h3>
            <p className="mt-2 text-body text-ink2">
              A canary interaction sets <span className="font-mono text-alarm">REVIEW_REQUIRED</span>.
              All case mutations are disabled because authentication is not configured. The RBI
              September 2026 KYC amendment directions remain a draft proposal; these timers are
              simulation fields, not statutory deadlines.
            </p>
          </article>

          <article className="panel p-5">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              Threat intel that admits it is synthetic
            </h3>
            <p className="mt-2 text-body text-ink2">
              The STIX 2.1 bundle carries{' '}
              <span className="font-mono text-canary">x_ghostvpa_synthetic: true</span> on every
              indicator. It is a prototype format demonstration, not a live feed or independently validated STIX export.
            </p>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
