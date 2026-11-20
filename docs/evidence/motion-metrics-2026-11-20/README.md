# Motion measurement evidence

Baseline production/runtime: `3537a0a`; all new executable code is offline evaluation tooling.
[Batch interpretation](../../cycles/motion-metrics.md) and [evaluation contract](../../behavior-evaluation.md)
separate neutral geometry, selected executed paths and unchanged engineering utility.

## Artifacts

- `training-before.json`: version-2 evaluator, saved before integration at the same runtime.
- `training-after.json`: version-3 evaluator with per-row diagnostics and dependency hashes.
- `comparison.json`: exact legacy equality, exposure/support and full-search summary.
- `search.json`: unchanged three-round protocol, all 24 decisions, no winner/holdout.
- `neutral-mesh-probe.mjs` / `neutral-mesh.json`: actual neutral mesh triangle projection;
  144 cases, no WebGL or animated shader pose. Independent critic reran this probe.
- `capacity-probe.mjs`, `capacity-512.json`, `capacity-2048.json`: actual archived hunt/physics,
  seed 11 × four scenarios × 360 seconds at 30/60/120 Hz. Cap overflow falls 17→0.
- `critic-review.md`, `critic-checklist.md`: two independent review rounds and remaining limits.
- `critic-acceptance-probe.mjs`: repaired label/loop/exclusion cases and saved legacy equality.
- `sensitivity-probe.mjs` / `sensitivity.json`: near-return threshold sensitivity and censor support.
- `legacy-predicate-probe.mjs`: isolated old hiddenUntil gap; not a natural runtime reproduction.
- `historical-round1-probe.mjs`: OLD failure assertions, expected to fail after repairs.
- `visibility-builder.md`, `route-builder.md`: exact worker handoffs before root acceptance;
  temporary paths/status inside are historical. Portable counterparts are listed here.
- `web-tests.txt`, `build.txt`, `browser.json`: root checks and sidebar state; no new iPad install.

## Reproduce from repository root

```sh
node --test little-mouse/tests/behavior-{benchmark,visibility,route-metrics}.test.mjs
node docs/evidence/motion-metrics-2026-11-20/neutral-mesh-probe.mjs
node docs/evidence/motion-metrics-2026-11-20/critic-acceptance-probe.mjs
node docs/evidence/motion-metrics-2026-11-20/sensitivity-probe.mjs
node little-mouse/scripts/behavior-benchmark.mjs --final --out /tmp/current-training.json
node little-mouse/scripts/behavior-hillclimb.mjs --final --out /tmp/current-search.json
```

To recreate the production capacity archive, extract `git archive 3537a0a little-mouse/public`
into a fresh directory, then set `MOTION_SOURCE` to its absolute `little-mouse/public` path.
Run `capacity-probe.mjs`; optional `ROUTE_MAX_POINTS=512` reproduces the lower-cap comparison,
and `METRICS_OUT=/tmp/capacity.json` writes the full report. Default source is current public.
Source archive revision is caller-supplied; preserve extraction command and verify source hashes.
To reproduce old evaluator output, archive both scripts and public from `3537a0a`; running the
new evaluator against old runtime alone does not recreate the old measurement code.

Reports record runtime `sourceHash` and evaluator Git status separately. Version 3 `benchmarkHash`
covers entrypoint plus both helper files; `evaluatorHashes` records individual SHA256 values.
All 12 preexisting row records/aggregate metrics compare exactly despite added diagnostics.
No claims of real-cat preference, current device performance, audio quality or rendered visibility.
