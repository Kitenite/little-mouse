# Visuals, surfaces and iPad rendering

## Owner requirements

Create a textured 3D prey game with clear silhouettes and substantial color variety. The owner
prioritizes this cat's engagement over perfect realism; photographic indistinguishability is not
an acceptance gate. Keep comparing motion and anatomy with real prey where useful.
The background must be configurable live, including image choices and quiet high-contrast floors.
Preserve visual quality while optimizing for iPad. Soft fuzzy silhouettes and articulated anatomy
are owned by [anatomy and motion](anatomy-motion.md).

## Implemented in source

Three.js renders textured geometry, shadows, adjustable lighting and cosmetic blood. The shared
schema exposes brightness, lighting preset, direction/elevation/intensity, shadow opacity/softness
and fur roughness. These are raster lighting and shadows, not ray/path tracing.

Surfaces offer 30 choices: 23 procedural/plain materials, four additional quiet contrast colors,
and three local photo-style background images (linen blanket, woodland clearing and blond boards).
Plain/linen support custom color; named materials retain their own palettes. Texture scale and
contrast remain adjustable. Image center areas are open, with cloth/vegetation details toward edges.
Those edge details are only pixels: they do not occlude the mouse or create physical hiding places.

Procedural backgrounds use deterministic static SVG tiles and a bounded cache. Images are
1024 × 1024 local JPEGs, 1.29 MB combined; only the selected image is requested. They were generated
with the built-in imagegen tool, inspected, then optimized. See [image provenance and prompts](../little-mouse/public/assets/backgrounds/PROVENANCE.md). No runtime remote asset dependency exists.

Image contrast applies to a separate CSS background layer, leaving the mouse and HUD untouched.
Image scale 1 shows the complete composition; values 1–2.5 zoom without repeating and values below
1 retain the complete image. Procedural scale 0.5–2.5 changes the repeating texture size.
The transparent WebGL layer and shadow receiver sit above either type of surface.
The rich launch preset selects the woodland clearing image with contrast 0.8, mixed coats and
soft daylight. This is an owner-facing starting point, not evidence that this background is
optimal for feline vision; quiet plain/contrast surfaces remain available for comparison.

Twenty-two stable coats include brown, gray, cream, white, black, pied, checker, blue, yellow,
orange, teal, magenta and violet, with stripe, speckle and mottled options.
Palettes are All coats (default), Natural variety, Light/dark/patterned, and Vibrant colors/patterns.
Coat brightness and color strength are independent of anatomy. A living mouse keeps its identity
through hiding and nonfatal reactions; explicit settings changes can rebuild its appearance.
The shared photographic fur map is neutralized before tinting, so bright colors are not multiplied
by a second brown tint. Named coat texture caching remains bounded to 22 maps; numeric controls
change material colors rather than allocate a texture per value. Saturated colors and graphic patterns are
intentional playful options, not natural species claims or claims about what cats prefer.

The renderer caps iPad pixel ratio at 1.5 for gameplay and 1 for preview. Game rendering is
scheduled at up to 60 Hz and preview at 30 Hz; these are caps, not measured device FPS.
Portrait/landscape resize must preserve contact-coordinate alignment and safe owner access.

## Acceptance criteria and pending validation

- Inspect stills and motion at actual iPad scale; prioritize readable movement and this cat's response.
- Check pale/dark/patterned coats across plain, image and busy backgrounds. Color differences alone
  are not sufficient evidence of feline visibility or interest.
- Background changes must not tint/filter the mouse or suppress shadows unintentionally.
- Largest mice and longest tails exit fully without popping; blood/effects remain bounded.
- Check for detached fur, clipping appendages, hard seams and repeated texture artifacts.
- Measure sustained frame cadence, input response, memory and heat on physical iPad, including
  supported high-count settings. Desktop rendering and software tests do not establish device FPS.
- Generated images are visual materials, not scientific or wildlife reference evidence.

Source owners: `mouse3d.js`, `lighting.js`, `backgrounds.js`, `backgrounds.css`, `coat-palette.js`,
`mouse-identity.js` and shared settings. Tests include backgrounds, coat-palette, lighting,
mouse-model and mouse-identity. Pending validation: physical iPad visual quality and this cat's
response to the new palettes and image scenes. No scientifically validated engagement claim.
