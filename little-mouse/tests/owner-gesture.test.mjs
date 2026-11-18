import test from'node:test';import assert from'node:assert/strict';import{createOwnerGesture}from'../public/owner-gesture.js';
const taps=[[10,10],[1010,10],[1010,758],[10,758]];
function tap(g,[x,y],time,duration=.1,single=true){g.down(1,x,y,1024,768,time,single);return g.up(1,x,y,1024,768,time+duration);}
test('only four brief ordered corner taps open the owner menu',()=>{const g=createOwnerGesture();assert.deepEqual(taps.map((p,i)=>tap(g,p,i*.5)),[false,false,false,true]);});
test('resting paws, simultaneous touches and slow sequences cannot open menu',()=>{for(const duration of [.6,8]){const g=createOwnerGesture();assert.ok(taps.every((p,i)=>!tap(g,p,i*10,duration)));}const g=createOwnerGesture();assert.ok(taps.every((p,i)=>!tap(g,p,i*.5,.1,false)));assert.ok(taps.every((p,i)=>!tap(g,p,i*6)));});
test('wrong order or dragging resets the sequence',()=>{const g=createOwnerGesture();tap(g,taps[0],0);tap(g,taps[2],.5);assert.equal(tap(g,taps[3],1),false);g.down(1,10,10,1024,768,2);assert.equal(g.up(1,40,10,1024,768,2.1),false);});
