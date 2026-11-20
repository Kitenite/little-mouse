// Local descriptive metrics and a conservative contact-presence heuristic, not enjoyment.
import { HUNT_CHAPTERS } from './hunt-chapters.js';
export const metricVersion = 'local-path-v1';
export const heuristicVersion = 'session-contact-presence-v1';
export const PLAY_LEARNING_KEY = 'podrick-play-learning-v1';
export const PLAY_LEARNING_LIMITS = Object.freeze({ sessions: 32, mice: 8, routes: 64, contacts: 512, bytes: 500000, exposure: 30, sessionsRequired: 3, prior: 6, bias: .15 });
const ids = HUNT_CHAPTERS.map(c => c.id);
const actors = ['cat', 'human', 'test', 'unknown'];
const kinds = ['tap', 'hold', 'drag', 'cancel'];
const cap = 1e6;
const validId = x => typeof x === 'string' && x.length > 0 && x.length <= 96;
const number = x => Number.isFinite(x) && x >= 0 && x <= cap;
const fresh = () => ({ elapsedSeconds: 0, visibleSeconds: 0, pathDistance: 0, headingRotations: 0, routeEntries: 0, routeRepetitions: 0, catTap: false,
  contacts: Object.fromEntries(actors.map(a => [a, Object.fromEntries(kinds.map(k => [k, 0]))])) });
const chapters = () => Object.fromEntries(ids.map(id => [id, fresh()]));
const clone = x => JSON.parse(JSON.stringify(x));
function validMetric(m) {
  return m && ['elapsedSeconds', 'visibleSeconds', 'pathDistance', 'headingRotations', 'routeEntries', 'routeRepetitions'].every(k => number(m[k])) &&
    Number.isInteger(m.routeEntries) && Number.isInteger(m.routeRepetitions) && m.routeRepetitions <= m.routeEntries && typeof m.catTap === 'boolean' && m.visibleSeconds <= m.elapsedSeconds &&
    actors.every(a => kinds.every(k => Number.isInteger(m.contacts?.[a]?.[k]) && m.contacts[a][k] >= 0 && m.contacts[a][k] <= PLAY_LEARNING_LIMITS.contacts)) &&
    (!m.catTap || m.contacts.cat.tap > 0);
}
function validDecision(d) {
  return d && ids.includes(d.chapterId) && number(d.time) && Number.isFinite(d.baseDuration) && d.baseDuration >= 30 && d.baseDuration <= 65 &&
    Number.isFinite(d.multiplier) && d.multiplier >= .85 && d.multiplier <= 1.15 && Number.isFinite(d.duration) && d.duration >= 25.5 && d.duration <= 74.75;
}
function validRecord(r) {
  return r && validId(r.id) && actors.includes(r.actor) && ['complete', 'excluded'].every(k => typeof r[k] === 'boolean') &&
    Array.isArray(r.decisions) && r.decisions.length <= 128 && r.decisions.every(validDecision) &&
    r.chapters && Object.keys(r.chapters).length === ids.length && ids.every(id => validMetric(r.chapters[id]));
}
export function createPlayLearning(storage) {
  let records = [], frozen = false, actor = 'unknown', active = null, storageError = null, droppedSessions = 0, droppedDecisions = 0;
  const hasStorage = !!storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
  try {
    const raw = storage?.getItem(PLAY_LEARNING_KEY);
    if (raw != null) {
      if (typeof raw !== 'string' || raw.length > PLAY_LEARNING_LIMITS.bytes) throw Error('oversize restore');
      const data = JSON.parse(raw);
      if (data.trainingReady !== false || !Number.isSafeInteger(data.droppedSessions) || data.droppedSessions < 0 || !Number.isSafeInteger(data.droppedDecisions) || data.droppedDecisions < 0 || data.version !== 1 || data.metricVersion !== metricVersion || data.heuristicVersion !== heuristicVersion || !actors.includes(data.actor) || typeof data.frozen !== 'boolean' || !Array.isArray(data.sessions) ||
          data.sessions.length > PLAY_LEARNING_LIMITS.sessions || !data.sessions.every(validRecord) ||
          new Set(data.sessions.map(r => r.id)).size !== data.sessions.length) throw Error('invalid restore');
      // Project validated fields only; never retain unbounded extra properties from storage.
      records = data.sessions.map(r => ({ id:r.id, actor:r.actor, complete:r.complete, excluded:r.excluded, decisions:r.decisions.map(d => Object.fromEntries(['chapterId','time','baseDuration','multiplier','duration'].map(k => [k,d[k]]))),
        chapters:Object.fromEntries(ids.map(id => { const m = r.chapters[id]; return [id, {
          ...Object.fromEntries(['elapsedSeconds','visibleSeconds','pathDistance','headingRotations','routeEntries','routeRepetitions','catTap'].map(k => [k,m[k]])),
          contacts:Object.fromEntries(actors.map(a => [a,Object.fromEntries(kinds.map(k => [k,m.contacts[a][k]]))]))
        }]; })) }));
      frozen = data.frozen; actor = data.actor; droppedSessions = data.droppedSessions; droppedDecisions = data.droppedDecisions;
    }
  } catch { storageError = 'restore rejected'; }
  const data = () => ({ version: 1, trainingReady:false, metricVersion, heuristicVersion, actor, frozen, droppedSessions, droppedDecisions, sessions: records });
  const persist = () => {
    while (JSON.stringify(data()).length > PLAY_LEARNING_LIMITS.bytes && records.length) { records.shift(); droppedSessions = Math.min(Number.MAX_SAFE_INTEGER, droppedSessions + 1); }
    if (!hasStorage) return;
    try { storage.setItem(PLAY_LEARNING_KEY, JSON.stringify(data())); storageError = null; }
    catch { storageError = 'storage unavailable'; }
  };
  function start({ id, actor: sessionActor = actor, experiment = false, manual = false } = {}) {
    if (active || !validId(id) || records.some(r => r.id === id) || !actors.includes(sessionActor)) return false;
    active = { id, actor:sessionActor, decisions:[], complete: false, excluded: frozen || experiment !== false || manual !== false,
      chapters: chapters(), mice: new Map(), routes: new Map(), contacts: new Set() };
    return true;
  }
  function sample(s = {}) {
    if (!active || !ids.includes(s.chapterId) || !validId(s.mouseId) || !Number.isFinite(s.time) || s.time < 0 ||
        ![s.x,s.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1) || (!Number.isFinite(s.heading) || Math.abs(s.heading) > cap) || typeof s.visible !== 'boolean') return false;
    if (!active.mice.has(s.mouseId) && active.mice.size >= PLAY_LEARNING_LIMITS.mice) return false;
    const prev = active.mice.get(s.mouseId);
    if (prev && s.time <= prev.time) return false;
    const next = { time:s.time, x:s.x, y:s.y, heading:s.heading, visible:s.visible, discontinuity:!!s.discontinuity, chapterId:s.chapterId,
      routeId:validId(s.routeId) ? s.routeId : null, routeInstanceId:validId(s.routeInstanceId) ? s.routeInstanceId : null };
    active.mice.set(s.mouseId, next);
    const m = active.chapters[s.chapterId], dt = prev ? s.time - prev.time : 0;
    if (prev && dt <= 1 && prev.chapterId === s.chapterId) m.elapsedSeconds = Math.min(cap, m.elapsedSeconds + dt);
    if (prev && dt <= 1 && prev.chapterId === s.chapterId && prev.visible && s.visible && !s.discontinuity && !prev.discontinuity) {
      m.visibleSeconds = Math.min(cap, m.visibleSeconds + dt);
    }
    if (prev && dt <= 1 && prev.chapterId === s.chapterId && prev.visible && s.visible && !s.discontinuity && !prev.discontinuity) {
      m.pathDistance = Math.min(cap, m.pathDistance + Math.hypot(s.x-prev.x, s.y-prev.y));
      const delta = s.heading - prev.heading;
      m.headingRotations = Math.min(cap, m.headingRotations + Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta))) / (2*Math.PI));
    }
    if (s.visible && next.routeId && (!prev || prev.chapterId !== s.chapterId || (next.routeInstanceId ? prev.routeInstanceId !== next.routeInstanceId : !prev.visible || prev.routeId !== next.routeId))) {
      const key = `${s.chapterId}:${next.routeId}`;
      // Once full, don't invent novelty or repetition for untracked signatures.
      if (active.routes.has(key) || active.routes.size < PLAY_LEARNING_LIMITS.routes) {
        m.routeEntries = Math.min(cap, m.routeEntries + 1);
        if (active.routes.has(key)) m.routeRepetitions = Math.min(cap, m.routeRepetitions + 1);
        active.routes.set(key, true);
      }
    }
    return true;
  }
  function contact({ id, chapterId, actor = 'unknown', kind } = {}) {
    if (!active || !validId(id) || !ids.includes(chapterId) || !actors.includes(actor) || !kinds.includes(kind) ||
        active.contacts.has(id) || active.contacts.size >= PLAY_LEARNING_LIMITS.contacts) return false;
    active.contacts.add(id);
    const m = active.chapters[chapterId];
    m.contacts[actor][kind]++;
    if (actor === 'cat' && active.actor === 'cat' && kind === 'tap') m.catTap = true;
    return true;
  }
  function end({ complete = false } = {}) {
    if (!active) return false;
    records.push({ id:active.id, actor:active.actor, complete:complete === true, excluded:active.excluded, decisions:active.decisions, chapters:active.chapters });
    droppedSessions = Math.min(Number.MAX_SAFE_INTEGER, droppedSessions + Math.max(0, records.length - PLAY_LEARNING_LIMITS.sessions));
    records = records.slice(-PLAY_LEARNING_LIMITS.sessions);
    active = null;
    persist();
    return true;
  }
  function configure(options = {}) {
    if (actors.includes(options.actor)) {
      actor = options.actor;
      if (active && active.actor !== actor) active.excluded = true;
      persist();
    }
    if (typeof options.frozen === 'boolean') {
      frozen = options.frozen;
      if (active && frozen) active.excluded = true;
      persist();
    }
    if (active && (options.experiment === true || options.manual === true)) active.excluded = true;
    return status();
  }
  function decision(d = {}) {
    if (!active || !validDecision(d)) return false;
    if (active.decisions.length >= 128) { droppedDecisions = Math.min(Number.MAX_SAFE_INTEGER, droppedDecisions + 1); return false; }
    active.decisions.push(Object.fromEntries(['chapterId','time','baseDuration','multiplier','duration'].map(k => [k,d[k]])));
    return true;
  }
  function normalized(m) {
    return { ...clone(m), visibleFraction:m.elapsedSeconds ? m.visibleSeconds/m.elapsedSeconds : null,
      distancePerVisibleSecond:m.visibleSeconds ? m.pathDistance/m.visibleSeconds : null,
      rotationsPerVisibleSecond:m.visibleSeconds ? m.headingRotations/m.visibleSeconds : null,
      routeRepetitionFraction:m.routeEntries ? m.routeRepetitions/m.routeEntries : null };
  }
  function status() {
    const support = {}, multipliers = {};
    for (const id of ids) {
      const eligible = records.filter(r => r.complete && !r.excluded && r.actor === 'cat' && r.chapters[id].visibleSeconds >= PLAY_LEARNING_LIMITS.exposure);
      const n = eligible.length, positive = eligible.filter(r => r.chapters[id].catTap).length;
      support[id] = { sessions:n, contactSessions:positive };
      // Symmetric prior of six sessions at 50% contact presence. No injury/motion reward.
      multipliers[id] = frozen || n < PLAY_LEARNING_LIMITS.sessionsRequired ? 1 :
        1 + PLAY_LEARNING_LIMITS.bias * (2*positive-n)/(n+PLAY_LEARNING_LIMITS.prior);
    }
    const totals = chapters();
    for (const r of [...records, ...(active ? [active] : [])]) for (const id of ids) {
      const m = totals[id], v = r.chapters[id];
      for (const k of ['elapsedSeconds','visibleSeconds','pathDistance','headingRotations','routeEntries','routeRepetitions']) m[k] += v[k];
      m.catTap ||= v.catTap;
      for (const a of actors) for (const k of kinds) m.contacts[a][k] += v.contacts[a][k];
    }
    return { version:1, trainingReady:false, metricVersion, heuristicVersion, actor, frozen, storageError, storageMode:!hasStorage ? 'memory-only' : storageError ? 'error' : 'local', droppedSessions, droppedDecisions, metrics:Object.fromEntries(ids.map(id => [id,normalized(totals[id])])), retainedSessions:records.length, support, multipliers,
      active:active ? { id:active.id, actor:active.actor, excluded:active.excluded, chapters:Object.fromEntries(ids.map(id => [id,normalized(active.chapters[id])])), decisions:clone(active.decisions) } : null };
  }
  function reset() { records = []; active = null; frozen = false; actor = 'unknown'; droppedSessions = 0; droppedDecisions = 0; persist(); return status(); }
  return { start, end, sample, contact, decision, configure, status, export:() => JSON.stringify(data()), reset };
}
