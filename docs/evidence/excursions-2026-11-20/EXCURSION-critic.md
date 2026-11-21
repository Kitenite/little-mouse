# Excursion critic — final round 3

Task: excursion-critic. Status: **accepted for the documented offline diagnostic contract**.
Three bounded review rounds complete. No unresolved defect in the reviewed scope.
Baseline: 4ba72c44915224f41a27224b3db30d5008960b95. No repository edits by this critic.
Root owns integration, status/worker-ledger updates and any separate runtime repair.

## Final correction verified

The helper now uses `previous ?? active.last` consistently for monotonic, gap and speed
guards while keeping witnessed-entry evidence separate. Independent original repros pass:

- Visible discontinuity at time 1, x=.2 followed at time 101, x=.3: gap reason=1;
  two censored segments, zero witnessed entries, zero cumulative duration/path across gap.
- Visible discontinuity at time 1, x=.2 followed at time 1.1, x=10: teleport reason=1;
  two censored segments, zero witnessed entries, zero cumulative duration/path across jump.
- Ordinary samples (1,.2), (1.1,.3), (1.2,.4), first discontinuous: retain .2 observed
  seconds and .2 path in a left/right-censored appearance, with no witnessed entry.

These fix round 2's support contamination without granting completion or hiding invalid
intervals. Final helper hash matches the builder handoff exactly.

## Accepted measurement behavior and preserved limits

- Natural completion requires observed continuous eligible invisible→visible→invisible
  samples. Hidden-state disappearance is an exclusion, not an inferred geometric exit.
- Positive neutral-core overlap admits partial silhouettes with centers outside the viewport;
  actual centers remain unclamped. Body geometry is neutral, not rendered pixels/articulation.
- Late entry, trailing observation, hold/toss/touch/injury, hidden relocation, invalid input,
  explicit discontinuities, gaps and speed jumps retain censoring. Pauses/labels/loop returns
  do not split an appearance. Slower unmarked relocation remains unknowable to the helper.
- Cumulative completed/censored support survives history eviction. Short is a completed
  subset; overflow is a censored subset. Never sum subsets into their parent denominator.
- Overflow freezes path at its retained prefix and labels truncation; observed duration
  continues. Active runs enter support only on closure; repeated finalize does not add twice.
- Independent hand-computed eviction/support fixture passes. Bounded history, fixed-size
  support, input/snapshot isolation and 50,000-sample bounded-storage evidence remain valid.
- Recurrence denominator is supported nonshort comparisons; no-support stays null.
  Pool counts, not per-mouse ratios. Complete-only history remains a bounded recent sample.
- Entry/exit geometry uses first/last visible samples and adjacent invisible-center edge
  labels. No exact crossing-time/boundary claim or population-unbiased recurrence claim.
- Identity/viewport reset remains a caller requirement to finalize/recreate trackers. Current
  panel fixes both. This review does not establish general replacement/resize/reset wiring.
- Benchmark includes excursion helper in pre-import individual/composite fingerprints and
  source-change rejection; candidate fingerprint comparisons cover the new dependency.

## Archived same-runtime comparison

Used runtimeDir=/tmp/excursion-motion-baseline/little-mouse/public through
`evaluate({sourceDir: runtimeDir})`. Archive provenance is the motion worker's documented
`git archive 4ba72c4`; all runtime hashes match the critic's saved original baseline.
Runtime SHA-256: d8d87c72ba617bf9ad2af768a5ca16a5e1f74be243eafcabbf5af514b5eb1c67.

All old row fields match exactly: old body/route diagnostics, identities, transitions, chapters,
collisions, metrics, objectives and gates. Aggregate metrics/objective/gates, settings, patch
and options also match exactly. New cumulative support exactly matches round 2 on the same
runtime. No current candidate2 contact.js motion patch is included in this comparison.
Panel: 12 rows, 360 seconds, 30 Hz, seeds 11/37/83, all four scenarios.

| Cumulative population | Appearances | Duration seconds | Normalized path |
| --- | ---: | ---: | ---: |
| Completed | 889 | 6439.533333 | 2017.770691 |
| Censored | 17 | 73.233333 | 21.522519 |
| Short (completed subset) | 3 | .900000 | .106852 |
| Overflow (censored subset) | 0 | 0 | 0 |

No truncation or saturation in this panel. Support remains 906 witnessed appearances,
889 natural exits, 17 right-censored, 862 comparisons, three repeats and 122 history evictions.
Pool recurrence as 3/862. Durations exclude invisible boundaries/unobserved censored portions.
Old route diagnostic retains 1313 classified, 63 short and 972 censored bouts unchanged.
The new diagnostic preserves visibility-loss endings previously censored, but segmentation
and selection differ. This is improved measurement support, not evidence of improved behavior.

## Final checks and exact evaluator sources

53 focused tests pass (excursion, route, visibility and benchmark). Updated integration fixture
passes natural crossing and hold/hidden/hidden-relocation/touch/toss/injury controls. Tests use
scripted runtime movement for adapter isolation; this is not production movement evidence.
Default runtime for this final test invocation was the archived baseline via BEHAVIOR_SOURCE_DIR.
Independent round-3 probe asserts fixed repros, ordinary discontinuity continuation, cumulative
support after eviction, exact old fields and exact archived same-runtime population support.

SHA-256:
- behavior-excursions.mjs:
  0f8104934e85f539723b346c161beaaed9ed1b4a55dcbfce4b0b30a18062f0e0
- behavior-benchmark.mjs:
  c901bc3d8e95e1767e3dddb97038026903b73cd0533246003f34a33bd248e079
- behavior-route-metrics.mjs:
  20b7b16d574c329260957861e1425bedb12f19373ec7f599b1053fc385798064
- behavior-visibility.mjs:
  c44ae68247f9880ff2ac1294986e1ff3b5ee5783aaf508065f6b41a58e2bb981

Evidence: /tmp/excursion-critic-round3-probe.mjs, /tmp/excursion-critic-round3.json,
/tmp/excursion-critic-round3-tests.txt. Earlier round-1/2 reports are preserved as
/tmp/EXCURSION-critic-round1.md and /tmp/EXCURSION-critic-round2.md; initial checklist is
/tmp/EXCURSION-critic-checklist.md. Baseline capture and earlier probes remain unchanged.
Owning topic read: docs/behavior-excursions.md, 118 lines; root may update its review status.

No utility/defaults/learning acceptance change is authorized here. Candidate2 motion repair
is independently reviewed elsewhere. No deployment, device, rendered quality or feline
engagement/efficacy claim follows from this diagnostic acceptance.
