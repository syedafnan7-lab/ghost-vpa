import { useCallback, useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EgoGraph } from '@/components/demos/EgoGraph';
import { AMBIENT_TRAFFIC, recordsFor, type ScenarioId } from '@/data/scenarios';
import { buildScenarioGraph, evidenceFor, type NodeKind } from '@/data/graph';
import { WORKBENCH_URL } from '@/data/nav';
import { inr, minutes } from '@/lib/format';

interface LegendItem {
  kind: NodeKind | 'neutral';
  label: string;
  shape: 'hex' | 'square' | 'circle';
  fill: string;
}

const LEGEND: LegendItem[] = [
  { kind: 'CANARY', label: 'Canary Honeypot', shape: 'hex', fill: '#F5A524' },
  { kind: 'MULE', label: 'Suspected Mule (triage)', shape: 'square', fill: '#E8EEF7' },
  { kind: 'FEEDER', label: 'Upstream Feeder', shape: 'circle', fill: '#D95926' },
  { kind: 'DEVICE', label: 'Shared Device', shape: 'circle', fill: '#38BDF8' },
  { kind: 'neutral', label: 'Benign Account', shape: 'circle', fill: '#2DD4A7' },
];

export function GraphLab() {
  const [scenario, setScenario] = useState<ScenarioId>('B');
  const [windowHours, setWindowHours] = useState(72);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graph = useMemo(() => {
    const records = [...recordsFor(scenario), ...AMBIENT_TRAFFIC].filter(
      (record) => record.minutesAgo <= windowHours * 60,
    );
    return buildScenarioGraph(records);
  }, [scenario, windowHours]);

  useEffect(() => {
    // Automatically select the primary canary or feeder seed node when switching scenarios or if unselected
    if (!selectedId || !graph.nodes.some((node) => node.id === selectedId)) {
      const seedNode =
        graph.nodes.find((n) => n.kind === 'CANARY') ||
        graph.nodes.find((n) => n.kind === 'FEEDER') ||
        graph.nodes[0];
      if (seedNode) {
        setSelectedId(seedNode.id);
      }
    }
  }, [graph, selectedId]);

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), []);
  const selectedNode = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const evidence = selectedNode ? evidenceFor(selectedNode, graph) : null;

  return (
    <Section
      id="graph"
      index="04"
      kicker="The graph"
      title="Seed the canary, grow the network"
      lede="A canary hit is a ground-truth seed. Risk propagates upstream through the temporal graph, surfacing the feeder and the shared device that transaction rules cannot see."
    >
      <Reveal>
        <div className="panel">
          <div className="flex flex-col gap-4 border-b border-line px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2" role="tablist" aria-label="Scenario">
              {(['B', 'D'] as ScenarioId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={scenario === id}
                  onClick={() => {
                    setScenario(id);
                    setSelectedId(null);
                  }}
                  className={`border px-3 py-2 font-mono text-caption transition-colors duration-fast ${
                    scenario === id
                      ? 'border-canary/60 bg-canary/10 text-canary'
                      : 'border-line text-ink2 hover:text-ink'
                  }`}
                >
                  Scenario {id} — {id === 'B' ? 'Shared feeder' : 'Layering chain'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="window" className="font-mono text-caption text-ink2">
                Temporal window
              </label>
              <input
                id="window"
                type="range"
                min={1}
                max={72}
                step={1}
                value={windowHours}
                onChange={(event) => setWindowHours(Number(event.target.value))}
                className="h-1 w-40 cursor-pointer appearance-none bg-line accent-canary"
              />
              <span className="w-14 font-mono text-caption text-canary">{windowHours} h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-5">
            {[
              { label: 'Nodes', value: String(graph.stats.nodes) },
              { label: 'Edges', value: String(graph.stats.edges) },
              { label: 'Canaries', value: String(graph.stats.canaries) },
              { label: 'Intercepted', value: inr(graph.stats.intercepted) },
              { label: 'Peak risk', value: graph.stats.maxRisk.toFixed(2) },
            ].map((stat) => (
              <div key={stat.label} className="bg-panel px-4 py-3">
                <div className="font-mono text-micro text-ink3">{stat.label}</div>
                <div className="mt-0.5 font-mono text-lg text-ink">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.9fr_1fr]">
            <div className="border-b border-line lg:border-b-0 lg:border-r">
              <EgoGraph graph={graph} selectedId={selectedId} onSelect={handleSelect} />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 bg-void/40">
                {LEGEND.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 font-mono text-micro text-ink2">
                    {item.shape === 'hex' ? (
                      <svg width="10" height="10" viewBox="-6 -6 12 12" className="shrink-0" aria-hidden="true">
                        <polygon points="6,0 3,5.196 -3,5.196 -6,0 -3,-5.196 3,-5.196" fill={item.fill} stroke="#04070C" strokeWidth="1" />
                      </svg>
                    ) : item.shape === 'square' ? (
                      <svg width="9" height="9" viewBox="-5 -5 10 10" className="shrink-0" aria-hidden="true">
                        <rect x="-4.5" y="-4.5" width="9" height="9" fill={item.fill} stroke="#04070C" strokeWidth="1" />
                      </svg>
                    ) : (
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ background: item.fill }}
                      />
                    )}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="border-b border-line px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-caption text-ink2">Evidence drawer</span>
                <span className="font-mono text-micro text-canary">Active Inspection</span>
              </div>
              {evidence && selectedNode ? (
                <div className="flex-1 px-4 py-4 flex flex-col">
                  <div className="flex items-center gap-2">
                    {selectedNode.kind === 'CANARY' ? (
                      <svg width="12" height="12" viewBox="-6 -6 12 12" className="shrink-0" aria-hidden="true">
                        <polygon points="6,0 3,5.196 -3,5.196 -6,0 -3,-5.196 3,-5.196" fill="#F5A524" />
                      </svg>
                    ) : selectedNode.kind === 'MULE' ? (
                      <svg width="11" height="11" viewBox="-5 -5 10 10" className="shrink-0" aria-hidden="true">
                        <rect x="-4.5" y="-4.5" width="9" height="9" fill="#E8EEF7" />
                      </svg>
                    ) : (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          background:
                            selectedNode.kind === 'FEEDER'
                              ? '#D95926'
                              : selectedNode.kind === 'DEVICE'
                              ? '#38BDF8'
                              : '#2DD4A7',
                        }}
                      />
                    )}
                    <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                      {evidence.title}
                    </h3>
                  </div>
                  <p className="mt-1 break-all font-mono text-micro text-ink3">{selectedNode.label}</p>
                  <dl className="mt-4 space-y-2.5">
                    {evidence.rows.map((row) => (
                      <div key={row.label} className="border-b border-line/60 pb-2.5 last:border-0">
                        <dt className="font-mono text-micro text-ink3">{row.label}</dt>
                        <dd
                          className={`mt-0.5 font-mono text-caption ${
                            row.tone === 'canary'
                              ? 'text-canary'
                              : row.tone === 'alarm'
                                ? 'text-alarm'
                                : row.tone === 'benign'
                                  ? 'text-benign'
                                  : 'text-ink2'
                          }`}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-auto pt-4">
                    <a
                      href={WORKBENCH_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost !w-full !py-2 text-center text-xs active:scale-[0.98] transition-transform"
                    >
                      Open Node In Workbench →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex-1 px-4 py-6 text-body text-ink3">
                  Select a node to read its evidence. Drag to rearrange, scroll to zoom, or use the
                  node list below.
                </div>
              )}

              <div className="border-t border-line px-4 py-3">
                <span className="font-mono text-caption text-ink2">Motifs detected</span>
                <ul className="mt-2 space-y-2">
                  {graph.motifs.length === 0 ? (
                    <li className="font-mono text-micro text-ink3">No motif above threshold in this window.</li>
                  ) : (
                    graph.motifs.map((motif) => (
                      <li key={`${motif.nodeId}-${motif.type}`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(motif.nodeId)}
                          className="w-full border border-line px-3 py-2 text-left transition-colors hover:border-lineStrong"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-caption text-ink">{motif.title}</span>
                            <span
                              className={`font-mono text-micro ${
                                motif.severity === 'CRITICAL' ? 'text-alarm' : 'text-canary'
                              }`}
                            >
                              {motif.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-micro text-ink3">{motif.detail}</p>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="figure-caption">
            <span>
              {scenario === 'B'
                ? 'Three mules, two canaries, one feeder, one shared device.'
                : 'Four hops, sub-15-minute pass-through, near-perfect conservation.'}
            </span>
            <span>{windowHours < 72 ? 'ambient history pruned' : '72 h window'}</span>
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-6">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
              Counter-example — Scenario C: the benign lookalike
            </h3>
            <span className="chip text-benign">CLEARED · ZERO CANARY CONNECTIVITY</span>
          </div>
          <p className="mt-3 max-w-3xl text-body text-ink2">
            A high-volume MSME merchant receives five rapid UPI payments in a burst. A transaction
            rule sees velocity and flags the account. The graph sees the truth: no path to any canary
            or syndicate cluster, so the account is cleared instead of frozen. This is the false-positive
            failure mode the canary seed is designed to prevent.
          </p>
          <div className="mt-4 grid gap-px border border-line bg-line md:grid-cols-2">
            <div className="bg-panel px-4 py-3">
              <div className="font-mono text-micro text-ink3">Transaction rule</div>
              <div className="mt-1 font-mono text-caption text-alarm">FLAG — velocity &gt; threshold</div>
            </div>
            <div className="bg-panel px-4 py-3">
              <div className="font-mono text-micro text-ink3">Canary-seeded graph</div>
              <div className="mt-1 font-mono text-caption text-benign">CLEAR — 0 canary hops</div>
            </div>
          </div>
          <p className="mt-3 font-mono text-micro text-ink3">
            Merchant MERCHANT_MSME_901 · {minutes(0.4)} burst · {inr(12490)} total · synthetic record
          </p>
        </div>
      </Reveal>

      <Reveal className="mt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Canary-Seeded Label Propagation',
              body: 'Canaries are seeded at 1.0. Risk propagates along temporal edges with exponential decay (λ = 0.05/h) and a 0.85 restart factor, converging in at most 15 iterations.',
            },
            {
              title: 'Bounded by design',
              body: 'Ego queries are capped at two hops and fifty nodes, inside a 72-hour sliding window. The window is pruned on ingestion, so memory stays bounded.',
            },
            {
              title: 'Explainable by construction',
              body: 'Every risk score traces back to a seed and a path: hop distance, delta-t, amount conservation and shared device tokens. No black-box score.',
            },
          ].map((card) => (
            <article key={card.title} className="panel p-5">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">{card.title}</h3>
              <p className="mt-2 text-body text-ink2">{card.body}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <p className="mt-4 font-mono text-micro text-ink3">
        Risk values are re-derived in the browser from the scenario records using the same CS-LP
        constants as <span className="text-ink2">temporal_engine.py</span>. Synthetic data — zero real
        accounts.
      </p>
    </Section>
  );
}
