# Offline behavior evaluation

Owner: root; Superset builder and independent scoring critic preserve the evaluation contract.
Status: implemented headless evaluator and three-round offline search. No settings are applied.
Engineering proxy, not measured cat reward, preference or validated efficacy.

## Reproduction and source isolation

- `node little-mouse/scripts/behavior-benchmark.mjs --final --out /tmp/train.json`
  runs the complete **training** panel, not holdout.
- `node little-mouse/scripts/behavior-hillclimb.mjs --final --out /tmp/search.json`
  runs three training rounds; a training winner then receives final holdout evaluation.
- Both accept `--source-dir /absolute/archive/little-mouse/public` or
  `BEHAVIOR_SOURCE_DIR`; use an immutable archive for comparisons across commits.
- Both default to quick (30 seconds, seed 11, all four scenarios); `--quick` is explicit.
  Quick output cannot approve a patch. Full benchmark training is 360 seconds at 30 Hz.
- Benchmark also accepts `--patch '{"watchDuration":0.66}'`.
- Imports expose `evaluate(options)`, `assessCandidate(candidate, baseline, {holdout})`,
  `guardrails(metrics)`, and `hillclimb({final, sourceDir})`.
- Evaluation options: `patch`, `seeds`, `seconds`, `hz`, `scenarios`, `sourceDir`, `metadata`.
  Use the same options and scenario order for comparisons; default seeds are training seeds.

Version 3 benchmark reports contain complete settings, seeds, dimensions, identity seeds, chapter IDs,
transition counts, metrics, reasons, timings, evaluator Git status, Node/platform,
benchmark/search hashes and all public JS source hashes. The benchmark hash covers its
entrypoint and both diagnostic helpers; `evaluatorHashes` records each source separately. Archive revision is explicitly
unverified in the machine report: retain the git-archive command alongside the artifact.
Evaluator Git is not runtime Git. Source hashes are the runtime truth. Immutable archives
avoid Node's import cache disagreeing with files changed during a live evaluation.
Compact candidate records still include runtime/evaluator hashes. Loaded evaluator and search
hashes are captured once and checked before reporting; changed source aborts the process.

## Production fidelity and scenarios

Actual `updateHuntGroup`, `updateHunt`, and `stepMice` run in production order.
Actual `settingsDefaults` include two mice, pace 2.8, size 2.86 and morphology variation .8.
Spawn fields mirror production; each mouse receives deterministic `createMouseIdentity`
(the renderer ordinarily assigns it). Shared seeded chapter director and policy RNG are separate.
No renderer, sound, learner, input pipeline or real cat is simulated.
Scenarios: passive 1024×768, persistent central paw (50 px radius), synthetic deterministic
near misses every seven seconds, and passive tall phone 390×844. Near misses go through
`rememberTouch` with `miss:true`; these are authored stress inputs, not observed pounces.
Train seeds: 11, 37, 83 at 360 seconds/30 Hz. Holdout: 127, 211, 337 at 600 seconds/60 Hz.
The search opens holdout only if training selects a non-default candidate and never selects another candidate
from holdout. Seed 211 was explored independently by a critic before this search; therefore
holdout is search-isolated, not globally sealed. Future prospective validation needs fresh seeds.

## Measurements and utility

- Integrated actual frame displacement in screen-width units, excluding hidden transitions;
  both endpoints must be active and center-in-viewport. Stored `m.speed` earns no credit.
- Path per total mouse-second and per visible mouse-second, center visible fraction,
  and union 6×4 center occupancy. Center visibility misses legitimate partial peeks;
  it does not claim exact body/tail visibility or rendered quality.
- Phase-transition Shannon entropy divided by log(42); repetition is the fraction of
  transition keys already seen in that mouse's preceding eight transitions.
  These are authored phase-label diversity, not route novelty or psychological variety.
- Maximum both-mice empty time; per-mouse phase stall; continuous blocked travel when
  goal distance exceeds 8 px and actual per-frame travel rate is below 3 px/s.
- Actual creep/run distance rates, observed watch drift after .6 seconds, isolated stationary watch control, collision impulses,
  paw penetration, finite state, and isolated 0°/90°/180° fixed-goal turn/nonarrival checks.
- Time accounting uses exact frame count; a separate regression checks frozen time/zero dt.

Utility is `.35*min(1,pathRate/.15) + .30*coverage +
.15*entropy*(1-.25*repetition) + .20*min(1,visibleFraction/.55)`.
Saturation limits the incentive for constant running; guardrails remain mandatory.
Weights/thresholds are explicit engineering choices, not fitted cat preferences.

## Diagnostic measurements (not utility)

Version 3 adds `row.diagnostics` alongside unchanged version-2 score metrics. The
[body estimate](behavior-visibility.md) measures any neutral core overlap, visible core-area
fraction, center-outside partial exposure and maximum no-body time for active/nonhidden mice.
Exposure uses total simulated mouse-seconds, including offscreen time; invalid geometry is
reported separately. This is not renderer pixels, appendage visibility or live articulated pose.
[Executed-route recurrence](behavior-route-metrics.md) retains per-mouse support/censor counts,
bounded history, geometry comparisons and explicit null rates when support is absent.
Only center-visible, active/nonhidden, unheld, non-tossed and uninjured samples are eligible;
partial-only peeks are excluded from route geometry, never clamped onto the viewport edge.
Both helpers use actual positions after physics; selected runtime supplies its own morphology.
No utility weights, gates, production defaults or local learning records change. The old visible
path predicate's prior endpoint omits hiddenUntil; retained for historical score comparability.
The new route tracker independently checks both endpoint eligibility. Diagnostics cannot repair
that legacy score limit or establish cat interest. Future scoring changes need explicit versioning.

## Search and acceptance

Three rounds evaluate all four coordinate neighbors ±10% of the default around the
round's frozen incumbent; values stay within ±20% and the settings schema.
Knobs: runThroughChance, watchDuration, creepSpeed, peekDuration only.
Count, size, pace, travel speed, gait, audio, injury and all other settings remain default.
Duplicate patches reuse results; all candidates, reasons and round decisions are exported.
A training candidate needs at least 2% utility improvement and every guardrail.
Holdout checks only the final training choice versus baseline. Failure retains defaults.
A quick run cannot recommend a patch; no passing training candidate also retains defaults.

Absolute gates require finite state/metrics, nonzero visible travel, ≥5% visibility,
watch/creep each ≥.2% of time, ≤94% running, empty ≤40 seconds, phase stall ≤45 seconds,
blocked travel ≤6 seconds, isolated watch drift ≤2 px/s, creep <90% of run rate,
fixed-goal turn ≤1.25 rotations and final error ≤8 px, and exact simulation duration.
For every scenario/seed, path rate, visible speed, coverage and visibility cannot regress
more than 5%; empty/stall/blocked time and paw penetration cannot increase.
These conservative safety comparisons apply on train and holdout. Observed watch drift includes
collision displacement and is diagnostic; the freeze gate uses actual watch phase entry/update
in isolation, with measured dwell exposure. It does not freeze a synthetic mouse by hand.
Holdout utility must retain at least 95% of baseline. Required metrics and exact unique
scenario/seed coverage are validated again at acceptance; supplied gate lists are not trusted.
Baseline and candidate require finite nonnegative metrics, bounded fractions, matching protocols
and runtime/evaluator fingerprints. Utility is recomputed from rows, rejecting forged scores.
Source fingerprints are captured before import and checked after each evaluation and on reuse;
a source change aborts the run instead of mixing cached imports with new provenance.
Do not loosen a failing threshold to obtain a winner. Report the failure and review runtime.

## Evidence and limits

Focused tests exercise deterministic actual runtime with unseeded randomness forbidden,
production settings/identity, paused time, patch restrictions, and rejection of all-run,
invisible, NaN, collision-locked, insufficient-improvement and holdout-regressing candidates.
Final run durations, exact source hashes and rejection reasons belong in the batch artifacts.
Physical-device perception, contact geometry, audio and feline response remain unvalidated.
