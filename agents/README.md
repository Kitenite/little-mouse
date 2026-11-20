# Reusable Mouse agent roles

`roles.json` is the checked-in project orchestration manifest. It is not Paradev's
native configuration and does not install or automatically launch background agents.
It preserves domain builders, independent critics, local learning, offline behavior evaluation
and the reference realism critic.
Active assignment/status belongs in `docs/workers.md`; domain queues remain in `docs/cycles/`.

Print the catalog or a scoped prompt:

```sh
node agents/prompt.mjs --list
node agents/prompt.mjs physics 'Reproduce and fix one tail-release defect'
```

The coordinator reads the Superset orchestration skill, creates an isolated workspace
from current main, and supplies baseline, acceptance criteria and verification commands.
Pass the rendered prompt to `superset agents create` using the installed CLI's documented
arguments. Record returned workspace/terminal IDs in the ledger; never reuse retired IDs.
Builders may each delegate one independent critic and reuse it for at most three iterations.
Root reviews exact handoffs and integration evidence before publishing or cleanup.
These definitions preserve roles and policies, not old agents' private conversation state.
