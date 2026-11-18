# Project instructions

Prefer tools in this order: MCP → Browser Use (`browser-use`) → computer use (such as Cua Driver).
Use an applicable MCP integration first. Fall back to Browser Use when MCP is unavailable or
cannot handle the task, and use computer use only when Browser Use cannot handle it.
Follow any explicit tool preference the user gives for a particular task.

## Durable requirements and policies

- Read [docs/README.md](docs/README.md) and the owning topic before changing behavior.
- Update the owning requirements document with the implementation. Replace stale requirements,
  defaults and status instead of appending a chronological correction log.
- Keep each topical document at most 120 lines where possible, hard maximum 150; the index
  must remain at most 80 lines. Split focused topics before reaching a cap and update the index.
- Preserve explicit user decisions, including no automatic session stop. Current instructions
  supersede historical notes; repair conflicting docs rather than perpetuating both versions.
- Label implemented, in-progress, pending-validation and known-limit states honestly. Do not
  claim completion, deployment, device verification or visual/audio quality without evidence.
- Research citations must separate observed evidence from our design inference and limitations.
  Do not claim scientifically validated efficacy or photorealism from software tests.
- Follow [docs/maintenance.md](docs/maintenance.md) for ownership, pruning and evidence rules.
- Respect more specific directory instructions, including [ipad/AGENTS.md](ipad/AGENTS.md).
