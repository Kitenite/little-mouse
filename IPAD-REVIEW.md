# Little Mouse iPad audit

Audit date: 2026-11-17. Scope: Expo setup in `ipad/` and integration with `little-mouse/`. The original audit was read-only; this report is the only authorized edit. No code changes, simulator interaction, native builds, Expo servers, app GUI, publishing, commits, goals, or additional agents were used. Other agents are working concurrently, so line references describe the inspected snapshot.

## Current review after coordinator fixes — 2026-11-17

This section supersedes the original findings below. The original audit is retained as historical evidence, including the exact fullscreen override and URL bypass reproduction. Old `App.tsx` references refer to the pre-Router snapshot and are not current paths.

**Assessment:** the fullscreen source configuration and original public-HTTP bypass are fixed. Typecheck and current iPad tests pass. Native build/device confirmation remains pending with the coordinator. The checkpoint/playing bridge improves restoration and wake behavior, with the explicit limits below. A separate external-scheme handling caveat remains in the WebView integration.

### Fix status and current evidence

| Area | Current status | Evidence and remaining validation |
| --- | --- | --- |
| Fullscreen override | Fixed in source config | `ipad/app.json:22` now sets `expo.ios.requireFullScreen: true`; the misleading raw plist entry is removed. This matches the installed Expo plugin's actual input. Native generation/build and runtime fullscreen verification remain coordinator-owned and pending; this review did not rebuild or claim the installed binary is fixed. |
| Strict IPv4 classification | Fixed; direct probes pass | `ipad/src/connection.ts:7–11` requires four numeric octets, each within 0–255, before applying private/loopback range rules. All four original hostname probes now throw. |
| HTTP navigation policy | Fixed for navigation reaching the callback | `connection.ts:25–27` validates through the same policy, and `ipad/src/components/Game.tsx:53` uses it. Because validation returns a boolean rather than a rewritten URL, allowed HTTPS auth redirects retain their original paths, queries, and fragments. Device redirects remain untested. See the distinct external-scheme caveat below. |
| Expo Router migration | Source structure conforms | `ipad/package.json` uses `expo-router/entry`; `src/app/index.tsx:22` pushes `/game`; `src/app/game.tsx:5–8` reads and normalizes parameters and replaces `/` on close. `src/app/_layout.tsx:2` hides headers and disables navigation gestures. `src/components/Game.tsx` and `src/styles.ts` keep non-route code outside `src/app`. Typecheck passes; runtime navigation is not GUI-tested. |
| Native checkpoints | Improved; bounded recovery | `Game.tsx:36–45` checkpoints immediately when diagnostics are available and every second thereafter. It records playing/catches/elapsed/time in the existing `mouse-resume` format. Same-origin injection and message checks are present at lines 37 and 48. Actual WKWebView injection timing and process recovery remain untested. |
| Wake during active play | Improved in source | `Game.tsx:8,11,24,42–50` mounts the keep-awake hook only when the game's bridge reports `playing: true`; line 31 resets it on load start. Pausing/rest should release the native wake request after the next one-second bridge tick. Hardware verification remains pending. |
| Room 404 recovery | Concurrent worker fix observed; verification belongs to hunt worker | The inspected `little-mouse/public/game.js:12` retains request status/path; lines 30–31 reset pairing UI/state; line 36 clears a missing room on matching room/telemetry 404. The following poll can use `/api/version`, and the owner can create a new room with current settings. The original endless-404 control flow is no longer present in this snapshot. No game tests or room-failure simulation were rerun in this follow-up. |

### Remaining caveat: unsupported schemes may open externally before policy runs

`Game.tsx:25–53` does not set `originWhitelist`. The installed `ipad/node_modules/react-native-webview/src/WebViewShared.tsx:20` defaults it to HTTP and HTTPS. Its `createOnShouldStartLoadWithRequest` implementation at lines 47–60 checks that whitelist first; nonmatching URLs go to `Linking.canOpenURL` / `Linking.openURL`, while the app's callback is only invoked in the `else if` branch.

Thus `isAllowedWebUrl('some-custom-scheme:...') === false` alone does not prove that navigation will be blocked rather than opening another app. This is confirmed dependency control flow, not an observed device escape. It does not reopen the original HTTP-hostname bypass: HTTP URLs reach the corrected callback.

**Suggested fix if the intended policy is to block unsupported schemes:** configure the WebView so all navigation schemes reach the application callback (for example, an explicit `originWhitelist={['*']}` combined with the existing restrictive callback), and explicitly handle only authentication/external links the product intends to allow. Do not broaden the whitelist without retaining the callback. Verify on-device behavior and provider auth requirements before calling this complete.

### Checkpoint and wake limits to keep explicit

- `little-mouse/public/game.js:38` still restores only checkpoints less than 60 seconds old with `playing: true`. Returning after a longer interruption does not restore progress. The bridge is an improvement for short interruptions, not durable session history.
- `Game.tsx:44` uses a one-second interval without an explicit final flush on owner exit, background transition, or game pause. Abrupt exit can lose the last interval of progress; a pause followed by immediate exit can leave a briefly stale playing checkpoint. Owner exit at line 56 directly calls `close`, so returning within the freshness window can automatically resume the previous playing state. Decide whether that matches the intended owner-exit semantics.
- The hook tracks reported game state, not native foreground/focus state. Error handlers at `Game.tsx:33–35` do not immediately clear active play; load start normally clears it during recovery. Clearing it explicitly on terminal error/process termination would make the lifecycle more robust, but no stuck-wake behavior was reproduced.
- For stronger guarantees, checkpoint on deliberate state transitions and before owner exit, distinguish resume-after-crash from deliberate exit, and validate visibility/background behavior. These are suggested follow-ups; no bridge code was changed here.

### Follow-up checks run

- `cd ipad && npm run typecheck`: passed.
- `cd ipad && npm test`: passed, 2/2. Current rejection cases include three spoofed private-prefix hostnames; direct probes below additionally cover the fourth prefix and navigation helper.
- An in-memory Node assertion script imported `normalizeGameUrl` and `isAllowedWebUrl`: all 10 blocked inputs were rejected, eight permitted inputs and `about:blank` were accepted. Blocked inputs included all four original bypass hostnames, public IPv4, the two adjacent nonprivate 172 ranges, credentials, JavaScript and file schemes. Allowed inputs included private range endpoints, loopback IPv4/IPv6, `.local`, and an HTTPS callback URL with query/fragment. These are helper checks, not WebView integration tests.
- Read installed WebView navigation handling to verify callback/whitelist ordering. No dependencies were installed or updated.
- Lint now has a configured script but was intentionally left to the coordinator. No simulator, build, dependency, server, GUI, or deployment commands were run. Only this report was edited.

The native build, hosted authentication flow, LAN permission recovery, actual navigation/bridge behavior, and preview OTA delivery still require the coordinator's runtime validation. Since Expo Router adds native integration dependencies, continue to respect the documented app-version/runtime compatibility policy when distributing updates; this review does not establish compatibility with an earlier binary.

## Original audit — historical release assessment

At the original snapshot, the fullscreen configuration override and public-HTTP validation bypass required fixes before distribution. Their current status is recorded above. Hosted authentication and installed-app OTA delivery were and remain release validation gates, not proven failures. The following sections preserve the original evidence and suggestions; do not treat their old defect status or file locations as the latest implementation.

Requirements/context inspected: root README, `ipad/AGENTS.md`, `ipad/README.md`, `little-mouse/README.md`, and `little-mouse/public/research.html`. No separate requirements document was found in the inspected Markdown inventory.

## 1. Fullscreen setting is overwritten during native configuration

**Confirmed configuration defect.** `ipad/app.json:15` sets `expo.ios.infoPlist.UIRequiresFullScreen` to `true`, but the generated `ipad/ios/LittleMouse/Info.plist:89–90` contains:

```xml
<key>UIRequiresFullScreen</key>
<false/>
```

The installed Expo config plugin explains the exact override. In `ipad/node_modules/@expo/config-plugins/build/ios/RequiresFullScreen.js:63`:

```js
const requiresFullScreen = !!config.ios?.requireFullScreen;
```

Its return value at lines 75–77 spreads the previous plist first and then writes:

```js
return {
    ...infoPlist,
    UIRequiresFullScreen: requiresFullScreen
};
```

`expo.ios.requireFullScreen` is absent, so the plugin overwrites the raw plist entry with `false`. This is supported by both installed implementation and generated output, not inferred from remembered Expo behavior.

**Suggested fix:** set `expo.ios.requireFullScreen: true` alongside `supportsTablet`; remove the redundant raw `infoPlist.UIRequiresFullScreen` entry to avoid misleading configuration. Let the coordinator regenerate native configuration through the existing build workflow, then inspect the resulting plist and test the target iPad OS. Do not hand-edit the generated plist.

Orientation is correctly populated in the inspected output: `ipad/app.json:8` uses `orientation: "default"`; `ipad/ios/LittleMouse/Info.plist:93–105` includes portrait, upside-down portrait, and both landscapes for iPad. Runtime rotation was not tested.

**Limit:** the installed plugin's comment at lines 45–47 notes changed iOS 27 resizing semantics and deprecation of `UIRequiresFullScreen`. Correcting the override is not a guarantee of kiosk behavior or prevention of system gestures; verify the actual deployment OS.

## 2. Public HTTP hostnames bypass the local-network URL policy

**Confirmed and reproduced.** `ipad/src/connection.ts:7–8` classifies local addresses using a prefix regex:

```ts
const local = host === 'localhost' || host === '[::1]' || host.endsWith('.local') ||
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
```

This matches public DNS names beginning with private-address-looking labels, not only private IPv4 literals. Run from `ipad/`:

```sh
node --experimental-strip-types --input-type=module -e 'import {normalizeGameUrl} from "./src/connection.ts"; for (const u of ["http://10.attacker.example", "http://192.168.attacker.example", "http://172.16.attacker.example", "http://127.attacker.example"]) console.log(u, "=>", normalizeGameUrl(u));'
```

Observed output:

```text
http://10.attacker.example => http://10.attacker.example/
http://192.168.attacker.example => http://192.168.attacker.example/
http://172.16.attacker.example => http://172.16.attacker.example/
http://127.attacker.example => http://127.attacker.example/
```

These reserved example names are parser probes; no network connection or claim of an active exploit is involved. The result contradicts the documented requirement that public URLs use HTTPS.

There is a second enforcement gap at `ipad/App.tsx:37–39`: `onShouldStartLoadWithRequest` accepts every HTTP or HTTPS URL. Even after initial validation is corrected, an HTTP redirect/navigation to a public host passes this callback. `ipad/app.json:20` enables arbitrary loads in WebView content, making application-level enforcement significant. A redirect exploit was not exercised on device.

**Suggested fix:** validate the entire normalized hostname as an IPv4 literal with exactly four decimal octets in range 0–255 before checking 127/8, 10/8, 192.168/16, and 172.16/12. Handle explicit localhost, loopback IPv6, and `.local` policy separately. Reuse a protocol/host validation helper for navigation without stripping redirect paths, queries, or fragments needed by authentication. Reject public cleartext navigation while preserving required HTTPS auth redirects. Add regression cases for all four probes, valid private addresses, public IPs, malformed addresses, credentials, and redirects.

Existing strengths: the entry validator rejects unsupported schemes and embedded credentials and strips path/query/fragment when selecting the game root (`connection.ts:9–16`). Existing tests do not cover the prefix-hostname bypass.

## 3. A missing saved room cannot be recovered through the UI

**Confirmed control-flow limitation, not a device reproduction.** `little-mouse/public/game.js:30` creates a room only when the saved `room` value is absent. With an existing room it attempts to copy the companion link. At line 34, a room GET returning 404 is handled as generic reconnection; the saved room is never cleared or replaced.

If server storage is reset or a saved room disappears, the client remains on that dead room. It also polls `/api/rooms/<code>` instead of `/api/version`, so failed room retrieval prevents normal release detection. `little-mouse/worker/api.js:11` explicitly returns 404 for missing rooms.

**Suggested fix:** retain HTTP status in the request error, distinguish missing rooms from transient outages, offer an explicit re-pair/reset action, and poll release metadata independently of room existence. Preserve local settings when creating a replacement room.

## 4. Session restoration covers deliberate game reloads only

**Confirmed persistence boundary.** `little-mouse/public/game.js:33` writes `mouse-resume` immediately before `location.reload()`. Line 36 restores a playing session only when that checkpoint is less than 60 seconds old. Settings and pairing have separate local-storage persistence.

Native owner exit unmounts the WebView (`ipad/App.tsx:43,74`), and WebView process recovery remounts it by changing its key (`App.tsx:36`). Neither path checkpoints elapsed time or catches. Consequently the existing game-release reload mechanism preserves progress, but interrupted/unmounted sessions do not have the same guarantee. Crash/termination behavior was not exercised on a device.

**Suggested fix:** if cross-interruption restoration is a requirement, add periodic and lifecycle checkpoints and define whether returning after an owner exit should resume or present a paused session. Preserve elapsed time so an interruption cannot silently restart the intended session-break interval. Do not automatically resume play solely because old state exists without deciding the owner-facing behavior.

## 5. Hosted authentication and error handling

`ipad/src/connection.ts:1` selects the private hosted site by default. `ipad/App.tsx:27` enables shared cookies; lines 37–39 allow HTTPS redirects but reject other schemes. The README explicitly records that the complete hosted sign-in flow still needs a physical-iPad test. No bundled authentication bypass credential was found in the inspected integration code.

**Untested release gate:** from a clean installation, verify signed-out access, successful owner sign-in, return to the game, cookie persistence after restart, and companion sign-in on a second device. Provider-specific embedded-browser restrictions or callback schemes could matter, but the audit does not establish that they fail. If the flow fails, implement the provider-supported authentication route based on observed evidence.

Native loading/network errors have retry and connection-settings actions (`App.tsx:32–42`), and process termination triggers a reload. Installed `react-native-webview/apple/RNCWebViewImpl.m:1462` restricts the iOS HTTP-error callback to the main frame, so this audit does not claim that a failed image request blocks the whole game. Game polling uses a five-second timeout and reports reconnection while local play continues (`game.js:11,34`). JS/rendering failure coverage and process recovery remain device-test items.

## 6. Local networking

The app declares `NSLocalNetworkUsageDescription` and WebView/local HTTP allowances (`ipad/app.json:17–20`). The launcher discovers an IPv4 interface and supplies `EXPO_PUBLIC_GAME_URL` (`ipad/scripts/start-local.mjs:3–12`). The game server binds `0.0.0.0` on port 8787 (`little-mouse/scripts/dev.mjs:4`). These are appropriate ingredients for LAN use; permission grants, denial/recovery, Wi-Fi isolation, and physical reachability were not tested here.

Saved connection addresses intentionally override defaults (`ipad/App.tsx:53–55`); the README tells the owner to replace stale addresses. Local play requires the host computer to remain running. No bundled offline game is promised.

## 7. OTA channels and runtime compatibility

`ipad/eas.json:7–25` separates development, simulator, preview, and production channels. The simulator profile extends the development-client profile; preview is an internal standalone distribution. `ipad/app.json:27–32` configures `runtimeVersion.policy: "appVersion"`, zero startup cache wait, and an Expo update URL matching the project ID. The inspected generated `ipad/ios/LittleMouse/Supporting/Expo.plist` contains runtime `1.0.0`, enabled launch checks, zero wait, and the same update URL.

`ipad/App.tsx:63–71` guards development/disabled-updates mode and provides manual check/download/reload with error feedback. The README correctly requires a new binary and app-version increase for native compatibility changes. Expo documents that runtime compatibility must match and that default startup downloads normally apply on a subsequent restart: [Expo SDK 58 Updates](https://docs.expo.dev/versions/v58.0.0/sdk/updates/).

**Untested:** actual installed preview-channel delivery and production channel mapping. A local simulator development build does not establish preview OTA correctness. Verify an installed preview binary receiving a compatible preview update, and confirm native changes cannot be delivered under an incorrectly reused runtime. No update was published during this audit.

## 8. Owner controls and research-informed usability

Native owner exit requires a 1.2-second hold (`ipad/App.tsx:43`). The game has its own hold-to-pause and Escape handling (`little-mouse/public/game.js:24–25`), plus companion pause commands. Native keep-awake remains active while the Game component is mounted (`App.tsx:13`), including its home/break screens. Whether that behavior is desirable at a session break is a product decision, not a demonstrated malfunction.

Verify hold discoverability, accidental paw activation, home/system gestures, multitouch, rotation, background/resume, and WebView process recovery on target hardware. The configured hold is not an OS-level kiosk lock.

The existing research notes (`little-mouse/public/research.html:1`) correctly distinguish evidence from design inference: physical-toy habituation is not proof about procedural graphics; the laser survey is correlational and not a tablet trial; five-minute sessions and visual presets are adjustable product choices rather than established scientific optima.

The cited tablet study involved 28 human and 16 feline participants over five months, with human-adjustable playback and an emphasis on responsiveness and feline autonomy. The usability implication is to prioritize understandable pause, pacing, and break controls and observation of voluntary engagement; catch counts do not establish enjoyment. This is an inference for testing, not proof of welfare benefit: [Payne et al., Look What the Cat Tapped In](https://eprints.gla.ac.uk/365042/).

## Checks performed

| Check | Outcome |
| --- | --- |
| `cd ipad && npm run typecheck` | Passed (`tsc --noEmit`). |
| `cd ipad && npm test` | Passed, 2/2 tests. |
| `cd little-mouse && npm test` | Passed, 21/21 tests; network tests use in-memory SQLite. |
| `cd ipad && npm run lint --if-present` | Exited successfully, but no lint script exists; lint coverage was not established. |
| Direct Node URL probes above | Reproduced four public-hostname HTTP acceptance cases. |
| Generated iOS plist and installed Expo plugin inspection | Confirmed fullscreen override and all four iPad orientations. |
| Expo SDK 58 documentation and cited tablet-study abstract | Read for version-specific behavior and research context. |

The iPad tests emitted Node's `MODULE_TYPELESS_PACKAGE_JSON` warning; tests still passed. One exploratory file search included absent native-source paths and exited 2; the relevant generated plist was then read successfully. No test/build failure is inferred from those missing search targets.

No simulator, native build, server, app GUI, physical-device test, deploy, or OTA publication was run. Existing test success does not cover authentication, device layout, native networking permissions, or the newly reproduced URL edge cases.

## Original coordinator handoff (superseded by current review above)

1. Fix `expo.ios.requireFullScreen` and regenerate/inspect native output in the coordinator-owned build workflow.
2. Correct full-host URL validation and enforce the same protocol/host policy during navigation; add regression coverage.
3. Add missing-room recovery and decide interrupted-session restoration semantics.
4. Validate private hosted login, physical LAN permission recovery, rotation/fullscreen behavior, owner controls, and installed preview OTA delivery before distribution.

No code fixes were made by this worker.
