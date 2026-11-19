# Experiment protocol

Status: proposed process; no assignment engine or trial results yet.
All potential impacts in the catalog are design hypotheses. Study evidence supports testing novelty and
movement, not an optimal setting for any listed slider; see [critic report](../cycles/feline-play-critique.md).

## Stages

1. Instrument and audit: verify event completeness, effective settings, exposure, source actor and clocks.
   Run human-tagged diagnostics before cat observations; never mix them into preference training.
2. Stage 1 screening: watch/peek duration, crossing frequency, hiding, visibility and recorded sound presence.
   Use the six explicit candidate pairs in `experiments/trials.json`, one at a time. Size/hide need proposed
   levels and device review before becoming trial definitions. Keep two mice and fast travel as baseline.
3. Stage 2: other locomotion, sensory and contact factors. Replicate promising findings in later sessions.
4. Stage 3: detailed morphology/animation/environment factors, only if they are perceptible and worth testing.
5. Stage E: engineering controls (springs, damping, paw clearance, hold classification) need physics/contact
   acceptance before any bounded candidate can be proposed; they are never unrestricted learner actions.

Do not grid-search 76 controls. Start with interpretable effects; examine a few preselected interactions
only after individual screening. Relevant pairs include watch × tempo, travel × dart speed, size × count,
coat brightness × background contrast, sound frequency × gain, and tail sway × damping.
A later 2×2 interaction trial must log all four candidates and their assignment probabilities explicitly.
Changing a bundled preset such as mode/lighting/background estimates a bundle effect, not each component.

## Assignment and exposure

- Freeze a versioned full baseline, device/layout and cast/seed schedule before a comparison. Saved local
  settings may differ from defaults; never overwrite them silently to match a proposed reference baseline.
- Randomize each paired sequence AB or BA with probability 0.5 before exposure. Balance initial cast,
  starting edge and seed schedules across arms; log stochastic changes. The second arm is conditional probability 1, not another 0.5 draw. Log pair ID/position and sequence
  probability; analyze at pair/session level. These paired bouts are not eligible for ordinary bout-level OPE.
- Check per-trial prerequisites with `experiments/eligibility.mjs` before exposure; log failed opportunities.
  Confirm mode, baseline, audio availability and relevant renderer effect without silently changing settings.
- Use [versioned metric definitions](metrics.md) and freeze the window/primary metric before seeing outcomes. A window is an observation segment,
  not an automatic session timeout. Owner stops normally; early departures remain observations.
- Record both assigned and effective settings. Mid-bout adjustments end that attribution segment; retain
  the interrupted record and its reason. Never label a mixed-settings segment as a clean trial.
- Separate active visible time, hidden time, paused/background time and technical downtime. Keep hidden
  time in a full-bout outcome because hiding is a treatment; additionally report visibility-normalized rates.
- A cat departure is not equivalent to app pause. Presence unknown stays unknown; no-touch is not absence.
- Exclude only predeclared technical/human-test cases; keep outcome-related departures and poor results.
  Mark unavailable observation, sensor failure and zero opportunity separately rather than filling with zero.

## Measurement dictionary

| Family | Raw or derived measurements; limits |
| --- | --- |
| tracking | Owner-annotated orientation latency, tracking intervals, approach; no inferred gaze from taps |
| contact | Unique contact episodes, hit/near-miss, body region, hold/drag/release; event stream is not trial count |
| exposure | Active wall/simulation time, mouse-seconds visible, hidden intervals, usable area and paw occupancy |
| return | Owner-observed departure/return and observation coverage; unknown outside observation |
| reacquisition | Owner-observed tracking after contact/reentry; define latency window and censor at interruption |
| motion | Path length, heading reversals, curvature, phase transitions and repeated motifs; diagnostics, not enjoyment |
| geometry | Attachment/pin errors, tail excursions/settling and gait defects; engineering gate |
| performance | Frame-time distribution, dropped updates, render load and input latency; confounds and guardrails |
| audio | Clip ID, family, scheduled/played/failed state, gain, playback rate and output route; not calibrated loudness |

Use both whole-bout contact counts and opportunity-normalized rates; more visible mice create more targets.
Keep catches separate from misses and contact-free watching. One sustained pointer is one episode; moves,
repeated holds and stationary paws do not generate extra independent engagement rewards.
Log touch provenance as cat/human/unknown; touch hardware alone cannot tell. Multi-paw touches need a
versioned grouping rule and raw IDs preserved; do not silently conflate one pounce with many independent trials.

## Analysis and progression

Primary comparisons use independent session/day clusters, not thousands of correlated frames or taps.
Report differences, uncertainty, sample/coverage counts, order and carryover; prioritize repeated direction
across days over a single exciting bout. No universal minimum sample count is claimed sufficient.
Use initial pilot variability to plan precision/power for a chosen meaningful difference; keep pilot and
confirmatory data distinguishable. Correct for multiple comparisons or confirm winners on held-out sessions.
Sparse or contradictory evidence means keep collecting; do not escalate speed or loudness to chase clicks.
Preserve no automatic break, recorded-only audio, coherent routes, paw avoidance and owner override.
