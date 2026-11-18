# Validation and research policy

## What must be demonstrated

Keep four questions separate: does the policy behave correctly; does the mouse look/move
convincingly; does the installed iPad work well; does this individual cat choose to engage?
Passing one does not establish the others. The owner explicitly requested critique agents
and comparison with real prey; request focused independent review for major motion changes.

## Automated acceptance

Run relevant tests after changing their owning area; run the full game suite and build before
release. From `little-mouse`: `npm test` and `npm run build`. Native changes also require the
checks in `ipad/AGENTS.md`. Do not publish stale aggregate pass counts as current evidence.

- Seeded, multi-minute policy runs: phone/tablet dimensions, slow/fast pace, large mice,
  collisions, approach visibility, pause, manual control, injury and return cycles.
- Contact invariants: exact transformed anchors, bounded drag/toss, single resolution,
  cancellation, multipointer claims, active footprints and memory expiration.
- Geometry/motion: gait cadence, articulated held paws, tail constraints, morphology extremes,
  grounded whisker roots, secondary resets and idle coordination.
- Integration: stale settings polls, reconnect, owner gesture, session continuity and version reload.
- Audio: local activation, interruption, routing, missing clips, repetition and silence gates.

Regression tests should target observed failure modes and meaningful invariants, not mirror
implementation line by line. Failed or skipped checks remain explicit in handoffs.

## Visual and device review

Review stills plus slowed footage of starts, stops, turns, creep, flight, holds and releases.
Use actual mouse references with source attribution; record visible defects specifically.
A critique agent must distinguish source inspection, rendered inspection and real-device observation.
Measure device cadence and input response; listen on the physical speaker. Do not claim
physical-device, auditory or photorealism validation from a headless test or desktop screenshot.

## Research use

[Primary research notes](mouse-behavior-research.md) preserve citations and explicitly separate
observed evidence from our design inferences. Use primary studies for technical/scientific claims.
Species, environment and task differences matter: laboratory mice, wild mice, climbing,
physical toys and tablet play are not interchangeable experiments.
Authored timing, probabilities and fear variables are design choices, not fitted biology.
Blood and injury effects have no established benefit from the cited play studies.

Novelty and habituation motivate varied motifs; they do not justify an “addictive” claim.
Voluntary looking, tracking, tapping, departure and return can inform this cat's tuning.
Tap count alone is not happiness or welfare. Optional owner-led sessions and physical play
remain choices; research suggestions must not reintroduce the rejected automatic break.

## Evidence records

For a release or substantive critique, record the source revision, checks actually run,
viewport/device, settings/seed, observable result and remaining limitations. Keep current
requirements here; store substantial research in bounded focused notes, not an append-only log.
Historical review files and app README test counts are snapshots until reconfirmed.
