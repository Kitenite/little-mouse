import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSurfaceCache,paintSurface,SURFACE_REGIONS,SURFACE_GPU_BYTES} from '../public/coat-surfaces.js';
function context(){const ops=[];return new Proxy({ops,createRadialGradient(){return{addColorStop(...a){ops.push(a);}};}},{set(t,k,v){t[k]=v;ops.push([k,v]);return true;},get(t,k){return k in t?t[k]:(...a)=>ops.push([k,...a]);}});}
test('region detail is deterministic, distinct and bounded',()=>{
 const renders=new Set();for(const region of SURFACE_REGIONS){const a=context(),b=context();paintSurface(a,region);paintSurface(b,region);assert.equal(JSON.stringify(a.ops),JSON.stringify(b.ops));renders.add(JSON.stringify(a.ops));}
 assert.equal(renders.size,6);assert.ok(SURFACE_GPU_BYTES<=3.4*1024*1024);
});
test('cache reuses six shared resources regardless of repeated access and rejects unbounded keys',()=>{
 let allocations=0;const T={CanvasTexture:class{constructor(){allocations++;this.userData={};}},RepeatWrapping:1000};
 const cache=createSurfaceCache(T,()=>({getContext:()=>context()}));
 for(let i=0;i<100;i++)for(const r of SURFACE_REGIONS){const map=cache.get(r);assert.equal(map,cache.get(r));assert.equal(map.userData.mouseSurface,true);}
 assert.equal(allocations,6);assert.equal(cache.size,6);assert.throws(()=>cache.get('seed-999'),RangeError);assert.equal(cache.size,6);
});

test('albedo and relief have independent color spaces and finite cache keys',()=>{
 const T={CanvasTexture:class{constructor(){this.userData={};}},SRGBColorSpace:'srgb',NoColorSpace:'',RepeatWrapping:1000};
 const cache=createSurfaceCache(T,()=>({getContext:()=>context()}));
 for(const region of SURFACE_REGIONS)cache.get(region);
 for(const region of ['ear','tail','nose','paw']){assert.equal(cache.get(region,true).colorSpace,'srgb');assert.equal(cache.get(region).colorSpace,'');assert.notEqual(cache.get(region,true),cache.get(region));}
 assert.equal(cache.size,10);assert.throws(()=>cache.get('body',true),RangeError);
});
