# Owner-supplied Mouse for Cats recording

Reviewed 2026-11-19. This supersedes the missing-recording status in the earlier trailer review.
Source: `.paradev/attachments/ScreenRecording_11-19-2026_21-31-20_1.MP4`, supplied by owner.
25.844 seconds, 2732×2048; variable frame timestamps. Analyze 0–25 seconds before the end overlay.
SHA-256: `79a04e05a9502249bf336b41d3dad8bcddf23ea5bc2b158fc0f4e533ab2ed07e`.
Keep the original recording local; extracted gameplay evidence is in
[evidence/reference-2026-11-19](evidence/reference-2026-11-19/).

## Direct observations

- One large purple patterned mouse on a dark textured floor. The sampled hit counter stays 106.
  No touch indicator or cat appears; the clip cannot establish input causality or cat preference.
- Long diagonal runs dominate the path. Around 4–8 seconds the mouse follows the left edge,
  curves near a corner, and crosses diagonally. Around 8–12 seconds it makes broad traversals
  and reverses near edges. Around 20–24 seconds it rounds a large arc across the lower screen.
- Many turns happen while the mouse remains partly visible. An edge encounter does not always
  produce a full disappearance and fresh peek sequence.
- Brief stops interrupt otherwise committed runs. Several sampled low-motion intervals last
  about 0.2–0.6 seconds. They are much shorter than a prolonged stationary watch.
- Full disappearance also occurs. This clip contains both partial edge turns and genuine absence.
  Tail motion trails the route; head/body direction remains readable through major turns.

## Measurement method and limits

FFmpeg resamples at 12 Hz and 683×512. Python/Pillow/NumPy/SciPy isolate the largest connected
purple component (`R>1.6G`, `B>1.5G`, `R,B>45`) and export its centroid and pixel area.
`track.json` and `paths.jpg` preserve the result. This is a color-component estimate, not
anatomical tracking. Tail/body animation, clipping and compression shift the centroid.
The `full` field in raw track data is a permissive area filter (>2200 pixels), not verified full
body visibility. Speed summaries based on that flag must not be treated as calibrated motion.

A stricter area filter (>7000 px in three consecutive samples), a centered 1/6-second velocity
estimate and threshold <.065 viewport widths/s locate approximate low-motion windows:
0.33–0.67, 2.42–2.75, 4.00–4.33, 11.08–11.25, 12.75–13.00, 14.83–15.00,
18.00–18.42, and 20.42–20.92 seconds. Sampling uncertainty is at least one frame (83 ms).
These are not exact pose freezes or inferred decisions; inspect `turns.jpg` alongside the trace.
No audio audition, controlled stimulus test, long-session model or biological inference here.

## Adopted design inferences

Use connected, finite routes with broad screen coverage; do not require a stop at every internal
waypoint. Mix crossfield runs, edge hooks, short hesitations, genuine exits and cautious peeks.
Retain stable headings between purposeful bends. Repeat-entry variation should be measured,
not inferred from random weights or motif names. See [implementation](behavior-routes.md).

The independent source critic found our hidden-cover distance penalty favored the previous
exit edge in over 90% of sampled reentries. That penalty is now removed for hidden travel only.
The critic also caught orbiting in the first route implementation at maximum speed; distance
braking was restored before acceptance. Reports are preserved with the evidence.

## Before/after policy simulation

Five seeds (1,42,71,97,123), 180 simulated seconds each, one mouse, default settings,
1024×768, 60 Hz, no paws. Baseline is commit `dcb2dd2`; after is this route implementation.
Visibility here means center within viewport and not away; this differs from the video mask.
RNG consumption changes, so compare distributions, not paired individual trajectories.

| Mean per run | Before | After |
| --- | ---: | ---: |
| Center-visible seconds | 64.28 | 83.35 |
| Visible seconds above 300 px/s | 22.55 | 33.71 |
| Visible path length / viewport width | 24.47 | 33.60 |

About 37% more visible travel in this fixture is evidence of changed coverage, not increased
cat enjoyment or matching the recording. Real two-mouse interaction and iPad perception need
owner observation. `policy-comparison.json` preserves per-seed output; no game data is uploaded.
