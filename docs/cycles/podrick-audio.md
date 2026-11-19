# Podrick audio handoff

Task: audio. Workspace `c4b3d12d-6447-4349-b55b-381ecae24e95`, branch `podrick-audio`.
Implementation terminal `f69ded84-16aa-4d32-bbbe-00b25c347a1c`.
Base actually checked out by Superset: `9eee66e9fd531a59b417e06c7573a0e186e0e63d`.
Root integrates this scoped commit onto its local `111d371`; no reset/rebase/artwork/config changes.
Status: implemented and focused tests passed; listening/device validation remains pending.

## Outcome and comparison

Owner decision: no artificial audio, including pitch/random-rate processing of real recordings.
Every bank now plays a loaded real recording at rate 1; unavailable clips stay silent.
Gain/fades/limiting only affect mixing. No oscillator, generated noise, buffer primer or fallback.
Mouse game/physics/touch APIs are unchanged. No saved setting changes or new settings migration.
The new relative mix applies to existing users with their saved volume and explicit mute.

| Layer | Before | After | Evidence / limit |
| --- | --- | --- | --- |
| Tap | floor, gain .20 | floor, .48 | +7.60 dB before limiter; 0.24–0.52 s native cuts |
| Generic squeak | mouse, .28 | mouse, .48 | +4.68 dB; 0.35–0.50 s native cuts |
| Hit / hurt | .38 / .32 | .48 / .48 | +2.03 / +3.52 dB; source identities unchanged |
| Release | paper, .19 | floor vocal, .48 | Recorded vocal, deduplicated short harmless release |
| Sustained hold/drag | no recurring vocal | floor, .40 | First after 3 s, then 4–7 s; ducks foley, never steals direct contact |
| Movement | paper .025/.04/.035 | crawl .018/.022/.022 | Patter/retreat/drag-loop; actual displacement required |
| Movement duration | paper 0.28–0.76 s, rate .96–1.04 | crawl 0.45–0.55 s, rate 1 | No loops or pitch processing |
| Movement spacing | minimum .9 s | minimum 2.4 s | 2.4–4.8 s at game activity 1.25 |
| Idle/hidden/social/phase foley | automatic aliases | silent | Explicit pose activities retain low recorded texture |
| Limiter input | possible >1 sum | half-scale input, range-2 curve | 1.49688 worst-case sum becomes .74844, avoiding hard input clamp |

Gain-weighted bank RMS: tap .031450, squeak .040210, patter .0003145,
retreat/drag-loop .0003844, before master/jitter/surface factors. These are digital comparisons.
Curve static maximum .84907556; analytic value at conservative maximum sum .84308329.
This does not establish browser post-oversampling true peaks or physical speaker quality.

## Curation audit

Active set: 25 excerpts from four originals (floor 4, uncertain mouse/rat 12, cracker 6, crawl 3).
Paper/rat/hamster retained only as archived provenance. All 43 retained assets have hash records.
Seventeen texture aliases share the same three crawl excerpts; no false diversity claim.
Active source cut intervals do not overlap within each original.
Crawl was held out for quietness, 27.96–32× preparation gain and no listening. Those risks
remain documented. No extra normalization; prepared RMS spread 6.87 dB is preserved.
The loudest movement cut is at least 32.75 dB below the quietest tap at equal jitter,
before surface attenuation. Lower gain does not improve the recording signal/noise ratio.

Primary crawl source reopened: https://freesound.org/people/jimmyfisher/sounds/415230/
Uploader describes kitchen crawling, DR-05, with CC0 license. Species/clean isolation unverified.
Downloaded the existing HQ preview with curl; SHA matched CURATION.json exactly:
`6ef7a62f4ea008617efed2cc834276ef51b4e8b7c8425938a4f9655a4bb13ff9`.
ffmpeg decoded mono 22.05 kHz for raw RMS comparison: cuts .001883/.000521/.000991;
first second .000757. This is not an SNR measurement or auditory approval.
Primary source search rejected human imitation/mouth foley and noncommercial alternatives;
URLs and source-specific limitations are in [sound curation](../sound-curation.md).
No new asset processing or new independently recorded original was introduced.

## Independent critic evidence

Read-only Superset critic terminal `f0c5e35b-7540-475e-86ba-3af60e254976`, same workspace.
No critic file writes. Final envelope: `SUPERSET_WORKER_DONE — podrick-audio-critic`.
Reviewed runtime SHA-256:
- audio.js: `6cb33f27c4c80100a033a201c9c11b92e8bc8eadd80f7222601536b601fc0ba9`
- audio-samples.js: `b55035bf5645d51b0e9f498e83be17e676160bf799d0fe446a04c12e1ebd6345`

Critic independently checked PCM/hash/format/endpoints for 43 assets, cut overlap, gain bounds,
source metadata and recorded-only graph; ran the then-current 64/64 audio/curation tests.
Its initial concerns led to removal of automatic idle/social aliases, held-vocal ducking,
range-2 limiter input headroom and a production-configuration limiter regression test.
Final recommendation: scoped audio changes acceptable pending external unlock-hook removal;
no synthesis/rate blocker, crawl provisional quiet use defensible, no listening approval.
It saw the final additional tests/docs; the 73-test rerun is implementation-worker evidence.

## Integration, validation and remaining limits

`node --test little-mouse/tests/audio.test.mjs little-mouse/tests/audio-curation.test.mjs little-mouse/tests/settings.test.mjs`:
73 passed, 0 failed. Covers every-bank native rate, loaded-buffer identity, no generated fallback,
limiter range/peak math, hold ducking/cancel/mute, quiet sparse displacement and saved settings.
`git diff --check`: passed. Owning docs remain below 120 lines; no workers/index edits.
`cd little-mouse && npm test`: 278 passed, 0 failed on this isolated baseline.
This is not the root integrated/native suite; the peer local-only branch has different test counts.

Local worker owns game.js unlock foley removal in `30762e32fe6ddea0d7dd8c236ece3e01c76f3f3d`
(after `dac9fa4`). Peer reports unlock now only activates/syncs; regression checks zero cue
calls, full web 266/build pass. Not independently run here; root must integrate that commit.
Do not merge the old game.js from this worktree. Public audio API remains unchanged.
Root owns final integrated/native checks, artwork, device build and deployment.

No actual listening by implementer or critic; no device restart/deployment, native test,
measured browser true peak, calibrated sound level, species verification or efficacy claim.
Listen to crawl noise and louder floor vocal harshness before quality acceptance; omit poor
movement clips rather than boosting them. Existing archives are not runtime alternatives.
