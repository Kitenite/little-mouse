# Session-scale behavior policies

Owner: root. Implemented following the owner's observation that the reference game cycles
through many policies over longer play. The 25-second supplied clip cannot establish that
schedule; the durations and weights below are our authored implementation, not reverse-engineered facts.

## Policy hierarchy

The session director selects a chapter; each mouse retains its own appearance motif, current
phase and finite route. Paw contact, hold, injury, toss and manual control keep priority.
Both mice share the chapter but transition independently at natural phase boundaries.
Changing chapters does not replace an active route, teleport a mouse or release a grab.

After a 35-second mixed opening, six chapters rotate in shuffled bags:

| Chapter | Behavioral emphasis |
| --- | --- |
| Sweeping | More connected crossfield runs, fewer watch/creep choices |
| Stalking | More investigation and watching, fewer long connected runs |
| Edge teasing | More edge-hook routes and familiar-cover reentries |
| Bursts | More darts, shorter endpoint dwell, more brief route hesitations |
| Exploring | Fresh entrances, longer visible budgets, investigation and connected runs |
| Ambush | Somewhat longer concealment, more retreat and run-through choices |

Each chapter lasts 30–65 simulation seconds. Every bag uses all six exactly once, with no
adjacent repeat across bags. This is ongoing variety, not a timed session stop or automatic break.
Owner settings remain the baseline; profiles and mouse identities are not rewritten.
Explicit run-through probabilities of zero/one remain zero/one. All chapter changes are bounded.

## Implementation and evidence

`hunt-chapters.js` owns the independent seeded chapter clock and deck. The game supplies a new
seed per new cast/session; policy tests use repeatable seeds. Repeated updates at the same time
consume no randomness or chapter budget, so mouse count and frame rate do not accelerate rotation.
A paused game freezes elapsed simulation time. Reload/new game currently resets the director;
chapter continuity across app restarts is not persisted.

`enrichment.js` snapshots the chapter when entering an action and applies its choice weights,
dwell, hidden duration, cover preference, route probability and visible budget.
`hunt-routes.js` uses chapter edge-hook and hesitation probabilities when planning a new route.
The optional local experiment behavior sample records each mouse's effective chapter ID.
This supports attribution; it does not make pilot records training-ready or create automatic learning.

Tests cover four full chapter cycles, no repeats, reproducibility and paused-clock behavior;
shared two-mouse advancement; unchanged ongoing routes/holds; and sampled differences in actual
crossfield/edge-hook/hesitation choices. Existing touch and motion regressions remain required.
Physical iPad perception, long-session engagement and how this cat responds still need observation.
