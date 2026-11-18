# Independent realism cycle — visual/reference review

Owner: cycle-realism-critic; baseline `cf064cc936e7fa6527b7eb479d2c77f2f63dc1b3`.
Review tree: `/Users/kietho/workplace/mouse-realism-cycle`, branch `review/cycle-realism-cf064cc`.
Scope: docs/evidence only; builder trees read-only. No main edits, device use, release or merge.
Orchestration: [superset-orchestrate skill](/Users/kietho/.agents/skills/superset-orchestrate/SKILL.md).
This review complements the leads' numerical/code critics; it does not replace their checks.

## References actually inspected

- [Naturalis / Paul van Hoof house-mouse photo](https://images.naturalis.nl/original/muizen/Huismuis_Paul%20van%20Hoof.jpg): viewed the original photograph. Rounded rump/cheek silhouette, fine irregular coat edge and continuous lower face are visible. One pose/animal is not a universal proportion specification; the reviewed cream coat is allowed domestic variation.
- [Bellardita & Kiehn 2015 primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC4469368/), [Figure 1](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/a1bd/4469368/21d77c9f136b/nihms698052f1.jpg): viewed actual side-view locomotion sequences and read gait definitions. Walk/trot/bound/gallop differ in coordination; the study does not validate our timings or game units.
- Looked up the paper's linked Movies S1–S4; publisher redirect failed. Continuous reference video was **not watched**. Another primary video candidate, [Danner et al., eLife](https://elifesciences.org/articles/73424), returned a client challenge. No claims are based on its inaccessible video.
- Reference images were inspected from `/tmp`, not redistributed in the repository. No photorealism, species accuracy, cat preference or addiction claim.

## Reproduction and evidence

All screenshots below are actual production-module WebGL output captured with Browser Use in a disposable browser, not concept images.
Runtime: local static HTTP, HeadlessChrome 158 on macOS; viewport 1440×913, review canvas 1200×700, DPR 1. Not Safari/WKWebView or physical iPad.
Root-level module imports preserve texture asset paths. The lab starts paused; no ordinary-game settings/pairing are changed.
[Harness](evidence/realism/setup.js), [full baseline settings/identity](evidence/realism/baseline-config.json), [held state](evidence/realism/held-state.json).
Seed 428, identity `mouse-sjt1qz`, one mouse, size 3, natural palette, morphologyVariation 0, studio light/plain floor; other defaults in JSON. Initial position (650,350), heading 0, time 0.
Top camera `(0,0,700)` up Y; side `(0,-700,35)` up Z looking at `(0,0,35)`; oblique `(0,-700,210)` looking at the same point.
Review cameras are runtime-only inspection views; they do not add camera controls to the game.

- [Ordinary playground top](evidence/realism/playground-top.png): seed428, mixed palette, size2.1; useful context, **not** the controlled natural-coat comparison.
- Baseline: [top](evidence/realism/baseline-top.png), [oblique](evidence/realism/baseline-oblique.png), [side](evidence/realism/baseline-side.png).
- Moving: call `sim.force('chase')`, then advance/render 1/60 s ticks; screenshots at [0.1](evidence/realism/moving-side-0.png), [0.2](evidence/realism/moving-side-1.png), [0.3](evidence/realism/moving-side-2.png), [0.4 s](evidence/realism/moving-side-3.png). Turning changes the apparent side angle; these are sampled motion frames, not gait validation footage.
- Held: reset seed/position; use rendered `contactAt(720,350,3)` then pointerDown(71), 20 ticks, move to (810,300), 12 ticks. Result head held at 0.5333 s; [side](evidence/realism/held-side.png), [top](evidence/realism/held-top.png). No visible detached limb at this sampled pose; no full multipointer/extreme-pose acceptance claimed.
- Retry: resetting seed and repeating the moving/held input sequence on anatomy iteration1 produced matching state/time/coordinates; no restart persistence test performed. Local static runtime has no release build ID; exact source/hash provenance below identifies each capture.

## Ranked observed cases

| Case | Severity/status | Evidence and actionable target |
| --- | --- | --- |
| REAL-01 | P1 reproduced; partially improved | Baseline side/top has an angular rear/dorsal ledge. Naturalis shows a rounded rear contour. Smooth body profile while retaining anchors; anatomy iteration1 smooths transitions but rear underside still terminates in a pointed wedge. Do not hide this with denser fur. |
| REAL-02 | P2 default-view fix verified | Baseline and held side show an isolated-looking flattened lower oval beneath the muzzle, even with idle/nibble frequency zero. Reference lower face is continuous. Jaw iteration2 removes the separate oval in the tested rest/head-held views; forced nibble is active. Extreme morphology and continuous animation remain with the anatomy critic. |
| REAL-03 | P2 reproduced; modest improvement | Baseline dorsal edge forms a dark jagged fringe against much finer face fur. Coat iteration1 tightens it slightly, with no gross silhouette regression at these views. Graduate regional loft without making ears, nose or paws furry; do not claim plushness from this result. |

Priorities are image-review judgments, not biological measurements or measured user impact.
The tail's straight initial pose and regular whisker fans remain visible differences, but these static samples do not establish a physics/behavior defect. No new blocking environment/behavior finding was established in this review.

## Reviewed improvement passes

1. **Coat iteration1:** read-only capture of worktree `/Users/kietho/workplace/mouse-cycle-coat`, parent cf064cc; `fur-volume.js` SHA256 `caa5c4faba6e55c2232e7506462c63ac03d035d41b1b9c7b521bc7829d24f3e0` at capture. [Top](evidence/realism/coat-iteration1-top.png), [side](evidence/realism/coat-iteration1-side.png). Modest finer fringe; REAL-03 not fully closed. Lead subsequently committed `388459d87f489c8ff1d4b1f5e1d41f49c7823a20`; later changes require their own visual review, not retroactive approval here.
2. **Anatomy iteration1:** read-only capture of `/Users/kietho/.paradev/worktrees/mouse/cycle-anatomy`, parent cf064cc; mouse3d SHA256 `958940ccd5ccce45f8aa84e22d9f963a929239441b4c2913d9434e2b1df0f0cf`, body-profile SHA256 `9dd3b76f609dbead2d2db8c586bf04eb9984515e8fa1bbb67df4298dc66830ab`. [Top](evidence/realism/anatomy-iteration1-top.png), [side](evidence/realism/anatomy-iteration1-side.png), [moving at .3 s](evidence/realism/anatomy-moving.png), [held](evidence/realism/anatomy-held.png). Smoother dorsal transitions; lower oval remains. Render snapshot: 39 calls, 52,586 triangles, 16 geometries, 13 textures; these are not performance timings.
3. **Jaw iteration2, final visual pass:** anatomy parent `de4ec5af7d4591ae82e99e412c20631f6226fd57`, mouse3d SHA256 `e34e7464597b2106fc192e07292bd96311742d187ccfb003be040fc337863589`. [Top](evidence/realism/jaw-iteration2-top.png), [resting side](evidence/realism/jaw-iteration2-side.png), [head-held](evidence/realism/jaw-iteration2-held.png), [active nibble](evidence/realism/jaw-iteration2-nibble.png). Separate lower oval removed in these default views; REAL-02 accepted only for this case. Nibble reproduction: reset, enable idleActivityFrequency1.25/nibbleFrequency1.2, force nibble, step15 (.25s); confirmed active state. Zero-frequency baseline cancels idle activity, so it cannot validate nibbling. Continuous motion and extremes remain unverified by this critic.

## Coordination and remaining limits

Findings and absolute screenshot paths sent using Superset local workspace `5b5bc0ce-e628-499e-b026-143bf97a9de0`:
- Anatomy `1d55772c-e1b1-439a-abb3-a31dfebcd3c2`: REAL-01/02, then same-view smoothing result, requested jaw follow-up, and final limited jaw acceptance.
- Coat `37be8626-484b-4e27-b7af-1786121687f7`: REAL-03, then modest visual improvement and anatomy/coat ownership boundary.
No guessed root terminal ID. Other leads were not sent invented defects. No agents spawned.
This critic ran visual captures/reference checks, not builders' regression suites; their independent code critics own those checks.
Still needed: combined anatomy+coat render review, high-fuzz/extreme-morphology views, continuous real/reference motion comparison, contact cancellation/long holds, actual iPad cadence/speaker observation and voluntary cat engagement.

Batch closed after three visual improvement passes. Only this report and its evidence are in the handoff; no implementation commits were merged.
