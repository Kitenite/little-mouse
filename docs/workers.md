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

## Previous accepted batches

[Hill climbing](cycles/behavior-hill-climb.md): `dd81c7a`, obstruction repairs and context-isolated
learning. [Motion metrics](cycles/motion-metrics.md): `e7c21bb`, partial neutral-body visibility
and actual-route diagnostics. All workers from both batches were retired after source/evidence
publication. Historical terminal tables remain in Git at `4ba72c4`; reusable roles are in code.
Main workspace, sidebar, game server and Metro are retained; release status is in verification.

## Active whole-appearance and motion review

Baseline `4ba72c4`, local workspace above; intentionally disjoint shared worktree ownership.

| Task | Terminal | Status / dependency / ownership |
| --- | --- | --- |
| Excursion builder | `9f7718a4-5081-4a0c-a7b9-cf1f55bf1949` | completed; helper and baseline-failing recovery regression verified |
| Measurement critic | `6283fe10-62c0-4495-9c45-60db1121742a` | completed; round3 accepted measurement contract |
| Motion trace critic | `96133374-ac7e-4878-bfd9-350e89f09a05` | completed; scoped acceptance with two exact residual cases queued |
| Root | coordinator | final checks passed; publishing reviewed work and preserving residual collision queue |

Acceptance: continuous witnessed entry-to-exit geometry; partial/censored appearances explicitly
separated; bounded memory and real displacement; unchanged existing score metrics unless a
separately reviewed runtime defect requires repair. No automatic settings or enjoyment claims.
Earlier domain queues remain active above; new messages add work, never silently replace it.

Persistent non-agent servers (retain during cleanup): game `10790bda-bdde-47fc-8703-087de9a1a21b`
and Metro `268209c7-0d6c-4906-b6c0-4ddb94c75d20`.

Next motion batch: seed23 prolonged retreat and post-sweep collision-induced paw intrusion;
see the final motion critic artifacts. Whole-appearance replacement/resize adapters remain
out of scope until those scenarios are added. No claim of all spinning resolved.
