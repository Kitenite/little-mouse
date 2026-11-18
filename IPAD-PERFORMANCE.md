# iPad performance review

## Implemented bounded renderer changes — 2026-11-17

The renderer-only follow-up is complete in `little-mouse/public/mouse3d.js`. The original review below remains historical; broader recommendations there are not all implemented.

- iPad detection accepts `surface=ipad`, the document surface marker, an iPad user agent, or a touch-capable Mac platform. iPad game pixel ratio is capped at 1.5 and its preview at 1; desktop remains capped at 2. Device ratios below the cap are preserved. The policy is selected when a renderer is constructed.
- Eyes, nose and individual toes no longer cast shadows: 12 casters per mouse versus 31 previously. All geometry, hairs, silhouettes, feet transforms, materials and reactions remain intact; body, ears, main foot parts and tail retain shadows.
- Tail ring sine/cosine values are shared and precomputed. Tail vertices/normals update only when time, gait activity or turn changes. Frozen timestamps alone do not suppress an update while gait activity is still settling. Feet/body/ear animation continues independently.
- The blood pool tracks occupied slots, hides the empty mesh, and skips empty scans/uploads. Settled drops skip matrix writes until travel, fade or viewport changes; expiry and clearing zero matrices, and pooled reuse remains supported. Blood appearance and capacity remain unchanged.

`MouseScene.diagnostics()` returns a snapshot of pixel ratio, framebuffer width/height, model count, active blood count, renderer render counters and memory counters. It adds no per-frame sampling. Root can expose this through existing game diagnostics if useful; no game.js edits were made. Renderer counters are diagnostic observations, not GPU timings or a measured performance claim.

Validation completed: `node --check little-mouse/public/mouse3d.js` passed; `npm test --prefix little-mouse` passed all 34 tests. An inline Node harness using real vendored Three.js objects and stubbed texture/2D DOM setup verified desktop/iPad/query/surface pixel-ratio cases, 12 shadow casters, moving feet, tail coordinates equivalent to the original formula, unchanged frozen-tail attribute versions, and blood empty/settled/resize/expiry/wraparound/clear/reuse behavior. No harness files were added and no WebGL context, browser or simulator was run. Visual/shadow quality and sustained frame timing on physical iPad remain unverified.

Not implemented in this bounded change: frame-rate limits, lazy renderer/model creation, geometry merging, reduced hair density, native packaging, controller changes or CSS. The separate web companion remains untouched.

## Original read-only findings

Read-only source review, 2026-11-17. Only this report was written. No browser, simulator, device benchmark, source edit or native setup change. Findings are concrete work visible in the code; their relative timing and thermal impact still need measurement on the target iPad. Line references describe the inspected snapshot and may move as other workers edit.

## 1. P0 — Budget rendering resolution and cadence independently of gameplay speed

**Evidence:** `little-mouse/public/mouse3d.js:24–25` enables antialiasing, caps pixel ratio at 2 and sizes the framebuffer from the canvas bounds. `game.js:39–40` renders on every animation callback, without a cadence limit. A 2× ratio means four times the framebuffer pixels of 1×. The loop therefore does more work on displays that deliver more callbacks. `game.js:9` eagerly creates separate preview/game WebGL renderers; the preview animates continuously on the home screen. They are not both rendered every frame, but both retain resources. `preview` is stored without a reduced-quality policy.

**Minimal implementation:** introduce an iPad render-quality policy, starting with a configurable 1–1.5 pixel-ratio tier and a 60-render-per-second ceiling as tuning candidates, not proven optima. Use timestamp accumulation so skipped render callbacks do not slow simulation, elapsed time or gait. Preserve prompt input processing and aggressive movement. Gate home preview rendering to a lower cadence, and consider lazy game renderer/model initialization before play. Keep quality changes infrequent and resize only when dimensions or pixel ratio change. Do not disable transparent output blindly: the current floor/background composition depends on it.

**Coordinator validation:** compare stable frame intervals and image quality at 1/4/8 mice and portrait/landscape on real hardware. Ensure a 60-render cap does not turn 120-callback motion into half-speed movement. Record framebuffer dimensions and actual render count, not just callback rate. Keep the existing hidden-document rendering guard and time reset.

## 2. P0 — Reduce small-part submissions and shadow casters while preserving the realistic silhouette

**Evidence:** `mouse3d.js:10,16–22` creates approximately 33 drawable objects per mouse: body, two ears, two eyes, nose, 24 foot/toe ellipsoids, tail, hairs and whiskers. About 31 are shadow casters. At eight fully visible mice that is approximately 264 mouse draw submissions before the shadow pass, plus floor/effects; actual counts depend on culling and renderer behavior. Shared sphere geometry avoids duplicate geometry storage but does not merge these mesh submissions. All small toes use the same 24×16 sphere geometry as larger parts. `mouse3d.js:24` adds a continuously updated 1024×1024 directional shadow map. Hair generation also creates thousands of transparent line segments per mouse, while additional models are constructed synchronously inside `render()` (`:28`).

**Minimal implementation:** first exclude toes, eyes, nose and other visually insignificant details from shadow casting; retain body shadows or a cheap contact-shadow alternative. Merge static same-material foot/toe geometry within each animated foot, so the existing foot transform still drives gait. Use lower-detail geometry for tiny toes and a lower hair density for small on-screen mice. Share immutable ear/hair resources where practical. Warm or incrementally allocate the requested mouse count before active play rather than constructing several detailed rigs inside one render callback. Keep the requested mouse count, 3D prey, press reactions and blood.

**Coordinator validation:** capture renderer draw/triangle counters for both main and shadow work, with matching camera/configuration, before and after. Confirm feet still articulate, silhouettes remain readable and changing from one to eight mice no longer causes a large first-frame allocation spike. Do not equate draw-count reduction with measured FPS improvement without hardware timing.

## 3. P1 — Stop unnecessary per-frame geometry and effect uploads

**Evidence:** each visible mouse rewrites 441 tail vertices, repeatedly evaluates ring trigonometry, uploads positions and calls `computeVertexNormals()` every render (`mouse3d.js:22–23`). The vendored implementation traverses triangles, accumulates and normalizes vertex normals, then marks the normal attribute dirty (`vendor/three.core.js:19789–19880`). Even defeated mice with a frozen animation timestamp enter this path. `BloodSplatter.update()` scans its 320-slot pool and marks the entire instance matrix dirty on every render, including when all slots are empty (`mouse3d.js:33–36`). The fixed pool and instancing already bound blood cost; retain them.

**Minimal implementation:** precompute tail ring sine/cosine values; skip tail updates when its actual pose inputs are unchanged. Trial a lower tail segment count at small screen sizes, then consider analytic normals or GPU deformation only if profiling justifies the extra complexity. Do not simply remove normal updates while retaining a deformed lit mesh. Track active blood slots and a dirty flag; hide the empty blood mesh and upload matrices only when transforms changed, expired or were cleared. In a frame with moving splashes, keep normal updates and visible effects intact.

**Coordinator validation:** verify tails through fast turns, injury and defeat; verify blood spawn, fade, clear and pool wraparound. Inspect CPU samples and buffer uploads at eight mice. This is a plausible CPU/upload optimization, not proof that tails dominate frame time.

## Keep the controller separate

`companion.html` loads `companion.js`; that script uses a 2D steering canvas and imports only the hunt defaults from `enrichment.js`, not `MouseScene` or Three.js. Preserve this entry-point boundary. Apply renderer changes to the iPad game runtime; the web controller should send commands/settings and display telemetry without loading 3D assets, a preview renderer or the game animation loop. Native packaging belongs to the root worker; tablet CSS belongs to the hunt worker. No native files or CSS were changed or audited here.

## Inspection and limits

Commands: `nl -ba` on `mouse3d.js`, `game.js` and `gait.js`; reads of `companion.html`, `companion.js` and package metadata; `rg` for render scheduling/imports and the vendored Three.js implementation. Findings use checked-in source rather than assumptions about a newer Three.js API, so external browser documentation was unnecessary. The companion import search found no renderer/game-loop dependency in the inspected entry point and hunt module. No runtime tests were run because this was a report-only review and browsers/simulators were expressly excluded. Recommended validation above is pending, not completed.

## Layout sizing follow-up — complete

Each MouseScene now observes its canvas with ResizeObserver and synchronizes the framebuffer and orthographic camera to the bounding rectangle when layout changes. `resize()` returns immediately for unchanged dimensions and retains the last valid dimensions while an initialized canvas is hidden. Existing explicit resize calls remain compatible. Where ResizeObserver is unavailable, render checks dimensions and only resizes on a change. This covers settings panel expansion/collapse and orientation without resizing the framebuffer every frame.

Validation: syntax check passed; all 34 existing tests passed. An inline Node check exercised the actual resize method with a real Three.js orthographic camera across landscape/portrait/panel dimensions, repeated dimensions, hidden state and restoration; only changed visible dimensions triggered framebuffer resizing. No browser or simulator was run. Root should visually verify the reported preview cropping on iPad. Worker edits are finished; no further edits while root tests.
