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
  region/outcome/rate variants pass, and fresh cues still react. Fix: `af9142b7798f7299c1830b8d7efa77d260cbb9ee`.
- Reproduction uses simulation time only; restart with seed42 repeats; pairing untouched.

## B3: paw arrives during approach — medium, verified

- Baseline: `af9142b7798f7299c1830b8d7efa77d260cbb9ee`; Node/macOS, 1024×768, 60 Hz.
- Seed 42; one away mouse at (512,384); Hunt size2.2 speed1.2 hide2.5 tempo1, clearance50.
- On first peek (t=.35), add persistent radius100 paw at entrance (477.4502635,768).
  Pass paw values to real `stepMice` on every tick; no further inputs.
- Baseline at t=60: still peek at (477.4502635,953.8), target distance163.8,
  visibleSince=null. The hidden-phase entry gate never revisits a later obstruction.
- Expected: back out and try clear cover, without disappearing inside the playfield.
- New regression fails before fix: no withdrawal/reentry within20s. Fix checks peek mouth
  and retreats through its existing approach edge, then uses normal hidden reentry selection.
- After: initial/.7/2.3s approach-age insertions all retreat/hide/reenter within20s;
  no >40px physics step, no hide before full silhouette clearance. Seed replay deterministic.
- Full suite: 236 pass. Independent critic accepts B3: same baseline stuck at40s,
  fix safely hides at.366667 and reenters at2.883333; reproduced twice.
- Critic: 198 applicable size/viewport/rate/speed/insertion cases pass (18 already past peek
  excluded), priority checks pass, 64 focused tests pass, diff clean. Fix: `b6cfec4ca5e6ab7ff3f72b70a0c156ca7d736550`.
- No session/pairing/owner setting changes.

## B4 follow-up: hold/toss stale cue — medium, verified

- Follow-up authorization after root integrated previous four commits at `4fc4dab`.
- Local baseline `8c8d74e632703419cddc8c2d927d73d36cdf50fb`: pre-hold cue replays on landing.
- Seed42, one active mouse (512,384), 1024×768,60Hz; Hunt size2.2 speed1.2 hide2.5
  tempo1 variation=true runThrough=.3. Tick .016667; remember touch (562,384); tick again.
- Body-claim pointer1 at (512,384) at .033333; hold until .3; move pointer to (562,384);
  tick twice; release at .333333 creates toss through .983333 (real contact+physics).
- Pending retreat deadline .3127817 survives and enters retreat at .983333,
  startledUntil=2.183333; no-cue control watches. Critic reproduced twice.
- Expected: hold/toss supersedes the queued pre-contact cue. New B4 regression failed on
  baseline: landing retreat != watch; canceled hold retained deadline .3127817.
- Repair: hold consumes pending decisions/current touch serial; toss discards pending
  decisions and strictly older cues, including when the game skips airborne policy updates.
- New release-timestamp/airborne cues react once; repeated release does not produce an outcome.
- 18 combinations: 30/60/120Hz × none/release/airborne cue × held policy on/off, plus cancel.
- Final local focused suite40 pass, full suite240 pass (including minimal claim dependency).
  Same hunt-policy tests with read-only imports
  of root physics AND contact:18 pass; mixed old physics/new contact is invalid for recency.
- Physics lead `04bacc27-b0f8-4f2d-9a9a-1e7a5b815fba` confirmed no contract concern.
- Critic caught claim+cancel between policy ticks; expanded regression failed on that path.
  Physics owner supplies successful-claim-only reset of reactAt/reactKind/lookAt, with no
  sensed/director changes and no effect on rejected claims. Original dependency:
  `6bef5ac7ab6e646e7e4ce4d0a5194325ad51b6f1` (independently accepted by physics).
- Equal simulation-time cues cannot reveal event order; retain release-timestamp cues to
  protect fresh post-release input. Critic accepts this boundary; not queued-decision replay.
- Behavior critic ACCEPT: committed hook matches review, resolved local focused40/40,
  six cancellation/fresh-cue cases and seven rejected-claim cases pass, diff clean.
- Current workspace/critic retained. No unrelated cases opened; no main/build/device changes.
- Critic DONE envelope received; retain its terminal for future review. Root should register
  this lead/workspace in the shared workers ledger during integration; no root terminal guessed.
- Device/cat response remains unverified; authored avoidance is a design inference.

## Integration

- Previous stack (already integrated by root; do not apply again): `629121971d941505ca2fb257043dd1c24f94e96e`,
  `af9142b7798f7299c1830b8d7efa77d260cbb9ee`, `b6cfec4ca5e6ab7ff3f72b70a0c156ca7d736550`,
  then `8c8d74e632703419cddc8c2d927d73d36cdf50fb` (report).
- B4 code/tests/docs: `d26bed87041ae233f1b03acc6563efd9793844c5`, followed by the
  report-only commit at behavior branch HEAD. Only these new behavior commits are handed off.
  Do not apply local dependency equivalent `0ce4ffa`; root uses original physics SHA above.
- All edits are isolated here. No shared hooks or changes outside policy/tests/docs required.
- Root performs combined integration/build and browser/device/cat validation.
