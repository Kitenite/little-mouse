import{test}from'node:test';
import assert from'node:assert/strict';
import{physicalBounds}from'../public/mouse-identity.js';
import{PlaygroundSimulation,LAB_STEP}from'../public/playground-simulation.js';
function advance(sim,seconds){for(let i=0;i<Math.round(seconds/LAB_STEP);i++)sim.advanceOne();}
test('same seed, clock, size and input sequence reproduce movement and recovery',()=>{
 function run(){const sim=new PlaygroundSimulation({seed:42,settings:{count:3,size:1.2}});sim.arrange('scatter');sim.force('chase',true);advance(sim,2);sim.pointerDown(9,120,180);advance(sim,.4);sim.pointerUp(9);sim.force('limp');advance(sim,8);return sim.snapshot();}
 assert.deepEqual(run(),run());
 const sim=new PlaygroundSimulation({seed:42,settings:{count:3}});const original=sim.snapshot();advance(sim,3);sim.reset(42);assert.deepEqual(sim.snapshot(),original);
});
test('pause freezes recovery, paw memory and physics while a frame step advances exactly 1/60 second',()=>{
 const sim=new PlaygroundSimulation({settings:{count:1}});sim.force('limp');sim.placePaw(800,500);sim.pointerDown(7,10,10);sim.pointerUp(7);const original=sim.snapshot();
 for(let i=0;i<100;i++)assert.equal(sim.tick(.25),0);assert.deepEqual(sim.snapshot(),original);
 sim.advanceOne();assert.equal(sim.time,LAB_STEP);assert.equal(sim.frames,1);assert.equal(sim.contacts.obstacles.size,2);
 sim.setPaused(false);sim.setTimeScale(.5);sim.tick(1/30);assert.equal(sim.frames,2);assert.equal(sim.time,2*LAB_STEP);
 advance(sim,5);assert.equal(sim.contacts.obstacles.size,1,'released paw memory expires; persistent paw remains');
});
test('all forced scenarios run through shared lifecycle without nonfinite or stranded states',()=>{
 for(const action of ['chase','tease','runthrough','hide','reentry','limp','harmless','hurt','defeat']){
  const sim=new PlaygroundSimulation({seed:93,settings:{count:2}});sim.force(action,true);
  if(action==='limp')assert.equal(sim.mice[0].reaction,'limp');
  if(action==='harmless')assert.equal(sim.mice[0].reaction,'flinch');
  if(action==='hurt')assert.equal(sim.mice[0].reaction,'stunned');
  if(action==='defeat')assert.equal(sim.mice[0].state,'defeated');
  if(action==='reentry')assert.equal(sim.mice[0].entering,true);
  for(let i=0;i<1200;i++){sim.advanceOne();for(const m of sim.mice)assert.ok(Number.isFinite(m.x+m.y+m.vx+m.vy+m.angle),action);}
 }
});
test('real contacts activate, drag and toss; selection survives count reduction',()=>{
 const sim=new PlaygroundSimulation({settings:{count:2,harmlessChance:1}});const m=sim.mice[0];
 assert.equal(sim.pointerDown(1,m.x,m.y,20,20),true);advance(sim,.3);assert.equal(m.hold.active,true);
 sim.pointerMove(1,m.x+120,m.y);advance(sim,.1);const result=sim.pointerUp(1);assert.equal(result.outcome,'tossed');assert.equal(m.hold,undefined);assert.ok(m.tossUntil>sim.time);
 sim.selected=1;sim.configure({count:1});assert.equal(sim.selected,0);assert.throws(()=>sim.configure({count:9}));
});
test('fixed clock gives the same path across display refresh rates and bounds background gaps',()=>{
 const slow=new PlaygroundSimulation({seed:77,settings:{count:2}}),fast=new PlaygroundSimulation({seed:77,settings:{count:2}});slow.setPaused(false);fast.setPaused(false);
 for(let i=0;i<300;i++)slow.tick(1/30);for(let i=0;i<1200;i++)fast.tick(1/120);
 assert.deepEqual(slow.snapshot(),fast.snapshot());const before=slow.time;slow.tick(100);assert.ok(slow.time-before<.251);
});


test('default lineup includes full tails without overlaps and reflows while still paused',()=>{
 const sim=new PlaygroundSimulation({width:416,height:320});
 for(const[width,height]of [[416,320],[624,474]]){
 sim.resize(width,height);assert.equal(sim.lineupFits,true);
 const rectangles=sim.mice.map(m=>{const b=physicalBounds(m.identity,sim.config);return{left:m.x-b.tail*sim.config.size,right:m.x+b.front*sim.config.size,top:m.y-b.width*sim.config.size,bottom:m.y+b.width*sim.config.size};});
 for(const r of rectangles)assert.ok(r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height);
 for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){const a=rectangles[i],b=rectangles[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);}
 }
});

test('playground idle activities share visible activity state and yield to a grab',()=>{
 for(const kind of ['nibble','groom','scratch','stretch','roll']){
  const sim=new PlaygroundSimulation({seed:19,settings:{count:1}});sim.force(kind);assert.equal(sim.mice[0].activity.kind,kind);
  advance(sim,.3);assert.equal(sim.snapshot().mice[0].activity.kind,kind);
  const m=sim.mice[0];sim.pointerDown(1,m.x,m.y);sim.advanceOne();assert.equal(m.activity,undefined,kind+' stops during the pending claim');
 }
});
