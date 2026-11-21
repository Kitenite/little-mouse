# Whole appearances and collision–paw steering

Baseline `4ba72c4`; root integrates three Superset workers with disjoint ownership.
Status: measurement review accepted; targeted runtime repair verified with remaining
collision cases explicitly pending. Source publication is separate from device validation.

## Runtime repair

The motion critic reproduced an 18.2-second visible retreat with 12.34 absolute rotations
of back-and-forth turning. The exit target stayed fixed. Removing either companion or paw
allowed exit in about two seconds. This was corrective oscillation, not twelve spatial orbits.
Same-paw steering now retains tangential flank progress while blending radial demand toward
outward escape through the existing 25-pixel safety band. Other paws retain immediate priority.
A first candidate slightly increased clearance penetration in a matched isolated approach.
The revised patch also clips integrated travel at the first live-paw boundary crossing;
initial overlaps retain bounded recovery. Collision resolution, held anchors and defaults remain.

The existing single-paw creep fixture arrives and dwells before leaving in 3.11–3.17 seconds
instead of 4.43–4.50, preserving clearance. Its regression now checks arrival, original-goal
proximity and completed dwell, rather than requiring an unnecessarily slow four-second minimum.
The seeded 88-second regression now observes 15 retreats, maximum 1.47 seconds and
.93 accumulated rotations, versus the original 18.23-second/12.34-rotation retreat.
All 450 web tests pass. The exploratory panel still contains a roughly 10.2-second
retreat at seed 23 and collision-induced paw overlap: these remain queued, not solved.
Final bounded motion review and full-suite results belong in current verification.

## Whole-appearance diagnostics

[Contract](../behavior-excursions.md): witnessed invisible→visible→invisible passages,
including partial core-body exposure, pauses and phase changes. Holds, hidden relocations,
tosses, injuries and touch responses censor rather than manufacture natural exits.
Cumulative complete/censored time and path support survive bounded-history eviction.
No scores, learning rules or policy defaults change. These are measurement tools, not cat reward.

On the archived runtime, the independent critic measured 889 completed appearances and 17
censored appearances versus the old bout tracker’s 972 censored fragments. Segmentation differs;
this is better entry/exit coverage, not evidence of better behavior or unbiased sampling.
Every old row field and score matched the baseline exactly before the separate runtime repair.
Fixed identity/viewport panels cannot validate replacement/resize integration; fresh trackers
are required before introducing those scenarios. Neutral-body overlap is not rendered pixels.

## Evidence and boundaries

[Artifacts](../evidence/excursions-2026-11-20/README.md) preserve handoffs, independent probes,
source hashes, baseline controls and complete training results. Exploratory seeds 23/59 are
not held out. No search-selected settings, native install or hosted deployment in this batch.
Physical iPad motion, audio and this cat’s response still require observation.
