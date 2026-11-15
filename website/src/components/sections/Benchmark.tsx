import { useMemo, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import {
  BENCHMARK_CAVEATS,
  DATASET_FACTS,
  FEATURE_IMPORTANCE,
  MODELS,
  PR_CURVE,
  type CurvePoint,
} from '@/data/benchmark';
import { ms, pct } from '@/lib/format';

const CURVE_W = 640;
const CURVE_H = 360;
const MARGIN = { top: 18, right: 18, bottom: 40, left: 44 };

function curveX(recall: number): number {
  return MARGIN.left + recall * (CURVE_W - MARGIN.left - MARGIN.right);
}
function curveY(precision: number): number {
  return MARGIN.top + (1 - precision) * (CURVE_H - MARGIN.top - MARGIN.bottom);
}

type CurveModel = 'tab' | 'graph';

interface Hover {
  model: CurveModel;
  point: CurvePoint;
}

function PrCurve() {
  const [hover, setHover] = useState<Hover | null>(null);

  const { tabularPath, graphPath } = useMemo(() => {
    const build = (key: 'tab' | 'graph') =>
      PR_CURVE.map((point, i) => {
        const x = curveX(point[`${key}Recall`]);
        const y = curveY(point[`${key}Precision`]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
    return { tabularPath: build('tab'), graphPath: build('graph') };
  }, []);

  return (
    <div className="panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <span className="font-mono text-caption text-ink2">Figure 04 — Precision–recall</span>
        <span className="font-mono text-micro text-ink3">
          {hover
            ? `${hover.model === 'tab' ? 'Tabular' : 'Graph'} · recall ${hover.point[
                `${hover.model}Recall`
              ].toFixed(3)} · precision ${hover.point[`${hover.model}Precision`].toFixed(3)}`
            : 'hover a point'}
        </span>
      </div>
      <div className="px-4 py-4">
        <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} className="h-auto w-full" role="img" aria-label="Precision recall curves for the tabular and graph models">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={CURVE_W - MARGIN.right}
                y1={curveY(tick)}
                y2={curveY(tick)}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="1"
              />
              <line
                y1={MARGIN.top}
                y2={CURVE_H - MARGIN.bottom}
                x1={curveX(tick)}
                x2={curveX(tick)}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="1"
              />
              <text x={curveX(tick)} y={CURVE_H - MARGIN.bottom + 18} textAnchor="middle" fontSize="10" fill="#5C6B7E" fontFamily="JetBrains Mono, monospace">
                {tick.toFixed(2)}
              </text>
              <text x={MARGIN.left - 8} y={curveY(tick) + 3} textAnchor="end" fontSize="10" fill="#5C6B7E" fontFamily="JetBrains Mono, monospace">
                {tick.toFixed(2)}
              </text>
            </g>
          ))}
          <text x={CURVE_W / 2} y={CURVE_H - 6} textAnchor="middle" fontSize="11" fill="#9AA7B8" fontFamily="JetBrains Mono, monospace">
            recall
          </text>
          <text x={14} y={CURVE_H / 2} textAnchor="middle" fontSize="11" fill="#9AA7B8" fontFamily="JetBrains Mono, monospace" transform={`rotate(-90 14 ${CURVE_H / 2})`}>
            precision
          </text>

          <path d={tabularPath} fill="none" stroke="#9AA7B8" strokeWidth="1.5" />
          <path d={graphPath} fill="none" stroke="#F5A524" strokeWidth="1.8" />

          {PR_CURVE.map((point, i) => (
            <g key={i}>
              <circle
                cx={curveX(point.tabRecall)}
                cy={curveY(point.tabPrecision)}
                r="6"
                fill="transparent"
                onMouseEnter={() => setHover({ model: 'tab', point })}
                onMouseLeave={() => setHover(null)}
              />
              <circle cx={curveX(point.tabRecall)} cy={curveY(point.tabPrecision)} r="2.5" fill="#9AA7B8" />
              <circle
                cx={curveX(point.graphRecall)}
                cy={curveY(point.graphPrecision)}
                r="6"
                fill="transparent"
                onMouseEnter={() => setHover({ model: 'graph', point })}
                onMouseLeave={() => setHover(null)}
              />
              <circle cx={curveX(point.graphRecall)} cy={curveY(point.graphPrecision)} r="2.5" fill="#F5A524" />
            </g>
          ))}
        </svg>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3 font-mono text-micro">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-ink2">
              <span className="h-0.5 w-4 bg-ink2" /> Tabular LightGBM (PR-AUC 0.630)
            </span>
            <span className="inline-flex items-center gap-1.5 text-canary">
              <span className="h-0.5 w-4 bg-canary" /> Canary-Seeded Graph Challenger (PR-AUC 1.000)
            </span>
          </div>
          <span className="chip border-emerald-500/40 text-emerald-400">
            -99.3% FALSE POSITIVES (5 vs 769)
          </span>
        </div>
      </div>
    </div>
  );
}

function ConfusionMatrix({ modelKey }: { modelKey: (typeof MODELS)[number]['key'] }) {
  const model = MODELS.find((m) => m.key === modelKey)!;
  const cells = [
    { label: 'TN', value: model.confusion.tn, tone: 'text-ink2' },
    { label: 'FP', value: model.confusion.fp, tone: model.confusion.fp > 100 ? 'text-alarm' : 'text-canary' },
    { label: 'FN', value: model.confusion.fn, tone: 'text-ink2' },
    { label: 'TP', value: model.confusion.tp, tone: 'text-benign' },
  ];
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-panel px-3 py-2.5">
          <div className="font-mono text-micro text-ink3">{cell.label}</div>
          <div className={`mt-0.5 font-mono text-lg ${cell.tone}`}>{cell.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

export function Benchmark() {
  const rows: { label: string; key: string; format: (model: (typeof MODELS)[number]) => string }[] = [
    { label: 'Precision', key: 'precision', format: (m) => pct(m.precision) },
    { label: 'Recall', key: 'recall', format: (m) => pct(m.recall) },
    { label: 'F1', key: 'f1', format: (m) => m.f1.toFixed(3) },
    { label: 'PR-AUC', key: 'prAuc', format: (m) => m.prAuc.toFixed(3) },
    { label: 'ROC-AUC', key: 'rocAuc', format: (m) => m.rocAuc.toFixed(3) },
    { label: 'False-positive rate', key: 'fpr', format: (m) => pct(m.fpr) },
    { label: 'False positives', key: 'fp', format: (m) => m.confusion.fp.toLocaleString() },
    { label: 'True positives', key: 'tp', format: (m) => m.confusion.tp.toLocaleString() },
    { label: 'p50 latency', key: 'p50', format: (m) => ms(m.p50) },
    { label: 'p95 latency', key: 'p95', format: (m) => ms(m.p95) },
    { label: 'p99 latency', key: 'p99', format: (m) => ms(m.p99) },
  ];

  return (
    <Section
      id="benchmark"
      index="06"
      kicker="The benchmark"
      title="An experimental benchmark, shown with its caveats"
      lede="The 100,000-node comparison is real, reproducible code. It is also synthetic and experimental — so the numbers are presented with the protocol that produced them, not as a promise."
    >
      <Reveal>
        <div className="border border-canary/40 bg-canary/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="chip border-canary/50 text-canary">EXPERIMENTAL · SYNTHETIC</span>
            <span className="chip">NOT INDEPENDENTLY VALIDATED</span>
          </div>
          <p className="mt-3 max-w-4xl text-body text-ink2">
            These results demonstrate the behaviour of canary-seeded graph features in simulation.
            They are not measured real-world accuracy, not a production benchmark, and not evidence of
            regulatory approval. A near-perfect score on a synthetic network is a caution signal.
          </p>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <PrCurve />
        </Reveal>
        <Reveal className="space-y-4">
          <div className="panel">
            <div className="border-b border-line px-4 py-3">
              <span className="font-mono text-caption text-ink2">LightGBM split / gain importance</span>
            </div>
            <div className="space-y-2.5 px-4 py-4">
              {FEATURE_IMPORTANCE.map((feature) => (
                <div key={feature.feature}>
                  <div className="flex items-baseline justify-between font-mono text-micro text-ink3">
                    <span>{feature.feature}</span>
                    <span className="text-ink2">{feature.weight}</span>
                  </div>
                  <div className="mt-1 h-1 w-full bg-line">
                    <div
                      className="h-1 bg-canary"
                      style={{ width: `${(feature.weight / FEATURE_IMPORTANCE[0].weight) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="figure-caption">
              <span>Top graph signals outrank raw amount.</span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line font-mono text-micro text-ink3">
                <th className="px-4 py-3 font-medium">Metric</th>
                {MODELS.map((model) => (
                  <th key={model.key} className="px-4 py-3 font-medium">
                    {model.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-caption text-ink2">{row.label}</td>
                  {MODELS.map((model) => (
                    <td
                      key={model.key}
                      className={`px-4 py-2.5 font-mono text-caption ${
                        model.key === 'graph' ? 'text-canary' : 'text-ink2'
                      }`}
                    >
                      {row.format(model)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="figure-caption">
            <span>Chronological 70 / 30 holdout · seed 42 · 7,500 test rows</span>
            <span>latest-benchmark-results.json</span>
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-6 grid gap-4 md:grid-cols-3">
        {MODELS.map((model) => (
          <div key={model.key} className="panel p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-base font-semibold tracking-[-0.02em]">{model.short}</h3>
              <span className="font-mono text-micro text-ink3">F1 {model.f1.toFixed(3)}</span>
            </div>
            <p className="mt-1 text-micro text-ink3">{model.name}</p>
            <div className="mt-3">
              <ConfusionMatrix modelKey={model.key} />
            </div>
          </div>
        ))}
      </Reveal>

      <Reveal className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="panel">
          <div className="border-b border-line px-4 py-3">
            <span className="font-mono text-caption text-ink2">Dataset facts</span>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line">
            {DATASET_FACTS.map((fact) => (
              <div key={fact.label} className="bg-panel px-4 py-3">
                <div className="font-mono text-micro text-ink3">{fact.label}</div>
                <div className="mt-0.5 font-mono text-lg text-ink">{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="border-b border-line px-4 py-3">
            <span className="font-mono text-caption text-ink2">Read this before quoting any number</span>
          </div>
          <ol className="space-y-3 px-5 py-4">
            {BENCHMARK_CAVEATS.map((caveat, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-caption text-canary">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-body text-ink2">{caveat}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </Section>
  );
}
