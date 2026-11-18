import{test}from'node:test';import assert from'node:assert/strict';
import * as T from'../public/vendor/three.module.js';
import{LEG_LAYOUT,solveLeg,legTarget}from'../public/leg-kinematics.js';
import{createLegRig,applyActivityTarget}from'../public/leg-rig.js';
import{advanceGait,footPose}from'../public/gait.js';
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
test('every limb stays connected through full stride, turns, limp and nibbling',()=>{
 for(const leg of LEG_LAYOUT)for(const turn of[-1,0,1])for(const limp of[false,true])for(const nibble of[0,.5,1])for(let f=0;f<120;f++){
  const pose=footPose({phase:f/120*Math.PI*2,activity:1,reach:26,stepHeight:2},leg.phase);
  const result=solveLeg(leg.anchor,legTarget(leg,pose,{turn,limp,nibble,time:f/60}),leg.upper,leg.lower,leg.bend);
  assert.ok(Math.abs(distance(leg.anchor,result.joint)-leg.upper)<1e-8);
  assert.ok(Math.abs(distance(result.joint,result.foot)-leg.lower)<1e-8);
  assert.ok(result.foot.every(Number.isFinite));assert.ok(result.foot[2]>=2.99);
 }
});
test('IK projects unreachable and degenerate targets without stretching bones',()=>{
 for(const leg of LEG_LAYOUT)for(const target of[leg.anchor,[1000,2000,-1000],[0,0,0]]){
  const result=solveLeg(leg.anchor,target,leg.upper,leg.lower,leg.bend);
  assert.ok(Math.abs(distance(leg.anchor,result.joint)-leg.upper)<1e-8);
  assert.ok(Math.abs(distance(result.joint,result.foot)-leg.lower)<1e-8);
  assert.ok(distance(leg.anchor,result.foot)<=leg.upper+leg.lower);
 }
});
test('rendered upper/lower meshes overlap anchored joints and paw on every gait phase',()=>{
 const group=new T.Group(),sphere=new T.SphereGeometry(1,8,6),material=new T.MeshBasicMaterial();
 const ellipsoid=(parent,mat,x,y,z,sx,sy,sz)=>{const mesh=new T.Mesh(sphere,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;};
 const rig=createLegRig(T,group,{fur:material,skin:material},ellipsoid),gait={phase:0,activity:0,cadence:0,reach:0};
 for(let f=0;f<150;f++){
  advanceGait(gait,1200,2.2,true,1/60,{gaitCadence:6,strideLength:1.5,stepHeight:2});
  rig.animate(gait,{turn:Math.sin(f),limp:f>50,nibble:f>100?1:0,time:f/60});group.updateMatrixWorld(true);
  for(const leg of rig.legs){
   for(const [mesh,a,b]of[[leg.upper,leg.layout.anchor,leg.solution.joint],[leg.lower,leg.solution.joint,leg.solution.foot]]){
    const start=new T.Vector3(0,-1,0).applyMatrix4(mesh.matrixWorld).toArray(),end=new T.Vector3(0,1,0).applyMatrix4(mesh.matrixWorld).toArray();
    assert.ok(distance(start,a)<.351);assert.ok(distance(end,b)<.351);
   }
   assert.ok(distance(leg.paw.position.toArray(),leg.solution.foot)<1e-9);
   assert.deepEqual(leg.shoulder.position.toArray(),leg.layout.anchor);
  }
 }
 sphere.dispose();material.dispose();
});

test('grooming, hindleg scratching, stretching and rolling preserve attached bone lengths',()=>{for(const kind of['groom','scratch','stretch','roll'])for(const side of[-1,1])for(let frame=0;frame<120;frame++)for(const [index,leg]of LEG_LAYOUT.entries()){const target=[leg.x,leg.y,leg.z];applyActivityTarget(target,leg,index,{kind,side,elapsed:frame/60,weight:Math.sin(frame/120*Math.PI)});const result=solveLeg(leg.anchor,target,leg.upper,leg.lower,leg.bend);assert.ok(result.foot.every(Number.isFinite));assert.ok(Math.abs(distance(leg.anchor,result.joint)-leg.upper)<1e-8);assert.ok(Math.abs(distance(result.joint,result.foot)-leg.lower)<1e-8);}});
