# Isolated physics engine comparison

Status: implemented prototype; defer adoption. Independent of the current audio/preset release.
Worktree: `/Users/kietho/.paradev/worktrees/mouse/physics-engine-prototype`.
Branch: `physics-engine-prototype`; root baseline `9e2f7e8`. No production source/package changes.
Implementation workspace `541324e5-b900-4564-a3e2-ab1eb663fbfa`, terminal `7f9d2355-1ff5-4c7a-9362-d9565c163f0f`.
Critique workspace `772b83df-1a88-4e7e-87b7-cd58fe7a2d37`, terminal `c9748fa1-f59a-4fb3-aa0b-2818a76b8908`.

## Run and inspect

From this worktree, using Node >=24 (tested with v26.7.0):

```sh
npm --prefix prototypes/physics-engine ci --ignore-scripts
npm --prefix prototypes/physics-engine test
npm --prefix prototypes/physics-engine run scenarios
npm --prefix prototypes/physics-engine start
```

Open `http://127.0.0.1:4177`. Optional alternate port: `PORT=4180 npm --prefix prototypes/physics-engine start`.
The local server serves only this prototype and `little-mouse/public`; the import map uses
installed Planck, without a CDN, bundler or production build. Stop with Ctrl-C.
`window.physicsPrototype.snapshot()` returns detached JSON data, not live engine references.
Controls: reset, pause/resume, cancel all, matched scenario replay; drag either canvas.
UI replay advances one simulation step per animation frame, intentionally slower than real time.
Manual input mirrors stable part indices and local hit points; each capture retains its target
translation offset after the two simulations diverge. One side may reject a claim during
baseline invulnerability; ownership remains independent and the snapshot shows accepted claims.

## Sources and verified API

- npm registry `npm view planck version dist.integrity repository.url` returned **1.5.1**.
  `package.json` pins that exact version; the separate lock includes registry integrity hashes.
- [Official MouseJoint API](https://piqnt.com/planck.js/docs/api/classes/MouseJoint.html):
  soft maximum-force point-to-world tracking, constructor and `setTarget`.
- [Official RevoluteJoint API](https://piqnt.com/planck.js/docs/api/classes/RevoluteJoint.html):
  shared anchor, optional angular limits and motors. This prototype does not use motors.
- Installed `planck/src/dynamics/joint/MouseJoint.ts`, `RevoluteJoint.ts` and package exports
  verify the constructor/options locally. Node tests instantiate and exercise the real package.
- Baseline directly imports `little-mouse/public/physics.js` and `contact.js`, including their
  transitive production modules. It is not a rewritten approximation of that solver.

These APIs establish capability, not realism, device performance or renderer compatibility.
## Bounded implementation and harness policy

- Shared accumulator: fixed 1/120 s, at most eight substeps per call; excess time discarded.
  Invalid/nonpositive time is an exact no-op; pause clears claims and accumulated time.
- Planck: 50 px/m, zero gravity, two mice, 16 dynamic bodies, 14 limited revolute joints,
  one static four-edge boundary body, maximum two MouseJoints. Fixed 12 velocity/8 position iterations.
- Equal 39 px torso radii. Planck adds four 9 px single-body limbs and three 7 px tail segments.
  Limb limits ±0.65 rad; tail limits ±0.5 rad. Same-mouse fixtures do not self-collide.
  Density is 1 for torso and 4 for appendages (numerical tuning, not anatomical mass estimates).
- Active grab: off-center selected body point, maxForce = 120 × whole-mouse mass,
  frequency 6 Hz, damping ratio 0.85. Target motion limited to 800 px/s.
- Pending 0.25 s: all Planck parts become kinematic and translate as a frozen pose. On activation
  they become dynamic and the selected local point gains a MouseJoint. Pending collision response
  and walls are therefore kinematic; this is a policy layer, not MouseJoint behavior.
- Ownership: one pointer per mouse and one mouse per pointer. Normal active Planck release keeps
  bounded physical velocity/spin; each dynamic part is capped at 900 px/s and ±12 rad/s per step.
  Pending Planck release stops motion. Baseline `endContact` can toss after >0.08 s, before hold.
- Cancel, lost capture, blur, hidden document, resize, pagehide, reset and pause clear claims.
  Harness cancellation also zeroes velocities/spin/tossUntil; production `cancelContact` only
  removes ownership. This stronger harness policy is explicitly not production lifecycle parity.
- Baseline uses production harmless release behavior with deterministic RNG=0; it may steer
  afterward. Planck has no behavioral steering, injury or tap reaction. Both begin at rest.
- Hit tests/artwork are coarse circles, with stable limb side and tail segment identity.
  No separate head collider, anatomical renderer contacts, deforming tissue, full ragdoll,
  morphology variation, resting-paw routing, live settings or renderer integration is implemented.

## Reproducible numerical evidence

Two mice in an 800×500 px world. Drag starts at (220,226), holds 36 steps, then moves
60 steps by (3 px, sinusoidal y). Hold adds 120 stationary steps; cancel uses the drag path.
Wall starts at (650,226), moves 25 steps by 5 px after the same hold. Collision starts
centers at (280,250)/(460,250), with opposing 420 px/s velocities. No random scenario inputs.
Values below are from `npm run scenarios`; K = imported kinematic, P = Planck.

| Metric | K | P |
| --- | ---: | ---: |
| Drag grabbed-point error at final move, px | 0.00 | 21.62 |
| Drag release speed, px/s | 426.72 | 428.26 |
| Drag release angular velocity, rad/s | 0.00 | -1.63 |
| Drag peak joint anchor gap, px | n/a | 0.061 |
| Drag peak angular limit excess, rad | n/a | 0.121 |
| Hold release speed after stationary settle, px/s | 0.00 | 2.35 |
| Cancel immediate release speed/spin | 0 / 0 | 0 / 0 |
| Collision final torso-center distance, px | 198.49 | 105.76 |
| Collision peak joint anchor gap, px | n/a | 12.27 |
| Collision peak angular limit excess, rad | n/a | 1.635 |
| Wall peak torso-radius boundary overrun, px | 168.78 | 0.00 |
| Wall release angular velocity, rad/s | 0.00 | 4.22 |

Collision counters use different semantics (K closing impulses, P begin-contact events),
so their counts are diagnostic, not a quality score. Equal torso radii do not make the
articulated mass/collider systems equivalent. Wall overrun measures the torso, not all parts.
Production toss integration skips its usual world-bounds branch; this explains the observed
baseline wall escape. Held anchors can also cross torso-radius bounds. Production is unchanged.
Limited Planck joints are numerical constraints: the collision overshoot is a known failure,
not evidence that the requested angular limits are enforced exactly under stress.

## Checks and recommendation

23 focused Node tests pass: actual APIs, ownership, pending freeze, invalid time, step budget,
release/spin bounds, cancellation, joint cleanup, part indices, mirror offsets, replay ordering,
deterministic reruns, and synthetic DOM event wiring. Two unchanged production test files also
passed (22 tests). DOM mocks verify wiring only, not native capture or browser rendering.
Coordinator independently confirmed 23 tests, matching scenarios and clean diff checks. Browser Use
smoke in scratch headless Chrome exercised real down/hold/drag/up: spin 0 vs 2.33 rad/s on one
nondeterministic UI run; pause cleared claims; no captured error events. [Screenshot](evidence/browser-smoke.png).
Independent [critique](evidence/independent-critique.md): fixes verified; broader coverage pending.
Metrics cover torso bounds and one drag-error sample; repeat checks compare aggregates in one runtime.

**Inference/recommendation: defer adoption.** Force-driven rotation is demonstrated, but tracking
lags and articulated collision error fails proposed gates of ≤2 px anchor gap and ≤0.2 rad
limit excess. Passing regression tests intentionally preserve this failure evidence; they do
not pass the adoption gate. Resolve stability/parity, full traces, all-part metrics and device pacing.
Environment handoff (design proposal): consume pose/part positions and actual displacement per simulation step;
held body velocity can be zero while dragging. Derive ground contact from renderer paw height/stance,
not Planck wall contacts: this is planar, zero-gravity physics with no ground normal/load measurement.
Use bounded contact/sweep signals for indents/rustle; suppress pause, teleports and resets. No engine dependency.
