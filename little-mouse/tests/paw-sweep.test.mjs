import test from 'node:test';
import assert from 'node:assert/strict';
import {sweepPaws,constrainPaws} from '../public/contact.js';

test('fast travel cannot cross a live paw even when both endpoints are outside',()=>{
 for(const angle of [0,.7,2.1]){
  const c=Math.cos(angle),s=Math.sin(angle),m={x:200*c,y:200*s};
  sweepPaws(m,-200*c,-200*s,[{x:0,y:0}],50);
  assert.ok(Math.abs(Math.hypot(m.x,m.y)-50)<1e-8);
  assert.ok(m.x*c+m.y*s<0,'stops at near boundary');
 }
});
test('sweep retains tangential/outward travel, held pins and nonphysical memory',()=>{
 for(const [start,end,paw,hold] of [
  [[-100,50],[100,50],{x:0,y:0},false],
  [[50,0],[100,0],{x:0,y:0},false],
  [[-100,0],[100,0],{x:0,y:0,recent:true},false],
  [[-100,0],[100,0],{x:0,y:0},true]
 ]){
  const m={x:end[0],y:end[1],hold};sweepPaws(m,...start,[paw],50);
  assert.deepEqual([m.x,m.y],end);
 }
});
test('new overlap uses bounded recovery and multiple paws stop at earliest intersection',()=>{
 const m={x:10,y:0,vx:0,vy:0};sweepPaws(m,0,0,[{x:0,y:0}],50);
 assert.equal(m.x,10);constrainPaws(m,[{x:0,y:0}],50,1/120);
 assert.ok(m.x>10&&m.x<=11.5);
 for(const paws of [[{x:0,y:0},{x:100,y:0}],[{x:100,y:0},{x:0,y:0}]]){
  const n={x:200,y:0};sweepPaws(n,-200,0,paws,50);assert.equal(n.x,-50);
 }
});
