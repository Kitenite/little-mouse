# Coat improvement cycle

## Ownership and batch

Builder `37be8626-484b-4e27-b7af-1786121687f7`; independent read-only critic
`4810cef5-e089-47fa-a5f4-f9f44907756e`; both in local Superset workspace
`5b5bc0ce-e628-499e-b026-143bf97a9de0`.
Worktree `/Users/kietho/workplace/mouse-cycle-coat`, branch `cycle-coat`.
Base `cf064cc`; no main edits, device commands, publication, audio changes or renderer hooks.
Completed bounded batch of two accepted iterations, not scheduled or perpetual execution.

## COAT-01: uniform maximum-fuzz bristles (P2)

Reproduced baseline `cf064cc`, direct source fixture (no bundled build):
`http://localhost:8797/review/fur.html?close=1&level=max&fuzz=1`.
Chrome158 headless on macOS, 1400×1450, DPR1; seed314159, agouti coat0,
body/arm density1.5, length1.8, fuzziness1, daylight/pale background.
Fixture simulates exactly60 steps at1/60 for rest/groom/run/held hindpaw, top/side.
Run speed180; hold pointer x=i*3,y=sin(i*.1)*20, final solved paw anchor unchanged.
Expected mixed, graduated short-fur silhouette; observed repeated raised bristle fringe.
[Before](../evidence/cycle-coat/before-max.png),
[after](../evidence/cycle-coat/after-max.png),
[playful normal-scale](../evidence/cycle-coat/after-stripe.png),
[sleek](../evidence/cycle-coat/after-sleek.png).
Reload reproduced; fixture has no pairing/session state to preserve.

Implemented mixed shoulder loft, downward-curled tips and gentler shading normals.
Reuses existing seeded shade; no RNG draws, allocations, vertices, textures or draws added.
Roots, lengths, identity, rest-UV coat samples, shared shader and solved limb source unchanged.
At max:39 draws/66,398 total triangles/16 geometries/12 textures per fixture panel,
identical before/after. Normal density:39 draws/53,708 triangles.
Existing maximum memory budgets in [fur volume](../fur-volume.md) remain unchanged.
Tests assert fixed barycentric roots, outward shoulders/tips at0/.5/1 fuzz and regional
boundaries, mixed loft, repeat-update stability and exact318 geometry bytes per tuft.
Critic independently ran32 focused tests and reloaded all8 panels; no blocking finding.
Critic requested accurate curled-tip wording and wider regression; both repaired.
Accepted iteration1 commit `388459d87f489c8ff1d4b1f5e1d41f49c7823a20`.

## COAT-02: abrupt face transition (P2)

Baseline iteration1 `388459d87f489c8ff1d4b1f5e1d41f49c7823a20`, same fixture/settings.
At v=.65±.000001 the regional scale jumped1→.55; at .78±.000001,.55→.24.
Expected smooth shortening toward face; discrete jumps produced density/length bands.
[Before](../evidence/cycle-coat/after-max.png) and
[after](../evidence/cycle-coat/after-graduated.png) retain the same camera and simulated input.
Smooth transitions over v=.60–.70 and .73–.83 retain body1 and muzzle.24 endpoints;
limb falloff unchanged. Both length and width grade together only at construction.
Tests cover monotonic continuity, regional minima/endpoints, seven RNG draws per body tuft,
root positions and fuzziness invariance. Render/resource counts unchanged from COAT-01.
Visual change subtle: graduated neck edge; no claim of resolving all dorsal stippling.
Full suite235 tests passed; build e48360fbd36d passed after installing locked dependencies.
Independent critic accepted:34 focused tests;10800-tuft prior/current comparison at
fuzz0/.5/1 preserved roots,UV,RNG continuation and plateau lengths/widths.
All8 live panels reproduced unchanged counts. Full suite/build are builder-run.
Accepted iteration2 commit `2549abc8975c4cb5758e239cc29598ce1931d917`.

## Reference comparison and remaining queue

Reopened/viewed [H. Zell own photograph,2009](https://commons.wikimedia.org/wiki/File:Mus_musculus_01.JPG),
CC BY-SA3.0/GFDL, museum specimens; existing provenance in coat-surfaces.md.
Observed reference: overlapping directional strands and less uniform coat edge.
Inference: varied shoulder loft/curled tips approximate that layering; not a physical fur model.
Specimen condition/photo resolution limit living-fur inference; no photo shipped as an asset.
Current outcome modestly softer/tighter, still dark stippling at dorsal rim; not plush or
photorealistic. Rump contour belongs to anatomy and is not masked by increased fuzz.
Next ranked issue: dark dorsal stippling under side lighting; assess after anatomy integration.
Physical-iPad quality, sustained performance/heat and actual feline response remain unmeasured.
