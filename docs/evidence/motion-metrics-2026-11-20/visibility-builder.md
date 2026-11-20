# visibility-metrics durable handoff

Status: helper implemented and independently tested; root benchmark integration pending.
Baseline supplied by coordinator: main 3537a0a. Shared worktree, no commit/push/deploy,
server restarts, worker spawning or production public-file edits performed.

## Owned files
- little-mouse/scripts/behavior-visibility.mjs (88 lines)
- little-mouse/tests/behavior-visibility.test.mjs (97 lines)
- docs/behavior-visibility.md (75 lines)

No repository files outside those three were edited. Coordination files written:
/tmp/visibility-api.md and this handoff. Root owns index and workers ledger changes.
Read AGENTS.md, docs/README.md, docs/maintenance.md, docs/anatomy-motion.md,
body-profile.js, anatomy.js, mouse-identity.js, mouse3d.js renderer, benchmark loader,
and /tmp/metrics-critic-checklist.md.

## Integration API
Import createBodyVisibility from scripts/behavior-visibility.mjs.
Create once per selected runtime:
  const bodyVisibility = createBodyVisibility({bodySection, morphologyPoint, physicalTraits});
Call bodyVisibility(mouse, config, viewportWidth, viewportHeight).
All three injected functions MUST come from the selected immutable source directory.
Add body-profile to the runtime loader; identity module already supplies other callbacks.
There are no imports in this helper, particularly no hard-coded default public runtime.
Result: {valid, fraction, bodyArea, visibleArea, reason}.
Valid areas are screen units squared; reason=null. Invalid fraction/areas are null,
valid=false with reason. Reject/count invalid explicitly; do not coerce null into hidden.
Missing callback fails fast with TypeError. Existing identity required; no RNG/default
identity creation. Callbacks must be pure/source-immutable for factory lifetime.

## Geometry and meaning
Entire neutral torso/head body surface footprint is denominator, including outside
viewport portions. Renderer bodyGeometry samples 91 sections x=-39..51, angular
segments include lateral extrema. Each +/-section.r is morphologyPoint transformed,
then 182-point outline rotated/scaled using renderer screen handedness:
  x + size*(localX*cos(angle)+localY*sin(angle))
  y + size*(localX*sin(angle)-localY*cos(angle)).
Clip outline to viewport, measure area. Nonconvex waist retained (no convex hull).
Bounds permit full/hidden shortcuts only; partial/corner overlap requires polygon clipping.
Area is measured relative to mouse origin to limit coordinate cancellation.
Zero-area tangency is zero; binary exposure threshold remains root's explicit choice.
No state/time gates: root must gate current/previous active, hiddenUntil and continuity.
No utility or gate changes. Renderer can show defeated mice; active-only is an integrator
choice. No tail-only body credit and no offscreen-center clamping.

## Bounds and cost
At most 16 cached footprints per factory, FIFO eviction. Content keys include all plain
JSON identity and config values, detecting in-place changes, including nested identity
traits. Unsupported serialization values bypass cache. Size currently included in key
for conservative invalidation. Each query still serializes full identity/config.
720,000-call independent probe: 5684.269375ms, checksum 600007.8378634455.
Node v26.7.0, settingsDefaults plus size:1 (77 fields); seed31 mouse, viewport1024x768,
y400, angle=i*.001, x=0 every third call else500. Thus 1/3 partial, 2/3 full.
This is a local microbenchmark only, not integrated search/device performance evidence.

## Checks
PASS node --test little-mouse/tests/behavior-visibility.test.mjs: 9/9, no failures.
PASS git diff --check restricted to owned paths (new files may be untracked).
Documentation line count 75, within requested 120 limit.
Coverage: four edges, cardinal/diagonal headings, three sizes, tablet/phone viewports;
full/hidden/partial; heading-sensitive nose/rear peeks; all four false AABB corner overlaps;
all four true corner overlaps; supported morphology extrema over 30 seeds;
tailLength independence; exact rectangle denominator, half/quarter clipping and tangency;
invalid pose/size/dimensions/profile/degenerate geometry; missing callbacks/identity;
cache mutations and bounded eviction; unchanged input; deterministic/no RNG;
injected alternative source geometry changes output (no default profile contamination).
An initial performance probe imported nonexistent settings `defaults`; corrected to
settingsDefaults before the successful probe. No source change was needed for that typo.

## Limits / remaining root work
Neutral body proxy only: excludes live articulation, spine/head/pelvis motion, drag offsets,
gait/lean/roll/impact squash/tumble, depth effects, tails/limbs/ears/nose/jaw attachments,
whiskers/fur/shadows/lighting/occlusion/antialiasing. Finite one-unit sections mirror the
current neutral mesh outline but are not exact continuous-cubic silhouette or live pixels.
Tiny peeks have floating-point sensitivity. If archived bodyGeometry changes sampling or
extent, this evaluator's fixed x sample contract needs review; callbacks alone cannot
infer arbitrary renderer topology. No feline preference/scientific efficacy claims.
Root: index/ledger links; add body-profile runtime import; helper provenance hashing;
current/previous gates and diagnostic denominators; integrated regression and critic review.
