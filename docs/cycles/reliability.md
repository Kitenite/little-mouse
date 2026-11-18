# Reliability improvement cycle

## Ownership and boundaries

- Builder branch/worktree: `cycle-reliability`, `/Users/kietho/.paradev/worktrees/mouse/cycle-reliability`.
- Baseline: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3` (integrated root main).
- Local workspace: `d4d9a648-3c4c-4080-8357-e95b4e6163df`.
- Persistent independent Superset critic: `579e1251-641e-49c9-98a1-12273fd360fd`, same workspace, read-only.
- Root workspace has no terminal ID; none inferred. Audio peer notified via its known terminal.
- Current contract read from root `docs/improvement-cycles.md`; not yet tracked at baseline.
- At most three focused iterations; this batch is not a scheduled/perpetual service.
- No root/main edits, merge, push, deployment, device commands, audio changes or automatic breaks.

## R1 — P2 offline settings lost after reload

- Baseline reproduction: Node VM, actual `game.js`, DOM/renderer/network doubles, 800×600.
- Seed: ordinary-game randomness not relevant to this settings case; no pointer input.
- Start offline with paired storage; set speed=2, sync, sendSettings; reload with same storage;
  reconnect to server speed=1.2. Expected retained owner speed=2; actual speed=1.2.
- Command: `node --test --test-name-pattern='offline owner settings survive' little-mouse/tests/enrichment.test.mjs`.
- Before: FAIL `1.2 !== 2`. Fix: validated room-scoped durable pending overrides, replay until
  acknowledged; preserved pairing. Restart now retains speed=2 and later acknowledged remote .8 wins.
- Critic reproduced an ack race in first repair: a queued speed=2 could overwrite newer .8.
  Regression failed `writes 1 !== 0`; repair deletes acknowledged queued writes and excludes
  acknowledged/superseded values from failed in-flight requeue.
- A second critic case found that stale matching snapshots could discard the latest edit behind
  an older conflicting POST; regression failed writes `[2]` versus `[2,1.2]`. Acknowledgement
  now waits while a conflicting value is in flight.
- Checks: enrichment + network 26/26 passed, including malformed and other-room queue inputs.
- Independent critic accepted after adverse success/failure/reload checks.
- Fix commit: `a2eae09e69ef83bfd8b1f743cd7d9dbb40ee1081`.

## R2 — P2 unsafe/unavailable shared failure evidence

- Baseline: `a2eae09e69ef83bfd8b1f743cd7d9dbb40ee1081`; Node VM, 800×600 game doubles.
- No deterministic seed for live game; test fixes mouse position/input for held-contact cases.
- Before: boot export regression fails `undefined` vs `function`; paired raw diagnostic includes
  bearer code. Expected shareable startup evidence without importing a failed module.
- Added inline `mouseBoot.exportReport()`: first-failure snapshot before cleanup, category,
  last 12 transitions, bounded numeric/enum settings, viewport, 12-hex runtime fingerprint.
- No raw error/URL, pairing credential, storage, mouse or audio detail; exports are detached.
  Raw diagnostic now reports `paired` boolean. No new ordinary-play UI or automatic upload.
- Injected: missing module, hung import, offline/503/HTML Retry response, context/render failure,
  cleanup failure, deferred stale responses, held contact then reload. No automatic retry loop.
- Hold+reload sequence: manual/sound-off/count=1; mouse at (400,300), pointer 7 down there,
  frame times 1000..1400ms by 20ms; remote reload. Pairing/elapsed survive, hold clears, no hit.
- Focused boot/enrichment/network checks: 35/35 pass; 30 failed retries remain <=12 events,
  <5KB and retain the original failure. Export mutated by caller cannot mutate retained evidence.
- Device/OS/browser is Node VM only; no real GPU context loss or installed app claim.
- Independent critic accepted: malformed/throwing diagnostics, 100-retry bound, full web suite
  and native checkpoint tests pass. Null snapshot on diagnostic failure documented.
- Collect report before Retry: in-memory navigation limit.
- Fix commit: `4aa4116bc91b7fcf5d0cf602fcd928b667615b12`.

## R3 — P2 malformed durable state prevents useful Retry

- Baseline: `4aa4116bc91b7fcf5d0cf602fcd928b667615b12`; Node VM at 800×600, no seed/input.
- Pairing repro: store JSON `42` in `mouse-room`, load game; expected settings/home available,
  actual startup TypeError `room.match is not a function`, repeated on unchanged-storage retry.
- Resume repro: `{playing:true,catches:7,elapsed:"broken",at:Date.now()}` in `mouse-resume`;
  expected ignored invalid checkpoint; actual playing=true with string elapsed.
- Command: `node --test --test-name-pattern='malformed saved pairing|invalid resume payload|null saved command' little-mouse/tests/enrichment.test.mjs`.
- Before: 2 fail, null-command-history adverse case already passes (no change warranted).
- Repair: discard noncanonical pairing only; validate strict playing flag, nonnegative safe
  catches, finite nonnegative elapsed and nonfuture <60s checkpoint before resuming.
- Checks: focused boot/enrichment/network 38/38 pass. Valid pairing/owner settings survive;
  held-contact reload still restores elapsed without a ghost grab or hit; no auto-stop added.
- Legacy settings fixture uses existing migration markers to isolate malformed storage from
  intentional preset migration. No product changes to settings migration.
- Independent critic accepted after malformed-value, exact timestamp-boundary, valid-resume
  and paused/context-loss checks. Accepted implementation commit follows.

## Next ranked work

- Real WebKit context-loss/retry and delayed native resume remain pending root/device checks.
- Optional future lab input recording/replay would need fixed seed/settings/viewport and
  contact hit-source metadata; current ordinary-game report deliberately claims no determinism.
- Native/WebKit context loss and physical-device behavior remain pending root verification.
