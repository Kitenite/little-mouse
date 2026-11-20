import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouteMetricsTracker} from '../scripts/behavior-route-metrics.mjs';
const point = (time, x, y, extra = {}) => ({time, x, y, phase: 'dart', eligible: true, ...extra});
function draw(t, fn, {start = 0, seconds = 2, hz = 60, phase = () => 'dart'} = {}) {
  for (let i = 0; i <= seconds * hz; i++) {
    const [x, y] = fn(i / (seconds * hz));
    t.sample(point(start + i / hz, x, y, {phase: phase(i)}));
  }
  return start + seconds;
}
function rest(t, time, x, y) {
  for (let i = 1; i <= 30; i++) t.sample(point(time + i / 60, x, y));
  return time + .5;
}
const line = u => [.2 + .4 * u, .3];
const arc = u => [.2 + .4 * u, .3 + .15 * Math.sin(Math.PI * u)];

test('no samples or stationary varying labels do not manufacture novelty', () => {
  assert.equal(createRouteMetricsTracker().finalize().corridorRepetition, null);
  const t = createRouteMetricsTracker();
  draw(t, () => [.4, .4], {phase: i => `${i}`});
  const s = t.finalize();
  assert.equal(s.eligibleRoutes, 0); assert.equal(s.eligibleDistance, 0);
});

test('arc resampling recognizes same path at different frame rates and speeds', () => {
  for (const hz of [30, 60, 120]) {
    const t = createRouteMetricsTracker();
    let end = draw(t, arc, {hz, seconds: 1});
    end = rest(t, end, .6, .3);
    t.sample(point(end + .01, .2, .3, {eligible: false}));
    draw(t, arc, {start: end + .02, hz, seconds: 5, phase: i => i % 2 ? 'creep' : 'watch'});
    const s = t.finalize({complete: true});
    assert.equal(s.eligibleRoutes, 2); assert.equal(s.comparisonRoutes, 1);
    assert.equal(s.corridorRepetition, 1); assert.equal(s.shapeRepetition, 1);
  }
});

test('phase labels do not change any geometry or exposure', () => {
  const a = createRouteMetricsTracker(), b = createRouteMetricsTracker();
  draw(a, line); draw(b, line, {phase: i => i % 2 ? 'dart' : 'creep'});
  assert.deepEqual(a.finalize({complete: true}), b.finalize({complete: true}));
});

test('same endpoints but different ordered geometry is novel; translated/reversed path separates corridor and shape', () => {
  for (const [fn, corridor, shape] of [
    [arc, 0, 0], [u => [.2 + .4 * u, .6], 0, 1], [u => line(1 - u), 1, 1],
    [u => [.2, .3 + .4 * u], 0, 0], [u => [.2 + .2 * u, .3], 0, 0],
  ]) {
    const t = createRouteMetricsTracker();
    const end = rest(t, draw(t, line), .6, .3);
    t.sample(point(end + .01, .2, .3, {eligible: false}));
    draw(t, fn, {start: end + .02});
    const s = t.finalize({complete: true});
    assert.equal(s.corridorRepetition, corridor); assert.equal(s.shapeRepetition, shape);
  }
});

test('constant-phase repeated loops close geometrically at 30/60/120 Hz', () => {
  for (const hz of [30, 60, 120]) {
    const t = createRouteMetricsTracker();
    draw(t, u => [.5 + .1 * Math.cos(u * 8 * Math.PI), .5 + .1 * Math.sin(u * 8 * Math.PI)], {seconds: 8, hz});
    const s = t.finalize();
    assert.equal(s.eligibleRoutes, 4); assert.equal(s.comparisonRoutes, 3);
    assert.equal(s.corridorRepetition, 1); assert.equal(s.closures.loop, 4);
    assert.equal(s.closures.overflow, 0);
  }
});

test('sub-threshold bounded jitter is ignored and short movements are reported', () => {
  const t = createRouteMetricsTracker();
  draw(t, u => [.4 + .0005 * Math.sin(u * 1000), .4], {seconds: 10, hz: 120});
  assert.equal(t.finalize().eligibleRoutes, 0); assert.equal(t.snapshot().eligibleDistance, 0);
  const short = createRouteMetricsTracker(); draw(short, u => [.4 + .01 * u, .4]);
  assert.equal(short.finalize({complete: true}).shortRoutes, 1);
});

test('exclusions, marked endpoints, gaps and teleports censor instead of joining paths', () => {
  for (const [extra, dt, x, reason] of [
    [{eligible: false}, .1, .5, 'ineligible'], [{discontinuity: true}, .1, .5, 'discontinuity'],
    [{}, 1, .5, 'gap'], [{}, .001, 1, 'teleport'],
  ]) {
    const t = createRouteMetricsTracker(); draw(t, line);
    t.sample(point(2 + dt, x, .3, extra));
    const s = t.finalize();
    assert.equal(s.eligibleRoutes, 0); assert.equal(s.censoredRoutes, 1);
    assert.equal(s.closures[reason], 1); assert.equal(s.censoredIntervals, 1);
  }
  const t = createRouteMetricsTracker();
  t.sample(point(0, .2, .2)); t.sample(point(.1, .3, .2, {discontinuity: true})); t.sample(point(.2, .4, .2));
  assert.equal(t.snapshot().eligibleDistance, 0); assert.equal(t.snapshot().censoredIntervals, 2);
});

test('ineligible offscreen coordinates preserve elapsed time without clamping or invalidity', () => {
  const t = createRouteMetricsTracker();
  t.sample(point(0, .2, .2)); t.sample(point(.1, -5, 4, {eligible: false})); t.sample(point(.2, .4, .2));
  const s = t.finalize();
  assert.equal(s.invalidSamples, 0); assert.equal(s.observedSeconds, .2);
  assert.equal(s.censoredSeconds, .2); assert.equal(s.eligibleDistance, 0);
});

test('invalid finite inputs/options and non-monotonic time fail closed', () => {
  for (const options of [{maxPoints: Infinity}, {historySize: 1.1}, {noiseDistance: 0}, {maxPoints: 999999}, {toString: 1}]) {
    assert.throws(() => createRouteMetricsTracker(options));
  }
  for (const extra of [{x: NaN}, {y: Infinity}, {x: -1}, {time: NaN}, {eligible: 1}, {phase: ''}, {discontinuity: 1}]) {
    const t = createRouteMetricsTracker(); draw(t, line);
    assert.equal(t.sample(point(2.1, .6, .3, extra)), false);
    const s = t.finalize(); assert.equal(s.invalidSamples, 1); assert.equal(s.censoredRoutes, 1);
    assert.equal(s.eligibleRoutes, 0);
  }
  const t = createRouteMetricsTracker(); draw(t, line); t.sample(point(2, .6, .3));
  assert.equal(t.finalize().nonMonotonicSamples, 1);
});

test('bounded storage, eviction and overflow explicitly reported; snapshot detached and finalize idempotent', () => {
  const t = createRouteMetricsTracker({historySize: 3});
  draw(t, u => [.5 + .1 * Math.cos(u * 80 * Math.PI), .5 + .1 * Math.sin(u * 80 * Math.PI)], {seconds: 80});
  const s = t.finalize();
  assert.equal(s.storage.historyRoutes, 3); assert.ok(s.historyEvictions >= 36);
  assert.ok(s.storage.highWaterPoints <= s.config.maxPoints);
  assert.deepEqual(t.finalize(), s); s.closures.loop = -10; assert.ok(t.snapshot().closures.loop > 0);
  assert.throws(() => t.sample(point(90, .4, .4)));
  const capped = createRouteMetricsTracker({maxPoints: 8}); draw(capped, line);
  const overflow = capped.finalize({complete: true});
  assert.equal(overflow.closures.overflow, 1); assert.equal(overflow.eligibleRoutes, 0);
  assert.equal(overflow.storage.highWaterPoints, 8);
});

test('unfinished final movement is censored unless caller asserts bout completion', () => {
  const t = createRouteMetricsTracker(); draw(t, line);
  const s = t.snapshot(); assert.equal(s.eligibleRoutes, 0); assert.equal(s.storage.activeBout, true);
  assert.equal(t.finalize().censoredRoutes, 1);
});

test('same vertices and endpoints in different order do not imply repetition', () => {
  const path = points => u => {
    const scaled = u * (points.length - 1), i = Math.min(points.length - 2, Math.floor(scaled));
    const f = scaled - i;
    return points[i].map((v, axis) => v + (points[i + 1][axis] - v) * f);
  };
  const a = [[.2,.2],[.2,.8],[.8,.2],[.8,.8]], b = [a[0],a[2],a[1],a[3]];
  const t = createRouteMetricsTracker();
  const end = rest(t, draw(t, path(a), {seconds: 4}), .8, .8);
  t.sample(point(end + .01, .2, .2, {eligible: false}));
  draw(t, path(b), {start: end + .02, seconds: 4});
  const s = t.finalize({complete: true});
  assert.equal(s.eligibleRoutes, 2); assert.equal(s.corridorRepetition, 0); assert.equal(s.shapeRepetition, 0);
});

test('nonuniform traversal timing and mutable inputs retain geometry and finite accounting', () => {
  const t = createRouteMetricsTracker();
  const end = rest(t, draw(t, arc), .6, .3);
  const excluded = point(end + .01, .2, .3, {eligible: false});
  t.sample(excluded); excluded.eligible = true; excluded.x = NaN;
  draw(t, u => arc(u * u), {start: end + .02, seconds: 4});
  const s = t.finalize({complete: true});
  assert.equal(s.corridorRepetition, 1);
  assert.equal(s.observedIntervals, s.eligibleIntervals + s.censoredIntervals);
  assert.ok(Math.abs(s.observedSeconds - s.eligibleSeconds - s.censoredSeconds) < 1e-10);
  for (const value of Object.values(s)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
});
