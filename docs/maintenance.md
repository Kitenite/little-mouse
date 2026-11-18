# Documentation maintenance

## Ownership and size

`docs/README.md` is the entry point. Each requirement has one owning topic; link to that topic
rather than copying its full policy into several files. `settings.js` owns numeric defaults and
validation ranges; documents explain why controls exist and what behavior to preserve.

Target at most 120 lines per topic, hard limit 150. Keep the index at most 80 lines.
Split before a limit is reached, using a focused child topic and an index link. Apply the same
limits to new research notes; do not grow one permanent research or requirements dump.

## Update procedure

1. Locate the owning topic before changing a behavior or interface.
2. Read the relevant source/tests; distinguish the request, implemented behavior and evidence.
3. Update the requirement and acceptance criteria in the same work as the implementation.
4. Replace obsolete wording, defaults and status. Remove superseded decisions instead of
   appending a dated correction below a contradictory paragraph.
5. Update the index only if ownership or navigation changed. Check relative links and line counts.
6. State unfinished work explicitly; promote “in progress” only after source and checks support it.

New user instructions supersede earlier preferences. Preserve the useful rationale, but prune
the obsolete requirement. In particular, do not resurrect timed breaks or long-press owner exit
from old READMEs. Ask the owning editor to repair conflicts outside your assigned files.

## Recurring review responsibilities

Keep background/color, audio and animation review responsibilities available across future
changes. Schedule bounded follow-up reviews when the relevant area changes; queue work when
agent capacity is full and preserve explicit file ownership. This is maintenance on each task,
not a promise to run indefinitely or an implicit recurring background service.

## Evidence and claims

“Implemented” means source exists, not shipped, installed, visually accepted or cat-approved.
Never infer deployment from commit/push, installation from a plugged cable, device performance
from simulator success, or scientific efficacy from an automated test.
For research, include the primary citation, observed result, our inference and relevant limits.
A source's existence alone does not prove a claim; recheck it when altering scientific conclusions.

Tests and check results belong in a bounded current handoff/release record; do not append
run-by-run results to every topic. Remove stale pass totals when the suite changes.
Keep source provenance/license details with assets and link to them from topical policy.

## Review checklist

- One clear owner for each requirement; no contradictory duplicates.
- Current implementation status and a useful acceptance criterion.
- Source paths and links resolve; index and topics stay within their limits.
- Pending requests and observed limitations remain visible.
- No unsupported completion, photorealism, welfare, sound-audibility or device claims.
