import {createContacts,beginContact,moveContact,endContact,cancelContact,updateContacts} from '../public/contact.js';
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

test('seed 42 large persistent paw cannot keep selecting a blocked familiar entrance',()=>{
 const s=simulation({seed:42});Object.assign(s.m,{x:-360,y:384});s.tick();
 const original={edge:s.m.hunt.edge,slot:s.m.hunt.slot};assert.equal(original.edge,0);
 s.director.paws=new Map([[1,{x:230,y:s.h*original.slot,radius:180}]]);
 s.until(m=>m.hunt.phase==='peek',2);
 const a=s.m.hunt,mouth=a.edge===0?[0,s.h*a.slot]:a.edge===1?[s.w,s.h*a.slot]:a.edge===2?[s.w*a.slot,0]:[s.w*a.slot,s.h];
 assert.ok(Math.hypot(mouth[0]-230,mouth[1]-s.h*original.slot)>=s.director.pawClearance+130,'chosen entrance clears full contact radius');
 assert.notEqual(a.edge,original.edge,'choose an open edge instead of repeatedly waiting');
});

test('fully covered entry waits, then released memory permits reentry without a new touch',()=>{
 const s=simulation({seed:42,w:390,h:390});s.tick();
 s.director.paws=new Map([[1,{x:195,y:195,radius:180}]]);
 // Small viewport: add four corner footprints to cover every edge candidate.
 for(const [i,[x,y]] of [[2,[0,0]],[3,[390,0]],[4,[0,390]],[5,[390,390]]])s.director.paws.set(i,{x,y,radius:180});
 while(s.time<5){s.tick();assert.equal(s.m.hunt.phase,'hidden');assert.equal(s.m.state,'away');}
 for(const p of s.director.paws.values()){p.memory=0;p.recent=true;}
 s.until(m=>m.hunt.phase==='peek',1);
});

test('injury supersedes queued nearby retreat and preserves the first recovery entrance',()=>{
 const s=simulation({seed:42,state:'active',settings:{hide:2.5,runThroughChance:.3}});s.tick();
 rememberTouch(s.director,s.m.x+50,s.m.y,s.time,s.w,s.h);s.tick();
 assert.equal(s.m.hunt.reactKind,'retreat');assert.ok(s.m.hunt.reactAt>s.time);
 pressMouse(s.m,s.m.x-10,s.m.y,s.time,s.w,s.h,s.config.size,()=>.8,{harmlessChance:0});
 s.until(m=>m.hunt.phase==='hidden',20);
 const firstEntry=Math.max(s.m.hunt.deadline,s.director.nextEntrance);
 while(s.time<firstEntry)s.tick();
 assert.equal(s.m.hunt.phase,'peek','old threat must not cancel the first recovery entrance');
 assert.equal(s.m.hunt.reactKind,undefined);
 assert.equal(s.m.hunt.reactAt,undefined);
 // A genuinely new cue after recovery still receives a reaction.
 rememberTouch(s.director,s.m.x,s.m.y,s.time,s.w,s.h);s.tick();
 assert.equal(s.m.hunt.reactKind,'retreat');
});

test('seed 42 paw arriving during peek backs out and reenters through clear cover',()=>{
 for(const approachAge of [0,.7,2.3]){
 const s=simulation({seed:42,settings:{hide:2.5}});s.until(m=>m.hunt.phase==='peek',2);
 const peekAt=s.time;while(s.time-peekAt<approachAge)s.tick();
 assert.equal(s.m.hunt.phase,'peek','fixture inserts a paw during approach/peek');
 const a=s.m.hunt,oldEdge=a.edge,slot=a.slot;
 const [x,y]=a.edge===0?[0,s.h*slot]:a.edge===1?[s.w,s.h*slot]:a.edge===2?[s.w*slot,0]:[s.w*slot,s.h];
 s.director.paws=new Map([[1,{x,y,radius:100}]]);
 const started=s.time;let withdrew=false,hidden=false,reentered=false;
 // Include the real persistent-paw physics that caused the approach deadlock.
 while(s.time-started<20){
  s.time+=1/60;const prev=[s.m.x,s.m.y];
  updateHunt(s.m,s.config,s.time,s.w,s.h,false,s.rng,s.director);
  stepMice([s.m],s.config,s.time,1/60,s.w,s.h,s.director.paws.values());
  if(s.m.hunt.phase==='retreat'){withdrew=true;assert.equal(s.m.hunt.edge,oldEdge,'back out through the approach cover');}
  if(s.m.hunt.phase==='hidden'){hidden=true;withdrew ||= s.m.hunt.history.includes('retreat');const pad=140*s.config.size;assert.ok(s.m.x < -pad||s.m.x>s.w+pad||s.m.y < -pad||s.m.y>s.h+pad,'withdraw beyond full silhouette before hiding');}
  if(hidden&&s.m.hunt.phase==='peek'){assert.notEqual(s.m.hunt.edge,oldEdge);reentered=true;break;}
  assert.ok(Math.hypot(s.m.x-prev[0],s.m.y-prev[1])<40,'no teleport during withdrawal');
 }
 assert.ok(withdrew&&hidden&&reentered,'newly blocked peek must return through clear cover within 20 seconds');
 }
});


test('hold/toss supersedes pre-contact threat while new release cues react exactly once',()=>{
 for(const hz of [30,60,120])for(const cue of ['none','release','airborne'])for(const heldPolicy of [true,false]){
  const fresh=cue!=='none';
  const s=simulation({hz,seed:42,state:'active',settings:{hide:2.5,runThroughChance:.3}}),contacts=createContacts();
  const tick=()=>{s.time+=1/hz;updateContacts(contacts,s.time);if(!(s.m.tossUntil>s.time)&&(heldPolicy||!s.m.hold))updateHunt(s.m,s.config,s.time,s.w,s.h,false,s.rng,s.director);stepMice([s.m],s.config,s.time,1/hz,s.w,s.h);};
  tick();rememberTouch(s.director,s.m.x+50,s.m.y,s.time,s.w,s.h);tick();
  assert.equal(s.m.hunt.reactKind,'retreat');
  assert.ok(beginContact(contacts,s.m,{part:'body'},1,s.m.x,s.m.y,s.time,s.config,s.config.size));
  while(s.time<.3)tick();
  moveContact(contacts,1,562,384,s.config.size,s.time);tick();tick();
  const result=endContact(contacts,1,s.time,s.w,s.h,s.config.size,s.config,()=>.8);
  assert.equal(result.outcome,'tossed');assert.equal(endContact(contacts,1,s.time,s.w,s.h,s.config.size,s.config),null);
  const release=s.time,lands=s.m.tossUntil;
  if(cue==='airborne')while(s.time<release+.1)tick();
  if(fresh)rememberTouch(s.director,s.m.x,s.m.y,s.time,s.w,s.h);
  while(s.time<lands)tick();
  assert.equal(s.m.hunt.phase,'watch','landing must not replay a stale queued retreat');
  assert.equal(s.m.hunt.reactKind,fresh?'retreat':undefined,'post-release cue retained until landing');
  if(fresh){const reacts=s.m.hunt.reactAt;while(s.time<reacts)tick();assert.equal(s.m.hunt.phase,'retreat');assert.equal(s.m.hunt.reactAt,undefined);const started=s.m.hunt.since;tick();assert.equal(s.m.hunt.since,started,'same cue cannot restart retreat');}
 }
});

test('canceled hold discards queued flight but fresh cancellation-time cue still reacts',()=>{
 for(const heldPolicy of [false,true]){
 const s=simulation({seed:42,state:'active'}),contacts=createContacts();s.tick();
 rememberTouch(s.director,s.m.x,s.m.y,s.time,s.w,s.h);s.tick();
 beginContact(contacts,s.m,{part:'body'},1,s.m.x,s.m.y,s.time,s.config,s.config.size);if(heldPolicy)s.tick();
 cancelContact(contacts,1);assert.equal(s.m.hunt.reactAt,undefined);
 rememberTouch(s.director,s.m.x,s.m.y,s.time,s.w,s.h);s.tick();assert.equal(s.m.hunt.reactKind,'retreat');
 }
});

test('appearances rotate all four motifs without adjacent repeats across frame rates',()=>{
 for(const hz of [30,60,120]){
  const s=simulation({hz,seed:71,settings:{speed:2.8,travelSpeed:2.2,hide:1,runThroughChance:.6}});
  const motifs=[];let previous;
  while(s.time<300){s.tick();const a=s.m.hunt;if(a.phase==='peek'&&previous!=='peek')motifs.push(a.motif);previous=a.phase;}
  assert.ok(motifs.length>=8,`${hz}Hz: enough complete appearances`);
  assert.equal(new Set(motifs).size,4);
  for(let i=1;i<motifs.length;i++)assert.notEqual(motifs[i],motifs[i-1]);
 }
});
test('investigation after a pause chooses fresh ground instead of the old entry point',async()=>{
 const {forceHuntPhase}=await import('../public/enrichment.js');
 const s=simulation({state:'active'});s.tick();const goals=[];
 for(let i=0;i<6;i++){
  Object.assign(s.m,{x:512,y:384,angle:i*.4});
  forceHuntPhase(s.m,'watch',s.time,s.config,s.w,s.h,s.rng,s.director);
  forceHuntPhase(s.m,'creep',s.time,s.config,s.w,s.h,s.rng,s.director);
  goals.push(s.m.hunt.goal.join(','));
  assert.ok(Math.hypot(s.m.targetX-512,s.m.targetY-384)>40);
 }
 assert.equal(new Set(goals).size,6);
});

test('unobstructed reentry mixes familiar cover with different edges',()=>{
 const s=simulation({seed:23,settings:{speed:2.8,travelSpeed:2.2,hide:1,runThroughChance:.6}});
 let exitEdge=null,entrances=0,same=0,previous;
 while(s.time<600){s.tick();const a=s.m.hunt;
  if(a.phase==='hidden'&&previous!=='hidden')exitEdge=a.edge;
  if(a.phase==='peek'&&previous!=='peek'&&exitEdge!==null){entrances++;if(a.edge===exitEdge)same++;}
  previous=a.phase;
 }
 assert.ok(entrances>20);assert.ok(same/entrances<.75,'distance bias must not force the same entrance');
 assert.ok(same>0,'familiar-cover teasing remains available');
});
