# Audio requirements

## Product policy

Use varied prey-related recordings tied to actual events. Quiet intervals matter; avoid
all synthetic audio, incessant footstep beats or audio continuing through pause.
Audio must have local and companion mute, volume and activity controls, plus a local test.
Every confirmed mouse touch uses a collected vocal squeak when audio is enabled,
a recording is available and playback is allowed, including harmless,
invulnerable, held and defeated prey. Missing recordings must never produce fake sound.
This feedback does not apply additional damage. Explicit mute, zero volume, pause
and background state remain authoritative. A cat's or owner's preference is an
observation, not a scientific claim about the mix.

## Implemented

Recorded banks cover arrival, teasing, contact, injury, concealment, movement, drag,
scratch, release/toss, nibbling, grooming, hind-leg scratching, stretching and rolling.
Legacy call/reply banks are quiet social movement foley, not calm vocalizations. Selection avoids
immediate repetition across banks; each bank cycles through loaded excerpts before
refilling, with modest rate/gain variation. A sole remaining cross-bank repeat is deferred.
There are 26 runtime excerpts and a maximum of three overlapping voices. Per-clip
friction trims keep alternating texture RMS within 1 dB; final output is limited.

Walking friction is intentionally much quieter than vocal squeaks. Mix gains are
patter 0.025, retreat 0.04 and drag-loop 0.035; this lowers those layers by about
11–12 dB without changing squeak 0.28, tap 0.20, hit 0.38 or hurt 0.32. Gain-weighted
recording RMS puts these movement layers at least 22 dB below the squeak bank;
that is a digital comparison, not a physical loudness or perceptual guarantee.
Surface friction reuses recorded `patter`/`retreat`/`dragloop`, never an additional bed.
It requires visible observed displacement, including held mice with zero velocity;
stationary struggle, teleports, resize and pause gaps do not trigger it. Moving at least
8 px above 12 px/s allows a phrase, spaced at least 0.9 s apart per mouse. Stopping,
material changes, zero strength, pause and mute cancel surface voices.
`environmentStrength` defaults to 0.55, clamped 0–1. Soft linen/felt/woven/denim/cork/
paper scale friction by 1; clearing/earth/sand/grass by 0.65; hard/unknown floors by
0.08. These are quiet paper-foley substitutes, not authentic material recordings.
`environmentPersistence` controls visual marks elsewhere; it adds no audio tail.
Activity cues require visible safe poses; social textures recheck current context.
`mouse.activity={kind,at,until}` triggers one entry cue with sparse repeats for
nibble/groom/scratch. Interrupted/removed mice cancel owned activity phrases, including
legacy `nibblingUntil`; direct-contact voices keep their separate priority.
Calm arrival, teasing, idle and grooming contain no distress vocals. Explicit taps and
harmless contact outcomes use the recorded vocal tap bank, never foot or paper sounds.
This is a requested game response, not a claim of calm natural communication.
`contactFeedback(mouse,width,outcome='touch',pointerId=null)` is the direct-pointer API; `hit` uses
the same priority path for resolved harmless, injury and toss outcomes. Contact cues
bypass ambient/impact debounce, replacing the lowest-priority/oldest voice if needed
within the three-voice cap. A quick harmless release within 450 ms consumes its recent
down feedback instead of playing a second squeak. Quick injury/toss outcomes replace
the matching down voice or pending clip; other pointers retain their own voices.
`hit(mouse,width,outcome,pointerId=null)` accepts explicit ownership; older callers
resolve the oldest recent touch on that mouse. Injury and toss retain contextual cues.
Direct contact stops existing ambience/hold foley and suppresses new noncontact cues
for at least 450 ms, extended through the vocal duration; no foot bed accompanies it.
Hold/drag textures have bounded timing and can replace ambience but cannot steal a
contact voice. At saturation, the newest contact replaces an older contact.
Raw `tossed` outcomes reach the release cue and do not become generic harmless taps.
Pause, mute, page hide and audio interruptions stop voices. Failed samples do not block play.
Defaults: sound enabled, volume 0.7, activity 1.25. Intentional mute survives reload after the
one-time legacy audio migration. `settings.js` owns ranges and persisted controls.

## Activation and provenance

A local gesture unlocks browser audio. Remote Play cannot provide that browser gesture.
The first contact synchronously requests activation and can queue the latest ten
contacts for at most 800 ms while resume or recording loading completes. Recording
arrival retries only live pending contacts; an expired contact never plays late. Pause, mute, zero volume, hide,
interruption or explicit stop cancels this pending feedback; it cannot replay later.
`cancelContactFeedback(mouse,pointerId=null,{cancelHold=true}={})` removes only
that pointer's pending/direct feedback; a null ID means mouse-wide cleanup. Set
`cancelHold` only when that pointer owns the hold, so canceling another touch leaves
the held observation and hold audio intact. Owner cancellation clears both, avoiding
a phantom release or restarted hold sound.
There is no noise buffer, oscillator, synthesized fallback or generated silent primer.
A new local activation/touch can retry failed downloads after a one-second backoff;
successful clips are retained, concurrent retries coalesce, and no timer retries on its own.
Unavailable recordings remain silent; diagnostics expose `unavailableKind`,
`sample-unavailable`, sample load errors and pending count honestly. Browser denial or
zero physical speaker volume cannot be overridden.
Test sound must work while gameplay is paused and respect application mute/zero volume.
A positive diagnostic signal peak proves generated audio, not audible physical speakers.

Startup requests the four floor-source touch vocal excerpts first, then mouse-labelled
vocals, friction and mouse-eating excerpts. Ordinary hunting mainly reuses four friction clips;
25 bank names are contextual mappings, not 25 distinct source recordings. More
authentic calm variety requires additional verified recordings, not louder walking.
Runtime uses four source recordings: floor squeaks (4 cuts), uncertain mouse/rat vocals
(12), pet-mouse cracker eating (6), and paper foley (4). Confirmed rat and hamster
recordings retain their assets/provenance but are absent from live banks and preload.
Do not label the whole collection authentic mouse communication or footsteps.
Exact sources, licenses and processing are in [SOUND.md](../little-mouse/SOUND.md) and
[the attribution manifest](../little-mouse/public/assets/audio/ATTRIBUTION.json).
Retain source/license provenance for every replacement sample.
Observed evidence: [Grimsley et al.](https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2016.00038/full)
found vocal categories depend on behavioral context. Our design inference is to
keep documented agitated excerpts out of autonomous calm behavior, not to label
foley or requested touch squeaks natural calm communication. The tap bank has four phrases
from one CC0 uploader-described mice-beneath-floor recording; exact species and
behavioral context are unverified. Nibble/eat use six cuts from one uploader-described
pet mouse eating a cracker; ambient birdsong is disclosed. Their gain remains 0.30.
Injury uses uncertain mouse/rat vocals and floor variants, not confirmed rat recordings.
Crawl candidates are copied for provenance tests but remain unwired.
Existing mouse-labelled vocals have uncertain mouse/rat identity. Files at 22.05 kHz
do not reproduce ultrasonic mouse calls.

## Acceptance criteria and remaining validation

- Test every-contact priority under ambient saturation, quick consecutive contacts,
  first-gesture delayed resume and canceled/expired pending feedback.
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
