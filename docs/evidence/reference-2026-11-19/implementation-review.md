# Independent review: hunt-route implementation

## Outcome

No remaining blocker reproduced. After the braking fix and final hidden-reentry refinement, the relevant six-file suite passes all 73 tests. Both the original orbit blocker and the intermediate legacy-fixture failure are resolved. The original implementation had a reproducible repeated-orbit blocker; the current fix clears that reproduction and the 1,200-case sweep. This is source and simulation acceptance, not visual/reference parity or physical-device verification.

Repository files were not edited by this reviewer. Reports and supplemental scripts are under /tmp/podrick-reference/airdrop only. The earlier full policy critique and measurement methodology are in critic.md.

## Scope / reviewed version

Reviewed the changes in little-mouse/public/hunt-routes.js, enrichment.js and physics.js. Read relevant existing contact/behavior code for priority context and ran the relevant existing and newly added tests. Reviewed the fix in which cruising only disables the intermediate arrival latch; desired speed retains Math.min(pace,d*3)*alignment*alignment.

SHA-256 fingerprints after the braking fix, before the subsequent hidden-cover change:

- hunt-routes.js: abb19ee3dac26bdea0c8b516a4eff9dc8ed88364b005795dd8694dcc69e3eb31
- enrichment.js: 569391ef94baf9d999c2cdbdc31cc5a9cc1724521f925dde7aea7802d4e05913
- physics.js: 8950f817cd77e8f114a1528bcd0e7ae15aa5a53850d4708d7927e5651f96648f

## Blocker found and resolved: repeated orbit around intermediate waypoint

Initial implementation removed both distance braking and arrival latching while cruising. hunt-routes.js advanceHuntRoute() only increments the waypoint index inside a speed-based proximity radius capped at 18% of the shorter viewport dimension. At supported high settings, the mouse could orbit outside that radius; no swept progression or braking brought it inside. The dart watchdog eventually abandoned the route, but only after multiple full turns.

Exact minimal reproduction is saved as repro-route-spin.mjs. Run:

    node /tmp/podrick-reference/airdrop/repro-route-spin.mjs

Fixture: 390x844, speed 4, travelSpeed 4, size 3.9, otherwise settingsDefaults; starts (78,253.2), heading pi/4, zero velocity. Dart route points [[0.54,0.3138106572907418],[0.88,0.2778890570625663]], no hesitation, deadline 12 seconds. Those points came from planHuntRoute during the seeded sweep; this is not an invalid or non-finite route.

Before fix:

| Hz | Time to watchdog watch | Waypoint index | Total / absolute net turn | Closest approach to first point | Lookahead cap |
| --- | --- | --- | --- | --- | --- |
| 30 | 3.033 s | 0 | 17.583 radians | 82.90 px | 70.2 px |
| 60 | 3.033 s | 0 | 17.683 radians | 81.60 px | 70.2 px |
| 120 | 3.017 s | 0 | 17.633 radians | 81.60 px | 70.2 px |

That is approximately 2.8 full same-direction turns without waypoint progress. The original 1,200-case sweep had 279 cases that failed to reach the route's final point before abandoning dart or timing out.

After fix:

- Same minimal reproduction reaches waypoint index 1 and leaves dart normally at approximately 1.58–1.67 seconds.
- Accumulated turning falls to approximately 1.27–1.35 radians.
- All 1,200 sweep fixtures reach their final point within 8 px; zero failures.
- Restoring distance braking addresses the actual turning-demand mismatch while lookahead still advances intermediate points before arrival. Keep this reproduction in a durable regression test, particularly at maximum supported settings and narrow viewports.

## Route progression and final arrival

Observed: phase entry deletes the old route and progress state. A route is authored once, normalized to the viewport, and index advances monotonically at waypoint proximity. Advancing deletes progress-watchdog history so the new segment is not measured against the previous segment's distance. Hesitation is scheduled once via pauseUsed. Final indices do not qualify as cruising, so swept final arrival and arrivalTarget latching remain active.

Checks: new repository tests verify moving through an intermediate bend, final stop, one-shot hesitation, basic priority, and finite route generation. Supplemental final-goal fixtures at 30/60/120 Hz keep a final route target active for six seconds and assert settled speed below 0.01 and unchanged heading after arrival; all pass.

Limit: the stress sweep uses a 12-second deadline to isolate route traversal. Production route deadlines are at least 8 seconds and depend on viewport/pace; the ordinary hunt-policy tests also pass, but the sweep alone is not proof that every generated route completes before every production deadline. Completion is not a substitute for measuring curvature or unnecessary correction turns. A second sweep stops at the first final-point arrival and reports maximum cumulative absolute turning 9.234 radians; multi-bend routes and an initially opposing heading can legitimately accumulate substantial turning. This aggregate is not evidence of a stationary spin, nor proof every turn looks natural.

## Paw, hold, injury and reaction priority

No priority regression reproduced.

- Held-body policy returns before route advancement, and physics pins the body before free-travel logic. A one-second held-route fixture preserves position and route index at each frame rate.
- Injury handling precedes route advancement; isHuntCruising requires dart phase. Direct damage fixtures enter injury and disable cruising.
- A fresh nearby cue still becomes delayed retreat and deletes the old route on phase entry.
- A live paw within threat range overrides a pending route pause and moves the mouse away. Physics still runs avoidPaws/constrainPaws and disables cruising when threatened.
- Existing contact, hold/toss, touch-reaction, injury-recovery and manual-takeover suites remain green.

The supplemental priority checks use actual beginContact and pressMouse APIs rather than only assigning an injury label. They are saved as check-route-priority.mjs: five scenarios at 30/60/120 Hz, 15 passing fixtures total.

Limit: this does not exhaust overlapping/moving multi-paw configurations or inter-mouse collision geometry. Existing target projection and stateless detour steering remain unchanged; the original critique's concern about alternating detours remains an unproven hypothesis, not a blocker attributed to this diff.

## Tests and methodology

Repository command:

    node --test little-mouse/tests/hunt-routes.test.mjs little-mouse/tests/hunt-policy.test.mjs little-mouse/tests/physics.test.mjs little-mouse/tests/contact.test.mjs little-mouse/tests/touch-reactions.test.mjs little-mouse/tests/behavior.test.mjs

Result after fix: 71 passed, 0 failed. Before the new route tests appeared, the 67 relevant existing tests also passed even on the faulty cruising implementation. That demonstrates why the maximum-setting route reproduction matters.

Supplemental commands:

    node /tmp/podrick-reference/airdrop/check-routes.mjs
    node /tmp/podrick-reference/airdrop/check-route-first-completion.mjs
    node /tmp/podrick-reference/airdrop/repro-route-spin.mjs
    node /tmp/podrick-reference/airdrop/check-route-priority.mjs

Sweep matrix: 3 frame rates (30/60/120), 2 viewports (1024x768 and 390x844), 2 presets (actual settingsDefaults and speed/travelSpeed 4 with size 3.9), 100 deterministic seeds = 1,200 fixtures. One mouse begins at (0.2w,0.3h), heading (seed mod 8)*pi/4, zero velocity. LCG is imul(seed,1664525)+1013904223 unsigned, divided by 4294967296. Initialize policy, force dart, assign a freshly generated route, and run policy before physics. No paws or collisions in the sweep. Arrival means final index and distance below 8 px. First-completion variant ends each case as soon as that criterion is met; the original variant continues until leaving dart, which can include a subsequent dart and therefore overstates turning for one route. Both variants have zero failures on the current fix.

## Nonblocking follow-up

The implementation is directionally consistent with broad runs and continuous bends while preserving final stops and interruptions. The subsequent hidden-cover change addresses same-edge reentry bias (see recheck below). The frequent peek-to-traverse-to-hide template identified in critic.md remains a nonblocking visual-comparison consideration. It also does not establish rounded-looking U-turns, a measured 0.2–0.6-second visible pause distribution, or equivalence with the supplied footage. Those require continuous rendered review and actual stopped-duration measurements; timer values alone are insufficient. No source changes or further scope expansion are proposed as a prerequisite to accepting this focused fix.

Handoff: lead owns durable regression coverage, evidence docs and visual comparison. Preserve the maximum-speed narrow-viewport reproduction as the resolved blocker. No repository edits or commits made by reviewer.


## Final recheck: hidden-cover distance scoring — accepted

Final enrichment.js SHA-256: 0e456d69ec276dd8ec5c15292f01472a0c2b6aa693e71419924ec91f68fa5568.

The lead refined the change to remove distance cost only for actual hidden reentries (`m.state === 'away' && m.hunt`), preserving it for initial cover selection (`!m.hunt`) and active retreat. Familiar preference remains 35%; touch and paw penalties remain unchanged. This addresses the original nearest-exit bias while preserving the initial-cover fixture.

Reran the relevant six-file suite once after this refinement: **73 passed, 0 failed**. This includes the formerly failing seed-42 blocked-familiar-entrance fixture, the new 600-second reentry regression, and the maximum-setting route regression. The prior fixture failure was on the intermediate version that also removed initial-cover distance cost; it is resolved, with no test relaxation required.

No remaining blocker from this review. The lead reports 332 full-suite passes; my independent final verification is the 73-test relevant suite, plus the earlier route/priority checks documented above. No further exploration, repository edits or commits by reviewer. Lead owns report preservation and worker closure.
