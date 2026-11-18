# Sound curation — bounded inventory and asset handoff

**Status:** assets prepared; runtime integration and physical listening pending. Reviewed 2026-11-17.
Scope: baseline `9e2f7e8` has 30 excerpts / four originals / 25 contextual banks, not 25 recordings.
User policy: taps use recorded squeaks; no duplicate tap foley, foot layer, generated tone or noise fallback.
Keep immediate contact priority, mute, interruption cancellation and the three-voice cap.
Implementation worker owns runtime changes; this branch changes no runtime files.

## Evidence and identity key

Source identity below is uploader metadata, not independent zoological verification. All four existing sources are CC0 1.0.
- **M:** [shyguy014 463789](https://freesound.org/people/shyguy014/sounds/463789/): trapped mouse/rat, species uncertain; struggling context. Not calm communication.
- **R:** [Zabuhailo 143125](https://freesound.org/people/Zabuhailo/sounds/143125/): pet rat, not mouse; scream tag, eliciting context unspecified. “Distress” is an interpretation, not confirmed metadata.
- **H:** [Yuval 204762](https://freesound.org/people/Yuval/sounds/204762/): hamster eating at night, not mouse. Eating context documented.
- **P:** [BenjaminNelan 353125](https://freesound.org/people/BenjaminNelan/sounds/353125/): page rustle, not animal. All four cuts share one 1.129-second original.

## Exhaustive baseline inventory

Duration in seconds; RMS/peak are linear full-scale PCM measurements, before runtime gain.
Redundancy is source-level: M12/R8/H6/P4 denote cuts sharing that original; these are not independent recordings.
Keep means retain only for the stated restricted use. Replace/remove concerns runtime mapping, not destruction of provenance.

| Clip | Identity/context | Seconds | RMS / peak | Redundancy | Decision / proper mapping |
| --- | --- | ---: | --- | --- | --- |
| mouse-01 | M | 0.380 | 0.04433 / 0.48529 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-02 | M | 0.360 | 0.08537 / 0.45267 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-03 | M | 0.350 | 0.06780 / 0.54999 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-04 | M | 0.500 | 0.08999 / 0.36612 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-05 | M | 0.450 | 0.08042 / 0.54999 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-06 | M | 0.470 | 0.08902 / 0.40836 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-07 | M | 0.380 | 0.08999 / 0.47818 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-08 | M | 0.360 | 0.08999 / 0.46356 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-09 | M | 0.480 | 0.08999 / 0.51340 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-10 | M | 0.400 | 0.08880 / 0.43671 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-11 | M | 0.380 | 0.08927 / 0.31955 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| mouse-12 | M | 0.400 | 0.08787 / 0.30695 | M12 | Keep: explicit injury/vocal audition only; replace harmless tap with new source |
| rat-01 | R | 0.320 | 0.06835 / 0.37109 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-02 | R | 0.300 | 0.05607 / 0.26154 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-03 | R | 0.300 | 0.08999 / 0.26868 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-04 | R | 0.240 | 0.08999 / 0.34018 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-05 | R | 0.300 | 0.08999 / 0.39172 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-06 | R | 0.290 | 0.08999 / 0.33499 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-07 | R | 0.330 | 0.08999 / 0.31210 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| rat-08 | R | 0.340 | 0.08999 / 0.32111 | R8 | Replace: mouse hit/hurt; retain labeled rat audition only |
| chew-01 | H | 0.550 | 0.03120 / 0.29297 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| chew-02 | H | 0.580 | 0.02235 / 0.43121 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| chew-03 | H | 0.650 | 0.04189 / 0.38330 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| chew-04 | H | 0.500 | 0.02597 / 0.40253 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| chew-05 | H | 0.600 | 0.02503 / 0.48370 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| chew-06 | H | 0.550 | 0.02793 / 0.54999 | H6 | Replace: nibble/eat with mouse eating; no vocal use |
| paper-01 | P | 0.300 | 0.05018 / 0.54999 | P4 | Remove: tap/foot/activity aliases; retain provenance only |
| paper-02 | P | 0.290 | 0.03789 / 0.54999 | P4 | Remove: tap/foot/activity aliases; retain provenance only |
| paper-03 | P | 0.280 | 0.02478 / 0.54999 | P4 | Remove: tap/foot/activity aliases; retain provenance only |
| paper-04 | P | 0.760 | 0.01881 / 0.54999 | P4 | Remove: tap/foot/activity aliases; retain provenance only |

Four paper cuts supply most calm hunting mappings: peek, tease, call/reply, groom, facewipe, scratch, stretch, roll, sniff, rustle, patter, retreat, flinch, dodge and tap.
They also appear in drag cues; dragstart mixes paper with `mouse-03`. Bank aliases do not add source variety.
Different hashes prove different files, not different performances; source overlap and timbre still matter.

## Prepared additions (not yet runtime-enabled)

Exact source URLs, preview hashes, cut times, gains, PCM hashes and sizes: [CURATION.json](../little-mouse/public/assets/audio/CURATION.json).
All additions are CC0 1.0; credits remain mandatory project provenance even for internal use.

| Files | Primary source / metadata | Intended use / limitations |
| --- | --- | --- |
| floor-01…04.wav | [berboberbo 727114](https://freesound.org/people/berboberbo/sounds/727114/), Mice Squeaks; uploader identifies mice beneath floor | Recorded tap/vocal feedback candidate; behavior and exact species unknown, never claim calm communication. Four phrases, ONE new original. |
| cracker-01…06.wav | [Jon285 75166](https://freesound.org/people/Jon285/sounds/75166/), Mouse eating cracker.wav; pet mouse eating prawn cracker | Visible nibble/eat; uploader discloses ambient noise/birdsong. Six bites, ONE new original. |
| crawl-01…03.wav | [jimmyfisher 415230](https://freesound.org/people/jimmyfisher/sounds/415230/), mouse.wav; mouse crawling in kitchen | Hold out of runtime: very quiet source, noise risk; no foot layer requested. Three excerpts, ONE new original. |

Files are mono 22,050 Hz PCM16 from public HQ previews: 180 Hz high-pass, 10.5 kHz low-pass, 12 ms fades.
Bounded gain caps: floor 64x, cracker 8x, crawl 32x; peak ceiling 0.55. No generated sound or pitch synthesis.
Floor cuts: 1.46–1.70, 2.28–2.62, 4.28–4.80, 4.98–5.32 seconds of source.
Floor RMS: approximately 0.070, 0.050, 0.070, 0.070; exact values in manifest. High gain may expose noise.

## Integration acceptance and limitations

- Copy all named assets and provenance before wiring banks. Merge candidate metadata into attribution only when integrating; candidate manifest is intentionally separate.
- Map taps to floor recordings, with a second loaded recorded squeak as failure fallback; if none are available, stay silent. Never generate noise or play duplicate foley.
- Remove foot-layer scheduling; any separately approved movement/drag texture must remain far below voices. Quiet gain alone does not remove a foot layer.
- Maintain contact priority, first-gesture queue/cancellation, explicit mute/zero volume, pause and three voices. Avoid immediately repeating a clip when alternatives are loaded.
- New vocal variety is four phrases from one new original; no second independently verified suitable vocal original was found in this bounded pass.
- Never relabel human imitation, toy, balloon or computer-mouse recordings as real mice. Exclude reuploads of 463789 from distinct-source counts.
- Test failed-download silence, every-touch squeak, no duplicate/foot voices, priority saturation and startup order after integration.
- Listen on actual iPad for squeak identity, harshness/noise, birdsong, clipping, repetition and level. This agent did not hear any recording; PCM checks cannot approve timbre.

## Checks and ownership

`node --test tests/audio-curation.test.mjs tests/audio.test.mjs`: 43/43 passed; `git diff --check`: clean.
The curation check verifies all candidate hashes, decoded PCM metrics, endpoints, format, unique IDs and source metadata.
Baseline runtime tests validate unchanged branch behavior only; they do not validate another worker’s new runtime changes.
Branch/worktree: `audio-realism-variety` / `/Users/kietho/workplace/mouse-audio-realism-variety`.
Implementation terminal: `aeb88079-ac0b-42b5-a31a-df623e6f3eeb`; independent research: `682d26f2-da4c-427a-9eab-a476d9f964cd`.
No merge, publication, device verification or listening approval is claimed.
