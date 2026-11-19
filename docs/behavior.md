# Mouse behavior

## Owner requirements

- Match the engaging tease, concealment and reentry rhythm of Mouse for Cats; fewer mice are acceptable.
- Mice should investigate, hesitate, watch, creep, dart, hide and occasionally run across the whole screen.
- Increase intensity through varied motion and context; avoid constant frantic motion or random heading noise.
- Turn naturally, collide, respond to nearby clicks, and scurry or limp after appropriate contact.
- Allow offscreen travel. Hidden mice must return, and visible pauses must remain visible.
- No automatic breather, mandatory break screen or session timeout. The owner stops play.

## Readable movement policy

Owner-approved direction from the [reference review](reference-game-observation.md):
steady heading → clear run → deliberate turn, stop or complete exit.

- Commit to a destination during an unobstructed run. Do not add frame-by-frame heading
  noise or repeatedly pick nearby goals merely to make the mouse look busy.
- Turns must serve a destination, avoidance, contact reaction or deliberate phase change.
  Brake when necessary, complete the turn and resume useful travel. Repeated target orbits,
  stationary spinning and alternating correction turns are defects in ordinary hunting.
- Active paws, collisions, contact and injury may interrupt a run; route commitment must
  never make a mouse run toward a held area or ignore a new threat.
- Preserve both sustained screen-crossing runs and shorter teasing bouts. Judge intensity
  by distance covered and readable starts/stops, not foot cadence or rotational activity.
- Make disappearance intentional: the full body and tail clear the screen before hiding.
  Allow a visible absence before reentry, retaining identity and respecting blocked entrances.
  Do not substitute a mid-screen vanish or indefinite offscreen absence for an exit.
- Prioritize path readability over adding joints, faster feet or decorative motion. Secondary
  motion follows the [anatomy policy](anatomy-motion.md); hits follow the [contact policy](touch-interaction.md).

These are product requirements, not claims about the reference game's source code or feline
preference. Existing destination/exit logic and steering repairs support them; continuous
rendered and physical-iPad comparison remains pending. No trailer-derived timing is prescribed.

Fast swept arrivals stop at the closest point on the actual substep path, so a high-speed
mouse cannot latch arrival beyond its destination. Generated regression cases cover 30/60/120 Hz.

## Implemented policy

`enrichment.js` owns an authored state policy with hidden, peek, watch, creep, dart,
retreat and traverse phases. Contact, injury, toss and manual control take priority.
Cover and recent threat history persist across decisions; fear decays over simulation time.
Cover selection and entry checks share paw contact radius and released-memory decay; a clear
candidate outranks a blocked familiar entrance. Fully covered entrances wait for clearance.
A paw arriving during a peek triggers withdrawal through the approach edge, followed by
clear-cover reselection; the full silhouette must clear the screen before hiding.
Choices occur on events, arrival or deadlines rather than unrelated random choices every frame.

Invisible approaches move faster than the final visible peek. The exploration budget starts
on silhouette entry. Travel watchdogs bound blocked darts without shortening deliberate creep.
Traverses cross toward an opposite edge, clear the full mouse/tail, hide and return.
Manual steering and recall release hidden mice and temporarily override autonomous choices.

Close taps prompt delayed escape; moderate taps can freeze, with repeated events escalating
risk. Distant taps can orient or pause rather than being ignored or always causing flight.
Injury supersedes queued pre-impact touch reactions so stale flight decisions cannot cancel
the first recovery entrance. Fresh cues after recovery still receive contextual attention.
Direct contact can be harmless or cause the requested cosmetic injury/defeat reactions;
[contact rules](touch-interaction.md) own region selection and held outcomes.

The active launch preset uses two mice, size 2.86 (30% above 2.2), pace 2.8,
hide 1 second, Hunt tempo 1.5 and run-through probability 0.60. Peek duration 0.7,
watch duration 0.6, creep speed 1.6 and dart speed 1.4 favor faster screen coverage,
shorter pauses and more full-screen runs while preserving teasing and paw avoidance.
One-time play-style migration increases each saved size by 30% (maximum 3.9), applies
these movement values, and preserves sound/background choices. Later tuning survives reload.
Travel speed now defaults to 2.2× in addition to that pace: actual free-running
velocity is multiplied, while gait uses the unmultiplied speed. Simulation time, pauses,
holds and tossed motion are not accelerated. Existing saved settings inherit the new
control when absent; later local adjustments persist. Straight-run regression measures
2.2× distance over equal simulation time with unchanged gait cadence/phase.
`settings.js` owns actual ranges/defaults; gait cadence remains independently capped.
No old saved session-duration value may stop the game automatically.

## Arrival and steering

Free travel still uses the faster pace, but close-range approach is capped at distance × 3
without the travel multiplier. Targets behind the mouse receive zero forward thrust while
it turns. Swept arrival within 5 px stops velocity and holds that destination until it
changes or a nearby live paw requires escape. Watch/arrival clears residual turn rate.
This repairs repeated loops caused by overshooting short targets at high travel speed.

## Acceptance criteria

- Seeded multi-minute phone and iPad simulations exercise concealment, visible observation,
  investigation and escape without an indefinitely invisible approach or blocked run.
- Watch/freeze phases actually stop travel; fast turning slows movement appropriately.
- At 30/60/120 Hz, an unobstructed fixed goal is approached without repeated orbits;
  after arrival, heading stays settled until a new goal or threat requires a response.
- Review straight runs, 90°/180° turns, short goals, collisions and new paw obstacles:
  distinguish justified detours from unexplained repeated correction turns.
- In continuous footage, compare distance covered, heading reversals, turn-to-run transitions
  and visible/hidden intervals. Include fast travel and large morphology extremes.
- A full-screen run exits beyond the complete silhouette before becoming hidden.
- Crowded or blocked routes recover; a covered entrance waits or chooses viable cover.
- Pause freezes simulation time; resume does not spend hidden/hold/recovery budgets in wall time.
- Injury recovery and manual takeover cannot strand a mouse in an old autonomous phase.
- Resting/recent paw footprints influence routing without endlessly resetting targets.

## Evidence and limits

Implemented in `little-mouse/public/{enrichment,behavior,physics}.js`; checked by
`hunt-policy`, `behavior`, `physics`, `touch-reactions` and `contact` tests.
This is an authored policy, not a trained AI or validated rodent psychology model.
The rich preset is a design choice for this cat to try, not a scientifically optimal or
validated engagement setting. Its comparative quality still requires observing Mouse for Cats
and this cat's response.

Hold updates consume pending pre-contact reactions. Toss recovery discards queued decisions
and older pre-release cues even when policy updates were skipped while airborne. New cues
at or after the release timestamp remain available on landing and react once; cancellation
does not create a release outcome. See [behavior cycle evidence](cycles/behavior.md).
