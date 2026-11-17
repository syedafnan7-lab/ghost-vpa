# Ghost-VPA Benchmark Status

**Project:** Ghost-VPA
**Status:** Withdrawn — not evidence of detection performance
**Date:** 17 November 2026

## Status

The former benchmark and its derived headline numbers are withdrawn. The generator used label-correlated feature distributions, did not build a transaction graph, lacked event timestamps, and the advertised “chronological” split was row-order slicing. Benign interactions with canaries were not represented. Therefore precision, recall, FPR, AUC, feature importance, and latency claims from this benchmark must not be presented as evidence of Ghost-VPA detection quality.

The API endpoint, direct benchmark runner, and frontend UI refuse the historical evaluation. The underlying generator and model code remain historical implementation and must not be used for claims.

## Historical values (withdrawn)

The previous document reported 99.5% precision, 98.8% recall, 1.000 ROC-AUC, 0.1% FPR, +27.1% relative precision lift, and 94.4% FPR reduction. These are preserved here only to identify claims that must be retired; they are invalid for assessing model performance.

Graph scenario tests demonstrate implementation behavior on constructed topologies. They do not establish generalization, calibrated risk, real-world false-positive rates, or competitive performance.

## Reinstatement criteria

Publish new results only after timestamped synthetic events form a real directed graph; feature generation is independent of labels; benign and adversarial canary interactions are represented; events are deduplicated and reversals are applied; train/test separation is chronological and entity-aware; baselines use identical observations; metrics include uncertainty and prevalence; and the full experiment is reproducible without mutating tracked files.
