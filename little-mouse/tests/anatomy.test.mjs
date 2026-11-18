import{test}from'node:test';import assert from'node:assert/strict';
import{createArticulation,advanceArticulation,articulatePoint,unarticulatePoint}from'../public/anatomy.js';
import{createMouseIdentity,physicalTraits}from'../public/mouse-identity.js';
test('head anticipates turns and pelvis follows independently within bounded ranges',()=>{
 const pose=createArticulation(physicalTraits(createMouseIdentity(3)));
 advanceArticulation(pose,{turn:1,moving:true},1/60,{headTurnAmount:1.5,pelvisTurnAmount:1.5});assert.ok(pose.head<0&&pose.pelvis>0);assert.ok(Math.abs(pose.head)>pose.pelvis);
 for(let i=0;i<500;i++)advanceArticulation(pose,{turn:10,moving:true},1/60,{headTurnAmount:1.5,pelvisTurnAmount:1.5});assert.ok(Math.abs(pose.head)<=.32&&Math.abs(pose.pelvis)<=.22);
 const held={...pose};advanceArticulation(pose,{turn:-1,held:true},.1);assert.deepEqual(pose,held);
 for(let i=0;i<500;i++)advanceArticulation(pose,{turn:0,moving:false},1/60);assert.ok(Math.abs(pose.head)+Math.abs(pose.pelvis)<1e-8);
});
test('body and head picking invert extreme articulated surfaces without seams',()=>{
 for(const scale of [.75,1,1.35])for(const head of [-.32,0,.32])for(const pelvis of [-.22,0,.22]){
  const pose={head,pelvis,scale,neck:17*scale,hip:-14*scale};
  for(let x=-150;x<=65;x+=2.7)for(const y of [-24,0,24]){const point=articulatePoint(x,y,5,pose),inverse=unarticulatePoint(point[0],point[1],pose);assert.ok(Math.hypot(inverse[0]-x,inverse[1]-y)<1e-5);}
  for(const seam of [-24,-4,10,30]){const left=articulatePoint(seam*scale-1e-5,11,4,pose),right=articulatePoint(seam*scale+1e-5,11,4,pose);assert.ok(Math.hypot(left[0]-right[0],left[1]-right[1])<.0001);}
 }
});
test('bounded waist curvature is invertible through combined regional and turn extremes',()=>{
 for(const scale of [.7,1.4])for(const head of [-.32,.32])for(const pelvis of [-.22,.22])for(const spine of [-.18,.18]){
  const pose={head,pelvis,spine,scale,neck:17*scale,hip:-14*scale};
  for(let x=-180;x<75;x+=2.3)for(const y of [-24,0,24]){
   const p=articulatePoint(x,y,7,pose),inverse=unarticulatePoint(p[0],p[1],pose);
   assert.ok(p.every(Number.isFinite));assert.ok(Math.hypot(inverse[0]-x,inverse[1]-y)<1e-5,`${x},${y},${spine}`);
  }
 }
});
test('spine participates in both turns and gait but holds and pause freeze all segments',()=>{
 const pose=createArticulation(physicalTraits(createMouseIdentity(2)));
 for(const turn of [-1,1]){
  for(let i=0;i<90;i++)advanceArticulation(pose,{turn,moving:true,phase:1,activity:1},1/60);
  assert.equal(Math.sign(pose.spine),-Math.sign(turn));assert.ok(Math.abs(pose.spine)<=.18);
  const before={...pose};for(const dt of [0,NaN,-1])advanceArticulation(pose,{turn:-turn},dt);assert.deepEqual(pose,before);
  for(const part of ['head','body','paw','tail']){advanceArticulation(pose,{held:true,turn:-turn,part},.1);assert.deepEqual(pose,before);}
 }
 const off=createArticulation({bodyLength:1});advanceArticulation(off,{moving:true,phase:1,activity:1},.1,{spineBendAmount:0});assert.equal(off.spine,0);
 advanceArticulation(off,{moving:true,phase:1,activity:1},.1);assert.ok(off.spine>0);
});
