# Behavior hill-climb batch — 2026-11-20

Status: accepted and published. Evidence commit `dd81c7a` was verified on GitHub;
all three finished Superset worker terminals were retired after preservation. Root integrates Superset builders and independent critics; baseline
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

`f4cee77`: measure actual cumulative position changes over fixed2.5-second windows.
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
Focused motion checks pass; final combined checks are recorded in [verification](../verification.md).

## Motion iteration: near-arrival peeking

A held companion can block an emerging mouse 12 pixels from its peek target for the
entire 15-second probe. Arrival requires under 8 pixels while the old progress guard
required over 15 pixels, so neither could finish the phase. `70eeb19` actual-travel recovery now
covers all visible peeks and retreats along the current lane. Keeping one continuous
window also avoids rounding jitter at the 15-pixel boundary. Independent controls
cover unobstructed near peeks, slow invisible approaches, held entry and prior creeps.
The blocked fixture retreats at 2.5 seconds at 30/60/120 Hz with zero held-anchor drift.
The same evidence directory contains `motion-peek-repro.mjs`, controls and recorded JSON.

## Offline search and independent scoring review

The evaluator runs actual policy/physics with deterministic identities and four scenarios:
passive, held central paw, synthetic near misses and tall phone. Three training seeds each
run 360 seconds at 30 Hz. It scores actual visible travel, coverage and authored phase
variety, while separately checking stops, turns, paw clearance, stalls and finite state.

Root completed the builder's remaining acceptance fixes after two critic rounds. Final
independent review accepts the engineering contract with limits: required metrics/domains,
recomputed scores, exact scenario/protocol coverage, source/script identity and actual watch
policy exposure. Invalid or mismatched reports cannot approve a candidate. See [contract](../behavior-evaluation.md).

Final search on immutable `70eeb19`: three rounds, 24 decision records, eight unique
coordinate neighbors (cached on repeated rounds), **no accepted numeric change**. None
met the 2% improvement and per-scenario gates. Search took 13.82 seconds; all defaults remain.
No final holdout was opened. Obsolete early search versions had inspected baseline holdout,
and a critic had explored seed 211; this is not a globally sealed prospective holdout.

| Training panel metric | Original `a3196df` | Final `70eeb19` |
| --- | ---: | ---: |
| Worst continuous blocked motion | 6.83 s | 3.33 s |
| Mean of each run's max blocked interval | 2.95 s | 1.93 s |
| Mean visible path, screen widths | 143.22 | 145.88 |
| Mean center-visible fraction | 61.13% | 60.91% |
| Absolute gate failures | 3 | 0 |

This is targeted bug-fix evidence, not a claim that aggregate utility improved by the
search's 2% threshold (it did not). Center visibility misses partial peeks and phase labels
are not route novelty. Cumulative travel can count jitter. No cat-preference model is trained.

[Evidence directory](../evidence/hill-climb-2026-11-20/README.md) contains final full search,
baseline training, comparison, independent reviews, reproducible probes and browser checks.
All 400 web tests, four eligibility checks, catalog and production build pass. Sidebar
runs the final runtime with two mice and valid learning context. Current hashes and native
release boundaries belong in [verification](../verification.md).

## Next ranked comparisons

1. Neutral-body and executed-route diagnostics are now [implemented and reviewed](motion-metrics.md).
   Live rendered visibility and a scoring-contract change remain pending; utility stays unchanged.
2. Observe real labeled cat sessions under fixed context; use prospective fresh seeds for
   subsequent offline candidate validation and separate engineering scores from cat response.
3. Investigate oscillatory motion only from a new reproducible trace; retained fixes target
   stationary obstruction. Preserve paws, slow approaches, holds and explicit owner settings.
