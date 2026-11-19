# Podrick UI handoff

## Implemented

- One illustrated landing with supplied full cats, dark ink, parchment and crooked borders.
- One Play entry; collapsed Sound & settings; quiet corner-exit / Escape instructions.
- No pairing, companion links, developer/research/playground navigation or duplicate native menu.
- Native index directly renders Game using DEFAULT_GAME; existing close prop retained as no-op
  compatibility until root combines the local worker's Game API.
- Recovery IDs/controller retained; pairing report field and recovery copy removed.
- Compact, scrollable local settings preserve controls and finger-sized inputs.
- Hidden 1px preview canvas preserves runtime initialization contract; no simulation changes.

## Ownership and integration

Workspace `1cdd768e-7a48-4a06-a46e-f66d0838c204`, terminal
`ef6a072f-ed57-4054-8a71-f79bca72f302`, branch `podrick-ui`, baseline `9eee66e`.
Root integrates this scoped diff onto rebrand `111d371`; no rebase or reset performed.
No critic delegated. No workers document, native config/splash, Game component, audio,
settings schema, physics or game implementation is included in this handoff.

The original art was recovered with `git show 111d371:ipad/assets/icon.png`, byte-for-byte,
into `little-mouse/public/assets/brand/podrick-cats.png`. No crop or image edits were made.
The layout is inspired by the requested storybook mood; no Don't Starve assets were used.

Runtime smoke temporarily copied `game.js`, `controls.js`, `settings.js` from local-worker
commit `dac9fa4eb39d37794e78c8dd79046a81afa1f5f0`; all were restored before UI commit.
Integrate that dependency with UI: old game.js unconditionally accesses removed pairing IDs.
Local worker removed desktop settings auto-open after UI review found it.

## Checks and evidence

- `npm --prefix ipad run typecheck`: pass with this index and baseline Game signature.
- `npm --prefix ipad run lint`: pass. Root still owns combined native compile/device checks.
- `npm --prefix little-mouse run build`: pass using temporary local-worker runtime dependencies.
- `git diff --check`: pass. Owning topic remains 115 lines.
- Browser: Superset pane `pane-d01652fa-79ad-4184-8d4d-78afad1764ea`, localhost:8793.
- CDP resize, viewport readback and capture occurred in the same live socket; emulation resets
  on detach. Pane zoom was initially 70%; final mobile emulation bypassed it. Final readbacks:
  1440×900, 1366×1024, 1024×768 and 390×844 CSS px; no horizontal document overflow.
- Inspected final desktop, both tablet sizes, mobile, settings and recovery screenshots.
  Cat art is fully visible; Play/settings fit; open settings scroll within the parchment page.
- Boot reached ready. Updating count through its rendered input changed diagnostics to 3.
  Play changed playing to true. Four clockwise corners dispatched as browser PointerEvents
  returned playing false and home visible. Escape also returned home.
- Injected `mouseBoot.fail` showed readable Retry/status. Clicking Retry navigated and returned
  boot ready, preserving the short active-session resume behavior.
- Console inspection showed only the deliberately injected recovery error at final check.

Actual PNG captures and browser harness are retained locally for root review:
`/tmp/podrick-ui-evidence/{desktop,ipad-home,ipad-large,ipad-settings,ipad-play,ipad-exit,ipad-retry,ipad-recovered,phone}.png`
and `/tmp/podrick-ui-browser.mjs`. They are not published or committed.
Ignore earlier `test.png`: it demonstrates an incorrect pane-zoom capture, not final layout.

## Remaining limits

- Physical iPad rotation, WKWebView appearance, real paw touches and native splash need root checks.
- Raw CDP mouse/touch inputs did not trigger corner exit in this pane; the successful corner
  smoke used synthetic DOM PointerEvents. This is runtime wiring evidence, not physical input proof.
- Play screenshot captured the initial hidden hunt phase; slow/background browser animation
  did not establish sustained mouse rendering or frame cadence. Root should inspect moving play.
- No listening, squeak loudness, cat engagement, deployment, device install or restart claimed.
- Many existing tuning groups remain within collapsed local settings; this UI does not alter
  their schema or remove useful controls. Sound control ordering belongs to controls.js owner.
- No remote fonts, image generation, new runtime dependencies or recurring automation added.
