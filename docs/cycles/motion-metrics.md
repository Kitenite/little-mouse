# Visibility and executed-route measurement batch

Status: published in `e7c21bb`, verified on GitHub, independently reviewed; all three
completed workers retired. [Worker ledger](../workers.md) preserves assignments. Baseline `3537a0a`, two Superset builders and one independent
critic. No production behavior, settings, local-learning schema or scoring utility changes.

## Accepted measurements

[Neutral core visibility](../behavior-visibility.md) clips the morphology-aware torso/head
outline against the viewport. It detects partial peeks that center-only exposure misses.
This is a neutral geometry estimate; appendages, animated deformation and pixels are excluded.
A separate CPU probe projects actual model mesh triangles: 144 placements/morphologies,
maximum fraction discrepancy 1.98e-9. The independent critic reran and inspected that probe.

[Executed routes](../behavior-route-metrics.md) compare actual post-physics paths after spatial
noise filtering and equal-arc resampling. Separate repeated screen corridors from translated
shape recurrence. Idle stops and geometric returns end bouts; phase names do not affect them.
History is bounded per mouse, and exclusions/short/incomplete paths retain explicit counters.
Neither diagnostic participates in utility, acceptance gates or local duration adaptation.

## Builder–critic repairs

1. Initial phase-based segmentation erased distance when labels changed. The critic reproduced
   identical coordinates yielding different results. Phase-independent segmentation now produces
   identical complete snapshots under alternating labels.
2. Four loops within one constant phase initially produced no comparison. Geometric near-return
   splitting now reports four routes and three repeats at 30/60/120 Hz for that fixture.
3. A 512-point cap censored 17 production bouts across four scenarios at three frame rates.
   The bounded 2048 cap removes overflow in this probe; maximum observed points is 934.
4. Root hashes both helpers with the benchmark entrypoint, rejects later dependency edits,
   injects archived runtime geometry, and keeps diagnostics separate from unchanged score fields.

## Comparison and acceptance

Identical 12-row training panel: three seeds × four scenarios, 360 seconds at 30 Hz.
Every preexisting row field, aggregate score, gate and setting matches the saved baseline exactly.
Runtime source fingerprint is unchanged. New exposure definitions explain the differences below;
these are measurements of the same movement, not gameplay improvements.

| Diagnostic | Result |
| --- | ---: |
| Center-visible mouse time | 60.91% |
| Any neutral-core overlap | 75.73% |
| Partial body with center outside | 14.82% |
| Mean visible core-area fraction | 62.57% |
| Longest no-center / no-core interval | 4.83 / 3.40 seconds |
| Classified / compared routes | 1313 / 1289 |
| Repeated corridors / translated shapes | 64 / 596 |
| Censored / short bouts | 972 / 63 |
| Invalid samples / overflow closures | 0 / 0 |

Censored bouts are 41.4% of classified+short+censored: almost all end at visibility loss.
Recurrence describes selected completed paths, not all movement. Counts are pooled numerators;
no unsupported null-to-zero or averaging of per-mouse repetition ratios.
The full training evaluator took 3.99 seconds locally versus 1.74 before diagnostics.
Three hill-climb rounds took 34.74 seconds: all 24 decisions (eight unique candidates) rejected,
no holdout opened and defaults retained. This rechecks integration, not new preference evidence.

425 web tests, production build `a6df6715d6a5`, Worker syntax, catalog and four eligibility tests
pass. Native lint/typecheck pass; no native source/install change. The restart had stopped both
local servers; root restored game port 8787 and development-client Metro port 8088.
Sidebar reload reaches playing=true/recovering=false with two mice and WebGL. Host frame
scheduling was throttled during probing; this is startup evidence, not smooth-rendering evidence.
[Evidence](../evidence/motion-metrics-2026-11-20/README.md) includes exact reports and runnable probes.

## Limits and next queue

- Closed-loop matching is not cyclic-origin invariant. Widening closure radius .015→.03 made
  an identical circle fixture disagree across frame rates. Defaults passed; do not tune blindly.
- Live articulated/pixel visibility remains unmeasured; neutral mesh agreement cannot establish it.
- Benchmark scenarios have fixed identities/viewports and no actual grabs. Tracker discontinuity
  tests do not verify future reset/resize/release wiring. Mark those events before adding scenarios.
- Legacy score path still omits prior hiddenUntil; keep old score comparability explicit. Repair it
  only with a versioned scoring contract and fresh baseline, not by silently relabeling old reports.
- Before using recurrence to guide policy changes, retain complete entry-to-exit trajectories and
  compare censoring populations. Use fresh prospective seeds and labeled real-cat observations;
  neither low recurrence nor many clicks proves enjoyment. Earlier domain queues remain active.
