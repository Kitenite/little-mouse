# Independent audio critique

Status: all three bounded iterations independently accepted. No listening approval.
Final review target: `929662ed33542be460907720fdafbc26f7d74ce1`.
Baseline: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
Review branch: `cycle-audio-critic`; worktree `/Users/kietho/workplace/mouse-cycle-audio-critic`.
Builder tree `/Users/kietho/workplace/mouse-cycle-audio` is read-only to this critic.
Builder terminal `aeb88079-ac0b-42b5-a31a-df623e6f3eeb`;
workspace `5b5bc0ce-e628-499e-b026-143bf97a9de0`, local.

## Reproduction environment

Node with deterministic fake Web Audio context; no browser/device playback.
RNG fixed at 0.5, volume 0.7, activity 1, environmentStrength 0.55.
Logical viewport 1000×700 where updates require height; contact API receives width 1000.
Fake wall clock starts at 10000 ms, audio times advanced explicitly.
Fixture: `little-mouse/tests/evidence/audio-critic.mjs`.
Run from repository root: `node little-mouse/tests/evidence/audio-critic.mjs <target-root>`.
Fixture prints observations rather than claiming baseline failures are fixed.

## A1 — P1, verified fixed: silence after transient download failure

At wall time 10000, enable audio and touch mouse with pointer 1.
All 26 sample requests fail with simulated HTTP 503; await initial loading.
At 11001, restore loader and touch a second mouse with pointer 2; await loading.
Expected: fresh touch retries recordings; old expired touch does not replay.
Observed: requests remain 26, decoded 0, played 0, errors 26.
Cause: rejected downloads settle a permanently cached `samplesPromise`.
No reload tested; proposed repair is recovery within the existing session.
Repair uses gesture-triggered failed-only retry with 1 s backoff and one flight.
Verified target `7f41a8781585106de2c060966f75780d93f9b880`: recovery requests 26→52,
decoded 26, played 1, errors 0. Partial retry retains 22 buffers, requests only four
missing clips even with 20 touches; +500 ms backoff issues zero requests. Mute,
cancel, pause and expiry each prevent playback; uncancelled retry plays once.
Repeated failures keep 26 errors; passive loadSamples issues zero retries.
Independent builder audio suite: 58/58 passed. No synthetic path added.

## A2 — policy observation: release before sample arrives

Touch with stalled loading; harmless release at +100 ms; resolve first vocal sample.
Observed one late tap. Cancel and +801 ms expiry controls each produce zero.
This is inside the existing 800 ms bounded-contact policy; not yet a confirmed defect.
Do not silently change release semantics without reconciling the contract.

## B1 / A2 — P2, verified fixed: selection underuses loaded tap recordings

With all recordings available, issue 12 taps, one per audio second, RNG fixed 0.5.
Observed `floor-03, floor-02` alternating: only 2 of 4 tap clips selected.
Verified `f5a9cbc38358742900ea0401319e85042d5e00c9`: 4/4 taps per round.
All 25 banks × RNG 0/0.5/0.999999 × three rounds cover every loaded clip (75 cases).
300 interleaved bank cues have zero immediate repeats; partial two-clip loading and
restoration to four retain coverage. Independently ran 61/61 audio tests.
This proves deterministic selection behavior, not perceptual repetition in random play.

## C1 — policy observation: long harmless hold adds a release tap

Touch pointer 1, advance wall/audio time by 1 second, resolve harmless outcome.
Observed played count increases by 1 and last kind is tap.
The 450 ms down-record cleanup loses pointer identity before release.
Whether release after a long hold deserves separate feedback is a policy question,
not an accepted defect; no repair requested in this cycle.
Keep injury/toss resolution and other pointers independent; review repair separately.

## A3 — P2, verified fixed: orphaned nibble/activity voices

On A2 target, start legacy nibblingUntil=3 at t=0; voice owner is null.
At t=0.1 set moving=true, speed=50, delete nibblingUntil and update. Nibble remains.
Separately, start canonical activity={kind:nibble,at:0,until:3}; update([]) at t=0.1.
Canonical nibble remains too; legacy removal behaves identically.
Expected interrupted/removed activity stops immediately, without stopping direct
contact voices for the same mouse. Baseline clip duration bounded the stale tail.
Verified final target: legacy voice now has mouse owner; interruption/removal leaves
zero nibble voices. Ten canonical/legacy hidden, held, expiry, offscreen and phase
cases all stop their voice. Other mouse nibble and direct priority-2 cue survive
targeted cleanup. Independently ran 63/63 builder audio tests. A1/A2 probes still pass.
Evidence: `audio-critic-baseline.jsonl`, `audio-critic-a2.jsonl`, and
`audio-critic-final.jsonl` beside the fixture. Final checks do not alter builder files.

## Scope and remaining evidence

Current runtime provenance: four originals / 26 excerpts; older 30-clip audit is stale.
No new assets or source identity claims in this review. Source metadata and waveform
checks cannot establish calm vocal context or physical speaker timbre/loudness.
No edits to builder/main, merge, publish, device restart or production settings.

Deferred: requested-bank audition loading is the builder’s next candidate, not
reproduced or accepted in this bounded review. Runtime assets/provenance unchanged.
