import{test}from'node:test';
import assert from'node:assert/strict';
import{createMouseIdentity,ensureMouseIdentity,physicalTraits,physicalBounds,morphologyPoint,unmorphologyPoint,morphologyLeg,identityControls,identityDefaults}from'../public/mouse-identity.js';
import{COATS}from'../public/coat-palette.js';
import{LEG_LAYOUT,solveLeg}from'../public/leg-kinematics.js';
const distance=(a,b)=>Math.hypot(...a.map((value,i)=>value-b[i]));
test('seeded individuals retain anatomy and coat through hiding and nonfatal reactions',()=>{
 const mouse={state:'active',identity:createMouseIdentity(21)},first=mouse.identity;
 assert.deepEqual(first,createMouseIdentity(21));
 for(const state of ['away','active','hurt','away','active']){mouse.state=state;assert.equal(ensureMouseIdentity(mouse),first);}
 mouse.state='defeated';assert.equal(ensureMouseIdentity(mouse),first);
 mouse.state='away';const replacement=ensureMouseIdentity(mouse);assert.notEqual(replacement,first);
 mouse.state='active';assert.equal(ensureMouseIdentity(mouse),replacement);
});
test('a population has stable natural coat families and independent physical metrics',()=>{
 const population=Array.from({length:200},(_,i)=>createMouseIdentity(i+1));
 assert.equal(new Set(population.map(mouse=>mouse.id)).size,200);
 assert.equal(new Set(population.map(mouse=>mouse.coat)).size,COATS.length);assert.equal(new Set(population.map(mouse=>mouse.profile)).size,6);
 for(const key of Object.keys(population[0].traits))assert.equal(new Set(population.map(mouse=>mouse.traits[key])).size,200,key);
 const neutral=physicalTraits(population[0],{morphologyVariation:0,coatVariation:0});
 for(const key of Object.keys(population[0].traits))assert.equal(neutral[key],identityDefaults[key]);
 assert.equal(neutral.coat.name,'agouti');
});
test('all morphologies have a continuous body and exactly reversible hit coordinates',()=>{
 for(let seed=1;seed<70;seed++)for(const extreme of ['min','max']){
  const config=Object.fromEntries(Object.entries(identityControls).map(([key,value])=>[key,value[extreme]])),identity=createMouseIdentity(seed),traits=physicalTraits(identity,config),bounds=physicalBounds(identity,config);
  for(let x=-39;x<52;x+=.7){const point=morphologyPoint(x,12,20,traits),inverse=unmorphologyPoint(point[0],point[1],traits);assert.ok(Math.abs(inverse[0]-x)<1e-10);assert.ok(Math.abs(inverse[1]-12)<1e-10);assert.ok(point[0]>=-bounds.rear&&point[0]<=bounds.front);}
  for(const original of LEG_LAYOUT){const leg=morphologyLeg(original,traits),out=solveLeg(leg.anchor,[leg.x,leg.y,leg.z],leg.upper,leg.lower,leg.bend);assert.ok(Math.abs(distance(leg.anchor,out.joint)-leg.upper)<1e-8);assert.ok(Math.abs(distance(out.joint,out.foot)-leg.lower)<1e-8);assert.deepEqual(leg.anchor,morphologyPoint(...original.anchor,traits));}
 }
});
test('settings reject nonfinite and out of bounds values',()=>{
 const traits=physicalTraits(createMouseIdentity(7),{morphologyVariation:0,bodyLength:Infinity,tailLength:100,eyeSize:-1});assert.equal(traits.bodyLength,identityDefaults.bodyLength);assert.equal(traits.tailLength,identityControls.tailLength.max);assert.equal(traits.eyeSize,identityControls.eyeSize.min);
});
