# Bounded local behavior learning

Status: **context-isolated learning integrated; automated checks pass; device/cat validation pending**.
Sources: `play-learning.js`, runtime/controls adapters and game wiring; tests cover attribution/persistence.
This is a conservative contact-presence heuristic, not a trained preference or enjoyment model.

## Owner flow

Settings → Play learning selects Player unknown, My cat or Human testing, plus Adapt slowly
or Fixed policy. Default is unknown: movement metrics are descriptive and cannot train the
heuristic. Exit normally to finish a session; background/reload/recovery/settings changes
leave it incomplete. Export/Copy play data and Reset learning remain local owner controls.
The game never ends itself. No new control appears on the play surface.

The runtime records actual center-in-viewport exposure, excluding held/airborne intervals and
both endpoints of release. This conservative approximation misses partially visible bodies.
Corner-origin gestures are excluded. Pointerup classifies tap versus configured hold duration
or more than eight pixels of accumulated drag; moves and cancelled claims never become taps.
The mixed opening is outside the six learned chapters. Chapter changes do not rewrite existing routes.

## Eligibility and policy

Actor defaults to unknown. The owner can persist cat/human/test/unknown via `configure({actor})`.
`start` snapshots that preference; changing actor during play excludes that whole session.
Only explicitly cat-attributed, completed sessions qualify. Interrupted, experimental, manually
controlled and freeze-spanning sessions remain descriptive records but never provide support.
Exclusion is sticky through the session. Starting a new session cannot silently finish an existing one.
Only explicit owner session end uses `end({complete:true})`; default completion is false.
Crash/reload cannot recover an unfinished session as completed.

Each chapter requires at least three distinct completed sessions in the exact same valid context,
each with at least 30 visible
mouse-seconds of exposure. Two visible mice contribute two mouse-seconds per elapsed second.
A session supplies at most one binary cat-tap-presence observation per chapter. Hundreds of taps
or repeated chapter visits never become hundreds of trials. Holds, drags, cancellations and
unknown/human/test contacts do not provide positive evidence. Injury is not an input or reward.

For n supported sessions and k containing a finalized cat tap, multiplier is
`1 + 0.15 * (2*k - n) / (n + 6)`. Six symmetric prior sessions shrink toward the default.
Below three supported sessions or when frozen, multiplier is exactly one. The range stays within
0.85–1.15. No-tap means only no recorded qualifying tap, never disinterest or absence of enjoyment.
This heuristic is an authored design inference without efficacy validation or causal identification.

Root snapshots multipliers at play start and applies them only to newly selected chapter durations,
clamping final durations to 30–65 seconds. Preserve the shuffled all-six deck and mixed opening.
The module imports the six IDs from `hunt-chapters.js`; it cannot choose or remove chapters.
No automatic session stop, upload, autonomous injury adjustment or agent-generated policy exists here.

## Metrics and API
`createPlayLearning(storage)` accepts a localStorage-like object; unavailable storage is nonfatal.
Methods: `start`, `end`, `sample`, `contact`, `decision`, `configure`, `status`, `export`, `reset`.

- `configure({context})` sets an in-memory default; `start({...,context})` snapshots an explicit
  context or that default. `status({context})` queries without mutation; plain `status()` uses the
  configured default, else active context. Root must supply current context after launch/reset.
- Context requires bounded nonblank `policyVersion` and `build` IDs, all validated `settingsSchema`
  settings, and `device:{platform,width,height,pixelRatio}`. Sorted setting keys and lowercase colors
  canonicalize order; full sanitized snapshots remain on exported records for audit.
- Platform is trimmed/lowercased: web/ios/android/macos/windows/linux/unknown. Arena width/height
  are 1–32768 logical pixels rounded to integers; pixel ratio is .1–16 rounded to .001. No navigator
  data or hardware identifiers. Coarse device context does not identify an individual device.
- Missing/invalid context yields null, zero support and fixed default multipliers; unknown extra
  properties are stripped. Any context change via configure permanently excludes an active session.
  Root must signal settings/build/device changes; a status query alone does not alter attribution.

- `sample({mouseId,chapterId,time,x,y,heading,visible,routeId,routeInstanceId,discontinuity})`
  uses simulation seconds, normalized arena coordinates 0–1 and radians. Supply actual positions.
- Integrate actual successive Euclidean displacement and absolute wrapped heading delta / 2π.
  Eligible visible time requires both endpoints visible and neither endpoint discontinuous. Hidden
  transitions, gaps over one second, chapter switches and discontinuities break travel and eligible exposure, including release intervals.
- Elapsed time sums sampled mouse intervals, including hidden time; it is not wall-clock session time.
  Duplicate/backwards timestamps contribute nothing. Coordinate bounds and numbers are validated.
- Route signatures describe motifs/quantized geometry. An optional execution ID is authoritative:
  geometry changes within one execution do not add entries. Repeated signatures in new executions
  count repetitions across mice within the same chapter/session. Without execution IDs, signature
  changes or reappearance identify entries. Repetition memory is separate from policy evidence.
- `contact({id,chapterId,actor,kind})` accepts finalized tap/hold/drag/cancel episodes once each.
  Never submit pointerdown as a tap. Missing contact actor stays unknown even in a cat session.
- `decision({chapterId,time,baseDuration,multiplier,duration})` records applied boundary choices.
  Export includes per-record `metricVersion`, `heuristicVersion` and context. Decisions are descriptive.
- `status()` includes per-chapter support, multipliers, active metrics and aggregate descriptive
  metrics, including visible/elapsed fraction, distance and rotations per visible second, and
  repetition/entry fraction. Undefined denominators produce null. Aggregate metrics include
  excluded sessions; only `support` filters eligibility. Returned objects are detached copies.

## Bounds, persistence and controls

Retain at most 32 completed/interrupted records, eight sampled mouse IDs per active session,
64 route signatures, 512 contact IDs, 128 decision records and 96 characters per input ID.
Counters saturate at one million. Memory does not grow with frame count; there are no frame logs.
At the route-signature limit, untracked signatures are ignored rather than labeled novel/repeated.
At contact/decision/mouse limits, new entries are rejected. Sampling itself never ends play.
Persistence prunes oldest sessions to fit 500,000 serialized characters (UTF-16 code units).
Status/export report cumulative `droppedSessions` and `droppedDecisions`; reset clears these counts.
Support rolls with retention. Duplicate session IDs are rejected within retained history;
callers must generate globally unique session IDs because evicted IDs cannot be remembered forever.

Persist only on end/configure/reset, never every frame. Active sessions are not persisted/exported;
crashes lose their observations without inventing completion. Context-only configure does not write.
Export schema v2 uses the existing storage key. V1 records retain metrics/decisions and their old
heuristic version, with null context: descriptive only, never retroactively eligible. Restore
revalidates snapshots; invalid context preserves metrics with null context. Current context is not
persisted as a preference. Restore validates versions, actors, booleans, counters, decisions and
unique session IDs before projecting known fields. Invalid payloads yield empty safe defaults.
Storage failures appear in status; absent storage reports `storageMode: memory-only`. This is local integrity checking, not tamper-proof attestation.

`configure({frozen:true})` gives fixed-policy multipliers of one and excludes the active session.
Unfreeze affects future eligible sessions. `reset()` clears history and active metrics, restores
unknown actor and unfreezes; it does not stop gameplay. `export()` returns local JSON only and explicitly declares `trainingReady:false`.

## Limits and acceptance

The module cannot infer gaze, enjoyment, actor identity, independent days, injury or teleports.
Root must supply visibility/discontinuities and exclude manual/pilot sessions. Exposure and contact classification need physical-device observation before efficacy claims.
Sparse endpoint heading sampling can alias full rotations; gaps over one second are censored.
Provenance includes policy/build IDs, full settings, coarse device context and bounded decisions.
Same-context support prevents known configuration pooling; it does not identify the cat, establish
causality or make export the planned full research data contract or an OPE dataset.
Tests cover support, same-session duplication, actor exclusions, holds, metrics, corrupt restore,
context isolation/migration, freeze/reset, persistence cadence and bounded retention. Device and prospective cat evaluation remain pending.
