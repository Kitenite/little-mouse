# Connected prey routes

Owner: root. Implemented from the [owner recording analysis](reference-recording-analysis.md).
Modules: `hunt-routes.js`, `enrichment.js`, `physics.js`.

## Contract

- A dart may be a short direct move, a crossfield run with one bend, or a finite edge hook
  with two bends and a return across the field. No cyclic waypoint loop.
- Routes are sampled once at phase entry in normalized coordinates. Runner/burst motifs
  favor connected runs; scouts/teasers retain more investigation. Peek may lead straight to dart.
- Intermediate goals advance early using bounded speed-aware lookahead. They have no mandatory
  arrival latch/dwell; the final goal retains distance braking, swept arrival and a settled stop.
- Distance braking remains at all waypoints. Removing it let maximum-speed mice orbit a bend
  outside the lookahead radius; the independent critic reproduced and verified the repair.
- Some routes schedule exactly one .18–.40 second hesitation. Simulation time owns it.
  A nearby live paw can interrupt the pause; holds, injury, toss and manual control take priority.
- Every phase entry clears stale route state. Progress watchdogs reset at a new waypoint;
  an obstructed dart can still yield to watch. No teleport or mid-screen disappearance.
- A creep traveling under four actual pixels in 2.5 seconds before arrival yields to watch.
  This measures integrated position changes after collisions, not stored velocity or distance
  to the goal: a progressing paw detour may temporarily move away. Holds, goal/viewport
  changes and phase entry reset the window; slow moving creeps and arrival dwell remain.
- Hidden reentries ignore distance from the previous exit when choosing cover. Familiar-cover
  preference remains available; active/recent paw penalties and blocked-entry waits are unchanged.
  Initial cover and visible retreats still consider distance. Living identity is unchanged.

## Verification and limits

Regression tests check motion through intermediate bends, final stop at 30/60/120 Hz, one-shot
hesitation, held-body pins, paw clearance, bounds and extreme settings. A 600-second fixture
checks actual reentry diversity, not only shuffled motif labels. The independent 1,200-route
sweep reaches every final target after the braking repair; production watchdogs remain separate.

Evidence and comparative coverage are in the reference analysis. No claim of feline preference,
photorealism or device frame rate. Persistent [paw detours](touch-interaction.md) now retain a chosen side through a footprint.
The opposed-creep collision fixture recovers in 2.51–2.54 seconds at 30/60/120 Hz rather
than pushing until its roughly nine-second deadline. Held-anchor, slow-creep and live-paw
controls remain covered. Long-run distributions and physical iPad behavior still need observation.
