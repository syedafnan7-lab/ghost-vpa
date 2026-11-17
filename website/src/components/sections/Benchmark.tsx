import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function Benchmark() {
  return (
    <Section
      id="benchmark"
      index="06"
      kicker="Evaluation status"
      title="Performance claims are withdrawn"
      lede="The current prototype has scenario tests, but no valid comparative fraud-detection benchmark."
    >
      <Reveal>
        <div className="panel max-w-4xl p-5" role="status">
          <h3 className="font-display text-lg font-semibold text-ink">No benchmark results available</h3>
          <p className="mt-3 text-body leading-relaxed text-ink2">
            The earlier synthetic evaluation used label-correlated generated features, did not construct a payment graph, and split rows without event timestamps. It also omitted benign canary interactions. Its precision, recall, false-positive, AUC, feature-importance, and latency values are not evidence of detection quality and have been withdrawn.
          </p>
          <p className="mt-3 text-body leading-relaxed text-ink2">
            A replacement study needs timestamped payment events, graph-derived features computed as of each prediction, benign and adversarial canary interactions, chronological and entity-aware holdouts, and reproducible baselines. The backend benchmark endpoint is disabled until that work is complete.
          </p>
          <p className="mt-4 border-t border-line pt-3 font-mono text-micro text-ink3">
            Graph scenario tests verify constructed code paths only; they do not establish real-world accuracy.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
