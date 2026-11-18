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
- Independent critic accepted after adverse success/failure/reload checks; commit follows.

## Next ranked work

- R2: bounded sanitized failure export available even when startup modules fail; raw diagnostic
  snapshots currently expose pairing code and cannot be safely shared as reproduction evidence.
- Native/WebKit context loss and physical-device behavior remain pending root verification.
