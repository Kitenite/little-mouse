# Reference-policy critique

Read-only review of the policy before the subsequent hunt-routes implementation. No repository files were edited. The lead owns footage comparison; I did not independently inspect the supplied video. Findings below distinguish source/simulation observations from inferred visual effects.

## 1. Reentries strongly favor the exit edge

Observed in enrichment.js cover(): candidates receive a distance penalty of up to 0.6, random reward only up to 0.35, and familiar cover receives another 0.9 when requested. Reentry requests familiar cover 35% of the time, but even without that request the nearby exit edge is favored by distance. In the iPad-size simulation, 481 of 524 reentries (91.8%) reused the exit edge. Phone-size simulation: 499/549 (90.9%). This is more persistent than the 35% familiarity parameter suggests.

Inference: repeated exit/reentry at the same edge can create a predictable back-and-forth appearance even when the shuffled motif changes. This was not a perceptual or feline-engagement measurement.

Recommendation: test actual consecutive edge and route reuse, including unobstructed multi-appearance traces. If repetition is reduced, preserve the rule that an open entrance outranks a paw-blocked entrance. Source: enrichment.js cover(), hidden reentry branch.

## 2. Motif variety does not guarantee different visible sequences

Observed: every ordinary appearance starts with peek. Only peek can choose traverse, and traverse always targets the opposite edge. At current defaults, 265 completed appearances had exactly peek > traverse among 534 appearance starts at 1024x768; 281 among 559 starts at 390x844. The configured run-through chance is 0.6, modified by motif. Once traverse is chosen, the remaining motif differences do not affect its route. Existing motif tests verify all four names and absence of adjacent identical names, not distinct route or timing distributions.

Inference: the repeated entry-peek-cross-exit template may dominate perception despite nominal variety. Motifs still affect the remaining appearances; this is not a claim that all appearances are identical.

Recommendation: test distributions of completed phase sequences, entry/exit pairs, route headings and durations under the real preset. Avoid requiring a particular exact random trace, but establish measurable diversity criteria alongside deterministic safety fixtures. Source: enrichment.js choose(), traverse branch, nextMotif(); hunt-policy motif test.

## 3. Short destinations suppress configured speed differences

Observed: physics caps desired speed at distance * 3 before alignment, regardless of configured travelSpeed. All 469 phone-size creep/dart goals sampled began below their nominal speed ceiling; their median initial distance was 138.7 px. At iPad size 220/454 began capped, median distance 219.3 px. These count both phases together; they do not prove identical realized creep/dart velocities. Approach braking and swept arrival solve a real prior orbiting defect.

Inference: short destinations can repeatedly produce similar easing movement, with faster configured pace unable to produce a sustained fast run. Adding speed alone need not fix the impression.

Recommendation: measure realized speed, uninterrupted travel distance and time spent braking for each phase across viewport sizes. Keep fixed-final-goal and swept-arrival regressions. Source: physics.js desired-speed cap; enrichment.js creep/dart goal generation.

## 4. Every investigation/dart requires arrival and dwell

Observed: ordinary creep/dart advances only after arrival plus positive dwell, or its watchdog deadline. Even a chained burst dart uses that contract. The prior dart dwell was sampled from 0.25–0.6 seconds, divided by hunt tempo and multiplied by motif dwell. Burst changes probabilities and dwell scale; it does not remove the obligatory endpoint settle. The watchdog is not a normal continuous-run mechanism.

Inference: repeated move-settle-move cadence can remain recognizable across different destinations. The frequency of actual visible stops was not quantified in these simulations.

Recommendation: compare uninterrupted travel durations and stops per visible minute. Allow deliberately authored continuous routes while retaining final-goal settlement and genuine pauses. Source: enrichment.js enter(dart), choose(), final arrival/dwell transition.

## 5. Paw avoidance has no persistent detour commitment

Observed: policy projects a blocked target away from a live paw using the mouse's current radial direction, recomputed on each update. Physics separately recomputes bypass direction from the current target ray and paw side. Neither stores a chosen detour side or obstacle waypoint. Existing tests check escape and blocked-entry recovery, not detour smoothness.

Hypothesis, not reproduced in the original critique: moving or overlapping paws could cause alternating target corrections or bypass choices. This should not be reported as an observed spin defect.

Recommendation: use stationary, moving and overlapping paw fixtures, measuring target drift, turn-sign reversals, penetration and eventual passage at 30/60/120 Hz. Paw priority must remain stronger than route commitment. Source: enrichment.js target exclusion loop; contact.js avoidPaws().

## Measurement methodology

- Read docs/README.md, maintenance.md, behavior.md, workers.md, enrichment.js, hunt-policy.test.mjs, physics.js, relevant contact.js avoidance code and settings.js.
- Ran `node --test little-mouse/tests/hunt-policy.test.mjs`: 20 tests passed before route implementation.
- Ran inline Node simulations without writing repository files. Imported createHuntDirector/updateHunt, stepMice, and actual settingsDefaults.
- Ten deterministic seeds (1–10); LCG: seed = (imul(seed,1664525)+1013904223) >>> 0, output seed/4294967296.
- Each seed ran 18,000 steps at 1/60 second (300 simulated seconds), separately at 1024x768 and 390x844.
- One mouse began away at viewport center, zero velocity, heading zero, seed field 1. No paws, contacts, identity variation or renderer. Each tick ran updateHunt then stepMice. Defaults included pace 2.8, size 2.86, travelSpeed 2.2, hide 1, tempo 1.5, runThroughChance 0.6.
- Recorded phase changes and completed appearance sequences, excluding the initial hidden phase from completed appearances. Reentry reuse compares the new peek edge with the edge recorded on the prior post-appearance hidden transition; the first entrance is excluded.
- For creep/dart starts, measured distance to normalized `hunt.goal` multiplied by viewport dimensions. This is important: targetX/Y still refer to the old target on the exact transition tick, so those fields would give an invalid initial-goal measurement.
- Initial speed-cap count compares distance*3 with (115 + speed*130)*travelSpeed*huntSpeed. It is a nominal cap calculation, not measured realized velocity.
- These are policy-level diagnostics, not rendering, physical-device, feline-interest or reference-video validation. The production default is two mice; these isolated runs deliberately omit inter-mouse collisions.

## Review of the proposed route plan

The lead reports broad diagonal runs, approximately 0.2–0.6-second pauses, rounded edge U-turns often without complete hiding, and hit count remaining 106 in the new footage. These are supplied observations, not independently verified here. An unchanged counter does not establish what inputs occurred or how the reference implements reactions.

Two-segment routes with fly-through intermediate waypoints address findings 3 and 4 directly. Broad diagonals and occasional visible edge returns can reduce the dominance of the peek-traverse-hide template. However, retaining the old peek-only traverse gate and near-certain same-edge reentry would leave findings 1 and 2 partly intact.

Use committed routes with bounded progress and distinct intermediate/final arrival semantics. Fly-through points need swept or safely bounded lookahead progression at high speed and low frame rate. Final points must preserve braking and settle without spinning. A rounded U-turn needs enough space and a feasible curvature/speed relationship; placing two sharp waypoints alone does not establish a rounded visible turn.

Brief mid-run hesitation should be sampled once per route, not per frame, and should not restart indefinitely. Verify its actual stopped interval rather than only its timer. Paws, holds, injuries and manual takeover must preempt cruising, and interrupted routes must not leave stale arrival/dwell or pause state that later resumes unexpectedly. Retain collision/watchdog recovery and test resize while routing.
