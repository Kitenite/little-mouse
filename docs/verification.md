# Current verification

Reviewed 2026-11-18. This replaces earlier totals; historical domain evidence remains in
[cycle reports](cycles/README.md).

## Integrated and checked

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
- Root combined checks: 273 web tests, four native tests, native lint and TypeScript pass.
  Production build `b382ef7b060b` and built Worker syntax check pass.
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

Sites source `1452005fcccca037f40975736a33372d08a2e0e8`, build `b382ef7b060b`.
Hosted deployment `appgdep_6afe8aaa33488191a89a555e5c73f6d0` succeeded; owner-only access
preserved. Native installation and hosted web deployment are separate. Source changes are
integrated on main; publication is recorded by the corresponding GitHub commit.
