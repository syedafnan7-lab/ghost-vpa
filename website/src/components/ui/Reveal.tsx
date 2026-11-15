import type { ReactNode } from 'react';
import { useInView } from '@/lib/hooks';

interface RevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  threshold?: number;
  id?: string;
}

export function Reveal({ children, className = '', stagger = false, threshold = 0.18, id }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);
  const state = `${stagger ? 'reveal-stagger' : 'reveal'} ${inView ? 'is-visible' : ''}`;
  return (
    <div ref={ref} id={id} className={`${state} ${className}`.trim()}>
      {children}
    </div>
  );
}
