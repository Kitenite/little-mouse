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

The accepted batch is complete and integrated on main. All 14 remaining completed
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

## Accepted behavior batch

All tasks share main workspace above with disjoint file ownership; no auxiliary worktrees.
Root owns enrichment/group policy, game wiring, controls, integration and release checks.

| Task | Local terminal | Dependencies / state |
| --- | --- | --- |
| Paw detours | `6de3c7ee-a37c-4f80-8439-d4607e801c55` | contact.js, focused tests, touch doc; completed, verified, retired |
| Living pauses | `cbdca8d9-3f01-4eb6-a6b4-a3f120a0d5bc` | idle-animation.js, mouse3d.js, tests, anatomy doc; completed, verified, retired |
| Local learning | `823e8d77-b178-45aa-a6a8-1cff0b43e2e1` | new metrics/learning module/tests and learning docs; completed, verified, retired |
| Root integration | current coordinator | all handoffs/critics accepted; combined checks passed |

Accepted scope: coordinated lead/sneak roles, visible pause gestures, near-miss dodge/check-back,
persistent paw detours, actual movement/variety metrics, cautious cross-session local adaptation.
Contact safety and deliberate routes outrank variety; no auto-stop, remote control or synthetic audio.
Learning must separate cat/human/test/unknown, exclude experiments, require multiple sessions,
keep conservative bounds and provide freeze/reset/export. Interaction is not enjoyment.

Prior reference-route critic `91d7274e-3c71-490f-a40a-93818442a1d7` completed and retired;
[acceptance](evidence/reference-2026-11-19/implementation-review.md) preserves its handoff.
Session chapters and reference-route changes are integrated through `2b9acbe`.
The owner-supplied recording supersedes the earlier unavailable physical capture.
[Recording analysis](reference-recording-analysis.md) owns observation and inference boundaries.

Physical iPad play quality and matched before/after cat observation remain pending.
Local server and Metro stay available; cleanup applies only to verified completed workers.

Independent social and learning critics reused the detour and pause terminals. All reproduced
findings are repaired and accepted. [Batch evidence](cycles/behavior-learning.md) preserves
reports and executable probes; final checks: 375 web tests, build/Worker syntax, catalog and
four eligibility tests. Implementation/evidence commit `9536c73` was verified on origin/main before all three completed
worker terminals were closed. Main workspace, sidebar game and development servers remain available.
