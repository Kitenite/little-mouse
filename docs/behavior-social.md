# Coordinated prey and missed pounces

Owner: root. Implemented in `hunt-group.js`, `enrichment.js` and game pointer/frame wiring.
These are authored game policies, not observations about rodent social behavior or proven cat preferences.

## Two-mouse coordination

A shared snapshot gives available mice complementary lead/sneak intent. Roles rotate every
19 simulation seconds, without replacing an ongoing route. Lead favors darts and traverses;
sneak favors watching and investigation. A lone available mouse keeps the original weights.
Held, hurt, defeated, injured and airborne mice cannot become the coordination focus.

The last visible mouse can defer a voluntary retreat/traverse for at most 2.5 seconds,
investigating while asking a hidden companion to enter. All-concealed casts expedite one
entrance to within .5 seconds; an existing approach is not restarted. Normal entrance spacing
and blocked-mouth checks still apply. Initial hiding, threats and simultaneous contact can
still leave the board temporarily empty; there is no teleport or guaranteed perpetual target.
New threats, holds, injury and blocked entrances always outrank coordination.
Cover selection leaves space around a companion already entering. If a visible peek makes
less than four pixels of progress in 2.5 seconds, it backs out along its current lane before
reselecting cover. This repairs a reproduced slow/large two-mouse collision stall without
teleporting or turning an invisible approach into an invisible watch. Retreat completes as
soon as the full silhouette clears the screen, even if collisions block exact offscreen-goal
arrival; invisible mice must not spend the travel deadline pushing against one another.

## Missed pounces

Pointerdown records whether renderer hit-testing found a mouse. A close miss can schedule a
short directed dodge away from the strike, then a .2–.4 second watch/check-back at safety,
then a new dart. These phases use normal acceleration, turning and live-paw exclusion.
An unsafe landing goes directly to retreat. Repeated nearby misses within six seconds
escalate to retreat instead of repeatedly inviting another check-back; history is bounded.
A successful claim, injury, toss recovery or fresh stronger reaction discards queued checks.

Direct hits retain the existing region-specific outcome policy. A miss never inflicts damage
or awards a catch. Old call sites without explicit miss classification retain ordinary threat
responses. At most twelve recent touch cues are retained; continuous movement events do not
schedule new pounces. Stationary contact remains an obstacle until release.

## Acceptance and limits

Tests exercise role changes without route replacement, bounded handoffs, fully blocked
entrances, near-miss dodge/check/escape at 30/60/120 Hz and repeated-pressure escalation.
[Touch interaction](touch-interaction.md) owns persistent detours and held contact constraints.
[Behavior learning](behavior-learning.md) owns movement diagnostics and local adaptation.
Automated tests establish policy invariants; rendered naturalness and this cat's response
still require continuous observation on the iPad.
