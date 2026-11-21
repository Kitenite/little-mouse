// Offline actual entry-to-exit geometry. No production imports or reward changes.
export const EXCURSION_VERSION = 1;
const DEFAULTS = Object.freeze({noiseDistance: .002, maxGap: .25, maxSpeed: 8,
  minPathLength: .06, maxPathLength: 128, maxDuration: 3600, maxPoints: 2048,
  historySize: 32, signaturePoints: 32, corridorRms: .025, corridorMax: .06});
const REASONS = ['leftCensored', 'rightCensored', 'ineligible', 'discontinuity',
  'invalid', 'nonMonotonic', 'gap', 'teleport', 'overflow'];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const add = (o, k, n = 1) => { o[k] = Math.min(Number.MAX_SAFE_INTEGER, o[k] + n); };
function optionsFor(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Invalid options');
  for (const k of Object.keys(options)) if (!(k in DEFAULTS) || !Object.hasOwn(DEFAULTS, k)) throw new TypeError(`Unknown option ${k}`);
  const c = {...DEFAULTS, ...options};
  for (const [k, v] of Object.entries(c)) if (!Number.isFinite(v) || v <= 0 || v > 1e6) throw new RangeError(`Invalid ${k}`);
  for (const [k, min, max] of [['maxPoints', 2, 4096], ['historySize', 1, 128], ['signaturePoints', 2, 128]]) {
    if (!Number.isInteger(c[k]) || c[k] < min || c[k] > max) throw new RangeError(`Invalid ${k}`);
  }
  if (c.maxPathLength < c.minPathLength || c.corridorMax < c.corridorRms) throw new RangeError('Inconsistent thresholds');
  return c;
}
function edge(p) {
  const edges = [];
  if (p.x < 0) edges.push('left');
  if (p.x > 1) edges.push('right');
  if (p.y < 0) edges.push('top');
  if (p.y > 1) edges.push('bottom');
  return edges.length > 1 ? 'corner' : edges[0] ?? 'unknown';
}
function resample(points, length, count) {
  if (!length) return Array.from({length: count}, () => ({...points[0]}));
  let j = 1, before = 0;
  return Array.from({length: count}, (_, i) => {
    const target = length * (i / (count - 1));
    while (j < points.length - 1 && before + distance(points[j - 1], points[j]) < target) {
      before += distance(points[j - 1], points[j++]);
    }
    const a = points[j - 1], b = points[j];
    const t = Math.max(0, Math.min(1, (target - before) / distance(a, b)));
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
  });
}
function matches(a, b, c) {
  return [false, true].some(reverse => {
    let sum = 0, max = 0;
    for (let i = 0; i < a.length; i++) {
      const d = distance(a[i], b[reverse ? b.length - i - 1 : i]);
      sum += d * d; max = Math.max(max, d);
    }
    return Math.sqrt(sum / a.length) <= c.corridorRms && max <= c.corridorMax;
  });
}
export function createExcursionTracker(options = {}) {
  const config = optionsFor(options);
  const counts = Object.fromEntries(['samples', 'validSamples', 'invalidSamples', 'nonMonotonicSamples',
    'appearances', 'witnessedEntries', 'naturalExits', 'completedAppearances', 'censoredAppearances',
    'shortAppearances', 'comparisonAppearances', 'repeatedCorridors', 'historyEvictions'].map(k => [k, 0]));
  const censorReasons = Object.fromEntries(REASONS.map(k => [k, 0]));
  // Fixed-size cumulative support survives signature eviction; subsets are not additive.
  const support = Object.fromEntries(['completed', 'censored', 'short', 'overflow'].map(k =>
    [k, {appearances: 0, durationSeconds: 0, pathLength: 0, truncatedPathAppearances: 0, saturated: false}]));
  function recordSupport(population) {
    const bucket = support[population];
    const values = {appearances: 1, durationSeconds: active.last.time - active.startTime,
      pathLength: active.pathLength, truncatedPathAppearances: Number(active.overflow)};
    for (const [key, value] of Object.entries(values)) {
      if (bucket[key] + value > Number.MAX_SAFE_INTEGER) bucket.saturated = true;
      add(bucket, key, value);
    }
  }
  let previous = null, active = null, history = [], finalized = false, highWaterPoints = 0;
  function append(p, force = false) {
    if (active.overflow) return;
    const d = distance(active.points.at(-1), p);
    if (!(d > 0) || (!force && d < config.noiseDistance)) return;
    if (active.points.length >= config.maxPoints || active.pathLength + d > config.maxPathLength) {
      active.overflow = true; return;
    }
    active.pathLength += d;
    active.points.push({x: p.x, y: p.y});
    highWaterPoints = Math.max(highWaterPoints, active.points.length);
  }
  function close(reason, exitEdge = 'unknown') {
    if (!active) return;
    // Preserve the actual last-visible endpoint, including the terminal noise residual.
    append(active.last, true);
    const reasons = [];
    if (!active.witnessedEntry) reasons.push('leftCensored');
    if (reason) reasons.push(reason);
    if (active.overflow) reasons.push('overflow');
    if (reasons.length) {
      add(counts, 'censoredAppearances');
      recordSupport('censored');
      if (active.overflow) recordSupport('overflow');
      for (const why of new Set(reasons)) add(censorReasons, why);
    } else {
      add(counts, 'completedAppearances');
      recordSupport('completed');
      const signature = resample(active.points, active.pathLength, config.signaturePoints);
      const short = active.pathLength < config.minPathLength || active.last.time === active.startTime;
      const support = short ? 0 : history.filter(h => !h.short).length;
      const repeatedCorridor = support > 0 && history.some(h => !h.short && matches(signature, h.signature, config));
      if (short) { add(counts, 'shortAppearances'); recordSupport('short'); }
      if (support) add(counts, 'comparisonAppearances');
      if (repeatedCorridor) add(counts, 'repeatedCorridors');
      history.push({startTime: active.startTime, endTime: active.last.time,
        duration: active.last.time - active.startTime, pathLength: active.pathLength,
        entryEdge: active.entryEdge, exitEdge, edgePair: `${active.entryEdge}->${exitEdge}`,
        signature, short, comparisonSupport: support, repeatedCorridor});
      if (history.length > config.historySize) { history.shift(); add(counts, 'historyEvictions'); }
    }
    active = null;
  }
  function sample(input) {
    if (finalized) throw new Error('Tracker finalized');
    add(counts, 'samples');
    if (!input || !Number.isFinite(input.time) || input.time < 0 || input.time > 1e12 ||
      !Number.isFinite(input.x) || !Number.isFinite(input.y) ||
      typeof input.eligible !== 'boolean' || typeof input.visible !== 'boolean' ||
      (input.discontinuity !== undefined && typeof input.discontinuity !== 'boolean')) {
      add(counts, 'invalidSamples'); close('invalid'); previous = null; return false;
    }
    const p = {time: input.time, x: input.x, y: input.y, eligible: input.eligible, visible: input.visible};
    const timeAnchor = previous ?? active?.last;
    if (timeAnchor && p.time <= timeAnchor.time) {
      add(counts, 'nonMonotonicSamples'); close('nonMonotonic'); previous = null; return false;
    }
    add(counts, 'validSamples');
    let reason = input.discontinuity ? 'discontinuity' : !p.eligible ? 'ineligible' : null;
    // A visible discontinuity clears entry evidence, not the active continuity guard.
    if (!reason && timeAnchor) {
      const dt = p.time - timeAnchor.time;
      reason = !timeAnchor.eligible ? 'ineligible' : dt > config.maxGap ? 'gap' :
        distance(timeAnchor, p) / dt > config.maxSpeed ? 'teleport' : null;
    }
    if (reason) close(reason);
    if (p.eligible && p.visible) {
      if (!active) {
        const witnessedEntry = !!previous && !reason && !previous.visible;
        active = {witnessedEntry, entryEdge: witnessedEntry ? edge(previous) : 'unknown',
          startTime: p.time, last: p, pathLength: 0, points: [{x: p.x, y: p.y}], overflow: false};
        highWaterPoints = Math.max(highWaterPoints, 1);
        add(counts, 'appearances');
        if (witnessedEntry) add(counts, 'witnessedEntries');
      } else {
        if (p.time - active.startTime > config.maxDuration) active.overflow = true;
        append(p); active.last = p;
      }
    } else if (active && !reason) {
      add(counts, 'naturalExits'); close(null, edge(p));
    }
    // A discontinuity sample is not a trustworthy outside entry anchor.
    previous = input.discontinuity ? null : p;
    return true;
  }
  function snapshot() {
    return structuredClone({version: EXCURSION_VERSION, config, counts, censorReasons, support,
      corridorRecurrence: counts.comparisonAppearances ? counts.repeatedCorridors / counts.comparisonAppearances : null,
      history, active: active ? {witnessedEntry: active.witnessedEntry, startTime: active.startTime,
        lastTime: active.last.time, pathLength: active.pathLength, overflow: active.overflow} : null,
      finalized, storage: {activePoints: active?.points.length ?? 0, highWaterPoints,
        historyAppearances: history.length, signaturePoints: history.reduce((n, h) => n + h.signature.length, 0)}});
  }
  function finalize() {
    if (!finalized) { close('rightCensored'); finalized = true; previous = null; }
    return snapshot();
  }
  return {sample, snapshot, finalize};
}
