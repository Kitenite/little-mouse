# Background images

Generated for Little Mouse using the built-in `image_gen` tool on 2026-11-17. These are
AI-generated photo-style floor images, not licensed photographs or wildlife reference evidence.
The source PNGs were inspected, then converted to local 1024 × 1024 JPEGs at quality 82.
There are no third-party image downloads or runtime external dependencies.

| File | Intent | Bytes |
| --- | --- | --- |
| `linen-blanket.jpg` | Quiet pale fabric; folded border suggests cover | 402458 |
| `woodland-clearing.jpg` | Open soil center; leaves and grass frame the edge | 565547 |
| `blond-floor.jpg` | Pale boards; small corner mats and hay | 321888 |

## Final prompts

`linen-blanket.jpg`: Use case: photorealistic-natural. Asset type: offline full-screen iPad cat
game floor background, square 1024x1024. Extremely natural overhead photograph of a quiet pale
straw linen blanket laid flat, with a gently curved folded hem hugging only the outermost border
and fine loose threads at edges. Center 75 percent flat uncluttered pale oatmeal weave with subtle
natural irregularity. Camera perfectly top-down orthographic, no perspective or horizon, soft
diffuse neutral daylight with barely perceptible shadows. Entire image fills with textile. No
mice, animals, human, furniture, toy, text, watermark, frame or large dark objects. Calm warm pale
cream palette, low contrast center for a small dark mouse silhouette. Crisp organic photographic
fibers, no obvious repetitive grid or sharp noisy speckles. Borders suggest visual hiding places
only; no black holes or dark spots in the center.

`woodland-clearing.jpg`: Use case: photorealistic-natural. Square offline iPad cat game background,
clean playable forest clearing seen perfectly vertically from above. Photographic pale warm sandy
woodland floor with sparse dry golden grass, fallen oak leaves, moss and very small twigs framing
the outermost 12 percent. Center 76 percent open gently textured pale beige fine soil, no clutter
or focal object. Broad soft diffuse daylight, very low contrast shadows. Detailed natural organic
textures. Crisp photograph, no illustration. No animals, mice, bugs, humans, text, watermark,
border, horizon or perspective. Mouse sprites later placed in empty central area; preserve calm
center. Square composition; edge vegetation suggests hiding places, no scary dark hole.

`blond-floor.jpg`: Use case: photorealistic-natural. Square offline iPad cat game floor background.
Top-down overhead photograph of pale weathered blond wooden floor boards, realistic wide boards
with restrained grain and tactile tiny imperfections, a few strands of soft hay and loosely folded
neutral woven mat touching only extreme upper-left and lower-right corners. Center and edge
midpoints spacious flat open wood. Perfectly vertical orthographic camera, no walls, furniture,
perspective or horizon. Gentle diffuse daylight, warm cream and honey wood palette, low contrast
grain so a dark small moving animal remains easy to see. High natural photographic texture
detail. No animal, mouse, human, bugs, text, watermark or frame. Avoid dark knots, holes, busy
patterns or objects in center.

## Limits

Vegetation, cloth edges and hay are background pixels, not collision or occlusion geometry.
They do not prove that a cat will recognize cover. Image contrast is tuned on a separate CSS
layer so mouse colors are unaffected. Image scale zooms from 1 to 2.5 without tiling; values below
1 keep the whole composition. This differs intentionally from repeating procedural texture scale.
