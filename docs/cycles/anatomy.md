# Anatomy improvement cycle

## Scope and coordination

Builder branch `cycle-anatomy`, base `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
Worktree `/Users/kietho/.paradev/worktrees/mouse/cycle-anatomy`.
Builder workspace `5cff0c70-a838-40e9-82bd-d39f287779a3` (local).
Read-only critic workspace `82ee8695-82c6-44df-a181-0d1e1330ec17`,
terminal `a4d70a7a-8123-445d-a9a7-ed06af8cd825`; no editor delegation.
Physics owns secondary-motion/drag-pose; coat owns fur-volume. Their contracts stay unchanged.

## Iteration 1: profile shelves — accepted

Baseline: cf064cc, `/review/anatomy.html`, seed314159/agouti, default morphology,
neutral after30 frames, bare/default coat top/side, Chrome desktop DPR1, 1400px-wide fixture.
Expected continuous flank; observed shelf/scalloping from zero slopes at every profile knot.
Repair: shape-preserving cubic Hermite shared tangents, unchanged knot positions/radii/heights.
Body mesh and contact classifier use the same section; rest UVs/anchors remain unchanged.
Before/after: `evidence/anatomy/profile-before.png`, `profile-after.png`.
Fixture asset path404 affects both captures: geometry-only comparison, not coat approval.
Critic ACCEPT:24 focused tests,18000 interval bound checks,112 morphed/articulated contacts,
16 limb anchors, both turns/extreme morphology; zero failures. Shared slope jump<3.74e-6.
Independent images agree shelves reduced; angular rear tip and jaw oval persist.
Module/evidence commit `6033728`; isolated renderer hook `de4ec5a`.

## Iteration 2: lower-jaw continuity — accepted

Baseline `de4ec5a`, same fixture/cameras/identity. Fixed document asset base first, then
captured BOTH jaw comparisons with `/assets/mouse-fur.jpg` loaded (HTTP200).
Expected continuous closed chin; observed distinct flattened oval below the snout.
Repair `3da20db2abc281ab1e19ab56cb14964a1e0751cd`: embed jaw at profile underside+1.1,
reduce ellipsoid radii from8/4/2.4 to7/3.5/1.9 before existing trait scaling.
Nibble displacement/phase, head attachment and physics ownership remain unchanged.
Evidence: `evidence/anatomy/jaw-before.png`, `jaw-after.png`, `jaw-nibble-open.png`.
Reload reproduces neutral; fixture diagnostics can force nibble at t=3*pi/70 (sine=-1).
Critic ACCEPT at exact revision:25 focused tests;960 frames with min/max morphology,
both turns, all4 held paws and nibbling. Maximum selected-paw error1.78e-15,
anchor/jaw-XY error0, minimum jaw-top overlap1.55 model units; no nonfinite state.
Independent realism review also accepts default rest/head-held chin continuity;
its docs/evidence handoff is `e90445facbb5de3b787864034bcca55c9ec4ceee` (separate branch).
Builder ran all235 tests PASS and build PASS (isolated npm ci required before build).
No per-frame geometry allocation added. UVs, body picking, feet transforms, shared fur
uniforms, secondary-motion/drag-pose, GroundResponse and audio are unchanged.
Two bounded accepted iterations complete this batch; no third iteration needed.
Preview: `http://localhost:8896/review/anatomy.html` while local server runs.

## References and remaining work

Compared rendered silhouettes with [Naturalis / Paul van Hoof](https://images.naturalis.nl/original/muizen/Huismuis_Paul%20van%20Hoof.jpg)
and [Roger Wasley](https://www.flickr.com/photos/rogerwasley/49538148186/).
Observed rounded flank and continuous cheek/jaw; interpolation is a game-shape inference,
not measured anatomy or biomechanical validation. Static photographs cannot validate gait.
Remaining: angular rear tip, extreme-morphology tail-root visual gap,
opaque thick ears. Overlapping jaw ellipsoid remains a game approximation. No device, photorealism, naturalistic-motion or full attachment closure claim.
