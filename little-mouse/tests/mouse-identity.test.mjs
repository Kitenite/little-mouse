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
test('persisted pre-regional identities keep coat and finite morphology after reload',()=>{
 const fresh=createMouseIdentity(314159),legacy=JSON.parse(JSON.stringify(fresh));
 for(const key of ['ribcageWidth','waistWidth','pelvisWidth'])delete legacy.traits[key];
 const before=JSON.stringify(legacy),traits=physicalTraits(legacy,{waistWidth:.9});
 assert.equal(traits.waistWidth,.9);assert.equal(traits.ribcageWidth,1);assert.equal(traits.pelvisWidth,1);
 assert.equal(traits.coat.name,physicalTraits(fresh).coat.name);assert.ok(Object.values(physicalBounds(legacy)).every(Number.isFinite));
 for(let x=-39;x<51;x+=1){const p=morphologyPoint(x,12,20,traits),inverse=unmorphologyPoint(p[0],p[1],traits);assert.ok(p.every(Number.isFinite));assert.ok(Math.hypot(inverse[0]-x,inverse[1]-12)<1e-10);}
 assert.equal(JSON.stringify(legacy),before);
});
test('ear variation is stable, asymmetric and includes large soft individuals without altering saved identity',()=>{
 const population=Array.from({length:300},(_,i)=>physicalTraits(createMouseIdentity(i+1),{morphologyVariation:1}));
 assert.ok(population.some(t=>Math.max(...t.ears.map(e=>e.size))>1.5));
 assert.ok(population.some(t=>Math.abs(t.ears[0].size-t.ears[1].size)>.2));
 assert.ok(population.some(t=>t.ears.some(e=>e.flop>.7)));
 const identity=createMouseIdentity(71),saved=JSON.stringify(identity);
 assert.deepEqual(physicalTraits(identity).ears,physicalTraits(JSON.parse(saved)).ears);
 assert.equal(JSON.stringify(identity),saved);
 const neutral=physicalTraits(identity,{morphologyVariation:0});
 assert.deepEqual(neutral.ears,[{size:1,width:1,flop:0,tilt:0},{size:1,width:1,flop:0,tilt:0}]);
});
test('limb proportions vary independently by pair with restrained asymmetry and stable identity',()=>{
 const identity=createMouseIdentity(72),before=JSON.stringify(identity),t=physicalTraits(identity,{morphologyVariation:1});
 assert.deepEqual(t.limbs,physicalTraits(JSON.parse(before),{morphologyVariation:1}).limbs);
 assert.equal(JSON.stringify(identity),before);
 assert.notEqual(t.limbs[0].length,t.limbs[2].length);
 for(let i=0;i<4;i++){
  const leg=morphologyLeg(LEG_LAYOUT[i],t),base=LEG_LAYOUT[i];
  const total=(base.upper+base.lower)*t.legLength*(i<2?1:t.armLength)*t.limbs[i].length;
  assert.ok(Math.abs(leg.upper+leg.lower-total)<1e-10);
  assert.ok(leg.upper>0&&leg.lower>0&&leg.pawLength>0&&leg.pawWidth>0);
 }
 for(const i of [0,2])assert.ok(Math.abs(t.limbs[i].length/t.limbs[i+1].length-1)<.052);
 const neutral=physicalTraits(identity,{morphologyVariation:0});
 for(let i=0;i<4;i++){
  const leg=morphologyLeg(LEG_LAYOUT[i],neutral);
  assert.equal(leg.upper,LEG_LAYOUT[i].upper);assert.equal(leg.lower,LEG_LAYOUT[i].lower);
  assert.equal(leg.pawLength,1);assert.equal(leg.pawWidth,1);
 }
});
