import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avoidPaws,createContacts,recordPointer,endContact,updateContacts,removePointer,beginContact,cancelContact} from '../public/contact.js';
import {stepMice} from '../public/physics.js';
const config={size:1,speed:1.2,variation:false,pawAvoidanceRadius:50};
const mouse=(seed=0)=>({x:0,y:0,angle:0,targetX:800,targetY:0,seed,state:'active',hiddenUntil:0,restUntil:0,vx:0,vy:0});
const steer=(m,paws)=>avoidPaws(m,m.targetX-m.x,m.targetY-m.y,paws,89);

test('centered paw produces mirrored actual paths and progress at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){
  const a=mouse(0),b=mouse(1),paw={pointerId:1,x:200,y:0};let separation=0,min=Infinity;
  for(let i=0;i<6*hz;i++){
   for(const m of [a,b])stepMice([m],config,i/hz,1/hz,2000,2000,[paw]);
   assert.ok(Math.abs(a.x-b.x)<1e-8);assert.ok(Math.abs(a.y+b.y)<1e-8);
   separation=Math.max(separation,a.y);min=Math.min(min,Math.hypot(a.x-200,a.y));
  }
  assert.ok(separation>90);assert.ok(min>=89-1e-6);assert.ok(a.x>700);
 }
});

test('pointer refresh and centerline jitter retain the chosen steering side',()=>{
 const m=mouse(),c=createContacts();recordPointer(c,1,200,-.2,0);
 assert.ok(steer(m,c.obstacles.values())[1]>0);
 for(let i=1;i<200;i++){
  recordPointer(c,1,200,i%2?.2:-.2,i/120);
  const [dx,dy]=steer(m,c.obstacles.values());assert.ok(dx>0&&dy>100);
 }
 // The input steering direction may weave without moving the actual goal.
 assert.ok(avoidPaws(m,800,150,c.obstacles.values(),89)[1]>100);
});

test('a second nonoverlapping paw cannot steal a commitment as ordering changes',()=>{
 const m=mouse(),first={pointerId:1,x:230,y:-1},second={pointerId:2,x:150,y:1};
 const initial=steer(m,[first]);
 for(let i=0;i<60;i++)assert.deepEqual(steer(m,i%2?[first,second]:[second,first]),initial);
 assert.ok(steer(m,[second])[1]<0,'removal permits the next obstacle to choose its side');
});

test('live overlap immediately overrides a committed detour, even with zero goal distance',()=>{
 const m=mouse(),first={pointerId:1,x:200,y:-1};assert.ok(steer(m,[first])[1]>0);
 const overlap={pointerId:2,x:0,y:20};
 assert.deepEqual(steer(m,[first,overlap]),[0,-149]);
 m.targetX=m.x;m.targetY=m.y;assert.deepEqual(steer(m,[first,overlap]),[0,-149]);
});

test('release preserves side while memory shrinks, expires, and pointer reuse starts fresh',()=>{
 const m=mouse(),c=createContacts();recordPointer(c,1,200,-.2,0);const before=steer(m,c.obstacles.values());
 recordPointer(c,1,200,.2,.1);endContact(c,1,1,2000,2000,1,config);
 const released=steer(m,c.obstacles.values());assert.ok(released[1]>0);
 updateContacts(c,3);const faded=steer(m,c.obstacles.values());assert.ok(faded[1]>0&&faded[1]<released[1]);assert.ok(before[1]>faded[1]);
 updateContacts(c,5);assert.deepEqual(steer(m,c.obstacles.values()),[800,0]);
 recordPointer(c,1,200,.2,6);assert.ok(steer(m,c.obstacles.values())[1]<0);
 removePointer(c,1);assert.deepEqual(steer(m,c.obstacles.values()),[800,0]);
});

test('passed paw and changed destination discard the old commitment',()=>{
 const p={pointerId:1,x:200,y:-1},m=mouse();steer(m,[p]);
 m.x=250;assert.deepEqual(steer(m,[{...p,recent:true}]),[550,0]);
 m.x=0;steer(m,[p]);m.targetX=-800;assert.deepEqual(steer(m,[p]),[-800,0]);
 m.targetX=800;assert.ok(steer(m,[{...p,y:1}])[1]<0);
});

test('bounded accumulated travel releases a stale side without a physics clock',()=>{
 const m=mouse(),p={pointerId:1,x:200,y:-1};steer(m,[p]);p.y=1;
 for(let i=0;i<30;i++){m.x=i%2?-100:0;steer(m,[p]);}
 m.x=0;assert.ok(steer(m,[p])[1]<0);
});

test('held mice ignore all paw steering and body pins retain precedence in physics',()=>{
 const m=mouse(),p={pointerId:1,x:200,y:-1};steer(m,[p]);
 for(const part of ['head','body','forepaw','hindpaw','tail']){
  m.hold={part};assert.deepEqual(steer(m,[{pointerId:2,x:0,y:1},p]),[800,0]);
 }
 delete m.hold;assert.ok(steer(m,[{...p,y:1}])[1]<0,'hold clears the prior commitment');
 const c=createContacts();assert.ok(beginContact(c,m,{part:'body',localX:0,localY:0},3,0,0,0,config,1));
 for(let i=0;i<60;i++)stepMice([m],config,i/60,1/60,2000,2000,[{pointerId:2,x:0,y:1}]);
 assert.deepEqual([m.x,m.y,m.vx,m.vy],[0,0,0,0]);
});


test('actual travel tolerates pointer jitter and passes multiple paws',()=>{
 const m=mouse(),c=createContacts();m.targetX=1100;
 let min=Infinity,peak=0;
 for(let i=0;i<600;i++){
  recordPointer(c,1,200,i%2?.2:-.2,i/60);
  recordPointer(c,2,600,i%2?-.2:.2,i/60);
  stepMice([m],config,i/60,1/60,2000,2000,c.obstacles.values());
  for(const p of c.paws.values())min=Math.min(min,Math.hypot(m.x-p.x,m.y-p.y));
  peak=Math.max(peak,Math.abs(m.y));assert.ok(Number.isFinite(m.angle));
 }
 assert.ok(m.x>1000);assert.ok(min>=89-1e-6);assert.ok(peak<250,'bounded detours, no runaway spiral');
});

test('claim then cancellation clears commitment even when physics bypasses steering',()=>{
 const m=mouse(),c=createContacts(),p={pointerId:1,x:200,y:-1};assert.ok(steer(m,[p])[1]>0);
 assert.ok(beginContact(c,m,{part:'body',localX:0,localY:0},3,0,0,0,config,1));
 cancelContact(c,3);assert.ok(steer(m,[{...p,y:1}])[1]<0);
});
