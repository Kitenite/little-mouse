# Controls, network and installed app

## Owner requirements

Use the iPad as the play surface and a separate phone/laptop web companion for live tuning.
Keep useful local iPad controls too. Expose meaningful numeric behavior, anatomy, motion,
audio and visual settings. Preserve profiles and allow fast wireless iteration with the cat.
Support testing an installed app on a wired device; Expo Go must not be the only route.

## Implemented surfaces and settings

The game is `/`; the companion is `/companion`. `?surface=ipad` selects the tablet layout.
Both use `public/settings.js` for validated settings and `controls.js` for grouped controls.
Profiles persist locally. Pairing uses a 16-character code or companion link.
The game polls at 400 ms; the companion at 500 ms. This is live polling, not hard realtime.
Commands include play, pause, steer, recall and reload. Stale commands are rejected.
Unsaved local changes survive stale polling until acknowledged; failures preserve local play.

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
- Verify portrait/landscape and owner exit with real simultaneous paw-like touches.
- Test installed-device launch, local-network permission, audio unlock, hosted authentication
  and update delivery separately; simulator success does not prove device success.
- First load needs the local or hosted server; the wrapper has no bundled offline game.

Source owners: game/companion/controls/settings, worker API, dev/build scripts, and
`ipad/src/components/Game.tsx`. Tests: `network`, `settings`, `enrichment`, `owner-gesture`,
and native connection tests. Public-repository permission is not proof of a public deployment.
