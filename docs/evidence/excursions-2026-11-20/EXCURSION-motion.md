# motion-trace-critic — baseline evidence and handoff

Status: read-only critique complete; reproducible collision–paw oscillation found.
Baseline: `4ba72c44915224f41a27224b3db30d5008960b95`. No repair or tuning attempted.
Root owns integration, worker ledger, any regression/repair and device review.
This file is the durable task handoff, using the explicitly authorized final motion filename.

## Scope and boundaries

Exactly three focused investigations: passive trace panel; persistent central-paw panel;
then replay/causal controls for the highest accumulated-turn case. No further seed search.
Each panel: seeds 23/59 × 30/60/120 Hz × 180 seconds, 1024×768 CSS-pixel iPad viewport,
two production-default mice, seeded identities, actual updateHuntGroup/updateHunt/stepMice.
Total panel duration 2,160 simulation seconds / 4,320 mouse-seconds. No reserved seeds.
Paw is persistent at (512,384), radius 50; both director and physics receive it.
Initialization follows the existing benchmark. No touch/grab/injury/learning/adaptation inputs.
Math.random throws; all policy randomness uses identityRandom(seed).
No browser/device/render/audio validation. These are actual runtime CPU traces, not visual acceptance.
Read AGENTS, docs index/maintenance, behavior/routes/touch/evaluation/route metrics,
social/chapters/physics policies and prior motion-metrics/hill-climb critic reports.
No repository writes, commits, push, deployments, restarts, defaults/utility changes or subagents.
Other workers' later shared-worktree edits were observed and left untouched.

## P2 review candidate: prolonged collision–paw corrective oscillation

Repro: persistent paw, seed 59, 30 Hz, mouse 0, 56.8–75.0 seconds center-visible retreat.
The mouse accumulates 12.342 absolute rotations over 18.2 seconds, net rotation −0.178.
This is repeated back-and-forth steering, NOT twelve complete spatial or same-direction orbits.
Actual sampled path is 2,844 px, from (503.52,187.46) to (568.56,764.54).
Exit target is fixed at (340.938,1227) from 56.833 seconds onward. No goal churn in that span.
The first retreat frame still exposes the preceding target because phase entry occurs after targeting;
its one-frame target change must not be misreported as recurring churn.
There are 1,332 collision impulses over the visible segment, not 1,332 distinct encounters.
From 56.833–75: 355/546 frames have collision impulses, 29 heading-increment sign changes
(discarding increments ≤.01 rad), and 30 crossings of the live escape threshold (186.54 px).
Worst sampled 3-second window (66.033–69.033): 2.305 absolute rotations, 298.35 px path,
10.47 px endpoint displacement, unchanged target/phase, 201 collision impulses.
Retreat begins at 56.8, renews at 65.733 and 74.667 with the same target, hides at 75.833.
This is a bounded observed failure to make a readable retreat promptly, not proven infinite deadlock.

Controls replay the same prefix and alter one obstacle at 56.8 seconds without tuning settings:

| Branch | Last retreat sample before hide | Turns from 56.9 until hide or 75 | Collision impulses |
| --- | ---: | ---: | ---: |
| Untouched replay | 75.000 (window end) | 12.3146 | 1324 |
| Companion removed from updates/physics | 58.667 | .2522 | 0 |
| Paw removed from director/physics | 58.233 | .2394 | 28 |

Controls are diagnostic interventions, not proposed production policies. They preserve the prior
runtime objects/WeakMap detour history through the branch point; they do not restart from a snapshot.
Observation supports the interaction of companion collision and live-paw avoidance as the trigger.
Source-based inference: contact.js live-overlap steering overrides the retained detour near the paw;
collision separation repeatedly moves the mouse across that threshold. Physics turns toward the
changing effective steering vector even while the public exit target is fixed. Internal WeakMap
state/effective substep vectors were not instrumented, so exact causal attribution remains limited.
The retreat deadline may re-enter retreat via choose's visible-budget rule; repeated same-target
retreat entries are observed, not an ignored deadline. Root should review recovery without weakening
paw safety, bypassing collisions, teleporting, tuning defaults or changing scoring.

## Ranked additional traces and legitimate-turn controls

1. paw-23-60, mouse 0, 53.533–61.483 traverse: 4.313 absolute rotations, 1,744 px path,
   fixed target, 871 impulses; 59.017–62.017 window travels 438 px but displaces only 4.06 px.
2. paw-59-120, mouse 0, 96.417–104.367 traverse: 4.583 rotations, 1,406 px, 880 impulses.
   paw-23-120 has another 4.326-rotation traverse. Same class appears across rates,
   but trajectories diverge, so these are not frame-rate invariance proofs of one event.
3. Passive-23-60, mouse 0, 70.017–73.017: 1.233 absolute rotations but 1,283 px travel,
   605 px displacement and 1,481 px target travel: route bends, not a fixed-target orbit.
   Passive segment maxima across all six runs range .606–.835 rotations, including collisions.
No new unobstructed fixed-target orbit demonstrated in this bounded panel. A single 180° turn,
finite route bend or collision correction is not itself a defect; prolonged recurrence is the concern.
Segments key phase/route waypoint/goal/edge/slot, not phase label alone. Same-phase reentries
can merge; center-invisible intervals close segments. Whole-frame path includes collision displacement.

## Route variety: selected-path evidence, not a whole-session verdict

| Panel | Classified / comparisons | Repeated corridor / shape | Censored / short |
| --- | ---: | ---: | ---: |
| Passive | 369 / 357 | 25 / 170 | 238 / 7 |
| Persistent paw | 300 / 288 | 22 / 162 | 225 / 27 |

Corridor repetition is 7.0% / 7.6%; translated shape recurrence is 47.6% / 56.3%.
These pool raw counts across selected bouts, with separate history per mouse/run.
They do not establish low overall variety or a paw-induced preference loss: censoring differs,
paths diverge, pauses/exits censor geometry, and no cat preference or novelty threshold exists.
Full frame traces retain centers/headings/targets/phases/waypoints/velocity for review of exclusions.

## Artifacts, reproduction and checks

All artifacts are `/tmp/excursion-motion*`; final handoff is `/tmp/EXCURSION-motion.md`.
Archive: `git archive 4ba72c4 little-mouse/public little-mouse/scripts` extracted into
`/tmp/excursion-motion-baseline`. It preserves pre-repair runtime and evaluator helpers.
`/tmp/excursion-motion-summary.json` contains all 42 JS SHA256 hashes, defaults and ranked rows.
`/tmp/excursion-motion-probe.mjs` reproduces the 12 baseline JSONL traces and summary.
Short natural repro: `node /tmp/excursion-motion-control.mjs` runs seed 59/paw/30 Hz for 80 s.
Controls: prefix that command with `CONTROL=no-companion` or `CONTROL=no-paw`.
`node /tmp/excursion-motion-check.mjs` verifies baseline hashes, exact 2,400-frame replay
(all originally recorded fields), and the bounded control result assertions; PASS.
`/tmp/excursion-motion-check.json` preserves check results.
`/tmp/excursion-motion-repro-clip.csv` has both mice at every frame from 56.833–75 s.
`/tmp/excursion-motion-repro-clip.svg` plots those actual paths and one-second heading markers;
red mouse 0, blue mouse 1, dashed live-escape boundary. It is a trace plot, not rendered gameplay.
The replay JSONL additionally records actual phase-entry timestamps, exposing retreat renewals.
No broad app tests were rerun because no application source was changed.
