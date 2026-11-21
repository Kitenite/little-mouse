# Excursion critic — round 1

Task: excursion-critic. Baseline 4ba72c44915224f41a27224b3db30d5008960b95.
Status: core diagnostic accepted with limits below; population-support reporting needs an
explicit decision. Round 1 of at most 3. No repository source/document edits by this worker.
Initial checklist: /tmp/EXCURSION-critic-checklist.md.

## Actionable findings

1. **P2 — censored/evicted movement support is unavailable for selection analysis.**
   `close()` discards censored duration/pathLength; history evicts completed records after
   32 appearances. Aggregate counters preserve counts only. Therefore the full panel cannot
   compare how much time/distance belongs to completed versus censored populations, nor
   recover whole-panel duration/length distributions from history. In this panel 122 complete
   records were evicted. Do not summarize history as all appearances or claim unbiased movement.
   Preferred repair: fixed-size cumulative duration/path support split by complete/censored
   (short as an explicit subset), with overflow distance labeled truncated/unknown. Alternatively
   explicitly defer those measurements and limit the report to appearance counts and bounded
   recent signatures. No unbounded history is requested. This is a reporting/coverage gap,
   not a demonstrated recurrence arithmetic error.
2. **P2 — identity/viewport safety is caller-contract only.** Benchmark passes discontinuity
   only for invalid body geometry and never recreates trackers. This is safe for the present
   fixed-identity/fixed-viewport panel, not future replacement/resize/reset scenarios. Helper
   discontinuity does not clear existing history. Keep this limitation explicit; before adding
   such scenarios, finalize the old tracker and create a new one on identity/viewport changes.
   An integration fixture must then verify no comparison against prior identity/viewport.
3. **P3 — extend the adapter fixture with touch-phase and hidden relocation controls.**
   Root's new fixture covers hold, hidden, toss and injury timers and is useful. It does not
   exercise a phase-only touch exclusion or reposition during hidden time. Add a subthreshold
   relocation while hidden and assert no complete appearance bridges it; test release onscreen
   remains left censored. Current source appears correct for these cases; this is coverage,
   not an observed implementation failure.

## Verified behavior

- Hidden/nonactive states produce null body and ineligible samples, so disappearance does
  not become a geometric exit. Ineligible previous samples prevent release witnessing entry.
- Eligibility is independent of center viewport membership; positive neutral-body overlap
  retains negative/>1 normalized centers. Independent partial-only excursion probe completes.
- Left-entry and right-edge observation censoring, interrupted reentry, overflow and natural
  exits pass independent probes. Pauses/returns/labels do not split appearances in builder tests.
- Complete, censored and short/comparison support is explicit; short is a completed subset,
  censor reasons overlap, and recurrence is null without comparison support. Pool counts.
- Endpoint geometry is first/last visible sampled center, not an inferred crossing coordinate.
  Hidden/slow unmarked teleports cannot be reconstructed. Whole appearances still select on
  observed entry and exit; neither this nor old bout recurrence is population-unbiased.
- Bounded memory: independent 50,000-sample moving appearance with maxPoints=8 stays at
  eight stored points and remains overflow censored. Input/snapshot mutation and repeated
  finalization do not alter results. Builder tests also cover history eviction and duration caps.
- Identical linear crossings complete at 30/60/120 Hz. This is limited fixture evidence,
  not proof of frame-rate invariance for arbitrary curved paths or threshold crossings.
- New helper is in individual evaluator hashes and composite benchmark hash before import.
  Independent /tmp-copy helper mutation makes assertEvaluatorUnchanged throw. Existing
  evaluator return checks and candidate fingerprint comparison cover the new dependency.
- Full 12-row training panel exactly matches baseline for every old row field, including
  both old diagnostics, identities, transitions, collisions, chapters, metrics, gates/objective;
  aggregate metrics/objective/gates, settings/patch/options and runtime hash also match.
  Only new diagnostics and expected provenance/version/timing fields differ.

## Same-runtime panel (360 seconds, 30 Hz, seeds 11/37/83, four scenarios)

| New appearance support | Pooled count |
| --- | ---: |
| Observed / witnessed entries | 906 / 906 |
| Natural exits / completed | 889 / 889 |
| Censored / right censored | 17 / 17 |
| Short complete / compared | 3 / 862 |
| Repeated corridors | 3 |
| History evictions | 122 |
| Invalid / gap / teleport / overflow | 0 / 0 / 0 / 0 |

Recurrence is 3/862, not an average of per-mouse ratios. Old published bout support is
1313 classified, 63 short and 972 censored; the exact old diagnostics were preserved here.
The new definition retains visibility-loss endings that old movement bouts censored. Different
segmentation and selection prevent interpreting different rates as better behavior or efficacy.

## Evidence and handoff

- /tmp/excursion-critic-round1-probe.mjs and round1.json: boundary probes, complete panel,
  exact old-field assertions, full new counts and evaluator hashes.
- /tmp/excursion-critic-extra-probe.mjs and extra.json: hash mutation, frame rates,
  50,000-sample bounds, input/snapshot isolation and finalize idempotence.
- /tmp/excursion-critic-baseline-probe.mjs and baseline.json: original immutable-result capture.
- Executed focused helper + benchmark suites: 25 tests pass, including root's newly added
  scripted natural-crossing versus hold/hidden/toss/injury adapter fixture. That fixture uses
  injected runtime movement; it does not establish production policy behavior or device quality.
- Reviewed docs/behavior-excursions.md and initial helper/test integration source.
- Reviewed helper SHA-256:
  1f6ae0d03fd41cdaa8f692ad0a2486ce001dc28c64524418dbbdae2d1778996e.
- Reviewed benchmark SHA-256:
  c901bc3d8e95e1767e3dddb97038026903b73cd0533246003f34a33bd248e079.

Root owns integration and worker-ledger updates. No production/utility/learning changes found
in reviewed diff. No claims of deployment, rendered visibility, feline response or efficacy.
Send the population-support decision and any changed helper/integration for round 2.
