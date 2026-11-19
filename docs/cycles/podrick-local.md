# Podrick local-control handoff

Task: `local`. Implemented in isolated `podrick-local` workspace; root integrates onto
rebrand baseline `111d371`. No device restart, installation, deployment or listening performed.

## Changes

- Removed companion JS/HTML, room API, schema/migration metadata and D1 binding request.
- Removed game pairing, durable command queues, remote settings, command handling and telemetry.
- Retained read-only `/api/version` fingerprint checks, checkpointed reload and offline play.
- Preserved settings/profiles, rich numeric defaults, local play/pause, four-corner exit,
  pointer audio activation/feedback, contacts, physics, behavior and boot recovery hooks.
- Removed visible remote Manual choice; legacy manual saves start in normal local hunt.
- Settings start collapsed on web and iPad. Existing grouped controls remain available.
- Removed native companion URL helper and connection overlay. Game uses `url`; optional
  unused `close` prop permits UI integration without a breaking intermediate type change.
- Native loading overlay references `ipad/assets/icon.png`, contain at 320, dark `#19150f`.
  Root supplies the original artwork from baseline; this commit does not replace assets/config.
- Existing local database files and obsolete browser keys are retained but never accessed.

## Checks

- `npm --prefix little-mouse test`: 265 passed, including local mode migration, local settings,
  play/pause, recovery, contacts, version reload, absence of endpoints and database usage.
- `npm --prefix little-mouse run build`: passed.
- Built-worker and isolated dev-server HTTP smoke: companion paths and room/command paths
  return 404; asset-version endpoint returns 200. Temporary server stopped after this check.
- `npm --prefix ipad test`: 4 passed (URL validation and native recovery checkpoint bridge).
- `npm --prefix ipad run lint`: passed after dependency installation.
- `npm --prefix ipad run typecheck`: expected integration failure only: untouched UI-owned
  `src/app/index.tsx` still imports removed `companionUrl`. UI worker removes this import;
  root must rerun typecheck after integrating both commits.
- `git diff --check`: passed.

## Coordination and limits

UI workspace `1cdd768e-7a48-4a06-a46e-f66d0838c204`, terminal
`ef6a072f-ed57-4054-8a71-f79bca72f302` received DOM/props contract via Superset.
It may copy game/controls for browser smoke without committing them. UI owns index HTML/CSS,
inline recovery cleanup and native index. Root owns workers, final verification, splash,
correct baseline artwork and native compilation. No critic was delegated.

Physical artwork continuity, audio audibility and device interaction remain unverified here.
Source tests do not establish visual quality or animal engagement. Historical research text
outside this scope may still mention the superseded companion direction; root should reconcile
active research/playground prose. Browser smoke belongs to UI's separate evidence record.
