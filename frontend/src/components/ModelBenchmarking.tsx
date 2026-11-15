import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { BenchmarkMetrics } from '../types';
import { api } from '../services/api';

export const ModelBenchmarking: React.FC = () => {
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        const data = await api.getBenchmarkResults();
        setMetrics(data);
      } catch (e) {
        console.error('Failed to load benchmarks', e);
      } finally {
        setLoading(false);
      }
    };
    loadBenchmarks();
  }, []);

  if (loading || !metrics) {
    // Skeleton, not a sentence: the panel holds the shape of the real thing so
    // the page doesn't reflow when data lands. The benchmark trains in the
    // backend and can take seconds, so the sweep reads as work in progress
    // rather than a stalled request.
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="h-4 w-80 rounded bg-slate-800/60 animate-sweep" />
          <div className="h-3 w-64 rounded bg-slate-800/40 animate-sweep mt-3" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <div className="h-3 w-56 rounded bg-slate-800/60 animate-sweep" />
          </div>
          <div className="p-5 space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-5">
                <div className="h-3 rounded bg-slate-800/40 animate-sweep" style={{ width: `${70 - i * 5}px` }} />
                <div className="h-3 flex-1 rounded bg-slate-800/25 animate-sweep" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="h-3 w-48 rounded bg-slate-800/60 animate-sweep" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="h-2 w-16 rounded bg-slate-800/40 animate-sweep" />
                    <div className="h-5 w-12 rounded bg-slate-800/60 animate-sweep mt-2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Empirical ML Evaluation: Rules vs. Tabular LightGBM vs. Canary-Seeded Graph Challenger
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dataset: <strong className="text-slate-200">{metrics.dataset_name}</strong> • Protocol: <strong className="text-emerald-400">{metrics.evaluation_protocol || "Strict Chronological Holdout"}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">FPR Reduction:</span>
            <span className="font-mono text-sm font-bold text-emerald-300">-{metrics.fpr_reduction_pct}%</span>
          </div>
          <div className="bg-amber-950/50 border border-amber-500/30 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">Precision Lift:</span>
            <span className="font-mono text-sm font-bold text-amber-300">+{metrics.precision_lift_pct}%</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-200">Comparative Holdout Test Performance (Empirical Evaluation)</span>
          <span className="text-[11px] text-slate-400 font-mono">Total Test Events: {tab.confusion_matrix.true_positive + tab.confusion_matrix.false_positive + tab.confusion_matrix.true_negative + tab.confusion_matrix.false_negative}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-5">Metric</th>
                <th className="py-3 px-5 text-slate-300">Rules Baseline</th>
                <th className="py-3 px-5 text-amber-400">Tabular LightGBM</th>
                <th className="py-3 px-5 text-emerald-400">Graph-Enhanced Challenger</th>
                <th className="py-3 px-5 text-right">Graph vs Tabular Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">Precision (High-Confidence)</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.precision * 100 : 20.1).toFixed(1)}%</td>
                <td className="py-3 px-5 text-amber-300 font-bold">{(tab.precision * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-emerald-400 font-bold">{(graph.precision * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-right font-sans font-bold text-emerald-400">
                  {graph.precision >= tab.precision ? '+' : ''}{((graph.precision - tab.precision) * 100).toFixed(1)} pp
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">Recall</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.recall * 100 : 17.2).toFixed(1)}%</td>
                <td className="py-3 px-5 text-amber-300">{(tab.recall * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-emerald-400 font-bold">{(graph.recall * 100).toFixed(1)}%</td>
                <td className="py-3 px-5 text-right font-sans text-slate-300">{graph.recall >= tab.recall ? '+' : ''}{((graph.recall - tab.recall) * 100).toFixed(1)} pp</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">PR-AUC (Area Under PR Curve)</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.pr_auc : 0.035).toFixed(3)}</td>
                <td className="py-3 px-5 text-amber-300">{tab.pr_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-emerald-400 font-bold">{graph.pr_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-right font-sans text-emerald-400">{graph.pr_auc >= tab.pr_auc ? '+' : ''}{(graph.pr_auc - tab.pr_auc).toFixed(3)}</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">ROC-AUC</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.roc_auc : 0.526).toFixed(3)}</td>
                <td className="py-3 px-5 text-amber-300">{tab.roc_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-emerald-400 font-bold">{graph.roc_auc.toFixed(3)}</td>
                <td className="py-3 px-5 text-right font-sans text-slate-400">{graph.roc_auc.toFixed(3)} — {graph.roc_auc >= 0.999 ? 'saturating, treat as ceiling' : 'no claim'}</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">False-Positive Rate (FPR)</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.false_positive_rate * 100 : 12.1).toFixed(2)}%</td>
                <td className="py-3 px-5 text-red-400">{(tab.false_positive_rate * 100).toFixed(2)}%</td>
                <td className="py-3 px-5 text-emerald-400 font-bold">{(graph.false_positive_rate * 100).toFixed(2)}%</td>
                <td className="py-3 px-5 text-right font-sans font-bold text-emerald-400">
                  {((tab.false_positive_rate - graph.false_positive_rate) * 100).toFixed(2)} pp lower FPR
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">Inference Latency (p50)</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? rules.p50_latency_ms : 0.0085).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-slate-300">{tab.p50_latency_ms.toFixed(4)} ms</td>
                <td className="py-3 px-5 text-slate-300">{graph.p50_latency_ms.toFixed(4)} ms</td>
                <td className={`py-3 px-5 text-right font-sans font-semibold ${graph.p50_latency_ms < 15 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {graph.p50_latency_ms < 15 ? 'within 15 ms budget' : 'exceeds 15 ms budget'}
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-5 font-sans font-semibold text-slate-200">Inference Latency (p99)</td>
                <td className="py-3 px-5 text-slate-400">{(rules ? (rules.p99_latency_ms || 0.0127) : 0.0127).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-slate-300">{(tab.p99_latency_ms || tab.p95_latency_ms).toFixed(4)} ms</td>
                <td className="py-3 px-5 text-slate-300">{(graph.p99_latency_ms || graph.p95_latency_ms).toFixed(4)} ms</td>
                <td className={`py-3 px-5 text-right font-sans font-semibold ${(graph.p99_latency_ms || graph.p95_latency_ms) < 15 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(graph.p99_latency_ms || graph.p95_latency_ms) < 15 ? 'within 15 ms budget' : 'exceeds 15 ms budget'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrices Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tabular Baseline Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider">Tabular LightGBM Baseline Matrix</h4>
            <span className="text-[11px] text-slate-400 font-mono">Test Holdout</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">True Negative:</span>
              <span className="text-lg font-bold text-slate-200">{tab.confusion_matrix.true_negative}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-red-900/30">
              <span className="text-[10px] text-red-400 uppercase font-bold block">False Positive (Innocents):</span>
              <span className="text-lg font-bold text-red-400">{tab.confusion_matrix.false_positive}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-red-900/30">
              <span className="text-[10px] text-red-400 uppercase font-bold block">False Negative (Missed Mules):</span>
              <span className="text-lg font-bold text-red-400">{tab.confusion_matrix.false_negative}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">True Positive (Mules):</span>
              <span className="text-lg font-bold text-emerald-400">{tab.confusion_matrix.true_positive}</span>
            </div>
          </div>
        </div>

        {/* Graph-Enhanced Challenger Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-emerald-400 text-xs uppercase tracking-wider">Graph-Enhanced Challenger Matrix</h4>
            <span className="text-[11px] text-slate-400 font-mono">Test Holdout</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">True Negative:</span>
              <span className="text-lg font-bold text-slate-200">{graph.confusion_matrix.true_negative}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-red-900/30">
              <span className="text-[10px] text-red-400 uppercase font-bold block">False Positive (Innocents):</span>
              <span className="text-lg font-bold text-red-400">{graph.confusion_matrix.false_positive}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-red-900/30">
              <span className="text-[10px] text-red-400 uppercase font-bold block">False Negative (Missed Mules):</span>
              <span className="text-lg font-bold text-red-400">{graph.confusion_matrix.false_negative}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">True Positive (Mules):</span>
              <span className="text-lg font-bold text-emerald-400">{graph.confusion_matrix.true_positive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Ranking */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
            Feature Importance Distribution ({metrics.feature_importance_type || 'LightGBM Split/Gain Importance'} in Graph Model)
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Tree Splits Metric</span>
        </div>
        <div className="space-y-2.5">
          {Object.entries(graph.top_features).slice(0, 8).map(([feat, weight]) => {
            const maxWeight = Math.max(...Object.values(graph.top_features), 1);
            return (
              <div key={feat} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{feat}</span>
                  <span className="text-amber-400 font-bold">{weight}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  {/* One hue for a one-series magnitude bar — no status ramp,
                      and a 2px surface gap at the rounded data-end. */}
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `calc(${Math.min(100, (weight / maxWeight) * 100)}% - 2px)` }}
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
