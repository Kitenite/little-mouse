# Actual entry-to-exit excursions

Owner: excursion helper/tests; root owns benchmark integration, index and worker ledger.
Status: **implemented; round-2 support repair implemented; final review pending**.
Sources: `little-mouse/scripts/behavior-excursions.mjs` and corresponding test module.
This complements [completed route bouts](behavior-route-metrics.md), whose viewport-loss
censoring excludes many paths. It does not relabel those old bouts or alter that helper.
No production defaults, utility, learning, runtime behavior or automatic session-stop changes.

## Sampling contract

Create `createExcursionTracker(options?)` per identity, viewport, scenario and seed.
Call `sample({time,x,y,eligible,visible,discontinuity:false})` after actual physics.
Time is simulation seconds, finite in [0,1e12]. Coordinates are finite centers divided by
viewport width/height, including outside [0,1]; never clamp positions to viewport edges.
`eligible` and `visible` are required booleans. Root supplies eligibility independent of
viewport: active, nonhidden, no hold/toss/injury/manual control. Visibility is valid neutral
core fraction > 0 from [body visibility](behavior-visibility.md); invalid visibility must
invalidate the input, not silently become invisible. Labels and phase are ignored.

Explicit discontinuity marks identity replacement, viewport changes, reset, release and
known relocation. Restart the tracker for identity/viewport boundaries so history does not
compare different populations. A discontinuity sample cannot witness a new entry.
A visible discontinuity retains its last sample for time/gap/speed guards, so the next
interval cannot bridge an unobserved gap or teleport into censored population support.
Unknown slower teleports cannot be detected automatically; root must mark them.
Default continuity guards reject gaps > .25 seconds and endpoint speed > 8 normalized
units/second. Invalid inputs, duplicate/backward timestamps and exclusions break continuity.
Nonmonotonic/invalid inputs clear the previous anchor; a later sample starts fresh.
Input primitives are copied. Caller mutation cannot rewrite retained geometry.

## Appearance boundaries and censoring

A complete appearance requires witnessed continuous eligible invisible → visible entry,
then visible → invisible exit. First observed onscreen is **left censored**, even if its
later exit is natural. Finalization of an active appearance is **right censored**.
Hidden, held, teleported, invalid or discontinuous disappearance is never a natural exit.
Release onscreen starts a left-censored appearance; it cannot inherit an earlier entry.
Pauses, loop returns and phase changes do not split a whole appearance.

Geometry spans the first visible center to the last visible center, omitting the adjacent
invisible segments. Duration uses those same timestamps, including pauses. Boundary times
and coordinates are sampled approximations, not exact intersections. Entry/exit edge labels
use the adjacent invisible centers: left/right/top/bottom, corner for two outside axes,
or unknown if neither axis is outside. Body visibility can change without a center crossing.
No claim is made that these labels recover the body's exact entry/exit boundary.

Movement advances an anchor only after .002 normalized displacement by default, suppressing
bounded jitter. Close adds the final visible residual so the signature ends at the observed
last-visible point. Thus a stationary appearance can retain a tiny terminal residual;
subthreshold intermediate bends are omitted. Positions are never clamped or recentered.

## Results and support

`sample()` returns true for valid increasing samples, false for invalid/nonmonotonic input.
`snapshot()` returns detached `version`, `config`, `counts`, `censorReasons`, `history`,
`active`, `finalized`, `storage`, `support` and `corridorRecurrence`. Active runs remain unclassified.
`finalize()` censors any trailing appearance and returns a snapshot; it is idempotent.
No argument can mark an unfinished appearance complete. Sampling after finalization throws.

- `appearances`: all observed eligible visible runs, including censored starts.
- `witnessedEntries` / `naturalExits`: observed continuous transitions, not completion counts.
- `completedAppearances` / `censoredAppearances`: disjoint closed populations.
- `shortAppearances`: complete paths < .06 length or zero duration; subset of completed.
- `comparisonAppearances`: nonshort complete paths with prior nonshort retained support.
- `repeatedCorridors`: compared paths matching at least one retained prior path.
- `corridorRecurrence`: repeatedCorridors / comparisonAppearances; null without support.
- `censorReasons`: leftCensored, rightCensored, ineligible, discontinuity, invalid,
  nonMonotonic, gap, teleport, overflow. Multiple reasons may describe one appearance.
- Sample validity counts, historyEvictions and storage high-water expose data quality/caps.

Each complete appearance, including short ones, retains duration, pathLength, start/end time,
entryEdge, exitEdge, edgePair and 32 uniformly spaced arc signature points by default.
History also records `short`, `comparisonSupport` and `repeatedCorridor` at admission time.
Only nonshort complete appearances participate in recurrence; no censored geometry is compared.
Corridors preserve absolute screen location and allow forward/reversed traversal; match needs
RMS ≤ .025 and maximum distance ≤ .06. No rotation, scaling or translation normalization.
Root must pool counts before forming fractions and report censor/short populations alongside
recurrence. Low recurrence is not evidence of preference, enjoyment or novelty to a cat.

## Cumulative population support

`support.completed` and `support.censored` retain fixed-size cumulative totals independent of
history eviction. `support.short` is a completed subset; `support.overflow` a censored subset.
Never add subsets to their parents. Each bucket has `appearances`, `durationSeconds`,
`pathLength`, `truncatedPathAppearances` and `saturated`. Only closure updates these totals;
active runs are excluded until closed/finalized, and repeated finalization adds nothing.
Duration spans observed first/last visible samples, including pauses and time after overflow.
It excludes invisible boundary intervals, invalid gaps and unobserved portions of censored runs.
Path length uses the same noise filter and terminal residual as signatures. At any overflow,
it freezes at the retained prefix; `truncatedPathAppearances` marks that omitted distance is
unknown, not zero. Even a duration-cap overflow marks path support truncated. Censored path
sums containing overflow are partial observed-distance support, not whole-path totals.
Each numeric total saturates at MAX_SAFE_INTEGER; `saturated` latches if any total exceeds it.
These totals permit population time/path comparisons, not whole-panel distributions or
unbiased trajectory estimates. History remains a bounded recent sample, never the full panel.

## Bounds and verification

Default active cap: 2048 points, length 128 normalized units, duration 3600 seconds.
Any cap overflow latches censorship until the appearance closes; never split it into
apparently complete subpaths. Geometry stops growing while its last visible time/point update.
History defaults to 32 complete appearances; evict oldest on overflow. Hard option bounds:
4096 active points, 128 history appearances and 128 signature points. Counters saturate at
MAX_SAFE_INTEGER; inputs/options are validated. Storage does not grow with frames or pauses.
Other options: noiseDistance, maxGap, maxSpeed, minPathLength, maxPathLength, maxDuration,
maxPoints, historySize, signaturePoints, corridorRms, corridorMax. All must be positive finite
numbers ≤ 1e6; storage sizes are integers. These are authored engineering thresholds.

Run `node --test little-mouse/tests/behavior-excursions.test.mjs` from repository root.
Coverage includes natural crossings, start/trailing censoring, holds/release/replacement,
teleports, pauses/labels, invalids, unknown/corner edges, jitter, 30/60/120 Hz, caps, eviction,
cumulative population/short support, truncation, detached snapshots and idempotent closure.
Arc resampling reduces frame-density effects but cannot recover unsampled bends or visibility
transitions. Independent axis normalization distorts aspect ratio; compare like viewports.
Root integration must verify real post-physics/visibility/reset wiring and quantify how the
censoring population differs from old completed bouts. No production panel, deployment,
rendered visibility, device quality or scientifically validated efficacy is claimed here.
