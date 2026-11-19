# Versioned research data contract

Status: schema artifact only; no live telemetry, storage/export implementation or collection is installed.
Machine-readable record shape: [`record.schema.json`](../../experiments/record.schema.json), JSON Schema 2020-12.
Records are append-only JSONL; payloads reference stable session, bout and decision IDs.

## Required records

| Kind | Contents |
| --- | --- |
| session | Pseudonymous cat ID or null; actor; build/policy/catalog/asset versions; effective settings; device/context |
| decision | Experiment/bout ID, predecision context, complete candidate action distribution, chosen action/probability, full assigned/effective settings, seed |
| exposure | Interval bounds in monotonic wall and simulation time; active/visible/hidden/paused exposure, paw occupancy, performance |
| contact | Unique episode/pointer IDs, down/move/up/cancel; coordinates, footprint, mouse ID/region, outcome, actor |
| behavior | Mouse/identity, phase transition, target/position/heading, reason, motif, decision attribution |
| audio | Clip identity, cue family, actual playback status, native rate, gains and output information |
| observation | Owner-observed label, start/end, observer and confidence; unknown is not a negative label |
| outcome | Decision ID, predeclared metric/version, value or null, denominator, observation coverage and missing/censor reason |
| end | Session/bout termination or interruption reason and completeness; unexpected crashes can leave records unfinished |

## Time and attribution

Each record carries event ID, schema version, session ID, sequence, monotonic wall milliseconds and simulation
seconds. Session start has UTC time for grouping. Simulation pause must not erase real elapsed time.
Context used for decisions must be captured before the action; later outcomes must not leak into model features.
Each context feature carries version, source interval and availability timestamp. All must precede assignment;
late owner annotations are outcomes, not historical features. Fit preprocessing within training folds.
Do not reconstruct old settings from today's defaults. Snapshot effective settings and immutable identity/asset IDs.
Use named seed/RNG versions when deterministic; mark unseeded game randomness explicitly, never invent a seed.

## Probabilities and missingness

Log the eligible candidate set and the actual probability distribution used at decision time, including constraints.
Paired AB/BA trials log pair ID, sequence, position and sequence probability. The second bout is deterministic
conditional on the pair, so its chosen probability is 1; set bout-level OPE eligibility false for these trials.
Probabilities sum to one; selected probability equals the chosen candidate entry and is positive.
For a human choice, log origin `manual`, chosen probability 1 with alternatives 0, and `opeEligible=false`;
this records the assignment mechanism without pretending it provides randomized evidence.
Any override invalidates old attribution: start a new segment or mark noncompliance. Never retrofit probabilities.
Outcome collection must join decisions by ID and report dropped/unmatched records and logger/schema versions.
Unknown actor, gaze, presence, volume and incomplete intervals stay unknown. Keep zero separate from null.

Complete settings snapshots require every current catalog key/type/domain in the generated schema; archive
contracts by version and validate historical logs against their original catalog, not the newest schema.
Schema validation alone is insufficient: importer must check ID uniqueness, ordering, referenced sessions/decisions,
valid settings, probability sums/equality, unique candidate IDs, eligible-action support, feature provenance availability, interval bounds, complete end markers,
observed/visible denominators, migration version and duplicate contact outcomes before analysis.
Preserve original raw records; write derived data and metric versions separately. Migrations are explicit and tested.

## Storage and exports

Planned local-first bounded storage: configurable retention and size caps, explicit export/delete controls,
visible collection status and no implicit upload. Rotate at completed-session boundaries; mark truncation/crash.
Do not collect names, camera, microphone or unrelated device data. Agent review consumes an owner-selected export.
Policy candidates, analysis reports, dataset manifests and rollback versions belong in project artifacts;
raw personal observation logs should stay outside the public Git repository.

## Data quality gate before training

Use synthetic fixtures tagged `test` to validate schema, deduplication, interruption, pause, repeated pointermoves,
multiple paws, manual overrides and missing audio. Keep these out of cat datasets.
Reconcile raw episode totals and timing against an observed device session. Confirm one pounce/hold isn't inflated
into hundreds of rewards. Record planned metric definitions before looking at which arm performed best.
No training-ready claim until collector and importer pass these gates on real, explicitly labeled observations.
