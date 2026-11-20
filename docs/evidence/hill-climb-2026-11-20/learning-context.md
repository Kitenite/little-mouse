# Learning context handoff

Task: eliminate cross-settings/build/device pooling in bounded local duration learning.
Status: implemented and independently reviewed root wiring; automated checks pass. No commit/push,
no native/browser changes, no runtime/game/controls edits by this worker.

## Owned files changed
- little-mouse/public/play-learning.js
- little-mouse/tests/play-learning.test.mjs
- docs/behavior-learning.md (120 lines)
- docs/experiments/learning.md (71 lines)

API recipe: /tmp/learning-context-api.md (written early, now marked implemented).
Root retains docs/workers.md ownership and runtime/game/controls integration ownership.

## Implementation
- Full validated settingsSchema snapshot; canonical sorted keys/lowercase colors.
- Bounded policy/build strings and normalized coarse platform, arena width/height and pixel ratio.
- Closed projection strips arbitrary nested extras; invalid required fields yield null context.
- Distinct sessions contribute support only when canonical context exactly matches current query.
- configure({context}) sets ephemeral default; start snapshots; status({context}) queries read-only.
- Missing/current-context-not-supplied defaults to support zero/multipliers one, never stored context.
- configure context changes permanently exclude an active mixed-context session.
- Frozen/reset/local limits, three-session threshold, trainingReady:false and owner-ended completion preserved.
- Export v2, unchanged storage key. V1 metrics/decisions survive with legacy heuristic provenance,
  context:null and no eligibility. V2 revalidates/project snapshots; migration also prunes to size cap.
- Cross-realm plain/null-prototype objects accepted via prototype ancestry, classes/custom chains rejected.
  Regression test reproduces VM-to-imported-module boundary. No new libraries or runtime self-modification.

## Independent root wiring review
Read game.js, play-learning-runtime.js and controls without editing them.
- Game measures visible board before context snapshot/start, supplies current full config and fetched /api/version.
- runtime.begin ends previous session incomplete, configures context before status/start.
- Multiplier query follows runtime.begin so it selects the same current context.
- Missing build is invalid and stays descriptive for that session; late fetch cannot retroactively qualify it.
- Coarse web/native-unknown platform avoids navigator fingerprinting.
- Settings changes, resize, reload, recovery/background end learning incomplete.
No blocking wiring finding remains in inspected paths. Cross-realm validation failure was in my module;
fixed there and independently reran the formerly failing actual-build integration test successfully.

## Checks
- node --test little-mouse/tests/enrichment.test.mjs little-mouse/tests/play-learning-runtime.test.mjs little-mouse/tests/play-learning.test.mjs
  PASS 56/56 (31 integration, 5 runtime, 20 learner). Injected audio failure logs are expected passing recovery tests.
- node --test little-mouse/tests/play-learning.test.mjs little-mouse/tests/play-learning-runtime.test.mjs little-mouse/tests/boot-recovery.test.mjs
  PASS 32/32 (20 learner, 5 runtime, 7 boot).
- git diff --check PASS.
- Owning docs: 120/71 lines, no split/index change needed.

## Limits and root follow-through
No physical-device/cat efficacy, deployment or visual/audio acceptance claimed. Platform/dimensions are
coarse context, not physical-device or cat identity. Root must keep supplying context and terminating or
excluding sessions when settings/device change. Retention remains rolling: adding snapshots may prune
old sessions sooner at the existing 500,000-character budget; droppedSessions reports this.
Only current metric version and legacy/current supported heuristic versions migrate; corrupt unsupported
schemas remain rejected safely. Full research/OPE dataset and trained models remain out of scope.
