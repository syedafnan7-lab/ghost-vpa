import { useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { BOUNDARIES, STATUS_LABEL, TIERS, type BoundaryStatus } from '@/data/architecture';

const STATUS_STYLE: Record<BoundaryStatus, string> = {
  implemented: 'border-benign/50 text-benign',
  prototype: 'border-canary/50 text-canary',
  proposed: 'border-feeder/50 text-feeder',
};

export function Architecture() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = TIERS[activeIndex];

  return (
    <Section
      id="architecture"
      index="07"
      kicker="The architecture"
      title="A proposed bank-side architecture"
      lede="The diagram describes a possible integration boundary. This repository implements a simulation, an in-memory graph, and local case views; it has no bank or payment-rail connection."
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <div className="space-y-3">
            {TIERS.map((tier, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={tier.index}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-expanded={isActive}
                  className={`group w-full border px-5 py-4 text-left transition-colors duration-normal ease-signal ${
                    isActive ? 'border-canary/50 bg-canary/5' : 'border-line bg-panel hover:border-lineStrong'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-caption ${isActive ? 'text-canary' : 'text-ink3'}`}>
                      {tier.index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                        {tier.name}
                      </h3>
                      <p className="mt-0.5 truncate text-caption text-ink2">{tier.role}</p>
                    </div>
                    <span className={`chip hidden sm:inline-flex ${STATUS_STYLE[tier.status]}`}>
                      {STATUS_LABEL[tier.status]}
                    </span>
                    <span className={`font-mono text-ink3 transition-transform duration-normal ${isActive ? 'rotate-90 text-canary' : ''}`}>
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="panel">
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-caption text-ink2">Tier {active.index} — {active.name}</span>
              <span className={`chip ${STATUS_STYLE[active.status]}`}>{STATUS_LABEL[active.status]}</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-body text-ink2">{active.role}</p>
              <h4 className="label-mono mt-5">Modules</h4>
              <ul className="mt-2 space-y-1.5">
                {active.modules.map((module) => (
                  <li key={module} className="flex items-start gap-2 text-caption text-ink2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-canary" />
                    {module}
                  </li>
                ))}
              </ul>
              <h4 className="label-mono mt-5">Files</h4>
              <ul className="mt-2 space-y-1.5">
                {active.files.map((file) => (
                  <li key={file} className="break-all font-mono text-micro text-ink3">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
            <div className="figure-caption">
              <span>Select a tier to inspect it.</span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <h3 className="font-display text-2xl font-semibold tracking-[-0.03em]">
          Integration boundary
        </h3>
        <p className="mt-2 max-w-3xl text-body text-ink2">
          What a pilot would actually connect to — and what stays a format demonstration. The
          prototype never touches a live switch, ledger or filing channel.
        </p>
        <div className="panel mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line font-mono text-micro text-ink3">
                <th className="px-4 py-3 font-medium">Interface</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {BOUNDARIES.map((boundary) => (
                <tr key={boundary.name} className="border-b border-line/60 last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-caption text-ink">{boundary.name}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${STATUS_STYLE[boundary.status]}`}>
                      {STATUS_LABEL[boundary.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-caption text-ink2">{boundary.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}
