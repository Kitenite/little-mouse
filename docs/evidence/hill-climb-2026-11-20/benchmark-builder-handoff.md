# Partial builder handoff — benchmark ownership transferred to root

Status: partial implementation, NOT acceptance-signed-off. Root now owns all four files.
Worker stopped repository edits and searches upon the ownership transfer. No worker commit,
push, runtime, browser or native edits were made. Other workers/root changed shared main.

## Assigned files delivered

- little-mouse/scripts/behavior-benchmark.mjs
- little-mouse/scripts/behavior-hillclimb.mjs
- little-mouse/tests/behavior-benchmark.test.mjs
- docs/behavior-evaluation.md (101 lines at last check)

API note: /tmp/hill-benchmark-api.md. Root owns index/worker ledger registration.

## Existing implementation

Evaluator imports actual updateHuntGroup/updateHunt/stepMice, production settingsDefaults,
and deterministic production createMouseIdentity per mouse. Two mice use actual morphology.
Four scenarios: passive, persistent central paw, deterministic near misses, tall phone.
Actual integrated displacement, center visibility, 6x4 occupancy, phase transition entropy,
eight-transition repetition, maximum empty/phase/blocked intervals, paw penetration, finite
state and fixed-goal turn/error diagnostics are exported. Stored speed earns no utility.
Utility is explicitly an engineering proxy, not cat reward or validated engagement.

CLI --final benchmark is full TRAIN only: seeds 11/37/83, 360 seconds at 30 Hz.
CLI --quick/default is 30 seconds, seed 11, all four scenarios, never final acceptance.
--source-dir or BEHAVIOR_SOURCE_DIR selects immutable runtime archives.
Module exports evaluate, assessCandidate, guardrails, loadRuntime, provenance and constants.
Search exports hillclimb. Three rounds evaluate all four coordinates in ±10% default steps,
within ±20% plus schema bounds; duplicate patches reuse results. Only runThroughChance,
watchDuration, creepSpeed and peekDuration are allowed. No settings are applied.
Holdout 127/211/337 at 600 seconds/60 Hz is opened only for a training winner in latest code.
No alternative is chosen from holdout. Gates require 2% train improvement, conservative
scenario safety preservation, <=5% speed/coverage/visibility regression and 95% holdout utility.

## Existing measured artifacts

The corrected-search artifacts below used the evaluator before the remaining round-2 fixes;
root must retain their embedded hashes and not describe them as results of later repairs.

1. /tmp/hill-search-baseline-final.json
   Immutable source /tmp/motion-critic-baseline/little-mouse/public (coordinator's a3196df-equivalent archive).
   Source hash 3fe06f6daa6694112bbcb24672d8f52ebb2a66e92efe913d548c4c291124aa45.
   Full three-round search: 13.603 seconds; 24 candidate decision records (8 unique neighbors
   repeatedly cached because incumbent never changed). No training candidate accepted.
   Baseline utility .9405337774672833. Three passive seeds fail absolute six-second blocked
   travel gate; maximum blocked interval 6.833333333333319 seconds. Holdout null in this run.

2. /tmp/hill-search-f4cee77-final.json
   Archive created with git archive f4cee77 little-mouse/public, extracted under
   /tmp/hill-runtime-f4cee77 (no runtime edits).
   Source hash 7f9a2786fdc1a73ddfeb6e34a947391386e489de4ace15ef03de68ad8382d1f3.
   Full three-round search: 13.846 seconds; 24 candidate decision records, no training winner.
   Baseline utility .9418862139567882, no baseline gates, maximum blocked travel
   3.3333333333333313 seconds. Holdout null in this run. Defaults retained.

3. /tmp/hill-baseline-quick.json and /tmp/hill-baseline-train.json are earlier snapshots.
   Full train took 1.608 seconds and every scenario/seed reached all seven chapter IDs.
   They predate repetition/gate corrections and are NOT numerically comparable to latest utility.

4. /tmp/hill-search-baseline.json and /tmp/hill-search-f4cee77.json are obsolete earlier search
   outputs. Earlier search opened baseline holdout even with no winner, before the skip fix.
   Those results were not used to tune settings or choose a patch. Therefore do NOT claim the
   holdout has never been observed. Critic independently explored seed 211 as well.

Final motion is now coordinator revision 70eeb19; worker did NOT run that revision.
Root will run final corrected evaluation after its own repairs. No recommended knob patch.

## Verification already run

node --test little-mouse/tests/behavior-benchmark.test.mjs: 7/7 passed at last worker run.
Tests cover seeded actual runtime without Math.random, production settings/identity,
paused update clock, forbidden/out-of-range patches, all-run/invisible/NaN/blocked cases,
coverage and required metric omissions, invalid/duplicate seeds/scenarios, 2% train gate,
and holdout speed/coverage/safety/objective regression examples.
Scoped git diff --check passed before final ownership transfer.
Tests passing do NOT resolve the independent critic's remaining contract failures.

## Independent critique and unresolved round-2 findings

Read /tmp/benchmark-independent-critique.md. Critic did not sign off acceptance.
Last cited reviewed hashes: benchmark 2a49c1b14 / hillclimb 11af98f02.
Root owns all repairs and final review now. Worker made no subsequent implementation changes.

- Isolated watcher manually sets restUntil:20 and huntSpeed:0 then calls stepMice only.
  This tests physics rest, not actual forceHuntPhase/updateHunt watch entry or maintenance.
  Replace with actual policy entry/update and require nonzero watch observation exposure.
  observedWatchDrift remains a separate diagnostic including legitimate collision/paw displacement.
- assessCandidate still trusts supplied objective; it must compute/check objective from rows.
- Baseline row metric validity is not checked as strictly as candidate validity.
- seconds/hz/options comparability is not enforced. Source comparability needs an explicit
  contract, including whether a deliberate cross-runtime comparison is allowed.
- Required metrics must also validate domains: negative safety metrics and invalid fractions
  currently can pass numeric-finiteness checks.
- Runtime public-JS hashes are captured before import and checked on reuse/after evaluation,
  but evaluator/search hashes are read from disk later rather than frozen/verified against
  loaded code. Capture/check evaluator hashes so concurrent edits cannot mislabel execution.
- Existing reports from earlier utility/repetition/validation versions must remain distinguished.

Already fixed before transfer: recent-window transition repetition; evaluatorGit separated
from unverified runtime archive revision; absolute maxBlocked gate; finite required candidate
metrics and recomputed row gates; exact nonempty unique candidate/baseline row coverage;
invalid and duplicate input seed/scenario rejection; hunt/count requirements; holdout utility
floor; skip holdout when no training winner; runtime-file fingerprint change rejection.

Center visibility excludes legitimate partial peeks and is not exact rendered silhouette.
Phase-label entropy/repetition is not actual route novelty. Synthetic misses are not cat data.
Strict safety comparisons may reject all candidates; never relax gates to force a winner.
No physical device, visual, audio or feline quality validation is claimed.
