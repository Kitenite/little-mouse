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
  damage immunity or create a second claim. Quick harmless release suppresses a second squeak;
  a harmful outcome replaces the prior cue according to the current audio policy.
- Renderer contact geometry selects body/head, articulated paw index/offset, or tail fraction.
- One pointer owns at most one mouse; a claimed mouse cannot be claimed by another pointer.
- Head/body hold anchors the contacted point. Paw holds pivot within a short tether; tail holds
  use a fraction-dependent tether and preserve rearward tail geometry.
- Drag anchors follow at a bounded 800 CSS px/s. Paw/tail bodies travel with their anchors,
  retaining local escape/tether motion. Claimed mice remain kinematic during collisions.
  Release recency is stamped by actual integrated anchor displacement, not pointer-event
  arrival; redundant no-displacement events cannot change the outcome. Release uses
  recent filtered actual anchor motion for a
  bounded toss; zero-time events and huge pointer jumps cannot create unbounded velocity.
- Each completed tap/hold release counts once. Move events never repeatedly injure a mouse.
- Cancel, lost capture, blur, pause, hide, resize and reload clear claims without hit outcomes.
- Pending claims freeze anatomical pose and suppress eating immediately. Active grabs add
  bounded, damped yielding driven by actual capped drag displacement/acceleration and turns.
  Head grabs soften the trunk/pelvis; body grabs let head and pelvis counterbalance;
  forepaw/hindpaw grabs emphasize opposite regions; tail grabs leave the neck/trunk freer.
- Head/body grabs retain the captured material coordinate using a shared CPU/shader translation
  correction. The solver still owns world position/heading. Paw targets override free-limb lag
  after body deformation; tail fractions retain the existing reachable two-anchor constraint.
- `dragCompliance` controls yielding strength; `dragDamping` controls settling. Release/cancel
  smoothly decay pose and translation without adding throw energy or another hit. Pending
  re-grabs freeze residual pose until activation. Hidden/teleport/backwards-time resets clear
  drag history; zero/invalid dt preserves it. No new roll/lift or ground penetration is added.
- Released tail bows relax segment directions and lengths before free-chain limits resume;
  material fractions transition continuously. Re-grab/reset clears this geometric bridge;
  pause freezes it. This avoids constraint snaps without injecting throw/Verlet energy.
- Existing maximum limb/tail reach remains authoritative: impossible targets project onto
  reachable geometry rather than stretch. Exact pin claims apply to reachable anchors only.
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
integration and renderer `contactAt`. Tests: `contact`, `touch-reactions`, `held-paw`, `drag-pose`, `mouse-model`, `enrichment`.
Limit: touch events reveal contact patches only; no camera/body tracking or offscreen paw detection.

World-solver alternatives and the current adoption gate: [physics decision](physics-engine-decision.md).

## Drag response evidence and limits

The planar compliant pose is a game approximation, not anatomical tissue or a dynamics engine.
Focused simulations cover all parts, both drag directions/reversal, settling, pause, re-grab,
release/cancel decay, hidden/teleport reset and 30/60/120 Hz paths. Browser driving exercised
head/body, all four paws and tail; reachable rendered pins followed the capped anchor while
free regions yielded. This does not establish real-mouse motion or physical-device quality.
Textures, GroundResponse ordering and recorded-only audio remain separate contracts.
Tail-root feedback still reaches physics on the next frame; this is not exact authoritative
world-tether parity during pelvis motion. The renderer clamps fractions below .125; the
headless .05 fallback does not promise an exact rendered pin. Setting compliance to zero
stops new forcing and lets existing residual settle, rather than snapping the pose.
