// Offline executed-path diagnostic. No runtime imports, rewards, or frame logs.
export const ROUTE_METRICS_VERSION = 1;
const DEFAULTS = Object.freeze({
  noiseDistance: .002, idleSeconds: .4, minLength: .06, minDuration: .001,
  maxGapSeconds: .25, maxSpeed: 8, resamplePoints: 32, maxPoints: 2048,
  historySize: 32, rmsTolerance: .025, maxTolerance: .06,
  loopClosureDistance: .015, loopMinLength: .12, loopMinExcursion: .06,
});
const REASONS = ['loop', 'idle', 'finalize', 'ineligible', 'discontinuity',
  'gap', 'teleport', 'invalid', 'nonMonotonic', 'overflow'];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const add = (object, key, value = 1) => {
  const next = object[key] + value;
  object[key] = Math.min(Number.MAX_SAFE_INTEGER, next);
};

function configuration(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Invalid options');
  for (const key of Object.keys(options)) if (!Object.hasOwn(DEFAULTS, key)) throw new TypeError(`Unknown option: ${key}`);
  const c = {...DEFAULTS, ...options};
  for (const [key, value] of Object.entries(c)) {
    if (!Number.isFinite(value) || value <= 0 || value > 1e6) throw new RangeError(`Invalid ${key}`);
  }
  for (const [key, min, max] of [['resamplePoints', 8, 128], ['maxPoints', 8, 4096], ['historySize', 1, 128]]) {
    if (!Number.isInteger(c[key]) || c[key] < min || c[key] > max) throw new RangeError(`Invalid ${key}`);
  }
  if (c.minLength < c.noiseDistance || c.maxTolerance < c.rmsTolerance) throw new RangeError('Inconsistent thresholds');
  return c;
}

// Uniform arc samples remove traversal timing and frame-density from comparison.
function signature(points, length, count) {
  const out = [];
  let segment = 1, before = 0;
  for (let i = 0; i < count; i++) {
    const target = length * i / (count - 1);
    while (segment < points.length - 1 && before + distance(points[segment - 1], points[segment]) < target) {
      before += distance(points[segment - 1], points[segment++]);
    }
    const a = points[segment - 1], b = points[segment];
    const fraction = Math.max(0, Math.min(1, (target - before) / distance(a, b)));
    out.push({x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction});
  }
  const mean = out.reduce((a, p) => ({x: a.x + p.x / count, y: a.y + p.y / count}), {x: 0, y: 0});
  return {corridor: out, shape: out.map(p => ({x: p.x - mean.x, y: p.y - mean.y}))};
}

function matches(a, b, c) {
  for (const reverse of [false, true]) {
    let sum = 0, max = 0;
    for (let i = 0; i < a.length; i++) {
      const d = distance(a[i], b[reverse ? b.length - 1 - i : i]);
      sum += d * d;
      max = Math.max(max, d);
    }
    if (Math.sqrt(sum / a.length) <= c.rmsTolerance && max <= c.maxTolerance) return true;
  }
  return false;
}

export function createRouteMetricsTracker(options = {}) {
  const config = configuration(options);
  const counts = Object.fromEntries(['samples', 'validSamples', 'invalidSamples', 'nonMonotonicSamples',
    'eligibleSamples', 'observedIntervals', 'eligibleIntervals', 'censoredIntervals',
    'observedSeconds', 'eligibleSeconds', 'censoredSeconds', 'eligibleDistance',
    'eligibleRoutes', 'comparisonRoutes', 'repeatedCorridorRoutes', 'repeatedShapeRoutes',
    'shortRoutes', 'censoredRoutes', 'completedRoutes', 'historyEvictions'].map(k => [k, 0]));
  const closures = Object.fromEntries(REASONS.map(k => [k, 0]));
  const intervalReasons = Object.fromEntries(REASONS.map(k => [k, 0]));
  let previous = null, anchor = null, bout = null, history = [], finalized = false;
  let highWaterPoints = 0;

  function close(reason, censored = false) {
    if (!bout) return;
    const why = bout.overflow ? 'overflow' : reason;
    add(closures, why);
    if (censored || bout.overflow) add(counts, 'censoredRoutes');
    else {
      add(counts, 'completedRoutes');
      if (bout.length < config.minLength || bout.lastTime - bout.startTime < config.minDuration) add(counts, 'shortRoutes');
      else {
        add(counts, 'eligibleRoutes');
        const sig = signature(bout.points, bout.length, config.resamplePoints);
        if (history.length) {
          add(counts, 'comparisonRoutes');
          if (history.some(old => matches(sig.corridor, old.corridor, config))) add(counts, 'repeatedCorridorRoutes');
          if (history.some(old => matches(sig.shape, old.shape, config))) add(counts, 'repeatedShapeRoutes');
        }
        history.push(sig);
        if (history.length > config.historySize) { history.shift(); add(counts, 'historyEvictions'); }
      }
    }
    bout = null;
  }

  function snapshot() {
    return {
      version: ROUTE_METRICS_VERSION, diagnosticOnly: true, finalized, config: {...config},
      ...counts, closures: {...closures}, intervalReasons: {...intervalReasons},
      corridorRepetition: counts.comparisonRoutes ? counts.repeatedCorridorRoutes / counts.comparisonRoutes : null,
      shapeRepetition: counts.comparisonRoutes ? counts.repeatedShapeRoutes / counts.comparisonRoutes : null,
      storage: {activePoints: bout?.points.length ?? 0, highWaterPoints, historyRoutes: history.length,
        historyPoints: history.length * config.resamplePoints * 2, activeBout: Boolean(bout),
        overflowedBout: bout?.overflow ?? false},
    };
  }

  function sample(input) {
    if (finalized) throw new Error('Tracker is finalized');
    add(counts, 'samples');
    const p = input;
    if (!p || !Number.isFinite(p.time) || p.time < 0 || p.time > 1e12 ||
        !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
        (p.eligible === true && (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) ||
        typeof p.phase !== 'string' || !p.phase.trim() || p.phase.length > 96 ||
        typeof p.eligible !== 'boolean' || (p.discontinuity !== undefined && typeof p.discontinuity !== 'boolean')) {
      add(counts, 'invalidSamples'); close('invalid', true); previous = anchor = null; return false;
    }
    add(counts, 'validSamples');
    const current = {time: p.time, x: p.x, y: p.y, phase: p.phase,
      eligible: p.eligible, discontinuity: p.discontinuity === true};
    if (current.eligible && !current.discontinuity) add(counts, 'eligibleSamples');
    if (previous && current.time <= previous.time) {
      add(counts, 'nonMonotonicSamples'); close('nonMonotonic', true); previous = anchor = null; return false;
    }
    if (!previous) {
      previous = current;
      anchor = current.eligible && !current.discontinuity ? current : null;
      return true;
    }
    const dt = current.time - previous.time;
    add(counts, 'observedIntervals'); add(counts, 'observedSeconds', dt);
    let reason = null;
    if (current.discontinuity || previous.discontinuity) reason = 'discontinuity';
    else if (!current.eligible || !previous.eligible) reason = 'ineligible';
    else if (dt > config.maxGapSeconds) reason = 'gap';
    else if (distance(current, previous) / dt > config.maxSpeed) reason = 'teleport';
    if (reason) {
      add(counts, 'censoredIntervals'); add(counts, 'censoredSeconds', dt); add(intervalReasons, reason);
      close(reason, true);
      // A marked endpoint is never a bridge. A gap/teleport may seed the next interval.
      anchor = current.eligible && !current.discontinuity ? current : null;
    } else {
      add(counts, 'eligibleIntervals'); add(counts, 'eligibleSeconds', dt);
      if (!anchor) anchor = previous;
      const travel = distance(current, anchor);
      if (travel >= config.noiseDistance) {
        if (!bout) bout = {points: [{x: anchor.x, y: anchor.y}], length: 0,
          startTime: anchor.time, lastTime: current.time, overflow: false, excursion: 0};
        bout.lastTime = current.time;
        add(counts, 'eligibleDistance', travel);
        bout.length += travel;
        if (!bout.overflow) {
          if (bout.points.length === config.maxPoints) bout.overflow = true;
          else bout.points.push({x: current.x, y: current.y});
        }
        highWaterPoints = Math.max(highWaterPoints, bout.points.length);
        bout.excursion = Math.max(bout.excursion, distance(current, bout.points[0]));
        // Geometric return, not authored phase/goal: adjacent loops share only an endpoint.
        if (bout.length >= config.loopMinLength && bout.excursion >= config.loopMinExcursion &&
            distance(current, bout.points[0]) <= config.loopClosureDistance) close('loop');
        anchor = current;
      } else if (current.time - anchor.time >= config.idleSeconds) {
        close('idle'); anchor = current;
      }
    }
    previous = current;
    return true;
  }

  function finalize({complete = false} = {}) {
    if (typeof complete !== 'boolean') throw new TypeError('complete must be boolean');
    if (!finalized) { close('finalize', !complete); previous = anchor = null; finalized = true; }
    return snapshot();
  }
  return Object.freeze({sample, snapshot, finalize});
}
