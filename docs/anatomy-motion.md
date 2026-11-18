# Anatomy and secondary motion

## Owner requirements

Use a large, realistically proportioned textured 3D mouse. Animate the legs, but keep feet
from cycling implausibly fast. Turning, running, stopping, injury and restraint should alter
the pose coherently. Continue critique against real prey; realism is a target, not a completed claim.

Individuals should have stable, adjustable differences in body, head, legs, tail, ears, eyes
and coat. Fur should look soft and fuzzy around the silhouette rather than a hard smooth shell.
Head/torso/pelvis shaping, arm sizing and arm hairiness are adjustable. Calm watch bouts
should include eating, face wiping, hindleg scratching, stretching and occasional rolling.

## Implemented foundation

- Persistent seeded identities supply bounded morphology and coat variation. Defeat/replacement
  may introduce a new identity; ordinary hiding must preserve the individual.
- Geometry, articulated legs, contacts and exit bounds use the same morphology.
- Speed-sensitive gait controls cadence, stride and foot lift; the default cadence cap is 4.5 Hz.
- Secondary motion gives the tail, ears, fur and whiskers bounded motion with reset behavior
  after discontinuities. Rest and pauses must not accumulate unstable physics.
- Anatomical head/pelvis pose freezes from initial claim, preventing movement under a pending
  pointer. Ears, whiskers and fur retain bounded secondary responses during restraint.
- Tail contact uses the rendered centerline and a reachable dual-anchor curve. Exact material
  fractions remain pinned between solver nodes; held paws preserve the selected leg and
  contact offset while the limb solver follows the anchor.
- Calm watch bouts support nibbling, alternating face wipes, one-sided hindleg scratching,
  hindleg stretches and rare partial side rolls. Action-specific targets use the same attached
  limb solver; the whole rig follows a roll. Each bout has a bounded simulation-time duration.
- `activity={kind,at,until,side}` coordinates animation/audio. Movement, danger, injury or even
  a pending pointer claim cancels the action. Pausing freezes its timestamp-based pose.
- `idleActivityFrequency` controls spontaneous grooming actions; nibbling retains its separate
  frequency. Playground actions force one safe watch bout for inspection. Neither schedules
  an automatic session stop.

## Implemented refinements; visual validation pending

Independent arm length/thickness, body/arm hairiness and fur softness controls now feed the
renderer. Head/torso/pelvis articulation eases separate turns through a continuous surface,
with anatomy-aware limb anchors and corresponding contact transforms.
`furLength`, `furSway`, hair density and softness remain distinct parameters.

The implementation owner reports focused anatomy, model, identity and leg-rig checks passing,
including articulation limits, seam continuity, inverse contacts and limb lengths. Physical
visual review still needs to establish whether softness and motion satisfy the requested look;
source/tests do not establish photorealism.

## Acceptance criteria

- Compare front, side and top silhouettes, then slow-motion runs, starts, stops and turns.
- Feet do not skate excessively, spin rapidly at rest, pass through the body or continue a
  normal running cycle while the same paw is pinned.
- Hair and appendages stay attached under every supported morphology extreme.
- Tail root remains attached; held tail cannot stretch indefinitely, kink through the torso
  or teleport the body to satisfy an impossible anchor.
- Head/body contact does not mirror or jump the mouse. Model-local positive Y maps through
  screen x = x + size*(localX*cos + localY*sin), screen y = y + size*(localX*sin - localY*cos).
- Hidden/respawn bounds account for the longest supported tail and largest body.
- Per-frame geometry work remains bounded for the iPad count/size extremes.

## Sources and limits

Source owners: `mouse3d.js`, `mouse-identity.js`, `gait.js`, `leg-rig.js`,
`leg-kinematics.js`, `secondary-motion.js`, `idle-animation.js` and `contact.js`.
Tests include `anatomy`, `mouse-model`, `mouse-identity`, `gait`, `leg-rig`, `held-paw`,
`secondary-motion`, `whisker-geometry` and `idle-animation`.
The rig and tether are approximations; they are not full soft-body tissue or biomechanics.
Scratching raises a hindpaw toward the side/neck within its reachable limb span; precise ear
contact and biological grooming sequences remain visual refinement work. Rolls currently use
partial side rotation, not a full ragdoll or 360-degree tumble.
Physical iPad visual critique remains necessary even when numerical invariants pass.
