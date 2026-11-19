# Worker coordination

Reviewed 2026-11-18. Use persistent Superset terminal workers for ongoing core work;
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

New messages are additive. Do not cancel or replace these tasks merely because another request arrives.

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

Podrick’s Violin rebrand, artwork splash, simplified storybook UI, local-only runtime
and recorded audio are integrated and published. Renamed native shell installed; final
relaunch awaits exit from Guided Access. Current owner direction supersedes companion policy.
Completed assignments: UI (HTML/CSS + native home), local-only (game networking + native
Game wrapper), audio (recorded sample curation/mix). Root completed deployment and cleanup.
Keep the base game and local owner controls; remove pairing, steering and companion UI/API.
Live development asset updates remain for iteration; no remote gameplay control.

| Task | Workspace (local) | Terminal | Status |
| --- | --- | --- | --- |
| ui | `1cdd768e-7a48-4a06-a46e-f66d0838c204` | `ef6a072f-ed57-4054-8a71-f79bca72f302` | completed; integrated; retired |
| local | `a7f96f69-497b-4888-a869-e5969da687f2` | `ee9cec0a-24cf-4c8c-bfdd-cd38ebff6986` | completed; integrated; retired |
| audio | `c4b3d12d-6447-4349-b55b-381ecae24e95` | `f69ded84-16aa-4d32-bbbe-00b25c347a1c` | completed; integrated; retired |

Audio acceptance: recorded stock/found sources only; no artificial synthesis or
unnatural pitch/rate effects. Silence if no suitable recording. Squeaks more prominent.

Integrated UI `504867e`, local-only `fa03cc5` / `58e5066`, audio `69bb434`.
Audio critic terminal `f0c5e35b-7540-475e-86ba-3af60e254976` shared the audio workspace.
Pending physical checks: listening and native appearance. Final restart blocked by Guided Access;
owner asked to exit it. This does not block source publication or hosted deployment.

After GitHub preservation `254f5a6`, all four batch sessions and three auxiliary workspaces
were retired. Only main worktree remains; roles, handoffs and selected captures are in code.

Root follow-up: faster/more active hunt, 30% larger mice, minimal copy and stronger UI contrast.
No new worker workspace needed for this scoped preset/presentation change. 269 web tests, production build and Worker syntax checks pass; browser confirms new preset
and ready startup. Hosted publication succeeded. Guided Access remains the native restart dependency.
