# Sound curation

**Implemented, pending listening:** native-rate recordings, louder vocals, quieter sparse crawl,
no paper footsteps or automatic idle/social foley. Scope: Podrick audio worker, 2026-11-18.
Owner policy: no artificial sounds; found/stock real recordings only; silence is the fallback.
Pitch processing is forbidden across every bank. Gain, fades and limiting are mixing tools.

## Active inventory and identity

All four active originals have CC0 1.0 provenance. Source identity is uploader metadata,
not independently verified species, isolation, behavioral context or sound quality.

| Source | Runtime cuts | Evidence / permitted interpretation |
| --- | ---: | --- |
| [berboberbo 727114](https://freesound.org/people/berboberbo/sounds/727114/) | floor-01…04 | Mice beneath a floor; source page identifies STC3-X recording. Touch/held/release feedback, context unverified. |
| [shyguy014 463789](https://freesound.org/people/shyguy014/sounds/463789/) | mouse-01…12 | Trapped mouse/rat, species uncertain. Injury and explicit vocal audition, not calm autonomous calls. |
| [Jon285 75166](https://freesound.org/people/Jon285/sounds/75166/) | cracker-01…06 | Pet mouse eating a prawn cracker; ambient noise/birdsong disclosed. Nibble/eat. |
| [jimmyfisher 415230](https://freesound.org/people/jimmyfisher/sounds/415230/) | crawl-01…03 | Kitchen crawling, DR-05, scratch tags. Very quiet movement/scratch texture; not verified isolated mouse feet. |

25 active excerpts / four originals / 25 named banks. Seventeen legacy/audition texture banks
share three crawl cuts; aliases do not create diversity. Automatic idle/hidden/social/phase
playback is removed. Runtime crawl cues require displacement or an explicit safe activity pose.
Crawl on grooming/stretch/roll is a generic texture substitute, not a recording of each act.
Floor cuts are nonoverlapping at 1.46–1.70, 2.28–2.62, 4.28–4.80, 4.98–5.32 s.
Crawl cuts are nonoverlapping at 5.00–5.55, 6.50–6.95, 9.00–9.50 s from one 9.695 s original.
Mouse and cracker cut intervals also do not overlap. Hash differences alone do not prove
independent performances; source/cut intervals are the relevant evidence.

## Why crawl was held and what changed

The earlier curator withheld crawl because it was quiet, required 27.96–32× preparation gain,
and had not been heard. Those limitations still apply; this is not retroactive listening approval.
The primary crawl page was reopened and the original public HQ preview downloaded again;
its SHA-256 matches `6ef7a62f4ea008617efed2cc834276ef51b4e8b7c8425938a4f9655a4bb13ff9`.
Raw decoded mono RMS for the three cuts is 0.001883 / 0.000521 / 0.000991; the first second
is 0.000757. This is a level comparison, not an SNR or cleanliness measurement.
Prepared cut RMS is 0.024999 / 0.011334 / 0.012749, peaks 0.327454 / 0.228668 / 0.210632.
No extra normalization is applied; the 6.87 dB RMS spread is preserved rather than lifting
quieter cuts. Mix gains 0.018–0.022 and surface attenuation put movement far below vocals.
Even the loudest movement cut is at least 32.75 dB below the quietest tap before surface gain
with equal jitter. Low gain attenuates noise too, but cannot improve source signal/noise ratio.
**Pending listening:** judge whether these textures are useful; omit them if noise is objectionable.

## Archived recordings and rejected alternatives

- Paper Rustle, BenjaminNelan 353125: four cuts from one 1.129 s page recording. Its broad
  aliases and randomized pitch contributed to repetition risk; completely absent from live banks/preload.
- Rat, Zabuhailo 143125, and hamster, Yuval 204762: assets/attribution retained, no runtime use.
- [adamamazing 557703](https://freesound.org/people/adamamazing/sounds/557703/): source explicitly
  identifies pitched human imitation; rejected, including its reuploads marketed as mice.
- [Nakhas 328220](https://freesound.org/s/328220/): source identifies mouth foley; rejected.
- [tjandrasounds 251949](https://freesound.org/people/tjandrasounds/sounds/251949/): terrarium
  recording, noncommercial license; not acquired for unrestricted project use.
No new independent original was acquired in this pass. Existing crawl candidates were wired
with low levels; no new claim of audible purity or source variety is made.

## Processing, routing and checks

Exact source URLs, licenses, preview hashes, cut times, preparation gains, PCM hashes, peaks,
RMS and sizes live in [CURATION.json](../little-mouse/public/assets/audio/CURATION.json) and
[ATTRIBUTION.json](../little-mouse/public/assets/audio/ATTRIBUTION.json).
Assets remain mono 22,050 Hz PCM16 from HQ previews, with the existing 180 Hz high-pass,
10.5 kHz low-pass, bounded gain and 12 ms fades. No files were reprocessed this pass.
Every runtime bank plays at rate 1. There are no oscillator/noise/generated-buffer paths.
Missing sources stay silent. Existing gain jitter only varies level, never pitch or duration.
The floor preparation gains of 47–64× also need listening for noise at the new louder mix.

The independent read-only critic verified source/hash/format/endpoints for 43 retained assets,
nonoverlapping active cuts, source alias counts, low movement levels and the recorded-only path.
It correctly flagged broad idle aliases and limiter input saturation; both were addressed.
Exact critic IDs, checks and remaining limitations: [audio handoff](cycles/podrick-audio.md).
No agent heard the recordings. Tests and waveform/PCM analysis cannot approve timbre,
speaker audibility, calibrated loudness, actual mouse identity or scientific efficacy.
