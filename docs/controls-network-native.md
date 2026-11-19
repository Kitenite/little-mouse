# Controls, network and installed app

## App identity

Display name: **Podrick’s Violin**. The owner-supplied two-cat artwork is preserved
unchanged in `ipad/assets/icon.png`; Expo generates the square native icon from it.
Keep existing bundle ID, Expo project, URL scheme and storage keys to preserve installs,
pairing and updates. Home-screen name/icon changes require a signed native rebuild.

## Owner requirements

Use the iPad as the play surface with local owner controls and saved profiles.
Remote gameplay control is removed: no pairing, companion route, command endpoints,
settings synchronization, telemetry uploads or room database access remains.
Preserve wireless asset iteration and installed-app support. Native orientation remains landscape.

## Implemented surfaces and settings

The game is `/`; `?surface=ipad` selects the tablet layout. Settings start collapsed on
all surfaces. `public/settings.js` validates local settings and `controls.js` renders grouped
controls and profiles. Settings and profiles persist on this device; denied storage still
permits in-memory play. Fuzziness retains the persisted `furSoftness` key.
Legacy saved remote-manual mode becomes the normal hunt mode at game startup; the retired
choice is absent from visible controls. Developer playground forcing remains separate.
Existing legacy browser keys and local database files are not destructively purged; runtime
never reads pairing keys or opens the old database. Hosting no longer requests a D1 binding.

The current rich starting preset uses two large mice, woodland clearing, varied hunt/idle
behavior and moderate secondary motion. It is a design starting point to test with this cat,
not a scientifically established optimum. The connected iPad also has a saved
`Rich woodland hunt` profile; custom settings remain adjustable.

## Web startup recovery

The HTML shows loading until the game module initializes. An inline recovery controller
survives failed module downloads; startup failure or a 15-second timeout offers **Retry
loading game**. Retry checks the game response before a fresh navigation, preserving
stored settings and the existing short resume window. Resume requires finite nonnegative counters and a nonfuture timestamp
less than 60 seconds old. Valid owner state is retained. There is no automatic
error-reload loop or same-document re-import that could duplicate handlers.
WebGL initialization, preview/game frame exceptions and context loss use this recovery;
an active session is checkpointed before stopping, while intentional pause stays paused.
`mouseDiagnostics().recovering` stays true through failed/checking/reloading states;
the native bridge skips resume-storage writes then, while still posting actual
`playing:false` for native UI/keep-awake. Startup also supplies a recovering snapshot
until the full diagnostic function is installed. Cleanup failures cannot hide Retry.
This covers a plausible web failure mode, not a confirmed diagnosis of the reported iPad
incident. The initial HTML must load; device/WebKit validation remains separate.
Developer console `mouseBoot.exportReport()` returns a bounded schema-1 report before Retry:
first-failure category/pre-cleanup state plus the last 12 recovery transitions. It works even
when game modules fail. Only allowlisted numeric/enum settings, viewport and a 12-hex runtime
fingerprint are included; snapshot is null if diagnostics throw. No error text, URLs,
pairing codes, storage dumps or raw mouse objects are included.
`mouseDiagnostics()` contains no pairing state. Exported evidence is
in-memory and resets on navigation; collect it before Retry. It is not deterministic replay
or an automatic upload. Browser/OS, source SHA and ordered actions are recorded separately.
The native WebView keeps Retry after load failures and uses the supplied cat artwork while
loading, with a dark background. Native connection-settings overlays are removed. The UI
entry screen is owned separately and is integrated by the coordinator.

## Ending play

Current owner exit: briefly tap corners **top-left, top-right, bottom-right, bottom-left**
in order within four seconds. Multiple contacts, a long press or dragged corner touch cancel
recognition. Keyboard Escape also pauses locally.
There is no timed breather or automatic session stop, including for legacy saved durations.
Old READMEs describing long-press pause/settings during play are obsolete on this point.

## Update routes

| Change | Current route | Boundary |
| --- | --- | --- |
| Settings and profiles | Local controls and storage | No network request or native rebuild |
| Local web code/assets | Dev-server version detection and automatic reload | Server remains running; state is checkpointed |
| Hosted web game | Explicit build/deploy, then version reload | GitHub push alone does not deploy |
| App JS during development | Metro/Expo development workflow | Separate from hosted game reload |
| Compatible installed app JS | EAS Update channel/runtime | Not all native changes can ship OTA |
| Native modules/permissions/runtime | New signed binary | Device build/install required |

The Expo/React Native wrapper uses WKWebView for the same renderer and local controls.
`npm --prefix ipad run local` starts LAN development; the existing `ios` script supports a
connected-device build. Consult [ipad/AGENTS.md](../ipad/AGENTS.md) and matching Expo docs
before changing native APIs; this requirements document is not a provisioning runbook.
A wired connection alone does not demonstrate that signing, installation or launch succeeded.

## Acceptance criteria and limits

- Verify local play, pause, saved settings/profiles, audio activation and failure recovery.
- Assert retired endpoints return 404 and runtime sends only read-only asset-version checks.
- Save a web change and observe the correct version load with settings/session continuity.
- Cancel all held contacts before pause, reload, app hiding or asset reload.
- Verify both landscape sides, refusal to rotate into portrait, and owner exit with real
  simultaneous paw-like touches in a newly rebuilt native app.
- Test installed-device launch, local-network permission, audio unlock, hosted authentication
  and update delivery separately; simulator success does not prove device success.
- First load needs the local or hosted server; the wrapper has no bundled offline game.

Source owners: game/controls/settings, version API, dev/build scripts, and
`ipad/src/components/Game.tsx`. Tests: `network`, `settings`, `enrichment`, `owner-gesture`,
and native connection tests. Public-repository permission is not proof of a public deployment.

Development server: `npm run dev` watches server/shared modules. Public asset changes are
fingerprinted and checked every second; a changed version checkpoints the session and reloads.
Version responses cannot change settings or issue gameplay commands. Offline checks leave play
running. No gameplay state is sent to the server. Existing `.local/rooms.sqlite` is left untouched.

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
