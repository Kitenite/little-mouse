import test from 'node:test';
import assert from 'node:assert/strict';
// Event-wiring test only; this is not browser rendering or real pointer-capture validation.
function target(){const listeners=new Map();return {textContent:'',addEventListener:(n,f)=>listeners.set(n,f),emit(n,e={}){listeners.get(n)?.(e);}};}
test('browser event wiring cancels pointercancel/lostcapture/blur/hide/pause and exposes read-only detached snapshots',async()=>{
 const elements=new Map();for(const id of ['reset','pause','cancel','scenario','run','kinematic-status','planck-status'])elements.set(`#${id}`,target());
 const canvases=[0,1].map(()=>{const c=target(),captured=new Set();return Object.assign(c,{getBoundingClientRect:()=>({left:0,top:0,width:800,height:500}),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>{captured.delete(id);c.emit('lostpointercapture',{pointerId:id});},getContext:()=>new Proxy({},{get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)})});});
 globalThis.window=target();globalThis.document=Object.assign(target(),{querySelector:s=>elements.get(s),querySelectorAll:()=>canvases,hidden:false});let frame;globalThis.requestAnimationFrame=f=>{frame=f;};
 await import('../demo.mjs');const snapshot=()=>window.physicsPrototype.snapshot();
 const down=()=>canvases[0].emit('pointerdown',{pointerId:7,clientX:220,clientY:226});
 for(const event of ['pointercancel','lostpointercapture']){down();assert.equal(snapshot().simulations[0].claims.length,1);canvases[0].emit(event,{pointerId:7});assert.ok(snapshot().simulations.every(s=>!s.claims.length));assert.equal(snapshot().captures,0);}
 down();window.emit('resize');assert.equal(snapshot().captures,0);
 down();window.emit('blur');assert.ok(snapshot().simulations.every(s=>!s.claims.length));
 down();document.hidden=true;document.emit('visibilitychange');assert.equal(snapshot().captures,0);document.hidden=false;
 down();elements.get('#pause').onclick();assert.ok(snapshot().simulations.every(s=>s.paused&&!s.claims.length));elements.get('#pause').onclick();
 down();canvases[0].emit('pointerup',{pointerId:7});assert.equal(snapshot().captures,0);
 elements.get('#reset').onclick();frame(0);frame(16);assert.ok(snapshot().simulations[0].time>0);
 const detached=snapshot();detached.simulations[0].mice[0].x=-100;assert.ok(snapshot().simulations[0].mice[0].x>0);assert.ok(Object.isFrozen(window.physicsPrototype));assert.equal(Object.getOwnPropertyDescriptor(window,'physicsPrototype').writable,false);
 // Deliberately diverge with the matched wall replay, then pick unique far-side/last parts.
 for(const partIndex of [2,7]){
  elements.get('#scenario').value='wall';elements.get('#run').onclick();
  for(let i=0;i<180;i++)frame(32+i*16);
  const before=snapshot();const p=before.simulations[1].mice[0].parts[partIndex];
  canvases[1].emit('pointerdown',{pointerId:19,clientX:p.x,clientY:p.y});
  const claims=snapshot().simulations.map(s=>s.claims[0]);assert.ok(claims.every(c=>c?.partIndex===partIndex));
  assert.ok(Math.abs(claims[0].target.x-claims[1].target.x)>1,'scenario has divergent counterpart positions');
  canvases[1].emit('pointermove',{pointerId:19,clientX:p.x+2,clientY:p.y+2});
  snapshot().simulations.forEach((s,i)=>{assert.ok(Math.abs(s.claims[0].target.x-claims[i].target.x-2)<1e-8);assert.ok(Math.abs(s.claims[0].target.y-claims[i].target.y-2)<1e-8);});
  window.emit('resize');assert.equal(snapshot().captures,0);
 }
 delete globalThis.window;delete globalThis.document;delete globalThis.requestAnimationFrame;
});
