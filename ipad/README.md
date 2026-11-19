# Podrick’s Violin for iPad

An Expo / React Native iPad app hosting the existing Three.js game in WKWebView. It preserves the live companion, game releases, hit reactions, and settings without maintaining a second renderer.

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

## Control from your phone

1. Connect the phone to the same Wi-Fi as the computer and iPad. No phone app is needed.
2. On the iPad’s game home screen, tap **Create pairing code**. During play, briefly tap the four corners clockwise (top-left, top-right, bottom-right, bottom-left) within four seconds, or pause from the companion.
3. In Safari or Chrome on your phone, open the **Companion** URL printed in the terminal, such as `http://COMPUTER-IP:8787/companion`. The native **Share companion** button can share this address.
4. Enter the iPad’s 16-character code and tap **Connect**. Spaces in the displayed code are accepted.
5. Use **Play**, **Pause**, the steering pad, or the settings to control the iPad live. Changes to mouse count, movement, speed, size and background apply without restarting the session.

If the phone says it is waiting for the game, keep the iPad app visible and its screen unlocked. If either device cannot connect, check Wi-Fi and local-network permission, and use the current address printed by `npm run local`; the computer’s address may change after switching networks.

To test without Expo Go, open the printed game address with `/?surface=ipad` in iPad Safari. The same companion and automatic game-code reload work there.

Saved addresses persist. If you previously saved another address, replace it with the current one printed by `npm run local`. After pausing, tap **app settings** to leave the game. This button is hidden during play. The screen stays awake during active play.

## Hosted play

The default for builds is:

https://little-mouse-cat-play-kietho.weedypiece1.chatgpt.site

Select **Use the hosted game** in the app to switch back. The site remains private, so it may require owner sign-in; no credentials or private-site bypass token are bundled. The complete hosted sign-in flow still needs testing on a physical iPad. There is no bundled offline copy: first load requires the hosted site or local server.

## Updates

- **Game, textures, movement, backgrounds, companion while testing:** save files in `../little-mouse/public`. The LAN server detects changes and the iPad reloads automatically, preserving pairing and session progress. No deployment or native rebuild is required. Changes to server API code restart the local server automatically.
- **Live tuning:** change settings or steer mice on the phone/laptop companion; paired iPads poll every 400 ms. Controls also remain on the iPad.
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

## Verification completed

On 2026-11-17, the iPad simulator build succeeded and rendered the fullscreen game. Expo lint/typecheck, 2 connection tests, 20 Expo Doctor checks and the iOS export passed. The browser companion also paired with the native iPad simulator and remotely started/paused it. Browser QA verified paired controls in both directions, remote pause, portrait/landscape layout and saved-file reload preserving pairing and elapsed time. See the current game test output for the expanded policy, contact, geometry, audio and API regression suite.

The initial iOS preview update (runtime 1.0.0) is published: https://expo.dev/accounts/flyakiet/projects/little-mouse-ipad/updates/e8bcd8b8-a5e0-4899-9f29-78cb5e69dfd2 . Publication does not verify delivery to a signed physical preview build; physical iPad performance, permissions and hosted login remain to test.
