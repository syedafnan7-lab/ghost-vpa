import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionProps {
  id: string;
  index?: string;
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

export function Section({ id, index, kicker, title, lede, children, className = '', headerClassName = '' }: SectionProps) {
  return (
    <section id={id} className={`relative border-t border-line ${className}`}>
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-8 md:py-24 lg:py-28">
        <Reveal className={`mb-10 md:mb-14 ${headerClassName}`.trim()}>
          <div className="flex items-baseline gap-4">
            {index ? <span className="font-mono text-caption text-canary">{index}</span> : null}
            {kicker ? <span className="label-mono">{kicker}</span> : null}
          </div>
          <h2 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-ink md:text-5xl text-balance">
            {title}
          </h2>
          {lede ? <p className="mt-5 max-w-2xl text-body text-ink2 md:text-lg">{lede}</p> : null}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
