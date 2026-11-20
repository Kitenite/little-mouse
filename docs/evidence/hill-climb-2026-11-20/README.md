# Hill-climb evidence

Baseline runtime: `a3196df`. Learning context: `717aec1`. Creep repair: `f4cee77`.
Final runtime, including visible-peek recovery: `70eeb19`. This directory preserves
reproductions and review evidence; it is not a cat-engagement dataset.

- `learning-context.md`: builder handoff and independent integration review.
- `motion-critic.md`: independent baseline, two repairs, controls and limits.
- `motion-adverse.mjs`: opposed creeping, held obstacle, slow creep and live paw.
- `motion-creep-repro.mjs`: natural default seed 11 replay at three frame rates.
- `motion-peek-repro.mjs`: blocked near-arrival peek at 12/15/16-pixel gaps.
- `motion-peek-controls.mjs`: unobstructed, slow, invisible and held approaches.
- Associated JSON files retain baseline, intermediate accepted and final observations.

Probes default to the repository's current public modules. To replay a prior runtime:

```sh
mkdir -p /tmp/prey-baseline
git archive a3196df little-mouse/public little-mouse/package.json | tar -x -C /tmp/prey-baseline
MOTION_SOURCE=/tmp/prey-baseline/little-mouse/public node docs/evidence/hill-climb-2026-11-20/motion-adverse.mjs
```

The original peek baseline had only 12/16-pixel cases. The final probe adds the exact
15-pixel boundary that caught an intermediate candidate's reset bug. Earlier six-case
JSON remains labeled; final nine-case JSON is `motion-peek-final-independent.json`.
The final peek/creep control files match their earlier accepted controls exactly.

Final `search-70eeb19.json` contains all three rounds and rejection reasons;
`training-a3196df.json` is the original runtime under the same final evaluator.
`comparison.json`, `browser.json`, `web-tests.txt` and `build.txt` retain root checks.
`benchmark-builder-handoff.md` describes the historical partial handoff; `benchmark-critic.md` supersedes
its unresolved findings. Source/evaluator hashes determine comparability;
never mix reports from different scoring versions.
Software tests and synthetic contacts do not establish feline preference or device quality.
