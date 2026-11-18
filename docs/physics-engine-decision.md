# Physics engine decision

Status: current solver retained; isolated Planck prototype tested; adoption deferred.
This decision concerns world movement, collision and dragging. Three.js already renders the
3D rig; changing the physics engine would not replace its mesh, fur, anatomical deformation,
limb IK, ears or whiskers.

## Observed implementation problems and repairs

Source-level drag simulations exposed three policy/ordering defects:

- Paw/tail anchors moved at only 150 CSS px/s while a normal drag could be much faster.
  All grab anchors now share the bounded 800 px/s limit; paw/tail bodies travel with the
  anchor translation while retaining their independent escape/tether response.
- Zero-duration steps still separated overlapping bodies. Invalid/nonpositive duration now
  leaves simulation state untouched; positive catch-up duration is bounded to eight substeps.
- Collisions displaced claimed bodies before grab constraints moved them back. Claimed mice
  now act as kinematic collision participants; separation moves the unclaimed body.

The renderer freezes anatomical contact geometry from initial claim, including the short
pending interval before sustained hold activation. Eating poses stop on any claim.
These are implemented fixes with regression coverage, not device or perceptual validation.

## Primary sources and practical fit

| Candidate | Observed API capability | Inference for this project |
| --- | --- | --- |
| [Planck MouseJoint](https://piqnt.com/planck.js/docs/api/classes/MouseJoint.html) | Tracks a world target with a soft maximum-force constraint; target, frequency and damping are adjustable. | Best focused prototype if force-based grabs become necessary; keep existing pointer ownership and one joint per captured pointer. |
| [Rapier rigid bodies](https://www.rapier.rs/docs/user_guides/javascript/rigid_bodies/) and [joints](https://www.rapier.rs/docs/user_guides/javascript/joints/) | Bodies, attached colliders and joints provide world dynamics and articulated constraints. | Strong candidate for a future physical ragdoll or more complex collisions; current anatomy would still require a mapping between bodies and the rendered rig. |
| [Rapier installation](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) | JavaScript bindings load WebAssembly asynchronously; compatibility packages embed it. Rendering is separate. | Adds an initialization/loading path to the current static web bundle; that path needs iPad/offline/OTA validation. |
| [Matter MouseConstraint](https://brm.io/matter-js/docs/classes/MouseConstraint.html) and [Constraint](https://brm.io/matter-js/docs/classes/Constraint.html) | Mouse/touch interaction and adjustable distance/spring constraints; stiff constraints may need iteration tuning. | Easy browser-facing experiment, but use independent constraints with our pointer map instead of assuming the helper alone implements multi-touch and body-part policy. |

These sources establish available APIs, not comparative performance or realism. Planck's
[official project overview](https://piqnt.com/) describes JavaScript/TypeScript rigid bodies,
joints and collisions, separate from rendering. No source establishes that replacing our
small simulation will improve feline interest.

## Decision and adoption gate

Keep the repaired kinematic solver for the current release. The diagnosed defects came from
anchor speed, time handling and ownership ordering; swapping libraries would preserve those
mistakes unless the interaction policy changed. The current visual soft tissue and tail are
bounded approximations, not a physically accurate animal.

The isolated `physics-engine-prototype` branch at `6c1633e` contains the Planck experiment
and 23 passing tests. Its seeded scenarios measured 21.62 px drag lag, 12.27 px collision
joint gap (proposed gate ≤2 px), and 1.635 rad angular overshoot (gate ≤0.2 rad).
Tests document those limitations; they do not establish adoption readiness. Preview with
`PORT=4180 npm --prefix prototypes/physics-engine start` in that worktree.

Adopt an engine only when an isolated
prototype demonstrably improves the same seeded drag/collision scenarios and measured iPad
frame times, while preserving deterministic ownership, cancellation, morphology-aware contacts,
resting-paw routing, pause, live settings and bounded resource use. A prototype must not become
a second simultaneous authority over mouse positions.

## Validation boundary

Current numerical tests cover ordinary fast drags, held-part tethers, pause, cancellation,
kinematic collisions, bounded throws and articulated attachment. Browser and physical iPad
checks must still inspect reachable paw/tail pins, curve appearance, multi-touch pressure and
frame pacing. No engine package was added to the live game. Prototype measurements
are desktop scenario results, not physical iPad performance or perceptual validation.
Ground impressions can use rendered foot contacts and actual displacement independently
of engine adoption; held mouse velocity alone is insufficient to detect dragging.
