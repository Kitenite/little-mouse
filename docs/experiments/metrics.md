# Initial metric definitions — owner-observation-v1

Status: proposed research metrics; local pilot owner labels exist, but tracking measurement and analysis remain pending.
The 60-second window is an engineering starting point, not a biologically optimal session duration.
Window starts when the assigned settings are applied and play resumes; include initial hidden time.
No automatic stop follows: play continues until the owner ends it. One window belongs to one decision.
Owner must confirm cat presence and readiness to observe before assignment; no forced participation.

## Common primary outcome

`tracking_fraction_60s` = union of owner-annotated tracking intervals / 60 seconds.
Tracking means visible sustained gaze/head following of the on-screen prey or its last exit location;
it is an observer label, not a sensor-derived fact. Use intervals, not repeated checkbox counts.
Only compute primary value when the entire 60 s has known observation status and unchanged treatment.
Observed departure followed by observed absence contributes no tracking; absence after departure must be
observed, not assumed. App interruption or observer leaving produces null with incomplete-coverage reason.
Do not discard incomplete windows: report completion/coverage and reasons by arm alongside primary results.
An owner ending play early remains an outcome with observed duration and censor reason; not a zero-score trial.
Report sensitivity to missingness before claiming a candidate is better.

## Secondary outcomes

- Orientation latency: time from first mouse silhouette exposure to first owner-annotated orientation;
  already oriented = 0, no visible mouse = not applicable, no orientation by window end = right censored.
- Entry/exit tracking: observed tracking across a named entry/exit event; report opportunity count and
  unobserved events separately. No entry/exit is not failure. Treat as descriptive, treatment-conditioned data.
- Post-contact reacquisition: time from release/up to renewed tracking within a proposed 5 s window;
  already tracking = 0; no release = not applicable; no reacquisition = right censored; interrupted = missing.
- Contacts: unique episodes per full window, plus episodes per visible-mouse-second; retain both denominators.
  Zero visible exposure gives undefined normalized rate, not zero. Holds/moves do not inflate episode totals.
- Return: owner-observed return after departure; only evaluate while continued observation is available.

Fix observation instructions, censor windows and metric version before each assignment. Do not choose the
most favorable metric after comparing arms. The common-window primary avoids selecting only contacts or exits
that one treatment happens to produce; conditional secondary measures cannot by themselves establish benefit.
Owner ratings of interest remain separate ordinal labels, never converted into automatic enjoyment ground truth.
