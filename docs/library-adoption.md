# Library adoption

Owner: root. Implemented and checked 2026-11-19; physical iPad validation remains pending.
Prefer maintained libraries when they reduce custom maintenance or improve measurable behavior.
Evaluate payload, frame cost, determinism, existing policies and migration effort before replacing
working code. Installing an unused package does not count as adoption.

## Integrated in this pass

- **Valibot 1.5.0:** production experiment-storage validation replaces shallow object checks.
  Nested counters, record attribution, assignment shapes, probabilities, window state and
  settings value types are checked before accepting a checkpoint. No coercion of malformed data.
  Rejected storage remains untouched until an explicit new session/clear writes a replacement;
  the game can continue in memory. Valid pilot checkpoints retain attribution and AB/BA pairs.
  This validates storage shape, not scientific validity or full experimental eligibility.
- **fast-check 4.10.3:** development-only property tests generate contact/event sequences,
  arbitrary JSON storage and straight approaches across speed, size and 30/60/120 Hz.
  Three properties each run 200 cases with seed 20261119. Failures print replay paths and
  shrink toward minimal cases. Directed regressions retain discovered failures permanently.
- Generated tests found fast swept arrivals stopping beyond their destination. The solver
  now stops at the closest point along that substep, retaining the existing arrival latch.
  The reduced example is distance 6 px, initial speed 1855 px/s, size .6, travel 1×, 30 Hz.
- Tests also exposed arrays being accepted as settings records; the persistence boundary
  explicitly requires a non-array object before applying record validation.

`npm run build:validation` bundles the schema and only used Valibot functions into
`public/vendor/experiment-schema.js` (11,398 bytes uncompressed). Production build rebuilds it;
a freshness test rejects stale committed output. The MIT license ships beside the bundle.
Validation runs at checkpoint restore, outside the animation loop. fast-check ships no browser code.

## Other domains reviewed

| Domain | Decision and reason |
| --- | --- |
| Rendering/materials | Continue installed Three.js; official Babylon fur comparison is runnable, but its current adapter is costlier and lacks coat/contact parity. See [measurements](fur-library-comparison.md). |
| World physics | Retain repaired solver: existing Planck prototype failed pin-gap/turn gates. See [engine decision](physics-engine-decision.md). |
| Fur sampling | Three MeshSurfaceSampler offers area sampling, but retained triangle/root attachments require internals or extra mapping. Keep current sampler pending an adapter that preserves attachments and identity. |
| Limb IK | Current analytic two-bone solution shares exact paw pin and envelope contracts; a generic animation system does not replace these policies. |
| Audio | Keep browser Web Audio scheduling and recorded assets; a wrapper would still need the existing cue priority, interruption and sparse-footstep rules. No synthetic fallback. |
| Persistence | Bounded localStorage remains synchronous; schema validation addresses the identified corrupt-checkpoint gap. Async database migration has no measured need at the current caps. |
| Owner UI | Retain minimal controls generated from the shared settings registry; a debug GUI is not a replacement for the cat-safe owner interaction. |

These are repository-specific engineering judgments, not universal library rankings.
No native engine migration, hosted deployment or physical-device performance claim.

## Sources

[Valibot objects](https://valibot.dev/guides/objects/) documents shaped and loose object handling;
[parsing](https://valibot.dev/guides/parse-data/) documents safeParse. We use loose nested objects
to preserve existing pilot provenance while validating required fields.
[fast-check numeric generators](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/number/)
documents bounded generation. Generated regression coverage does not prove cat engagement.
