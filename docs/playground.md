# Playground and repeatable testing

## Implemented test surface

`/playground.html` is a dedicated lab, separate from ordinary cat play and pairing.
It starts paused with eight mice at 0.9× size and a fixed cast seed. Shared controls tune every parameter
in `public/settings.js`; live settings and saved profiles use playground-only storage keys.
Leaving the lab does not change the ordinary game profile or send companion commands.

Supported actions:

- Select an individual mouse, or apply a scenario to the whole cast; count remains 1–8.
- Run/pause, advance exactly 1/60 second, or set time scale from 0.1× to 2×.
- Reset the same seed and clock with current settings; arrange a lineup or seeded scatter.
- Force chase/dart, tease/peek, full-screen run, retreat/hide, reentry, unhurt flinch,
  limp, hurt/stunned and defeat. A scenario first restores its target to a hittable state.
- Place persistent paw obstacles, clear paws/holds, and test actual pointer holds, drag and toss.
- Audition the real cue families while paused, with local gesture activation and audio diagnostics.
- Inspect selected identity, state, phase, reaction, coordinates and hold; see simulation frames,
  render FPS, draw calls, triangles, audio sample availability and hit count.

The surface uses the production renderer, contacts, physics, hunt policy, injury lifecycle,
idle animations and audio. `forceHuntPhase` delegates to the same internal phase entry and
update functions as ordinary play. Forced reaction lotteries still run through `pressMouse`.
The lab's simulation loop lives in `public/playground-simulation.js`; it is not another mouse model.

## Controlled clock and isolation

Physics and policy use fixed 1/60-second ticks independent of display refresh. Time scale changes
simulation time, including recovery and touch-memory decay. Pause freezes those clocks;
frame-step advances once even while paused. Held contacts therefore need enough simulated
time to cross their activation threshold. Escape, blur or app hiding pauses the lab.

A single display update consumes at most 0.25 seconds of wall time, avoiding a large catch-up
jump after a suspended tab. Rendered motion uses the elapsed simulation delta. Audio audition
uses the browser's audio clock and can play while simulation is paused; it is not frozen audio.

Persistent paw obstacles occupy the actual contact registry and count toward its ten-pointer
limit. No owner corner gesture is installed in the lab. Touch cancellation releases transient
contacts; the clear action removes both real contacts and persistent obstacles.

## Acceptance evidence and remaining validation

Automated tests cover repeatable seeded input sequences and cast reset; pause/fixed-step
behavior; paw-memory expiry versus persistent obstacles; all forced scenario lifecycle paths;
real hold/drag/toss; valid selection after count reduction; and equivalent 30/120 Hz input clocks.
These are simulation acceptance checks, not proof of visual realism or device performance.

**Browser verified:** split view, all five idle activity scenarios, local recorded-audio audition,
all five body-region grabs/drag/toss, and error-free shaders. **Pending:** physical iPad sound
audibility, visual acceptance and frame pacing at eight mice.

Repeatability requires the same seed, dimensions, settings and ordered inputs. Renderer details,
Web Audio timing/recording choices and GPU output are not claimed deterministic. Eight mice
are intentionally a stress case, not the ordinary-play default. Forced scenarios are test
controls; they are not evidence that the cat prefers that outcome or that behavior is biological.

Source owners: `public/playground.html`, `playground.js`, `playground.css`,
`playground-simulation.js`, and the explicit policy entry in `enrichment.js`.
The bounded `window.playgroundDrive` API exposes pause, step, select, force, reset, configure,
pointer down/move/up and paw placement/clear for browser validation. It calls the same simulation
methods as the visible controls. `playgroundDiagnostics()` provides read-only snapshots.

Regression acceptance: `tests/playground.test.mjs`.

Idle activity buttons force nibbling, face washing, hind-leg scratching, stretching and rolling
through the same animation timestamps and interrupt rules used in normal play. The selected
state inspector includes the activity and its duration.
