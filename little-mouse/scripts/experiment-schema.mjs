// Persistence boundary, not per-frame validation. Keep pilot provenance intact.
import * as v from 'valibot';
export const EXPERIMENT_SCHEMA_VERSION = 'sensory-pilot-v1';
export const EXPERIMENT_LIMITS = Object.freeze({ sessions: 40, records: 256, episodes: 256, bytes: 1000000, flushMs: 5000 });
const text = v.pipe(v.string(), v.maxLength(256));
const nonnegative = v.pipe(v.number(), v.finite(), v.minValue(0));
const counter = v.pipe(nonnegative, v.safeInteger());
const probability = v.pipe(nonnegative, v.maxValue(1));
const settings = v.pipe(v.custom(x => x !== null && typeof x === 'object' && !Array.isArray(x)),
 v.record(text, v.union([v.pipe(v.number(), v.finite()), v.boolean(), text])));
const arm = v.picklist(['A', 'B', 'C', 'D']);
const sequence = v.picklist(['AB', 'BA']);
const pair = v.object({ id: text, sequence, signature: v.pipe(v.string(), v.maxLength(16000)) });
const record = v.looseObject({
 id: text, sessionId: text, schemaVersion: v.literal(EXPERIMENT_SCHEMA_VERSION), kind: text,
 elapsedMs: nonnegative, simulationSeconds: nonnegative, payload: v.unknown(),
});
const session = v.looseObject({
 id: text, schemaVersion: v.literal(EXPERIMENT_SCHEMA_VERSION), trainingReady: v.literal(false),
 status: v.picklist(['active', 'ended', 'interrupted']), actor: v.picklist(['cat', 'human', 'test', 'unknown']),
 trialId: text, baseline: settings, effectiveSettings: settings,
 confirmedEffectiveSettings: v.optional(settings), startedUtcMs: nonnegative,
 assignment: v.looseObject({
  origin: v.picklist(['randomized-paired', 'randomized-four-arm']), arm,
  candidates: v.pipe(v.array(v.object({ id: arm, patch: settings, probability })), v.minLength(2), v.maxLength(4)),
  pair: v.nullable(v.object({ id: text, sequence, position: v.picklist([1, 2]), sequenceProbability: v.literal(.5) })),
  chosenProbability: probability, opeEligible: v.literal(false), unchangedTreatment: v.boolean(),
 }),
 window: v.looseObject({
  durationMs: v.literal(60000), elapsedMs: v.pipe(nonnegative, v.maxValue(60000)), ended: v.boolean(),
  endReason: v.nullable(text), technicalInterruption: v.boolean(),
  observationCoverage: v.literal('unknown'), trackingFraction: v.null(),
 }),
 exposure: v.looseObject(Object.fromEntries(['activeWallSeconds', 'unknownOrInactiveWallSeconds', 'simulationSeconds',
  'visibleMouseSeconds', 'hiddenMouseSeconds', 'countCoverageSeconds'].map(key => [key, nonnegative]))),
 contacts: v.object({ episodes: v.pipe(counter, v.maxValue(256)), outcomes: counter, unlinkedEvents: counter, droppedEpisodes: counter }),
 sequence: counter, lastElapsedMs: nonnegative, droppedRecords: counter,
 records: v.pipe(v.array(record), v.maxLength(EXPERIMENT_LIMITS.records)),
 end: v.nullable(v.looseObject({ reason: text, atUtcMs: nonnegative, elapsedMs: nonnegative })),
});
const storage = v.object({
 schemaVersion: v.literal(EXPERIMENT_SCHEMA_VERSION), trainingReady: v.literal(false), serial: counter,
 droppedSessions: counter, pairs: v.record(text, pair),
 sessions: v.pipe(v.array(session), v.maxLength(EXPERIMENT_LIMITS.sessions)),
});
export function parseExperimentStorage(input) {
 const result = v.safeParse(storage, input, { abortEarly: true });
 if (!result.success) throw Error('Invalid pilot storage');
 // Validate cross-record attribution as well as individual field shapes.
 for (const s of result.output.sessions) {
  if (s.records.some(r => r.sessionId !== s.id) || s.contacts.outcomes > s.contacts.episodes ||
      s.sequence < s.records.length) throw Error('Invalid pilot attribution');
 }
 return result.output;
}
