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
Code/module and renderer hook commits are recorded in the final handoff.

## References and remaining work

Compared rendered silhouettes with [Naturalis / Paul van Hoof](https://images.naturalis.nl/original/muizen/Huismuis_Paul%20van%20Hoof.jpg)
and [Roger Wasley](https://www.flickr.com/photos/rogerwasley/49538148186/).
Observed rounded flank and continuous cheek/jaw; interpolation is a game-shape inference,
not measured anatomy or biomechanical validation. Static photographs cannot validate gait.
Remaining: detached lower-jaw oval, angular rear tip, extreme-morphology tail-root visual gap,
opaque thick ears. No device, photorealism, naturalistic-motion or full attachment closure claim.
