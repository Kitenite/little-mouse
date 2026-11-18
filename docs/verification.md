# Current verification

Reviewed 2026-11-17 (local time). This record replaces earlier totals; it is not an append-only log.

## Verified in this change

- Game regression suite: 157 passing tests covering behavior, contacts, physics, geometry,
  activity interruption, backgrounds/coats, audio, settings, API and playground time control.
- Native wrapper: two connection tests, TypeScript check and Expo lint pass.
- Independent animation audit: 108 seeded drag cases over 35,640 simulation frames; bounded
  contacts, attachments, pause, held collisions and disposal. Exact fractional tail pin regression passes.
- Browser: real owner four-corner gesture opens home; shaders compile without logged errors.
- Browser playground: eight visible models, separate lab settings, frame stepping and all five
  idle activity scenarios; head/body/tail/forepaw/hind-paw drag-to-toss each resolves once.
- Browser audio: all 30 recordings load without sample errors; local Test sound and grooming
  audition produce post-master signal. This establishes generated output, not physical hearing.
- Independent audio reviews: event/animation integration, interruption, calm/distress mapping,
  source licensing, PCM assets and mix trims. Independent visual review: 30 backgrounds,
  22 coats, four palettes, generated-image provenance and representative rendered contrast.
- Requirements documents satisfy their size caps; local relative links resolve.

## Device and perceptual limits

The app was already installed on the connected iPad. Its saved legacy `sound:false` setting was
identified; a one-time migration was observed as `sound:true` with `audioVersion:1` in app storage.
Later deliberate mute choices are preserved. No physical listening claim follows from this.

Final iPad visual review, multi-touch feel, all coat/background combinations, eight-mouse frame
pacing, hosted WebView sign-in and physical speaker listening remain owner/device checks.
The colors are options to try with this cat, not established feline preferences.
Rolling is partial side rocking; scratching reaches side/neck within the current limb span.
Three.js remains the renderer; no rigid-body engine dependency was introduced.

## Release boundary

Local development serves current files with version reload. A GitHub push is source publication;
Sites deployment is separate. Use the deployment result for hosted release status. Native shell
changes use the existing development/Expo route and are not a new standalone binary release.

Current hosted release succeeded: build `a343005e7fbe`, Sites source `2c20ca1`.
The owner-private game and `/playground.html` were deployed together; audience was preserved.
