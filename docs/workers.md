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

| Role | Terminal | Current batch |
| --- | --- | --- |
| Physics builder | `04bacc27-b0f8-4f2d-9a9a-1e7a5b815fba` | Complete: integrated motion fixes and accepted B4 claim-boundary follow-up |
| Anatomy builder | `1d55772c-e1b1-439a-abb3-a31dfebcd3c2` | Integrated profile/jaw fixes; independent combined render review passed |
| Coat builder | `37be8626-484b-4e27-b7af-1786121687f7` | Integrated curled loft/face transition; independent review passed |
| Environment builder | `1906036a-b32e-42b0-8678-76be0b6050f7` | Integrated three response fixes; previews stopped; critic retired after acceptance |
| Audio builder | `aeb88079-ac0b-42b5-a31a-df623e6f3eeb` | Integrated three accepted audio fixes; source count unchanged |
| Audio critic | `49671af0-6882-4117-999f-3ffa3f788f01` | Completed independent acceptance; evidence integrated |
| Behavior builder | `ce1b794a-1fc4-4b52-b9d6-9dee3c7f5cf0` | Complete: four accepted policy fixes integrated, including held/toss cue cleanup |
| Reliability builder | `be76f581-7262-4c17-b14c-8a9797b16141` | Integrated three accepted recovery/settings fixes |
| Reference realism critic | `b1905a2f-48ee-4727-9351-ce92957abbd8` | Completed reference and combined rendered reviews; own previews stopped |

Batch baseline: `cf064cc`; stacks plus final B4 follow-up integrated at `d6c3409`.
All domain builders/critics completed the current batch. Leads remain available for follow-up.
Independent domain critics and worktree IDs are recorded in `docs/cycles/<domain>.md`.
Scope: up to three focused build/review/repair iterations per domain, then exact commit
handoffs and next ranked findings. See [current results](cycles/README.md) for evidence and cleanup.
Physics owns drag/secondary/contact modules; anatomy owns shared renderer hooks; coat owns
fur/material modules; environment owns background/light/response; behavior owns policy;
audio owns samples/routing; reliability owns boot/game diagnostics. Shared hooks require
peer coordination and separate commits. Root owns final integration and publication.

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
Keep completed terminals for continuation. Update this ledger when ownership or status changes.
The owner now requests continuing builder/critic improvement. Follow
[the cycle contract](improvement-cycles.md): three focused iterations per active batch,
independent criticism, reproducible cases and root-owned integration. This does not
install a recurring unattended service or authorize worker merges into main.
