# Audio improvement batch

## Scope and evidence

- Builder branch/worktree: `cycle-audio`, `/Users/kietho/workplace/mouse-cycle-audio`.
- Baseline: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`; no runtime build/deployment.
- Coordinator workspace: `5b5bc0ce-e628-499e-b026-143bf97a9de0` (local).
- Persistent independent critic terminal: `49671af0-6882-4117-999f-3ffa3f788f01`.
- Critic tree: `/Users/kietho/workplace/mouse-cycle-audio-critic`; workspace ID pending.
- Tests: Node v26.7.0 on macOS 27.0.1, mocked Web Audio, width 1000 px; no browser/device listening.
- Runtime remains 26 excerpts from four originals; identities remain uploader claims.
  Floor squeaks: unknown behavioral context; mouse-labelled vocals: uncertain mouse/rat;
  cracker: pet-mouse eating with bird ambience; paper: nonanimal friction substitute.
- This is up to three active iterations, not a permanent scheduled service.

## A1 — P1 transient download failure permanently silences contacts

- Status: baseline independently reproduced; candidate repair awaiting critic acceptance.
- Baseline revision: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
- Sequence: sound enabled/active, volume .7, RNG .5, Date.now=10000; touch pointer 1;
  all 26 loaders throw 503. At 11001 server returns, touch pointer 2, await loading.
- Expected: fresh pointer gets a recorded cue; expired first input does not replay.
- Before: requests stay 26, decoded buffers 0, played 0. Failed promise stays cached.
- After: local gesture retries only missing clips, four concurrent loads maximum;
  one-second backoff, shared flight, errors bounded by clip IDs. Fresh cue plays once.
- Regression: `audio.test.mjs` tests starting “a later local touch”, “recording recovery”,
  and “cancel, mute, pause”. Includes partial success retention and no unsolicited retries.
- Checks: 58 audio tests pass; critic baseline reproduced separately, final review pending.
- Commit: candidate SHA recorded after commit in the next report update.
- Session/restart: no reload needed; no settings/pairing/session storage is accessed.

## Next ranked cases

1. Per-bank selection under fixed RNG .5 alternates only floor-03/floor-02 despite four
   loaded tap cuts; examine bounded variation without claiming additional originals.
2. Long harmless hold/release can emit another tap; distinguish contextual release
   from duplicate down/up and keep other pointers intact before changing policy.
3. Requested audition may remain silent while an unrelated bank is already decoded.
