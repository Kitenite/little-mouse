import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHuntDirector,rememberTouch,clearHunt,updateHunt} from '../public/enrichment.js';
import {stepMice} from '../public/physics.js';
import {pressMouse} from '../public/behavior.js';

const config={mode:'hunt',speed:1.2,size:2.2,hide:3,huntTempo:1,variation:true};
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function simulation({seed=42,hz=60,w=1024,h=768,settings={},state='away'}={}){
 const m={state,x:w/2,y:h/2,angle:0,vx:0,vy:0,speed:0,targetX:w/2,targetY:h/2,hiddenUntil:0,restUntil:0,next:0,seed:1};
 const s={m,w,h,time:0,config:{...config,...settings},director:createHuntDirector(),rng:seeded(seed),events:[]};
 s.tick=(dt=1/hz)=>{s.time+=dt;const before=m.hunt?.phase;updateHunt(m,s.config,s.time,s.w,s.h,false,s.rng,s.director);stepMice([m],s.config,s.time,dt,s.w,s.h);if(m.hunt.phase!==before)s.events.push({phase:m.hunt.phase,time:s.time});return m;};
 s.until=(predicate,seconds=30)=>{const end=s.time+seconds;while(s.time<end){s.tick();if(predicate(m))return;}assert.fail(`condition not reached by ${s.time.toFixed(2)}s: ${JSON.stringify(s.events)}`);};
 return s;
}

test('seeded real motion visits hidden, peek, watch, creep, dart and retreat',()=>{
 const s=simulation();while(s.time<180)s.tick();
 for(const phase of ['hidden','peek','watch','creep','dart','retreat'])assert.ok(s.events.some(e=>e.phase===phase),phase);
 const hidden=s.events.filter(e=>e.phase==='hidden');assert.ok(hidden.length>=3,'repeated returns to cover');
 for(let i=1;i<s.events.length;i++)if(s.events[i-1].phase==='hidden')assert.equal(s.events[i].phase,'peek');
});

test('watch pauses brake to a stop and creeping stays slower than darting',()=>{
 const s=simulation();const speeds={creep:[],dart:[]};let stopped=false;
 while(s.time<180){const m=s.tick(),age=s.time-m.hunt.since;
  if(m.hunt.phase==='watch'&&age>.6){assert.ok(m.speed<2,`watch speed ${m.speed}`);stopped=true;}
  if(speeds[m.hunt.phase]&&age>.35)speeds[m.hunt.phase].push(m.speed);
 }
 assert.ok(stopped);assert.ok(speeds.creep.length&&speeds.dart.length);
 assert.ok(Math.max(...speeds.dart)>Math.max(...speeds.creep)*2,'dart exceeds crawl speed');
});

test('180 second seeded runs never strand a mouse beyond the viewport',()=>{
 for(const options of [{seed:1},{seed:42},{seed:97,settings:{speed:0,huntTempo:.5}},{seed:9,w:390,h:844},{seed:17,w:1366,h:768}]){
  const s=simulation(options);let lastVisible=0,visible=0;
  while(s.time<180){const m=s.tick();
   for(const key of ['x','y','vx','vy','targetX','targetY'])assert.ok(Number.isFinite(m[key]),key);
   // Peeking deliberately keeps the center outside; count a visible nose/body.
   const reach=47*s.config.size;
   if(m.state!=='away'&&m.x>-reach&&m.x<s.w+reach&&m.y>-reach&&m.y<s.h+reach){lastVisible=s.time;visible++;}
   assert.ok(s.time-lastVisible<40,`seed ${options.seed}: invisible for ${(s.time-lastVisible).toFixed(2)}s (${m.hunt.phase})`);
  }
  assert.ok(visible>0);
 }
});

test('recent nearby touches cause delayed retreat; distant and stale touches do not',()=>{
 for(const kind of ['near','far','stale']){
  const s=simulation({state:'active'});s.tick();
  const {m}=s;rememberTouch(s.director,kind==='far'?s.w: m.x,kind==='far'?s.h:m.y,kind==='stale'?s.time-2:s.time,s.w,s.h);
  s.tick();assert.equal(m.hunt.phase,'watch','reaction is not instantaneous');
  const end=s.time+.4;while(s.time<end)s.tick();
  assert.equal(m.hunt.phase,kind==='near'?'retreat':'watch',kind);
 }
});

test('continued nearby taps cannot postpone retreat indefinitely',()=>{
 const s=simulation({state:'active'});s.tick();const start=s.time;
 while(s.time-start<.4&&s.m.hunt.phase!=='retreat'){
  rememberTouch(s.director,s.m.x,s.m.y,s.time,s.w,s.h);s.tick();
 }
 assert.equal(s.m.hunt.phase,'retreat');assert.ok(s.time-start<=.4);
});

test('capture and injury have priority over nearby-touch retreat',()=>{
 for(const roll of [.1,.5,.7,.8,.95]){
  const s=simulation({state:'active'});s.tick();const {m}=s;
  rememberTouch(s.director,m.x,m.y,s.time,s.w,s.h);
  const result=pressMouse(m,m.x-10,m.y,s.time,s.w,s.h,config.size,()=>roll);
  const target=[m.targetX,m.targetY],rest=m.restUntil;s.tick();
  assert.equal(m.hunt.phase,'injury');assert.equal(m.state,result);
  assert.equal(m.restUntil,rest);assert.deepEqual([m.targetX,m.targetY],target);
  s.until(m=>m.hunt.phase==='hidden',30);s.until(m=>m.hunt.phase==='peek',30);
 }
});

test('manual takeover releases pauses and preserves the owner target',()=>{
 const s=simulation({state:'active'});s.tick();const {m}=s;m.targetX=100;m.targetY=200;
 assert.equal(updateHunt(m,s.config,s.time,s.w,s.h,true,s.rng,s.director),false);
 assert.equal(m.hunt,undefined);assert.equal(m.huntSpeed,undefined);assert.ok(m.restUntil<=s.time);assert.deepEqual([m.targetX,m.targetY],[100,200]);
 clearHunt(m,s.time);assert.equal(m.hunt,undefined);
 for(const mode of ['manual','scurry','stalk'])assert.equal(updateHunt(m,{...config,mode},s.time,s.w,s.h,false,s.rng,s.director),false);
});

test('viewport rotation during travel recomputes targets and returns to visible play',()=>{
 for(const phase of ['peek','creep','dart','retreat']){
  const s=simulation();s.until(m=>m.hunt.phase===phase,180);s.w=390;s.h=844;
  const resizedAt=s.time;s.tick();
  assert.ok(Number.isFinite(s.m.targetX)&&Number.isFinite(s.m.targetY));
  s.until(m=>m.state==='active'&&m.x>0&&m.x<s.w&&m.y>0&&m.y<s.h,40);
  assert.ok(s.time-resizedAt<40,phase);
 }
});

test('arrival and dwell timings are comparable at 30 and 120 Hz',()=>{
 const run=hz=>{const s=simulation({hz});while(s.events.length<8&&s.time<100)s.tick();return s.events;};
 const a=run(30),b=run(120);assert.equal(a.length,8);assert.equal(b.length,8);
 assert.deepEqual(a.map(e=>e.phase),b.map(e=>e.phase));
 for(let i=0;i<a.length;i++)assert.ok(Math.abs(a[i].time-b[i].time)<.6,`${a[i].phase}: ${a[i].time} vs ${b[i].time}`);
});

test('paused simulation time does not consume dwell or hide timers',()=>{
 const s=simulation();s.tick();const snapshot=structuredClone(s.m);
 for(let i=0;i<300;i++)updateHunt(s.m,s.config,s.time,s.w,s.h,false,s.rng,s.director);
 assert.deepEqual(s.m,snapshot);
});

test('seed 97 slow approach becomes visible promptly without spending its visible budget offscreen',()=>{
 const s=simulation({seed:97,settings:{speed:0,huntTempo:.5}});
 s.until(m=>m.hunt.phase==='peek');const started=s.time;
 let firstVisible=null;
 while(s.time-started<5){
  const {m}=s,reach=47*s.config.size;
  const visible=m.x>-reach&&m.x<s.w+reach&&m.y>-reach&&m.y<s.h+reach;
  if(visible){firstVisible=s.time;s.tick();break;}
  assert.equal(m.hunt.visibleSince,null,'hidden approach must not spend the visible exploration budget');
  assert.equal(m.hunt.phase,'peek','an invisible approach must not become a stationary watch');
  s.tick();
 }
 assert.notEqual(firstVisible,null,'slow approach exposes the silhouette within five seconds');
 assert.ok(s.m.hunt.visibleSince>=firstVisible-1/60);
 s.until(m=>m.hunt.phase==='creep'||m.hunt.phase==='dart',60);
});

test('opposing darts yield after collision instead of charging indefinitely',()=>{
 const s=simulation({seed:42});s.until(m=>m.hunt.phase==='dart',180);
 const a=s.m,b=structuredClone(a),r=39*s.config.size;
 Object.assign(a,{x:s.w/2-r,y:s.h/2,angle:0,vx:0,vy:0,turnRate:0});
 Object.assign(b,{x:s.w/2+r,y:s.h/2,angle:Math.PI,vx:0,vy:0,turnRate:0});
 a.hunt.goal=[.85,.5];b.hunt.goal=[.15,.5];
 const started=s.time;let collisions=0,yielded=false;
 while(s.time-started<6.2){
  s.time+=1/60;
  for(const m of [a,b])updateHunt(m,s.config,s.time,s.w,s.h,false,s.rng,s.director);
  collisions+=stepMice([a,b],s.config,s.time,1/60,s.w,s.h);
  if(a.hunt.phase!=='dart'&&b.hunt.phase!=='dart'){yielded=true;break;}
 }
 assert.ok(collisions>0,'fixture exercises actual physics collisions');
 assert.ok(yielded,'both blocked darts must relinquish their charge within six seconds');
});
