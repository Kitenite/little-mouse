# Excursion critic acceptance checklist

Task: excursion-critic. Baseline: 4ba72c4. Status: initial checklist complete;
implementation and root integration review pending. Review rounds used: 0 of 3.
Only /tmp critic artifacts are owned here; root owns source, docs and worker ledger.

## Required acceptance evidence

1. Define a whole appearance by observed neutral-core overlap, not center inclusion,
   phase names, movement bouts, idle pauses or geometric loop returns. A stationary
   appearance must still contribute appearance/time support even if too short to compare.
2. Preserve center-outside partial silhouettes, including paths wholly outside [0,1].
   No clamping; test all edges/corners, tangency, invalid geometry and tiny overlaps.
3. Distinguish observed geometric exits from hidden/away transitions and relocations.
   A continuous nonhidden positive-overlap to zero-overlap crossing can close an exit.
   Hidden/repositioned disappearance alone cannot establish a physical exit. Any special
   inferred-exit rule needs explicit evidence, separate counts and an adversarial control.
4. Hidden teleports (including slower-than-speed-threshold relocations), phase changes,
   hold/toss/release, injury/manual control, reset, identity replacement and viewport
   changes must not bridge paths, create exits, or create spurious recurrence support.
   Inspect actual benchmark wiring; helper-only discontinuity tests are insufficient.
5. Observation beginning with overlap is left/late-entry censored. Observation ending
   with overlap is right censored. Midappearance gaps/exclusions cannot restart a
   supposedly complete entry without a newly observed entry. Finalize is idempotent;
   snapshot cannot close or classify unfinished data. Invalid/nonmonotonic times fail closed.
6. Entry/exit boundary interpolation is an estimate, never observed hidden geometry.
   Test 30/60/120 Hz on identical paths, variable dt, gaps and speed discontinuities.
   Pauses, loops and phase changes inside an appearance must not split its identity.
7. Export support for all appearances: complete, left/right/both censored, exclusions,
   short/stationary, overflow and invalid data. State mutually exclusive partitions versus
   overlapping reason counts. No silent dropped cases, null-to-zero or favored filtering.
8. Repeat denominators include only supported comparisons; report comparable/complete/
   observed support together. Pool counts before dividing. First appearance has no prior
   comparison, not zero repetition evidence. Do not claim an unbiased population estimate:
   whole-appearance completion and finite windows can still select the population.
9. Compare new and old diagnostics side by side on the same immutable runtime/seeds,
   reporting excluded populations and elapsed/distance support, not only repetition ratios.
   Different segmentation defines different units; a lower rate is not an improvement.
10. Bounded active geometry, bounded history and fixed counters; test overflow/eviction,
    long stationary appearances and long moving appearances. Overflow cannot become
    a novel complete path. Snapshot/input mutation cannot alter retained state.
11. Exactly preserve old row metrics, aggregate metrics, objectives, guardrails, settings,
    identities, chapters, transitions, collisions, old route/body diagnostics and runtime hash.
    Compare all rows, not rounded aggregates. New metadata/hashes/timing may differ.
12. Hash behavior-excursions.mjs and all new transitive evaluator helpers before import,
    expose individual hashes, include them in composite benchmarkHash and candidate
    comparability, and detect dependency changes before return/cache reuse. Test mutations
    only in /tmp copies. No runtime RNG consumption or changed simulation order.
13. No production defaults, utility, acceptance gates, learning or session-stop changes.
    No feline efficacy, enjoyment, rendered visibility or deployment claims.

## Initial source evidence

- Read AGENTS.md, docs/README.md, docs/maintenance.md, docs/workers.md,
  docs/behavior-{evaluation,visibility,route-metrics}.md and docs/cycles/motion-metrics.md.
- Existing route helper censors a running bout on ineligible endpoints and requires centers
  in [0,1]. Idle/loop completions select a different unit from entry-to-exit appearances.
- Published old panel: 1313 classified, 63 short, 972 censored (41.4% censored).
  This is prior documentation, not a newly measured result or efficacy evidence.
- Existing benchmark captures only postphysics samples and passes discontinuity:false.
  Identities/viewports are fixed and actual hold/toss inputs absent in current scenarios.
- Existing benchmark hashes only benchmark, route and visibility helpers. New dependency
  coverage must be added. Frozen legacy path omits prior hiddenUntil by design.
- behavior-excursions.mjs was absent at initial inspection; no implementation accepted.

## Handoff / next dependency

Root: send helper readiness and benchmark integration readiness for up to three bounded
review rounds. Supply exact source paths and baseline/comparison artifacts if already run.
Root must record this read-only worker and pending review in docs/workers.md; this worker
cannot edit that ledger under its explicit ownership restriction.
Final requested artifact is this file. /tmp/EXCURSION-task.md is outside the task's more
specific allowed writes; use this critic-specific handoff to avoid clobbering another worker.

Baseline capture: /tmp/excursion-critic-baseline-probe.mjs successfully evaluated the
12-row full training panel (360 seconds, 30 Hz, seeds 11/37/83) at exact HEAD
4ba72c44915224f41a27224b3db30d5008960b95; result /tmp/excursion-critic-baseline.json.
Runtime SHA-256: d8d87c72ba617bf9ad2af768a5ca16a5e1f74be243eafcabbf5af514b5eb1c67.
Evaluator SHA-256: fafb9ea2625634325a882a76997a1818ae3b5861388f52f1e13d2e33766388a3.
Objective: 0.9418862139567882. This capture is comparison evidence, not new acceptance.
