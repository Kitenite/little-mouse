# Feline play critique

Reviewed 2026-11-18 by `feline-play-critic`; bounded research/source review, no implementation or cat/device trial.
Priority: make existing bouts easier to follow and participate in before adding detail or intensity.
Preserve two mice by default, 2.2× actual travel with independent gait, paw avoidance, recorded-only audio,
varied harmless/injury outcomes, local owner controls, and no automatic break/stop or remote controller.

## Verified evidence and limits

- **H — Hall, Bradshaw & Robinson (2002): moderate experimental evidence for physical-toy novelty.**
  Repeated unchanged toys produced habituation; a contrasting replacement restored play. Interval affected rebound.
  The replacement differed in colour and presumably odour: this is not an isolated screen-colour experiment.
  Publisher abstract/method/discussion excerpts inspected; publisher full text unavailable (403).
  [Primary article](https://www.sciencedirect.com/science/article/pii/S0168159102001533), DOI 10.1016/S0168-1591(02)00153-3.
- **E — Ellis & Wells (2008): moderate experimental evidence for attention to televised movement.**
  125 shelter cats, five randomly allocated conditions, 3 h/day over three days; animate/inanimate movement
  attracted more looking than human footage or a blank screen. Looking averaged 6.10% and declined within daily exposure.
  This does not isolate straight paths, optimal speed, touchscreen response, or welfare benefit.
  Publisher-indexed abstract/excerpts inspected; full text unavailable through publisher (403), institutional metadata verified.
  [Primary article](https://www.sciencedirect.com/science/article/abs/pii/S0168159107003619), DOI 10.1016/j.applanim.2007.11.002;
  [institutional record](https://pure.qub.ac.uk/en/publications/the-influence-of-visual-stimulation-on-the-behaviour-of-cats-hous/).
- **A — Payne, Kleinberger & Hirskyj-Douglas (ACI 2025): exploratory observational evidence.**
  Full institutional PDF inspected: 16 resident cats, 13 present in preliminary testing; nine watched videos,
  four tapped, two swiped, none dragged. Sound-associated interest was observed, not isolated experimentally.
  Some continued tapping without obvious response. Thus catch feedback is not shown necessary for engagement.
  Of 28 humans overall, phase 2 compared 18 visitors (nine per condition), using human questionnaires/interviews.
  Speed-related findings are visitor perceptions, not controlled causal cat-preference results; five months describes
  the study period, not five months of measured sustained cat benefit. The >30 s engagement cutoff was contextual.
  [Primary full text, §§4–5, 7–8](https://eprints.gla.ac.uk/365042/2/365042.pdf), DOI 10.1145/3768539.3768541.

## Ranked suggestions and one-variable comparisons

All suggestions below are **touchscreen design hypotheses, pending owner observation**. Source files are under
`little-mouse/public/`; named functions/settings locate the reviewed behavior even if line numbers move.

1. **Give pursuit a readable pause before the next run.** Evidence: E supports testing moving content;
   support for our exact bout sequence is low. `enrichment.js:enter/choose` already implements meaningful phases,
   but default `watchDuration=.6`, `huntTempo=1.5` yields roughly 0.32–0.80 s watch dwell before interruptions.
   The gap is demonstrated readability, not missing states. Owner compares only `watchDuration .6` versus `1.0`;
   keep travel at 2.2× and run chance .60. Look for tracking through pause → launch, rather than more foot motion.
2. **Make partial concealment an actual teasing opportunity.** No cited study directly tests digital occlusion:
   evidence is low; reference footage is inspiration, not a cat preference experiment.
   `enrichment.js:edgePoint/enter('peek')` already exposes the nose/ears at depth `-10*size`; default peek dwell
   is roughly 0.33–0.75 s, and `choose` sends 60% of peeks into traverses. Compare only `peekDuration .7` versus
   `1.2`; observe orientation at the edge and follow-through after emergence. Keep clear-entry checks and full exits.
   Defer new cover geometry until this existing edge treatment has been observed.
3. **Make catches legible without requiring damage.** Evidence: low for improving cat experience; A cautions
   against making touch feedback the sole attraction. `contact.js:beginContact` already freezes a claimed mouse;
   `behavior.js:pressMouse` varies flinch/freeze/dodge; `game.js` and `audio.js:contactFeedback` provide immediate sound.
   The gap is whether a paw obscures the reaction and whether release is readable, not an absent catch system.
   First compare only `harmlessChance .35` versus `.70`, keeping volume fixed; observe release/reacquisition and
   departures after contact. Do not infer satisfaction, frustration prevention, or a need for more injury from taps.
4. **Test sensory salience in separate visual and audio trials.** E gives indirect support for visible movement;
   A offers low-strength audio observations. `settings.js` defaults to `photo-clearing` and texture contrast `.8`;
   `audio.js` includes contact voices plus intermittent ambient vocals. Contrast and sound suitability remain unverified.
   First vary only `backgroundContrast .8` versus `.4`, fixing coat/lighting. Separately compare sound enabled versus
   muted at otherwise identical settings. Note orientation and withdrawal, not just contacts; do not increase loudness
   or synthesize ultrasound. `audio.js` fixes playback rate at 1; existing source/species uncertainty remains explicit.
5. **Offer occasional meaningful novelty, not constant random changes.** H supports physical novelty; transfer
   to digital motifs is low-strength. `enrichment.js:choose` penalizes recent phases but uses fixed transition weights:
   randomness is not demonstrated dishabituation. Compare repeated baseline bouts against a single owner-selected
   switch of `runThroughChance .60` to `.30` after the same observation interval; change no other parameter.
   Treat renewed interest as an individual observation. Preserve mouse identity through hiding; no automatic novelty timer.
6. **Tune for this individual, including a cat that only watches.** A supports measuring more than touchscreen input;
   it does not establish an optimal preset. `settings.js` has local controls but the pointer system cannot measure gaze
   or identify who touched. Keep two mice as the baseline; only if needed compare count 2 versus 1 as a separate trial.
   Prefer owner notes over automatic escalation, a remote controller, or a tap-derived enjoyment score.

## Owner-led observation and handoff

Use voluntary opportunities with the same device position, room lighting and other settings; alternate A/B order
across several opportunities rather than always presenting novelty second. Record latency to orient, tracking bouts,
approach/contact, post-contact reacquisition, departure and voluntary return separately; annotate human touches.
Compare equal observation windows when available, record early departures, and do not lure a departed cat back to
complete a quota. The owner chooses when to end; observation windows do not add a session timeout.
These comparisons guide local preferences; they are not efficacy validation or measures of positive welfare.

## Documentation corrections and remaining cautions

- Root corrected stale phone-companion guidance in the research notes and public research page.
  ACI did not validate remote control. Root removed the duplicate stale numeric-default table;
  `settings.js` remains authoritative for current values.
- ACI summaries should distinguish 28 humans overall from 18 in the phase-2 comparison and human-reported enjoyment
  from cat outcomes. Neither ACI speed perceptions nor E's content comparisons establish “faster/linear is best”.
- H does not demonstrate that procedural randomness prevents habituation; partial occlusion, fur realism and injury
  are not established feline preferences. Current notes largely label these limits correctly; preserve that wording.

Checks: required topic docs and relevant policy/contact/audio/settings/gait/physics source inspected; primary sources
checked independently. No runtime tests, browser navigation, deployment, iPad restart or other file edits performed.
Root reviewed the report, updated index/ledger and applied the documentation corrections above. Next useful step: owner-led watch-duration comparison first.
