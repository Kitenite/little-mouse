import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExperimentSession, EXPERIMENT_STORAGE_KEY, EXPERIMENT_LIMITS } from '../public/experiment-session.js';
import { sensoryTrials } from '../public/experiment-trials.js';
import { settingsDefaults, validateSettings } from '../public/settings.js';

function fixture(rng = () => .1) {
  let time = 0, writes = 0;
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => { writes++; data.set(key, value); } };
  const options = { storage, rng, now: () => time, wallNow: () => 1700000000000 + time };
  return { options, data, storage, advance: ms => { time += ms; }, writes: () => writes,
    session: new ExperimentSession(options) };
}
const start = (session, extra = {}) => session.start({ trialId: 'coat-brightness', settings: settingsDefaults, ...extra });
const last = session => session.exportData().sessions.at(-1);

test('catalog covers sensory controls and a separate four-arm interaction', () => {
  const keys = new Set();
  for (const trial of sensoryTrials) {
    assert.deepEqual(trial.variants[0].patch, {}); assert.equal(trial.requiresNewCast, true);
    for (const variant of trial.variants) {
      validateSettings(variant.patch);
      Object.keys(variant.patch).forEach(key => keys.add(key));
    }
  }
  for (const key of ['backgroundContrast', 'coatBrightness', 'sound', 'soundFrequency', 'soundVolume', 'soundVariety',
    'background', 'backgroundScale', 'coatPalette', 'coatSaturation', 'coatVariation', 'brightness', 'lighting', 'shadowStrength']) assert.ok(keys.has(key), key);
  assert.equal(sensoryTrials.find(t => t.id === 'coat-background-2x2').variants.length, 4);
});
test('AB/BA conditional assignment, immutable full baseline, and restoration', () => {
  for (const [draw, order] of [[.1, 'AB'], [.9, 'BA']]) {
    const { session } = fixture(() => draw);
    const settings = { ...settingsDefaults, brightness: .6, coatBrightness: .9 };
    const first = start(session, { settings }); assert.equal(first.arm, order[0]);
    const one = last(session); assert.equal(one.assignment.chosenProbability, .5);
    assert.equal(one.assignment.opeEligible, false); assert.equal(one.assignment.pair.sequence, order);
    const restored = session.stop(); assert.equal(restored.brightness, .6); assert.equal(restored.coatBrightness, .9);
    assert.equal(session.stop(), null); assert.equal(session.active, false);
    assert.equal(start(session, { settings }).arm, order[1]);
    const two = last(session); assert.equal(two.assignment.chosenProbability, 1);
    assert.equal(two.assignment.candidates.reduce((sum, c) => sum + c.probability, 0), 1);
    assert.equal(two.assignment.pair.id, one.assignment.pair.id);
    assert.equal(settings.coatBrightness, .9);
  }
});
test('replacement restores original baseline before assigning; quieter gain is resolved', () => {
  const { session } = fixture(() => .9);
  start(session); const changed = last(session).effectiveSettings;
  start(session, { settings: changed });
  assert.equal(last(session).baseline.coatBrightness, settingsDefaults.coatBrightness);
  session.stop();
  const result = start(session, { trialId: 'sound-volume', settings: { soundVolume: .1 } });
  assert.equal(result.patch.soundVolume, .05);
  assert.equal(last(session).assignment.candidates[1].patch.soundVolume, .05);
});
test('durable pair continuation; changed baseline begins a new pair', () => {
  const f = fixture(); start(f.session); const pair = last(f.session).assignment.pair.id; f.session.stop();
  const reloaded = new ExperimentSession(f.options); assert.equal(start(reloaded).arm, 'B');
  assert.equal(last(reloaded).assignment.pair.id, pair); reloaded.stop();
  start(reloaded); reloaded.stop(); start(reloaded, { settings: { brightness: .5 } });
  assert.equal(last(reloaded).assignment.pair.position, 1);
});
test('four arm distribution explicitly includes every candidate', () => {
  const { session } = fixture(() => .8); start(session, { trialId: 'coat-background-2x2' });
  const a = last(session).assignment; assert.equal(a.arm, 'D'); assert.equal(a.pair, null);
  assert.deepEqual(a.candidates.map(c => c.probability), [.25, .25, .25, .25]);
});
test('contact between ticks preserves full exposure without a technical interruption', () => {
  const f = fixture(); start(f.session);
  f.advance(8); f.session.contact({ pointerId: 1, phase: 'down' });
  f.advance(8); f.session.tick({ dt: .016, visibleCount: 2, mouseCount: 2 });
  f.advance(8); f.session.event('audio-sample', { played: true });
  f.advance(8); f.session.tick({ dt: .016, visibleCount: 2, mouseCount: 2 });
  const s = last(f.session); assert.equal(s.exposure.activeWallSeconds, .032);
  assert.equal(s.exposure.visibleMouseSeconds, .064); assert.equal(s.exposure.simulationSeconds, .032);
  assert.equal(s.exposure.unknownOrInactiveWallSeconds, 0); assert.equal(s.window.technicalInterruption, false);
  f.advance(5); f.session.stop(); const ended = last(f.session);
  assert.equal(ended.exposure.unknownOrInactiveWallSeconds, .005); assert.equal(ended.window.technicalInterruption, false);
});
test('up before outcome, repeated moves/outcomes, multi-paw and reused pointers', () => {
  const { session } = fixture(); start(session);
  session.contact({ pointerId: 7, phase: 'down' });
  for (let i = 0; i < 200; i++) session.contact({ pointerId: 7, phase: 'move' });
  session.contact({ pointerId: 7, phase: 'up' });
  session.outcome({ pointerId: 7, outcome: 'hit' }); session.outcome({ pointerId: 7, outcome: 'hit' });
  session.contact({ pointerId: 8, phase: 'down', outcome: 'miss' });
  assert.equal(last(session).contacts.episodes, 2); assert.equal(last(session).contacts.outcomes, 2);
  session.contact({ pointerId: 7, phase: 'down', outcome: 'hit' });
  assert.equal(last(session).contacts.episodes, 3); assert.equal(last(session).contacts.outcomes, 3);
  assert.equal(last(session).records.filter(r => r.kind === 'contact-outcome').length, 3);
});
test('60 seconds ends observation once but leaves active play, missing coverage stays unknown', () => {
  const f = fixture(); start(f.session);
  for (let i = 0; i < 61; i++) { f.advance(1000); f.session.tick({ dt: .5, visibleCount: 1, mouseCount: 2 }); }
  const s = last(f.session); assert.equal(f.session.active, true); assert.equal(s.window.elapsedMs, 60000);
  assert.equal(s.exposure.activeWallSeconds, 60); assert.equal(s.exposure.simulationSeconds, 30);
  assert.equal(s.records.filter(r => r.kind === 'window-end').length, 1);
  assert.equal(s.window.trackingFraction, null); assert.equal(s.window.observationCoverage, 'unknown');
  assert.equal(s.actor, 'unknown'); assert.equal(s.trainingReady, false);
  assert.ok(f.writes() < 20);
});
test('paused/background and long gaps are wall time, not simulated exposure', () => {
  const f = fixture(); start(f.session);
  f.advance(1000); f.session.tick({ dt: 1, playing: false, visibleCount: 2, mouseCount: 2 });
  f.advance(10000); f.session.tick({ dt: .016, visibleCount: 2, mouseCount: 2 });
  const s = last(f.session); assert.equal(s.window.elapsedMs, 11000);
  assert.equal(s.exposure.activeWallSeconds, 0); assert.equal(s.exposure.unknownOrInactiveWallSeconds, 11);
  assert.equal(s.window.technicalInterruption, true);
});
test('owner can annotate last stopped bout without restarting it; no fabricated tracking', () => {
  const f = fixture(); start(f.session); f.session.stop(); f.advance(1000); f.session.observe('watching');
  const s = last(f.session); assert.equal(f.session.active, false);
  assert.equal(s.records.at(-1).kind, 'observation'); assert.equal(s.records.at(-1).payload.retrospective, true);
  assert.equal(s.window.trackingFraction, null);
});
test('full settings confirmation is preserved without payload truncation; mismatch is explicit', () => {
  const { session } = fixture(); const result = start(session);
  assert.equal(session.confirmSettings({ ...settingsDefaults, ...result.patch }), true);
  assert.equal(last(session).effectiveSettingsSource, 'caller-confirmed');
  assert.equal(session.confirmSettings({ ...settingsDefaults, brightness: .5 }), false);
  const s = last(session); assert.equal(s.settingsAttribution, 'noncompliant');
  assert.ok(Object.keys(s.confirmedEffectiveSettings).length > 70);
});
test('reload marks active checkpoint interrupted and export is detached JSON data', () => {
  const f = fixture(); start(f.session); f.advance(1000); f.session.tick({ dt: 1, visibleCount: 1, mouseCount: 2 });
  f.session.exportData(); const reloaded = new ExperimentSession(f.options); const data = reloaded.exportData();
  assert.equal(data.sessions[0].status, 'interrupted'); assert.equal(data.sessions[0].end.reason, 'interrupted-reload');
  assert.equal(data.sessions[0].end.elapsedAfterCheckpoint, 'unknown'); assert.equal(reloaded.active, false);
  data.sessions[0].baseline.brightness = -1; assert.notEqual(last(reloaded).baseline.brightness, -1);
  assert.doesNotThrow(() => JSON.stringify(data));
});
test('malformed and inaccessible storage fall back to bounded memory', () => {
  for (const raw of ['{', '{}', '{"schemaVersion":"sensory-pilot-v1","sessions":[{}],"serial":0}']) {
    const f = fixture(); f.data.set(EXPERIMENT_STORAGE_KEY, raw);
    const session = new ExperimentSession(f.options); assert.ok(session.diagnostics().storageError); start(session); session.stop();
  }
  const session = new ExperimentSession({ storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } } });
  start(session); assert.equal(session.diagnostics().persistence, 'memory-fallback'); assert.equal(session.exportData().sessions.length, 1);
});
test('record, episode, session and serialized storage caps; clear persists deletion', () => {
  const f = fixture(); start(f.session);
  const cyclic = { text: 'x'.repeat(10000) }; cyclic.self = cyclic;
  for (let i = 0; i < 800; i++) { f.session.event('behavior-sample', cyclic); f.session.contact({ pointerId: i, phase: 'down' }); }
  let s = last(f.session); assert.ok(s.records.length <= EXPERIMENT_LIMITS.records);
  assert.ok(s.contacts.episodes <= EXPERIMENT_LIMITS.episodes); assert.ok(s.droppedRecords > 0); assert.ok(s.contacts.droppedEpisodes > 0);
  f.session.stop(); for (let i = 0; i < 50; i++) { start(f.session); f.session.stop(); }
  assert.ok(f.session.diagnostics().sessions <= EXPERIMENT_LIMITS.sessions);
  assert.ok(f.storage.getItem(EXPERIMENT_STORAGE_KEY).length <= EXPERIMENT_LIMITS.bytes);
  assert.ok(f.session.diagnostics().droppedSessions > 0);
  f.session.clear(); assert.equal(f.session.exportData().sessions.length, 0);
  assert.equal(new ExperimentSession(f.options).exportData().sessions.length, 0);
});
