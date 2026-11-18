# Touch and resting paws

## Owner requirements

Clicks/taps near a mouse and elsewhere on screen must receive contextual attention.
Direct hits should vary: some harmless, some injured, some defeated. Requested cosmetic
responses include squashing, blood, fleeing, limping and stronger impacts.
Contact location matters: head, body, forepaw, hindpaw and tail behave differently.
A sustained paw can restrain, drag and release/toss a mouse. A cat may sit or stand on the
screen; retain those touch areas and route around them instead of running underneath.

## Implemented lifecycle

- Pointerdown claims a mouse without immediate injury, death or score. Hold activation defaults
  to 0.25 seconds (configurable 0.15–1); quick release resolves a tap.
- Every visible mouse contact gives immediate gentle audio feedback while play and sound are
  enabled, including harmless, invulnerable and already-held mice. Feedback does not bypass
  damage immunity or create a second claim. Release adds the contextual reaction sound.
- Renderer contact geometry selects body/head, articulated paw index/offset, or tail fraction.
- One pointer owns at most one mouse; a claimed mouse cannot be claimed by another pointer.
- Head/body hold anchors the contacted point. Paw holds pivot within a short tether; tail holds
  use a fraction-dependent tether and preserve rearward tail geometry.
- Drag anchors follow at a bounded 800 CSS px/s. Paw/tail bodies travel with their anchors,
  retaining local escape/tether motion. Claimed mice remain kinematic during collisions.
  Release uses recent filtered actual anchor motion for a
  bounded toss; zero-time events and huge pointer jumps cannot create unbounded velocity.
- Each completed tap/hold release counts once. Move events never repeatedly injure a mouse.
- Cancel, lost capture, blur, pause, hide, resize and reload clear claims without hit outcomes.
- Initial claims freeze anatomical contact geometry and suppress eating immediately.
- Zero/invalid time steps preserve positions, velocities and anchors; catch-up work is bounded.

Harmless probability defaults to 0.35 with region modifiers. Harmless flinch/freeze/dodge
and held-release escape remain distinct from injury. Paw/tail harmful reactions favor
limp or escape and cannot select body squash/defeat. Head responses favor stun/escape.
Blood is excluded for harmless and tossed outcomes. `behavior.js` owns exact weights.

## Spatial memory

Every active pointer, including misses, becomes a persistent footprint, bounded to ten.
Contact width/height contributes to radius; configurable resting-paw clearance defaults to
50 CSS pixels plus mouse clearance. Captured mice use their own hold constraints.

On release, a timestamped footprint remains for four simulation seconds with decaying
avoidance. Active footprints take precedence in the ten-obstacle budget. Remembered
footprints affect steering and cover/reentry; they do not act as physical walls.
No route target resets every frame solely because a paw remains down.

## Acceptance criteria

- Exercise quick tap, threshold crossing, stationary hold, slow drag, fast release, cancellation,
  two independent catches and competing pointers on one mouse.
- A miss remains an obstacle until release; released footprints shrink then expire.
- Fully covered entry waits; partial obstruction produces a bounded detour.
- Actual event contact sizes increase clearance. Released memory never physically pushes a mouse.
- Long presses do not accidentally trigger owner menus; normal release resolves once.
- Rotated renderer hit coordinates anchor the correct side; tail/paw identity survives the claim.

Source owners: `contact.js`, `behavior.js`, `physics.js`, `enrichment.js`, game pointer/frame
integration and renderer `contactAt`. Tests: `contact`, `touch-reactions`, `held-paw`, `enrichment`.
Limit: touch events reveal contact patches only; no camera/body tracking or offscreen paw detection.

World-solver alternatives and the current adoption gate: [physics decision](physics-engine-decision.md).
