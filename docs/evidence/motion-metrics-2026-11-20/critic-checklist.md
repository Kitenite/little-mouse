# Independent acceptance checklist

Status: initial source review; helpers absent at inspection. No implementation acceptance yet.
Owner: metrics-critic; root integrates benchmark, documentation and ledger.
Scope: read-only repository; writes confined to /tmp/metrics-critic*.md and /tmp/metric-probe*.
Review budget: maximum three helper review rounds; none consumed yet.

## Visibility

- Preserve legacy center visibility as a separately named comparable metric.
- Define silhouette fraction denominator and binary any-overlap threshold explicitly.
- Full neutral body inside => fraction 1; fully outside => 0; finite fractions stay [0,1].
- Nose/body peeks with center outside must count; bounding-box-only corner overlap must not.
- Test four edges, four corners, rotations 0/pi/2/pi, and aspect ratios 1024x768 / 390x844.
- Heading uses screen x=x+size*(localX*cos+localY*sin), y=y+size*(localX*sin-localY*cos).
- Use shared morphology/profile and identity/config size; avoid physics radius as silhouette.
- Distinguish core body visibility from optional tail-only visibility and conservative exit bounds.
- Neutral proxy excludes live articulation, gait, roll, fur, limb/ear/tail motion and occlusion unless actually modeled.
- Hidden/away states override overlap; renderer also displays defeated mice, so document any active-only restriction.
- At both endpoints verify active/not hidden and continuity before rewarding displacement.
- Never clamp outside center coordinates into border occupancy or rewarded route geometry.
- Define whether partial travel is binary or fraction-weighted; exposure denominator must match.
- Sampled clipping must document finite resolution and tiny-peek sensitivity; exact claim requires exact geometry.
- Invalid coordinates, dimensions, size/heading and zero duration cannot create favorable metrics.
- Verify immutable input objects and deterministic output, including identity generation.

## Actual route repetition

- Sample executed positions, not targets, route kind, phase transitions or planned control points.
- Identical executed path with different labels/IDs remains repeated; stalled distinct plans earn no novelty.
- Same shape at different speeds/sampling rates (30/60/120 Hz) should agree within declared tolerance.
- Resample by traveled arc length; duration samples otherwise overrepresent pauses and speed changes.
- Explicitly define translation, rotation, scale and reverse-direction equivalence; test chosen policy.
- Compare distinct paths with same endpoints and same coarse occupancy; order must matter.
- Repeated loops in one long phase must be detectable; no requirement for authored route changes.
- Bounded sub-threshold jitter and duplicate stationary points must not manufacture routes.
- Hidden intervals, teleports, resets, manual/airborne intervals and identity replacement break continuity.
- Require minimum distance/exposure; incomplete final segments and short fragments need reported censoring.
- No observations => unavailable/zero evidence, never certified perfect novelty.
- Specify per-mouse vs pooled memory, window, capacity/eviction and denominator.
- Avoid overlap-driven self-repetition if sliding windows share most samples.
- Explicitly exercise memory bounds and final flush; frame count must not grow retained memory unboundedly.

## Integration and evidence

- Keep metrics diagnostic until root explicitly versions utility/gates and validates new acceptance semantics.
- Add helper hashes to evaluator provenance; source-dir imports must use requested runtime morphology.
- Preserve existing utility/gate behavior unless an explicit contract change is implemented and documented.
- Report resolution, windows, thresholds and sample support with result metadata.
- Distinguish phase-label diversity, route geometry recurrence and feline preference throughout.
- Offline source/probe success proves neither rendered visibility nor feline interest.
- Root owns index/ledger updates; worker does not edit repository documentation.

## Root integration boundary review

Root decision: report v3; legacy score metrics byte-identical to /tmp/metrics-before-3537a0a.json.
New row.diagnostics and top-level diagnostic aggregation are separate from utility/gates.
Partial neutral-body exposure and center-visible eligible route geometry have separate meanings.

- Compare every legacy row metric (not merely final score), same seeds/scenarios/order/durations.
- Diagnostic helpers must not consume runtime RNG, mutate mice/config/identities or alter simulation order.
- Version 3 acceptance must not accidentally require diagnostics or use them to choose candidates.
- Hash entry and both helpers with unambiguous named file boundaries; verify before import and after run.
- Loaded helper hashes must represent loaded module bytes: same-process dynamic import cache can retain old code.
- Repeated evaluate calls after helper edits must abort, not relabel cached code using fresh hashes.
- Preserve runtime source-dir isolation: helper profile/morphology imports must come from selected archive.
- Route eligibility must check both prior and current active/hidden/hold/toss/injury states.
- Break continuity on an ineligible sample, including single-frame gaps; do not reconnect across hidden time.
- A discontinuity marker must suppress both adjacent segments when required by its meaning (release included).
- Resize must clear pending route windows as well as prior endpoint; normalized coordinate changes are not travel.
- Distinguish cast slot from identity; replacement in same slot cannot connect two animals' positions.
- Snapshot previous primitive eligibility/position values; do not retain mutable mouse references as old frames.
- Define injury boundary precisely (injuredUntil > time); source-review active effects that outlast this timestamp.
- Center-visible route censoring intentionally omits partial-peek movement; report eligible exposure/path support.
- Pool fractions by summed numerators/denominators, not mean of per-row ratios when support differs.
- Keep undefined/no-evidence ratios null and aggregate with support counts; never silently treat null as zero novelty.
- Bounded route history across rows must reset: scenario/seed order cannot change diagnostics.
- Hold/toss/injury exclusions are diagnostic definitions, not validated cat-interest or welfare thresholds.
- Legacy previous-hidden-endpoint gap is known; fixing old scoring here would violate byte-identical decision.

## Round 2 disposition

- Passed independent phase-invariance, same-phase loops at 30/60/120 Hz and two-sided exclusions.
- Passed saved 12-row legacy metric/objective/gate equality and current helper/benchmark hash checks.
- Re-ran root neutral mesh probe: 144 cases, max fraction error 1.973806729171912e-9.
- Current integration is row-only; prior top-level aggregation plan is not a delivered feature.
- Keep support visible: 972 censored bouts (960 ineligible, 12 finalize); recurrence is selected evidence.
- Near-return threshold sensitivity reproduced; see review/probe, no default blocker demonstrated.
- Explicit resize/identity/reset marker integration is not exercised; benchmark supplies discontinuity:false.
- Round 2 accepts bounded diagnostic scope with stated limits; one review round remains.
