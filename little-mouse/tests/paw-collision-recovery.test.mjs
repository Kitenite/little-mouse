import test from 'node:test';
import assert from 'node:assert/strict';
import {updateHunt, createHuntDirector} from '../public/enrichment.js';
import {updateHuntGroup} from '../public/hunt-group.js';
import {radius, stepMice} from '../public/physics.js';
import {createMouseIdentity, identityRandom} from '../public/mouse-identity.js';
import {settingsDefaults as config} from '../public/settings.js';
import {avoidPaws, beginContact, createContacts} from '../public/contact.js';

const width = 1024, height = 768;
const clearance = config.pawAvoidanceRadius + radius(config.size, width, height);
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const inside = m => m.x >= 0 && m.x <= width && m.y >= 0 && m.y <= height;

// Natural production replay of the reported seed59/30Hz collision-paw oscillation.
// Observe all retreats: the repair changes the path before the old 56.8s timestamp.
function replay() {
  const seed = 59, hz = 30, rng = identityRandom(seed), director = createHuntDirector(seed);
  const paw = {x: width / 2, y: height / 2, radius: config.pawAvoidanceRadius};
  director.paws = new Map([[0, paw]]);
  const mice = Array.from({length: 2}, (_, castIndex) => {
    const r = radius(config.size, width, height);
    return {castIndex, state: 'away', x: r + rng() * (width - 2 * r), y: r + rng() * (height - 2 * r),
      angle: rng() * Math.PI * 2, targetX: width / 2, targetY: height / 2, next: .6,
      hiddenUntil: 0, restUntil: 0, moving: false, vx: 0, vy: 0, speed: 0, seed: rng() * 100,
      identity: createMouseIdentity((seed + castIndex * 2654435761) >>> 0)};
  });
  // Observe entries through 80s, then allow the full 8s exit budget for trailing entries.
  const episodes = [], active = [null, null];
  let collisions = 0;
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('Replay must use seeded production randomness'); };
  try {
    for (let frame = 1; frame <= 88 * hz; frame++) {
      const time = frame * (1 / hz);
      updateHuntGroup(director, mice, time, width, height, config);
      for (const m of mice) updateHunt(m, config, time, width, height, false, rng, director);
      const impulses = stepMice(mice, config, time, 1 / hz, width, height, [paw]);
      collisions += impulses;
      mice.forEach((m, i) => {
        assert.ok(Number.isFinite(m.x + m.y + m.angle), 'finite integrated pose');
        const visibleRetreat = m.hunt?.phase === 'retreat' && m.state === 'active' && m.hiddenUntil <= time && inside(m);
        let e = active[i];
        if (!e && visibleRetreat && time <= 80) {
          e = active[i] = {mouse: i, start: time, startX: m.x, startY: m.y, lastX: m.x, lastY: m.y,
            lastAngle: m.angle, turns: 0, netTurns: 0, path: 0, collisions: 0};
        } else if (e) {
          const turn = wrap(m.angle - e.lastAngle) / (2 * Math.PI);
          e.turns += Math.abs(turn); e.netTurns += turn;
          e.path += Math.hypot(m.x - e.lastX, m.y - e.lastY);
          e.collisions += impulses;
          e.lastX = m.x; e.lastY = m.y; e.lastAngle = m.angle;
          if (!visibleRetreat) {
            episodes.push({...e, duration: time - e.start, displacement: Math.hypot(m.x - e.startX, m.y - e.startY),
              physicalExit: !inside(m) && m.state === 'active' && m.hiddenUntil <= time});
            active[i] = null;
          }
        }
      });
    }
  } finally { Math.random = originalRandom; }
  return {episodes, unfinished: active.filter(Boolean), collisions};
}
let cached;
const evidence = () => cached ??= replay();
test('seeded collision-paw retreats physically exit with bounded elapsed time and actual progress', t => {
  const r = evidence();
  assert.ok(r.collisions > 0, 'the replay must exercise companion collisions');
  assert.ok(r.episodes.length >= 5, 'several natural retreats must be observed');
  assert.equal(r.unfinished.length, 0, 'no unobserved trailing retreat accepted as recovery');
  assert.ok(r.episodes.some(e => e.collisions > 0), 'at least one retreat must include collision impulses');
  t.diagnostic(JSON.stringify({episodes: r.episodes.length, maxSeconds: Math.max(...r.episodes.map(e => e.duration)),
    maxTurns: Math.max(...r.episodes.map(e => e.turns)), collisions: r.collisions}));
  for (const e of r.episodes) {
    assert.ok(e.physicalExit, `mouse ${e.mouse} at ${e.start}: hiding/phase change is not exit progress`);
    assert.ok(e.displacement >= Math.min(e.startX, width - e.startX, e.startY, height - e.startY), 'integrated center must reach a viewport edge');
    // An engineering recovery bound, not a tuned setting or feline-response threshold.
    assert.ok(e.duration < 8, `mouse ${e.mouse} at ${e.start}: ${e.duration}s to exit (limit 8s)`);
  }
});
test('seeded collision-paw retreats do not accumulate repeated corrective rotations', () => {
  for (const e of evidence().episodes) {
    assert.ok(e.turns < 3, `mouse ${e.mouse} at ${e.start}: ${e.turns} absolute rotations; net ${e.netTurns} (limit 3)`);
  }
});

const mouse = () => ({x: 0, y: 0, angle: 0, seed: 0, state: 'active', hiddenUntil: 0,
  restUntil: 0, vx: 0, vy: 0, targetX: 1000, targetY: 0});
const steer = (m, paws) => avoidPaws(m, m.targetX - m.x, m.targetY - m.y, paws, clearance, config.pawAvoidanceRadius);
function committed() {
  const m = mouse(), paw = {pointerId: 1, x: clearance + 100, y: 0, radius: config.pawAvoidanceRadius};
  assert.ok(steer(m, [paw])[1] > 0, 'establish a flank before approaching the safety band');
  return {m, paw};
}
test('same-paw steering is continuous at the outer safety band and outward in overlap', () => {
  const {m, paw} = committed(), epsilon = 1e-4;
  m.x = paw.x - clearance - 25 - epsilon;
  const outside = steer(m, [paw]);
  m.x += 2 * epsilon;
  const band = steer(m, [paw]);
  assert.ok(Math.abs(wrap(Math.atan2(band[1], band[0]) - Math.atan2(outside[1], outside[0]))) < .01,
    'tiny band crossing must not reverse heading demand');
  for (const depth of [.001, 1, 10]) {
    m.x = paw.x - clearance + depth;
    const v = steer(m, [paw]);
    assert.ok(v[0] < 0, 'actual overlap must demand outward motion');
    assert.ok(v[1] > 0, 'the committed flank must still make tangential progress');
  }
});
test('different live paw overrides same-paw commitment and held bodies retain their anchor', () => {
  const {m, paw} = committed();
  const other = {pointerId: 2, x: m.x, y: m.y + 10, radius: config.pawAvoidanceRadius};
  const v = steer(m, [paw, other]);
  assert.ok(Math.abs(v[0]) < 1e-9 && v[1] < 0, 'escape the different live paw immediately');
  const contacts = createContacts();
  assert.ok(beginContact(contacts, m, {part: 'body', localX: 0, localY: 0}, 3, m.x, m.y, 0, config, config.size));
  assert.deepEqual(steer(m, [paw, other]), [m.targetX - m.x, m.targetY - m.y]);
  const anchor = [m.x, m.y];
  for (let f = 1; f <= 60; f++) stepMice([m], config, f / 60, 1 / 60, width, height, [paw, other]);
  assert.deepEqual([m.x, m.y], anchor); assert.deepEqual([m.vx, m.vy], [0, 0]);
});
