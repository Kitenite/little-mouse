# Audio requirements

## Owner policy

No artificial sounds. Use stock or found real recordings with primary-source attribution.
Every cue, including squeaks and movement, plays at native recorded pitch/timing (rate 1).
No oscillators, generated noise, synthetic fallback, pitch shifts or randomized playback rate.
Gain, trims, fades and limiting for mixing are allowed. When suitable recordings are absent,
remain silent. Never label imitation, toy squeaks or synthetic effects as actual mice.
Use quiet intervals; avoid rhythmic footsteps, constant background beds and sound during pause.
The base game uses local activation, mute, volume/activity controls and a local test sound.
A confirmed touch uses a recorded vocal when enabled, loaded and playback is permitted;
this feedback adds no damage. Mute, zero volume, pause and background state are authoritative.

## Implemented routing and mix

25 runtime excerpts come from four originals: floor squeaks (4), uncertain trapped mouse/rat
vocals (12), pet-mouse cracker eating (6), and kitchen crawl (3). Paper, confirmed rat and
hamster assets remain archived with attribution but are absent from playback and preload.
The 25 named banks are contextual/audition aliases, not distinct recordings or performances.
Selection cycles loaded excerpts and avoids immediate cross-bank repetition when possible.
The Sound variety control defaults to varied; focused limits each cue to a stable two-clip
subset where available. Both modes avoid immediate repeats and retain native playback rate.
Successful playback exposes clip, cue, gain and audio-clock metadata to local pilot logging.
This establishes scheduling, not physical audibility.
Missing/failed clips stay silent; there is no generated primer or fallback.

Tap and release use floor vocals. Injury uses uncertain mouse/rat and floor vocals.
Tap gain is 0.48 (was 0.20); squeak 0.48 (0.28); hit 0.48 (0.38); hurt 0.48 (0.32).
These are +7.60, +4.68, +2.03 and +3.52 dB respectively before limiting.
Held/dragged mice receive the normal down squeak; after three seconds, a visible sustained
hold can produce a floor vocal at gain 0.40, recurring every 4–7 seconds. It cannot steal
priority from direct contacts. Hold vocals also duck movement/ambience through their duration
or at least 450 ms. No hold cue survives hiding, mouse removal, cancellation, pause or mute.
Release/toss is vocal, replacing the former paper release. Quick harmless releases within
450 ms consume the down feedback instead of producing a duplicate.

Movement uses very quiet crawl cuts at gains 0.018 patter, 0.022 retreat/drag-loop.
No runtime friction normalization or pitch processing is applied. The source was previously
held out for quietness/noise risk and absent listening; promotion is provisional, not timbre
approval. Even at maximum volume, prepared crawl gain × movement gain × jitter × master is
at most 1.331 before surface attenuation; default material/strength makes it lower still.
Low playback level cannot improve the source signal/noise ratio. Prefer omission to boosting it.
Occasional ambient recorded squeaks now play for visible, unheld, uninjured mice.
A single global schedule uses an initial 2–5 s delay and randomized 5–11 s gaps divided
by sound activity (default 1.25); ambient gain is 65% of the vocal bank. Busy voices
skip that opportunity. Hiding/holding cancels the ambient voice; pause resets the timer.
No hidden/social/phase-change foley or phantom footsteps at rest.
Visible safe nibble/groom/scratch/stretch/roll poses retain short recorded activity cues.
Crawl is a texture substitute for non-eating poses, not verified recordings of those activities.

Surface phrases require actual observed displacement: at least 8 px above 12 px/s, with
2.4 s minimum spacing and `(3 + random*3)/soundFrequency` seconds between phrases.
At the game activity default 1.25 this is 2.4–4.8 s; no paw-step synchronization or looping.
Stationary struggle, teleports, resize and discontinuous frames cannot trigger surface audio.
Stopping, material changes, zero environment strength, pause and mute cancel surface voices.
`environmentStrength` defaults to 0.55; material factors remain 1 soft, 0.65 earth, 0.08 hard.
These are mixing choices, not physical-material recording claims.

## Activation, priorities and output

A local gesture requests browser resume synchronously. First contacts can queue at most ten
recorded cues for 800 ms while activation/loading finishes. Late, canceled, hidden, paused,
muted or zero-volume contacts cannot replay. Failed downloads retry on a later local gesture
with a one-second backoff; successful buffers remain loaded and concurrent retries coalesce.
Direct contact stops lower-priority voices, suppresses ambience at least 450 ms, and can
replace the oldest direct contact at the three-voice cap. Other pointers retain ownership.
`contactFeedback`, `hit` and `cancelContactFeedback` retain their existing integration API.
Canceling a nonowner pointer does not clear the owner's hold. Pause clears audio observations
so a stale hold deadline cannot squeak immediately when playback resumes.
Test sound can play while paused but respects application mute and zero volume.

Master gain stays 1.8 × saved volume. A 0.5 input gain and compensating range-2 waveshaper
allow the conservative 1.497 three-voice peak sum without hard input clamping. The curve is
linear below 0.6 and softly limits above it; its static ceiling is below 0.85.
This is a mathematical/sample-domain bound, not measured browser true-peak or speaker proof.
No saved volume/activity/mute values are changed by this mix upgrade: existing users get the
new relative levels directly. The prior audioVersion:1 migration remains unchanged; its
historical legacy-mute repair predates this work. Explicit version-1 mute still survives reload.

## Provenance and acceptance

See [sound curation](sound-curation.md), [SOUND.md](../little-mouse/SOUND.md) and
[ATTRIBUTION.json](../little-mouse/public/assets/audio/ATTRIBUTION.json) for exact sources,
licenses, cuts, processing and hashes. Uploader identity is evidence, not species verification.
Floor/trapped recordings are explicit game feedback, not scientifically validated calm calls.
22.05 kHz assets do not reproduce ultrasound.

Tests cover every-bank rate 1/recording-only behavior, missing-source silence, limiter input
headroom, touch ownership, pending cancellation, sustained hold ducking, sparse movement,
load recovery, mute/zero volume and interruption. Bounded evidence is in
[the audio handoff](cycles/podrick-audio.md).
**Pending validation:** actual listening, physical iPad timbre/loudness, speaker route and
true-peak/harshness checks. No listening, deployment, device or efficacy approval is claimed.
