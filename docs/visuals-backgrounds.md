# Visuals, surfaces and iPad rendering

## Owner requirements

Create a textured 3D prey game with clear silhouettes and substantial color variety. The owner
prioritizes this cat's engagement over perfect realism; photographic indistinguishability is not
an acceptance gate. Keep comparing motion and anatomy with real prey where useful.
The background must be configurable locally, including image choices and quiet high-contrast floors.
Preserve visual quality while optimizing for iPad. Soft fuzzy silhouettes and articulated anatomy
are owned by [anatomy and motion](anatomy-motion.md).

## Landing and owner settings

**Implemented:** Podrick’s Violin opens as a small illustrated storybook: warm parchment,
dark ink, slightly crooked borders and serif lettering. The supplied cats remain the central
illustration, untrimmed. This is an original-art, Don’t Starve-inspired mood; no game assets
were copied. `public/assets/brand/podrick-cats.png` is a byte-for-byte copy of the supplied
`ipad/assets/icon.png` at rebrand commit `111d371`; the full original remains untouched.

One Play button is the entry point. Sound & settings is collapsed by default on all surfaces;
local controls remain available in a bounded scrolling panel. Pairing, remote-control links,
research links and playground entry points do not appear on the landing. The owner corner
exit and Escape are explained quietly below Play. Boot failure keeps a visible Retry button.
Native home renders the existing Game with DEFAULT_GAME directly; splash/config and Game
loading/error presentation belong to their native owners. No duplicate native menu remains.

The hidden preview canvas remains as a 1px compatibility target for the current renderer;
removing that renderer allocation is outside this presentation change. Gameplay canvas,
floors, mouse physics and behavior are not restyled by the landing illustration.
Browser evidence and remaining device limits: [UI handoff](cycles/podrick-ui.md).

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

Ground response is implemented in `environment.js` / `environment3d.js`: temporary low-opacity
compression on cloth/cork/paper, soil impressions with sparse settling grit on clearing/earth/sand,
and sparse tapered grass blades that bend about fixed ground roots. Boards, stone, tile and quiet plain floors emit
nothing. No image-pixel obstacles, photo deformation, glowing rings, ray tracing or new bitmap assets.
The woodland center stays soil: this pass does not synthesize leaf fragments at photographic edges.
`environmentStrength` updates existing marks live, including while paused (zero clears/disables); `environmentPersistence` sets finite lifetime.
Both use the shared settings schema for local validation.

Rendered paw positions transformed by the mouse group supply contact samples; ground height and
actual displacement gate emission, not speed/intent or cadence alone. Airborne paws reset history;
landing seeds a new stance. Head/body claims leave wider drag compression even before activation;
paw/tail holds use grounded feet. Stationary contacts do not repeatedly stamp. Claim-mode changes reset foot and drag history. Spatial resampling
is capped at eight samples per foot or body per render; extreme discontinuities discard backlog.
The height threshold is an approximate contact test, not a force solver or pressure/deformation model.

One pooled instanced draw holds at most 160 marks (320 triangles), with reusable sample buffers and
no per-mark allocations. Exponential age decay and short grit/blade settling use simulation time.
Disable and hard materials skip contact transforms. Surface, size, resize, backward time, long gaps
and teleports clear memory; hidden/respawn/toss samples reseed. Paused simulation freezes decay.
The visual module owns no audio; surface sound integration is maintained separately by the audio owner.

Twenty-two stable coats include brown, gray, cream, white, black, pied, checker, blue, yellow,
orange, teal, magenta and violet, with stripe, speckle and mottled options.
Palettes are All coats (default), Natural variety, Light/dark/patterned, and Vibrant colors/patterns.
Coat brightness and color strength are independent of anatomy. A living mouse keeps its identity
through hiding and nonfatal reactions; explicit settings changes can rebuild its appearance.
The shared photographic fur map is neutralized before tinting, so bright colors are not multiplied
by a second brown tint. Named coat texture caching remains bounded to 22 maps; numeric controls
change material colors rather than allocate a texture per value. Saturated colors and graphic patterns are
intentional playful options, not natural species claims or claims about what cats prefer.

Region-specific surface relief now separates body/limb fibers from ear, tail, nose and paw skin.
Ten shared 256² textures (six linear relief, four sRGB skin color maps) add a fixed ~3.33 MiB
GPU mipmapped budget plus ~2.5 MiB canvas backing; they never vary by seed or control value.
The existing 22-map named coat cache remains separate (~7.33 MiB GPU with mipmaps).
UVs stay attached through deformation. Body albedo uses one whole-body tile and fades markings
near the muzzle; this makes graphic stripes broader than the former repeated tile.
No image post-blur or eye material change is used. Region material clones are model-owned;
shared maps survive individual disposal. See [surface evidence and contract](coat-surfaces.md).

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
`mouse-identity.js` and shared settings. Tests include environment, backgrounds, coat-palette, lighting,
mouse-model and mouse-identity. Pending validation: physical iPad visual quality and this cat's
response to the new palettes and image scenes. No scientifically validated engagement claim.
