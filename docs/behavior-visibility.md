# Neutral body visibility diagnostic

## Contract and status

Implemented in `little-mouse/scripts/behavior-visibility.mjs`; focused headless tests cover
clipping, morphology, transforms, invalid inputs and cache invalidation. Root integrated the
helper into per-row benchmark diagnostics; independent review accepted the bounded contract. This diagnostic does not change utility or acceptance gates.
It is not evidence of rendered visibility, photorealism, feline preference or deployment.

`createBodyVisibility({bodySection, morphologyPoint, physicalTraits})` returns
`bodyVisibility(mouse, config, width, height)`. Inject all three functions from the selected
runtime source, including archived runs. The helper has no public-runtime imports and creates
no identities or random draws. The caller supplies an existing `mouse.identity`.

The result is `{valid, fraction, bodyArea, visibleArea, reason}`. Areas are screen units squared.
For valid inputs, `fraction = visibleArea / bodyArea`, bounded to [0,1]. The denominator is
the **entire neutral torso/head surface's top-view footprint**, including portions outside the
viewport. It is neither viewport area, bounding-circle area nor center exposure time.
Invalid input returns `valid:false`, null fraction/areas and a reason; callers must retain
invalid support separately, never silently turn null into zero or a favorable result.
Nonpositive size or viewport dimensions, nonfinite pose, invalid/degenerate profile and
unsupported morphology fail closed as invalid. Missing factory functions throw a TypeError.

## Geometry and transform

The renderer's `mouse3d.js:bodyGeometry` samples x=-39 through 51 in one-unit steps,
with 40 angular segments including the lateral extrema. The helper samples the same 91
sections with the injected `bodySection`, then applies injected `morphologyPoint` to both
lateral extrema. This includes seeded body length/width, head and regional width variation.
The resulting 182-point outline follows the nonconvex waist; no convex hull is substituted.
The fixed section count is a deliberate renderer-layout dependency; recheck it if geometry
sampling or longitudinal extent changes, including when selecting an older archive.

Screen coordinates use the renderer's neutral transform:
`screenX = mouse.x + size*(localX*cos(angle) + localY*sin(angle))`;
`screenY = mouse.y + size*(localX*sin(angle) - localY*cos(angle))`.
The polygon is clipped against all four viewport edges and its area is measured. Conservative
bounds only permit early full-in/full-out answers; corner overlaps require polygon clipping.
Zero-area tangency has fraction zero. Consumers choosing binary overlap should explicitly
state their positive-area threshold; the helper introduces no binary threshold or travel rule.

Finite one-unit sampling follows the neutral mesh's lateral outline, not an exact continuous
cubic silhouette. Floating-point clipping and microscopic peeks have numerical sensitivity.
The calculation is an estimate of neutral body footprint, not a framebuffer pixel count.

## State and known limits

The caller applies active/away and `hiddenUntil` gates at both displacement endpoints and
checks continuity. The helper intentionally ignores state and time. The renderer can display
defeated mice; an active-only benchmark gate is a separate diagnostic definition.
Exposure aggregation, partial-travel weighting and denominator support belong to integration.
Do not clamp offscreen mouse centers into occupancy cells or rewarded route geometry.

Excluded: live head/pelvis/spine articulation, drag offsets, gait, lean, rolling, impact squash,
tumble, depth projection changes, tails, limbs/paws, ears, nose/jaw attachments, whiskers,
fur, shadows, lighting, occlusion by other objects and antialiasing. Tail-only overlap must not
be described as body visibility. Exit safety bounds have a different purpose and denominator.

## Bounded work and acceptance

Each factory retains at most 16 neutral footprints. Content keys include the complete plain
JSON identity/config, so in-place edits invalidate geometry. Non-JSON/nonfinite config content
bypasses caching. Runtime callbacks must remain pure and source-immutable for a factory's
lifetime. Cached arrays are private; results do not expose them. Keys include size even though
size is applied after neutral geometry, favoring conservative invalidation over cache reuse.
Every query fingerprints input content; partial cases clip at most 182 outline vertices plus
boundary intersections. Memory does not grow with frame count. Config serialization still
costs time; performance must be measured in the integrated search before stronger claims.

Acceptance checks cover four edges/corners, cardinal/diagonal headings, three scales,
1024x768 and 390x844 viewports, center-outside peeks, fully hidden/visible bodies,
false bounding-box corner overlap, morphology extremes, zero-area/invalid data,
mutable identity/config changes, bounded eviction and deterministic unmodified inputs.
Run `node --test little-mouse/tests/behavior-visibility.test.mjs` from the repository root.
Root owns documentation index/ledger links and integration checks.

A root CPU comparison against actual neutral mesh triangles passes 144 cases (default/min/max
morphology, identity 39, two viewports); max fraction difference 1.98e-9. This validates only
neutral core geometry, not live rendered pixels. [Evidence](evidence/motion-metrics-2026-11-20/README.md).
