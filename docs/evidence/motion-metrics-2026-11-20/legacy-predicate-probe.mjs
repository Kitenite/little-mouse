import assert from 'node:assert/strict';
// Minimal reproduction of the inspected benchmark predicate; no renderer is instantiated.
const w=1024,h=768,time=1,dt=1/30;
const old={state:'active',x:500,y:300,hiddenUntil:2};
const current={state:'active',x:510,y:300,hiddenUntil:0};
const on=current.state==='active'&&current.hiddenUntil<=time&&current.x>=0&&current.x<=w&&current.y>=0&&current.y<=h;
const rewarded=on&&old.state==='active'&&old.x>=0&&old.x<=w&&old.y>=0&&old.y<=h;
assert.equal(rewarded,true);
assert.equal(old.hiddenUntil<=time-dt,false);
console.log(JSON.stringify({case:'previous endpoint hidden',legacyPredicateRewards:rewarded,previousEndpointActuallyVisible:false,pathCredit:10/w}));
// The neutral body nose at local x=48 extends onto the viewport with center x=-10.
const center={x:-10,y:300},localNose={x:48,y:0},size=1,angle=0;
const projected={x:center.x+size*(localNose.x*Math.cos(angle)+localNose.y*Math.sin(angle)),y:center.y+size*(localNose.x*Math.sin(angle)-localNose.y*Math.cos(angle))};
assert(projected.x>0&&projected.x<w);
console.log(JSON.stringify({case:'neutral nose peek',centerVisible:false,projectedNose:projected,scope:'geometry counterexample; not raster evidence'}));
