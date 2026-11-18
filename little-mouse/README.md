# Little Mouse

A tablet game with textured, articulated mice and a separate phone/laptop companion for live control.

## Run and pair

Requires Node 22.13+ (built-in SQLite).

```sh
npm install
npm run build
npm run dev
```

Game: http://localhost:8787 · Controller: http://localhost:8787/companion

On the same Wi-Fi, replace `localhost` with the computer's LAN IP. On the tablet home screen choose **Create pairing code**, then enter it on the companion or use the copied companion link. Play, pause, steer, recall mice and tune settings from the phone or laptop. Changes persist and apply live. Saved profiles retain combinations of settings.

To leave play, briefly tap the four corners clockwise: **top-left → top-right → bottom-right → bottom-left**, within four seconds. Resting paws and long holds do not open the menu. The companion's Pause button and keyboard Escape also work. Play continues until the owner stops it; there is no automatic break timer.

## Testing playground

Open `/playground.html` for a separate many-mouse lab with live controls, repeatable scenarios and simulation-time controls. Its settings are separate from normal play and pairing.

## Sound

Tap Play locally to unlock browser audio, or use **Test sound** in Sound design. Remote Play cannot supply the local gesture required by browser autoplay rules. The status reports activation errors and generated signal. It cannot prove the physical speaker is audible: device volume and output routing still apply. Supported Safari audio sessions request playback during activation.

The 30 recording excerpts cover mouse/rat squeaks, rat and hamster activity, and paper friction foley. They are not all literal mouse recordings. [SOUND.md](SOUND.md) records exact provenance, licensing, event mapping and verification limits.

## Behavior and rendering

Mice hide, peek, watch, creep, dash, occasionally cross the whole board and remember threatening touch locations. Resting paws remain obstacles; released footprints fade. Touches can be harmless, injure a mouse, or defeat it. Head/body/limb/tail holds, dragging and bounded tosses have different constraints. Defeated individuals are replaced; surviving individuals keep their traits through hiding and injury.

The renderer uses procedural textured geometry, connected jointed legs, inertial tails, rooted ears and whiskers, fur motion, directional lighting and shadow maps. It is a real-time approximation, not a scanned animal or ray tracer. There are 30 floor options, including three generated texture images, plus 22 coat styles across natural, contrast and playful palettes. The research page separates study findings from design inferences; cat engagement and photorealism are not scientifically established outcomes of this implementation.

## Updates

Settings and remote commands poll every 400–500 ms; latency includes network round trips. This is near-real-time polling, not a hard real-time guarantee. Local public-file edits change the version fingerprint. Deployed hosted releases do the same. Open games reload on a new version, preserving pairing, settings, elapsed time and hit count, with a brief interruption. Individual poses are recreated after reload.

`npm run build` creates the Worker artifact. Publishing requires the Sites workflow; pushing GitHub alone does not deploy. The hosted Site remains owner-private. Backgrounded devices receive changes after resuming.

## Code and checks

- `public/game.js`: integration, input, play lifecycle and OTA detection.
- `public/enrichment.js`, `contact.js`, `physics.js`: behavior policy, touch memory and motion.
- `public/mouse3d.js`, `secondary-motion.js`, `leg-rig.js`: rendering and attached motion.
- `public/settings.js`, `controls.js`, `companion.js`: shared validation and tunable controls.
- `public/audio.js`, `audio-samples.js`: bounded recorded sound scheduling and mixing.
- `worker/api.js`: room API; D1 hosted, SQLite locally.

Run `npm test` for policy, geometry, contact, audio, settings and API regression checks. Browser and physical iPad checks supplement these; numerical tests alone cannot judge how natural motion or sound feels. Current requirements and acceptance policies live in the repository's [docs index](../docs/README.md).
