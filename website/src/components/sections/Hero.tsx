import { Mark } from '@/components/ui/Mark';
import { Reveal } from '@/components/ui/Reveal';

const TELEMETRY = [
  { value: '< 5 ms', label: 'tripwire on canary probe', note: 'simulated rail' },
  { value: '₹0', label: 'posted to the honeypot', note: 'pre-routing intercept' },
  { value: '72 h', label: 'temporal graph window', note: 'sliding, pruned' },
  { value: '4', label: 'canaries in the registry', note: 'synthetic seed data' },
];

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-20 pt-32 md:px-8 md:pt-36">
        <Reveal stagger>
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-canary" />
              BANK-CONTROLLED HONEYPOT VPAS
            </span>
            <span className="chip">CANARY-SEEDED TEMPORAL GRAPH INTELLIGENCE</span>
          </div>

          <h1 className="mt-8 max-w-5xl font-display text-[13vw] font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-6xl md:text-7xl lg:text-[86px] text-balance">
            The transfer never lands. The ring still shows itself.
          </h1>

          <p className="mt-7 max-w-2xl text-body text-ink2 md:text-lg">
            Ghost-VPA registers bank-controlled canary VPAs on domestic payment rails. The moment a
            mule probes one, a pre-routing tripwire intercepts the attempt, flags the sender for
            review, and seeds a temporal graph that traces the network upstream — before cash-out.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#mechanism" className="btn-primary">
              Watch the interception
            </a>
            <a href="#graph" className="btn-ghost">
              Explore the graph
            </a>
            <span className="font-mono text-micro text-ink3">scroll — the field is the system</span>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {TELEMETRY.map((item) => (
              <div key={item.label} className="bg-void/70 px-4 py-4 backdrop-blur-sm">
                <div className="font-mono text-2xl font-medium text-canary md:text-3xl">{item.value}</div>
                <div className="mt-1 text-caption text-ink2">{item.label}</div>
                <div className="mt-0.5 font-mono text-micro text-ink3">{item.note}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <Mark size={20} className="opacity-40" />
      </div>
    </section>
  );
}
