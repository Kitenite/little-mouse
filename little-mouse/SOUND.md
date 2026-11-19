# Recorded sound for Podrick’s Violin

No artificial sound: only attributed real recordings, always at native playback rate 1.
No synthesized tones, noise, generated primer or fallback; unavailable recordings stay silent.
Gain, fades and soft limiting are allowed for mixing. No pitch shifting or randomized rate.

The current policy and implementation contract are maintained in [Audio](../docs/audio.md).
The source audit, provisional crawl decision and listening limits are in
[Sound curation](../docs/sound-curation.md). See those owning topics for current routing.

25 active excerpts come from four CC0 originals: floor squeaks (4), uncertain trapped
mouse/rat vocals (12), pet-mouse cracker eating (6), and kitchen crawl/scratch texture (3).
25 bank names are contextual/audition aliases, not 25 recordings. Paper, rat and hamster
assets remain archived only. Automatic idle/hidden/social foley is removed.

Primary URLs, uploader descriptions, licenses, cut times, processing and hashes are in
[ATTRIBUTION.json](public/assets/audio/ATTRIBUTION.json) and
[CURATION.json](public/assets/audio/CURATION.json). Existing assets are filtered/faded
mono 22.05 kHz PCM16 excerpts from public HQ previews; no ultrasound is reproduced.
Crawl was previously withheld for quietness/noise risk and remains pending listening.
Its low runtime level is intentional, not proof of clean source audio or authentic footsteps.

Tap gain rises from 0.20 to 0.48; generic squeak 0.28 to 0.48. Release/held feedback now
uses floor vocals. Movement is quieter and at least 2.4 seconds apart, with no step loop.
Direct touches retain priority, quick-release deduplication and cancellation ownership.
At most three voices overlap. A range-2 limiter accommodates their conservative peak sum
without hard input clipping; static output is below 0.85. Browser true peaks and physical
speaker quality have not been measured in this worker pass.

Local gestures activate audio; local test works while paused, respecting mute/zero volume.
Saved volume, activity and explicit version-1 mute remain unchanged by the relative mix upgrade.
Run `node --test tests/audio.test.mjs tests/audio-curation.test.mjs tests/settings.test.mjs`.
Bounded results and exact handoff are in [the cycle report](../docs/cycles/podrick-audio.md).
No actual listening, device verification or deployment is claimed.
