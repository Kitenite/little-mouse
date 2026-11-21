import test from 'node:test';
import assert from 'node:assert/strict';
import {createExcursionTracker} from '../scripts/behavior-excursions.mjs';
const point = (time, x, extra = {}) => ({time, x, y: .5, eligible: true, visible: x >= -.05 && x <= 1.05, ...extra});
function crossing(t, start = 0, fps = 60, extra = {}) {
  for (let i = 0; i <= fps * 1.4; i++) t.sample(point(start + i / fps, -.2 + i / fps, extra));
}
test('natural core-visible crossing retains unclamped actual endpoints and uniform arc', () => {
  const t = createExcursionTracker(); crossing(t);
  const s = t.finalize();
  assert.equal(s.counts.completedAppearances, 1); assert.equal(s.counts.censoredAppearances, 0);
  const h = s.history[0]; assert.equal(h.edgePair, 'left->right');
  assert.ok(h.signature[0].x < 0); assert.ok(h.signature.at(-1).x > 1);
  assert.ok(Math.abs(h.pathLength - h.duration) < 1e-12);
  for (let i = 1; i < h.signature.length; i++) assert.ok(Math.abs(h.signature[i].x - h.signature[i - 1].x - h.pathLength / 31) < 1e-12);
});
test('first visible and trailing appearances are censored, never promoted by finalize arguments', () => {
  const t = createExcursionTracker(); t.sample(point(0, .5)); t.sample(point(.1, 1.2));
  let s = t.finalize({complete: true}); assert.equal(s.counts.completedAppearances, 0); assert.equal(s.censorReasons.leftCensored, 1);
  const u = createExcursionTracker(); u.sample(point(0, -.2)); u.sample(point(.1, 0));
  s = u.finalize(); assert.equal(s.censorReasons.rightCensored, 1); assert.equal(s.counts.completedAppearances, 0);
  assert.deepEqual(u.finalize(), s); assert.throws(() => u.sample(point(1, .5)));
});
test('hold, hidden, replacement and teleport cannot create completed exits or release entries', () => {
  for (const change of [{eligible: false}, {discontinuity: true}, {x: 10, visible: false}]) {
    const t = createExcursionTracker(); t.sample(point(0, -.2)); t.sample(point(.1, 0));
    t.sample(point(.2, .3, change)); t.sample(point(.3, .5)); t.sample(point(.4, 1.2));
    const s = t.finalize(); assert.equal(s.counts.completedAppearances, 0); assert.ok(s.counts.censoredAppearances >= 1);
  }
  const t = createExcursionTracker(); t.sample(point(0, -.2, {discontinuity: true}));
  t.sample(point(.1, 0)); t.sample(point(.2, .6)); t.sample(point(.3, 1.2));
  assert.equal(t.finalize().censorReasons.leftCensored, 1);
});
test('pauses, returns and arbitrary labels do not segment a whole appearance', () => {
  const run = labels => {
    const t = createExcursionTracker();
    const xs = [-.2, 0, .3, .3, .3, .3, .3, .3, .3, .6, .3, .6, 1, 1.2];
    xs.forEach((x, i) => t.sample(point(i / 10, x, labels ? {phase: `phase${i}`, executionId: i} : {})));
    return t.finalize();
  };
  assert.deepEqual(run(true), run(false)); const s = run(false);
  assert.equal(s.counts.completedAppearances, 1); assert.ok(s.history[0].duration > 1); assert.ok(s.history[0].pathLength > 1);
});
test('invalids, nonmonotonic time and gaps break continuity', () => {
  for (const bad of [point(.2, NaN), point(.2, .4, {visible: 1}), point(.1, .4), point(1, .4)]) {
    const t = createExcursionTracker(); t.sample(point(0, -.2)); t.sample(point(.1, 0)); t.sample(bad);
    t.sample(point(1.1, .8)); t.sample(point(1.2, 1.2));
    assert.equal(t.finalize().counts.completedAppearances, 0);
  }
});
test('identical crossing recurrence and path support stay stable across frame rates', () => {
  const results = [30, 60, 120].map(fps => {
    const t = createExcursionTracker(); crossing(t, 0, fps);
    t.sample(point(1.5, -.2, {discontinuity: true})); crossing(t, 1.6, fps);
    return t.finalize();
  });
  for (const s of results) {
    assert.equal(s.counts.completedAppearances, 2); assert.equal(s.counts.comparisonAppearances, 1);
    assert.equal(s.corridorRecurrence, 1); assert.equal(s.history[1].comparisonSupport, 1);
    assert.ok(Math.abs(s.history[0].pathLength - 1.1) < .04);
  }
});
test('stationary jitter is short; no per-frame jitter accumulation', () => {
  const t = createExcursionTracker(); t.sample(point(0, -.06));
  for (let i = 1; i <= 200; i++) t.sample(point(i / 100, .0001 * (i % 2)));
  t.sample(point(2.1, -.1)); const s = t.finalize();
  assert.equal(s.counts.shortAppearances, 1); assert.ok(s.history[0].pathLength < .002); assert.equal(s.corridorRecurrence, null);
});
test('all complete appearances retain signatures, with explicit unknown and corner edges', () => {
  for (const [outside, expected] of [[{x: .5, y: .5}, 'unknown'], [{x: -.1, y: -.1}, 'corner']]) {
    const t = createExcursionTracker(); t.sample(point(0, 0, {...outside, visible: false}));
    t.sample(point(.1, 0, {y: 0})); t.sample(point(.2, .1, {y: .1}));
    t.sample(point(.3, 0, {...outside, visible: false}));
    assert.equal(t.finalize().history[0].edgePair, `${expected}->${expected}`);
  }
});
test('point, duration and length overflow remain censored through natural exit', () => {
  for (const options of [{maxPoints: 3}, {maxDuration: .2}, {maxPathLength: .1}]) {
    const t = createExcursionTracker(options); crossing(t);
    const s = t.finalize(); assert.equal(s.censorReasons.overflow, 1); assert.equal(s.counts.completedAppearances, 0);
    assert.equal(s.history.length, 0); assert.ok(s.storage.highWaterPoints <= s.config.maxPoints);
  }
});
test('history and active storage bounded; snapshots and inputs detached', () => {
  const t = createExcursionTracker({historySize: 2, signaturePoints: 8});
  for (let i = 0; i < 20; i++) { t.sample(point(i * 2, -.2, {discontinuity: true})); crossing(t, i * 2 + .1); }
  const s = t.snapshot(); assert.equal(s.history.length, 2); assert.equal(s.counts.historyEvictions, 18);
  assert.equal(s.storage.signaturePoints, 16); s.history[0].signature[0].x = 999;
  assert.notEqual(t.snapshot().history[0].signature[0].x, 999);
  const p = point(40.2, .5); t.sample(p); p.x = 999;
  assert.notEqual(t.snapshot().active?.pathLength, 999);
});
test('reject malformed and excessive options', () => {
  for (const options of [null, [], {maxPoints: 5000}, {historySize: 129}, {signaturePoints: 129},
    {noiseDistance: NaN}, {maxSpeed: 0}, {extra: 1}, {maxDuration: Infinity}]) assert.throws(() => createExcursionTracker(options));
});
test('cumulative complete/short/censored support survives eviction and counts each closure once', () => {
  const t = createExcursionTracker({historySize: 1});
  const send = (time, x, visible = true) => t.sample(point(time, x, {visible}));
  for (let i = 0; i < 3; i++) {
    const base = i;
    send(base, -.1, false); send(base + .1, 0); send(base + .2, .2);
    send(base + .3, .4); send(base + .4, .5, false);
  }
  send(3, -.1, false); send(3.1, 0); send(3.2, .01); send(3.3, -.1, false);
  send(4, .5); send(4.1, .7); // Gap makes the entry unwitnessed; trailing is censored too.
  let s = t.snapshot();
  assert.equal(s.support.censored.appearances, 0); // Active support has no final population yet.
  s = t.finalize();
  assert.equal(s.history.length, 1); assert.equal(s.counts.historyEvictions, 3);
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
  assert.equal(s.support.completed.appearances, 4);
  near(s.support.completed.pathLength, 1.21); near(s.support.completed.durationSeconds, .7);
  assert.equal(s.support.short.appearances, 1);
  near(s.support.short.pathLength, .01); near(s.support.short.durationSeconds, .1);
  assert.equal(s.support.censored.appearances, 1);
  near(s.support.censored.pathLength, .2); near(s.support.censored.durationSeconds, .1);
  assert.equal(s.support.censored.truncatedPathAppearances, 0);
  assert.equal(s.support.overflow.appearances, 0);
  assert.equal(s.censorReasons.leftCensored, 1); assert.equal(s.censorReasons.rightCensored, 1);
  assert.deepEqual(t.finalize(), s);
  s.support.completed.pathLength = 999; assert.notEqual(t.snapshot().support.completed.pathLength, 999);
});
test('overflow support labels truncated prefixes while retaining full observed duration', () => {
  for (const options of [{maxPoints: 3}, {maxDuration: .2}, {maxPathLength: .1}]) {
    const t = createExcursionTracker(options);
    t.sample(point(0, -.1, {visible: false}));
    for (let i = 1; i <= 1000; i++) t.sample(point(i / 10, (i % 10) / 20, {visible: true}));
    const active = t.snapshot().active;
    assert.equal(active.overflow, true);
    assert.equal(t.snapshot().support.censored.appearances, 0);
    t.sample(point(100.1, .1, {visible: false}));
    const s = t.finalize();
    assert.equal(s.support.completed.appearances, 0);
    assert.deepEqual(s.support.censored, s.support.overflow);
    assert.equal(s.support.overflow.appearances, 1);
    assert.equal(s.support.overflow.truncatedPathAppearances, 1);
    assert.ok(Math.abs(s.support.overflow.durationSeconds - 99.9) < 1e-12);
    assert.equal(s.support.overflow.pathLength, active.pathLength);
    assert.ok(s.support.overflow.pathLength < 1);
    assert.ok(s.storage.highWaterPoints <= s.config.maxPoints);
    assert.equal(s.storage.signaturePoints, 0);
  }
});
test('invalid interruption support excludes invalid interval and retains only valid observed travel', () => {
  const t = createExcursionTracker();
  t.sample(point(0, -.1, {visible: false})); t.sample(point(.1, 0)); t.sample(point(.2, .2));
  t.sample(point(999, NaN));
  const s = t.finalize();
  assert.equal(s.support.censored.appearances, 1);
  assert.equal(s.support.censored.durationSeconds, .1);
  assert.equal(s.support.censored.pathLength, .2);
  assert.equal(s.support.censored.truncatedPathAppearances, 0);
  assert.equal(s.support.censored.saturated, false);
});
test('cleared discontinuity anchor cannot allow negative cumulative duration', () => {
  const t = createExcursionTracker();
  t.sample(point(10, .5, {discontinuity: true}));
  assert.equal(t.sample(point(9, .6)), false);
  const s = t.finalize();
  assert.equal(s.counts.nonMonotonicSamples, 1);
  assert.equal(s.support.censored.durationSeconds, 0);
  assert.equal(s.support.censored.pathLength, 0);
});
test('visible discontinuity retains gap/speed guards without witnessing a new entry', () => {
  for (const [next, reason] of [[point(101, .3), 'gap'], [point(1.1, 10, {visible: true}), 'teleport']]) {
    const t = createExcursionTracker();
    t.sample(point(1, .2, {discontinuity: true})); t.sample(next);
    const s = t.finalize();
    assert.equal(s.censorReasons[reason], 1);
    assert.equal(s.counts.censoredAppearances, 2);
    assert.equal(s.counts.witnessedEntries, 0);
    assert.equal(s.counts.completedAppearances, 0);
    assert.equal(s.support.censored.durationSeconds, 0);
    assert.equal(s.support.censored.pathLength, 0);
    assert.equal(s.support.censored.truncatedPathAppearances, 0);
    assert.equal(s.history.length, 0);
    assert.deepEqual(t.finalize(), s);
  }
});
test('ordinary continuous movement after visible discontinuity retains observed censored support', () => {
  const t = createExcursionTracker();
  t.sample(point(1, .2, {discontinuity: true})); t.sample(point(1.1, .3)); t.sample(point(1.2, .4));
  const s = t.finalize();
  assert.equal(s.counts.censoredAppearances, 1);
  assert.equal(s.censorReasons.leftCensored, 1); assert.equal(s.censorReasons.rightCensored, 1);
  assert.equal(s.censorReasons.gap, 0); assert.equal(s.censorReasons.teleport, 0);
  assert.equal(s.counts.witnessedEntries, 0);
  assert.ok(Math.abs(s.support.censored.durationSeconds - .2) < 1e-12);
  assert.ok(Math.abs(s.support.censored.pathLength - .2) < 1e-12);
});
