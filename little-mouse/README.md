# Little Mouse

A tablet game with a textured, articulated 3D mouse, a phone/laptop companion, saved live settings, and automatic over-the-air releases.

## Run

Requires Node 22.13+ (built-in SQLite).

```sh
npm install
npm run build
npm run dev
```

Game: http://localhost:8787 · Companion: http://localhost:8787/companion

On the same Wi-Fi, replace `localhost` with the Mac's LAN IP on the iPad and phone. The hosted private Site also works over the internet; sign into the owning ChatGPT account on each device.

## Pair and play

1. On the tablet, select **Create pairing code** below the settings.
2. Open `/companion` on a phone or laptop and enter the code, or copy the companion link from the tablet.
3. Start play. Drag the companion pad to steer, or choose automatic stalking/scurrying.
4. Change speed, mouse size/count, pauses, floor preset/color, lighting, squeaks, variation, and session length live. These settings persist in server storage.
5. Hold the tablet's pause button for 1.2 seconds, press Escape, or pause from the companion.

The tablet must receive a local tap to unlock audio under browser autoplay restrictions. A backgrounded or locked browser cannot receive updates until it resumes.

## Fast iteration / OTA

Settings are applied without reload. The game polls state at 400 ms, the companion at 500 ms; latency includes network round trips. This is near-real-time polling, not a hard real-time guarantee or WebSocket stream. Steering interpolates locally between targets.

Local changes to public files change the version fingerprint. Hosted releases fingerprint all public assets and the API. Once a new release is deployed, an open game detects it and reloads automatically, restoring pairing, settings, elapsed time and catch count through local storage. The companion's **Reload game now** command forces a reload. Code updates have a brief reload interruption; they are not module hot-swaps. `npm run build` creates the deployment artifact; publishing still requires the Sites deployment workflow.

## Architecture

- `public/mouse3d.js`: Three.js geometry, fur material, skin textures, lighting, tail and distance-driven four-foot gait. A real-time approximation, not a scanned or photoreal-certified asset.
- `public/game.js`: behavior, hits, multi-touch, hold-to-pause, session breaks, remote commands, update detection.
- `public/companion.js`: remote controls, steering, connection/latency/activity feedback.
- `worker/api.js`: validated room API; D1 on Sites, SQLite locally. Pairing codes are bearer capabilities in local mode; hosted access is additionally owner-private.
- `drizzle/0000_rooms.sql`: persistent schema migration.
- `scripts/build.mjs`: self-contained Worker ESM artifact with embedded assets.
- `public/research.html`: cited studies, evidence limits, and the design choices inferred from them.

`npm test` checks pairing, state persistence, steering bounds and invalid/cross-origin writes. Browser checks use real Chromium; physical iPad/Safari testing remains outstanding.

## Research

Hall et al. (2002): habituation/novelty in physical toy play. Payne et al. (2025): human–cat tablet interaction. Kogan & Grigg (2021): correlational laser-play survey, not a tablet study. See the in-app research page for links and limitations. Session length and visual presets are adjustable design defaults, not established scientific optima.

Direct presses sharply squash mice against the floor. They either stay flattened briefly before replacement, or rebound and scramble offscreen; nearby misses startle them. Mice also leave and reenter through screen edges. The companion can recall them. Slower, capped leg cadence remains independent of the escape speed boost.

Hits produce a brief blood splatter and randomly choose squash, tumble, zigzag escape, straight dash, or stun-and-flee. Droplets expire within five seconds and use a fixed 320-instance pool. New sessions clear all effects.

Heading-driven movement brakes before sharp turns, limits angular acceleration, and widens turns at speed. Body banking, tail drag, and inside/outside stride differences follow turn rate. Hit responses also include a faster dash and a temporary limp with reduced left-hind stride and uneven pace.
