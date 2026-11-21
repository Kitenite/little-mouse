# Final bounded motion review — candidate 2

Verdict: **ACCEPT WITH LIMITS for the scoped steering/swept-motion repair**.
The original seed59 regression is repaired in the bounded replay and the matched isolated
clearance regression is resolved. No objection remains to the inspected sweep mechanism.
This is NOT uniform full-panel non-regression or complete collision-paw recovery acceptance.
The two reproducible residuals below remain explicit next-work items; no thresholds were loosened.
Root accepts this limited scope and owns integration, documentation and subsequent work.
First failed-candidate report `/tmp/EXCURSION-motion-after.md` is preserved unchanged.

## Exact reviewed snapshot and scope

Final snapshot: `/tmp/excursion-motion-candidate2-final/little-mouse`.
contact.js SHA256: `3a06fc5ccdcc3243f5eacc98e8faaeb9ea72aacdb1687f090647689d14b91ad3`
physics.js SHA256: `1c906ca8586811ed18734ca640f8b13d0d801fc94db4f2968c05bd1c326b4e0c`
Both matched live repo files at final verification. Only these two runtime files differ from
baseline4ba72c4 among42 JS hashes. All settings defaults compare exactly.
An earlier candidate2 snapshot predates the tangent discriminant fix; final evidence uses
only candidate2-final, which skips discriminant<=0. Intermediate artifacts are not acceptance evidence.
Existing12 rows only: seeds23/59 ×passive/central-paw ×30/60/120Hz ×180s, two default mice,
1024×768, persistent paw(512,384), radius50, actual hunt/group/physics, seeded randomness.
2,160 simulation seconds /4,320 mouse-seconds. All sampled states finite.
All six passive frame-trace files remain byte-identical to the preserved baseline.
No new exploratory seed search. Existing seed11 creep fixture is a regression test, not a new search.
No repository edits, defaults/gates/utility changes, commits, deploys, restarts or subagents.

## Scoped repair acceptance

The same-paw steering blend preserves tangential progress; different-paw outward fallback remains.
The sweep clips integrated free motion at the earliest live circle intersection, including a
through-crossing with both endpoints outside. It excludes held, recent-memory and initial-overlap
cases. Tangency/outward motion remains unmodified. It does not relocate a preexisting overlap.
The call precedes arrival handling and mouse-pair collision separation. It only clips position;
normal steering/deceleration and existing constraint logic continue to own velocity/recovery.
Toss integration takes an earlier branch and is not newly swept; no tossed-motion claim is made.
Post-collision displacement and wall correction remain outside this sweep's guarantee.

Matched isolated approach from observed seed23/paw/120Hz dart entry:
baseline minimum paw distance157.209301 (4.330699px penetration), candidate2-final161.54
(2.84e-14px floating-point residue). Failed first candidate was4.998646px penetration.
Probe `/tmp/excursion-motion-final-safety-probe.mjs` runs both frozen sources with identical
reconstructed position/heading/velocity/goal/huntSpeed, no companion,1.5s at120Hz.
This confirms integrated-approach repair, not every possible collision or moving-pointer geometry.

93 focused tests PASS: contact, physics, paw-memory, held-paw, hunt policy/routes/social/chapters,
creep progress, root collision-recovery and root sweep tests. Independent adverse probe31/31 PASS:
rotated/near-tangent crossings, exact tangency, boundary inward/outward/tangent starts, earliest
intersection under obstacle reordering, enlarged footprint, held parts/pending hold, recent memory,
initial overlap, inside-one/crossing-another, bounded recovery and invalid/zero time.
Root's updated creep test remains accepted: real arrival, preserved dwell, original goal and clearance.
Root reports training gates pass; critic did not independently rerun training or the full app suite.

## Whole-panel outcome and limits

| Paw seed /Hz | Max segment absolute turns before→after | Max paw penetration px before→after |
| --- | --- | --- |
| 23 /30 | 1.997→3.713 | ~0→2.263 |
| 23 /60 | 4.313→3.677 | 1.095→~0 |
| 23 /120 | 4.326→1.614 | 2.636→~0 |
| 59 /30 | 12.342→1.837 | 2.756→.469 |
| 59 /60 | 2.325→1.813 | 2.112→~0 |
| 59 /120 | 4.583→1.696 | 3.426→~0 |

All six worst3-second turn windows improve; absolute turn is not a count of complete spatial orbits.
Pooled paw visible path287,294→327,286px (+13.9%); visible mouse-seconds1355.875→1364.392;
hide transitions212→206; collision impulses16472→16565. No global collision reduction claim.
Max low-speed blocked duration rises1.467→3.55s for23/60 and2.10→2.533s for23/30.
Those are diagnostic outcomes, not new gates or feline/visual-quality measurements.

## Next-work queue: exact bounded residuals

1. **Seed23 prolonged retreat/corrective turning.** Paw,30Hz, mouse1,14.133–24.400s:
   10.267s center-visible retreat,3.713 absolute rotations, net+.4585,1,776px path,
   1,205 collision impulses; from(385.27,589.82) to(1017.87,472.52).
   At60Hz the related retreat is13.900–24.100s,10.2s,3.677 rotations,1,199 impulses.
   Inspect `/tmp/excursion-motion-final-paw-23-{30,60}.jsonl` and final-summary ranked segments.
   This is not the repaired seed59 case and exceeds the8s/3-turn engineering bounds root's
   seed59-only test checks. Do not generalize that test's guarantee to this panel.
2. **Seed23 post-collision paw intrusion.** Paw,30Hz, mouse0,t33.7s, retreat:
   center(354.131752,362.860655), heading.993478rad, exit goal(205.349358,1250.190061).
   Distance159.277292 from paw center,2.262708px below clearance161.54; four impulses that frame.
   At33.633 it is171.239px clear; contact then displaces it inside. It returns to clearance
   by33.767s under existing gradual correction. This is not a zero-penetration global solver.
   Exact bounded replay: `node /tmp/excursion-motion-final-collision-probe.mjs` (34s).
   Same-prefix control: `NO_COMPANION=1 node /tmp/excursion-motion-final-collision-probe.mjs`.
   Only companion participation in physics is removed from33.6s; hunt policy continues unchanged.
   At33.6–33.9s replay min159.277292/21 impulses; control min168.412646/0 impulses.
   This supports companion displacement as the cause; source ordering leaves it outside sweep.
   It is a per-row baseline regression, retained explicitly rather than waived by tolerance changes.
   Next repair must reconcile pair/paw constraints without teleporting or breaking held anchors.

## Reproduction and preserved artifacts

`node /tmp/excursion-motion-final-probe.mjs`: final frozen12-row panel and frame traces.
`python3 /tmp/excursion-motion-final-analyze.py`: comparison/finite/default/passive checks.
`node /tmp/excursion-motion-final-adverse.mjs`:31 independent adverse checks.
`/tmp/excursion-motion-final-summary.json`: all hashes/defaults/route and ranked motion diagnostics.
`/tmp/excursion-motion-final-comparison.json`: all per-row safety/progress comparisons.
`/tmp/excursion-motion-final-tests.log`:93 focused passing tests.
`/tmp/excursion-motion-final-safety-{summary,baseline,candidate2-final}.json`: matched approach.
`/tmp/excursion-motion-final-collision-{clip,result}.json`: residual and control evidence.
The original baseline and first failed-candidate artifacts/reports remain intact.
No physical-iPad, rendered motion/audio, deployment, cat preference or whole-session variety claim.
Review stops here; no broader search this batch. Root owns the explicitly queued residual work.
