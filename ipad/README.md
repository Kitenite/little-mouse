# Podrick’s Violin for iPad

An Expo / React Native iPad app hosting the existing Three.js game in WKWebView. It preserves local controls, game releases, hit reactions, and settings without maintaining a second renderer.

## Installed development app

Little Mouse can be installed directly on a connected iPad using Xcode signing: run `npm run ios -- --device`. During development, keep `npm run local` running and open the installed Little Mouse app. The computer and tablet need network connectivity for Metro and the game server; the USB cable alone does not publish game updates.

## Optional Expo Go route

Install [Expo Go](https://expo.dev/go) on the iPad, connect it to the same Wi-Fi as the computer, then run these commands from the repository root:

```sh
npm --prefix little-mouse ci
npm --prefix ipad ci
cd ipad
npx expo login
npm run local
```

Sign into Expo Go with the same Expo account used by the computer. Physical iOS devices require matching accounts; see [Expo’s setup instructions](https://docs.expo.dev/get-started/start-developing/). If the computer is already signed in, skip `npx expo login`; `npx expo whoami` shows its account.

Scan the terminal QR code with the iPad Camera. The launcher also prints an iOS browser link that opens the project in Expo Go. Tap **Let’s play** in the app, then the game’s play button. Allow local-network access if iOS asks. The script discovers this computer’s LAN address, starts the game server if necessary, and runs Expo on port 8088. Keep the terminal open and the computer awake for local play.

## Local play and owner controls

Open the game, tap Play, and tune settings or save profiles on the play device. To pause,
briefly tap corners clockwise: top-left, top-right, bottom-right, bottom-left within four
seconds. The screen stays awake during play. There is no remote companion or pairing.
The native loading view uses the supplied cat artwork; failed loads keep a local Retry action.

To test in Safari, open the printed game address with `/?surface=ipad`. The same local controls
and automatic asset-version reload work there. First load still needs a reachable server.

## Hosted play

The default for builds is:

https://little-mouse-cat-play-kietho.weedypiece1.chatgpt.site

Select **Use the hosted game** in the app to switch back. The site remains private, so it may require owner sign-in; no credentials or private-site bypass token are bundled. The complete hosted sign-in flow still needs testing on a physical iPad. There is no bundled offline copy: first load requires the hosted site or local server.

## Updates

- **Game, textures, movement, backgrounds while testing:** save files in `../little-mouse/public`. The LAN server detects changes and the iPad reloads automatically, preserving local settings and session progress. No deployment or native rebuild is required. Changes to server API code restart the local server automatically.
- **Hosted game releases:** deploy the `../little-mouse` site. The same version polling reloads the game when a release arrives.
- **App TypeScript and styles during development:** Expo Fast Refresh.
- **Installed app JavaScript:** EAS Update. Preview builds use the `preview` channel. Publish with `npm run update:preview -- --message "Describe change" --environment preview`. The app checks on launch; the owner can also tap **Update app** to download/apply immediately. Expo Go uses Metro instead.
- **Native libraries, permissions, SDK changes:** create a new binary. Increase the app version when changing native runtime compatibility; `runtimeVersion` uses `appVersion`.

Expo project: https://expo.dev/accounts/flyakiet/projects/little-mouse-ipad

## Builds

```sh
# Local Xcode simulator or connected device build
npm run ios -- --device

# EAS simulator development build (no Apple device signing)
npm run build:simulator

# Standalone preview install on a registered physical iPad
npm run build:ipad

# TestFlight / App Store binary (submission is separate)
npx eas-cli@latest build --platform ios --profile production
```

Physical standalone installation requires Apple signing and provisioning for your device. EAS can guide you through device registration and Apple Developer credentials. No App Store/TestFlight submission is performed by this setup.

The app ID is `com.flyakiet.littlemouse`. Native projects are generated from `app.json` using Expo prebuild and ignored in Git. The native app supports landscape-left and landscape-right only, retaining full-screen iPad support. Orientation is native configuration: existing generated projects must run `npx expo prebuild --platform ios --no-install` before the next signed binary rebuild/install; web reload and EAS Update alone cannot change the installed orientation mask. Local HTTP is allowed only in WebView; user-entered public URLs require HTTPS.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform ios
```

SDK versions follow the generated Expo 58 template and `expo install` compatibility resolution. `npm audit` currently reports transitive Expo/Metro glob-tooling advisories; its suggested automatic fix would downgrade the SDK. These are not suppressed or force-downgraded. Recheck upstream updates before distributing broadly.

## Validation status

See [the local-control handoff](../docs/cycles/podrick-local.md) for current source checks.
Physical iPad sound, performance, permissions, hosted login and artwork continuity require
separate device validation. These source edits do not deploy, install or restart a device.
