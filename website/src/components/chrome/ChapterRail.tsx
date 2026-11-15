import { NAV_ITEMS } from '@/data/nav';
import { useScrollSpy } from '@/lib/hooks';

export function ChapterRail() {
  const active = useScrollSpy(NAV_ITEMS.map((item) => item.id));

  return (
    <nav
      aria-label="Chapter index"
      className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 xl:flex"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="group flex items-center gap-3 py-1.5"
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className={`h-px transition-all duration-normal ease-signal ${
                isActive ? 'w-8 bg-canary' : 'w-4 bg-lineStrong group-hover:w-6 group-hover:bg-ink3'
              }`}
            />
            <span
              className={`font-mono text-micro transition-colors duration-fast ${
                isActive ? 'text-canary' : 'text-ink3 group-hover:text-ink2'
              }`}
            >
              {item.index}
            </span>
            <span
              className={`hidden font-mono text-micro transition-all duration-fast 2xl:block ${
                isActive ? 'text-ink2 opacity-100' : 'text-ink3 opacity-0 group-hover:opacity-100'
              }`}
            >
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
