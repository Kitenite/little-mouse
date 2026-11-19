SUPERSET_WORKER_DONE

task: experiment-design-critic-final

summary: ACCEPTED for artifact/preflight scope. No remaining blockers from the five prior findings in this bounded follow-up review.

Verified resolutions:
1. Paired AB/BA assignments now specify sequence probabilities, conditional second-bout probability 1, pair metadata and false bout-level OPE eligibility. Protocol distinguishes pair/session analysis from independent bout OPE.
2. All six proposals use tracking_fraction_60s with owner-observation-v1. metrics.md defines onset, union of tracking intervals, fixed denominator, complete-coverage requirements, departures, interruption/censoring and conditional secondary outcomes. Incomplete windows remain reported rather than silently discarded.
3. Machine-readable prerequisites and the side-effect-free offline eligibility function reject unsupported modes, unknown readiness/presence, changed reference baselines, unavailable/zero-gain sound and unverified contrast applicability.
4. Required featureProvenance supplies feature version, source interval and availability time; documentation requires pre-assignment availability and training-fold preprocessing.
5. Settings snapshots reference the generated complete settings definition; the contract requires original-version validation and explicitly reserves cross-record/probability/provenance checks for a future importer.

Scope and implementation honesty: These are catalog, protocol, schema and offline preflight artifacts only. No collector, importer, assignment engine, analysis pipeline, learner or runtime enforcement is accepted as implemented. Passing catalog/preflight checks does not establish valid collected data, device behavior or cat preference.

checks: node experiments/build-catalog.mjs --check passed (76 variables, seven topic tables, six proposed comparisons). node --test experiments/eligibility.test.mjs passed all four tests. Inspected updated trials, eligibility function/tests, metrics, schema and attribution/probability documentation. No browser navigation, deployment or restart.

files: /tmp/mouse-experiment-final-review.md only; no repository edits.

handoff: Root may accept the artifact/preflight revision. Before collecting trials, implement and verify collector/importer/assignment gates, including cross-field constraints that JSON Schema alone does not enforce, complete context-feature provenance coverage, paired-sequence handling and missing-window reporting. This is the already-declared next implementation stage, not an unresolved artifact blocker.
