import { useMemo, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { buildDossier, downloadJson } from '@/data/dossier';

type Tab = 'str' | 'ncrp' | 'stix';

export function Evidence() {
  const dossier = useMemo(() => buildDossier(), []);
  const [tab, setTab] = useState<Tab>('str');

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
      lede="A flag is not a case. Every canary hit compiles into a dossier with a statutory countdown, a structured narrative and machine-readable threat indicators."
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
                  <span className="font-mono text-caption text-ink2">RBI 60-day hold</span>
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
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              Tamper-evident by construction
            </h3>
            <p className="mt-2 text-body text-ink2">
              Every audit entry is a SHA-256 hash of the previous hash, the timestamp, the actor role
              and the canonical action payload. The genesis hash is sixty-four zeroes. A altered record
              breaks the chain.
            </p>
            <p className="mt-3 font-mono text-micro text-ink3">
              hash_i = SHA256(hash_i-1 ‖ timestamp ‖ role ‖ action ‖ json)
            </p>
          </article>

          <article className="panel p-5">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              Proportionate, not punitive
            </h3>
            <p className="mt-2 text-body text-ink2">
              A canary hit sets <span className="font-mono text-alarm">REVIEW_REQUIRED</span>. Formal
              holds and customer outreach require a human supervisor and run inside the RBI 20-day
              explanation window. The system does not freeze, accuse or message anyone on its own.
            </p>
          </article>

          <article className="panel p-5">
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
              Threat intel that admits it is synthetic
            </h3>
            <p className="mt-2 text-body text-ink2">
              The STIX 2.1 bundle carries{' '}
              <span className="font-mono text-canary">x_ghostvpa_synthetic: true</span> on every
              indicator, with confidence 95. It is a format demonstration, not a live feed.
            </p>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
