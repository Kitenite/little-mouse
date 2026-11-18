# Coat surfaces: implementation and evidence

## Contract

Implemented in `little-mouse/public/coat-surfaces.js`; no geometry or audio changes.
`createSurfaceCache(T)` owns a fixed ten-map cache: six linear relief maps, four sRGB skin
albedo maps, each 256². `applyCoatSurfaces(T, cache, parts)` runs once during construction.
Parts: `{bodyMaterial, fur, ears, legRig, tail, nose, traits}`. Each leg supplies
`upper`, `lower`, `shoulder`, `knee`, a traversable `paw`, and optional `surface.mesh`.
The continuous limb envelope receives the same fine limb material as its hidden bones. Ears contain mesh children.
The nose must be captured from the existing ellipsoid construction.

Preserve rest UVs: body v=0 rump, v=1 muzzle, u wraps circumference. Body albedo repeat is
(1,1), so face fading stays on the face. Tail UVs remain along the rest centerline, with
three repeats of the skin tile. No world-space sampling, shader replacement, or frame-time
texture creation occurs. Geometry and contact ownership remains with the anatomy lead.

`map.userData.mouseSurface` marks shared cache resources. Exclude these from per-mouse
texture disposal. Material clones remain model-owned; the replaced skin material and
original ear maps are disposed. The existing fur material remains used by the jaw.
Eyes retain the original glossy physical material. Existing body/arm geometric hair-density
and fuzz controls remain intact; new microtexture is surface detail independent of them.

Memory ceiling added: 10 × 256² × 4 × 4/3 = 3.33 MiB GPU including mipmaps, plus about
2.5 MiB canvas backing. Existing named coat maps remain bounded at 22 (~7.33 MiB GPU).
These are texture estimates, not complete process-memory or physical-iPad measurements.

## Reference provenance and observed evidence

Inspected 2026-11-17; photographs were viewed locally, not copied into shipped assets.
- [Daniel Montesinos, Mus musculus, 29 June 2021](https://www.inaturalist.org/photos/139684873),
  [Commons source/license](https://commons.wikimedia.org/wiki/File:Mus_musculus_139684873.jpg),
  CC BY 4.0. The close specimen photograph shows directional mixed-length body hairs,
  finer face/limb fur, bare-looking folded ear skin and sparsely covered digits. The animal
  appears deceased; it supplies surface reference only, never motion or welfare evidence.
- [H. Zell, Mus musculus 01, 2 August 2009](https://commons.wikimedia.org/wiki/File:Mus_musculus_01.JPG),
  CC BY-SA 3.0 / GFDL. Museum scene shows dense coats and distinct pale tails/feet;
  display/specimen condition and lighting limit color and living-animal inference.

Design inference: separate fur relief from coat markings, use finer muzzle/limb detail,
low-contrast tail rings with sparse stroke hairs, subtle ear rim/crease detail, and distinct
nose/paw pore relief. Procedural marks are authored approximations, not scanned tissue.
No generated bitmap dependency is required. Existing photographic texture provenance is
unchanged. Bright graphic coats remain intentional playful choices.

## Browser evidence and limitations

Root baseline `/tmp/mouse-before-anatomy-texture.png` was viewed: repeated stripes continued
onto the pointed muzzle; eye highlights were crisp; ears appeared thick and opaque.
Committed captures in [evidence/texture-lead](evidence/texture-lead/) show identical seed
314159 / coat 19 under daylight and moonlight on pale/dark floors, plus an agouti close-up.
The standalone `public/review/coat.html` fixture uses fixed seed and pose for comparison;
its explicit coat override selects lemon stripes rather than rolling another identity.

Observed: fine body streaks read more clearly, tail rings are restrained, and eyes remain
crisp on both floors. Whole-body albedo tiles make playful stripes broader; face attenuation
reduces but does not eliminate markings. Natural coat still looks like short surface strokes,
not the deeper layered reference fur. Ear shading remains opaque, fine pores are subtle at
play scale, and the baseline straight tapered tail/pear silhouette need anatomy integration.
No photorealism, deployment, feline-response or physical-device quality claim is made.

Desktop Chrome WebGL: three cycles creating eight additional same-coat mice with changed
brightness and removing them kept texture count at 13; geometry count returned 137 → 17
on every removal. This verifies this rebuild path, not all browser/driver memory behavior.
17 focused tests cover deterministic region generation, finite cache keys, distinct color
spaces, stable identity, UV invariance while bending/holding, crisp eye material settings,
and shared maps surviving individual disposal. Root integrated anatomy and environment; browser shader/contact smoke passed. Physical iPad review remains pending.
