import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { CANARIES } from '@/data/canaries';

const TYPES = [
  {
    name: 'Bank-controlled canary (proposed)',
    body: 'The research concept is a bank-controlled payment identifier used as an interaction sensor. It has not been provisioned, legally approved, or tested for discoverability.',
  },
  {
    name: 'Synthetic demo identifier',
    body: 'The local demo uses pseudonymous synthetic VPAs only. It has no customer-surrendered identifier, identity data, real beneficiary lookup, or real payment request.',
  },
];

export function Shift() {
  return (
    <Section
      id="shift"
      index="02"
      kicker="The deception shift"
      title="The receiver is the sensor"
      lede="The hypothesis is that an interaction with a bank-controlled endpoint could add a distinct signal. This prototype does not establish attacker behavior or operational feasibility."
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal stagger className="space-y-4">
            {TYPES.map((type) => (
              <article key={type.name} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-canary" />
                  <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{type.name}</h3>
                </div>
                <p className="mt-3 text-body text-ink2">{type.body}</p>
              </article>
            ))}
          </Reveal>

          <Reveal className="mt-6">
            <div className="panel p-5">
              <div className="flex flex-wrap items-center gap-y-3 gap-x-0 font-mono text-caption">
                <span className="border border-line px-3 py-2 text-ink2">mule probe</span>
                <span className="px-2 text-ink3">→</span>
                <span className="border border-line px-3 py-2 text-ink2">proposed bank interface</span>
                <span className="px-2 text-ink3">→</span>
                <span className="border border-canary/50 px-3 py-2 text-canary">O(1) registry match</span>
                <span className="px-2 text-ink3">→</span>
                <span className="border border-line px-3 py-2 text-ink2">review signal</span>
              </div>
              <p className="mt-4 text-body text-ink2">
                This is a proposed flow only. No switch, bank interface, or ledger posting instruction is connected in this prototype.
              </p>
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <p className="border-l-2 border-canary/60 pl-4 text-caption text-ink3">
              The RBI September 2026 KYC Amendment Directions are a{' '}
              <span className="text-ink2">draft proposal</span> published for consultation on
              11 September 2026, with commencement targeted for 1 April 2027. They are not an enacted
              mandate.
            </p>
          </Reveal>
        </div>

        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="panel">
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-caption text-ink2">Figure 02 — Synthetic demo registry</span>
              <span className="font-mono text-micro text-ink3">honeypot_registry.py</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-micro text-ink3">
                    <th className="px-4 py-2.5 font-medium">VPA</th>
                    <th className="px-4 py-2.5 font-medium">Bank</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CANARIES.map((canary) => (
                    <tr key={canary.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-caption text-ink">{canary.vpa}</td>
                      <td className="px-4 py-3 font-mono text-caption text-ink2">{canary.bank}</td>
                      <td className="px-4 py-3">
                        <span className="chip">{canary.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-caption text-benign">
                          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-benign" />
                          {canary.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="figure-caption">
              <span>{CANARIES.length} synthetic canary endpoints · 3 regulatory · 1 consented</span>
              <span>seed data</span>
            </div>
          </div>
          <p className="mt-4 text-body text-ink2">
            Each canary stays <span className="text-ink">ACTIVE</span> after a hit so repeated probes
            keep counting. A hit is an operational flag — never an accusation.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
