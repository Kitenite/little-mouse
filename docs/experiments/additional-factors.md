# Factors beyond exposed settings

Status: inventory of additional factor families; these are not implemented experiment controls.
The 77-setting catalog is exhaustive for `settingsSchema`, not for every numeric literal or possible future feature.
Before exposing another policy constant, give it a stable ID, software domain, reviewed candidate values,
source owner, hypothesis, interaction list and acceptance checks; extend catalog coverage accordingly.

| Factor family / source | Candidate variables | Potential effect / limitation |
| --- | --- | --- |
| Motif memory / enrichment.js | Sequence length, repetition penalty, novelty interval, motif weights | Less repetition versus incoherent change; counts are not evidence of preference |
| Cover / enrichment.js | Entrance side/slot, reentry relation to prior exit, peek depth, retreat destination | Anticipation versus predictability or paw overlap; preserve full exits |
| Two-mouse coordination / hunt director | Entrance spacing, simultaneous visibility, alternating active bouts | Focus versus competing targets; keep count separate from visible exposure |
| Steering / physics.js | Arrival radius, braking profile, acceleration, maximum turn rate | Readability/catchability versus orbiting or sluggishness; engineering gates first |
| Threat memory / contact + enrichment | Released footprint duration/decay, fear decay, escalation weights | Contingency versus persistent avoidance; no attribution of psychological fear to the cat |
| Reaction lottery / behavior.js | Flinch/freeze/dodge/limp/defeat weights and durations | Legible outcomes versus interruption; no evidence injury improves engagement |
| Idle action mix / idle-animation.js | Eat/wash/scratch/stretch/roll weights and duration | Bout diversity versus distraction; keep activity rate separate from mix |
| Audio inventory / audio.js + sample manifest | Clip identity, species provenance, cue gain, spacing, repeat cooldown | Familiarity/novelty versus noise; recorded only, native rate, actual playback logged |
| Appearance identity / mouse-identity.js | Individual seed, coat pattern, regional colors, texture ID | Salience versus confounded morphology; log realized identity, preserve through hiding |
| Foreground cover / renderer | Partial occlusion shape/depth, location, reveal timing | Possible teasing affordance; not supported by direct cat-screen experiment here |
| Environment response / renderer | Trace type, rustle placement, deformation shape | Movement cue versus competing stimulus; log actual visible/audible response |
| Capture resolution / contact | Contact footprint, tail fraction, multipointer grouping, immunity | Reliable attribution versus double-counting; never optimize by relaxing correctness |

## Context: record or block, do not optimize as actions

| Context | Recording rule / confound |
| --- | --- |
| Cat identity | Optional local pseudonymous ID; unknown allowed; one-cat findings do not generalize |
| Presence/alertness | Optional owner annotation with interval/confidence; never inferred from zero taps |
| Session order/time | Session/day ID, local time, elapsed exposure, prior bouts and time since previous play |
| Device and screen | Model, OS, app/build, CSS dimensions, orientation, device pixel ratio, refresh timing |
| Hardware brightness/volume | Owner-observed values or unknown; software gains do not determine physical output |
| Room/layout | Optional lighting/reflections, tablet placement, background noise and other animals |
| Human participation | Demonstrations/teasing/touches marked separately; never train as cat preference |
| Prior activity | Optional recent physical play/feeding notes; observe naturally, do not manipulate deprivation |
| Technical health | Audio availability, failed assets, thermal/frame pacing, visibility/background interruptions |
| Active paw areas | Touch footprints, covered area, number of simultaneous contacts; don't reward sitting on screen |

Do not add camera/microphone recording or cloud upload by implication. Local structured logs and optional
owner labels are the proposed first scope. Unknown context remains explicitly missing.
