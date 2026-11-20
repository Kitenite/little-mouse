# Paw detour commitment handoff

Implemented persistent per-mouse detours in the shared root worktree. No commit/push.

Files: `little-mouse/public/contact.js`, `little-mouse/tests/paw-detour-memory.test.mjs`, `docs/touch-interaction.md`. The repository uses `tests/`, not `test/`.

API: `avoidPaws(m, dx, dy, paws, clearance, baseRadius=50)` still returns `[dx, dy]`; no caller changes required. Inspected `physics.js`: each substep invokes it, except head/body holds and tosses. Private WeakMap stores one obstacle identity, side, approach axis, goal and travel budget per mouse. Pointer records retain a private Symbol identity through updates and release; reuse starts a new identity. Existing external obstacles fall back to pointerId or object identity.

Clearing: passed obstacle (0.35 effective reach), removed/expired footprint, near-zero steering distance, goal displacement exceeding max(40px, clearance/2), successful claim, held invocation, or accumulated travel over 6*(clearance+180). Forward flank waypoint prevents stopping beside a paw. Live overlap retains immediate outward priority; recent footprints shrink steering clearance without physical collision. Claims clear memory directly because body/head physics bypasses avoidance.

Checks: `node --test little-mouse/tests/paw-detour-memory.test.mjs little-mouse/tests/contact.test.mjs little-mouse/tests/physics.test.mjs little-mouse/tests/held-paw.test.mjs little-mouse/tests/touch-reactions.test.mjs` — 50 passed, 0 failed. Ten new regressions cover actual mirrored travel at 30/60/120Hz, repeated pointer jitter, multi-paw order stability and travel, immediate overlap, release/expiry/reuse, pass/goal clearing, bounded travel, held exclusion/pins and claim/cancel clearing. `git diff --check` passed. Touch requirements updated in place, 120 lines.

Limits: local geometric avoidance, not global pathfinding; dense paw configurations, rendered motion and physical iPad quality not validated. Root owns enrichment/game integration and worker ledger updates; those unowned files were not edited. No remaining implementation dependency in this scope.
