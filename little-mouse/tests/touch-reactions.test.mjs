import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pressMouse,impactPose} from '../public/behavior.js';
import {createHuntDirector,rememberTouch,updateHunt} from '../public/enrichment.js';
import {stepMice} from '../public/physics.js';

const config={mode:'hunt',speed:1.2,size:2.2,hide:3,huntTempo:1,harmlessChance:.35};
const make=()=>({x:400,y:300,angle:0,targetX:400,targetY:300,hiddenUntil:0,restUntil:0,state:'active',vx:0,vy:0,seed:1});
function world(settings={}){const m=make(),director=createHuntDirector(),c={...config,...settings};let time=0;
 const tick=()=>{time+=1/60;updateHunt(m,c,time,1024,768,false,()=>.5,director);stepMice([m],c,time,1/60,1024,768);};
 tick();return{m,director,tick,get time(){return time;},advance(seconds){const end=time+seconds;while(time<end)tick();},tap(x,y){rememberTouch(director,x,y,time,1024,768);}};
}

test('harmless direct hits flinch, freeze or dodge without injury or squashing',()=>{
 for(const [roll,reaction] of [[.1,'flinch'],[.5,'freeze'],[.9,'dodge']]){
  const s=world(),{m}=s;const values=[0,roll,.2];
  assert.equal(pressMouse(m,390,300,s.time,1024,768,2.2,()=>values.shift()??.5,{harmlessChance:1}),'harmless');
  assert.equal(m.reaction,reaction);assert.equal(m.state,'active');assert.equal(m.injuredUntil,0);assert.equal(m.hurtUntil,0);
  const pose=impactPose(m,s.time+.1);assert.equal(pose.x,1);assert.equal(pose.y,1);assert.equal(pose.z,1);
  assert.equal(pressMouse(m,390,300,s.time+.1,1024,768,2.2,()=>0,{harmlessChance:1}),null);
  s.advance(.15);assert.equal(m.hunt.phase,'touch');assert.equal(m.reaction,reaction);
  if(reaction==='dodge')assert.ok(m.x>400);else assert.equal(m.x,400);
  s.advance(.65);assert.equal(m.hunt.phase,'watch');assert.equal(m.reaction,null);
 }
});

test('harmless probability is configurable and disabling it retains damage outcomes',()=>{
 const m=make();assert.equal(pressMouse(m,390,300,1,1024,768,2.2,()=>.1,{harmlessChance:0}),'defeated');
 const n=make();assert.equal(pressMouse(n,390,300,1,1024,768,2.2,()=>.8,{harmlessChance:0}),'hurt');
 const ordinary=make();pressMouse(ordinary,390,300,1,1024,768,2.2,()=>0,{harmlessChance:1});
 assert.equal(ordinary.huntSpeed,undefined,'non-Hunt mode cannot inherit a permanent zero-speed override');
});

test('distant taps turn attention toward the event without flight; stale taps do not',()=>{
 const s=world();s.tap(1024,768);s.advance(.5);
 assert.equal(s.m.hunt.phase,'watch');assert.ok(s.m.angle>.1,'turns toward lower-right sound/movement cue');assert.ok(s.m.speed<1);
 assert.ok(s.m.hunt.fear>0&&s.m.hunt.fear<.1);
 const stale=world();rememberTouch(stale.director,1024,768,stale.time-2,1024,768);stale.advance(.5);assert.equal(stale.m.angle,0);
});

test('moderate taps briefly freeze, repeated taps escalate, nearby taps retreat',()=>{
 const moderate=world();moderate.tap(700,300);moderate.advance(.4);assert.equal(moderate.m.hunt.phase,'watch');assert.ok(moderate.m.restUntil>moderate.time);assert.ok(moderate.m.speed<1);
 for(let i=0;i<7;i++){moderate.tap(700,300);moderate.advance(.1);}moderate.advance(.35);assert.equal(moderate.m.hunt.phase,'retreat');
 const near=world();near.tap(450,300);near.advance(.4);assert.equal(near.m.hunt.phase,'retreat');assert.ok(near.m.startledUntil>near.time);
});

test('harmless hit consumes its touch cue and does not immediately turn into damage or flight',()=>{
 const s=world();s.tap(400,300);pressMouse(s.m,400,300,s.time,1024,768,2.2,()=>.1,{harmlessChance:1});s.advance(.8);
 assert.equal(s.m.state,'active');assert.equal(s.m.hunt.phase,'watch');assert.equal(s.m.hunt.reactAt,undefined);
});

test('sensitivity and delay controls change perceived threat and response timing',()=>{
 const low=world({touchSensitivity:.5}),high=world({touchSensitivity:2});
 low.tap(650,300);high.tap(650,300);low.advance(.4);high.advance(.4);
 assert.equal(low.m.hunt.phase,'watch');assert.equal(high.m.hunt.phase,'retreat');
 const quick=world({reactionDelay:.5}),slow=world({reactionDelay:2});
 quick.tap(450,300);slow.tap(450,300);quick.advance(.3);slow.advance(.3);
 assert.equal(quick.m.hunt.phase,'retreat');assert.equal(slow.m.hunt.phase,'watch');
 slow.advance(.3);assert.equal(slow.m.hunt.phase,'retreat');
});
