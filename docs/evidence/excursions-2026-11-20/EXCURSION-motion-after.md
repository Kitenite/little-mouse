# Independent candidate motion review — first patch

Verdict: **NOT ACCEPTED YET — confirmed clearance regression**, despite substantial motion gains.
Root acknowledged the regression and is preparing a revised radial/tangential repair.
Read-only repository review; all critic writes are `/tmp/excursion-motion*` or this report.
No defaults/gates/utility edits, extra seed search, commits, deploys, restarts or subagents.
This regression review is separate from the completed three baseline exploratory investigations.

## Frozen sources and exact scope

Baseline `/tmp/excursion-motion-baseline/little-mouse` is preserved from `4ba72c4`.
Candidate `/tmp/excursion-motion-candidate/little-mouse` is a copied snapshot, not live imports.
Only contact.js differs among 42 runtime JS hashes; settings defaults compare exactly.
Reviewed candidate contact.js SHA256:
`df7ffb1c3ecfc7fb9b2bfd97197055470b68f62c9b972412dddf6d3256e58edc`.
Current repo contact hash matched that snapshot at review completion; subsequent root edits are separate.
Existing panel only: passive/persistent central paw × seeds23/59 ×30/60/120Hz ×180s.
Two default mice, 1024×768, paw (512,384) radius50, actual hunt/group/physics, seeded randomness.
Twelve runs: 2,160 simulation seconds /4,320 mouse-seconds; all sampled states finite.
All SIX passive JSONL traces are byte-identical to baseline, not merely similar aggregate scores.
The existing creep regression uses its original seed11 fixture; no new exploratory seed was added.

## Blocking safety evidence

The six paw rows do not uniformly preserve clearance. Maximum frame-end penetration into
radius161.54 clearance (mouse radius111.54 +paw50) changes as follows:

| Seed / Hz | Baseline px | Candidate px |
| --- | ---: | ---: |
| 23 /30 | ~0 | 1.2062 |
| 23 /60 | 1.0949 | 1.6209 |
| 23 /120 | 2.6356 | 4.9986 |
| 59 /30 | 2.7559 | .8371 |
| 59 /60 | 2.1122 | 1.7353 |
| 59 /120 | 3.4259 | 1.5660 |

These divergent full-session maxima alone are not a matched causal comparison.
The isolated matched approach below confirms that the new steering can worsen clearance.
Worst candidate sample: seed23/paw/120Hz, mouse1, t137.891667, position(360.8166,424.6052),
heading.22802 rad, dart, target(901.12,362.53196), zero collision impulses.
Minimum distance156.541354: penetration4.998646 px. This is clearance-buffer intrusion,
not a claim that the rendered mouse overlaps the paw's physical center/outline.

Exact probe: `/tmp/excursion-motion-after-safety-probe.mjs`.
Run: `node /tmp/excursion-motion-after-safety-probe.mjs`.
It reconstructs observed dart-entry position(-33.547104,439.687877), heading0, zero velocity
at t137.558333, same fixed intermediate goal, default dart huntSpeed, no companion; runs1.5s.
Both variants start identically with fresh avoidance state; this is an isolated production-physics
control, not a restoration of every hunt field/WeakMap. The candidate reproduces the panel minimum.
Baseline minimum157.209301 /penetration4.330699; candidate156.541354 /4.998646.
Thus matched penetration worsens by **.667947 px**. No safety tolerance was loosened.
Actual overlap returns outward radial demand, but steering demand alone cannot cancel existing
inward velocity instantly; the unchanged capped constraint does not guarantee zero penetration.
Root is reviewing radial dominance/tapered tangential steering. No new formula is accepted here.

## Motion and progress assessment

Maximum center-visible segment accumulated rotations (absolute heading change, not full orbits):

| Seed /Hz | Baseline | Candidate |
| --- | ---: | ---: |
| 23 /30 | 1.997 | 2.125 |
| 23 /60 | 4.313 | 3.742 |
| 23 /120 | 4.326 | 1.352 |
| 59 /30 | 12.342 | 1.455 |
| 59 /60 | 2.325 | 2.637 |
| 59 /120 | 4.583 | 1.151 |

Worst three-second turn window improves in five/six paw rows; seed59/60 worsens1.907→1.989.
The preserved18.2s/12.3-rotation failure is absent from the candidate's ranked full-panel segments.
This is not solely an old-timestamp check: every candidate run was ranked again after divergence.
Pooled paw visible path287,294→337,239px (+17.4%), visible mouse-seconds1355.875→1363.175,
completed hide transitions212→209, collision impulses16472→12965. This does not establish efficacy.
Residual concern: seed23/60 mouse1 retreat13.9–24.233s still accumulates3.742 rotations,
1,790px path,1,214 impulses. Seed59/60 traverse152.933–157.433 has2.637 rotations but
crosses from y764 to y3; it is not a stationary orbit. No blanket “spinning solved” claim.
Max low-speed blocked duration increases1.467→3.117s in23/60 and.383→1.633s in59/60;
other paw rows improve. Worst candidate empty interval3.667s vs same-row baseline3.2s.
No new acceptance gates are inferred from these diagnostics. Whole-frame path includes collisions;
phase/goal segments can merge same-phase reentries, and center-invisible travel is excluded.

## Creep test failure: faster legitimate detour, updated assertion accepted

Original `exit>4&&exit<5` fails because arrival accelerates, not because the watchdog aborts creep.
Baseline exits4.500/4.450/4.425s; candidate exits3.167/3.133/3.108s at30/60/120Hz.
Candidate arrivals2.633/2.617/2.600s retain the original.506282s dwell before normal dart transition.
Final goal error4.889px, minimum paw distance161.54px at all rates; path~697px vs baseline~762px.
Slow-progress control is exactly unchanged: no exit in10s,159.724px forward progress.
Root's updated test requires observed arrival, dwell in[dwell,dwell+2/hz], original goal within8px,
exit<5s and unchanged clearance assertion. Inspected and independently reran: **5/5 PASS**.
This strengthens intended semantics instead of loosening a safety tolerance or hiding a stall.

## Checks, artifacts and handoff

`/tmp/excursion-motion-after-probe.mjs`: reruns the frozen12-row candidate panel.
`/tmp/excursion-motion-after-summary.json`: defaults,42 hashes, route metrics and ranked traces.
`/tmp/excursion-motion-after-*.jsonl`: all candidate frame-level positions/headings/targets/phases.
`/tmp/excursion-motion-after-analyze.py` and `after-comparison.json`: baseline/candidate comparisons,
passive byte equality, finite state, visibility/path, exits, stalls, collisions and safety minima.
`/tmp/excursion-motion-after-safety-summary.json`: matched isolated clearance result;
`after-safety-baseline.json` /`after-safety-candidate.json`: per-frame isolated trajectories.
`/tmp/excursion-motion-after-penetration-clip.json`: both mice ±.25s around worst panel penetration.
`/tmp/excursion-motion-creep-probe.mjs`, `creep-summary.json`, `creep-*.json`: fixture causality.
Focused contact/physics/paw-memory/held-paw/hunt-policy/routes/social/chapters:81/81 PASS,
log `/tmp/excursion-motion-after-tests.log`. Updated creep:5/5 PASS,
log `/tmp/excursion-motion-after-creep-updated-test.log`; original failure log retained separately.
No full-suite rerun by critic. Root's training objective.9385/gate pass is reported, not independently
verified here, and does not override this separate exploratory safety counterexample.
Next: root revises patch; critic checks frozen new hash against this exact counterexample and panel.
No visual, physical-iPad, audio, deployment, feline preference or whole-session variety acceptance.
