# Metrics critic durable review

Status: round 2 independent review complete; bounded diagnostic integration acceptable with limits below.
Task: metrics-critic; baseline main 3537a0a. Review rounds used: 2/3; one remains if root requests.
Repository read-only. All worker writes are /tmp/metrics-critic*.md or /tmp/metric-probe* files.
No commit/push/deployment/server actions, production edits, worker spawning or device claims.

## Current acceptance evidence

`node /tmp/metric-probe-round2.mjs` independently passes:
- Identical geometry under alternating vs constant phase labels produces identical complete snapshots.
- Four constant-phase circles produce four classified routes, three comparisons, repetition=1 at 30/60/120 Hz.
- Finite offscreen ineligible samples are accepted; ineligible and marked endpoints exclude both adjacent intervals.
- Saved before/after options and all 12 rows' metrics/objectives/gates/transitions/collisions/identities/chapters agree exactly.
- Aggregate legacy metrics/objective/gates also agree exactly. Root separately reports every preexisting field equality.
Current benchmark and both helper SHA256 files match the after-run evaluatorHashes, checked independently.
Source review confirms named-file composite hash captured before imports and checked before/after evaluation.
Helper geometry callbacks are injected from loadRuntime's selected source, including body-profile import.
No new diagnostic is used by legacy utility/guardrails. Report is v3; diagnostics are row-only.
The earlier top-level aggregation plan was not implemented; current row-only scope avoids pooled-ratio ambiguity.

Re-ran root's CPU mesh probe to /tmp/metric-probe-neutral-round2.json:
144 cases, maximum fraction discrepancy 1.973806729171912e-9; assertions pass.
Read the probe: it projects actual neutral core mesh triangles and divides closed-surface area by two.
This is meaningful neutral-core geometry agreement, not GPU/rendered visibility, animated pose or feline response.
The probe uses identity 39, default/all-min/all-max morphology, two viewports and selected headings/placements.
It does not exhaust independent parameter combinations or live articulation/appendage geometry.

## Ranked remaining limits and precise remedies

### P2: recurrence is selected completed-bout evidence; high censoring limits interpretation

After-run support: 1313 classified routes, 1289 comparisons, 972 censored bouts, 63 short bouts.
Closure counts: idle 1369, geometric loop 7, ineligible 960, finalize 12; overflow/invalid/gap/teleport zero.
Censoring is ~41.4% of classified+short+censored bouts, not a fraction of elapsed time or traveled distance.
Only seven geometrically closed loops contribute; production support mostly comes from idle-completed movement.
This is not evidence that unclassified movement is novel or repetitive, nor missing-at-random sampling.
Remedy: retain support/censor reasons beside recurrence, as implemented; avoid whole-session novelty claims.
If later comparing policies, inspect whether changed eligibility changes the selected route population.
Never improve a score by excluding inconvenient bouts; these metrics currently have no scoring role.

### P2: near-return segmentation and recurrence depend on authored thresholds

Reproduction: `node /tmp/metric-probe-sensitivity.mjs` (output /tmp/metric-probe-sensitivity.json).
Ten identical radius-.1 circles, 20 seconds, closure distances .005/.015/.03 at 30/60/120 Hz.
All combinations detect ten loops; default .015 gives repetition=1 at all rates.
At .03, 30 Hz gives repetition=1 but 60/120 Hz give repetition=0 (nine comparisons each).
Early sampled closure shifts subsequent signature origins; pointwise matching is not cyclic-shift invariant.
Default-radius additional check (.05 circles) also passed at all three rates; no default blocker demonstrated.
Remedy: keep documented heuristic scope and do not tune thresholds as preference evidence.
If stronger loop invariance is required, canonicalize closed-loop arc origin or compare cyclic shifts,
and interpolate closure crossing consistently rather than using first sample within radius.
Current documentation honestly notes near-return sampling and lead-in blind spots; add this concrete sensitivity example.

### P3: discontinuity handling belongs to caller; benchmark currently supplies false

The tracker correctly handles explicit discontinuities, but benchmark calls discontinuity:false unconditionally.
Current scenarios have fixed dimensions, no manual control and stable initialized identities; no tested failure follows.
Do not claim benchmark exercised resize/reset/replacement/release marker wiring.
Remedy before adding such scenarios: track identity/viewport/reset generation and mark both adjacent intervals;
restart history for replacement identities. A slower teleport cannot be detected reliably by maxSpeed alone.
No top-level diagnostic aggregation exists in the current report; consumers must pool raw counts themselves.

## Preserved round 1 findings and dispositions

1. P2 legacy hidden-endpoint gap remains intentionally unchanged under byte-identical scoring contract.
Benchmark old snapshot lacks hiddenUntil; synthetic old active hidden endpoint can earn path credit.
`node /tmp/metric-probe-baseline.mjs` reproduces predicate gap, not an observed production transition.
New tracker requires both prior/current eligibility; the corresponding new-diagnostic gap is repaired.
2. P2 phase-sensitive distance: old helper alternating labels erased .3 distance and all routes.
Repaired: phase no longer segments/censors; round 2 snapshot equality passes.
3. P2 continuous-loop blindness: old helper four circles yielded zero comparisons.
Repaired for tested closed loops by geometric return splitting; exhaustive cycle detection remains out of scope.
4. P2 planned route signatures are not actual execution: new helper consumes actual post-physics centers.
Learning adapter remains unchanged, as required; do not conflate its planned signatures with new diagnostics.
5. P2 neutral proxy/render distinction retained: morphology/screen transform pass probes and CPU mesh evidence,
but articulated limbs/tails/fur/roll/occlusion and pixels remain outside the proxy.
Original round-1 reproduction script remains /tmp/metric-probe-helpers.mjs; its old-failure assertions now fail by design.

## Source/read/check scope

Read AGENTS.md; docs README/maintenance/evaluation/learning/anatomy and new route/visibility topics.
Inspected renderer, profile/morphology, articulation, route planner, learning adapter, physics and integrated evaluator.
Read current helper implementations and relevant tests; root reports 33 focused tests passing.
Did not rerun the complete web suite (root is running it), validate physical devices or execute training search.
Root timings 1.74s -> 3.99s are reported evidence, not an independent performance replication.
Center/partial-body exposure differences reflect measurement definitions, not movement improvements.
No mathematical or empirical connection to cat preference is established.

## Durable artifacts and next ownership

- /tmp/metrics-critic-checklist.md: original acceptance plus root boundary checks.
- /tmp/metric-probe-baseline.mjs: historical predicate/neutral-peek examples.
- /tmp/metric-probe-helpers.mjs: historical round 1 reproductions.
- /tmp/metric-probe-round2.mjs: repairs, endpoint exclusions and legacy equality assertions.
- /tmp/metric-probe-sensitivity.mjs and .json: near-return sensitivity plus production closure support.
- /tmp/metric-probe-neutral-round2.json: independently rerun root neutral mesh probe result.
- /tmp/metrics-critic-review.md: this current report preserving historical findings.
Root owns docs/index/ledger and final integration acceptance. One bounded review round remains if needed.
