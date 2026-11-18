# Independent physics prototype critique

Status: prototype source/numerical review, 2026-11-17; adoption not recommended yet.
Baseline: `9e2f7e876dea24e8bdeafc49488b2f7672569a30`; critique branch `physics-engine-critique`.
Read-only prototype: `/Users/kietho/.paradev/worktrees/mouse/physics-engine-prototype/prototypes/physics-engine`.
Reviewed Planck 1.5.1 working files, including fixes: SHA-256 prefixes `core.mjs` 0fea49999b9f,
`demo.mjs` 925cea953600, `scenarios.mjs` 98325855942c, `test/core.test.mjs` 538e4f020e12.
Requirements remain owned by [physics decision](physics-engine-decision.md), [touch](touch-interaction.md)
and [anatomy](anatomy-motion.md). Proposed checks here do not change product defaults.

## Observed current solver limits

- [contact.js](../little-mouse/public/contact.js) locks body/head and pending-claim angle, places the
  captured point at an 800 px/s capped anchor, and zeros body velocity. Off-center grabs cannot torque it.
- Active paw/tail grabs translate the body with the anchor, then apply escape steering and a capped
  positional tether: paw reach `5*size`, tail reach `.93*tailLength*fraction*size`. This is not force transfer.
- Release uses filtered recent anchor velocity, capped at 900 px/s. [physics.js](../little-mouse/public/physics.js)
  damps toss translation for 0.65 s without angular momentum, lift or tumble. Toss skips ordinary wall bounds.
  Confirmed solo probe: size 2.2, bounded 1024×768, x=930, vx=800, active toss, dt=1/60 reaches
  x=942.7798 beyond bound 938.2, still moving outward. Prototype wall replay likewise exposes this defect.
- Collision uses equal-radius circles and three separation passes, without frictional torque or appendage
  fixtures. Claims have zero separation weight; two held mice can overlap. Catch-up drops time above 1/15 s.
- [leg-rig.js](../little-mouse/public/leg-rig.js) uses attached IK bones, projecting unreachable paw targets;
  bone-length preservation does not establish pointer pinning or articulated collision response.
- [secondary-motion.js](../little-mouse/public/secondary-motion.js) uses inertial tail geometry and a held
  curve with erased correction velocity. Targets clamp behind the rump and within reach; rendered fraction
  clamps to .125 while the world tether permits .05. Near-root/front-crossing exact pinning is not assured.

## Official API observations versus inference

- **API:** [MouseJoint](https://piqnt.com/planck.js/docs/api/classes/MouseJoint.html) is a soft, force-limited
  body-point/world-target constraint, with target, frequency and damping controls. **Inference:** it can
  support rotational dragging with appropriate dynamic bodies; tracking accuracy requires tuning. It does
  not supply ownership, injury, tap/hold policy or resting-paw behavior.
- **API:** [RevoluteJoint](https://piqnt.com/planck.js/docs/api/classes/RevoluteJoint.html) shares an anchor
  between two rotating bodies, with angle limits and a torque-limited motor. **Inference:** planar chains
  need geometry, mass, filtering and rig mapping; the API alone guarantees neither anatomical motion,
  smooth tail curvature, 3D tumbling nor comparative performance.

## Concrete prototype findings remaining

1. **High: articulation loses its constraints under impact.** `core.mjs`/collision replay produces
   maximum joint-anchor separation **12.273 px** and angle-limit excess **1.635 rad**. Wall replay gives
   **5.910 px / .348 rad**. These are measured errors, not hypothetical risks. Current tests intentionally
   assert the collision failure remains present; green tests are not an articulation acceptance result.
   Action: investigate mass/geometry, solver budget and per-part post-step velocity clipping; retain a
   failing acceptance gate of ≤2 px gap and ≤.2 rad excess until tuned. Do not assume clipping is the cause.
2. **Medium: metrics omit important motion.** `scenarios.mjs` samples torso speed and radius-39 torso
   wall overrun only; limb/tail speeds and wall penetration are absent. `dragErrorPx` is one end-of-drag
   sample, including in the hold scenario before its settling interval. Sampling after release also misses
   the final pre-cancel velocity. Action: sample all bodies before/after release; report peak/p95 pin error,
   settled error, appendage wall penetration, and joint error duration, with explicit metric labels.
3. **Medium: replay repeatability coverage is narrower than determinism.** The suite compares ten
   aggregate scenario results twice in one runtime at 120 Hz. It does not compare complete traces, vary
   event/render schedules, random seeds or morphology, or test slow/reversed/circular multi-pointer paths.
   Action: timestamp events independently of rendering; compare full traces across repeat runs, then
   replay 30/60/120 Hz with declared tolerances and dropped-time accounting. UI currently advances one
   1/120 s step per rendered frame: at 60 Hz replay runs half real-time. Label that playback rate explicitly.
4. **Medium: interaction parity remains intentionally incomplete.** Fast pending release tosses on the
   baseline but taps/stops in Planck (tested). Active Planck release retains physics velocity; baseline
   applies recent-anchor gates and may trigger harmless escape. Neither policy is inherently the benchmark
   winner. Action: retain separate matched-policy and exploratory-dynamics results; add stale-input,
   stationary release and re-grab tests before treating Planck as an application-compatible adapter.

## Verified repairs, not outstanding bugs

- Stable `partIndex` now selects both paws on each side and all three tail bodies. Updated tests verify
  the actual joint body and anchor; the former opposite-paw selection is repaired on the demo path.
- `demo.mjs` stores per-backend offsets for the entire capture. A Node probe running its actual handlers
  with a stub DOM verified unchanged targets after a stationary move with divergent poses. Resize clears
  claims/capture. This verifies handler logic, not actual browser capture dispatch or visual alignment.
- New `replay.mjs` shares move → step → release ordering between UI and CLI; all four release scenarios
  now match release speed/spin in tests. The previous one-step-early UI release is no longer outstanding.

## Comparison fairness and next acceptance checks

- Baseline is one torso circle with drawn appendages; Planck has eight colliding bodies per mouse,
  different mass, restitution and damping. Collision counts are baseline impulse counts versus Planck
  fixture begin-contact events (1 versus 16 in collision); do not compare them as equivalent quality scores.
- Add a matched single-circle collision case before attributing impact differences to the engine.
  Keep articulated scenes separately labeled. Fix baseline toss bounds independently of engine selection.
- Observed benefit/tradeoff: drag release spin is **−1.630 rad/s** in Planck versus **0** baseline;
  end-of-drag pin error is **21.624 px** versus **0**. This supports rotational capability, not superior pinning.
- Prioritize exact limb identity, no release-position jump, bounded spin/speed on every body, mirrored
  off-center pulls, head grabs, reachable rendered paw/tail pins, joint stability, and cancellation cleanup.
  Full game integration still needs resting-paw memory, injury/scoring, morphology, same-rig rendering,
  live settings, ownership and resource checks. Preserve owner-controlled session ending.
- Physical iPad frame pacing, offline startup, real rig appearance and feline interest remain unvalidated;
  simplified circles and desktop numerical tests cannot establish those outcomes.

## Evidence and handoff

Independent checks: baseline five focused suites **38/38 passed**; updated prototype core suite
**22/22 passed**; all ten CLI scenarios executed; additional stub-DOM offset/resize probe passed.
Coordinator-reported Browser Use evidence (not independently repeated here): actual drag showed baseline
no spin and Planck spin; pause cleanup/freezing passed. This does not establish iPad or final-rig quality.
Only this critique is edited; prototype files remain untouched. Coordinator should preserve remaining
limits in the report, improve measurement/coverage, and keep the current solver decision pending evidence.
