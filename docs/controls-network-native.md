# Controls, network and installed app

## Owner requirements

Use the iPad as the play surface and a separate phone/laptop web companion for live tuning.
Keep useful local iPad controls too. Expose meaningful numeric behavior, anatomy, motion,
audio and visual settings. Preserve profiles and allow fast wireless iteration with the cat.
Support testing an installed app on a wired device; Expo Go must not be the only route.
The native app must remain horizontal: allow both landscape sides and no portrait orientation.

## Implemented surfaces and settings

The game is `/`; the companion is `/companion`. `?surface=ipad` selects the tablet layout.
Both use `public/settings.js` for validated settings and `controls.js` for grouped controls.
Fuzziness is an independent anatomy control in game, companion and playground; it reuses the
persisted numeric `furSoftness` key (0–1), with tuft loft/spread distinct from length and density.
Profiles persist locally. Pairing uses a 16-character code or companion link.
The game polls at 400 ms; the companion at 500 ms. This is live polling, not hard realtime.
Commands include play, pause, steer, recall and reload. Stale commands are rejected.
Unsaved local changes survive stale polling until acknowledged; failures preserve local play.

The current rich starting preset uses two large mice, woodland clearing, varied hunt/idle
behavior and moderate secondary motion. It is a design starting point to test with this cat,
not a scientifically established optimum. The connected iPad also has a saved
`Rich woodland hunt` profile; custom settings remain adjustable.

## Web startup recovery

The HTML shows loading until the game module initializes. An inline recovery controller
survives failed module downloads; startup failure or a 15-second timeout offers **Retry
loading game**. Retry checks the game response before a fresh navigation, preserving
stored pairing/settings and the existing short resume window. There is no automatic
error-reload loop or same-document re-import that could duplicate handlers.
WebGL initialization, preview/game frame exceptions and context loss use this recovery;
an active session is checkpointed before stopping, while intentional pause stays paused.
`mouseDiagnostics().recovering` stays true through failed/checking/reloading states;
the native bridge skips resume-storage writes then, while still posting actual
`playing:false` for native UI/keep-awake. Startup also supplies a recovering snapshot
until the full diagnostic function is installed. Cleanup failures cannot hide Retry.
This covers a plausible web failure mode, not a confirmed diagnosis of the reported iPad
incident. The initial HTML must load; device/WebKit validation remains separate.
The native home opens the game without awaiting the connection preference write, preventing
slow storage from blocking navigation. Saving the address is best-effort; URL validation remains.

## Ending play

Current owner exit: briefly tap corners **top-left, top-right, bottom-right, bottom-left**
in order within four seconds. Multiple contacts, a long press or dragged corner touch cancel
recognition. Companion Pause and keyboard Escape remain alternatives.
The native connection-settings overlay is hidden during active play and returns when paused.
There is no timed breather or automatic session stop, including for legacy saved durations.
Old READMEs describing long-press pause/settings during play are obsolete on this point.

## Update routes

| Change | Current route | Boundary |
| --- | --- | --- |
| Settings and steering | Paired polling | Requires connectivity; no native rebuild |
| Local web code/assets | Dev-server version detection and automatic reload | Server remains running; state is checkpointed |
| Hosted web game | Explicit build/deploy, then version reload | GitHub push alone does not deploy |
| App JS during development | Metro/Expo development workflow | Separate from hosted game reload |
| Compatible installed app JS | EAS Update channel/runtime | Not all native changes can ship OTA |
| Native modules/permissions/runtime | New signed binary | Device build/install required |

The Expo/React Native wrapper uses WKWebView for the same renderer and companion integration.
`npm --prefix ipad run local` starts LAN development; the existing `ios` script supports a
connected-device build. Consult [ipad/AGENTS.md](../ipad/AGENTS.md) and matching Expo docs
before changing native APIs; this requirements document is not a provisioning runbook.
A wired connection alone does not demonstrate that signing, installation or launch succeeded.

## Acceptance criteria and limits

- Pair phone and iPad; verify settings both directions, steering, pause, profiles and recovery.
- Save a web change and observe the correct version load with pairing/session continuity.
- Cancel all held contacts before pause, reload, app hiding or manual commands.
- Verify both landscape sides, refusal to rotate into portrait, and owner exit with real
  simultaneous paw-like touches in a newly rebuilt native app.
- Test installed-device launch, local-network permission, audio unlock, hosted authentication
  and update delivery separately; simulator success does not prove device success.
- First load needs the local or hosted server; the wrapper has no bundled offline game.

Source owners: game/companion/controls/settings, worker API, dev/build scripts, and
`ipad/src/components/Game.tsx`. Tests: `network`, `settings`, `enrichment`, `owner-gesture`,
and native connection tests. Public-repository permission is not proof of a public deployment.

Development server: `npm run dev` watches the API plus shared settings/migration modules.
Schema edits restart the local API so new companion sliders validate immediately; static
asset changes use the source-version reload. Existing room data persists in `.local/rooms.sqlite`.

## Native orientation

**Implemented in source:** `ipad/app.json` sets `orientation: landscape`, retaining
`ios.supportsTablet: true` and `ios.requireFullScreen: true`. No runtime orientation library
is needed. Expo SDK 58 generates only landscape-left/right in the iOS orientation mask.
See [Expo 58 app config](https://docs.expo.dev/versions/v58.0.0/config/app/).

**Rebuild required:** regenerate any existing ignored native project with
`cd ipad && npx expo prebuild --platform ios --no-install`, then build/sign/install a new
binary through the existing local or EAS workflow. Preserve/recheck the existing signing
team and provisioning. EAS builds from source without native folders generate them via
[Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).
Web reload, Metro refresh and an OTA JavaScript update do not replace the installed mask.
Generated native files stay ignored. The connected iPad received a signed landscape build;
its built mask was checked. Physical rotation and landscape layout acceptance remain pending.
