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
