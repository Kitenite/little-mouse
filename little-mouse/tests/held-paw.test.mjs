import{test}from'node:test';import assert from'node:assert/strict';import{applyHeldPawTarget}from'../public/leg-rig.js';
test('only the contacted paw uses the held target',()=>{const held={index:2,x:16,y:-14,z:3};for(let i=0;i<4;i++){const target=[22,16,8];const active=applyHeldPawTarget(target,i,held);assert.equal(active,i===2);assert.deepEqual(target,i===2?[16,-14,3]:[22,16,8]);}});
test('invalid held coordinates cannot poison limb IK',()=>{const target=[12,14,3];assert.equal(applyHeldPawTarget(target,1,{index:1,x:NaN,y:0,z:3}),false);assert.deepEqual(target,[12,14,3]);});
