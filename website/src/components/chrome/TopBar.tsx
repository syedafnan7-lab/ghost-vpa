import { useEffect, useState } from 'react';
import { Mark } from '@/components/ui/Mark';
import { NAV_ITEMS, REPO_URL, WORKBENCH_URL } from '@/data/nav';

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-normal ease-signal ${
        scrolled || open ? 'border-line bg-void/90 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-5 md:px-8">
        <a href="#top" className="group flex items-center gap-3 shrink-0" aria-label="Ghost-VPA home">
          <Mark size={26} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">Ghost-VPA</span>
            <span className="mt-1 font-mono text-micro text-ink3">bank-controlled honeypot VPAs</span>
          </span>
        </a>

        <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex" aria-label="Chapters">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-2.5 py-1.5 font-mono text-caption text-ink2 transition-colors duration-fast ease-signal hover:text-ink whitespace-nowrap"
            >
              <span className="mr-1 text-canary">{item.index}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="chip hidden 2xl:inline-flex">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-canary" />
            SIMULATED PROTOTYPE
          </span>
          <a
            href={WORKBENCH_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary !px-3.5 !py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.98] transition-transform"
            title="Open live Analyst Operations Workbench on Port 5173"
          >
            <span>Live Workbench</span>
            <span className="font-mono text-[10px]">→</span>
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost !px-3 !py-1.5 text-xs hidden md:inline-flex"
          >
            Repository
          </a>
          <button
            type="button"
            className="btn-ghost lg:hidden !px-3 !py-1.5 text-xs"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-void/95 px-5 py-4 backdrop-blur-md lg:hidden" aria-label="Chapters mobile">
          <div className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-2 px-2 py-2.5 font-mono text-caption text-ink2 transition-colors hover:text-ink whitespace-nowrap"
              >
                <span className="text-canary">{item.index}</span>
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            <a
              href={WORKBENCH_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full text-center py-2.5"
            >
              Launch Live Workbench (Port 5173) →
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="block px-2 font-mono text-caption text-ink3"
            >
              Repository → github.com/syedafnan7-lab/ghost-vpa
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
