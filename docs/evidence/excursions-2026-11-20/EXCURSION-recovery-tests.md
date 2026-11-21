# Collision-paw recovery regression handoff

Status: implemented; candidate passes; immutable baseline fails the intended regression.
Owned new file only: little-mouse/tests/paw-collision-recovery.test.mjs.
No production/existing-file edits, settings tuning, commits, deploys or restarts for this task.

## Fixture and acceptance

Seed 59, 30 Hz, 1024×768, two seeded production identities, current unmodified defaults,
persistent central paw radius 50. Actual updateHuntGroup/updateHunt/stepMice; unseeded
Math.random throws. Initializes exactly as the motion critic's existing natural replay.
Observe every visible retreat beginning through 80 seconds, extend observation through 88
so trailing entries receive the full eight-second recovery budget. Phase renewals do not split
retreats. Require real active/nonhidden center exit, enough actual displacement to reach an
edge, elapsed retreat <8 seconds, and accumulated absolute heading turns <3 rotations.
These are engineering regression bounds, not tuned production knobs or cat-response claims.
A stalled/hidden/excluded mouse cannot satisfy physical exit/progress assertions.
Both progress and turn tests share the same deterministic replay; collision support is required.

Two focused controls verify same-paw outer-band directional continuity, tangential progress
with outward demand in actual overlap, immediate different-paw escape, and a real body hold
that remains anchored through production physics. No steering-formula equality assertion.

## Results and baseline proof

Final candidate2: 15 observed retreats; max duration 1.4666666667 seconds,
max accumulated turns .9203289667 rotations; 522 collision impulses across 88 seconds.
All four new tests pass. New + existing paw-detour-memory + held-paw suites: 16 tests pass.
Log: /tmp/excursion-recovery-candidate-tests.txt.
Candidate2 contact.js SHA256 at validation:
18ea26571d10f7ec8deb438c99a493ff1cf1726a53cf5d994a17edbeed7fabe3.
Candidate1 results preserved separately: /tmp/excursion-recovery-candidate1-tests.txt.
Final runtime/test hashes: /tmp/excursion-recovery-final-hashes.json.

Fresh git archive of 4ba72c44915224f41a27224b3db30d5008960b95 public runtime extracted
outside worktree; copied only the new identical test into its tests directory. No baseline
runtime patches. All 42 archived JS hashes and archive location are retained in
/tmp/excursion-recovery-baseline-evidence.json. Exact node test output:
/tmp/excursion-recovery-baseline-tests.txt.

Baseline fails THREE of four tests: physical-progress deadline, absolute-turn cap and outer
safety-band continuity; different-paw/held control passes. Reported seed59 mouse0 retreat
beginning at 56.8 reproduces 18.2333333333 seconds to physical exit and 12.3425822091
absolute rotations (net -0.1786421032). Baseline totals: 11 retreats, 1938 collision impulses.
This establishes that the new progress/turn regression catches the original failure, not just
a difference in an internal steering formula. Candidate paths diverge earlier, so the tests
cover every observed retreat rather than assuming the old event remains at 56.8 seconds.

## Limits and next ownership

This is one previously selected seed/rate regression plus local safety controls, not a broad
panel, frame-rate invariant outcome, rendered-motion acceptance or device verification.
Root owns runtime repair, broader integration and final critic review.
Round-2 excursion support discontinuity repair also complete; see /tmp/EXCURSION-builder.md.
Root owns candidate2 swept-paw-specific tests; these tests were rerun unchanged on candidate2.
