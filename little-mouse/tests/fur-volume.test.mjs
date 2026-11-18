import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.js';
import {createFurVolume,furVolumeMaterial,BODY_TUFT_LIMIT,LIMB_TUFT_LIMIT} from '../public/fur-volume.js';
import {identityRandom} from '../public/mouse-identity.js';
import {createLimbSurface} from '../public/limb-surface.js';
import {LEG_LAYOUT,solveLeg} from '../public/leg-kinematics.js';
function checkRoots(volume,source){const p=source.attributes.position.array,n=source.attributes.normal.array,uv=source.attributes.uv.array,out=volume.geometry.attributes.position.array,outUV=volume.geometry.attributes.uv.array;
 for(let i=0;i<volume.lengths.length;i++){const root=[0,0,0],normal=new T.Vector3(),sampleUV=[0,0];for(let k=0;k<3;k++){const idx=volume.roots[i*3+k],w=volume.weights[i*3+k];for(let a=0;a<3;a++)root[a]+=p[idx*3+a]*w;normal.x+=n[idx*3]*w;normal.y+=n[idx*3+1]*w;normal.z+=n[idx*3+2]*w;for(let a=0;a<2;a++)sampleUV[a]+=uv[idx*2+a]*w;}normal.normalize();for(let a=0;a<3;a++)assert.ok(Math.abs((out[i*15+a]+out[i*15+3+a])*.5-root[a]-normal.getComponent(a)*volume.lengths[i]*.015)<2e-5,'root centroid follows barycentric source');for(let k=0;k<5;k++)for(let a=0;a<2;a++)assert.ok(Math.abs(outUV[i*10+k*2+a]-sampleUV[a])<1e-6,'all tuft vertices sample the root coat UV');}
}
test('opaque tufts attach at barycentric roots and preserve rest coat samples through limb bending',()=>{
 const surface=createLimbSurface(T,new T.Group(),new T.MeshStandardMaterial(),LEG_LAYOUT[0]),material=furVolumeMaterial(T,surface.mesh.material);
 const volume=createFurVolume(T,surface.geometry,material,{count:520,random:identityRandom(111),triangleCount:480});surface.volume=volume;
 const array=volume.geometry.attributes.position.array,uv=volume.geometry.attributes.uv.array;
 for(let f=0;f<30;f++){const solved=solveLeg(LEG_LAYOUT[0].anchor,[f-20,Math.sin(f)*50,3],18,20,LEG_LAYOUT[0].bend);surface.update(LEG_LAYOUT[0].anchor,solved.joint,solved.foot);checkRoots(volume,surface.geometry);assert.ok(array.every(Number.isFinite));}
 assert.equal(array,volume.geometry.attributes.position.array);assert.equal(uv,volume.geometry.attributes.uv.array);assert.equal(material.transparent,false);assert.equal(material.depthWrite,true);assert.equal(volume.mesh.castShadow,false);
 surface.geometry.dispose();surface.mesh.material.dispose();volume.geometry.dispose();material.dispose();
});
test('body root sampling is deterministic, bounded and zero density hides the draw',()=>{
 const source=new T.SphereGeometry(10,24,16),material=new T.MeshStandardMaterial();
 const a=createFurVolume(T,source,material,{count:7200,random:identityRandom(81),body:true}),b=createFurVolume(T,source,material,{count:7200,random:identityRandom(81),body:true});a.update();b.update();assert.deepEqual(a.roots,b.roots);assert.deepEqual(a.geometry.attributes.position.array,b.geometry.attributes.position.array);checkRoots(a,source);assert.equal(a.geometry.index.count,7200*9);
 const empty=createFurVolume(T,source,material,{count:0,random:identityRandom(1),body:true});empty.update();assert.equal(empty.mesh.visible,false);assert.equal(empty.geometry.index.count,0);assert.equal((BODY_TUFT_LIMIT+4*LIMB_TUFT_LIMIT)*3,38640);
 for(const volume of [a,b,empty])volume.geometry.dispose();source.dispose();material.dispose();
});
test('Fuzziness changes spread and loft independently of root identity, count and nominal length',()=>{
 const source=new T.SphereGeometry(10,24,16),material=new T.MeshStandardMaterial();
 const make=softness=>createFurVolume(T,source,material,{count:300,random:identityRandom(86),length:1,softness,body:true});const sleek=make(0),fuzzy=make(1);sleek.update();fuzzy.update();
 assert.deepEqual(sleek.roots,fuzzy.roots);assert.deepEqual(sleek.weights,fuzzy.weights);assert.deepEqual(sleek.lengths,fuzzy.lengths);assert.equal(sleek.geometry.index.count,fuzzy.geometry.index.count);assert.ok(fuzzy.widths.every((v,i)=>v>sleek.widths[i]*2));
 const a=sleek.geometry.attributes.position.array,b=fuzzy.geometry.attributes.position.array;let moved=0;for(let i=0;i<300;i++)moved+=Math.hypot(a[i*15+12]-b[i*15+12],a[i*15+13]-b[i*15+13],a[i*15+14]-b[i*15+14]);assert.ok(moved/300>.5);sleek.geometry.dispose();fuzzy.geometry.dispose();source.dispose();material.dispose();
});
