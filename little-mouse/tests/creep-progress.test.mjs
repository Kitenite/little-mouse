import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHuntDirector,updateHunt,forceHuntPhase} from '../public/enrichment.js';
import {updateHuntGroup} from '../public/hunt-group.js';
import {stepMice,radius} from '../public/physics.js';
import {settingsDefaults} from '../public/settings.js';
import {createMouseIdentity,identityRandom} from '../public/mouse-identity.js';
import {createContacts,beginContact,updateContacts,recordPointer} from '../public/contact.js';

const w=1024,h=768;
function fixture(kind='opposed-creep'){
 const config={...settingsDefaults,...kind==='slow-progress'?{speed:0,travelSpeed:1,creepSpeed:.5,huntTempo:.5}:{}};
 const rng=identityRandom(11),director=createHuntDirector(11),contacts=createContacts();
 const mice=[0,1].map(i=>({castIndex:i,identity:createMouseIdentity(1100+i),seed:i,state:'active',x:400+i*radius(config.size,w,h)*2,y:384,angle:i*Math.PI,vx:0,vy:0,hiddenUntil:0,restUntil:0}));
 if(kind==='slow-progress'||kind==='paw-detour')mice.pop();
 for(const m of mice){
  updateHunt(m,config,0,w,h,false,rng,director);
  forceHuntPhase(m,'creep',0,config,w,h,rng,director);
  m.hunt.goal=[(m.x+(m.castIndex===0?1:-1)*(kind==='slow-progress'?180:kind==='paw-detour'?450:20))/w,.5];
  m.hunt.visibleSince=0;
 }
 if(kind==='held-obstacle')beginContact(contacts,mice[1],{part:'body',localX:0,localY:0},3,mice[1].x,mice[1].y,0,config,config.size);
 if(kind==='paw-detour')recordPointer(contacts,9,625,384,0,100,100);
 director.paws=contacts.obstacles;
 return {config,rng,director,contacts,mice,tick(t,hz){
  updateContacts(contacts,t,mice);updateHuntGroup(director,mice,t,w,h,config);
  for(const m of mice)updateHunt(m,config,t,w,h,false,rng,director);
  stepMice(mice,config,t,1/hz,w,h,contacts.obstacles.values());
 }};
}

test('collision-locked creeping yields within three seconds at 30/60/120 Hz without releasing held anchors',()=>{
 for(const hz of [30,60,120])for(const kind of ['opposed-creep','held-obstacle']){
  const f=fixture(kind),m=f.mice[0],anchor={x:f.mice[1].x,y:f.mice[1].y};let exit=0,travel=0,last={x:m.x,y:m.y};
  for(let frame=1;frame<=3*hz;frame++){
   f.tick(frame/hz,hz);travel+=Math.hypot(m.x-last.x,m.y-last.y);last={x:m.x,y:m.y};
   if(kind==='held-obstacle')assert.ok(Math.hypot(f.mice[1].x-anchor.x,f.mice[1].y-anchor.y)<1e-6);
   if(m.hunt.phase!=='creep'){exit=frame/hz;assert.equal(m.hunt.phase,'watch');break;}
  }
  assert.ok(exit>=2.5&&exit<2.6,`${kind} ${hz}Hz: ${exit}`);
  assert.ok(travel<1,'recovery must not teleport out of the collision');
 }
});

test('slow progressing creep and a live-paw detour retain their routes',()=>{
 for(const hz of [30,60,120])for(const kind of ['slow-progress','paw-detour']){
  const f=fixture(kind),m=f.mice[0];let exit=null,minPaw=Infinity,arrival=null,dwell=null;
  for(let frame=1;frame<=10*hz;frame++){
   f.tick(frame/hz,hz);
   minPaw=Math.min(minPaw,Math.hypot(m.x-625,m.y-384));
   if(m.hunt.phase==='creep'&&m.hunt.arrivedAt!==null&&m.hunt.arrivedAt!==undefined){arrival=m.hunt.arrivedAt;dwell=m.hunt.dwell;}
   if(m.hunt.phase!=='creep'){exit=frame/hz;break;}
  }
  if(kind==='slow-progress'){assert.equal(exit,null);assert.ok(m.x>550,'slow creep still advances');}
  else {assert.ok(exit<5,'detour completes promptly');assert.notEqual(arrival,null,'arrives rather than yielding to a watchdog');assert.ok(exit-arrival>=dwell&&exit-arrival<=dwell+2/hz);assert.ok(Math.hypot(m.x-850,m.y-384)<8,'reaches the original goal');assert.ok(minPaw>=161.54-1e-6,'live paw clearance survives');}
 }
});

test('actual travel away from a goal is progress; changed goals, holds and arrival do not inherit stale stall windows',()=>{
 const f=fixture('slow-progress'),m=f.mice[0];
 const policy=t=>updateHunt(m,f.config,t,w,h,false,f.rng,f.director);
 // A detour can move away from its target. Distance-only checks would reject it.
 for(let i=0;i<=180;i++){m.x=400-i*.1;policy(i/60);}
 assert.equal(m.hunt.phase,'creep');
 m.hunt.goal=[.8,.5];policy(3.1);assert.equal(m.hunt.travelProgress.time,3.1);
 m.hold={};policy(9);assert.equal(m.hunt.travelProgress,undefined);delete m.hold;
 m.hunt.deadline=30;policy(9.1);assert.equal(m.hunt.phase,'creep');assert.equal(m.hunt.travelProgress.time,9.1);
 m.x=m.hunt.goal[0]*w;m.y=m.hunt.goal[1]*h;policy(9.2);
 assert.equal(m.hunt.travelProgress,undefined);assert.equal(m.hunt.arrivedAt,9.2);
 policy(9.21);assert.equal(m.hunt.phase,'creep','normal arrival dwell remains');
});

test('a visible peek blocked 8–15px from arrival backs out instead of remaining stuck beyond its deadline',()=>{
 for(const hz of [30,60,120])for(const gap of [8,12,15,16]){
  const f=fixture(),m=f.mice[0],other=f.mice[1],x=-10*f.config.size-gap;
  Object.assign(m,{x,y:384,angle:0});Object.assign(other,{x:x+2*radius(f.config.size,w,h),y:384,angle:0});
  Object.assign(m.hunt,{edge:0,slot:.5});forceHuntPhase(m,'peek',0,f.config,w,h,f.rng,f.director);
  beginContact(f.contacts,other,{part:'body',localX:0,localY:0},3,other.x,other.y,0,f.config,f.config.size);
  recordPointer(f.contacts,3,other.x,other.y,0,20,20);
  const anchor=other.x;let exit=0;
  for(let frame=1;frame<=3*hz;frame++){
   f.tick(frame/hz,hz);assert.ok(Math.abs(other.x-anchor)<1e-6);
   if(m.hunt.phase!=='peek'){exit=frame/hz;break;}
  }
  assert.ok(exit>0&&exit<2.6,`${hz}Hz gap${gap}: ${m.hunt.phase}`);
  // Floating point integration can bring the exact8px boundary inside arrival.
  if(gap>8){assert.equal(m.hunt.phase,'retreat');assert.ok(Math.abs(m.x-x)<1,'no teleport on recovery');}
 }
});

test('unobstructed near peek reaches its goal and dwells; invisible slow approach keeps moving inward',()=>{
 for(const hz of [30,60,120])for(const startX of [-40.6,-500]){
  const f=fixture('slow-progress'),m=f.mice[0];
  Object.assign(m,{x:startX,y:384,angle:0});Object.assign(m.hunt,{edge:0,slot:.5});
  forceHuntPhase(m,'peek',0,f.config,w,h,f.rng,f.director);let arrival=null;
  for(let frame=1;frame<=8*hz;frame++){
   f.tick(frame/hz,hz);
   if(m.x<-47*f.config.size)assert.equal(m.hunt.phase,'peek','invisible approach remains an approach');
   if(m.hunt.arrivedAt!==null){arrival=frame/hz;assert.equal(m.hunt.phase,'peek');break;}
  }
  assert.ok(arrival!==null,`${hz}Hz start${startX}: reaches edge`);
  assert.ok(Math.hypot(m.x+10*f.config.size,m.y-384)<8);
 }
});
