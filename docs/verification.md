# Current verification

Reviewed 2026-11-19. This replaces earlier totals; historical domain evidence remains in
[cycle reports](cycles/README.md).

## Ear variation

Stable per-ear dimensions, tilt and softness now produce larger and mildly lopsided ears,
with occasional folded pinnae. Population, renderer pause/geometry and bounded settling
at 30/60/120 Hz pass. Physical iPad appearance remains pending.

## Local sensory pilot

312 web tests and four catalog eligibility tests pass; catalog freshness and Worker syntax
checks pass. Production build: `eec877e6b147`.
Implemented 15 optional sensory comparisons, recorded repertoire control, bounded local
logging/export and a 77-variable catalog. Browser smoke check confirmed controls, explicit
human trial assignment, confirmed settings and owner-ended stop. The background pane
provided no simulation exposure during that check; it is not motion/audio quality evidence.
Pilot data is explicitly not training-ready; learner and recurring agent analysis remain pending.
This update targets the local browser; hosted publication and iPad acceptance are separate.

## Integrated and checked

- Fixed-target steering reproduction started at 1,000 px/s with destinations 20/60/150/300 px
  ahead: prior loop accumulated 1.77–1.94 turns. Arrival braking/swept stop now reaches
  each without rotating in the same aligned approach at 30/60/120 Hz. New targets resume
  travel; watch clears turn rate; fast free-running distance regression still passes.
  This reproduces an engine cause, not a direct recording of the owner’s observed incident.

- Ambient recorded vocals: one randomized global schedule, native playback rate, quieter
  than contact feedback; held/hidden/injured exclusions and pause reset covered by tests.
  No iPad relaunch for this update: owner is running the reference game for recording.

- Tail turn regression: fast 90-degree running turn at 30/60/120 Hz. Before repair, peak
  lateral tip displacement was 64.6–67.3 model units and frame jumps 28.4–71.9 units.
  After removing constraint-generated velocity and reducing turn forcing, peak is
  23.0–24.1 with frame changes 0.73–2.77; settles below 0.001. Held-tail pin/release
  tests pass. Connected iPad game-route launch succeeded; physical motion review pending.

- Active paw repulsion overrides watch/rest; hunt goals exclude live held areas.
  All-part dragging defeats once after four seconds of actual motion; stationary hold
  remains alive and the paw persists after defeat. Release cannot duplicate the outcome.
- iPad count migration sets two once. Regression checks and browser confirm count 2,
  dragDefeatAfter 4 and ready startup; connected iPad game-route launch succeeded.

- Travel gain defaults to 2.2×; equal-time straight-run regression confirms 2.2× distance
  with unchanged gait cadence and phase. Browser startup reports ready, travelSpeed 2.2
  and unchanged gait cadence cap 4.2. Holds, tosses and simulation time are unaffected.

- Faster active hunt and 30% size migration verified in browser: size 2.86, pace 2.8,
  hide 1, tempo 1.5, run-through 0.6. Later local tuning survives reload.
  Minimal landing copy and high-contrast ink/paper presentation inspected.
  Native code unchanged in this follow-up; earlier native checks remain applicable.

- Podrick’s Violin name, owner-supplied artwork icon and native splash configuration.
- Illustrated parchment landing, one Play entry, collapsed local settings, direct native game.
- Companion/pairing/remote APIs removed; asset version checks remain. Legacy manual mode
  migrates to hunt. No automatic session stop was added.
- Recorded stock/found audio only, native playback rate, silent missing-recording fallback.
  Tap/squeak gain is 0.48; movement uses sparse quiet crawl excerpts. See
  [audio curation report](cycles/podrick-audio.md) for source confidence and mix math.
- Prior deployed release checks: 277 web tests, four native tests, native lint and TypeScript pass.
  Production build `20794f4c1253` and built Worker syntax check pass.
- UI worker inspected desktop/tablet/phone layout, settings, Play, synthetic corner exit,
  Escape and injected failure/Retry. Root inspected final tablet capture and exercised
  integrated Play via DOM click: playing=true, no error; no remote resource requests observed.
  Raw CDP input coordinates did not reliably activate Play in the zoomed pane. These checks
  establish runtime wiring, not physical touch behavior or frame pacing.
- Selected actual captures preserved in [evidence](cycles/evidence/podrick/).

## Native installation and remaining checks

The renamed native binary with icon and splash plugin built, signed and installed on the
connected iPad. Device app inventory confirmed display name Podrick’s Violin, retaining
`com.flyakiet.littlemouse`. Generated Info.plist permits both landscape orientations only.
Final connected-device relaunch succeeded through the development-client URL, followed by
a successful launch of the LAN game route on 2026-11-18. These launch responses establish
that iOS opened the app; physical pixels/audio and the loaded on-device version were not
independently observed. JavaScript is served through the development server and Metro.

Physical speaker listening, native splash appearance, multi-touch feel, sustained rendering,
rotation and the original reported freeze reproduction remain unverified. Four original
recording sources supply 25 active excerpts; some vocal species and crawl-source isolation
remain uncertain. Aliases are not additional recordings. No new audio acquisition or claim
of naturalness follows from waveform checks. No synthesis is used to fill coverage gaps.

## Release

Sites source `dd269eba9505df02afd7d7281953f53b0346e9a1`, build `20794f4c1253`.
Hosted deployment `appgdep_6afe8d90fc6c8191a645eeadadb16f22` succeeded; owner-only access
preserved. Native installation and hosted web deployment are separate. Source changes are
integrated on main; publication is recorded by the corresponding GitHub commit.
