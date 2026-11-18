# Background material integration

`public/backgrounds.js` provides 30 offline surfaces: four existing IDs (`linen`, `plain`, `wood`, `night`) remain compatible, plus walnut, birch, weathered boards, basketweave parquet, marble, limestone, slate, terrazzo, ceramic, terracotta, concrete, cork, felt, woven rug, denim, paper, grass, earth and sand. Image choices are photo-linen, photo-clearing and photo-boards; quiet contrast colors are chalk, ink, pale-blue and warm-yellow.

Import `backgroundCatalog`, `backgroundDefaults`, `backgroundControls`, and `applyBackground`. Spread `backgroundDefaults` into settings defaults; use the catalog to populate both background selectors. Replace the current game background routine with `applyBackground(document.getElementById('game'), config)`. Load `backgrounds.css` after `style.css` for legible overlays on dark surfaces. The same function works for companion swatches using `.background-preview`.

Numeric settings to allow in persistence, API validation, and companion sync:

| Setting | Default | Range | Step | Purpose |
| --- | --- | --- | --- | --- |
| `backgroundScale` | 1 | 0.5–2.5 | 0.05 | Physical size of grain, weave, tiles and planks |
| `backgroundContrast` | 1 | 0–2 | 0.05 | Strength of material marks; zero yields a smooth material-colored floor |

`backgroundColor` customizes plain and linen. Other materials use their own palettes so selecting walnut actually looks different from selecting marble. Textures are transparent layers over that palette, so reducing contrast never changes mouse rendering. `backgroundTone` is set on the target element to keep HUD text readable.

Procedural materials are deterministic, static 512px SVG tiles built in JavaScript and embedded as data URLs, with no external assets, requests, SVG filters or animated backgrounds. Texture generation happens only when applying settings; the most recent 32 ID/contrast combinations are cached, and texture scale reuses the same image. Do not call `applyBackground` per frame. Existing alpha WebGL canvas and Three.js shadow receiver remain above the floor.

Image choices load local generated JPEGs through a separate CSS pseudo-element so contrast does not filter the mice. Image scale below 1 preserves the whole image; 1–2.5 zooms without tiling. Source prompts and provenance live in `public/assets/backgrounds/PROVENANCE.md`. These are flat surface approximations, not photographic PBR floor meshes or ray tracing. A future physically lit floor shader could reuse the palette and catalog contract. Background texture and contrast should be tuned with the actual cat: visually busy floors can camouflage the mouse.

Checks: `node --check public/backgrounds.js`; `node --test tests/backgrounds.test.mjs`.
