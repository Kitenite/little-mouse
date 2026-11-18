# Physics improvement batch

## Scope and coordination

Builder branch `cycle-physics`; baseline `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
Builder worktree `/Users/kietho/.paradev/worktrees/mouse/cycle-physics`.
Builder Superset workspace `02d640e5-5549-4b57-ad98-ff481686f443`.
Persistent read-only critic: `85eab30f-14b6-4ce3-b09c-c49ffe9afc11`.
Critic workspace `363ca24d-e54c-4318-a6bf-ff1e437aa0ed`, branch `cycle-physics-critic`.
Owns contact, world solver, drag pose and secondary motion; renderer owned by anatomy.
Contract read from root `docs/improvement-cycles.md` (not yet in baseline).
No engine adoption, automatic session stop, audio changes or device claims.

## PHYS-01: paused/reset secondary attachments

Severity medium; verified by independent critic; fix is this PHYS-01 commit.
Runtime: Node headless on macOS; no viewport/GPU; deterministic, no random input.
Baseline: initialize 60 frames at 60 Hz, x=frame, size=1, impact=.5,
tail hold (-88,12), fraction=.7. Then x=10000, size=2 with dt=0/NaN/Infinity.
Also suspend before dt=0. Expected complete live-state freeze until positive time.
Observed every case incremented revision and cleared the tail fraction to zero.
A positive teleport reset also dropped the reachable tail pin for one frame.
Repair: invalid/nonpositive dt preserves initialized state before reset detection;
cold dt=0 still creates safe geometry. Positive resets apply the current tail pin
without storing correction energy. Hidden reset remains pending until positive dt.
After: complete state equality during pause; next positive reset has exact solver
pin (<1e-8 model units), fixed root and zero ear/whisker/fur rates.
Tests: `secondary-motion.test.mjs` live-pause and cold/long-gap fraction cases.
Command: `node --test little-mouse/tests/{secondary-motion,whisker-geometry,drag-pose}.test.mjs`.
Result: 18 targeted pass; critic ran 40 focused domain tests, all pass.
Critic measured baseline rendered pin error 14.9402 model units on dt=.25.
Independent freeze/reset matrices: baseline failures 10/20; repaired failures 0/0.
600-frame release remains finite. No persistent session/pairing state touched.

## Queue and validation limits

Next: independent long-hold/regrab/multipointer findings, then ranked release issue.
Numerical attachment invariants do not establish biological motion or iPad performance.
Root integrates this report into the cycle index; no shared root document edited here.
