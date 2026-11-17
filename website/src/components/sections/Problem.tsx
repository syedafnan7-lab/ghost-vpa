import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { useInView } from '@/lib/hooks';

const FORCES = [
  {
    label: 'Velocity mismatch',
    body: 'Stolen funds are split across three to six sleeper mules and withdrawn at ATMs within minutes. Victim complaints and inter-bank freeze requests run on hour-and-day latencies.',
    figure: '4 hops · ~15 min',
  },
  {
    label: 'Tabular blindspots',
    body: 'Transaction-only anomaly models score one payment against one profile. A burst of activity can look similar across a mule and a busy merchant; this prototype has not measured production false-positive rates.',
    figure: 'context is missing',
  },
  {
    label: 'Upstream invisibility',
    body: 'Reactive controls follow a victim report to a destination account. The upstream feeder that funded three different mules — and the device that links them — stays outside the picture.',
    figure: 'feeder unseen',
  },
];

function RaceFigure() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);

  return (
    <div ref={ref} className="panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <span className="font-mono text-caption text-ink2">Figure 01 — Two different clocks</span>
        <span className="font-mono text-micro text-ink3">illustrative</span>
      </div>
      <div className="space-y-8 px-5 py-6">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-caption text-canary">Stolen funds</span>
            <span className="font-mono text-micro text-ink3">0 – 30 min</span>
          </div>
          <div className="relative h-px w-full bg-line">
            <div
              className="absolute left-0 top-0 h-px bg-canary transition-all duration-[1200ms] ease-signal"
              style={{ width: inView ? '50%' : '0%' }}
            />
            {[0, 25, 50].map((left, i) => (
              <span
                key={left}
                className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-canary transition-opacity duration-fast"
                style={{ left: `${left}%`, opacity: inView ? 1 : 0, transitionDelay: `${300 + i * 200}ms` }}
              />
            ))}
            <span
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-canary bg-void transition-opacity duration-fast"
              style={{ opacity: inView ? 1 : 0, transitionDelay: '900ms' }}
            />
          </div>
          <div className="mt-2 font-mono text-micro text-ink3">4 hops · ~15 minutes · then ATM</div>
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-caption text-ink2">Victim complaint</span>
            <span className="font-mono text-micro text-ink3">0 – 72 h</span>
          </div>
          <div className="relative h-px w-full bg-line">
            <div
              className="absolute left-0 top-0 h-px bg-ink3 transition-all duration-[1600ms] ease-signal"
              style={{ width: inView ? '100%' : '0%', transitionDelay: '500ms' }}
            />
            <span
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-sm bg-ink3 transition-opacity duration-fast"
              style={{ left: '33%', opacity: inView ? 1 : 0, transitionDelay: '1200ms' }}
            />
            <span
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-sm bg-ink3 transition-opacity duration-fast"
              style={{ left: '100%', opacity: inView ? 1 : 0, transitionDelay: '1800ms' }}
            />
          </div>
          <div className="mt-2 font-mono text-micro text-ink3">NCRP / CFCFRMS · 24–72 h · funds already gone</div>
        </div>
      </div>
      <div className="figure-caption">
        <span>The funds clock runs in minutes. The complaint clock runs in days.</span>
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <Section
      id="problem"
      index="01"
      kicker="The problem"
      title="The laundering trilemma"
      lede="Domestic fast payments move faster than the complaints that chase them. Three gaps compound — and each one is structural, not a tuning problem."
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <Reveal stagger className="space-y-4">
          {FORCES.map((force) => (
            <article key={force.label} className="panel p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                  {force.label}
                </h3>
                <span className="font-mono text-caption text-canary">{force.figure}</span>
              </div>
              <p className="mt-3 text-body text-ink2">{force.body}</p>
            </article>
          ))}
        </Reveal>
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <RaceFigure />
          <p className="mt-4 text-body text-ink2">
            The question Ghost-VPA asks is not “how do we score the next transaction better?” It is
            “how do we make the criminal hand us the evidence himself?”
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
