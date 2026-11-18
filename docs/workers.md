# Worker coordination

Reviewed 2026-11-17. Use persistent Superset terminal workers for ongoing core work;
built-in subagents are not the default orchestration surface requested by the owner.
Read the superset-orchestrate skill before dispatching. Keep this file a current ledger,
not an append-only activity log. Terminal existence does not establish completion.

## Control surface

Workspace: `5b5bc0ce-e628-499e-b026-143bf97a9de0`, local host.
Root owns main integration, iPad setup, checks, source publication and Sites deployment.
Parallel edits require isolated worktrees or deliberately disjoint file ownership.
Workers may delegate bounded independent reviews through Superset; preserve their IDs.

| Role | Terminal | Scope/status |
| --- | --- | --- |
| Audio implementation | `aeb88079-ac0b-42b5-a31a-df623e6f3eeb` | Completed main audio runtime/tests; recorded tap squeaks, no synthesized fallback, quiet movement |
| Sound curation lead | `49671af0-6882-4117-999f-3ffa3f788f01` | Isolated `audio-realism-variety` branch; completed inventory/source audit; 10 excerpts integrated, 3 crawl excerpts held for listening |
| Physics prototype lead | `04bacc27-b0f8-4f2d-9a9a-1e7a5b815fba` | Isolated `physics-engine-prototype` branch; completed at `6c1633e`; 23 tests; adoption deferred for joint gaps/overshoot; not live |

| Reactive environment lead | `1906036a-b32e-42b0-8678-76be0b6050f7` | Running in isolated `reactive-environment` worktree; material-aware impressions, debris response, controls and independent review |

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
No recurring unattended service or automatic merge is authorized by this ledger.
