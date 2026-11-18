import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.js';
import {createLimbSurface,addLimbSurfaceHair,LIMB_RINGS,LIMB_SIDES} from '../public/limb-surface.js';
import {LEG_LAYOUT,solveLeg} from '../public/leg-kinematics.js';
import {identityRandom} from '../public/mouse-identity.js';
test('continuous envelope stays finite, tapered, closed and attached through IK extremes',()=>{
 for(const source of LEG_LAYOUT)for(const width of [.7,1.35])for(const length of [.64,1.56]){
  const layout={...source,width,upper:source.upper*length,lower:source.lower*length};
  const surface=createLimbSurface(T,new T.Group(),new T.MeshBasicMaterial(),layout),arrays=[surface.positions,surface.normals,surface.geometry.attributes.uv.array];
  addLimbSurfaceHair(T,new T.Group(),surface,new T.LineBasicMaterial(),1.5,identityRandom(6));const hairArray=surface.hair.data;
  for(let frame=0;frame<60;frame++){
   const target=frame===0?layout.anchor:[Math.sin(frame)*80,Math.cos(frame)*70,3+Math.sin(frame*.3)*25],solved=solveLeg(layout.anchor,target,layout.upper,layout.lower,layout.bend);
   const snapshot=JSON.stringify(solved);surface.update(layout.anchor,solved.joint,solved.foot);assert.equal(JSON.stringify(solved),snapshot,'surface cannot alter IK');
   assert.ok(surface.positions.every(Number.isFinite));assert.ok(surface.normals.every(Number.isFinite));assert.ok(hairArray.every(Number.isFinite));
   for(let axis=0;axis<3;axis++){assert.ok(Math.abs(surface.centers[axis]-layout.anchor[axis])<1e-5);assert.ok(Math.abs(surface.centers[(LIMB_RINGS-1)*3+axis]-solved.foot[axis])<1e-5);}
   for(let ring=0;ring<LIMB_RINGS;ring++){const k=ring*(LIMB_SIDES+1)*3;for(let a=0;a<3;a++)assert.ok(Math.abs(surface.positions[k+a]-surface.positions[k+LIMB_SIDES*3+a])<1e-5,'welded wrap seam');if(ring)assert.ok(surface.radius[ring]<=surface.radius[ring-1]);}
  }
  assert.equal(surface.positions,arrays[0]);assert.equal(surface.normals,arrays[1]);assert.equal(surface.geometry.attributes.uv.array,arrays[2]);assert.equal(surface.hair.data,hairArray);
  assert.equal(surface.geometry.index.count,((LIMB_RINGS-1)*LIMB_SIDES*2+LIMB_SIDES*2)*3);
  surface.geometry.dispose();surface.hair.geometry.dispose();surface.mesh.material.dispose();surface.hair.mesh.material.dispose();
 }
});
test('hairiness changes bounded hair allocation only at construction',()=>{for(const density of [0,.7,1.5]){const surface=createLimbSurface(T,new T.Group(),new T.MeshBasicMaterial(),LEG_LAYOUT[0]);addLimbSurfaceHair(T,new T.Group(),surface,new T.LineBasicMaterial(),density,identityRandom(1));assert.equal(surface.hair.roots.length,Math.round(300*density));assert.ok(surface.hair.roots.length<=520);surface.geometry.dispose();surface.hair.geometry.dispose();surface.mesh.material.dispose();surface.hair.mesh.material.dispose();}});
