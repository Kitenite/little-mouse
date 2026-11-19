import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { ExperimentSession, EXPERIMENT_STORAGE_KEY } from '../public/experiment-session.js';
import { settingsDefaults } from '../public/settings.js';
import { stepMice } from '../public/physics.js';

// Fixed seeds make CI repeatable; fast-check reports a minimal failing case and replay path.
const runs = { seed: 20261119, numRuns: 200 };
function fixture() {
 let raw = null, time = 0;
 const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
 const options = { storage, now: () => time, wallNow: () => 1700000000000 + time, rng: () => .1 };
 const session = new ExperimentSession(options);
 session.start({ trialId: 'coat-brightness', settings: settingsDefaults });
 return { session, options, storage, advance: dt => { time += dt; } };
}
test('generated contact/event sequences survive reload with bounded and attributable records', () => {
 fc.assert(fc.property(fc.array(fc.record({
  phase: fc.constantFrom('down', 'move', 'up', 'cancel'), id: fc.integer({ min: 0, max: 9 }),
  elapsed: fc.integer({ min: 0, max: 3000 }), payload: fc.jsonValue(),
 }), { maxLength: 80 }), events => {
  const f = fixture();
  for (const e of events) {
   f.advance(e.elapsed);
   f.session.tick({ dt: .016, visibleCount: 2, mouseCount: 2 });
   f.session.contact({ pointerId: e.id, phase: e.phase, outcome: 'hit' });
   f.session.event('sample', e.payload);
  }
  const before = f.session.exportData().sessions[0];
  const reloaded = new ExperimentSession(f.options);
  assert.equal(reloaded.diagnostics().storageError, null);
  const after = reloaded.exportData().sessions[0];
  assert.equal(after.status, 'interrupted');
  assert.deepEqual(after.records, before.records);
  assert.ok(after.contacts.outcomes <= after.contacts.episodes);
  assert.ok(after.records.length <= 256);
 }), runs);
});
test('nested corruption is rejected before adoption without overwriting the stored evidence', () => {
 const corruptions = [
  s => { s.sequence = -1; }, s => { s.contacts.outcomes = 999; },
  s => { s.exposure.visibleMouseSeconds = '1'; }, s => { s.window.ended = {}; },
  s => { s.assignment.candidates[0].probability = 4; },
  s => { s.records[0].sessionId = 'another-session'; },
  s => { s.baseline = []; }, s => { s.records[0].elapsedMs = null; },
 ];
 for (const corrupt of corruptions) {
  const f = fixture();
  const data = JSON.parse(f.storage.getItem()); corrupt(data.sessions[0]);
  const raw = JSON.stringify(data); f.storage.setItem(EXPERIMENT_STORAGE_KEY, raw);
  const reloaded = new ExperimentSession(f.options);
  assert.match(reloaded.diagnostics().storageError, /Invalid pilot/);
  assert.equal(reloaded.diagnostics().sessions, 0);
  assert.equal(f.storage.getItem(), raw);
  assert.doesNotThrow(() => reloaded.start({ trialId: 'coat-brightness', settings: settingsDefaults }));
 }
});
test('arbitrary JSON storage never prevents a fresh playable experiment', () => {
 fc.assert(fc.property(fc.jsonValue(), data => {
  const f = fixture(); f.storage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(data));
  const reloaded = new ExperimentSession(f.options);
  reloaded.start({ trialId: 'coat-brightness', settings: settingsDefaults });
  assert.equal(reloaded.active, true);
  reloaded.stop(); assert.doesNotThrow(() => reloaded.exportData());
 }), runs);
});
test('generated straight approaches stop without spinning across speed, size and frame rate', () => {
 fc.assert(fc.property(fc.record({
  distance: fc.integer({ min: 6, max: 1200 }), initialSpeed: fc.integer({ min: 0, max: 2500 }),
  size: fc.integer({ min: 60, max: 390 }), speed: fc.integer({ min: 0, max: 40 }),
  travel: fc.integer({ min: 10, max: 40 }), hz: fc.constantFrom(30, 60, 120),
 }), ({ distance, initialSpeed, size, speed, travel, hz }) => {
  const m = { x: 500, y: 500, vx: initialSpeed, vy: 0, angle: 0, targetX: 500 + distance,
   targetY: 500, hiddenUntil: 0, restUntil: 0, next: 0, seed: 1 };
  const config = { ...settingsDefaults, size: size / 100, speed: speed / 10, travelSpeed: travel / 10, variation: false };
  for (let i = 0; i < hz * 15; i++) stepMice([m], config, i / hz, 1 / hz, 10000, 10000);
  for (const key of ['x', 'y', 'vx', 'vy', 'angle']) assert.ok(Number.isFinite(m[key]), key);
  assert.ok(Math.abs(m.angle) < .001, 'straight arrival must not pivot into an orbit');
  assert.ok(Math.abs(m.x - m.targetX) <= 8, 'must reach the target');
  assert.equal(m.speed, 0);
 }), runs);
});
