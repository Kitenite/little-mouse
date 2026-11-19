# Fur library comparison

Status: working Babylon.js comparison integrated; existing Three.js renderer remains the game default.
Owner: root. Review route: `/review/fur-library.html`, available locally and in built assets.
Dependencies pinned to `@babylonjs/core` and `@babylonjs/materials` 9.37.1; no CDN dependency.
`npm run build:fur-library` rebuilds the 1.5 MB vendor bundle using pinned esbuild; normal
build runs it automatically. Apache-2.0 license is copied into public/vendor.
The normal game does not import or download this bundle; it is loaded by the review route.

## Implemented comparison

The official FurMaterial/FurifyMesh implementation renders actual mouse body and limb surfaces.
Both columns use the same identity, coat textures, articulated model, pose and camera.
Controls expose 8/16/24/32 shells, rest/run/groom/hold, top/side view, animation and measurement.
The adapter transforms the body on CPU and uploads the existing solved limb envelopes.
Shell meshes share source geometry; updates propagate to every shell. Coat texture copies
refresh when their Three.js source updates. Noise uses the library's channel encoding with a
seeded stream, so shell comparisons do not regenerate unrelated random fur.
The library's decorative animation clock is frozen; movement comes from the shared rig.
Changing shell counts disposes/recreates the scene and engine. Repeated 24→8→16 changes
returned to 107 meshes / 6 textures at 16 shells without console errors in the desktop pane.

## Measurements and decision

One mouse, running pose, 640×400 backing buffers, desktop Chromium. Twenty warm-up frames,
120 measured frames, alternating renderer order, GL finish per sample. Shared animation time
is excluded; Babylon timing includes the geometry adapter. Measurements are coarse browser
wall-clock timings, not hardware GPU timer queries or physical iPad results.

| Renderer | Draws | Triangles | Median ms | p95 ms |
| --- | ---: | ---: | ---: | ---: |
| Existing tufts | 39 | 53,708 | 0.1 | 0.2 |
| Babylon, 8 shells | 67 | 92,976 | 1.0 | 1.2 |
| Babylon, 16 shells | 107 | 166,704 | 1.1 | 1.7 |

[Viewed comparison screenshot](evidence/fur-library/comparison.png).
Raw output: [8 shells](evidence/fur-library/run-8.json), [16 shells](evidence/fur-library/run-16.json).
Timings are of this adapter, not an intrinsic ranking of rendering engines. Similar timings
at both shell counts suggest adapter/CPU cost or timer resolution may dominate here.
The existing renderer stays the production default: it has lower measured cost in this setup
and preserves features the adapter does not yet reproduce. The library comparison remains
available for future tuning instead of switching the cat's game to an incomplete renderer.

## Limits

Babylon's stock lighting differs from Three.js PBR/tone mapping; this is not a pixel-matched
material comparison. The adapter omits whisker lines, environment effects and native shadow
matching. Regional grooming, local contact compression, fur family controls and exact material
parity would require further integration; the library itself is extensible.
The viewed library result has a smoother/darker coat than current tufts. Shell selection and
occlusion/tint tuning affect that result. No claim of physical iPad superiority, photorealism
or improved cat engagement follows from this desktop test. Migration is not complete.

## Primary sources

- [Official FurMaterial source](https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/materials/src/fur/furMaterial.ts).
- Installed exact 9.37.1 source and shaders under `node_modules/@babylonjs/materials/fur`.
- [Three.js instancing](https://threejs.org/docs/pages/InstancedMesh.html) is infrastructure,
  not a drop-in fur material. Current tufts already batch into five volume draws.
