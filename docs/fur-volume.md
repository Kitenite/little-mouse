# Geometric coat depth and Fuzziness

## Implemented representation

`fur-volume.js` builds opaque, tapered, three-triangle tufts. One body/head mesh replaces
both the old transparent LineSegments coat and point halo. Four limb volumes replace the
intermediate line hairs on continuous limb envelopes. This is replacement, not another full
coat layer. No new textures, translucent whole-animal blur, or alpha overdraw layers.
The coat samples the existing named albedo map, preserving playful markings and tint.

The body samples source triangles by surface area. Each tuft records a triangle plus
barycentric root weights. All five tuft vertices use that root's rest UV. Muzzle tufts are
shorter/finer with smooth rest-v transitions (.60–.70 and .73–.83), retaining
body scale1 and muzzle scale.24; limb tufts taper toward paws. Bare ears, nose, paw skin and tail receive no
volume meshes. Existing eye material remains glossy and separate.

Lit `MeshStandardMaterial` tufts write depth and receive scene shadows. They do not cast
extra shadow-map draws; the underlying animal supplies shadows. Tuft-normal variation catches
light and occludes nearby surface pixels; this is not strand scattering or self-shadowed fur.
Live materialRoughness updates body, body volume, limb surface and limb volume together;
ears, nose, paws and tail retain their separate roughness contracts.

## Controls and identity

The user-visible **Fuzziness** control reuses `furSoftness` (0–1, default .5), preserving
saved profiles and numeric API. Both shared settings registry and legacy identity labels agree.
Game, companion and playground expose the same control. At zero the tufts lie close to the
surface; at one they spread and lift to varied shoulder heights, with curled tips.
Existing seeded shade variation supplies loft diversity without additional random draws,
buffers or triangles. Counts, nominal lengths, roots and UVs stay unchanged
when only Fuzziness changes. This differs from hair density and furLength.

Identity, coat selection, shade, anatomy and attachments retain their existing seeded values.
Changing body density consumes a different number of coat RNG draws and resamples subsequent
limb tufts; this is coat appearance only, not an individual/geometry identity reroll.
Zero density hides the five volume draws and skips tuft update loops. Empty resources and the
body source-area table still exist; zero density is not literally zero initialization cost.

## Deformation contract

Body buffers are static rest geometry. Existing `rigShader` receives the shared anatomy
pose/scale/spine/offset uniforms, so body fur follows composed articulation and drag exactly
once. Sway occurs after articulation and projects against `articulateMouseNormal(position,
hairNormal)`; using the rest normal here allowed inward tip displacement on bent regions.
Root flex is zero. The regression exercises a nonzero combined bend and posed projection.

Limb volumes sample final solved envelope positions/normals each update, after `solveLeg` and
surface deformation. They do not use the anatomy shader or add another drag offset. Surface
UVs remain rest coordinates. Updates reuse typed arrays and preallocated vectors; no geometry,
materials, texture creation or per-tuft arrays occur per frame. Pause preserves pose/buffers.

## Explicit budget

- Body: 7,200 nominal default tufts × bodyHairiness, capped at 10,800.
- Limbs: 300 × armHairiness per limb, capped at 520 each. Four share one material.
- Each tuft: five vertices, three triangles, opaque double-sided material; five total draws.
- Hard cap: 12,880 tufts, 38,640 added triangles. Body maximum 54,000 vertices fits Uint16.
- Maximum volume GPU geometry buffers: 4,095,840 bytes (~3.91 MiB), excluding driver overhead.
- Retained CPU typed arrays: 4,508,000 bytes (~4.30 MiB), plus temporary body area CDF
  28,800 bytes for the current body topology. Geometry buffers are included in that CPU sum.
- Body geometry is uploaded once. Maximum limb update uploads: 374,400 bytes/frame for
  position, normal and hairNormal, plus existing envelope updates. No new coat-map allocations.
- These are per-mouse volume budgets; eight maximum mice can multiply them by eight.
  Sustained physical-iPad GPU/CPU, memory, heat and FPS have not been measured.

## Evidence and limits

The prior [surface reference provenance](coat-surfaces.md#reference-provenance-and-observed-evidence)
remains applicable: photographs show layered directional fur, but do not validate this rendering.
The authored tufts approximate that depth; no scanned tissue or scientific efficacy claim.

Viewed [captures](evidence/fur-volume/): agouti normal play scale and close-up, max density/
length, lemon stripes, bare control, and Fuzziness 0/1 with length/density fixed. Each fixture
shows top/side rest, groom, run bend and active hindpaw drag with the actual drag dependency.
`/review/fur.html` accepts `close=1`, `coat=19`, `level=max|bare`, and `fuzz=0|1`.
The [previous limb capture](evidence/limb-surface/mouse-limb-envelope.png) retains the old
line/point coat for comparison. New edges have clear depth and stripes remain readable;
Maximum fuzziness now has a tighter curled outline, but retains a dark stippled rim, not plush fur.
Current bounded iteration evidence and independent review: [coat cycle](cycles/coat.md). Existing sharp rump/head contours remain.

Desktop fixture: default 39 draws / 53,708 triangles, maximum 66,398 triangles, bare 34 draws /
28,466 triangles; counts include the rest of the mouse and vary with identity/settings.
Three eight-mouse reconfigure/removal cycles held texture count at 12 and returned geometry
count from 128 to 16 every time. Fuzziness labels were read from all three browser UIs.
Tests cover barycentric root positions and UV values, stable identity, count/length-independent
Fuzziness, posed-normal sway, pause, shared uniforms, live roughness, exact disposal and pins.
Independent read-only reviewer found no remaining blocker after the projection fix and
Fuzziness tests; three-UI/resource-cycle browser checks were lead-run, not independently rerun.
Full local suite: 220 tests passed; build passed. No deployment, physical-device quality,
photorealism or feline-response claim.
