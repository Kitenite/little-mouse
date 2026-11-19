import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSecondaryMotion,advanceSecondaryMotion,suspendSecondaryMotion,writeTailGeometry} from '../public/secondary-motion.js';
const finite=s=>{assert.ok([...s.points,...s.previous,...s.fur,...s.furVelocity].every(Number.isFinite));assert.deepEqual([...s.points.slice(0,3)],[-36,0,5]);for(let i=1;i<=s.segments;i++){assert.ok(s.points[i*3]<=-36+.0001);assert.ok(s.points[i*3+2]>=1.4);assert.ok(s.points[i*3+2]<=7);}};
const move=(s,steps,pose,c={})=>{for(let i=0;i<steps;i++)advanceSecondaryMotion(s,pose(i),1/60,c);};
test('a turn leaves an inertial tail bend and the tail and coat settle after stopping',()=>{const s=createSecondaryMotion();let x=0,y=0,heading=0;move(s,120,()=>({x:x+=3,y,heading,size:2}));heading=Math.PI/2;move(s,8,()=>({x,y:y+=3,heading,size:2}));finite(s);assert.ok(Math.abs(s.points.at(-2))>5,'tail must lag the new direction');assert.ok(Math.hypot(...s.fur)>.01,'coat responds to acceleration');move(s,1200,()=>({x,y,heading,size:2}));finite(s);assert.ok(Math.abs(s.points.at(-2))<.01);assert.ok(Math.abs(s.points.at(-3)+123)<.01);assert.ok(Math.hypot(...s.fur)<.001);});
test('abrupt turns and extreme motion controls stay finite and close to the floor',()=>{for(const controls of [{tailStiffness:2,tailDamping:2,tailSway:2,furSway:2},{tailStiffness:24,tailDamping:18},{tailStiffness:NaN,tailDamping:Infinity}]){const s=createSecondaryMotion();move(s,900,i=>({x:180*Math.sin(i*.07),y:130*Math.cos(i*.055),heading:Math.floor(i/8)*1.9,size:2.2}),controls);finite(s);for(let i=1;i<=s.segments;i++){const k=i*3;assert.ok(Math.hypot(s.points[k]-s.points[k-3],s.points[k+1]-s.points[k-2],s.points[k+2]-s.points[k-1])<3.7,'segments cannot stretch into spikes');const angle=Math.atan2(s.points[k+1]-s.points[k-2],s.points[k]-s.points[k-3]);const prior=i===1?Math.PI:Math.atan2(s.points[k-2]-s.points[k-5],s.points[k-3]-s.points[k-6]);assert.ok(Math.abs(Math.atan2(Math.sin(angle-prior),Math.cos(angle-prior)))<=.221,'curvature cannot fold into an accordion');}}});
test('hidden reentry, resize, teleport, and long frame gaps reset without stale impulses',()=>{const s=createSecondaryMotion();move(s,40,i=>({x:i*4,y:i,heading:.8,size:2}));suspendSecondaryMotion(s);advanceSecondaryMotion(s,{x:800,y:300,heading:-2,size:2},1/60);assert.equal(s.points.at(-2),0);assert.equal(Math.hypot(...s.fur),0);advanceSecondaryMotion(s,{x:800,y:300,heading:-2,size:3},1/60);assert.equal(s.points.at(-3),-123);advanceSecondaryMotion(s,{x:800,y:300,heading:-2,size:3},2);finite(s);assert.equal(s.points.at(-2),0);advanceSecondaryMotion(s,{x:5000,y:300,heading:1,size:3},1/60);finite(s);assert.equal(s.points.at(-2),0);});
test('pause freezes the numerical state and geometry keeps a tapered attached root',()=>{const s=createSecondaryMotion();advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},1/60);move(s,30,i=>({x:i*2,y:0,heading:.01*i,size:1}));const before=[...s.points];advanceSecondaryMotion(s,{x:60,y:0,heading:.3,size:1},0);assert.deepEqual([...s.points],before);const p=new Float32Array(49*9*3),n=new Float32Array(p.length);writeTailGeometry(s,p,n);assert.ok([...p,...n].every(Number.isFinite));assert.ok(Math.abs((p[0]+p[12])/2+36)<.01);assert.ok(Math.abs((p[1]+p[13])/2)<.01);for(let i=0;i<p.length;i+=3){assert.ok(p[i+2]>=.299);assert.ok(Math.abs(Math.hypot(n[i],n[i+1],n[i+2])-1)<.0001);}assert.ok(Math.hypot(p[3*48*9]-s.points.at(-3),p[3*48*9+1]-s.points.at(-2))<.21);});
test('simulation is deterministic at a fixed frame rate',()=>{const a=createSecondaryMotion(),b=createSecondaryMotion();for(const s of [a,b])move(s,240,i=>({x:i*2,y:Math.sin(i/20)*10,heading:Math.sin(i/20)*.2,size:2}));assert.deepEqual([...a.points],[...b.points]);assert.deepEqual([...a.fur],[...b.fur]);});
test('ear inertia reacts asymmetrically to impact and settles without idle oscillation',()=>{const s=createSecondaryMotion();advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},1/60);move(s,6,()=>({x:0,y:0,heading:0,size:1,impact:1}),{earSway:2,earStiffness:180,earDamping:4});assert.ok(Math.abs(s.ears[0])>.02);assert.notEqual(Math.abs(s.ears[0]),Math.abs(s.ears[3]));for(let i=0;i<6;i++)assert.ok(Math.abs(s.ears[i])<.35);move(s,900,()=>({x:0,y:0,heading:0,size:1}));assert.ok([...s.ears,...s.earVelocity].every(v=>Math.abs(v)<.00001));const still=[...s.ears];advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1,impact:1},0);assert.deepEqual([...s.ears],still);suspendSecondaryMotion(s);advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},1/60);assert.ok([...s.ears,...s.earVelocity].every(v=>v===0));});
test('maximum sway preserves rendered tail length through a sharp turn',()=>{const s=createSecondaryMotion();let x=0,y=0;move(s,120,()=>({x:x+=3,y,heading:0,size:2}),{tailSway:2});move(s,8,()=>({x,y:y+=3,heading:Math.PI/2,size:2}),{tailSway:2});const p=new Float32Array(49*9*3),normal=new Float32Array(p.length);writeTailGeometry(s,p,normal);let length=0,last;for(let ring=0;ring<=48;ring++){const k=ring*27,center=[(p[k]+p[k+12])/2,(p[k+1]+p[k+13])/2,(p[k+2]+p[k+14])/2];if(last)length+=Math.hypot(...center.map((v,i)=>v-last[i]));last=center;}assert.ok(length>85&&length<89,`rendered length ${length} must remain near 87`);});
test('held tail pins a reachable contact and releases without correction energy',()=>{const s=createSecondaryMotion(),hold={x:-88,y:12,fraction:.7};move(s,60,()=>({x:0,y:0,heading:0,size:1,tailHold:hold}));const k=s.holdIndex*3;assert.ok(Math.hypot(s.points[k]-hold.x,s.points[k+1]-hold.y)<.01);assert.deepEqual([...s.previous],[...s.points]);assert.deepEqual([...s.points.slice(0,3)],[-36,0,5]);for(let i=0;i<=s.segments;i++)assert.ok(s.points[i*3]<-35.99);move(s,900,()=>({x:0,y:0,heading:0,size:1}));finite(s);assert.ok(Math.abs(s.points.at(-2))<.01);});
test('whiskers explore, lag an impact, and settle when cues stop',()=>{const s=createSecondaryMotion();advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},1/60);move(s,30,()=>({x:0,y:0,heading:0,size:1,whisking:1}));assert.ok(Math.hypot(...s.whiskers)>.005);move(s,12,()=>({x:0,y:0,heading:0,size:1,impact:1,struggle:.8}),{whiskerMotion:2});assert.ok(s.whiskers[2]>.05);assert.ok([...s.whiskers,...s.whiskerVelocity].every(Number.isFinite));assert.ok(Math.max(...s.whiskers.map(Math.abs))<=.4);const paused=[...s.whiskers];advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},0);assert.deepEqual([...s.whiskers],paused);move(s,600,()=>({x:0,y:0,heading:0,size:1}));assert.ok(Math.hypot(...s.whiskers,...s.whiskerVelocity)<.00001);suspendSecondaryMotion(s);advanceSecondaryMotion(s,{x:20,y:10,heading:1,size:2},1/60);assert.ok(s.whiskers.every(v=>v===0));});

test('a held rendered fraction stays at the pointer between solver nodes',()=>{for(const ring of[6,11,19,31,41,47,48]){const s=createSecondaryMotion(),fraction=ring/48,hold={x:-36-87*fraction*.93,y:87*fraction*.12,fraction};move(s,12,()=>({x:0,y:0,heading:0,size:1,tailHold:hold}));const p=new Float32Array(49*9*3),normal=new Float32Array(p.length);writeTailGeometry(s,p,normal);const k=ring*27;assert.ok(Math.hypot((p[k]+p[k+12])/2-hold.x,(p[k+1]+p[k+13])/2-hold.y)<.00002,`ring ${ring} must pin the actual rendered contact`);advanceSecondaryMotion(s,{x:0,y:0,heading:0,size:1},1/60);assert.equal(s.holdFraction,0);}});


test('live secondary pause preserves all state across pending hide, teleport and scale resets',()=>{
 for(const hidden of [false,true])for(const dt of [0,-1,NaN,Infinity]){
  const s=createSecondaryMotion(),hold={x:-88,y:12,fraction:.7};
  for(let i=0;i<60;i++)advanceSecondaryMotion(s,{x:i,y:0,size:1,tailHold:hold,impact:.5},1/60);
  if(hidden)suspendSecondaryMotion(s);const before=structuredClone(s);
  advanceSecondaryMotion(s,{x:10000,y:20,heading:2,size:2,tailHold:hold},dt);
  assert.deepEqual(s,before,'no integration or reset during a live pause');
  advanceSecondaryMotion(s,{x:10000,y:20,heading:2,size:2,tailHold:hold},1/60);
  assert.equal(s.revision,before.revision+1);assert.equal(s.holdFraction,.7);
  assert.ok(Math.hypot(s.points[s.holdIndex*3]-hold.x,s.points[s.holdIndex*3+1]-hold.y)<1e-8);
  assert.ok([...s.ears,...s.whiskers,...s.fur,...s.earVelocity,...s.whiskerVelocity,...s.furVelocity].every(v=>v===0));
  assert.deepEqual(s.previous,s.points,'reset pin corrections carry no release energy');
 }
});
test('cold zero-time and long-gap resets preserve reachable tail material fractions',()=>{
 for(const fraction of [.125,.5,.73,47/48,1])for(const dt of [0,1/60,.3]){
  const s=createSecondaryMotion(),hold={x:-36-87*fraction*.8,y:87*fraction*.1,fraction};
  advanceSecondaryMotion(s,{x:0,y:0,size:1,tailHold:hold},dt);
  assert.equal(s.holdFraction,fraction);assert.ok(Math.hypot(s.points[s.holdIndex*3]-hold.x,s.points[s.holdIndex*3+1]-hold.y)<1e-8);
  assert.deepEqual(Array.from(s.points.slice(0,3)),[-36,0,5]);assert.deepEqual(s.previous,s.points);
 }
 const cold=createSecondaryMotion(),before=structuredClone(cold);for(const dt of [-1,NaN,Infinity]){advanceSecondaryMotion(cold,{},dt);assert.deepEqual(cold,before);}
});


test('held-tail release relaxes bends without a frame jump, length collapse or correction energy',()=>{
 for(const hz of [30,60,120])for(const fraction of [.125,.5,.73,1])for(const side of [-1,0,1]){
  const s=createSecondaryMotion(),motion={x:0,y:0,size:1},hold={x:-36-87*fraction*.5,y:side*87*fraction*.1,fraction};
  for(let i=0;i<60;i++)advanceSecondaryMotion(s,{...motion,tailHold:hold},1/60);
  let before=s.points.slice();const p=new Float32Array(49*27),n=new Float32Array(p.length);
  for(let frame=0;frame<hz*5;frame++){
   advanceSecondaryMotion(s,motion,1/hz);assert.deepEqual(Array.from(s.points.slice(0,3)),[-36,0,5]);
   for(let k=0;k<s.points.length;k+=3){assert.ok(Math.hypot(s.points[k]-before[k],s.points[k+1]-before[k+1],s.points[k+2]-before[k+2])<=100/hz,`bounded release at ${hz}Hz fraction${fraction}`);assert.ok(s.points[k]<=-36&&s.points[k+2]>=1.4);}
   if(s.releasing)assert.deepEqual(s.previous,s.points,'constraint recovery cannot become a velocity impulse');
   before.set(s.points);writeTailGeometry(s,p,n);assert.ok(p.every(Number.isFinite));let length=0;
   for(let ring=1;ring<=48;ring++){const k=ring*27,b=k-27;length+=Math.hypot((p[k]+p[k+12]-p[b]-p[b+12])/2,(p[k+1]+p[k+13]-p[b+1]-p[b+13])/2,(p[k+2]+p[k+14]-p[b+2]-p[b+14])/2);}
   assert.ok(length>85&&length<89,`rendered release arc ${length}`);
  }
  assert.equal(s.releasing,false,'finite recovery returns control to the free chain');assert.equal(s.releaseFraction,0);
 }
});
test('release bridge pauses exactly and yields immediately to regrab or reset',()=>{
 for(const action of ['regrab','hidden','teleport']){
  const s=createSecondaryMotion(),motion={x:0,y:0,size:1},hold={x:-68,y:5,fraction:.73};
  for(let i=0;i<60;i++)advanceSecondaryMotion(s,{...motion,tailHold:hold},1/60);
  advanceSecondaryMotion(s,motion,1/60);assert.equal(s.releasing,true);const paused=structuredClone(s);
  for(const dt of [0,-1,NaN,Infinity]){advanceSecondaryMotion(s,{x:10000,y:0,size:1},dt);assert.deepEqual(s,paused);}
  if(action==='regrab'){
   const next={x:-65,y:-8,fraction:.5};advanceSecondaryMotion(s,{...motion,tailHold:next},1/60);
   assert.equal(s.holdFraction,.5);assert.ok(Math.hypot(s.points[s.holdIndex*3]-next.x,s.points[s.holdIndex*3+1]-next.y)<1e-8);assert.deepEqual(s.previous,s.points);
  }else{if(action==='hidden')suspendSecondaryMotion(s);advanceSecondaryMotion(s,{...motion,x:action==='teleport'?10000:0},1/60);assert.equal(s.holdFraction,0);}
  assert.equal(s.releasing,false);assert.equal(s.releaseFraction,0);assert.equal(s.releaseIndex,0);
 }
});


test('body-frame transport cannot stretch a released tail under translation or rotation',()=>{
 for(const hz of [30,60,120])for(const tailSway of [1,2])for(const mode of ['translate','rotate','both']){
  const s=createSecondaryMotion(),hold={x:-67.755,y:0,fraction:.73};
  for(let i=0;i<60;i++)advanceSecondaryMotion(s,{x:0,y:0,size:1,tailHold:hold},1/60,{tailSway});
  const p=new Float32Array(49*27),n=new Float32Array(p.length);
  for(let i=1;i<=5*hz;i++){
   advanceSecondaryMotion(s,{x:mode==='rotate'?0:100*i/hz,y:0,heading:mode==='translate'?0:2*i/hz,size:1},1/hz,{tailSway});
   for(let j=1;j<=s.segments;j++){const k=j*3,length=Math.hypot(s.points[k]-s.points[k-3],s.points[k+1]-s.points[k-2],s.points[k+2]-s.points[k-1]);assert.ok(length>3&&length<4,`moving release segment ${j}: ${length}`);}
   writeTailGeometry(s,p,n);let length=0;for(let ring=1;ring<=48;ring++){const k=ring*27,b=k-27;length+=Math.hypot((p[k]+p[k+12]-p[b]-p[b+12])/2,(p[k+1]+p[k+13]-p[b+1]-p[b+13])/2,(p[k+2]+p[k+14]-p[b+2]-p[b+14])/2);}assert.ok(length>85&&length<89,`moving release arc ${length}`);
  }
  assert.equal(s.releasing,false,`release ends under ${mode}, sway${tailSway}`);
 }
});

test('fast 90-degree running turns bend smoothly without constraint-driven tail whipping',()=>{
 for(const hz of [30,60,120]){const s=createSecondaryMotion();let x=0,y=0,last=0,peak=0,maxTipSpeed=0;
  for(let i=0;i<hz*6;i++){const t=i/hz,heading=t<1?0:t<2?(t-1)*Math.PI/2:Math.PI/2;
   if(t<3){x+=Math.cos(heading)*900/hz;y+=Math.sin(heading)*900/hz;}
   advanceSecondaryMotion(s,{x,y,heading,size:2.86},1/hz,{tailSway:1.15,travelSpeed:2.2});
   const tip=s.points.at(-2);if(t>=1){peak=Math.max(peak,Math.abs(tip));maxTipSpeed=Math.max(maxTipSpeed,Math.abs(tip-last)*hz);}last=tip;
  }
  assert.ok(peak>5&&peak<28,`natural bounded follow-through at ${hz} Hz: ${peak}`);
  assert.ok(maxTipSpeed<100,`no rapid side-to-side correction impulses at ${hz} Hz: ${maxTipSpeed}`);
  assert.ok(Math.abs(last)<.01,'tail settles after the turn and stop');
 }
});
