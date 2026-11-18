# Audio improvement batch

## Scope and evidence

- Builder branch/worktree: `cycle-audio`, `/Users/kietho/workplace/mouse-cycle-audio`.
- Baseline: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`; no runtime build/deployment.
- Coordinator workspace: `5b5bc0ce-e628-499e-b026-143bf97a9de0` (local).
- Persistent independent critic terminal: `49671af0-6882-4117-999f-3ffa3f788f01`.
- Critic tree: `/Users/kietho/workplace/mouse-cycle-audio-critic`; Superset workspace is the coordinator workspace above.
- Tests: Node v26.7.0 on macOS 27.0.1, mocked Web Audio, width 1000 px; no browser/device listening.
- Runtime remains 26 excerpts from four originals; identities remain uploader claims.
  Floor squeaks: unknown behavioral context; mouse-labelled vocals: uncertain mouse/rat;
  cracker: pet-mouse eating with bird ambience; paper: nonanimal friction substitute.
- This is up to three active iterations, not a permanent scheduled service.

## A1 — P1 transient download failure permanently silences contacts

- Status: fixed and independently accepted.
- Baseline revision: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
- Sequence: sound enabled/active, volume .7, RNG .5, Date.now=10000; touch pointer 1;
  all 26 loaders throw 503. At 11001 server returns, touch pointer 2, await loading.
- Expected: fresh pointer gets a recorded cue; expired first input does not replay.
- Before: requests stay 26, decoded buffers 0, played 0. Failed promise stays cached.
- After: local gesture retries only missing clips, four concurrent loads maximum;
  one-second backoff, shared flight, errors bounded by clip IDs. Fresh cue plays once.
- Regression: `audio.test.mjs` tests starting “a later local touch”, “recording recovery”,
  and “cancel, mute, pause”. Includes partial success retention and no unsolicited retries.
- Checks: 58 audio tests independently pass. Critic also verified 26→52 requests/one new cue,
  22 partial successes retained, four-only retry, repeated errors bounded, all cancel gates.
- Commit: `7f41a8781585106de2c060966f75780d93f9b880`.
- Session/restart: no reload needed; no settings/pairing/session storage is accessed.

## A2 — P2 excerpt selection collapses to two-clip alternation

- Status: fixed and independently accepted at exact commit.
- Baseline: `7f41a8781585106de2c060966f75780d93f9b880`; same host/mock setup.
- Sequence: RNG=.5, all 26 loaded, active/enabled, width 1000; 12 direct taps at
  AudioContext times 0–11 seconds. Expected four available floor cuts per cycle.
- Before: floor-03/floor-02 alternate 12 times; two cuts never selected.
- After: each bank consumes its loaded excerpt round before refill. Physical last-sample
  avoidance spans banks; a sole conflicting remaining excerpt is deferred, not discarded.
- Dynamic availability resets the bounded round; one available clip still plays.
- Checks: 61 audio tests pass, including partial/new clips and cross-bank repeat checks.
  Critic: all 25 banks × three RNG values × three rounds cover their banks;
  300 interleaved cues have zero immediate physical repeats. This is excerpt variety,
  not additional independent sources or a listening/timbre claim.
- Commit: `f5a9cbc38358742900ea0401319e85042d5e00c9`; no restart/session change.
- Critic independently reran 61 audio tests at this SHA; A1 adverse cases still pass.

## A3 — P2 stale eating/activity phrases outlive their mouse action

- Status: independently reproduced baseline; candidate repair awaiting final review.
- Baseline: `f5a9cbc38358742900ea0401319e85042d5e00c9`; same mock host/width.
- Sequence A: loaded clips, mouse at (100,100), active/watch, nibblingUntil=3;
  update at 0 creates nibble. At .1 start movement (speed 50), hide, grab, or expire.
- Before: nibble owner=null and movement/hold cannot cancel the sounding clip.
- Sequence B: canonical groom/nibble activity then update an array without that mouse
  at .1. Before: owned phrase survives removal because only surface voices are reaped.
- Expected/after: legacy nibble entry/repeat has mouse ownership; interruption cancels
  it before hold branching. Removed mice lose ambient/activity and surface voices;
  other mice and priority-2 direct-contact feedback retain independent ownership.
- Checks: 63 audio tests pass; new “legacy nibble recording” and “removing a mouse”
  regressions exercise interruption, removal, other mouse and contact preservation.
- Commit: exact SHA recorded in final report update; no reload/session changes.

## Remaining limits and next issue

- Three focused iterations complete after final critic approval; no scheduled execution.
- Next candidate: requested audition may remain silent while an unrelated bank is already
  decoded. Needs its own reproducible case/review in a future batch, not changed here.
- Long harmless release is a policy observation, not an accepted bug. Within-800ms
  queued harmless feedback remains intentionally allowed. No hold policy changes.
- Provenance/source confidence and physical listening status are unchanged; no new assets.
