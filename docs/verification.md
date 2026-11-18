# Current verification

Reviewed 2026-11-17 (local time). This record replaces earlier totals; it is not an append-only log.

## Verified in this change

- Game regression suite: 232 tests pass covering behavior, contacts, physics, geometry,
  activity interruption, backgrounds/coats, audio, settings, API and playground time control.
- Native TypeScript and Expo lint pass; 4 tests cover connection validation and recovery checkpoints.
- Integrated continuous limb skin, part-specific drag yielding and lit geometric fur. Root browser
  exercised a fuzzy striped mouse through body drag/release; independent tests cover all paw
  pins, tail fractions, pause, resets, fur roots/UVs, live roughness and resource disposal.
  Fuzziness varies loft/spread independently of length/density. Maximum remains bristly.
- Startup recovery: root browser blocked the game module, retried successfully, started play,
  then induced WebGL context loss and verified Retry with the active checkpoint preserved.
  Worker browser also covered first-preview failure and intentional pause; independent review
  fixed partial-init writes, cleanup errors, duplicate-retry races and late pairing mutations.
- Independent animation audit: 108 seeded drag cases over 35,640 simulation frames; bounded
  contacts, attachments, pause, held collisions and disposal. Exact fractional tail pin regression passes.
- Browser: real owner four-corner gesture opens home; shaders compile without logged errors.
- Browser playground: eight visible models, separate lab settings, frame stepping and all five
  idle activity scenarios; head/body/tail/forepaw/hind-paw drag-to-toss each resolves once.
- Browser audio: all 26 active recordings load without errors. A real first-gesture
  pointerdown plays one recorded floor squeak; quick harmless release does not add
  a second cue or foot layer. Post-master peak 0.0631 establishes output, not hearing.
  Recorded-only tests cover pending contact cancellation, pointer-scoped replacement,
  mute/interruption and missing samples. Candidate hashes/PCM metadata pass.
- Independent audio reviews: pointer-scoped cancellation (61 focused checks plus two-pointer
  reproductions), event/animation integration, interruption, calm/distress mapping,
  source licensing, PCM assets and mix trims. Independent visual review: 30 backgrounds,
  22 coats, four palettes, generated-image provenance and representative rendered contrast.
- Integrated anatomy/texture browser: continuous spine/waist bends and regional textures render
  together with ground marks without logged errors. Focused checks cover legacy identities,
  extreme inverse contacts, held-tail material fractions, attachment roots and stable UVs.
- Reactive environment: 160-mark pool, one additional draw/320 triangles; tests cover actual
  rendered paws, drag, restraint, toss, pause, material switches and disable. Counts match
  at 30/60/120 Hz in the high-speed sampling case. Independent browser review covered
  woodland, linen drag, grass and boards; root confirmed live marks in the integrated build.
  Surface audio uses actual displacement and keeps contact ducking. No physical frame-rate claim.
- Requirements documents satisfy their size caps; local relative links resolve.

## Device and perceptual limits

The app was already installed on the connected iPad. Its saved legacy `sound:false` setting was
identified; a one-time migration was observed as `sound:true` with `audioVersion:1` in app storage.
Later deliberate mute choices are preserved. No physical listening claim follows from this.

The physical iPad was relaunched and reported live play with two mice. Copied app settings
confirm photo-clearing, contrast 0.8, size 2.2, hunt mode, enabled sound/volume 0.7/activity 1.25,
tail sway 1.15, ear and whisker motion 1.2. This verifies saved settings and earlier live telemetry, not pixels or hearing.
The landscape native binary rebuilt, signed, installed and relaunched successfully on the
connected iPad. Its built Info.plist allows only landscape-left/right and requires full screen.
The final game route launch succeeded, but saved room telemetry remains stale; do not treat
it as confirmation that the physical iPad received the latest web build. Physical rotation,
fur appearance and recovery of the owner's original incident remain unverified.

Final iPad visual review, multi-touch feel, all coat/background combinations, eight-mouse frame
pacing, hosted WebView sign-in and physical speaker listening remain owner/device checks.
The colors are options to try with this cat, not established feline preferences.
Rolling is partial side rocking; scratching reaches side/neck within the current limb span.
Three.js remains the renderer; no rigid-body engine dependency was introduced.

## Release boundary

Local development serves current files with version reload. A GitHub push is source publication;
Sites deployment is separate. Use the deployment result for hosted release status. Native shell
changes use the existing development/Expo route and are not a new standalone binary release.

Current hosted release succeeded: build `786aaf102aec`, Sites source `f209b1d`.
The owner-private game and `/playground.html` were deployed together; audience was preserved.
