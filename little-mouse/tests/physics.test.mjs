import{test}from'node:test';import assert from'node:assert/strict';import{flee,stepMice,upgradeSettings,radius}from'../public/physics.js';
const mouse=(x,y,vx=0)=>({x,y,vx,vy:0,angle:0,targetX:x+vx,targetY:y,hiddenUntil:0,restUntil:0,next:0,seed:1});
const config={size:2.2,speed:4,variation:true,bounded:true};
test('nearby taps start an escape away from the pointer; distant taps do nothing',()=>{const m=mouse(400,300);assert.equal(flee(m,350,300,1,1024,768,2.2),true);assert.ok(m.vx>0);assert.ok(m.targetX>m.x);assert.equal(m.startledUntil,2.15);assert.equal(flee(m,1000,760,1,1024,768,2.2),false);});
test('fast opposing mice separate and rebound without crossing through each other',()=>{const a=mouse(350,350,900),b=mouse(540,350,-900);const hits=stepMice([a,b],config,1,.05,1024,768);assert.ok(hits>0);assert.ok(a.x<b.x);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=2*radius(2.2,1024,768)-.01);assert.ok(a.vx<0);assert.ok(b.vx>0);});
test('exact overlap separates; caught mice do not collide; wall bounds hold',()=>{const a=mouse(300,300),b=mouse(300,300);stepMice([a,b],config,1,.016,1024,768);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>160);const hidden=mouse(300,300);hidden.hiddenUntil=9;const c=mouse(300,300);stepMice([c,hidden],config,1,.016,1024,768);assert.equal(c.x,300);const edge=mouse(10,10,-1000);stepMice([edge],config,1,.05,1024,768);assert.ok(edge.x>=radius(2.2,1024,768));assert.ok(edge.y>=radius(2.2,1024,768));});
test('old settings adopt behavior version 3 once; later choices persist',()=>{const s=upgradeSettings({speed:1,size:1.2,count:1,background:'wood'});for(const [key,value] of Object.entries({behaviorVersion:3,count:2,speed:1.2,size:2.2,hide:2.5,mode:'hunt',sound:true}))assert.equal(s[key],value,key);assert.equal(s.background,'wood');assert.equal(upgradeSettings({...s,speed:.5}).speed,.5);});

test('a reversal brakes and pivots gradually before accelerating toward the target',()=>{const m=mouse(1500,1500,500);m.targetX=500;const cfg={size:2.2,speed:3,variation:false};const before=m.angle;stepMice([m],cfg,1,1/60,4000,3000);assert.ok(Math.abs(m.angle-before)<.08);let slowest=Infinity;for(let t=1+1/60;t<3;t+=1/60){const a=m.angle;stepMice([m],cfg,t,1/60,4000,3000);assert.ok(Math.abs(m.angle-a)<.16);slowest=Math.min(slowest,m.speed);}assert.ok(slowest<150);assert.ok(m.x<1500);assert.ok(Math.cos(m.angle)<-.8);});
test('turn paths remain consistent at 30 and 120 frames per second',()=>{const run=hz=>{const m=mouse(1500,1500,400);m.targetX=2200;m.targetY=2200;for(let i=0;i<hz;i++)stepMice([m],{size:2.2,speed:3,variation:false},1+i/hz,1/hz,4000,3000);return m;};const a=run(30),b=run(120);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<2);assert.ok(Math.abs(a.angle-b.angle)<.01);});

test('version 2 migrates while explicit version 3 preferences remain intact',()=>{
 const old={behaviorVersion:2,count:6,speed:3,size:1,hide:0,mode:'scurry',sound:false};
 assert.equal(upgradeSettings(old).behaviorVersion,3);
 const current={...old,behaviorVersion:3,audioVersion:1};assert.deepEqual(upgradeSettings(current),current);
});

test('legacy version 3 mute repairs once without resetting movement or appearance',()=>{
 const saved={behaviorVersion:3,sound:false,soundVolume:.7,soundFrequency:1,speed:.4,count:2,size:1.7,mode:'manual',background:'slate'};
 const migrated=upgradeSettings(saved);assert.deepEqual(migrated,{...saved,sound:true,audioVersion:1});assert.equal(saved.sound,false);
 const muted={...migrated,sound:false};assert.deepEqual(upgradeSettings(muted),muted);
 assert.deepEqual(upgradeSettings(upgradeSettings(muted)),muted);
});

test('travel gain covers at least twice the distance without speeding the gait clock',async()=>{
 const{advanceGait}=await import('../public/gait.js');
 const run=travelSpeed=>{const m=mouse(500,500);m.targetX=100000;
  const cfg={size:2.86,speed:2.8,variation:false,travelSpeed};
  const gait={phase:0,cadence:0,activity:0,reach:0};
  for(let i=0;i<120;i++){stepMice([m],cfg,1+i/60,1/60,200000,2000);advanceGait(gait,m.speed,cfg.size,true,1/60,cfg);}
  return{distance:m.x-500,gait};};
 const old=run(1),fast=run(2.2);
 assert.ok(fast.distance/old.distance>=2.19);
 assert.ok(Math.abs(fast.gait.cadence-old.gait.cadence)<1e-9);
 assert.ok(Math.abs(fast.gait.phase-old.gait.phase)<1e-9);
});

test('fast arrival does not overshoot into repeated spins and a new target releases arrival',async()=>{
 const{settingsDefaults}=await import('../public/settings.js');
 for(const hz of [30,60,120])for(const distance of [20,60,150,300]){
  const m={...mouse(500,500,1000),targetX:500+distance,targetY:500,state:'active'};let turns=0;
  for(let i=0;i<hz*6;i++){const angle=m.angle;stepMice([m],settingsDefaults,i/hz,1/hz,1366,1024);turns+=Math.abs(m.angle-angle);}
  assert.ok(turns<.1,`${hz}Hz target ${distance}: ${turns} radians`);
  assert.ok(Math.hypot(m.targetX-m.x,m.targetY-m.y)<8);assert.equal(m.speed,0);
  const x=m.x;m.targetX+=300;
  for(let i=0;i<hz;i++)stepMice([m],settingsDefaults,6+i/hz,1/hz,1366,1024);
  assert.ok(m.x>x+200,'new destination must resume travel');
 }
});
test('watching does not retain a spinning angular velocity',()=>{
 const m={...mouse(500,500),turnRate:7,restUntil:100,targetX:800};
 stepMice([m],config,1,1/60,1366,1024);assert.equal(m.angle,0);assert.equal(m.turnRate,0);
});

test('a high-speed swept arrival stops at the path crossing, not beyond the destination',()=>{
 const m={...mouse(500,500,1855),targetX:506,targetY:500};
 stepMice([m],{size:.6,speed:0,travelSpeed:1,variation:false},0,1/30,10000,10000);
 assert.equal(m.x,506);assert.equal(m.y,500);assert.equal(m.speed,0);assert.equal(m.angle,0);
});
