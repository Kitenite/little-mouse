# Living watch pauses

Implemented in the shared root worktree; no commit or push.

Files owned/changed:
- little-mouse/public/idle-animation.js
- little-mouse/public/mouse3d.js
- little-mouse/tests/watch-pause.test.mjs (new)
- docs/anatomy-motion.md

Exported watchPausePose(mouse,time) samples bounded seeded sniff/head scans and independent ear listening from simulation time. No random draws, travel writes, cooldown changes, or game.js integration needed. Renderer uses existing head deformation/ear pivots; removes the watch head offset during leg posing to keep feet planted. Existing head/ear controls apply. Held poses stop advancing immediately, preserving captured contact; injury/toss/travel/danger suppress new watch offsets. Active grooming, scratching, stretching, rolling and eating take priority.

Checks: 32/32 pass:
node --test little-mouse/tests/watch-pause.test.mjs little-mouse/tests/idle-animation.test.mjs little-mouse/tests/mouse-model.test.mjs little-mouse/tests/held-paw.test.mjs little-mouse/tests/anatomy.test.mjs
Owned-file git diff --check passes. Anatomy document is 149 lines (below hard cap).

Tests cover 20,000 deterministic bounded samples without random draws, safety gates, existing action priority, live renderer integration, planted feet, stable geometry, simulation pause, held head capture, injury and toss. Existing anatomy, mouse-model and held-paw tests pass. New motion adds constant scalar sampling/offset work, no geometry rebuilds or new per-vertex loops; physical frame cost and visual naturalness are not device-verified.

Integration owner: record this assignment/result in docs/workers.md if needed; that ledger is outside this worker's strict file ownership. Other concurrent worktree changes were observed and left untouched. Pending: desktop/iPad visual review of subtlety and frame cost; no deployment claim.
