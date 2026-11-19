# Continuous limb surfaces

## Implementation and ownership

`limb-surface.js` owns the visible envelope; `leg-rig.js` still owns targets, IK and paw pose.
`createLimbSurface(T, parent, material, layout)` creates one capped mesh per limb.
Call `leg.surface.update(leg.anchor, solution.joint, solution.foot)` immediately after
`solveLeg`. The update only reads these coordinates; it never changes the chain or target.
The part-drag worker's target offset belongs before `applyHeldPawTarget`, so selected-paw
pinning remains authoritative. Root must preserve both hooks during integration.

Each envelope has 21 rings × 12 radial segments, plus two cap vertices: 275 vertices and
504 triangles. A rounded connector occupies the middle fifth of the chain; upper/lower
shafts follow the actual solved bones. Radius decreases from shoulder/thigh through the
elbow/knee to the wrist/ankle. Hind thighs are fuller than forearms; layout width scales
radius, while solved bone length incorporates armLength/legLength and stable individual ratios.

Each mouse now has independently seeded fore/hind length (±12%), thickness (±18%),
upper/lower segment ratio and paw dimensions (length ±20%, additional width ±10%).
Left/right length and thickness differences stay within ±2.5% of the pair value.
Body variety scales all these differences; zero restores symmetric standard proportions.
The ratio shifts the elbow/knee while preserving the pair’s total chain reach.
Existing leg length, arm length/width and hair controls compose with the individual factors.
Identity generation uses a separate random stream, preserving existing coats and ear traits.
Paw geometry and rendered-paw picking share the same dimensions; captured drag offsets
remain in model coordinates. Gait cadence is unchanged and anatomy does not imply injury.

Former shoulder, upper, lower and knee meshes are hidden, including their shadows. Their
transforms remain available for existing invariants and tools; they cannot protrude visually.
Paw groups and toes retain their distinct fine skin and transforms, with individual scaling
applied to both the geometry and contact dimensions.
The new surface uses the existing fine limb coat material and stable UVs. No new textures.

The runtime uses opaque tapered `createFurVolume` tufts on the final solved surface, driven by
armHairiness, furLength and Fuzziness; see [fur-volume.md](fur-volume.md). They replace the
original sphere hair children and the intermediate envelope line hairs. Four limb volumes
share one coat material, sample root UVs, and do not apply the anatomy shader a second time.

## Resource and deformation bounds

Position/normal/UV/index buffers and temporary vectors are allocated once. Animation mutates
existing position and normal buffers, plus volume tuft positions/normals; no new geometry, arrays, materials
or textures are created by the surface update. The loop bound is fixed by ring/hair counts.
Four envelope meshes add 1,100 vertices / 2,016 triangles per mouse, while hidden spheres
stop drawing. Four surface volume draws replace eight bone hair draws.
Existing model traversal disposes envelope/hair geometries and shared model materials once;
shared regional texture maps retain their existing bounded-cache lifecycle.

## Reference and design inference

The [Montesinos specimen photograph](https://www.inaturalist.org/photos/139684873),
[license and provenance](https://commons.wikimedia.org/wiki/File:Mus_musculus_139684873.jpg),
was inspected in the preceding texture pass. It shows continuous furred limb surfaces tapering
into finer bare-looking digits, rather than separated spherical joint outlines. It is a static,
apparently deceased specimen; it supplies no living gait or handling evidence.
Our tapered tubes and rounded bend are a game rendering approximation, not measured muscle,
skin sliding, soft tissue simulation, or a scientifically validated reconstruction.

## Validation and remaining limits

Same identity 314159, agouti, daylight: [before](evidence/limb-surface/mouse-limb-balls-baseline.png)
and [after](evidence/limb-surface/mouse-limb-envelope.png) were captured and viewed in desktop
Chrome. The before fixture exposes the retained original spheres; all other geometry/pose is
the same. Top and side rows show rest, grooming and a pinned hindpaw. Joint balls disappear;
the taper and connected bend are visible, especially at the extended hindleg.
Preview: `/review/limbs.html`. This intentionally evaluates surfaces independently of new
part-drag inertia, which is developed on a separate branch and still needs combined review.

Focused tests cover fore/hind limbs, width/length extrema, degenerate and unreachable targets,
seam closure, taper, finite normals, stable buffers, hair limits, disposal, paw pinning and
existing body/head/tail/paw contact invariants. Browser rebuild check: three cycles adding
and removing eight mice at changing width/hair density held GPU textures at 13; geometries
returned from 137 to 17 after every cycle. This is not full process-memory measurement.

Limits: body/limb and wrist/paw remain overlapping surfaces rather than a single welded animal.
The end caps avoid holes, but extreme folding may self-overlap, and no skin-collision solver
is introduced. Side view still exposes existing torso/muzzle silhouette issues. Browser Playground drags confirmed head, body, tail, forepaw and hindpaw claims with this
envelope (captures in the same evidence directory). Combined new drag-inertia integration,
physical iPad performance and visual acceptance remain pending. No deployment or photorealism claim.
