# Local sensory pilot

Status: implemented in source; cat preference and physical iPad validation pending.
Owner: root. Modules: `experiment-session.js`, `experiment-trials.js`, `experiment-controls.js`.

## Owner flow

Open Settings → Try variations, choose a comparison and identify the player, then Play.
Off is the default and records no new rounds. Rotation advances one comparison per round.
Each treatment starts with a new cast. Existing living mice never change coats mid-chase.
Exit normally to restore the saved baseline and add Interested, Watching or Left observations.
Observation buttons target the most recent explicitly started comparison in this page; ordinary
play clears that target. Observations are retrospective point labels, not measured tracking duration or enjoyment scores.
Export data downloads JSON; Copy data provides a clipboard fallback. Nothing uploads automatically.
Clear experiment data requires a second click; it does not erase normal settings/profiles.

## Implemented comparisons

Fifteen pilots cover floor texture contrast/scale/surface; coat brightness, palette, saturation
and variation; scene brightness, lighting and shadows; sound presence, frequency, gain and
recorded repertoire; plus a four-arm coat-brightness × floor-contrast interaction.
Alternatives are hypotheses, not optimal presets. Palette and surface changes bundle attributes.
Each two-arm comparison alternates a durable randomized AB/BA pair for the same baseline,
build and device. The first arm probability is 0.5; its paired complement is conditional 1.
Four-arm assignment is independent uniform. These are not OPE-eligible training examples.
Identical settings alternatives and texture comparisons on solid floors are rejected. Sound comparisons require loaded recordings,
enabled sound, positive volume and usable contact/ambient banks. Repertoire comparisons
require more than two usable clips in a relevant bank. The quieter arm halves current gain, never raises it.
Actual visual contrast, device volume and audible output are not measured by these checks.

## Collection and boundaries

Each round records full baseline/assigned/confirmed settings, build, device, assignment,
contact episodes/outcomes, sampled behavior and scheduled recorded clips. Repeated moves or
held-pointer events do not count as independent contacts. Unknown player remains unknown.
Corner-origin contacts are conservatively excluded because they may be the owner exit gesture;
this also excludes genuine cat touches there. Exposure uses approximate viewport intersection,
not exact rendered-pixel visibility.
A 60-second monotonic observation window ends collection, never gameplay. Exposure has separate
wall and simulation clocks; interrupted/unknown exposure remains explicit. No tracking fraction
is inferred from touch counts. Resize, hiding, reload and recovery end attribution.
Treatment can remain visually active after an interruption until owner exit/new cast, preserving
living identity. Baseline remains saved; transient treatments are not persisted as owner defaults.

Storage is bounded to 40 sessions, 256 records and 256 contact episodes per session, and about
1 MB. Drops and storage errors are exported. Busy sessions may lose detailed events; this is
not a complete replay. Reload marks unfinished records interrupted. Denied storage permits
in-memory operation. Nested checkpoint fields and record attribution are validated with Valibot
before adoption; invalid checkpoints report an error without blocking a fresh round.
Export before clearing browser data or removing the app.

Schema `sensory-pilot-v1` always exports `trainingReady:false`. It does not conform to the
planned full research record schema. Cast/seed balancing, measured attention, validated analysis,
automatic difficulty learning, trained models and recurring agent review are not implemented.
The [research critique](../cycles/feline-play-critique.md) motivates testing novelty and
readable prey; it does not establish a winning color, sound, background or lighting setting.
