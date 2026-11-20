# Improvement batches

## Behavior hill climbing — 2026-11-20

[Current batch](behavior-hill-climb.md): context-isolated learning, actual-travel obstruction
recovery, reproducible offline search and independent motion/scoring critiques.

## Coordinated prey and learning — 2026-11-20

[Accepted batch](behavior-learning.md): three Superset builders and two independent reviews;
coordination, watch poses, pounce responses, detours, metrics and cautious local adaptation.
Critic reproductions and repairs are preserved; current checks are in [verification](../verification.md).

## Feline-play critique — 2026-11-18

[Research critic report](feline-play-critique.md) ranks six owner-led comparisons against
current behavior. Review complete; suggested changes remain unimplemented and unvalidated.
Start with watch duration while holding fast travel constant. Root checked primary evidence
and corrected stale companion/default guidance; no device or cat preference claims.

## Podrick simplification — 2026-11-18

Three Superset builders and an audio critic delivered the current local-only game.
[UI](podrick-ui.md), [local-only runtime](podrick-local.md) and [recorded audio](podrick-audio.md)
retain handoffs and limitations. Root integrated their commits and passed 268 web tests,
four native tests, native lint/typecheck, production build and Worker syntax checks.
[Selected UI captures](evidence/podrick/) preserve the reviewed tablet layout and recovery.
Current device and release status belongs in [verification](../verification.md).

## Previous domain improvement batch

Baseline `cf064cc`; seven domain builders and independent Superset critics.
The accepted stacks and held/toss cue follow-up are integrated at `d6c3409`.
Root owns combined verification and publication; this bounded batch is complete.

| Domain | Accepted work | Evidence |
| --- | --- | --- |
| [Physics](physics.md) | Preserve paused pins, event-independent toss, continuous tail release | Numerical reproductions and independent adverse probes |
| [Anatomy](anatomy.md) | Smooth bounded body profile and embedded articulated jaw | Shared contact tests, rendered reference comparisons |
| [Coat](coat.md) | Varied curled loft and gradual face transition | Fixed roots/UVs/budgets, paired renders |
| [Environment](environment.md) | No drag-release footprint backfill, anchored grass, live strength | Pooled renderer tests and actual browser scenes |
| [Audio](audio.md) | Failed download recovery, full excerpt rounds, stale eating cancellation | [Independent audio critique](audio-critique.md) and replay probes |
| [Behavior](behavior.md) | Clear entrances, superseded injury/hold/toss cues, obstructed peek recovery | Seeded adversarial paw scenarios |
| [Reliability](reliability.md) | Durable pending settings, sanitized failure export, malformed-state recovery | Injected failures, acknowledgement races, native checkpoints |
| [Realism](realism.md) | Independent reference comparisons across builder iterations | Actual captures, specific remaining visual defects |

## Combined review

After the final B4 follow-up, the full web suite passed 276 tests. All four native
tests passed earlier in this batch with unchanged native inputs.
The physics lead independently passed seven focused tests and four combined
contact/renderer/ground probes. The realism critic inspected 11 combined captures,
including extreme coat/morphology, tail hold/release and material switches; no new
blocker found. Root also inspected a combined held-tail side view.
[Combined report](evidence/integration/review.txt) records exact settings and limits.
Its default39/extreme39 draw calls are resource counts, not device frame-rate evidence.

Root injected actual browser WebGL context loss during active play. The new
[sanitized report](evidence/integration/context-loss-report.json) captured the
failure and pre-cleanup playing state; Retry returned ready/recovering=false,
playing=true and a usable WebGL renderer. The backgrounded scratch browser had
elapsed0 and no runtime version; this is recovery evidence, not a live-motion test.

## Cleanup

Earlier cleanup retired five sessions and three obsolete workspaces/worktrees.
Final owner-authorized cleanup completed after preservation commit `d1f687a`
was verified on GitHub: 14 sessions closed and 20 auxiliary Mouse workspaces deleted.
Verified one main worktree, no remaining worker terminals and all historical branch
heads retained. Six obsolete preview servers and four owned scratch browsers stopped.
The primary main checkout is retained. See [worker ledger](../workers.md) and
[retirement evidence](../archive/workspace-retirement/README.md).
Reusable roles are checked in under `agents/`; no periodic service is installed.
Old terminal and workspace IDs in individual reports are historical identifiers.

Current release details and total checks belong in [verification](../verification.md).
Known visual limits include pointed rump, dark fringe, thick ears and faint marks.
No physical iPad listening/performance or feline-engagement claim from these checks.
