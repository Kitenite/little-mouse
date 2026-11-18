import{test}from'node:test';import assert from'node:assert/strict';
import{createDragPose,advanceDragPose}from'../public/drag-pose.js';
import{createArticulation,articulatePoint,unarticulatePoint}from'../public/anatomy.js';
const parts=['head','body','forepaw','hindpaw','tail'];
function setup(part,scale=1){const pose=createArticulation({bodyLength:scale});pose.head=.13;pose.pelvis=-.08;pose.spine=.07;const material=[(part==='head'?40:0)*scale,9],point=articulatePoint(...material,0,pose),hold={part,active:false,localX:point[0],localY:point[1]},s=createDragPose();return{s,pose,material,hold,motion:{x:0,y:0,heading:0,size:2,holdReference:hold}};}
function step(r,dt=1/60,config={}){advanceDragPose(r.s,r.pose,r.motion,{held:!!r.motion.holdReference},dt,config);}
test('all held regions respond to actual drag, reverse and settle with bounded offsets',()=>{
 const responses=[];for(const part of parts)for(const scale of [.7,1.4]){
  const r=setup(part,scale);step(r);r.hold.active=true;
  for(let i=0;i<90;i++){r.motion.y+=i<45?8:-8;step(r,1/60,{dragCompliance:1.5,dragDamping:6});assert.ok([...r.s.values,...r.s.velocity,r.pose.head,r.pose.pelvis,r.pose.spine,r.pose.offsetX,r.pose.offsetY].every(Number.isFinite));assert.ok(Math.abs(r.pose.head)<=.32&&Math.abs(r.pose.pelvis)<=.22&&Math.abs(r.pose.spine)<=.18);
   if(part==='head'||part==='body'){const p=articulatePoint(...r.material,0,r.pose);assert.ok(Math.hypot(p[0]-r.hold.localX,p[1]-r.hold.localY)<1e-8);const u=unarticulatePoint(p[0],p[1],r.pose);assert.ok(Math.hypot(u[0]-r.material[0],u[1]-r.material[1])<1e-6);}
  }
  assert.ok(Math.hypot(...r.s.values)>.1);responses.push([...r.s.values.slice(0,3)]);
  for(let i=0;i<600;i++)step(r);assert.ok(Math.hypot(...r.s.values)<1e-6);
 }
 assert.equal(new Set(responses.map(v=>v.join(','))).size,5);
});
test('pending claims, pause and invalid dt freeze pose/rates; release correction decays continuously',()=>{
 const r=setup('head');step(r);const initial={...r.pose};for(let i=0;i<20;i++){r.motion.y+=5;step(r);}assert.deepEqual(r.pose,initial);
 r.hold.active=true;for(let i=0;i<30;i++){r.motion.y+=5;step(r);}const before={...r.pose},rates=[...r.s.velocity];for(const dt of [0,-1,NaN]){step(r,dt);assert.deepEqual(r.pose,before);assert.deepEqual([...r.s.velocity],rates);}
 r.motion.holdReference=null;step(r,0);assert.deepEqual(r.pose,before);step(r);assert.ok(Math.hypot(r.pose.offsetX-before.offsetX,r.pose.offsetY-before.offsetY)<2);
 for(let i=0;i<600;i++)step(r);assert.ok(Math.hypot(...r.s.values,r.pose.offsetX,r.pose.offsetY)<1e-6);
});
test('slow/fast drags across headings and frame rates stay finite; zero compliance disables forcing',()=>{
 for(const part of parts)for(const hz of [30,60,120])for(const heading of [0,Math.PI/2,-Math.PI/2,Math.PI])for(const speed of [20,800]){
  const r=setup(part);r.motion.heading=heading;step(r);r.hold.active=true;
  for(let i=0;i<hz;i++){r.motion.x+=speed/hz*Math.sin(heading);r.motion.y-=speed/hz*Math.cos(heading);step(r,1/hz);}
  assert.ok(Math.hypot(...r.s.values)>.01);r.motion.x+=100000;step(r);assert.ok([...r.s.values,...r.s.velocity].every(Number.isFinite));
 }
 const r=setup('body');step(r);r.hold.active=true;for(let i=0;i<60;i++){r.motion.y+=10;step(r,1/60,{dragCompliance:0});}assert.equal(Math.hypot(...r.s.values),0);
});
test('regrab, hidden reset, teleport and backwards time do not retain stale flop',async()=>{
 const {suspendDragPose}=await import('../public/drag-pose.js');
 for(const kind of ['regrab','hidden','teleport','backwards']){
  const r=setup('head');step(r);r.hold.active=true;for(let i=0;i<40;i++){r.motion.y+=8;step(r);}assert.ok(Math.hypot(...r.s.values)>.1);
  if(kind==='regrab'){r.motion.holdReference=null;step(r);r.motion.holdReference={part:'hindpaw',active:true};for(let i=0;i<600;i++)step(r);assert.ok(Math.hypot(r.pose.offsetX,r.pose.offsetY)<1e-8);}
  else{if(kind==='hidden')suspendDragPose(r.s);if(kind==='teleport')r.motion.x+=100000;if(kind==='backwards')r.s.time=100;
   advanceDragPose(r.s,r.pose,r.motion,{held:true,time:0},1/60,{});assert.equal(Math.hypot(...r.s.values,...r.s.velocity),0);}
 }
});
test('new pending grabs preserve release residual and live zero compliance settles without a snap',()=>{
 for(const part of parts){const r=setup('head');step(r);r.hold.active=true;for(let i=0;i<40;i++){r.motion.y+=8;step(r);}r.motion.holdReference=null;step(r);
  const before={...r.pose},material=[part==='head'?35:-8,7],point=articulatePoint(...material,0,r.pose);
  r.motion.holdReference={part,active:false,localX:point[0],localY:point[1]};step(r);
  for(const key of ['head','pelvis','spine','offsetX','offsetY'])assert.ok(Math.abs(r.pose[key]-before[key])<1e-8);
  r.motion.holdReference.active=true;const previous=Math.hypot(...r.s.values);r.motion.y+=8;step(r,1/60,{dragCompliance:0});assert.ok(Math.hypot(...r.s.values)>previous*.5,'disable must not snap');
  for(let i=0;i<600;i++){r.motion.y+=8;step(r,1/60,{dragCompliance:0});}assert.ok(Math.hypot(...r.s.values)<1e-10);
 }
});
