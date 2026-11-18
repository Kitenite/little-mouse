# Environment improvement cycle

## Scope and ownership

Active bounded batch from `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`; no deployment or device work.
Builder tree: `/Users/kietho/.paradev/worktrees/mouse/cycle-environment`, branch `cycle-environment`.
Workspace: `1d9572b2-5dbc-41b2-8205-d1cab725e06f`.
Independent read-only critic workspace: `30af4adc-6b70-4745-9e11-3bc900d362aa`.
Critic terminal: `5593c3f6-d581-49b9-8928-3f28f35620e2` (reused persistent pair).
Anatomy owner confirmed rendered paw group transform contract unchanged; no renderer hooks edited.
Audio remains separately owned, recorded-only; no automatic session stop is introduced.

## ENV-01 — P2 drag-release footprint backfill

Baseline: `cf064cc`; deterministic Node reproduction, no browser/device claim.
Settings: linen, size 1, strength .55, persistence 1.8; bounds 1000×600; no seed/randomness.
Initialize body x=100 and four feet x=100+4j,y=200,z=3 at t=0.
Drag body and feet to x=150 at .1s, x=200 at .2s; release at x=201,t=.3s.
Expected: no historical footsteps. Observed: 28 new foot marks, starting x=114.
Critic independently reproduced 28 marks twice with 20px/.05s substeps and size/strength 1.
Fix: invalidate footprint history and drag-spacing remainder on claim-mode transitions,
including transitions while stationary. After: zero release marks; subsequent travel emits normally.
Check: `node --test little-mouse/tests/environment.test.mjs` (9 pass).
Regression: drag release and stationary claim transitions in `environment.test.mjs`.
Status: independently verified; critic accepted zero release marks and adverse cases at sizes .6/1/3.
Fix commit: `5b55c28778cfa4a9d15b2aa510a3c42b14f0e83b`.
Restart/retry: fresh memory instances repeat baseline; no persistent settings or pairing affected.

## ENV-02 — P2 grass silhouette

Baseline source confirms every kind uses the same soft elliptical shader mask.
Expected: sparse grass responses have a tapered organic blade and bounded settling.
Rendered baseline: source `5b55c28` (shader unchanged from `cf064cc`), build metadata `786aaf102aec`.
Chrome headless on macOS, 1100×600, device ratio 1; fixture renders production marks at 4×.
No randomness. Grass/linen/earth; strength 1, persistence 2, size 1; contact then .2s settling.
Fixture: `little-mouse/tests/evidence/environment-review.html`; repeat after reload is deterministic.
Evidence: `little-mouse/tests/evidence/environment/grass-{before,after,settled}.png`.
Before: blurred ellipse; after: tapered curved blade bending about a stable ground root.
Bounds: <=.3rad bend, 15% compression; soil retains <=3px slide; cloth/footprints remain fixed.
Normal scene: seed 42, grass, size 2.2, strength 1; Chase then 45 single-frame steps.
1180×820 screenshot `grass-game.png`: clear prey, faint marks; boards switch clears all marks.
No audio, model, background catalog or settings changes; no persisted room/pairing state exercised.
Check: `node --test little-mouse/tests/environment*.test.mjs` (11 pass).
Status: independently accepted: live browser fixture, 11 tests and 105 adverse pose cases.
Root error <7.4e-15px; one draw, 320 triangles unchanged. Exact fix SHA in subsequent record.

## Limits and next issue

Ground responses remain approximate visual marks; no bitmap obstacles or photo deformation.
Physical iPad quality/performance and feline response remain unverified.
