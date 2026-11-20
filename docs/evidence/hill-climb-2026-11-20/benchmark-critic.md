# Independent benchmark critique — final round 3/3

Verdict: ACCEPT WITH LIMITS for the inspected engineering evaluator/search contract.
No concrete blocking finding remains from the targeted review. Earlier round-1/2 failures
are resolved in the hashes below; this verdict supersedes the prior not-signed-off report.
Read-only review: no repository edits, parameter tuning, full search, or holdout evaluation.
Root's ongoing immutable-source search and its eventual result were not independently rerun.

## Exact reviewed scripts

- little-mouse/scripts/behavior-benchmark.mjs
  SHA-256: 223b152987fe43d61c6e6f814e9176729d5a554ddf317f4ac9030f1a6dcec53c
- little-mouse/scripts/behavior-hillclimb.mjs
  SHA-256: 2ba0672a08c0c175e647a75c2beda6219cf77dda76fb7d873334c12b3fec50dd

## Verified repairs

1. Acceptance validates both baseline and candidate required metrics, finite/nonnegative values,
   bounded fractions and phase-time partition. Missing/duplicate scenario-seed coverage fails.
2. Protocol requires valid unique uint32 seeds, known scenarios, duration and supported frequency.
   Baseline/candidate protocol and full Cartesian scenario-seed coverage must match.
3. Source/evaluator hashes are required even with metadata:false and must match. Objectives are
   recomputed from row metrics, checked against aggregate scores and optional reported row scores.
4. Training requires >=2% computed improvement. Holdout utility must retain >=95% of baseline;
   scenario-specific path/visible speed/coverage/visibility and safety comparisons still apply.
5. Watch control uses forceHuntPhase('watch'), actual updateHunt and stepMice, with no other mouse
   or live paw. It measures actual watch dwell and rejects zero exposure via finite-state failure.
   Live watch displacement remains observedWatchDrift, explicitly separate from the freeze gate.
   No threshold increase was used to make collision-displaced watch periods pass.
6. Runtime source hashes are captured before import and checked after import/evaluation/reuse.
   Evaluator and search hashes are captured at module load and checked at run boundaries.
   The focused loaded-script mutation test edits only a temporary copied evaluator and cleans up.
7. Search remains three training-only coordinate rounds, four allowlisted knobs, +/-10% steps
   bounded to +/-20% of defaults and settings validation. No automatic runtime settings write.
   Holdout opens only for a non-default training winner, never chooses a second candidate after
   failure, and quick-mode output cannot recommend a patch. Reject-all is an honest result.

## Independent checks performed in final round

- node --test little-mouse/tests/behavior-benchmark.test.mjs: PASS 10/10.
  Includes reproducible runtime observations, malformed inputs/results, real watch exposure,
  frozen-time behavior, and loaded-evaluator mutation refusal.
- Separate synthetic acceptance fixtures independently reproduced earlier attacks:
  empty rows, forged aggregate score, negative safety metric, fraction >1, NaN metric,
  mismatched duration, mismatched source hash, mismatched evaluator hash and duplicate rows:
  all now REJECTED with concrete reasons.
- A correctly recomputed improvement was ACCEPTED (valid positive control).
- A synthetic heldout entropy/utility loss was REJECTED; this was only a result fixture,
  not a heldout simulation or a search against reserved seeds.
- Read both final scripts end-to-end; independently inspected actual watch entry/update calls,
  fingerprint boundaries and training/holdout choice order. Final SHA-256 recorded after checks.

## Measurement honesty and remaining limits

- Path is integrated actual sampled displacement in screen-width units, not nominal m.speed.
  Current endpoint requires active state, hiddenUntil elapsed and center in viewport. Previous
  endpoint requires active state and center in viewport; previous hiddenUntil is not separately
  saved. Current simulated hide policy uses away state, so its transitions are excluded.
  Do not generalize this to arbitrary future active-but-hidden transitions without adding that check.
- Center visibility misses partial body/tail peeks. Union 6x4 occupancy is a coarse spatial proxy.
  Sampling at frame endpoints underestimates curved substep paths; rates are comparable within
  the enforced protocol, not exact physical trajectories. Collision displacement contributes to
  general path and creep/run rates; these are observed movement, not purely self-propelled motion.
- Fixed-goal turns integrate actual wrapped heading change in isolated ordinary goal trials.
  They detect that specific orbit/nonarrival failure, not general visual turn quality.
- The watch fixture begins stationary and tests actual stationary watch policy. It does not prove
  stopping/braking quality from every incoming speed, collision response, or paw-threat exception.
- Phase entropy and recent-eight transition repetition measure authored labels, not route novelty,
  enjoyment, attention or biological realism. Synthetic near misses are stress inputs, not reward.
- Utility saturation can legitimately make >=2% improvement unattainable. Do not loosen thresholds
  or add holdout search to manufacture a winner. Conservative baseline gates may reject every
  candidate when baseline itself is unsafe; report that failure explicitly.
- Root's earlier /tmp/root-benchmark-baseline.json and /tmp/root-benchmark-creep.json used a
  different evaluator/repetition utility. Do not compare their scores to final evaluator output.
- Train/holdout are disjoint within search. Builder documentation reports prior independent
  exploration of holdout seed 211: search-isolated is accurate; globally sealed/prospective is not.
- Fingerprints provide reproducibility/integrity checks, not cryptographic attestation of arbitrary
  caller-supplied result objects. Immutable source archives remain the appropriate final-run input.
- No physical-device, renderer, audio or cat engagement outcome is established by these checks.

## Review accounting and handoff

Three targeted rounds used; review complete. Round 1 found coverage/NaN/seed/holdout failures;
round 2 found forged scores, numeric domains, protocol mismatch and forced-rest watch limitation.
Root's final changes resolved these; final verification above supersedes earlier unresolved status.
Only /tmp/benchmark-independent-critique.md was written by this critic. Prior builder messages used
Superset per /Users/kietho/.agents/skills/superset/SKILL.md; root owns subsequent integration.
