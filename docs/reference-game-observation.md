# Mouse for Cats reference footage

Reviewed 2026-11-18. Root owns this comparison; current iPad recording is still pending.

## Sources and local evidence

Official listing: https://apps.apple.com/us/app/mouse-for-cats/id766080574
Two embedded Apple-hosted previews were downloaded to
`/Users/kietho/Movies/Podricks-Violin-Research/`:

- `mouse-for-cats-appstore-preview.mp4`: 30.081 s, 1920×886, H.264/AAC,
  14,213,556 bytes; gameplay opening followed by cats playing.
- `mouse-for-cats-appstore-preview-2.mp4`: 30.048 s, 1920×886, H.264/AAC,
  13,700,925 bytes; portrait gameplay and several mini-game examples.
- Both decode end-to-end with FFmpeg without reported decode errors.
- `preview-contact-sheet.jpg` and `preview-2-contact-sheet.jpg`: 1 fps overview.
- `opening-motion.jpg`: first preview, 2–5 s sampled at 8 fps.
- `gameplay-motion.jpg`: second preview, 4–12 s sampled at 4 fps, central crop.

Original HLS sources (from the listing HTML):
- https://apptrailers.itunes.apple.com/itunes-assets/PurpleVideo122/v4/6a/3d/bd/6a3dbd4f-0618-db1b-224f-754145d6adaa/P827425298_default.m3u8
- https://apptrailers.itunes.apple.com/itunes-assets/PurpleVideo112/v4/8d/11/10/8d111051-5343-10b3-c968-3f90b1a7d10b/P827370790_default.m3u8

Keep reference video local, separate from shipped assets. YouTube downloads of official
videos 7y1bODPsQpY and 9KzvKrZez9I returned HTTP 403; their JSON metadata is not footage.

## Observations from sampled frames

- First preview around 3–4 s: one light mouse enters from the right on a dark background,
  moving left with a stable heading. After the hit counter changes, its heading turns.
- Second preview 4–12 s: mouse travels through substantial portions of the play area,
  fully disappears at the edge and reappears; several frames have no visible mouse.
- The same segment includes curved turns and a tap-and-move demonstration. We cannot
  identify every segment as autonomous movement because input is not visualized.
- Later preview frames show patterned/bright mice and distinct mini-games. A spinning
  mini-game is explicitly labeled; that does not establish spinning as normal hunt behavior.

## Design hypotheses, not measured feline preferences

Clear routes, readable contrast and complete disappearance/reentry may provide stronger
tracking and anticipation cues than repeated small circles. Test these separately from
raw speed. Our nearby-target overshoot fix is already implemented in e4cee09; this footage
is not evidence that the physical iPad fix has been accepted by the owner or cat.

Do not tune autonomous timing from an edited trailer or infer source AI implementation.
No audio audition or controlled cat preference comparison was performed in this review.
Next acceptance: continuous current-game recording with known settings, then matched ours
capture; compare path length, repeated heading changes, visible/hidden intervals and
responses to taps/held paws. Cat attention needs a separate observation of the cat.

## Adopted requirements

The owner approved the animation takeaways as project policies. Canonical requirements live
in [behavior](behavior.md#readable-movement-policy),
[anatomy](anatomy-motion.md#readability-policy) and
[touch interaction](touch-interaction.md#readable-contact-policy).
Their acceptance criteria separate existing implementation from pending visual/device review.
This adoption does not turn design hypotheses into scientifically measured preferences.

## Device and simulator limits

Physical recording remains blocked: devicectl reports screen recording unsupported;
QuickTime sees the iPad screen but selecting it fails. No iPad recording exists yet.
Do not switch the connected iPad away from the reference game before capture is resolved.

Apple documents that App Store apps cannot be installed into Simulator:
https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/InteractingwiththeiOSSimulator/InteractingwiththeiOSSimulator.html
A developer-provided Simulator build would be needed. The current listing offers Mac
compatibility (macOS 11+, Apple M1+) but says it is not verified for macOS. This Mac is
arm64; native Mac installation is a possible alternative, not installed or tested here.
