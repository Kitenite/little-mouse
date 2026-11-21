# Excursion critic — round 2

Task: excursion-critic. Status: review complete; one support-accounting defect requires repair
before accepting the helper's general discontinuity contract. Round 2 of at most 3.
No repository edits. Initial checklist and round-1 report remain in critic-specific /tmp files.

## Required repair: continuity guards after a visible discontinuity

**P2, reproduced:** a visible eligible discontinuity creates a left-censored active appearance
but clears `previous`. The next sample checks monotonicity using `previous ?? active.last`,
yet gap and speed checks still run only when `previous` exists. The next interval can therefore
bridge a long gap or teleport and add it to cumulative censored duration/path support.

Minimal cases, each with default options and y=.5, eligible=true, visible=true:

- Sample {time:1,x:.2,discontinuity:true}; then {time:101,x:.3}; finalize.
  Actual censored support: 100 seconds, .1 path; gap reason count is zero.
- Sample {time:1,x:.2,discontinuity:true}; then {time:1.1,x:10}; finalize.
  Actual censored support: .1 seconds, 9.8 path; teleport reason count is zero.

Expected: exclude the discontinuous/gapped/teleported interval from observed support and
close/restart the censored segment without granting a witnessed entry. A fix can use a
separate continuity anchor or consistently apply gap/speed guards to the active last sample;
retain the rule that a discontinuity cannot supply an outside entry anchor. Add both cases
as regression tests, plus an ordinary increasing continuous sample after discontinuity.
No completed recurrence is falsely credited in these repros; the error contaminates censored
population support. Current fixed-identity panel does not exercise the failing branch.
Reproducer/results: /tmp/excursion-critic-round2-probe.mjs and round2.json.

## Round-1 findings resolved or bounded

- Cumulative completed/censored duration and path totals survive signature eviction.
  Short is explicitly a completed subset; overflow is explicitly a censored subset.
  Active runs enter totals only on closure; repeated finalize does not double count.
- Overflow path freezes at its retained prefix, flagged by truncatedPathAppearances;
  duration continues through observed visible samples. Documentation disclaims missing
  distances and full-panel distributions. Fixed-size totals preserve bounded memory.
- Independent hand-computed fixture: four completed paths with historySize=1 retain
  1.6 cumulative path and .8 seconds despite three evictions; a censored segment adds
  .2 path and .1 seconds. Detached snapshots and idempotent finalization pass.
- Root fixture now includes phase-only touch and a .025-width hidden relocation, below
  the speed guard threshold. Both fail completion as required; ordinary crossing retains
  center-outside partial endpoints. Hold, hidden, toss and injury controls also pass.
- Identity/viewport changes remain an explicit caller requirement to finalize/recreate
  trackers. Current panel fixes both, so no new integration defect is established there.
  Do not claim general reset/resize/replacement integration verification.

## Exact preserved baseline comparison

Used runtimeDir=/tmp/excursion-motion-baseline/little-mouse/public through the actual
`evaluate({sourceDir: runtimeDir})` API; no current contact.js experiment was evaluated in
this comparison. Archive provenance is recorded by the motion worker as git archive 4ba72c4.
All runtime hashes match the saved original baseline, independently confirming source identity.
Runtime SHA-256: d8d87c72ba617bf9ad2af768a5ca16a5e1f74be243eafcabbf5af514b5eb1c67.

All old row fields match exactly, including old body/route diagnostics, identities, transitions,
chapters, collisions, metrics, objective and gates. Aggregate metrics/objective/gates, settings,
patch and options also match exactly. New diagnostics/provenance/version/timing are separate.
Panel: 12 rows, 360 seconds, 30 Hz, seeds 11/37/83, all four scenarios.

| Cumulative population | Appearances | Duration seconds | Normalized path |
| --- | ---: | ---: | ---: |
| Completed | 889 | 6439.533333 | 2017.770691 |
| Censored | 17 | 73.233333 | 21.522519 |
| Short (completed subset) | 3 | .900000 | .106852 |
| Overflow (censored subset) | 0 | 0 | 0 |

No truncation or saturation in this panel. Counts remain 906 witnessed appearances, 889
natural exits, 17 right-censored, 862 comparisons, three repeated corridors and 122 history
evictions. Pool recurrence as 3/862. Durations span first/last observed visible samples;
they are not exposure seconds including boundary intervals or unseen censored portions.
Whole appearances and old censored movement bouts are different units with different
selection. Neither their count/rate differences nor larger retained support proves efficacy.

## Checks, provenance and handoff

- 51 focused tests pass: excursion, route, visibility and benchmark suites, including updated
  touch/hidden-relocation controls. Log: /tmp/excursion-critic-round2-tests.txt.
- Independent new support/eviction calculation and archived exact baseline comparison pass.
- New guard-bypass probes reproduce the remaining defect despite the passing test suite.
- Round-1 hash-mutation, 30/60/120 Hz, partial-only, censoring and 50,000-sample memory
  probes remain evidence for the reviewed unchanged mechanisms.
- Helper SHA-256 reviewed:
  d7a4c03704647cb438fa775851fc9571210cf6d9a9373564b589ccd6523f428a.
- Benchmark SHA-256 reviewed:
  c901bc3d8e95e1767e3dddb97038026903b73cd0533246003f34a33bd248e079.
- Owning topic docs/behavior-excursions.md read; cumulative support limits are explicit.
- Round-2 artifacts: /tmp/excursion-critic-round2-probe.mjs, round2.json, round2-tests.txt.
  Earlier report: /tmp/EXCURSION-critic-round1.md; initial: /tmp/EXCURSION-critic-checklist.md.

Root owns repair/integration and worker-ledger updates. One bounded review round remains.
The contact.js runtime experiment is outside this review; no acceptance of that repair is
implied. No deployment, rendered-visibility, physical-device or feline-efficacy claim.
