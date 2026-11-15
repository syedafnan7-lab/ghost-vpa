import { useEffect, useState } from 'react';
import { Mark } from '@/components/ui/Mark';
import { NAV_ITEMS, REPO_URL } from '@/data/nav';

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
        scrolled || open ? 'border-line bg-void/85 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-5 md:px-8">
        <a href="#top" className="group flex items-center gap-3" aria-label="Ghost-VPA home">
          <Mark size={26} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">Ghost-VPA</span>
            <span className="mt-1 font-mono text-micro text-ink3">bank-controlled honeypot VPAs</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Chapters">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-3 py-2 font-mono text-caption text-ink2 transition-colors duration-fast ease-signal hover:text-ink"
            >
              <span className="mr-1.5 text-canary">{item.index}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="chip hidden sm:inline-flex">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-canary" />
            SIMULATED PROTOTYPE
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost hidden md:inline-flex"
          >
            Repository
          </a>
          <button
            type="button"
            className="btn-ghost lg:hidden"
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
                className="flex items-baseline gap-2 px-2 py-2.5 font-mono text-caption text-ink2 transition-colors hover:text-ink"
              >
                <span className="text-canary">{item.index}</span>
                {item.label}
              </a>
            ))}
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block border-t border-line px-2 pt-3 font-mono text-caption text-ink3"
          >
            Repository → github.com/syedafnan7-lab/ghost-vpa
          </a>
        </nav>
      ) : null}
    </header>
  );
}
