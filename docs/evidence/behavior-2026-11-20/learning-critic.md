# Independent learning critic

Read-only source review of play-learning-runtime.js, game.js, play-learning-controls.js, play-learning.js, chapter application and owner-gesture flow. No repository edits. Actor/decision handoff read at local-learning.md; both attribution repairs independently verified. Later storage/export hardening is still being finalized by the worker and is outside the verified snapshot below.

Two reproducible findings were repaired by their owners during review:
- Discontinuity baseline: samples at x=.1, held x=.5, free x=.9 previously added .4 path distance. Desired zero requires both endpoints to be continuous. Learner now retains/checks previous discontinuity.
- Anonymous identity: two different objects without castIndex/identity/seed previously shared "undefined" and added .8 false path distance. Runtime now uses a WeakMap identity fallback.

Concrete executable regression/control cases: learning-attribution.mjs. Assertions now require zero motion for both repaired cases, not the former buggy values. Also covers interrupted/experiment/manual/unknown-player exclusion, finalized hold/drag/cancel attribution and same-execution target/visibility changes versus genuine repeated execution.

Remaining limitations, not newly discovered blockers:
- Settings/build/device provenance is not stored with learner session summaries. Cross-session support can pool different owner configurations; exports cannot establish which settings caused differences. Decision records audit chapter durations only. Treat as a descriptive bounded heuristic; attach configuration/build/device snapshots to any comparative analysis.
- Actor is an explicit durable owner declaration, not detected cat identity or attention. Selecting My cat does not identify which of multiple cats played. Unknown actor remains excluded; human/test actor API values remain distinct. No enjoyment or individual-cat preference claim is established.
- Fixed/adapt is applied to the director snapshot at new play, per the agreed integration contract. Current live chapter does not retroactively change.

Owner corners are excluded before learning.down; pointer completion/cancel and teardown prevent pending downs becoming cat taps. Settings changes and blur/resize/background/recovery end incomplete. Trial/manual starts exclude the session. No missing in-progress actor/decision API reported.

## Verification result

57/57 pass on the repaired source:
`node --test learning-attribution.mjs little-mouse/tests/play-learning.test.mjs little-mouse/tests/play-learning-runtime.test.mjs little-mouse/tests/hunt-chapters.test.mjs little-mouse/tests/owner-gesture.test.mjs little-mouse/tests/enrichment.test.mjs`

Release case now yields pathDistance=0 and visibleSeconds=0; anonymous replacement yields pathDistance=0. The 29 game integration tests include full owner-corner exclusion, cancelled grabs, sensory comparisons and graphics recovery. The two injected audio-cleanup error messages are expected recovery-test diagnostics; suite exit status is zero.

No remaining demonstrated attribution blocker in this reviewed flow. The provenance/identity limitations above remain. Physical-device and comparative cat validation were not performed. No source edits, commits or pushes by this critic.
