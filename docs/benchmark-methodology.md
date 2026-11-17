# Ghost-VPA Benchmark Methodology — Replacement Protocol

**Status:** Proposed experiment design; no results currently available
**Date:** 17 November 2026

## Current limitation

The historical generator has label-conditioned features, no event timestamps, no payment graph, and cannot represent benign canary interactions. Its row-order split is not chronological. The associated benchmark API is disabled. No performance claim should be made from the former run.

## Required experiment

Construct a deterministic synthetic network from timestamped lifecycle events, not from labels. Each event must distinguish identifier discovery, beneficiary validation, payment attempt, confirmed credit, decline, and reversal. Only confirmed credits create monetary edges. A canary interaction is a separate seed signal and does not imply guilt. Generate benign and adversarial interactions with canaries and record the assumptions used to assign ground truth.

Compare the same holdout events under:

A. Transaction-only classifier.
B. Conventional graph features without canary seeds.
C. Deterministic canary-seeded upstream propagation.
D. A combined model only after A–C are valid.

Split by event time and keep connected entities or syndicates grouped to prevent leakage across partitions. Derive every graph feature only from information available at the prediction timestamp. Include incomplete observation windows, late arrivals, duplicate delivery, reversals, and benign canary probes. Report prevalence, precision-recall curves, precision at fixed false-positive rates, recall, calibration, uncertainty intervals, and subgroup results. Benchmark code must not write tracked source or result files as a side effect.

## Acceptance gate

Re-enable the endpoint and publish results only when the dataset, graph construction, feature-time cutoffs, split assignment, labels, run command, environment, random seeds, raw metrics, and independent reproduction are documented. Scenario unit tests are useful verification of code paths but do not replace this empirical evaluation.
