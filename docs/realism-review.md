# Realism review

Owner: realism lead. Reviewed 2026-11-17. Target 120 lines; hard limit 150.
Update this review when assets, rigs, sound banks, or reference evidence change.
Replace resolved findings with verification evidence; keep unresolved priorities.
This is a reference-based game approximation, not validated animal biomechanics.

## Evidence and comparison

- Inspected the actual browser preview supplied by the coordinator on 2026-11-17,
  before the articulated anatomy update: brown mouse, size 2.1, oblique top view.
  Artifact: `/private/tmp/mouse-realism-current.png`; this is not current-rig approval.
- Compared it visually with [Naturalis's house-mouse photograph by Paul van Hoof](https://images.naturalis.nl/original/muizen/Huismuis_Paul%20van%20Hoof.jpg),
  found through the [museum identification collection](https://determineren.nederlandsesoorten.nl/linnaeus_ng/app/views/matrixkey/index.php?epi=131).
  The photograph was viewed as reference only; no redistribution license asserted.
- Examined `mouse3d.js`, `mouse-identity.js`, `secondary-motion.js`,
  `audio-samples.js`, and [sound provenance](../little-mouse/SOUND.md).
- Current regional surface comparison and limitations: [coat surfaces](coat-surfaces.md).
  Browser captures include natural and playful coats on light/dark floors.
- A still image cannot validate gait, settling, collision response, or speaker sound.
  No subjective audio audition or physical iPad listening is claimed.

## Ranked differences to resolve

| Priority | Observed difference | Acceptance target |
| --- | --- | --- |
| P1 | Ears read as opaque oval pebbles | Thin cupped pinnae, visible rim/interior, subtler skin texture; remain rooted during turns |
| P1 | Long triangular muzzle blends into a bean-shaped torso | Rounded brow and cheek pads narrowing to a small nose; continuous neck/shoulder shape |
| P1 | Tail reads as a dark straight cone | Restrained pink/gray skin, visible fine rings at close range, gentle resting curvature and taper |
| P1 | Feet disappear in the resting top view | Delicate distal paws peek beyond flanks; grounded paws remain visible in a side-view check |
| P2 | Whiskers form two overly regular fans | Unequal curved lengths, shorter rostral and longer caudal whiskers, subtle asymmetric exploration |
| P2 | Regional detail is implemented but reads as short strokes | Deeper layered fur; preserve finer face/limb detail and sparse tail/ear hair |
| P2 | Vocal banks reuse agitated recordings for calm events | Prefer documented calm mouse sources; retain honest approximation labels until replaced |

These are image-review judgments, not measured discrepancies in millimeters.
The current preview already shows a textured coat and soft silhouette breakup.
Do not hide anatomical problems with whole-animal blur or excessive fur opacity.

## Anatomical reference rules

[University of Michigan ADW](https://animaldiversity.org/accounts/Mus_musculus/)
describes house-mouse head/body lengths of 65–95 mm and tails of 60–105 mm,
with sparsely haired, ringed tails and diverse domestic coat colors.
Use this as a broad sanity range; screen size intentionally exceeds life size.
The current nominal tail/head-body ratio near 1 is a plausible starting point.

[British Wildlife Centre wood-mouse reference](https://britishwildlifecentre.co.uk/planyourvisit/animals/wood-mouse/)
supports a brown back, pale underside, prominent eyes and large ears.
[Its harvest-mouse reference](https://britishwildlifecentre.co.uk/planyourvisit/animals/harvest-mouse/)
describes a smaller animal with golden/pale contrast and a prehensile, thinly haired tail.
Do not imply the shared ground-running rig reproduces harvest-mouse climbing.
“Field mouse” is ambiguous and can mean wood mouse; it is not a precise species.
Keep generated types explicitly **species-inspired** until proportions, coat,
tail behavior, and movement are reviewed together against a named species.
Fancy mice are domestic variation, not a separate wild species.

## Secondary motion policies

- Ears: combine bounded inertia with occasional attentive rotation; a floppy cloth
  flap is an exaggeration. Roots must stay attached while the rim yields and settles.
  [Clayton et al. 2024](https://doi.org/10.1016/j.cub.2024.02.057) measured mouse
  pinna/nose/facial responses to sound; it does not validate our spring constants.
- Whiskers: active sensing plus elastic bending, not only passive dangling.
  [Mitchinson et al. 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3172598/)
  reports mouse whisking around 11.3 Hz with a strong second harmonic, and
  asymmetry with turning/contact. Our lower-frequency readable animation is an
  artistic approximation, not measured playback of that motor pattern.
- Fur: short rooted fibers can lag acceleration; density, length and silhouette
  softness are independent. Default limb fuzz is finer than trunk fur.
  Coat softness affects the narrow edge, while eyes, nose, paws and tail stay crisp.
- Tail: preserve segment length and root attachment; bend smoothly with turns,
  braking and constraint. Ground contact must not kink, tunnel or lengthen the tail.
- Body: head may orient before torso and pelvis follows through; joints and coat
  remain continuous. Head accessories follow head pose; tail root follows pelvis.
- Legs: stance and swing depend on travel, with planted feet resisting sliding.
  [Bellardita and Kiehn 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4469368/)
  measured speed-associated walk, trot, gallop and bound; a single endlessly
  accelerating trot is not a complete mouse gait model.

## Sound realism policy

[Grimsley et al. 2016](https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2016.00038/full)
found context-dependent mouse vocal categories, including audible harmonic
squeaks and ultrasonic calls. Audible distress and calm social calls are not
interchangeable simply by changing volume. Sparse quiet movement is appropriate
as a game design choice; exact event rates here are not biological measurements.
Proximity-triggered call/reply is game choreography, not documented conversation.

The current bank has 26 excerpts from four originals; see [sound curation](sound-curation.md)
for inventory, attribution and review limits. Recorded floor-mouse squeaks provide taps;
mouse-cracker eating replaces hamster cuts. Confirmed rat and hamster sources remain archived
but are excluded from runtime. Twelve vocal cuts retain uncertain mouse/rat identity;
four paper-foley cuts remain substitutes for movement. No synthesized fallback is permitted.
Source/PCM inspection does not establish subjective timbre or physical speaker quality.
Twenty-six excerpts do not mean twenty-six independent animal recordings.
Shipped 22.05 kHz files cannot represent frequencies above 11.025 kHz;
they do not reproduce mouse ultrasound. Slowed/transposed ultrasound, if added,
must be labeled transformed. Search for better sources without discarding
license, species, recording-context and processing metadata.
Candidate for a later licensed replacement: [BBC Nature house mouse running in a cage](https://www.prosoundeffects.com/sound-effects/PSE_BBC-NAT/iAh4Y/House-Mouse-Runni-71111).
It is commercial, not CC0; no asset was purchased, downloaded or approved for bundling.

## Repeatable release review

1. Capture the same seeded mouse at top, oblique and side views under neutral light.
2. Compare silhouette, ear thickness, muzzle, paws and tail to the linked reference.
3. Inspect slow motion of start/stop, both turn directions, head/pelvis movement,
   nibbling, hold/drag/release, sudden contact, and reset after a hidden interval.
4. At default and extreme controls, reject detached roots, stretching, inverted
   joints, ground penetration, explosive oscillation, persistent jitter or NaNs.
5. Inspect narrow fur softness on both light and dark floors; preserve eye detail.
6. Verify event/clip/source logs, silence when appropriate, nonrepetition and mix
   peaks; then listen on an actual iPad before calling timbre or loudness approved.
7. Record screenshot/build identifier and resolved findings here; carry only the
   highest remaining differences forward. Never claim “indistinguishable” from
   one screenshot, digital audio peaks, or passing numerical tests.
