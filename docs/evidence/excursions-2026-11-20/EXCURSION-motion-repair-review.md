# Narrow causal repair suggestion — motion-trace-critic

Status: code-inspection advice only; no patch reviewed or validated yet.
This is separate from the completed three exploratory investigations. No new simulations,
seeds, tuning, source edits or broader search were performed for this note.
Baseline evidence remains unchanged in `/tmp/EXCURSION-motion.md` and its artifacts.
Root owns the repair; critic remains available for a bounded independent regression review.

## Recommended first repair boundary

Keep the repair local to `contact.js:avoidPaws`, specifically the live-overlap early return
and its handoff back to the retained detour. Preserve the collision solver, constrainPaws,
arrival safeguards, hunt targets, phase policy and all production defaults.

Current code retains a detour's approach axis and side, but whenever distance to a live paw
falls below reach+25, it returns only the radial outward vector. On the other side of that
boundary it returns the flank-waypoint vector again. Those directions can differ sharply,
even reverse their turning demand. Collisions can move the mouse across the boundary repeatedly.
The fixed public goal therefore does not imply a fixed steering direction.

The preserved failure contains 30 threshold crossings and 29 substantial turn-sign reversals.
Removing either paw or companion eliminates the prolonged turning. This strongly supports
reviewing the switching boundary first; it does not prove the exact substep detour state.

Narrowest causal change to try: keep a consistent tangential direction around the SAME paw
while providing outward escape, rather than discard all detour-directed progress during overlap.
Reuse the existing committed axis/side and make the radial safety correction join coherently
with the normal detour vector through the existing reach-to-reach+25 band.
The geometry should avoid an abrupt inward/outward heading switch at the outer threshold.
Use the existing clearance/band and commitment lifecycle; do not add a tuning/search knob.

A possible implementation structure, not a validated formula:
- Resolve the relevant live threat before selecting its safe steering vector.
- For the committed paw, derive the flank direction from the existing commitment.
- Decompose it into radial and tangential components about that paw.
- Preserve tangential progress on the chosen side; replace inward radial demand with outward
  escape as the mouse enters the safety band, with a continuous transition at its outer edge.
- Keep outward escape authoritative at actual overlap; never simply return an inward-pointing
  waypoint vector because a commitment exists. Keep constrainPaws unchanged as the physical guard.

If there is no valid same-paw commitment, retain the established outward fallback first;
adding initial detour construction inside overlap is a separate change only if evidence requires it.
A DIFFERENT live paw must still interrupt the old commitment immediately. Do not project around
one paw while steering into another, or make remembered footprints physical obstacles.
Held mice must still bypass avoidance; removal, release expiry, material target changes, passing
and bounded-travel resets must retain their existing semantics.

## Why not begin elsewhere

Increasing turn speed, reducing mouse size/clearance, ignoring collision displacement, shortening
retreat deadlines or randomizing exit goals would hide the interaction or change unrelated policy.
Adding hysteresis alone can reduce threshold chatter but can also latch radial-only escape
against the companion; it does not by itself preserve lateral progress around the paw.
A blend must be checked for inward steering near actual overlap; smoothness alone is not safety.
No claim is made that the suggested local change necessarily resolves the full coupled solver.

## Narrow independent review after root supplies the patch

1. Preserve the archived baseline. Replay the existing seed59/paw/30Hz 80-second repro against
   the patched source, record effective steering/commitment diagnostics if root can expose them
   without affecting behavior, and retain actual positions/headings/targets/phases/collisions.
2. Check the existing 23/59 panel at 30/60/120Hz without adding seeds. Earlier divergence after
   a patch means the old timestamp alone is insufficient: also rank full-run corrective-turn windows.
3. Compare paw penetration, actual exit/progress, accumulated AND net turns, target changes and
   collision exposure. Fewer turns caused by being stalled, hidden or excluded is not a repair.
4. Run existing contact/physics/hunt regressions, including centered detour mirror/jitter,
   different-paw overlap priority, recent-memory expiry and held/contact bypass cases.
5. Add a focused same-paw boundary/collision regression with a concrete progress assertion,
   not an assertion mirroring a new steering formula. Do not loosen existing safety thresholds.

The existing controls establish a useful causal comparison; they are not proposed gameplay changes.
A successful CPU replay would support the bounded repair, not physical-iPad or visual acceptance.
