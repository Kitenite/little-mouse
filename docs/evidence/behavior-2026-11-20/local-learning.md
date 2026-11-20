# Local learning handoff

Status: implemented owned standalone module/docs/tests; no commit/push or unowned edits.

Files:
- little-mouse/public/play-learning.js (new)
- little-mouse/tests/play-learning.test.mjs (new)
- docs/behavior-learning.md (new, 91 lines)
- docs/experiments/learning.md (updated, 65 lines)

API recipe: ../../../behavior-learning.md (initial contract plus final additions).
Exports createPlayLearning(storage), metricVersion, heuristicVersion, storage key and limits.
Methods start/end/sample/contact/decision/configure/status/export/reset. Actor preference is durable,
unknown by default. Root owns runtime adapter, controls, game integration and chapter clock.

Evidence: node --test little-mouse/tests/play-learning.test.mjs little-mouse/tests/play-learning-runtime.test.mjs little-mouse/tests/hunt-chapters.test.mjs
21/21 pass (13 module tests plus root-owned adapter/chapter tests at time of run).
node --check little-mouse/public/play-learning.js passed; final focused tests import it successfully. Scoped git diff --check passed.

Behavior:
Three distinct complete explicit-cat sessions with >=30 eligible visible mouse-seconds/chapter
before bias. One contact-presence observation per chapter/session; six-session symmetric prior;
multiplier bounded +/-15%. Hold/drag/cancel/injury never provide positive evidence. Manual,
experiment, unknown/human/test, freeze-spanning and interrupted sessions excluded. Sticky exclusion.
Actual normalized travel, wrapped rotations, elapsed/visible mouse-seconds and route repetition;
execution ID dominates changing geometry signature. Critic hold-release leak repaired: BOTH
endpoints must be non-discontinuous for motion AND eligible exposure. Regression passes.

Bounded local restore/projection;32 records,8 mice,64 route signatures,512 contacts,128 decisions;
500000 serialized-character retention cap enforced before every persist; full decision-log
regression confirms stored payload restores. Status/export expose droppedSessions/droppedDecisions.
Export explicitly declares trainingReady:false. Absent storage reports storageMode:memory-only. No per-frame writes, uploads or automatic stop.
Frozen policy returns1; reset clears data and preference; JSON export excludes active session.

Integration/remaining ownership:
Root snapshots multipliers at new play, applies clamp(baseDuration*scale,30,65) only at chapter
boundary and preserves all-six shuffled deck. Root owns docs/workers.md and docs/README.md links;
these were deliberately not edited because strict ownership excludes them. experiments/README.md
still says learner pending and needs root reconciliation now that module/integration exist.
No full build/device/visual/cat efficacy claim from this worker. Final combined checks belong to root.

Known limits: contact presence is an authored proxy, not enjoyment/attention or causal evidence.
Eligible visible exposure excludes hold/toss discontinuities and their release interval. Mouse-second
denominators differ from wall-clock union exposure. Observations depend on root visibility and
teleport flags; endpoint rotation sampling aliases unsampled turns. Retention forgets evicted IDs,
so caller must use globally unique session IDs. Decision log truncates at128 entries/session;
no build/settings/device snapshots (provenance limit). Restore validation is not tamper attestation.
