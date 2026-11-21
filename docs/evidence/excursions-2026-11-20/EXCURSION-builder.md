# excursion-builder handoff

Status: implemented; round-2 continuity repair complete; root-requested final round-3 review pending.
Baseline assigned: 4ba72c4. Shared main worktree, disjoint ownership; no commits, push,
deploy, server restarts, subdelegation, defaults, learning or utility edits performed.

## Owned files

- little-mouse/scripts/behavior-excursions.mjs
- little-mouse/tests/behavior-excursions.test.mjs
- docs/behavior-excursions.md (118 lines)

Early integration contract: /tmp/excursion-api.md. Final contract: owning topic and source.
Export createExcursionTracker(options?), with sample/snapshot/finalize and version 1.
Sample accepts {time,x,y,eligible,visible,discontinuity:false}; labels ignored.
Snapshot contains nested counts, censorReasons, support, history, active, storage, config, version,
finalized and corridorRecurrence. History is complete-only, including short appearances;
short signatures do not participate in corridor comparisons. Finalize cannot force completion.

## Completion semantics

Only continuous eligible invisible → visible → invisible transitions complete an appearance.
First observed onscreen is left-censored, trailing visible is right-censored. Holds, hidden
states, discontinuities, invalid data, gaps and speed jumps censor. Overflow latches until
closure and never manufactures a new completed piece. Pauses/phase changes do not split paths.
Actual normalized coordinates may exceed viewport boundaries and are never clamped.
Geometry runs first-visible to last-visible, including a final sub-noise residual endpoint.
Adjacent invisible centers supply conservative edge labels (unknown/corner explicit), not
exact boundary intersections. Complete duration includes pauses. Equal-arc signatures retain
absolute screen corridors; reverse traversal allowed, no translation/scale/rotation removal.

Memory defaults: 2048 active points, 32 history × 32 signature points, fixed counters/anchors.
Hard storage caps: 4096 points, 128 history, 128 samples/signature. Max path 128 and duration
3600 seconds by default; any overflow censors. Counter saturation at MAX_SAFE_INTEGER.
Multiple censorReasons may describe one censored appearance; their sum is not a denominator.
Root should pool comparison/repeated counts, retain null without support, and report censorship.

## Round-1 P2 repair and checks

Additive snapshot.support contains completed/censored/short/overflow fixed-size buckets.
Each reports appearances, durationSeconds, pathLength, truncatedPathAppearances, saturated.
Short is a completed subset; overflow is a censored subset. Do not add subsets to parents.
Only closure adds support, once, regardless of overlapping censor reasons. Totals survive
history eviction; active appearances await closure/finalize. Observed duration includes
pauses and continued visible observation after overflow. Path freezes at overflow, explicitly
flagged as truncated retained-prefix support; missing distance is unknown, not zero.
Numeric totals saturate at MAX_SAFE_INTEGER with a latched saturated flag. Old fields/API
and bounded history remain intact. No distributions or unbounded population logs added.
Also fixed a timestamp edge: a visible discontinuity clears the entry anchor but retains an
active run; subsequent backward time now rejects against that run's last timestamp, preventing
negative population duration. Added regression coverage for that exact case.

`node --test little-mouse/tests/behavior-excursions.test.mjs little-mouse/tests/behavior-route-metrics.test.mjs little-mouse/tests/behavior-visibility.test.mjs little-mouse/tests/behavior-benchmark.test.mjs`
passes all 51 tests (15 excursion tests). New cases cover cumulative complete/short/censored
support despite eviction, detached snapshots/idempotence, all overflow caps with long paths,
invalid-gap exclusion and backward time following a discontinuity. Test log:
/tmp/excursion-builder-round2-tests.txt. Syntax and git diff --check pass.
No existing route-helper edits. Root-owned benchmark tests executed, not modified.

## Root integration / limitations

Supply actual post-physics x/width,y/height and neutral-core fraction > 0. Eligibility must
exclude inactive/hidden/held/toss/injury/manual control independently of viewport. Invalid
visibility must invalidate the sample, not become false visibility. Mark identity/viewport,
release/reset/relocation boundaries. Use fresh trackers on identity/viewport change to reset
history. Slow unmarked relocations are not detectable; speed guard is only a heuristic.
Root owns docs index and worker ledger; not edited by this worker because ownership is tight.
Shared edits observed in docs/workers.md, behavior-benchmark.mjs and its test; untouched.
Root must aggregate the new support buckets across trackers to expose full-panel time/path
support; the builder did not edit aggregation. No updated production panel measured here. Root must
verify wiring and comparative support before claiming the previous 41.4% censoring concern
is resolved. No deployment, device, exact visibility boundary or efficacy claim.

## Round-2 guard repair for final review

Visible discontinuities retain an active last sample but deliberately clear outside entry
history. All monotonic/gap/speed guards now use the same previous-or-active-last anchor;
entry witnessing still requires the separate trusted previous invisible sample. A subsequent
100-second gap or 9.8-unit teleport closes/restarts left-censored segments, adds the proper
reason and contributes zero duration/path across the invalid interval. Ordinary continuous
movement remains measured; it never becomes a witnessed entry.

Preserved pre-repair helper: /tmp/excursion-builder-before-round3.mjs.
Preserved critic evidence: /tmp/excursion-builder-round2-critic-evidence.md.
Before/after both repros: /tmp/excursion-builder-round3-guard-evidence.json.
Two new regression tests plus existing suites: 53 tests pass, log
/tmp/excursion-builder-round3-tests.txt. Initial shared-run source-change rejection retained
in /tmp/excursion-builder-round3-shared-runtime-change.txt; fresh run passed after root's
candidate2 edit settled. Syntax and whitespace checks pass; owning topic is 118 lines.
Final helper SHA256: 0f8104934e85f539723b346c161beaaed9ed1b4a55dcbfce4b0b30a18062f0e0.
No root production/integration/test files were edited by this worker. New disjoint collision
regression ownership/result is documented in /tmp/EXCURSION-recovery-tests.md.
