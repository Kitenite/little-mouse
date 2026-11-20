import test from 'node:test';
import assert from 'node:assert/strict';
import {createBodyVisibility} from '../scripts/behavior-visibility.mjs';
import {bodySection} from '../public/body-profile.js';
import {physicalTraits,morphologyPoint,createMouseIdentity,identityControls} from '../public/mouse-identity.js';
const runtime={bodySection,physicalTraits,morphologyPoint};
const visibility=createBodyVisibility(runtime), identity=createMouseIdentity(31);
const mouse=(x=500,y=400,angle=0)=>({x,y,angle,identity});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('all four edges, headings, sizes and viewport aspect ratios',()=>{
 for(const [w,h] of [[1024,768],[390,844]]) for(const size of [.25,1,3])
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5]) {
  const config={size};
  assert.equal(visibility(mouse(w/2,h/2,angle),config,w,h).fraction,1);
  for(const [x,y] of [[0,h/2],[w,h/2],[w/2,0],[w/2,h]]) {
   const r=visibility(mouse(x,y,angle),config,w,h);
   assert.ok(r.valid&&r.fraction>0&&r.fraction<1);
  }
  for(const [x,y] of [[-1000,h/2],[w+1000,h/2],[w/2,-1000],[w/2,h+1000]])
   assert.equal(visibility(mouse(x,y,angle),config,w,h).fraction,0);
 }
});
test('exact half across lateral axis and size-squared denominator',()=>{
 close(visibility(mouse(500,0),{size:1},1024,768).fraction,.5);
 const a=visibility(mouse(),{size:1},1024,768),b=visibility(mouse(),{size:2},1024,768);
 close(b.bodyArea,a.bodyArea*4); close(a.visibleArea,a.bodyArea);
});
test('nose and rear peeks with center outside, correct heading',()=>{
 assert.ok(visibility(mouse(-45,400),{size:1,morphologyVariation:0},1024,768).fraction>0);
 assert.equal(visibility(mouse(-45,400,Math.PI),{size:1,morphologyVariation:0},1024,768).fraction,0);
 assert.ok(visibility(mouse(500,-45,Math.PI/2),{size:1,morphologyVariation:0},1024,768).fraction>0);
 assert.ok(visibility(mouse(-35,400,Math.PI),{size:1,morphologyVariation:0},1024,768).fraction>0);
});
test('four corners reject axis-aligned bounds overlap without polygon overlap',()=>{
 // Thin diagonal rectangle through the injected geometry; its AABB intersects the corner.
 const f=createBodyVisibility({bodySection:()=>({r:1,z:1}),physicalTraits:()=>({}),morphologyPoint:(x,y,z)=>[x-6,y,z]});
 for(const [x,y,angle] of [[-20,-20,-Math.PI/4],[120,-20,Math.PI/4],[-20,120,Math.PI/4],[120,120,-Math.PI/4]])
  assert.equal(f(mouse(x,y,angle),{size:1},100,100).fraction,0);
 for(const [x,y] of [[0,0],[100,0],[0,100],[100,100]])
  assert.ok(f(mouse(x,y),{size:1},100,100).fraction>0);
});
test('all supported morphology control extremes stay finite; tails never inflate body',()=>{
 for(const end of ['min','max']) {
  const config=Object.fromEntries(Object.entries(identityControls).map(([k,v])=>[k,v[end]])); config.size=2;
  for(let seed=0;seed<30;seed++) for(const angle of [0,.7,Math.PI/2,Math.PI]) {
   const r=visibility({...mouse(0,400,angle),identity:createMouseIdentity(seed)},config,1024,768);
   assert.ok(r.valid&&r.fraction>0&&r.fraction<1&&r.bodyArea>0);
  }
 }
 const a=visibility(mouse(-100,400),{size:1,tailLength:.7},1024,768);
 const b=visibility(mouse(-100,400),{size:1,tailLength:1.4},1024,768);
 assert.deepEqual(a,b); assert.equal(a.fraction,0);
});
test('invalid data and degenerate geometry do not count as valid hidden',()=>{
 for(const v of [NaN,Infinity,-Infinity,undefined,'1']) {
  for(const key of ['x','y','angle']) assert.equal(visibility({...mouse(),[key]:v},{size:1},1024,768).valid,false);
  assert.equal(visibility(mouse(),{size:v},1024,768).fraction,null);
 }
 for(const n of [0,-1,NaN,Infinity]) {
  assert.equal(visibility(mouse(),{size:n},1024,768).valid,false);
  assert.equal(visibility(mouse(),{size:1},n,768).valid,false);
  assert.equal(visibility(mouse(),{size:1},1024,n).valid,false);
 }
 assert.equal(visibility({...mouse(),identity:null},{size:1},1024,768).valid,false);
 for(const r of [0,-1,NaN]) {
  const f=createBodyVisibility({...runtime,bodySection:()=>({r,z:1})});
  assert.equal(f(mouse(),{size:1},1024,768).valid,false);
 }
 assert.throws(()=>createBodyVisibility(),TypeError);
 const f=createBodyVisibility({...runtime,morphologyPoint:()=>[NaN,0,0]});
 assert.equal(f(mouse(),{size:1},1024,768).valid,false);
});
test('cache detects in-place identity/config mutations, is bounded, and preserves inputs',()=>{
 let calls=0; const f=createBodyVisibility({...runtime,physicalTraits:(...args)=>{calls++;return physicalTraits(...args);}});
 const m={...mouse(),identity:JSON.parse(JSON.stringify(identity))},config={size:1};
 const before=JSON.stringify([m,config]),a=f(m,config,1024,768);
 assert.deepEqual(f(m,config,1024,768),a);assert.equal(calls,1);assert.equal(JSON.stringify([m,config]),before);
 config.bodyWidth=1.25; assert.notEqual(f(m,config,1024,768).bodyArea,a.bodyArea);assert.equal(calls,2);
 m.identity.traits.bodyWidth=-1;f(m,config,1024,768);assert.equal(calls,3);
 for(let i=0;i<17;i++) f({...mouse(),identity:createMouseIdentity(i)},{size:1},1024,768);
 f(m,config,1024,768);assert.equal(calls,21);
});
test('state/time gates belong to caller and no RNG is consumed',()=>{
 const a=visibility(mouse(),{size:1},1024,768);
 assert.deepEqual(visibility({...mouse(),state:'away',hiddenUntil:Infinity},{size:1},1024,768),a);
 const original=Math.random;Math.random=()=>{throw Error('unexpected RNG');};
 try {assert.deepEqual(visibility(mouse(),{size:1},1024,768),a);} finally {Math.random=original;}
});
test('injected archive geometry controls denominator and exact rectangle clipping',()=>{
 const make=r=>createBodyVisibility({bodySection:()=>({r,z:1}),physicalTraits:()=>({}),morphologyPoint:(x,y,z)=>[x-6,y,z]});
 const f=make(10),g=make(20);
 close(f(mouse(0,50),{size:1},100,100).bodyArea,1800);
 close(f(mouse(0,50),{size:1},100,100).fraction,.5);
 close(f(mouse(0,0),{size:1},100,100).fraction,.25);
 close(g(mouse(50,50),{size:1},100,100).bodyArea,3600);
 close(f(mouse(-45,50),{size:1},100,100).fraction,0);
});
