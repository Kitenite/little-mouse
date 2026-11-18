import test from 'node:test';
import assert from 'node:assert/strict';
import {groundMarkPose,GroundResponse} from '../public/environment3d.js';
import * as T from '../public/vendor/three.module.js';
test('grass bends around a fixed root, soil settles freely, and footprints remain fixed',()=>{
 const p={x:20,y:30,rx:1,ry:5,angle:.7,kind:2,at:0},out={};
 const rootX=p.x-Math.sin(p.angle)*p.ry,rootY=p.y+Math.cos(p.angle)*p.ry;
 for(const hz of [30,60,120])for(let n=0;n<=hz;n++){
  assert.equal(groundMarkPose(p,n/hz,'grass',out),out);
  assert.ok(Math.abs(out.x-Math.sin(out.angle)*out.ry-rootX)<1e-10);
  assert.ok(Math.abs(out.y+Math.cos(out.angle)*out.ry-rootY)<1e-10);
  assert.ok(out.angle>=p.angle&&out.angle<=p.angle+.3);assert.equal(out.kind,3);
 }
 groundMarkPose(p,.2,'soil',out);assert.equal(out.kind,2);assert.ok(Math.hypot(out.x-p.x,out.y-p.y)<=3);
 groundMarkPose({...p,kind:0},.2,'grass',out);assert.equal(out.x,p.x);assert.equal(out.y,p.y);assert.equal(out.angle,p.angle);
});
test('material discriminator reaches fixed pooled shader attributes and disable hides mesh',()=>{
 const g=new GroundResponse(new T.Scene()),c={background:'grass',size:1,environmentStrength:1};
 g.memory.begin(c,0,100,100);g.memory.add(30,30,1,5,.7,2);g.update([],[],c,.1,100,100);
 assert.equal(g.style.getZ(0),3);assert.equal(g.mesh.geometry.instanceCount,160);
 const shape=g.shape.array,style=g.style.array;g.update([],[],c,.2,100,100);assert.equal(g.shape.array,shape);assert.equal(g.style.array,style);
 g.update([],[],{...c,environmentStrength:0},.2,100,100);assert.equal(g.mesh.visible,false);assert.equal(g.memory.active,0);
});
