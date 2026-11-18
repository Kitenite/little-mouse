# Recorded prey sound

The game uses 30 short recording excerpts across 25 event families. The original
synthetic squeaks and repeated footstep beats have been removed. Small playback
rate changes (0.96–1.04), gain changes, and nonrepeating clip selection vary the
phrases; they do not replace source recordings with oscillator tones.

## Sources and what they actually contain

All four sources are **CC0 1.0**, verified on their primary Freesound pages on
2026-11-17. They are reusable without attribution, but credits and exact source
links are retained in [the attribution manifest](public/assets/audio/ATTRIBUTION.json).

| Recording | Creator | Used for | Provenance limitation |
| --- | --- | --- | --- |
| [Mouse Squeaks.wav](https://freesound.org/people/shyguy014/sounds/463789/) | shyguy014 | 12 short vocal excerpts | Uploader identifies a trapped mouse/rat; species is uncertain and calls were agitated. |
| [ratSqueak.wav](https://freesound.org/people/Zabuhailo/sounds/143125/) | Zabuhailo | 8 contact/distress excerpts | Actual pet rat, not a mouse. |
| [hamster eating](https://freesound.org/people/Yuval/sounds/204762/) | Yuval | 6 nibbling excerpts | Actual hamster eating, used as rodent eating texture. |
| [Paper Rustle](https://freesound.org/people/BenjaminNelan/sounds/353125/) | BenjaminNelan | 4 friction excerpts | Paper foley for small movement/scratching; not recorded mouse footsteps. |

This is a rodent-inspired game mix, not a scientifically validated model of mouse
communication. Calm social, arrival, and teasing cues use quiet movement foley; agitated vocal
recordings are reserved for explicit vocal audition and contact/distress events. We excluded an actual pet-rat running recording because its
noncommercial license was unsuitable for this public project's unrestricted use.

## Processing and mix

The shipped clips total approximately 548 KB: mono 22,050 Hz, 16-bit PCM WAV.
They were extracted from the sources' public high-quality MP3 previews, filtered
at 180 Hz and 10.5 kHz, adjusted toward a family RMS target with a bounded gain
and 0.55 peak ceiling, and given 12 ms endpoint fades. The manifest records exact
cut times, gain, final PCM peak/RMS, size, and SHA-256 for every excerpt.

Surface friction sits below vocal cues. Small per-clip playback trims match its
RMS within 1 dB, preserving transient shape and the final mix limiter. Running produces sparse short friction
bursts only at meaningful movement speeds, with 1.7–3.9 seconds of spacing at
normal activity. It is not synchronized individual paw impacts. The game never
plays the old synthetic repeating footstep beat. Drag friction requires actual
anchor movement; a held paw or tail can cause occasional scratching. Release and
toss have their own cue. At most three voices overlap, with global and impact
cooldowns. Clip selection avoids immediately repeating the same recording across
events whenever another loaded clip is available.

A shared master gain and soft-knee waveshaper bound the digital output below
approximately 0.81. Ordinary cue levels stay below the knee. Volume is not a
calibrated physical sound-pressure level; device volume and speaker routing still
apply. Missing or failed assets do not block play: movement sounds fall silent,
and other events use a very quiet, short broadband rustle rather than a tonal
synthetic squeak.

## Behavior and controls

`public/audio.js` exports `PreyAudio`, `audioDefaults`, and `audioControlSchema`.
`public/audio-samples.js` defines the event banks and their relative levels.

- `sound`: application mute, available locally and on the companion.
- `soundVolume`: 0–1, default 0.7.
- `soundFrequency`: 0.25–2, default 1; adjusts incidental spacing without raising
  the concurrency ceiling.

Arrival, teasing, contact, injury, concealment, running, dragging, scratching,
release, and quiet idle behavior have distinct event mappings. Nibble audio
requires a visible mouse with `nibblingUntil > simulationTime`; the renderer
supplies the matching paw-to-mouth animation. Nearby calm visible mice may make
sparse call/reply phrases. Their timing is game choreography, not a validated mouse conversation model. The reply rechecks proximity, injury, retreat, and
restraint so a changed situation cancels it.

The animation contract `mouse.activity = {kind, at, until}` drives nibble, groom,
hind-leg scratch, stretch, and roll cues. Entry is keyed by kind/start time;
nibbling, grooming, and scratching may repeat sparsely while their pose lasts.
Changing/canceling the activity stops its own sound immediately. Holding, moving,
injury, startle, and invisibility suppress these cues. The lab exposes all banks,
including eat and facewipe audition aliases; these aliases reuse eating/friction
recordings rather than adding synthetic sounds.

Observed research: vocal categories vary strongly with mouse behavioral context
([Grimsley et al., 2016](https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2016.00038/full)).
Design inference: calm movements should not reuse the bank's documented agitated
vocal recordings. This does not validate the foley as mouse communication. The
22.05 kHz files cannot reproduce ultrasound; no ultrasonic playback is claimed.

## iPad activation and diagnostics

A real local pointer/click invokes audio activation synchronously. Native
navigation and remote Play cannot supply the browser's required gesture. On
supported Safari versions the game requests `navigator.audioSession.type =
'playback'`, which is intended for media playback and can avoid ringer-switch
silencing. It does not override physical zero volume, application mute, or all
possible OS routing restrictions. See [AudioSession.type documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)
and [WebKit's silent-switch discussion](https://bugs.webkit.org/show_bug.cgi?id=251532).
The native wrapper already allows inline playback without a media-element gesture.

The local **Test sound** button activates and plays a recorded squeak even while
paused, respecting mute and zero volume. It waits at most 800 ms for activation
and a further 1.8 seconds for initial samples. Pause, mute, page hide, and iOS
interruption stop voices; another local gesture can resume an interrupted context.

`mouseDiagnostics().audio` reports decoded clip count, loading errors, the last
sample ID/source, context state, active voices, and a measured signal peak after
the master/limiter. A positive digital peak proves the graph produced audio; it
does not prove the physical speaker is audible. In the local browser, Test sound
loaded all 30 clips without errors and produced a measured peak of 0.0443 from
`mouse-06` while gameplay was paused.

## Migration and verification

Inspection of this session's physical iPad settings found `sound:false` persisted
from an older default. An independent one-time `audioVersion:1` migration enables
legacy audio once, preserving movement, appearance, volume, and activity settings.
After that migration, subsequent intentional mute choices persist across reloads
and companion polling.

Run `node --test tests/audio.test.mjs`. Tests cover activation, recording selection,
partial/failed downloads, rate/concurrency limits, drag/release, mute while previewing,
interruption, nibble and social gates, playback-session support, and limiter behavior.
An independent agent checked source licenses, PCM hashes, fades, peak/RMS, event
routing, and repeat/mute edge cases. Waveforms and spectrograms were inspected;
this agent environment cannot hear audio, so no subjective listening approval is
claimed. Physical iPad listening remains the final check for timbre and loudness.
