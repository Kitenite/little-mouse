# Builder and critic improvement cycles

## Current authorization and scope

The owner requests continuing Superset builder/critic work across physics, anatomy,
coat, environment, sound and prey behavior, with reproducible failures. New feedback
adds to these domains. Root coordinates integration and the installed iPad release.
The current batch runs up to three focused build/review iterations per domain; workers
then hand off exact commits and the next ranked issue. The hill-climb batch is accepted; [results](cycles/behavior-hill-climb.md) preserve rejected
candidates and retained repairs. The next batch adds independently reviewed visibility and
executed-route diagnostics without changing utility or gameplay. Reusable role definitions live in `agents/roles.json`.
Future batches are bounded work, not a scheduled service or perpetual execution.

## Iteration contract

1. Inspect the latest integrated baseline and choose one observable domain weakness.
2. Capture a baseline reproduction before changing code: revision, seed, settings,
   viewport, input sequence, expected behavior and actual result.
3. Implement a bounded repair in an isolated worktree. Preserve other domains and
   existing owner choices; coordinate shared renderer/settings hooks explicitly.
4. An independent Superset critic reproduces the case, checks adverse cases and
   reports concrete findings with severity and evidence. Self-review is insufficient.
5. Fix findings and rerun relevant checks. Repeat with the next highest-value issue
   when the current result is reviewable; do not endlessly tune unmeasured details.
6. Commit each accepted iteration, record unresolved limits and hand off to root.
   Root reviews interactions and runs the combined suite/build before publishing.

Leads may each delegate one focused critic through Superset. Reuse that critic for
follow-ups rather than spawning an unbounded tree. Keep terminal/workspace IDs in
the domain report. Critics remain read-only in a builder's worktree.
No worker merges main, publishes, restarts the iPad or alters production settings.

## Measured hill climbing

An offline evaluator captures the incumbent before tuning. Each of three rounds proposes a
small bounded change, evaluates fixed training scenarios and retains an improvement only if
safety/readability gates pass. A separate critic challenges metrics and reproduces failures.
Hold-out seeds are reserved for final acceptance, not repeatedly tuned against. Record rejected
candidates as well as winners, exact configs/source hashes and rollback identity. Empty screens,
constant running, oscillation and unsafe paw approaches must not game the utility score.
Technical scores are engineering proxies. Promoting cat-preference claims still requires
labeled real play and prospective evaluation; synthetic contacts cannot supply that evidence.

## Failure evidence

Use one bounded report per domain under `docs/cycles/`; target 120 lines, maximum 150.
Replace resolved queue entries with a short result and test/evidence link. Large
machine-readable fixtures belong in tests/evidence, not growing Markdown logs.

Each case records:

- Stable case ID, severity and status: reproduced, fixed, verified or pending.
- Exact source revision and runtime build; browser/OS/device and viewport.
- Relevant settings, deterministic seed if supported, and ordered pointer/action
  events with simulation steps or timestamps. Mark nondeterminism explicitly.
- Expected versus observed behavior; screenshot, trace, log or test path.
- Restart/retry outcome and what session/pairing state survived.
- Fix commit, verification command and independent critic result.

Never include pairing secrets or credentials in shared reproduction exports.
An inability to reproduce is a result to record, not evidence that a failure is fixed.
Prioritize startup stalls, context loss, reload during play, network interruption,
touch cancellation, long holds, extreme morphology, overlapping paws and resume.

## Domain gates

| Domain | Evidence required |
| --- | --- |
| Physics | Held anchors, constraint bounds, damping/reset, finite state and repeatable drag/release |
| Anatomy | Attached limbs, coherent head/waist/rump, reference comparisons and extreme poses |
| Coat | Root attachment, plausible silhouette, stable identity and measured render/resource cost |
| Environment | Material-appropriate response, bounded pooling, pause/reset and repeatable scenes |
| Sound | Recorded provenance, event routing, variation, priority/levels and honest listening status |
| Behavior | Seeded tease/hide/reentry/run-through, paw avoidance and variation without deadlocks |
| Reliability | Failure injection, useful diagnostics, explicit recovery and preserved owner state |

Actual feline interest is evaluated by voluntary watching, stalking, chasing and return.
Software tests and human realism reviews do not establish that the game is addictive.
No automatic break or session stop; the owner decides when play ends. Keep movement
audio quiet beneath recorded touch squeaks. Physical speaker and iPad performance
claims require observation on the device.
