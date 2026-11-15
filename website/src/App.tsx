import { useMemo } from 'react';
import { CanaryField, type FieldMode } from '@/components/canvas/CanaryField';
import { TopBar } from '@/components/chrome/TopBar';
import { ChapterRail } from '@/components/chrome/ChapterRail';
import { Footer } from '@/components/chrome/Footer';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { Shift } from '@/components/sections/Shift';
import { Mechanism } from '@/components/sections/Mechanism';
import { GraphLab } from '@/components/sections/GraphLab';
import { Evidence } from '@/components/sections/Evidence';
import { Benchmark } from '@/components/sections/Benchmark';
import { Architecture } from '@/components/sections/Architecture';
import { Boundaries } from '@/components/sections/Boundaries';
import { NAV_ITEMS } from '@/data/nav';
import { useScrollSpy } from '@/lib/hooks';

export default function App() {
  const sectionIds = useMemo(() => ['top', ...NAV_ITEMS.map((item) => item.id)], []);
  const active = useScrollSpy(sectionIds);

  const mode: FieldMode = active === 'top' || active === '' ? 'idle' : (active as FieldMode);

  return (
    <div className="relative min-h-screen bg-void text-ink">
      <CanaryField mode={mode} />
      <TopBar />
      <ChapterRail />
      <main className="relative z-10">
        <Hero />
        <Problem />
        <Shift />
        <Mechanism />
        <GraphLab />
        <Evidence />
        <Benchmark />
        <Architecture />
        <Boundaries />
      </main>
      <Footer />
    </div>
  );
}
