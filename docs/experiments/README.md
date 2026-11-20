# Experiment program

Status: **catalog, local pilot and bounded chapter adaptation implemented; trained models/agent automation pending**.
Owner: root; scientific/source review: feline-play critic. No cat preference results or trained model are claimed.
This program tests preferences for this individual cat; it does not establish welfare or universal efficacy.

## Catalog

All 77 current configurable settings have an individual hypothesis, possible downside, interacting factors,
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

- [Runtime pilot](runtime.md): local comparisons, owner controls, exports and limits.
- [Experiment protocol](protocol.md): stages, attribution, measurement and comparison rules.
- [Metric definitions](metrics.md): common observation window, denominators and censoring.
- [Data contract](data-contract.md): what to log now so future analyses are possible.
- [Catalog review](review.md) and [runtime review](runtime-review.md): findings and validation boundaries.
- [Local chapter adaptation](../behavior-learning.md): cautious duration bias, metrics and freeze/reset/export.
- [Offline behavior evaluation](../behavior-evaluation.md): engineering motion probes and critic-reviewed parameter search.
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

Local sensory pilots now record assignments and bounded events through the owner controls.
The pilot export is not the planned full research schema. A validated importer, controlled
analysis, model training and recurring agent review remain future stages.
Do not train on fabricated/example records or mistake pointer events for independent trials.
