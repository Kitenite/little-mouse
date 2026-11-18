# Anatomy and secondary motion

## Owner requirements

Use a large, realistically proportioned textured 3D mouse. Animate the legs, but keep feet
from cycling implausibly fast. Turning, running, stopping, injury and restraint should alter
the pose coherently. Continue critique against real prey; realism is a target, not a completed claim.

Individuals should have stable, adjustable differences in body, head, legs, tail, ears, eyes
and coat. Fur should look soft and fuzzy around the silhouette rather than a hard smooth shell.
Head, ribcage, waist and pelvis shaping, arm sizing and arm hairiness are adjustable. Calm watch bouts
should include eating, face wiping, hindleg scratching, stretching and occasional rolling.

## Implemented foundation

- Persistent seeded identities supply bounded morphology and coat variation. Defeat/replacement
  may introduce a new identity; ordinary hiding must preserve the individual.
- Geometry, articulated legs, contacts and exit bounds use the same morphology.
- Speed-sensitive gait controls cadence, stride and foot lift; the rich-preset cadence cap is 4.2 Hz.
- Secondary motion gives the tail, ears, fur and whiskers bounded motion with reset behavior
  after discontinuities. Rest and pauses must not accumulate unstable physics.
- Pending claims freeze anatomical pose. Active grabs use pin-preserving, region-aware
  planar yielding; see [touch interaction](touch-interaction.md) for controls and constraints.
  Ears, whiskers, fur and tail inherit actual motion; no timed grab-struggle cue is injected.
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
renderer. Ribcage, waist and pelvis width controls blend along the single surface, with a
mildly narrower default waist. Seeded regional variation preserves legacy coat/profile draws;
persisted older identities receive missing regional defaults without changing the individual.
A bounded central spine curve adds gait-linked lateral flexion and idle counterbalance.
Head response leads the trunk; pelvis follow-through is slower. `spineBendAmount` controls
strength. This is kinematic posing inside the existing solver, not a new dynamics engine.
The composed map drives body, fur, whiskers, depth shadows, limb anchors and tail.
Attachment tangents and deformed normals follow it. Inverse contacts undo the spine first.
Zero dt and pending claims freeze pose. Active yielding preserves the captured point with a
shared deformation offset; normals, depth, attachments and inverse picking use the same map.
Free paws lag through IK; selected paws override lag. UVs and geometry objects stay stable.

All four limbs now use one connected tapered envelope per solved joint chain, with rounded
elbows/knees and covered end rings. The former shoulder/bone/joint spheres stay hidden while
retaining their transforms. Surface-attached hairs follow the envelope; distinct paw skin and
paw contact transforms remain unchanged. See [limb surface contract and evidence](limb-surfaces.md).
`furLength`, `furSway`, hair density and softness remain distinct parameters.
The rich launch preset uses morphology variety 0.8, head/pelvis turns and tail/fur motion 1.15,
ear/whisker motion 1.2, grooming frequency 1.25 and nibbling frequency 1.2. These amplify
bounded responses modestly; spring stiffness/damping, mesh density and anatomical proportions
remain at their standard settings. The two-mouse default is within the intended 1–3 mouse budget.

Tests cover both turns, combined spine extremes, inverse contacts, regional extrema,
persisted identities, stable geometry/UVs, limb roots and rendered tail material-fraction pins.
Browser Use preview exercised head/body/hindpaw/tail drags and top/side turn poses advanced
in quarter-speed simulation increments. Physical
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

Source owners: `anatomy.js`, `mouse3d.js`, `mouse-identity.js`, `gait.js`, `leg-rig.js`,
`leg-kinematics.js`, `secondary-motion.js`, `idle-animation.js` and `contact.js`.
Tests include `anatomy`, `mouse-model`, `mouse-identity`, `gait`, `leg-rig`, `held-paw`,
`secondary-motion`, `whisker-geometry` and `idle-animation`.
The rig and tether are approximations; they are not full soft-body tissue or biomechanics.
Scratching raises a hindpaw toward the side/neck within its reachable limb span; precise ear
contact and biological grooming sequences remain visual refinement work. Rolls currently use
partial side rotation, not a full ragdoll or 360-degree tumble.
Physical iPad visual critique remains necessary even when numerical invariants pass.

## Reference comparison and remaining priorities

- Observed anatomy: [Cook, The Anatomy of the Laboratory Mouse](https://www.informatics.jax.org/cookbook/chapters/contents2.shtml)
  distinguishes thoracic cage, lumbar vertebrae and pelvic girdle. Our blended regional widths
  represent those landmarks, not measured tissue volumes or individual vertebral joints.
- Observed motion: [Walter 2003, Kinematics of 90° running turns in wild mice](https://carrier.biology.utah.edu/Dave%27s%20PDF/Walter%20mice%20turning.pdf)
  filmed six mice at 250 Hz and reported stride-linked bouts of trunk rotation and flexion.
  Design inference: link central bending to gait and steering. The lateral sinusoid, gains and
  head-leading response are game approximations, not fits to that study's motion traces.
- Preview comparison with the supplied top baseline shows a more distinct waist and bending
  trunk. Side captures still show a long triangular muzzle, abrupt front torso/head contour
  and thick-looking ears. Brow/cheek and pinna geometry refinement remains pending.
- Desktop browser screenshots and short drags do not establish iPad performance, naturalistic
  gait, photorealism or physical handling quality. Anatomy is not considered finished.
