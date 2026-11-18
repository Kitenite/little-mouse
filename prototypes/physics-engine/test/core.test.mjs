import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,LIMITS} from '../core.mjs';
import {runScenario,comparisons} from '../scenarios.mjs';
const advance=(s,n)=>{for(let i=0;i<n;i++)s.step(1/120);};
for(const kind of ['kinematic','planck']){
 test(`${kind}: invalid time is exact no-op; fixed-step catch-up bounded`,()=>{
  const s=new Simulation(kind);s.begin(1,0,{x:220,y:226});s.move(1,{x:700,y:100});
  const before=s.snapshot();for(const dt of [0,-1,NaN,Infinity,-Infinity]){assert.equal(s.step(dt),0);assert.deepEqual(s.snapshot(),before);}
  assert.equal(s.step(10000),8);assert.equal(s.steps,8);assert.ok(s.time<=1/15+1e-12);
  const partial=new Simulation(kind);assert.equal(partial.step(1/240),0);assert.equal(partial.step(1/240),1);
 });
 test(`${kind}: ownership, competing pointer, independent mouse, duplicate release`,()=>{
  const s=new Simulation(kind);assert.equal(s.begin(1,0,{x:220,y:226}),true);
  assert.equal(s.begin(2,0,{x:220,y:250}),false);assert.equal(s.begin(1,1,{x:550,y:250}),false);
  assert.equal(s.begin(2,1,{x:550,y:250}),true);assert.equal(s.claims.size,2);
  assert.equal(s.move(3,{x:1,y:1}),false);assert.equal(s.move(1,{x:NaN,y:1}),false);
  s.release(1,true);assert.equal(s.release(1),null);assert.equal(s.claims.size,1);s.cleanup();assert.equal(s.claims.size,0);
 });
 test(`${kind}: pending pose freezes, then activates; cancellation has no release toss`,()=>{
  const s=new Simulation(kind);const initial=s.snapshot().mice[0];s.begin(1,0,{x:220,y:226});s.move(1,{x:260,y:260});advance(s,20);
  let m=s.snapshot().mice[0];assert.equal(s.snapshot().claims[0].active,false);assert.equal(m.angle,initial.angle);
  for(let i=0;i<m.parts.length;i++){assert.equal(m.parts[i].angle,initial.parts[i].angle);assert.ok(Math.abs((m.parts[i].x-m.x)-(initial.parts[i].x-initial.x))<1e-8);assert.ok(Math.abs((m.parts[i].y-m.y)-(initial.parts[i].y-initial.y))<1e-8);}
  advance(s,12);assert.equal(s.snapshot().claims[0].active,true);s.move(1,{x:500,y:200});advance(s,8);s.release(1,true);
  m=s.snapshot().mice[0];assert.equal(Math.hypot(m.vx,m.vy),0);assert.equal(m.spin,0);assert.equal(s.claims.size,0);
  if(s.world)assert.equal(s.world.getJointCount(),14);
 });
 test(`${kind}: pause clears claims, freezes time, rejects new claims; resumes`,()=>{
  const s=new Simulation(kind);s.begin(1,0,{x:220,y:226});advance(s,40);s.pause(true);const before=s.snapshot();
  assert.equal(s.step(1),0);assert.deepEqual(s.snapshot(),before);assert.equal(s.begin(1,0,{x:220,y:226}),false);s.pause(false);assert.equal(s.step(1/120),1);
 });
 test(`${kind}: repeated cleanup never leaks claims/joints`,()=>{
  const s=new Simulation(kind);for(let i=0;i<25;i++){const p=s.center(0);s.begin(i,0,p);advance(s,31);s.cleanup();s.cleanup();}
  assert.equal(s.claims.size,0);if(s.world){assert.equal(s.world.getBodyCount(),17);assert.equal(s.world.getJointCount(),14);}
 });
 test(`${kind}: release and target speed stay bounded`,()=>{
  const s=new Simulation(kind);s.begin(1,0,{x:220,y:226});advance(s,40);s.move(1,{x:1e100,y:-1e100});const old=s.snapshot().claims[0].anchor;s.step(1/120);const current=s.snapshot().claims[0].anchor;
  assert.ok(Math.hypot(current.x-old.x,current.y-old.y)<=800/120+1e-8);s.release(1);
  const m=s.snapshot().mice[0];assert.ok(Math.hypot(m.vx,m.vy)<=900+1e-8);assert.ok(Math.abs(m.spin)<=12);
 });
}
test('quick moving release explicitly differs: baseline toss; Planck pending tap',()=>{
 const outcomes=[];for(const kind of ['kinematic','planck']){const s=new Simulation(kind);s.begin(1,0,{x:220,y:226});for(let i=1;i<=15;i++){s.move(1,{x:220+i*4,y:226});s.step(1/120);}outcomes.push(s.release(1));}assert.deepEqual(outcomes,['tossed','tap']);
});
test('force-based off-center release retains angular velocity; baseline body does not',()=>{
 const a=runScenario('kinematic'),b=runScenario('planck');assert.equal(a.releaseSpinRadS,0);assert.ok(Math.abs(b.releaseSpinRadS)>.5);assert.ok(b.dragErrorPx>1&&b.dragErrorPx<35);assert.ok(b.peakJointGapPx<1);assert.ok(b.peakLimitExcessRad<.2);
});
test('limited limb and tail grabs use selected body and clean up',()=>{
 for(const part of ['forepaw','hindpaw','tail']){
  const s=new Simulation();const selected=s.mice[0].parts.find(p=>p.name===part),p=selected.body.getPosition();s.begin(1,0,{x:p.x*50,y:p.y*50},part,selected.body);advance(s,32);
  assert.equal(s.claims.get(1).joint.getBodyB(),selected.body);s.move(1,{x:350,y:150});advance(s,50);
  assert.ok(s.mice[0].joints.every(j=>j.isLimitEnabled()));assert.ok(s.snapshot().mice.every(m=>Number.isFinite(m.x+m.y+m.angle)));s.cleanup();assert.equal(s.world.getJointCount(),14);
 }
});
test('matched collision separates torsos, records contacts, and exposes articulation adoption failure',()=>{
 for(const kind of ['kinematic','planck']){const r=runScenario(kind,'collision');assert.ok(r.collisionEvents>0);assert.ok(r.finalCenterDistancePx>=78);assert.ok(r.peakSpeedPxS<=900);}
 const p=runScenario('planck','collision');assert.ok(p.peakJointGapPx>2,'known gap fails proposed 2px adoption gate');assert.ok(p.peakLimitExcessRad>.2,'known angular overshoot fails .2rad gate');
});
test('wall release preserves evidence of production bounds bypass',()=>{
 assert.ok(runScenario('kinematic','wall').peakWallOverrunPx>100);assert.ok(runScenario('planck','wall').peakWallOverrunPx<1);
});
test('stationary settle and cancellation release speeds',()=>{
 for(const kind of ['kinematic','planck']){assert.ok(runScenario(kind,'hold').releaseSpeedPxS<5);assert.equal(runScenario(kind,'cancel').releaseSpeedPxS,0);}
});
test('all scripted numerical scenarios repeat exactly in this runtime',()=>{assert.deepEqual(comparisons(),comparisons());});
test('snapshot contains detached data',()=>{const s=new Simulation();s.begin(1,0,{x:220,y:226});const snap=s.snapshot();snap.claims[0].anchor.x=0;snap.mice[0].parts[0].x=0;assert.equal(s.snapshot().claims[0].anchor.x,220);assert.ok(s.snapshot().mice[0].x>200);});
test('stable mirrored part indices select both sides and every tail segment',()=>{
 for(const index of [1,2,3,4,5,6,7]){
  const s=new Simulation(),pose=s.partPose(0,index);const hit=s.hit(pose);assert.equal(hit.partIndex,index);
  assert.equal(s.begin(1,0,pose,pose.name,undefined,index),true);advance(s,32);
  const joint=s.claims.get(1).joint;assert.equal(joint.getBodyB(),s.mice[0].parts[index].body);
  assert.ok(Math.hypot(joint.getAnchorB().x*50-pose.x,joint.getAnchorB().y*50-pose.y)<1e-8);
  s.cleanup();
 }
});
test('shared UI/CLI replay releases after the final movement step',async()=>{
 const {createReplay,advanceReplay}=await import('../replay.mjs');
 for(const name of ['drag','wall','hold','cancel']){
  const {simulations,replay}=createReplay(name);while(replay.frame<replay.releaseFrame-1)advanceReplay(simulations,replay);
  assert.ok(simulations.every(s=>s.claims.size===1));advanceReplay(simulations,replay);
  assert.ok(simulations.every(s=>s.claims.size===0));for(const s of simulations){const measured=runScenario(s.kind,name),m=s.snapshot().mice[0];assert.equal(Math.hypot(m.vx,m.vy),measured.releaseSpeedPxS);assert.equal(m.spin,measured.releaseSpinRadS);}
 }
});
