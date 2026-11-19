# Preference learning and agent policy review

Status: planned; no model, scheduled agent, runtime learner or policy auto-update has been installed.
This framework targets interaction patterns and owner-observed engagement for an individual cat, not enjoyment.

## Progression

1. Descriptive analysis: coverage, technical failures, unique contacts, exposure, sequence repetition and owner labels.
2. Randomized small comparisons: frozen policy/settings within each observation bout, meaningful uncertainty.
3. Simple predictive baselines: compare constant/session baselines with regularized models on a few supported features.
4. Bounded contextual bandit: choose among reviewed motif presets at bout boundaries, with logged probabilities.
   Keep low-data fallback and owner override; no unconstrained action over all 77 dimensions.
5. Consider richer sequence models only if enough independent sessions and consistent labels justify complexity.
   A single cat's sparse touch history does not justify a large model or a claim of general cat preferences.

Keep repetition memory separate from preference estimates: remembered recent exits, motifs and clip IDs can
reduce immediate repetition without mislabeling novelty as enjoyment. Model choice occurs between coherent bouts,
never as frame-by-frame heading noise. All catalog automatic eligibility is false until a reviewed action set exists.

## Targets and evaluation

Keep distinct targets for tracking, approach, contacts, post-contact reacquisition, voluntary return and departures.
Do not collapse them into an unvalidated happiness score or reward rapid taps, loudness, injury or endless play.
A touch-only model predicts interaction propensity, not attention. Training on owner labels must preserve observer,
coverage, missingness and confidence; absence of a label is not disengagement.
Measure effects on a common bout window as well as exposure-normalized diagnostics. Hiding can change exposure,
so conditioning only on visible time can conceal a treatment cost. Check motion, audio and frame pacing guardrails.

Split by whole sessions/days, never random frames or taps. Use chronological holdout to assess drift and avoid
neighboring bouts leaking history. With multiple cats, hold out cats before making cross-cat generalization claims.
Tune only on training/validation data; freeze metric/version and reserve untouched evaluation sessions.
Compare to fixed default and simple baseline policies. Report uncertainty and support, not only a fitted score.

Off-policy estimates require known assignment probabilities and overlap with candidate actions. Inspect effective
sample size/weight variance; unsupported actions cannot be judged from logs. Manual/deterministic history may be
useful descriptively but cannot establish counterfactual superiority of untried settings. Sequential carryover means
a contextual-bandit estimate of a bout outcome does not establish long-term policy benefit; confirm prospectively.
These are general statistical requirements, not cat-specific efficacy evidence:
[Vowpal Wabbit OPE guide](https://vowpalwabbit.org/docs/vowpal_wabbit/python/9.11.2/tutorials/off_policy_evaluation.html),
[Li et al., unbiased offline evaluation](https://arxiv.org/abs/1003.5956).

## Agent review contract

Input: immutable dataset manifest/hash, schema/metric versions, source policy/build, missingness report,
eligible actions, experiment assignments, owner observations and implementation constraints.
Output: reviewed session counts/coverage, supported findings versus hypotheses, repetition analysis,
ranked small changes, exact candidate diff, expected effects/tradeoffs, test plan and rollback policy ID.
Agent must say keep collecting when evidence is sparse; it cannot fabricate observations or optimize a proxy
without declaring its meaning. Generated candidate JSON is validated against approved bounds and all invariants.
Independent critic checks attribution, leakage, multiple comparisons, uncertainty and regressions before promotion.
Root integrates accepted candidates, tests them, and records the release/candidate version. No unreviewed LLM edits
or data-driven self-modification during a cat session. OTA delivery remains separate from scientific acceptance.

## Protected constraints

Owner decides when play ends; no automatic session stop. Preserve paw avoidance and contact ownership,
coherent readable routes, bounded appendage physics, independent gait/travel, recorded-only native-rate audio,
local controls, identity through hiding and immediate owner override. Two mice/current fast travel remain baseline.
Learners cannot reinterpret unknown presence as disinterest or require injury to provide catch feedback.
Freeze/reset/export learning controls are required before enabling adaptation. Keep last accepted policy for rollback.
