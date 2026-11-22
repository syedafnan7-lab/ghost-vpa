import { Mark } from '@/components/ui/Mark';
import { NAV_ITEMS, REPO_URL, WORKBENCH_URL } from '@/data/nav';

const EVIDENCE_LINKS = [
  { label: 'Live Analyst Workbench (Port 5173)', href: WORKBENCH_URL },
  { label: 'Repository (GitHub)', href: REPO_URL },
  { label: 'Architecture specification', href: `${REPO_URL}/docs/designs/ghost-vpa-architecture.md` },
  { label: 'Benchmark methodology', href: `${REPO_URL}/docs/benchmark-methodology.md` },
  { label: 'Remediation register', href: `${REPO_URL}/docs/remediation/remediation-register.md` },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-panel/60">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Mark size={26} />
              <span className="font-display text-lg font-semibold tracking-[-0.02em]">Ghost-VPA</span>
            </div>
            <p className="mt-4 max-w-md text-body text-ink2">
              Bank-controlled honeypot VPAs and canary-seeded temporal graph intelligence for
              pre-cash-out mule-network interdiction. A simulated research prototype.
            </p>
            <p className="mt-5 max-w-md font-mono text-micro text-ink3">
              Zero real funds movement · zero live rails · zero synthetic KYC · zero NPCI switch
              changes.
            </p>
          </div>

          <div>
            <h3 className="label-mono mb-4">Chapters</h3>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="font-mono text-caption text-ink2 transition-colors hover:text-ink"
                  >
                    <span className="mr-2 text-canary">{item.index}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="label-mono mb-4">Evidence &amp; code</h3>
            <ul className="space-y-2">
              {EVIDENCE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-caption text-ink2 transition-colors hover:text-ink"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 font-mono text-micro text-ink3 md:flex-row md:items-center md:justify-between">
          <span>Ghost-VPA · Synthetic investigation prototype</span>
          <span>Apache 2.0</span>
        </div>
      </div>
    </footer>
  );
}
