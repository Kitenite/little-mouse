# Independent motion critic — final handoff

Status: **creep and visible-peek repairs independently verified; motion critique complete for this batch.** Root owns runtime edits/integration. Critic made no repository edits, commits, pushes, browser or native changes. Benchmark review was reassigned to worker990ff0bf. No further motion features or parameter search proposed.

Final verified enrichment.js SHA256: `b3c1314aed11c20c120d8949e5a5df690079ecc46202c29c7f20e93bbedaa27d`.
Immutable original baseline: `git archive a3196df`, extracted to `/tmp/motion-critic-baseline/little-mouse/public`.

## Issue 1: production-default creep collision lock — verified repaired

Run `node /tmp/motion-creep-repro.mjs > /tmp/motion-creep-repro.json` for archived baseline; set `MOTION_SOURCE=/Users/kietho/workplace/mouse/little-mouse/public` for candidate.

Exact natural fixture:1024×768 CSS px; settingsDefaults unchanged (count2,size2.86,speed2.8,travelSpeed2.2,huntTempo1.5,creepSpeed1.6,morphologyVariation.8). Director/RNG seed11; identities1100/1101; cast indices0/1; initial state away,x512,y384,angle0,vx/vy0,hiddenUntil/restUntil0; frame t=f/hz. Group→policy for both→physics, no touches/holds.180 simulated seconds.

At30Hz mouse0 enters creep at165.5s. Seven successive one-second samples168–174s move under3px while its goal stays12.469px away (arrival threshold8px). Integrated actual travel168–174s is only0.06783px, with724 collision impulses and separation223.08px (twice collision radius). At174s position181.392885,493.984884; target168.96,493.030598. Reported speed remains1.603095px/s; last one-second displacement1.43e-8px. Contact projection cancels locomotion; this is not deliberate slow creep.

Identity-less control reproduces this exact seed11 case; identity-specific causation is not claimed. At60Hz seed11 has shorter isolated stalls;120Hz has none in the sampled180s. Exact stochastic trajectories are frame-rate dependent.

Independent deterministic fixture `/tmp/motion-adverse.mjs`: two active identities1100/1101,x400/623.08,y384,facing each other; force creep with goals20px toward companion, director11. Free/free and second-mouse-body-held variants move effectively0px until8.908–8.933s across120/60/30Hz. Candidate yields watch at2.508333/2.516667/2.533333s and subsequently selects distinct goals; held-anchor drift0. No immediate blocked-goal loop in10s trace.

Natural candidate `/tmp/motion-creep-candidate-independent.json` yields watch at170.533333s, removing stalled samples171–174. Fixed2.5s windows can include earlier travel, so arbitrary-onset detection can take nearly5s; do not claim a strict sliding2.5s maximum.

## Issue 2: visible peek8–15px arrival gap — verified repaired

Run `node /tmp/motion-peek-repro.mjs > /tmp/motion-peek-final-independent.json` against current source. It now tests gaps12,15,16px at30/60/120Hz,15 simulated seconds each; no heldout search.

Exact12px fixture: same viewport/defaults/director11/identities1100/1101. Both initially active,y384,angle0,vx/vy0,hiddenUntil/restUntil0. Mouse0 x=-40.6; companionx182.48 (separation223.08). Initialize hunts, set mouse0 edge0,slot.5, force peek at0: natural target[-28.6,384]. Begin companion body hold at its center, localX/localY0,pointer3; record that same pointer at[182.48,384],width/height20. Director paws reference actual contact obstacles. Each frame: contacts→group→policy→physics. Stationary hold, no drag. Incoming mouse is partly visible, facing inward; companion and paw clear the mouth.

Baseline `/tmp/motion-peek-baseline.json`: all three rates remain peek for15s,arrivedAt null,goal distance12px,reported speed1.542741px/s,1800 collisions,held-anchor drift0. Actual travel≤1.92e-11px. Nominal deadline8.907446s expires, but timeout excludes peek. Old watchdog required distance>15 while arrival required<8. Matched16px control starts both mice4px left and retreats at2.5s, isolating the gap.

An intermediate root candidate restricted actual-travel tracking to<=15px; root caught exact15px floating boundary resets. Final code measures actual travel for **all visible peeks**, preserving the old far-peek distance guard and excluding invisible approaches. Critic independently verifies all nine12/15/16px×30/60/120Hz cases retreat at exactly2.5s; held-anchor drift0 throughout. No threshold-only workaround or teleport.

## Independent adverse controls and compatibility

`/tmp/motion-peek-controls.mjs` produces four cases×three frame rates. Final `/tmp/motion-peek-controls-final.json` is byte-identical to archived `/tmp/motion-peek-controls-baseline.json`:
- Free near-peek arrives0.208–0.233s; slow near-peek0.233–0.267s, with normal dwell/exit.
- Slow invisible approach fromx=-459 becomes visible1.9s, arrives5.2s, exits6.992–7s; no premature retreat.
- Holding incoming mouse until3s preserves anchor0px and resumes arrival3.2s/exit3.8s after cancellation.

Final `/tmp/motion-adverse-final-independent.json` is byte-identical to accepted creep candidate output. Deliberately slow unobstructed creep (speed0,travelSpeed1,creepSpeed.5,huntTempo.5,180px goal) remains creep10s and travels159.724299px. Live-paw detour preserves161.54px minimum clearance and completes creep4.425–4.5s. Both slow/paw controls match original baseline.

Critic ran social/paw/learner-runtime tests:21/21 pass (`/tmp/motion-critic-focused-tests.log`). Learner samples actual positions and phase-execution IDs, not stored speed; recovery adds authored transitions, not cat-preference observations. Root separately reports final focused32/32,full397/397 and builda6df6715d6a5; those totals are root evidence, not independently rerun here.

## Other evidence and limitations

`/tmp/motion-sweep.mjs`/JSON: six seeds1,7,42,97,103,211×actual/fallback identities×600s60Hz. No lasting empty-board failure: coarse47*size visibility outage≤1.75s. Identity matters generally: seed103 has11146 collision impulses with identities versus7298 fallback. Fallback anatomy is not production-equivalent. Geometry/visibility here is headless approximation, not rendered silhouette/device proof.

Cumulative path can exceed4px through jitter without useful net travel. The repair addresses stationary obstruction, not all oscillation/repetition. No new jitter failure established; no further tuning in this batch.

Preliminary benchmark review identified impossible immediate-transition repetition counting; worker changed to last-eight-transition history. Smoke `/tmp/motion-benchmark-critic-smoke.json` now reports nonzero repetition0.132–0.343. Phase entropy/history still measures labels, not actual route novelty. Center visibility misses partial peeks. Search opens holdout after selection, but critic exploratory seed211 was already seen independently; do not call it globally untouched. No heldout tuning by critic. Worker990ff0bf owns final metric/provenance acceptance.

Existing research docs read; no new scientific claims. Synthetic tests establish software behavior only, not learned actor identity, feline preference, photorealism or physical-iPad quality.
