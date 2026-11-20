# route-metrics worker handoff

Status: implementation complete; repository files frozen for root final search.
Root reports combined 425 tests pass, exact legacy training-metric equality and no new diagnostic
invalid samples/overflow. Independent critic round 2 is running; acceptance remains pending.
Baseline: main 3537a0a. Shared worktree; no commit, push, deploy, server restart, public-file edit,
worker spawn, index or worker-ledger edit performed. Other workers' modifications remain untouched.

## Owned files

- little-mouse/scripts/behavior-route-metrics.mjs — per-mouse bounded actual-path tracker.
- little-mouse/tests/behavior-route-metrics.test.mjs — 13 focused node:test cases.
- docs/behavior-route-metrics.md — 92 lines, current contract and limits.

API contract: /tmp/route-metrics-api.md (rewritten to supersede initial phase-boundary design).
Root should register owning document and ledger, integrate helper/hash, and aggregate counters.
No utility/learning changes. This is not evidence of feline interest, novelty perception or efficacy.

## Final API and design

createRouteMetricsTracker(options?) -> {sample, snapshot, finalize}.
sample({time,x,y,phase,eligible,discontinuity:false}) copies actual post-physics primitives.
Required phase is validated but never segments or changes metrics: changed labels are inert.
Ineligible finite offscreen coordinates are accepted and counted as exclusions, never clamped.
Eligible out-of-range coordinates are invalid. Hidden/hold/toss/manual/injury eligibility is caller-owned.
Discontinuity excludes both adjacent intervals. Gap >.25s or speed >8 normalized units/s censors.
Both endpoints must be eligible. Invalid and nonmonotonic samples clear pending continuity.

Movement is spatially gated at .002 normalized distance, not summed stationary frame jitter.
Bout closes after .4s without threshold movement, or return within .015 of start after
at least .12 traveled arc and .06 excursion. Geometric closures detect constant-phase loops.
Adjacent bouts have no overlapping path window; only their boundary endpoint is shared.
Completed bouts >=.06 length and >=.001 duration produce 32 equal-arc samples.
Screen-fixed corridor and mean-centered shape signatures compare preceding 32 eligible bouts.
Both allow reversed traversal; shape allows translation only, never rotation or scale.
Match requires RMS <=.025 AND max deviation <=.06. First route has no comparison.
Default max active points now 2048; overflow censors whole bout, never admits a truncated signature.
Default memory: 2048 points + 32 history entries * 32 points * two representations + fixed state.
Options cap maxPoints<=4096, historySize<=128 and resamplePoints<=128. No whole-frame histories.

snapshot is detached and does not flush. finalize() censors unfinished trailing bout by default.
finalize({complete:true}) asserts real completion at the final sample; finalize is idempotent.
After finalization sample throws. Root should normally use default finalize at benchmark end.
Rates divide repeated counts by comparisonRoutes; unavailable rates are null, not novelty.
Pool by sums, not averages. eligibleDistance is noise-gated support including portions later censored.
completedRoutes=eligibleRoutes+shortRoutes; censoredRoutes separate. Closure/interval reason maps
plus sampled/observed/eligible/censored intervals/seconds and storage high-water expose support.
Counters saturate at Number.MAX_SAFE_INTEGER; config is included in every snapshot.

## Critic findings addressed

Read /tmp/metrics-critic-checklist.md and /tmp/metrics-critic-review.md plus exact probe source.
Phase-dependent eligibleDistance loss: fixed by removing phase segmentation entirely.
Four constant-phase circles: now 4 eligible routes, 3 comparisons, repetition=1 at 30/60/120 Hz.
Ineligible offscreen coordinates: valid exclusion/time accounting test passes.
Original critic probe asserts OLD failures; do not expect its unmodified assertions to pass now.
Root should request updated independent review when integration stabilizes.

## Checks

node --test little-mouse/tests/behavior-route-metrics.test.mjs: 13 passed, 0 failed.
Tests cover frame rates, slow/fast/nonuniform timing, phase independence, same-phase loops,
novel geometry, same vertices/endpoints in different order, translation/reversal/rotation/scale,
jitter, short/unfinished routes, gaps/teleports/discontinuities/exclusions, offscreen positions,
invalid finite validation/options, mutable input isolation, exposure accounting, history eviction,
bounded active storage, overflow, snapshot isolation and idempotent finalization.
git diff --check scoped to owned paths: passed. Owning doc: 92 lines.
No full repository suite or integration acceptance claimed; root owns those shared changes.

## Actual-production capacity experiment

/tmp/route-metrics-production-probe.mjs runs actual baseline hunt/group/physics from immutable
/tmp/route-metrics-runtime-3537a0a/little-mouse/public (git archive 3537a0a little-mouse/public).
Each of passive, central-paw, near-misses, tall-phone: seed 11, 360s, two mice at 30/60/120 Hz.
Settings/spawn/seed/scenario inputs follow baseline benchmark; no renderer or cat is involved.
Probe receives every frame and uses center/active/hidden eligibility; it injects no hold/toss/injury events.
Corrected probe eligibility from !m.held to !m.hold and reran the full 12-row probe successfully.
Route counts, censor counts and storage high-water values below are unchanged. These scenarios
do not exercise actual holds; this rerun does not establish production hold/release integration coverage.
/tmp/route-metrics-production-probe-512.json preserves original 512-point findings.
/tmp/route-metrics-production-probe.json contains final 2048-point snapshots and all denominators.

| Hz | eligible routes | comparisons | short | censored | overflow | max points |
| --- | --- | --- | --- | --- | --- | --- |
| 30 | 478 | 470 | 19 | 324 | 0 | 263 |
| 60 | 448 | 440 | 19 | 320 | 0 | 520 |
| 120 | 473 | 465 | 20 | 303 | 0 | 934 |

Final censor reasons: ineligible 320/316/298 and unfinished final 4/4/5 at 30/60/120 Hz.
Eligible seconds: 1754.4 / 1777.1666666666667 / 1781.725 (summed mouse-time across scenarios).
Original cap overflow: 0/1/16 bouts at 30/60/120 Hz. Thus the concern was observed, not hypothetical.
Raising the cap removed overflow in this bounded probe, not a guarantee for arbitrary long paths.
Different production fps produce different trajectories; only synthetic identical-path tests establish
sampling invariance within declared tolerances. Censoring is significant and remains reported.

## Limits / root dependencies

Geometric return is approximate, can split retracing paths, can miss closure between sparse samples,
and cannot detect every loop with a long lead-in that never returns to its bout start.
No rotation/scale invariance or cross-identity history. Normalized axes distort physical aspect ratio.
Noise gate suppresses slow creep below roughly .005 units/s and omits subthreshold residual travel.
Thresholds are authored; no optimization, engagement claim or scientific preference inference.
Root owns index/ledger, hashing, loaded-cache provenance, full integration regression and critic followup.
Root will preserve a portable probe and JSON under docs/evidence/motion-metrics-2026-11-20
and replace temporary references in repository documentation. This worker changed only /tmp
probe/handoff on finalization; the three owned repository files remain stable for final search.
Helper SHA256: 20b7b16d574c329260957861e1425bedb12f19373ec7f599b1053fc385798064.
Tests SHA256: 8639d94aaa938c940df7c65cb7fcf4185ed25a1ab8db963bb177ebc6d6303c10.
