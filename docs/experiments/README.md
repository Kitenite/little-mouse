# Experiment program

Status: **catalog and protocol implemented; logging, assignment, learner and agent automation not implemented**.
Owner: root; scientific/source review: feline-play critic. No trials have run and no model is trained.
This program tests preferences for this individual cat; it does not establish welfare or universal efficacy.

## Catalog

All 76 current configurable settings have an individual hypothesis, possible downside, interacting factors,
measurement families and experiment stage. Numeric defaults/domains are generated from the actual settings schema.
Every setting is cataloged; that does not make every setting a suitable autonomous action.

| Topic | Variables |
| --- | --- |
| [Movement](movement.md) | Pace, travel, count, size, timing and motifs |
| [Reactions](reactions.md) | Harmless responses, tap sensitivity, holds and paw clearance |
| [Anatomy](anatomy.md) | Body dimensions, coats, hair, ears and whiskers |
| [Animation](animation.md) | Gait, articulated motion and secondary physics |
| [Appearance](appearance.md) | Backgrounds, contrast and ground response |
| [Lighting](lighting.md) | Scene illumination, shadows and materials |
| [Sound](sound.md) | Recorded audio activation, gain and frequency |
| [Additional factors](additional-factors.md) | Nonexposed policy constants, stimuli and observed context |

## Execution and learning

- [Experiment protocol](protocol.md): stages, attribution, measurement and comparison rules.
- [Metric definitions](metrics.md): common observation window, denominators and censoring.
- [Data contract](data-contract.md): what to log now so future analyses are possible.
- [Independent review](review.md): accepted artifact scope, checks and pending runtime work.
- [Learning and agent review](learning.md): staged model development, evaluation and rollback.
- [Research critique](../cycles/feline-play-critique.md): evidence and limitations behind initial comparisons.

Machine-readable files: [`catalog.json`](../../experiments/catalog.json),
[`variables.json`](../../experiments/variables.json), [`trials.json`](../../experiments/trials.json),
[`record.schema.json`](../../experiments/record.schema.json).
Cataloged software min/max bounds are not a recommended exploration range. All automatic eligibility is false.
Offline eligibility preflight: `experiments/eligibility.mjs`; this is not a runtime experiment engine.
Initial candidate pairs are proposals, not silently applied presets; preserve current owner settings.

Rebuild after settings changes: `node experiments/build-catalog.mjs`.
Check exact coverage, references, baseline values and generated-file freshness:
`node experiments/build-catalog.mjs --check`.
A new setting without an annotation fails validation instead of disappearing from the catalog.

## Current handoff

Next implementation: local session/event logging and export with schema validation; verify deduplication,
clock handling, interrupted sessions and settings attribution before running controlled comparisons.
Then implement recorded assignment of one proposed pair at a time and owner observation entry.
Do not train on fabricated/example records; do not mistake pointer events for independent trials.
Use this index to keep every topic below 120 lines where possible; machine data belongs in JSON.
