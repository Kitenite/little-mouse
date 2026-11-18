# Behavior improvement batch

## Scope and coordination

- Baseline: `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3` (integrated root main).
- Builder branch/worktree: `cycle-behavior`, `/Users/kietho/.paradev/worktrees/mouse/cycle-behavior`.
- Local Superset workspace: `a58da62b-63e0-4529-bac2-02b467aaf170`.
- Persistent read-only critic terminal: `f3b0503d-7fc2-46b3-b2f5-c75422f136b2`, same workspace.
- Root has no terminal ID; no guessed message destination. Root owns integration/release.
- Scope: behavior/enrichment policy, tests, owning behavior docs. No game/physics/contact/renderer edits.
- Contract read from root `docs/improvement-cycles.md`; bounded active batch, not a scheduled service.
- No automatic breaks, audio changes, main edits, merges, push, build, deploy or device commands.

## B1: blocked familiar entrance — medium, verified

- Runtime: Node headless on macOS; no browser/device quality claim. Viewport 1024×768.
- Baseline source above, deterministic LCG seed 42 (`hunt-policy.test.mjs` seeded helper).
- Settings: Hunt, speed 1.2, size 2.2, hide 3, tempo 1; one mouse, initially away at (-360,384).
- Initialize Hunt at t=1/60, then keep paw radius 180 at x=230, y=768×initial cover slot.
- Continue policy/physics at 60 Hz. Baseline retains hidden/left edge for 30 seconds.
- Expected: choose available cover and reenter; actual score ignored full contact size although
  final entry gate rejected it. Familiar-edge preference repeatedly won over open edges.
- Fix: score and gate share contact-size/clearance/decay calculations; a blocked mouth loses
  to a clear candidate. Fully blocked entrances still wait; expired footprint permits return.
- After: seed 42 enters peek via a clear edge within two seconds. Repeating seed reproduces.
- Checks: `node --test little-mouse/tests/{hunt-policy,touch-reactions,contact}.test.mjs` (34 pass);
  `cd little-mouse && npm test` (234 pass). No pairing/session state changed.
- Regression evidence: final two cases in `little-mouse/tests/hunt-policy.test.mjs`.
- Independent critic reproduced twice: baseline hidden at 30.0167s; fix peeks at 0.3667s.
  81 seed/rate/size/clearance combinations pass; actual release decay permits entry in 1.55s.
  No concrete B1 regression found. Fix: `629121971d941505ca2fb257043dd1c24f94e96e`.

## B2: superseded threat cancels recovery entry — medium, verified

- Baseline: `629121971d941505ca2fb257043dd1c24f94e96e`; seed 42, 60 Hz, 1024×768, Node/macOS.
- Hunt size 2.2, speed 1.2, hide 2.5, tempo 1, run-through .3; active at (512,384).
- Tick t=.016667; remember touch (562,384); tick .033333; press at (502,384), RNG .8,
  harmlessChance=0. Continue Hunt + physics with no more inputs.
- Baseline: queued retreat deadline .3127817 survives injury. At t=5.066667, history
  hidden→peek→retreat→hidden occurs in one update; visible approach waits until 8.25s.
- Expected: impact supersedes the pre-impact decision, first recovery entrance succeeds.
- New regression fails before fix (`hidden !== peek`); fix consumes current touch serial
  and clears pending decision on injury. First recovery entry now peeks; new cues still react.
- Focused hunt-policy/touch-reactions/behavior suite: 30 pass; full suite: 235 pass.
- Independent critic accepts B2: baseline fails at 5.066667s, fix peeks; 75 harmful
  region/outcome/rate variants pass, and fresh cues still react. Fix SHA recorded next.
- Reproduction uses simulation time only; restart with seed42 repeats; pairing untouched.

## Ranked follow-up

- B3 reproduced: paw arriving after entry choice holds invisible peek for 60 seconds.
  Plan bounded retreat/reselection without teleporting a visible mouse.
- Device/cat response remains unverified; authored avoidance is a design inference.
