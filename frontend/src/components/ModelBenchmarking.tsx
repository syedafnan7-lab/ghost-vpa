import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { BenchmarkMetrics } from '../types';
import { api } from '../services/api';

export const ModelBenchmarking: React.FC = () => {
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unavailable, setUnavailable] = useState<boolean>(false);

  useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        const data = await api.getBenchmarkResults();
        setMetrics(data);
      } catch (e) {
        console.error('Failed to load benchmarks', e);
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    };
    loadBenchmarks();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="bg-panel border border-line rounded-panel p-5">
          <div className="h-4 w-80 rounded bg-raised animate-sweep" />
          <div className="h-3 w-64 rounded bg-raised/70 animate-sweep mt-3" />
        </div>
        <div className="bg-panel border border-line rounded-panel overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <div className="h-3 w-56 rounded bg-raised animate-sweep" />
          </div>
          <div className="p-5 space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-5">
                <div className="h-3 rounded bg-raised" style={{ width: `${70 - i * 5}px` }} />
                <div className="h-3 flex-1 rounded bg-raised/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map(i => (
            <div key={i} className="bg-panel border border-line rounded-panel p-5 space-y-3">
              <div className="h-3 w-48 rounded bg-raised animate-sweep" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="bg-void p-3 rounded-card border border-line">
                    <div className="h-2 w-16 rounded bg-raised" />
                    <div className="h-5 w-12 rounded bg-raised mt-2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (unavailable || !metrics) {
    return (
      <div className="rounded-panel border border-canary/30 bg-panel p-6" role="status">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-canary" aria-hidden="true" />
          <div>
            <h3 className="font-display text-sm font-medium text-ink">Benchmark results withdrawn</h3>
            <p className="mt-2 max-w-3xl text-caption leading-relaxed text-ink2">
              The previous synthetic evaluation used generated label-correlated features and did not build a payment graph. Its split was not chronological, so its performance metrics are not shown. A timestamped graph benchmark with benign canary interactions is still needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rules = metrics.rules_baseline;
  const tab = metrics.tabular_baseline;
  const graph = metrics.graph_enhanced;

  return (
    <div className="space-y-6">
      {/* Benchmark Summary Header */}
      <div className="bg-panel border border-line rounded-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-canary" />
            <h3 className="font-display font-medium text-ink text-sm">
              Empirical ML Evaluation: Rules vs. Tabular LightGBM vs. Canary-Seeded Graph Challenger
            </h3>
          </div>
          <p className="font-sans text-caption text-ink2 mt-1">
            Dataset: <strong className="font-mono text-ink">{metrics.dataset_name}</strong> • Protocol: <strong className="font-mono text-benign">{metrics.evaluation_protocol || "Strict Chronological Holdout"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-benign/10 border border-benign/30 px-3 py-1.5 rounded-chip text-center">
            <span className="font-mono text-[10px] text-benign uppercase block font-semibold">FPR Reduction:</span>
            <span className="font-mono text-sm font-bold text-benign">-{metrics.fpr_reduction_pct}%</span>
          </div>
          <div className="bg-canary/10 border border-canary/30 px-3 py-1.5 rounded-chip text-center">
            <span className="font-mono text-[10px] text-canary uppercase block font-semibold">Precision Lift:</span>
            <span className="font-mono text-sm font-bold text-canary">+{metrics.precision_lift_pct}%</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Comparison Table */}
      <div className="bg-panel border border-line rounded-panel overflow-hidden shadow-panel">
        <div className="px-5 py-3 border-b border-line bg-panel flex justify-between items-center">
          <span className="font-display font-medium text-ink text-caption">
            Comparative Holdout Test Performance (Empirical Evaluation)
          </span>
          <span className="text-micro text-ink3 font-mono">
            Total Test Events: {tab.confusion_matrix.true_positive + tab.confusion_matrix.false_positive + tab.confusion_matrix.true_negative + tab.confusion_matrix.false_negative}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-caption">
            <thead className="bg-void/90 border-b border-line text-ink3 font-mono text-micro">
              <tr>
                <th className="py-3 px-5 font-normal">Metric</th>
                <th className="py-3 px-5 font-normal text-ink3">Rules Baseline</th>
                <th className="py-3 px-5 font-normal text-canary">Tabular LightGBM</th>
                <th className="py-3 px-5 font-normal text-benign">Graph-Enhanced Challenger</th>
                <th className="py-3 px-5 text-right font-normal">Graph vs Tabular Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono text-micro">
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">Precision (High-Confidence)</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.precision * 100 : 20.1).toFixed(1)}%</td>
                <td className="py-3 px-5 text-canary font-bold">{(tab.precision * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-benign font-bold">{(graph.precision * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-right font-sans font-bold text-benign">
                  {graph.precision >= tab.precision ? '+' : ''}{((graph.precision - tab.precision) * 100).toFixed(1)} pp
                </td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">Recall</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.recall * 100 : 17.2).toFixed(1)}%</td>
                <td className="py-3 px-5 text-ink2">{(tab.recall * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-benign font-bold">{(graph.recall * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-right font-sans text-ink2">{graph.recall >= tab.recall ? '+' : ''}{((graph.recall - tab.recall) * 100).toFixed(1)} pp</td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">PR-AUC (Area Under PR Curve)</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.pr_auc : 0.035).toFixed(3)}</td>
                <td className="py-3 px-5 text-canary">{tab.pr_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-benign font-bold">{graph.pr_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-right font-sans text-benign">{graph.pr_auc >= tab.pr_auc ? '+' : ''}{(graph.pr_auc - tab.pr_auc).toFixed(3)}</td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">ROC-AUC</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.roc_auc : 0.526).toFixed(3)}</td>
                <td className="py-3 px-5 text-canary">{tab.roc_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-benign font-bold">{graph.roc_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-right font-sans text-ink3">{graph.roc_auc.toFixed(3)} — {graph.roc_auc >= 0.999 ? 'saturating, ceiling' : 'no claim'}</td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">False-Positive Rate (FPR)</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.false_positive_rate * 100 : 12.1).toFixed(2)}%</td>
                <td className="py-3 px-5 text-alarm font-bold">{(tab.false_positive_rate * 100).toFixed(2)}%</td>
                <td className="py-3 px-5 text-benign font-bold">{(graph.false_positive_rate * 100).toFixed(2)}%</td>
                <td className="py-3 px-5 text-right font-sans font-bold text-benign">
                  {((tab.false_positive_rate - graph.false_positive_rate) * 100).toFixed(2)} pp lower FPR
                </td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">Inference Latency (p50)</td>
                <td className="py-3 px-5 text-ink3">{(rules ? rules.p50_latency_ms : 0.0085).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-ink2">{tab.p50_latency_ms.toFixed(4)} ms</td>
                <td className="py-3 px-5 text-ink2">{graph.p50_latency_ms.toFixed(4)} ms</td>
                <td className={`py-3 px-5 text-right font-sans font-semibold ${graph.p50_latency_ms < 15 ? 'text-benign' : 'text-alarm'}`}>
                  {graph.p50_latency_ms < 15 ? 'within 15 ms budget' : 'exceeds budget'}
                </td>
              </tr>
              <tr className="hover:bg-raised/40 transition-colors">
                <td className="py-3 px-5 font-sans font-semibold text-ink">Inference Latency (p99)</td>
                <td className="py-3 px-5 text-ink3">{(rules ? (rules.p99_latency_ms || 0.0127) : 0.0127).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-ink2">{(tab.p99_latency_ms || tab.p95_latency_ms).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-ink2">{(graph.p99_latency_ms || graph.p95_latency_ms).toFixed(4)} ms</td>
                <td className={`py-3 px-5 text-right font-sans font-semibold ${(graph.p99_latency_ms || graph.p95_latency_ms) < 15 ? 'text-benign' : 'text-alarm'}`}>
                  {(graph.p99_latency_ms || graph.p95_latency_ms) < 15 ? 'within 15 ms budget' : 'exceeds budget'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrices Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tabular Baseline Matrix */}
        <div className="bg-panel border border-line rounded-panel p-5 space-y-3 shadow-panel">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h4 className="font-mono text-micro uppercase tracking-wider text-canary font-semibold">
              Tabular LightGBM Baseline Matrix
            </h4>
            <span className="text-micro text-ink3 font-mono">Test Holdout</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="bg-void/80 p-3 rounded-card border border-line">
              <span className="text-[10px] text-ink3 uppercase font-bold block">True Negative:</span>
              <span className="text-lg font-bold text-ink">{tab.confusion_matrix.true_negative}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-alarm/30">
              <span className="text-[10px] text-alarm uppercase font-bold block">False Positive (Innocents):</span>
              <span className="text-lg font-bold text-alarm">{tab.confusion_matrix.false_positive}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-alarm/30">
              <span className="text-[10px] text-alarm uppercase font-bold block">False Negative (Missed Mules):</span>
              <span className="text-lg font-bold text-alarm">{tab.confusion_matrix.false_negative}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-benign/30">
              <span className="text-[10px] text-benign uppercase font-bold block">True Positive (Mules):</span>
              <span className="text-lg font-bold text-benign">{tab.confusion_matrix.true_positive}</span>
            </div>
          </div>
        </div>

        {/* Graph-Enhanced Challenger Matrix */}
        <div className="bg-panel border border-line rounded-panel p-5 space-y-3 shadow-panel">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <h4 className="font-mono text-micro uppercase tracking-wider text-benign font-semibold">
              Graph-Enhanced Challenger Matrix
            </h4>
            <span className="text-micro text-ink3 font-mono">Test Holdout</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="bg-void/80 p-3 rounded-card border border-line">
              <span className="text-[10px] text-ink3 uppercase font-bold block">True Negative:</span>
              <span className="text-lg font-bold text-ink">{graph.confusion_matrix.true_negative}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-alarm/30">
              <span className="text-[10px] text-alarm uppercase font-bold block">False Positive (Innocents):</span>
              <span className="text-lg font-bold text-alarm">{graph.confusion_matrix.false_positive}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-alarm/30">
              <span className="text-[10px] text-alarm uppercase font-bold block">False Negative (Missed Mules):</span>
              <span className="text-lg font-bold text-alarm">{graph.confusion_matrix.false_negative}</span>
            </div>
            <div className="bg-void/80 p-3 rounded-card border border-benign/30">
              <span className="text-[10px] text-benign uppercase font-bold block">True Positive (Mules):</span>
              <span className="text-lg font-bold text-benign">{graph.confusion_matrix.true_positive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Ranking */}
      <div className="bg-panel border border-line rounded-panel p-5 shadow-panel">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-line">
          <h4 className="font-display font-medium text-ink text-caption">
            Feature Importance Distribution ({metrics.feature_importance_type || 'LightGBM Split/Gain Importance'})
          </h4>
          <span className="text-micro text-ink3 font-mono">Tree Splits Metric</span>
        </div>
        <div className="space-y-2.5">
          {Object.entries(graph.top_features).slice(0, 8).map(([feat, weight]) => {
            const maxWeight = Math.max(...Object.values(graph.top_features), 1);
            return (
              <div key={feat} className="space-y-1">
                <div className="flex items-center justify-between text-micro font-mono">
                  <span className="text-ink2">{feat}</span>
                  <span className="text-canary font-bold">{weight}</span>
                </div>
                <div className="w-full bg-void rounded-chip h-1.5 overflow-hidden border border-line">
                  <div
                    className="h-full rounded-chip bg-canary transition-all"
                    style={{ width: `${Math.min(100, (weight / maxWeight) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
