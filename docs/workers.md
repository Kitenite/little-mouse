# Worker coordination

Reviewed 2026-11-20. Use persistent Superset terminal workers for ongoing core work;
built-in subagents are not the default orchestration surface requested by the owner.
Read the superset-orchestrate skill before dispatching. Keep this file a current ledger,
not an append-only activity log. Terminal existence does not establish completion.

## Control surface

Workspace: `5b5bc0ce-e628-499e-b026-143bf97a9de0`, local host.
Root owns main integration, iPad setup, checks, source publication and Sites deployment.
Parallel edits require isolated worktrees or deliberately disjoint file ownership.
Workers may delegate bounded independent reviews through Superset; preserve their IDs.

## Durable roles and current status

Earlier domain work is integrated on main. All 14 then-remaining completed
sessions and 20 auxiliary workspaces were retired after preservation commit
`d1f687a` was verified on GitHub. The Podrick simplification batch is integrated below.
Reusable roles, ownership, delegation and handoff policies are stored in
[`agents/roles.json`](../agents/roles.json); [`agents/prompt.mjs`](../agents/prompt.mjs)
prints prompts for the next bounded assignment. Main workspace stays available.

| Builder | Independent review | Pending queue / evidence |
| --- | --- | --- |
| Physics | physics-critic | [Physics](cycles/physics.md); engine adoption remains deferred |
| Anatomy / animation | anatomy-critic | [Anatomy](cycles/anatomy.md); rump, tail root and ears |
| Coat / texture | coat-critic | [Coat](cycles/coat.md); stippling and fringe |
| Environment / backgrounds | environment-critic | [Environment](cycles/environment.md); material response |
| Sound | audio-critic | [Audio](cycles/audio.md); listening and audition coverage |
| Prey behavior | behavior-critic | [Behavior](cycles/behavior.md); paw scenarios |
| Reliability / controls | reliability-critic | [Reliability](cycles/reliability.md); physical WebKit checks |
| Reference realism critic | Root integration review | [Realism](cycles/realism.md); observed references |

Domain reports retain historical session IDs and exact handoffs; these are not active
assignments. New batches must record fresh IDs, status, dependencies and acceptance
criteria here. Shared renderer hooks belong to anatomy; coordinate cross-domain edits.
[Retirement inventory](archive/workspace-retirement/README.md) preserves remaining
research and branch heads. Root owns preservation, push verification and deletion.

Previously integrated: part-drag `68a8337`, limb skin `8bdc57b`, fur/Fuzziness `3c71dab`,
environment `20313f4`, surface rustle `655eab4`, web recovery `0ae2101`, landscape `46eaeb9`.
World-engine prototype `6c1633e` remains deferred after failing drag/joint/overshoot gates.


Coat-depth requirement: body/head and continuous limbs need visible fur volume and silhouette
breakup, not just flat texture. Preserve regional bare skin, coat identity, deformation and
existing hair controls. Verify top/side poses, drag attachment, bounded resources and iPad
rendering cost; physical-device quality remains pending until observed.

## Sound curation acceptance

Review every clip for source identity, confidence, behavior context, duration, levels,
redundancy and keep/replace/remove recommendation. Do not count aliases as new recordings.
Tap feedback should be recorded squeaks, with movement/foley quiet around them. No generated
noise or oscillator fallback. Keep attribution and licensing evidence even for internal use.
Separate waveform/source analysis from actual listening; do not claim physical speaker checks.

## Handoff

Require a SUPERSET_WORKER_DONE or SUPERSET_WORKER_BLOCKED envelope with task, summary,
files, checks and remaining work. Inspect evidence before integrating or claiming completion.
Retire completed terminals after authorized cleanup. Update this ledger when ownership or status changes.
The owner now requests continuing builder/critic improvement. Follow
[the cycle contract](improvement-cycles.md): three focused iterations per active batch,
independent criticism, reproducible cases and root-owned integration. This does not
install a recurring unattended service or authorize worker merges into main.

## Accepted hill-climb batch

Baseline `a3196df`; learning context `717aec1`, creep recovery `f4cee77`, visible-peek
recovery `70eeb19`. The owner requested continued critique and hill climbing. All assigned
work is integrated and independently reviewed. Evidence commit `dd81c7a` was verified on
GitHub before all three completed worker terminals were retired. IDs below are historical.

| Task | Local terminal | Outcome |
| --- | --- | --- |
| Offline evaluation/search | `0b862128-8a8c-4ed4-b72c-54b827bc25b2` | partial builder handoff; root completed validation repairs and final search |
| Motion critic | `8d651d10-d325-4501-b61d-8c068ce4b847` | verified creep recovery, nine blocked peeks and adverse controls |
| Learning / scoring critic | `990ff0bf-6a89-4a5b-8895-36d32d7da36c` | learning accepted; three scoring-review rounds resolved blockers |
| Root | current coordinator | integrated/published runtime; 400 tests, build, browser and final search pass |

Three search rounds retained default settings: all eight unique numeric neighbors failed
improvement/safety requirements. Final training panel reduces worst blocked travel from
6.83 to 3.33 seconds. Search utility remains an engineering proxy, never cat reward.
[Batch report](cycles/behavior-hill-climb.md) and [evidence](evidence/hill-climb-2026-11-20/README.md)
retain exact repros, candidates/rejections, source fingerprints, criticism and next comparisons.
New evaluation/critic roles are durable in `agents/roles.json`; no periodic service is installed.
Main workspace, sidebar game, game server and Metro stay available. Current device/release
boundaries belong in [verification](verification.md). Earlier domain queues remain above.

## Visibility and route measurement batch

Baseline `3537a0a`; same local workspace `5b5bc0ce-e628-499e-b026-143bf97a9de0`.
Shared worktree has deliberately disjoint file ownership. No production setting changes.

| Task | Terminal | Status / dependency / ownership |
| --- | --- | --- |
| Visibility builder | `29d1a8b8-6fb4-4d92-946b-6a61a8579771` | completed; neutral body helper/tests/topic reviewed |
| Route builder | `1c5f99b3-5b82-4eca-83fd-a5f729e15c43` | completed; executed path helper/tests/topic reviewed |
| Independent critic | `dacfdca9-b5c6-4a01-a87d-e25edc4d545d` | completed; two independent rounds, accepted with stated limits |
| Root | coordinator | integrated; 425 tests/build/search pass; publication and retirement pending |

Acceptance: measured actual movement, explicit proxy/denominator limits, bounded memory,
edge/heading/discontinuity/frame-rate adversarial checks and unchanged gameplay/utility.
New measurements remain diagnostic after review; no historical learning records are relabeled.
[Results](cycles/motion-metrics.md) and [evidence](evidence/motion-metrics-2026-11-20/README.md)
preserve roles, probes, exact comparisons and next queue. Main/sidebar/server are retained.
