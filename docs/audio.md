# Audio requirements

## Product policy

Use varied prey-related recordings tied to actual events. Quiet intervals matter; avoid
synthetic repetitive squeaks, incessant footstep beats or audio continuing through pause.
Audio must have local and companion mute, volume and activity controls, plus a local test.
A cat's or owner's preference is an observation, not a scientific claim about the mix.

## Implemented

Recorded banks cover arrival, teasing, contact, injury, concealment, movement, drag,
scratch, release/toss, nibbling, grooming, hind-leg scratching, stretching and rolling.
Legacy call/reply banks are quiet social movement foley, not calm vocalizations. Selection avoids
immediate repetition when alternatives are available, with modest rate/gain variation.
There are 30 short excerpts and a maximum of three overlapping voices. Per-clip
friction trims keep alternating texture RMS within 1 dB; final output is limited.

Running friction is sparse rather than one sound per footfall. Drag friction requires
actual movement. Activity cues require visible safe poses; social textures recheck current context.
`mouse.activity={kind,at,until}` triggers one entry cue with sparse repeats for
nibble/groom/scratch. Interrupted activities cancel their own sounding voice.
Calm arrival, teasing, idle, grooming and harmless taps contain no distress vocals.
Raw `tossed` outcomes reach the release cue and do not become generic harmless taps.
Pause, mute, page hide and audio interruptions stop voices. Failed samples do not block play.

Defaults: sound enabled, volume 0.7, activity 1. Intentional mute survives reload after the
one-time legacy audio migration. `settings.js` owns ranges and persisted controls.

## Activation and provenance

A local gesture unlocks browser audio. Remote Play cannot provide that browser gesture.
Test sound must work while gameplay is paused and respect application mute/zero volume.
A positive diagnostic signal peak proves generated audio, not audible physical speakers.

The bank includes mouse/rat-identified vocal recordings, rat distress, hamster eating and
paper foley. Do not label the whole collection authentic mouse communication or footsteps.
Exact sources, licenses and processing are in [SOUND.md](../little-mouse/SOUND.md) and
[the attribution manifest](../little-mouse/public/assets/audio/ATTRIBUTION.json).
Retain source/license provenance for every replacement sample.
Observed evidence: [Grimsley et al.](https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2016.00038/full)
found vocal categories depend on behavioral context. Our design inference is to
remove documented agitated excerpts from calm behavior, not to label foley natural
communication. Files at 22.05 kHz do not reproduce ultrasonic mouse calls.

## Acceptance criteria and remaining validation

- Test muted/paused playback, unlock failure/retry, interruption, partial asset failures,
  rate limits, concurrency, nonrepetition and context cancellation.
- Verify dragging/toss, every lab audition bank, synchronized activity cues, and no
  stale sound after pause, grab, activity cancellation or leaving the visible play area.
- Listen on the physical iPad for timbre, loudness, clipping and distracting repetition.
- Check zero device volume, output route and OS state before claiming audio is broken.

Source owners: `audio.js`, `audio-samples.js`, game activation/event integration and
`assets/audio/`; automated checks: `audio.test.mjs`.
Limit: digital gain is not calibrated sound-pressure level. Physical listening remains a
separate check; source analysis or waveform review cannot substitute for it.
