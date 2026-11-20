# Behavior hill-climb batch — 2026-11-20

Status: in progress. Root integrates Superset builders and independent critics; baseline
`a3196df`. [Worker ledger](../workers.md) owns current terminal IDs and responsibilities.
Engineering motion metrics are not cat preference or a trained reward model.

## Accepted local learning iteration

`717aec1` isolates duration learning by exact validated settings, build, policy and coarse
screen context. Legacy or missing-context records remain descriptive. Root independently
verified game-entry wiring; the worker reviewed it separately. [Handoff](../evidence/hill-climb-2026-11-20/learning-context.md).
The sidebar's fresh play session reports all 77 settings and actual development build.

## Motion iteration: collision-locked creeping

Baseline: default two mice, identities1100/1101, seed11, 1024×768, no input. At30Hz,
natural replay spends seven one-second samples almost motionless in creep; collision
projection cancels steps while stored velocity remains nonzero. The constructed opposed
pair yields only at8.91–8.94 seconds. A held companion reproduces the same obstruction.

Candidate: measure actual cumulative position changes over fixed2.5-second windows.
Under4px before arrival yields watch; phases, goals, viewport changes, holds and tosses
reset tracking. Independent verification yields at2.51–2.54 seconds at30/60/120Hz,
with no held-anchor drift. Slow creep and live-paw detour controls are unchanged.
The natural30Hz replay loses its final four stalled samples. Window alignment means
this is not a sliding2.5-second worst-case guarantee; collision jitter remains a limit.

Reproduce against current code:

```sh
node docs/evidence/hill-climb-2026-11-20/motion-adverse.mjs
node docs/evidence/hill-climb-2026-11-20/motion-creep-repro.mjs
```

Set `MOTION_SOURCE` to the public directory of an archived`a3196df` checkout for baseline.
Stored baseline/candidate JSON and probes live in the same evidence directory.
Focused motion suite passes36 tests; final combined checks remain pending.

## Offline search and remaining review

Three bounded coordinate rounds, separate final validation seeds and independent scoring
critique are in progress. No parameter change is accepted merely because it scores higher.
Near-arrival peek obstruction is under independent reproduction. Final search/rejection
records, combined suite and release boundaries will replace this pending section.
