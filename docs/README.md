# Little Mouse requirements and policies

These documents preserve the owner's decisions and the current implementation contract.
Source review: 2026-11-17. They describe the working tree, not proof of a deployed release.

| Topic | Owns |
| --- | --- |
| [Behavior](behavior.md) | Teasing, hiding, risk, movement, injury and session policy |
| [Anatomy and motion](anatomy-motion.md) | Body proportions, gait, fur, tails, ears, whiskers and contact geometry |
| [Physics engine decision](physics-engine-decision.md) | World solver comparison, current repairs and engine adoption gate |
| [Touch interaction](touch-interaction.md) | Tap, hold, drag, toss, resting paws and touch memory |
| [Audio](audio.md) | Recorded cues, silence, activation, mixing and provenance |
| [Sound curation](sound-curation.md) | Clip inventory, source identity, replacement decisions and listening limits |
| [Visuals and backgrounds](visuals-backgrounds.md) | Realism target, materials, lighting and iPad rendering |
| [Controls, network and native app](controls-network-native.md) | Companion, settings, owner exit, live iteration and installed app |
| [Validation and research](validation-research.md) | Acceptance evidence, critique agents, device checks and scientific limits |
| [Playground](playground.md) | Dedicated testing, forcing scenarios and controlled simulation time |
| [Realism review](realism-review.md) | Reference comparisons, ranked visible gaps and review acceptance |
| [Worker coordination](workers.md) | Persistent Superset roles, task ownership and handoff status |
| [Current verification](verification.md) | Latest checks, release boundaries and remaining device checks |
| [Maintenance](maintenance.md) | Ownership, document limits, pruning and release claims |
| [Primary research notes](mouse-behavior-research.md) | Sources, observations and separate design inferences |

## Status vocabulary

- **Implemented:** the current source contains the behavior; acceptance tests/device checks are separate evidence.
- **In progress:** explicitly requested work under active implementation; do not treat as delivered.
- **Pending validation:** source exists but the stated outcome still needs the named check.
- **Limit:** known boundary of the current approach, not an unannounced promise to add a feature.

## Product direction

Create a convincing, textured 3D prey game for this cat, inspired by the teasing and
hide/reentry behavior of Mouse for Cats. Favor one engaging mouse over a busy swarm.
The iPad is the play surface; a phone or laptop can tune and control it live.
The owner controls when play ends. Rapid iteration and durable adjustable settings matter.
Cat engagement takes priority over strict biological realism; playful broad coat/color palettes
are allowed while movement and interaction remain coherent.

Realism, feline interest and physical device quality remain observational goals.
Neither test success nor a renderer screenshot proves indistinguishability from real prey.

## Reading existing material

The root and app READMEs remain setup references; older review reports are historical
snapshots. If they conflict with these requirements, inspect current source and repair the
owning document rather than copying the obsolete instruction. In particular, old long-press
pause instructions are superseded by the corner gesture in the controls document.
