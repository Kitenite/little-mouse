import { normalizeProfile } from './settings.js';
import { sensoryTrials } from './experiment-trials.js';

import { parseExperimentStorage, EXPERIMENT_SCHEMA_VERSION, EXPERIMENT_LIMITS } from './vendor/experiment-schema.js';
export { EXPERIMENT_SCHEMA_VERSION, EXPERIMENT_LIMITS };
export const EXPERIMENT_STORAGE_KEY = 'little-mouse-sensory-pilot-v1';
const WINDOW_MS = 60000;
const copy = value => JSON.parse(JSON.stringify(value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const str = (value, max = 120) => typeof value === 'string' ? value.slice(0, max) : '';
// Bounded JSON conversion also tolerates cycles, DOM objects, BigInts and getters.
function clean(value, depth = 0) {
  if (value === null || typeof value === 'boolean') return value;
  if (finite(value)) return value;
  if (typeof value === 'string') return value.slice(0, 256);
  if (!value || typeof value !== 'object' || depth >= 3) return null;
  if (Array.isArray(value)) return value.slice(0, 16).map(v => clean(v, depth + 1));
  const result = {};
  for (const key of Object.keys(value).slice(0, 24)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    try { result[key.slice(0, 80)] = clean(value[key], depth + 1); } catch { /* unavailable field */ }
  }
  return result;
}
function baseline(input) {
  const result = normalizeProfile(input);
  // Compatibility while the sound worker adds the shared setting.
  result.soundVariety = ['focused', 'varied'].includes(input?.soundVariety) ? input.soundVariety : 'varied';
  return result;
}
/** Local pilot only. start() returns a patch; the caller applies it on a new Play cast.
 * tick dt is simulation seconds; now is monotonic milliseconds. No timers/game mutations.
 * Wall window includes hidden/paused time; interruptions invalidate complete observation.
 */
export class ExperimentSession {
  constructor({ storage, rng = Math.random, now = () => performance.now(), wallNow = () => Date.now() } = {}) {
    this.storage = storage; this.rng = rng; this.now = now; this.wallNow = wallNow;
    this.sessions = []; this.pairs = {}; this.serial = 0; this._active = null;
    this.pointers = new Map(); this.storageError = null; this.droppedSessions = 0;
    this.lastFlush = -Infinity; this.dirty = false;
    try {
      const raw = storage?.getItem(EXPERIMENT_STORAGE_KEY);
      if (raw) {
        if (raw.length > EXPERIMENT_LIMITS.bytes) throw Error('Stored pilot exceeds size limit');
        const data = parseExperimentStorage(JSON.parse(raw));
        this.sessions = data.sessions; this.serial = data.serial;
        this.droppedSessions = Number.isSafeInteger(data.droppedSessions) ? data.droppedSessions : 0;
        for (const trial of sensoryTrials) {
          const pair = data.pairs?.[trial.id];
          if (pair && typeof pair.id === 'string' && ['AB', 'BA'].includes(pair.sequence) && typeof pair.signature === 'string') this.pairs[trial.id] = pair;
        }
        for (const s of this.sessions) if (s.status === 'active') {
          s.status = 'interrupted'; s.end = { reason: 'interrupted-reload', atUtcMs: this.wallNow(), elapsedMs: s.lastElapsedMs, elapsedAfterCheckpoint: 'unknown' };
          if (!s.window.ended) { s.window.ended = true; s.window.endReason = 'interrupted-reload'; }
          s.window.technicalInterruption = true;
        }
        this.dirty = true; this._flush(true);
      }
    } catch (error) { this.storageError = str(error.message); }
  }
  get active() { return this._active !== null; }
  _id(prefix) { return `${prefix}-${this.wallNow()}-${++this.serial}`; }
  _record(kind, payload) {
    const s = this._active;
    if (!s) return;
    if (s.records.length >= EXPERIMENT_LIMITS.records) { s.droppedRecords++; this.dirty = true; return; }
    let boundedPayload = clean(payload);
    const encodedPayload = JSON.stringify(boundedPayload);
    if (encodedPayload.length > 2048) boundedPayload = { truncated: true, preview: encodedPayload.slice(0, 1024) };
    s.records.push({ id: `${s.id}:${++s.sequence}`, sessionId: s.id, schemaVersion: EXPERIMENT_SCHEMA_VERSION,
      kind, elapsedMs: s.lastElapsedMs, simulationSeconds: s.exposure.simulationSeconds, payload: boundedPayload });
    this.dirty = true;
  }
  _advance(sample) {
    const s = this._active;
    if (!s) return;
    const stamp = this.now();
    const elapsed = finite(stamp) ? Math.max(s.lastElapsedMs, stamp - this.startedAt) : s.lastElapsedMs;
    const delta = elapsed - this.sampleElapsed;
    const portion = Math.max(0, Math.min(elapsed, WINDOW_MS) - Math.min(this.sampleElapsed, WINDOW_MS));
    s.lastElapsedMs = elapsed;
    if (!s.window.ended) {
      s.window.elapsedMs = Math.min(elapsed, WINDOW_MS);
      const pageVisible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
      if (sample && delta <= 2000 && sample.playing !== false && pageVisible) {
        s.exposure.activeWallSeconds += portion / 1000;
        const validCounts = Number.isInteger(sample.mouseCount) && sample.mouseCount >= 0 && sample.mouseCount <= 100 &&
          Number.isInteger(sample.visibleCount) && sample.visibleCount >= 0 && sample.visibleCount <= sample.mouseCount;
        if (validCounts) {
          s.exposure.visibleMouseSeconds += sample.visibleCount * portion / 1000;
          s.exposure.hiddenMouseSeconds += (sample.mouseCount - sample.visibleCount) * portion / 1000;
          s.exposure.countCoverageSeconds += portion / 1000;
        }
        if (finite(sample.dt) && sample.dt >= 0 && sample.dt <= 2) s.exposure.simulationSeconds += sample.dt * (delta ? portion / delta : 0);
      } else if (sample && portion > 0) {
        s.exposure.unknownOrInactiveWallSeconds += portion / 1000;
        s.window.technicalInterruption = true;
      }
      if (sample) this.sampleElapsed = elapsed;
      if (elapsed >= WINDOW_MS) {
        this._closeExposure();
        s.window.ended = true; s.window.endReason = 'window-complete';
        this._record('window-end', { reason: 'window-complete', gameContinues: true });
        this._flush(true);
      }
    }
    if (delta > 0) this.dirty = true;
  }
  _closeExposure() {
    const s = this._active;
    const unmeasured = Math.max(0, Math.min(s.lastElapsedMs, WINDOW_MS) - Math.min(this.sampleElapsed, WINDOW_MS));
    // No final sample: preserve unknown exposure even for a subframe tail. Only a
    // long unsampled gap is a technical interruption, not ordinary event timing.
    s.exposure.unknownOrInactiveWallSeconds += unmeasured / 1000;
    if (unmeasured > 2000) s.window.technicalInterruption = true;
    this.sampleElapsed = s.lastElapsedMs;
  }
  _flush(force = false) {
    const stamp = this.now();
    if (!this.dirty || (!force && stamp - this.lastFlush < EXPERIMENT_LIMITS.flushMs)) return;
    this.lastFlush = stamp;
    while (this.sessions.length > EXPERIMENT_LIMITS.sessions) { this.sessions.shift(); this.droppedSessions++; }
    const serialize = () => JSON.stringify({ schemaVersion: EXPERIMENT_SCHEMA_VERSION, trainingReady: false,
      serial: this.serial, pairs: this.pairs, droppedSessions: this.droppedSessions, sessions: this.sessions });
    let raw = serialize();
    while (raw.length > EXPERIMENT_LIMITS.bytes && this.sessions.length > 1) {
      this.sessions.shift(); this.droppedSessions++; raw = serialize();
    }
    // Keep a single pathological session bounded, retaining its summary and attribution.
    while (raw.length > EXPERIMENT_LIMITS.bytes && this.sessions[0]?.records.length) {
      this.sessions[0].records.pop(); this.sessions[0].droppedRecords++; raw = serialize();
    }
    try {
      if (this.storage) { this.storage.setItem(EXPERIMENT_STORAGE_KEY, raw); this.storageError = null; }
    } catch (error) { this.storageError = str(error.message) || 'Storage unavailable'; }
    this.dirty = false;
  }
  start({ trialId, settings, actor = 'unknown', build = '', device = {} }) {
    const trial = sensoryTrials.find(item => item.id === trialId);
    if (!trial) throw Error(`Unknown sensory trial: ${trialId}`);
    const restored = this._active ? this.stop('replaced-by-new-bout') : null;
    const fullBaseline = baseline(restored || settings);
    const candidates = trial.variants.map(variant => ({ id: variant.id, patch: { ...variant.patch } }));
    if (trial.id === 'sound-volume') candidates[1].patch.soundVolume = fullBaseline.soundVolume / 2;
    const signature = JSON.stringify({ baseline: fullBaseline, build: str(build), device: clean(device) });
    let chosen, pair = null;
    if (candidates.length === 2) {
      const pending = this.pairs[trialId];
      if (pending?.signature === signature) {
        chosen = pending.sequence[1];
        pair = { id: pending.id, sequence: pending.sequence, position: 2, sequenceProbability: .5 };
        delete this.pairs[trialId];
      } else {
        chosen = this.rng() < .5 ? 'A' : 'B';
        pair = { id: this._id('pair'), sequence: chosen === 'A' ? 'AB' : 'BA', position: 1, sequenceProbability: .5 };
        this.pairs[trialId] = { id: pair.id, sequence: pair.sequence, signature };
      }
    } else {
      const draw = this.rng();
      chosen = candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor((finite(draw) ? draw : 0) * candidates.length)))].id;
    }
    for (const candidate of candidates) candidate.probability = pair?.position === 2 ? Number(candidate.id === chosen) : 1 / candidates.length;
    const patch = candidates.find(candidate => candidate.id === chosen).patch;
    const effectiveSettings = baseline({ ...fullBaseline, ...patch });
    const id = this._id('bout');
    this.startedAt = this.now(); this.sampleElapsed = 0; this.pointers.clear();
    this._active = {
      id, schemaVersion: EXPERIMENT_SCHEMA_VERSION, trainingReady: false, status: 'active',
      actor: ['cat', 'human', 'test', 'unknown'].includes(actor) ? actor : 'unknown', build: str(build), device: clean(device),
      startedUtcMs: this.wallNow(), baseline: fullBaseline, effectiveSettings,
      effectiveSettingsSource: 'expected-from-returned-patch; caller-application-unverified',
      gameRandomness: 'unseeded/untracked', castBalance: 'unverified', trialId,
      assignment: { origin: pair ? 'randomized-paired' : 'randomized-four-arm', arm: chosen, candidates, pair,
        chosenProbability: candidates.find(c => c.id === chosen).probability, opeEligible: false,
        unchangedTreatment: JSON.stringify(fullBaseline) === JSON.stringify(effectiveSettings) },
      window: { durationMs: WINDOW_MS, clock: 'monotonic-wall-including-interruptions', elapsedMs: 0, ended: false,
        endReason: null, technicalInterruption: false, observationCoverage: 'unknown', trackingFraction: null },
      exposure: { activeWallSeconds: 0, unknownOrInactiveWallSeconds: 0, simulationSeconds: 0,
        visibleMouseSeconds: 0, hiddenMouseSeconds: 0, countCoverageSeconds: 0,
        method: 'tick-endpoint-estimate; gaps-over-2s-unknown' },
      contacts: { episodes: 0, outcomes: 0, unlinkedEvents: 0, droppedEpisodes: 0 },
      sequence: 0, lastElapsedMs: 0, droppedRecords: 0, records: [], end: null,
    };
    this.sessions.push(this._active); this._record('start', { trialId, arm: chosen }); this._flush(true);
    return { patch: { ...patch }, arm: chosen, id };
  }
  stop(reason = 'owner-ended') {
    if (!this._active) return null;
    this._advance();
    const s = this._active;
    if (!s.window.ended) this._closeExposure();
    s.status = 'ended';
    s.end = { reason: str(reason), atUtcMs: this.wallNow(), elapsedMs: s.lastElapsedMs };
    if (!s.window.ended) { s.window.ended = true; s.window.endReason = str(reason); }
    this._record('end', s.end);
    const restored = copy(s.baseline);
    this._active = null; this.pointers.clear(); this.dirty = true; this._flush(true);
    return restored;
  }
  tick(sample = {}) { this._advance(sample); this._flush(); }
  contact({ pointerId, phase, x, y, mouseId, region, outcome } = {}) {
    this._advance();
    const s = this._active;
    if (!s || s.window.ended) return;
    if (!(typeof pointerId === 'string' || finite(pointerId))) { s.contacts.unlinkedEvents++; return; }
    const key = `${typeof pointerId}:${str(String(pointerId), 80)}`;
    const start = phase === 'down' || phase === 'pointerdown';
    const end = ['up', 'cancel', 'pointerup', 'pointercancel'].includes(phase);
    let episode = this.pointers.get(key);
    if (start && (!episode || episode.ended)) {
      if (s.contacts.episodes >= EXPERIMENT_LIMITS.episodes) { s.contacts.droppedEpisodes++; return; }
      episode = { id: `${s.id}:contact-${++s.contacts.episodes}`, ended: false, outcome: false };
      this.pointers.set(key, episode);
      this._record('contact', { episodeId: episode.id, pointerId, phase: 'down', x, y, mouseId, region, actor: s.actor });
    } else if (!episode) { s.contacts.unlinkedEvents++; return; }
    // Moves and repeated downs are not independent episodes or rewards.
    if (outcome !== undefined) this.outcome({ pointerId, outcome });
    if (end && !episode.ended) {
      episode.ended = true;
      this._record('contact', { episodeId: episode.id, pointerId, phase, x, y, mouseId, region });
    }
    this.dirty = true; this._flush();
  }
  outcome({ pointerId, outcome } = {}) {
    this._advance();
    if (!this._active || this._active.window.ended || outcome === undefined || outcome === null) return;
    const episode = this.pointers.get(`${typeof pointerId}:${str(String(pointerId), 80)}`);
    if (!episode) { this._active.contacts.unlinkedEvents++; return; }
    if (episode.outcome) return;
    episode.outcome = true; this._active.contacts.outcomes++;
    this._record('contact-outcome', { episodeId: episode.id, pointerId, outcome }); this._flush();
  }
  observe(label) {
    this._advance();
    const target = this._active || this.sessions.at(-1);
    if (!target) return;
    const previous = this._active;
    this._active = target;
    this._record('observation', { label, source: 'owner', coverage: 'unknown',
      annotationUtcMs: this.wallNow(), retrospective: target.window.ended,
      interpretation: 'point-label-not-tracking-interval' });
    this._active = previous;
    this._flush(true);
  }
  confirmSettings(settings) {
    if (!this._active) return null;
    this._advance();
    const actual = baseline(settings);
    const s = this._active;
    const matches = JSON.stringify(actual) === JSON.stringify(s.effectiveSettings);
    s.confirmedEffectiveSettings = actual;
    s.effectiveSettingsSource = matches ? 'caller-confirmed' : 'caller-mismatch';
    s.settingsMatch = matches;
    if (!matches) { s.window.technicalInterruption = true; s.settingsAttribution = 'noncompliant'; }
    this._record('settings-confirmed', { matches }); this._flush(true);
    return matches;
  }
  event(kind, payload) {
    this._advance();
    if (!this._active || this._active.window.ended) return;
    this._record(`event:${str(kind, 80)}`, payload); this._flush();
  }
  exportData() {
    this._advance(); this._flush(true);
    return copy({ schemaVersion: EXPERIMENT_SCHEMA_VERSION, trainingReady: false, exportedUtcMs: this.wallNow(),
      limitations: ['Pilot schema, not planned research record schema', 'No enjoyment score or automatic learning',
        'Owner coverage unknown; no tracking fraction', 'Settings application, audio readiness and new cast require caller verification',
        'No cast/seed balancing; no bout-level OPE', 'Bounded retention; exports include dropped-record counts'],
      droppedSessions: this.droppedSessions, storageError: this.storageError, sessions: this.sessions });
  }
  clear() {
    // Deletion does not change gameplay; caller should stop() first to restore baseline.
    this.sessions = []; this.pairs = {}; this._active = null; this.pointers.clear(); this.droppedSessions = 0;
    this.dirty = true; this._flush(true);
  }
  diagnostics() {
    return { schemaVersion: EXPERIMENT_SCHEMA_VERSION, trainingReady: false, sessions: this.sessions.length,
      active: this.active, activeId: this._active?.id ?? null, windowEnded: this._active?.window.ended ?? null,
      records: this.sessions.reduce((n, s) => n + s.records.length, 0),
      droppedRecords: this.sessions.reduce((n, s) => n + s.droppedRecords, 0), droppedSessions: this.droppedSessions,
      storageError: this.storageError, persistence: this.storage ? (this.storageError ? 'memory-fallback' : 'local-storage') : 'memory-only' };
  }
}
