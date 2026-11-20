# Executed route diagnostics

Owner: route-metrics helper; root owns benchmark integration, index and worker ledger.
Status: **implemented and integrated as diagnostics; independently reviewed with limits**.
Sources: `little-mouse/scripts/behavior-route-metrics.mjs` and corresponding test module.
This is a bounded engineering diagnostic, not feline preference, engagement or learning reward.
No production behavior, utility, policy adaptation or automatic session-stop changes.

## Inputs and continuity

Create one `createRouteMetricsTracker(options?)` per mouse, scenario and seed.
Call `sample({time,x,y,phase,eligible,discontinuity:false})` after physics with actual centers.
Time is simulation seconds (finite, 0–1e12); x/y divide by viewport width/height respectively.
Phase is a required nonblank string of at most 96 characters, validated but otherwise ignored.
Phase labels, goals, plans and execution IDs cannot change distance, segmentation or comparison.
Root supplies eligibility: active, nonhidden, center in viewport, no hold/toss/injury/manual control.
Ineligible finite coordinates may be outside [0,1]; eligible coordinates must be inside.
Never clamp offscreen positions into a border corridor. Both endpoints must be eligible.
Discontinuity marks reset, identity replacement, resize, release or known relocation; both
adjacent intervals are excluded. Restart tracker/history for a new mouse identity.
Gaps over .25 seconds and endpoint speed over 8 normalized units/second censor continuity.
These are engineering thresholds; a slower teleport still needs an explicit marker.
Invalid samples and duplicate/backward timestamps censor the active bout and clear anchors.
Invalid/nonmonotonic intervals have unknown duration and do not enter elapsed-time totals.
Samples are copied as primitives; input mutation after sampling cannot rewrite history.

## Geometric bouts and repetition

Movement advances an anchor only when displacement reaches .002 normalized units.
Smaller bounded jitter cannot accumulate per-frame distance. Residual movement below this
threshold is omitted. Very slow travel below roughly .002/.4 units per second may look idle.
A .4-second pause closes a bout; stationary time by itself creates no bout.
A return within .015 of the bout start closes it after at least .12 arc length and .06
maximum excursion from the start. This detects repeated loops within a constant phase.
Adjacent closed bouts share only their boundary endpoint, avoiding overlapping-window credit.
Return splitting is a sampled near-return heuristic: retracing may count, sparse samples may
miss a small closure region, and loops with a long lead-in may not return to the bout start.
There is no claim of exhaustive cycle detection or psychological novelty. An independent probe
found that widening closure distance to .03 made ten identical circles score repetition zero
at 60/120 Hz but one at 30 Hz; default .015 passed those cases. Closed-loop signatures are not
cyclic-origin invariant. Threshold changes require fresh sensitivity review, never blind tuning.
A completed bout needs .06 arc length and .001 seconds to enter history; shorter bouts are counted.

Each bout is resampled to 32 equally spaced arc-length points, removing timing/dwell weighting.
Compare against the preceding 32 eligible bouts of this mouse; evict the oldest on overflow.
Corridor comparison preserves absolute normalized screen location and point order.
Shape comparison subtracts each signature's mean location, allowing translation only.
Both comparisons allow reverse traversal. Neither removes rotation or scale.
A match needs RMS point distance ≤.025 and maximum point distance ≤.06 in either direction.
Aspect ratio is intentionally distorted by independent x/y normalization; compare like viewports.
A shifted corridor can repeat a shape without repeating a screen corridor. The same endpoints
or occupied cells do not imply equal ordered geometry. Thresholds are authored, not fitted.
Arc resampling reduces sampling-rate sensitivity but cannot recover unsampled bends or loops.

## API, denominators and bounds

`sample` returns true for accepted timestamps, false for invalid/nonmonotonic samples.
`snapshot()` returns detached counters/config/fractions/storage without closing an active bout.
`finalize({complete:false})` censors an unfinished trailing bout and returns a snapshot.
Use `complete:true` only when the last sample represents an actual completed bout.
Finalize is idempotent; sampling after it throws. No geometry/frame logs are exported.

- `eligibleRoutes`: completed, long-enough, uncensored bouts admitted to history.
- `comparisonRoutes`: eligible bouts with at least one preceding eligible history entry.
- `repeatedCorridorRoutes` / `repeatedShapeRoutes`: bouts matching any retained prior bout.
- `corridorRepetition` / `shapeRepetition`: corresponding count / comparisonRoutes, else null.
- `completedRoutes = eligibleRoutes + shortRoutes`; censoredRoutes are separate.
- `closures`: loop, idle, finalize, ineligible, discontinuity, gap, teleport, invalid,
  nonMonotonic or overflow. Overflow takes precedence when a capped bout eventually closes.
- `observedIntervals/Seconds`: valid strictly increasing adjacent timestamps, including exclusions.
- `eligibleIntervals/Seconds`: intervals with both endpoints eligible and continuous.
- `censoredIntervals/Seconds`: observed minus eligible; `intervalReasons` assigns one reason.
- `eligibleDistance`: noise-gated executed travel on eligible intervals, including portions of
  bouts later censored. It is support, not a sum limited to classified routes or raw jitter distance.
- Sample counts, historyEvictions and storage/high-water values expose rejected data and capacity.

Root must sum numerators/denominators before computing pooled fractions; null is no evidence.
Snapshots omit active bout classifications until closure; root should finalize at observation end.
Default memory is at most 2048 active points, 32 signatures × 32 points × two representations,
plus fixed counters and anchors; no storage grows with frame count. Options enforce hard bounds
of 4096 active points, 128 history routes and 128 samples/signature. Counters saturate at MAX_SAFE_INTEGER.
An overflowing bout remains tracked as censored until closure, never silently becomes novelty.
The cap was raised from 512 after an immutable baseline probe exposed more overflow at 120 Hz.
The 2048 cap remains finite and can still censor unusually long continuous movement.

## Evidence and limits

Focused tests cover frame rates/speeds, label independence, constant-phase loops, different
ordered paths, translated/reversed/rotated/scaled paths, stationary jitter, exclusion boundaries,
offscreen samples, invalid numbers/options, short/unfinished bouts, eviction and storage bounds.
Production counts and probes are preserved in [batch evidence](evidence/motion-metrics-2026-11-20/README.md).
The production probe uses an immutable archive of baseline 3537a0a with actual hunt/physics;
scenario divergence across frame rates is not a controlled identical-path comparison.
Root owns independent review, source provenance and unchanged legacy scoring verification.
No deployment, device quality, cat preference or scientifically validated efficacy is claimed.
