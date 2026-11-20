import{createContacts,beginContact,cancelContact}from'../public/contact.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHuntDirector,updateHunt,rememberTouch,forceHuntPhase} from '../public/enrichment.js';
import {updateHuntGroup,groupWeight,deferSoloExit} from '../public/hunt-group.js';
import {stepMice} from '../public/physics.js';
import {settingsDefaults as config} from '../public/settings.js';
const w=1024,h=768,mouse=(x=500)=>({state:'active',x,y:380,angle:0,vx:0,vy:0,speed:0,hiddenUntil:0,restUntil:0,seed:1});
test('two mice alternate lead/sneak intent without changing active routes or a held mouse',()=>{
 const d=createHuntDirector(7),a=mouse(),b=mouse(800);for(const m of[a,b])updateHunt(m,config,0,w,h,false,()=>.4,d);
 forceHuntPhase(a,'dart',0,config,w,h,()=>.2,d);const route=a.hunt.route;
 updateHuntGroup(d,[a,b],0,w,h,config);const lead=d.group.focus;
 assert.ok(groupWeight(d,lead,'dart')>groupWeight(d,lead===a?b:a,'dart'));
 updateHuntGroup(d,[a,b],19,w,h,config);assert.notEqual(d.group.focus,lead);assert.equal(a.hunt.route,route);
 a.hold={part:'body'};updateHuntGroup(d,[a,b],20,w,h,config);assert.equal(d.group.members.length,1);assert.equal(groupWeight(d,b,'dart'),1);
});
test('last visible mouse asks for a bounded entrance handoff; all-hidden cast expedites one entrance',()=>{
 const d=createHuntDirector(3),a=mouse(),b=mouse();for(const m of[a,b])updateHunt(m,config,0,w,h,false,()=>.4,d);
 b.state='away';b.hunt.phase='hidden';b.hunt.deadline=20;
 updateHuntGroup(d,[a,b],1,w,h,config);assert.equal(deferSoloExit(d,a,1),true);assert.equal(b.hunt.deadline,1.15);
 assert.equal(deferSoloExit(d,a,4),false,'coordination cannot indefinitely pin last mouse onscreen');
 a.state='away';a.hunt.phase='hidden';a.hunt.deadline=20;b.hunt.deadline=20;d.nextEntrance=20;
 updateHuntGroup(d,[a,b],5,w,h,config);assert.equal(d.nextEntrance,5.5);assert.equal(Math.min(a.hunt.deadline,b.hunt.deadline),5.5);
 // Safety still wins even if coordination advances the deadline.
 d.paws=new Map([[1,{x:512,y:384,radius:2000}]]);
 for(const m of[a,b])updateHunt(m,config,6,w,h,false,()=>.4,d);
 assert.equal(a.state,'away');assert.equal(b.state,'away');
});
test('a near miss dodges, checks back briefly and resumes escape at each frame rate',()=>{
 for(const hz of[30,60,120]){
  const d=createHuntDirector(4),m=mouse(),stages=new Set();
  updateHunt(m,config,0,w,h,false,()=>.5,d);
  rememberTouch(d,400,380,.1,w,h,{miss:true,pointerId:1});
  for(let t=.1;t<5;t+=1/hz){updateHunt(m,config,t,w,h,false,()=>.5,d);if(m.hunt.pounce)stages.add(m.hunt.pounce.stage);stepMice([m],config,t,1/hz,w,h);}
  assert.ok(stages.has('dodge'));assert.ok(stages.has('hesitate'));assert.equal(m.hunt.pounce,undefined);
  assert.ok(m.x>500,'escape initially moves away from the missed strike');
 }
});
test('misses remember pressure; holds and injury cancel planned check-backs',()=>{
 const d=createHuntDirector(),m=mouse();updateHunt(m,config,0,w,h,false,()=>.5,d);
 for(let i=1;i<=3;i++){rememberTouch(d,450,380,i*.01,w,h,{miss:true});updateHunt(m,config,i*.01,w,h,false,()=>.5,d);}
 updateHunt(m,config,.5,w,h,false,()=>.5,d);assert.equal(m.hunt.phase,'retreat');assert.equal(m.hunt.misses.length,3);
 m.hunt.pounce={stage:'dodge'};m.hold={part:'body'};updateHunt(m,config,.6,w,h,false,()=>.5,d);assert.equal(m.hunt.pounce,undefined);
 delete m.hold;m.hunt.pounce={stage:'dodge'};m.state='hurt';m.injuredUntil=5;updateHunt(m,config,.7,w,h,false,()=>.5,d);assert.equal(m.hunt.pounce,undefined);
});

test('a claim cancelled before a policy tick cannot revive a queued missed-pounce check',()=>{
 const d=createHuntDirector(),m=mouse(),contacts=createContacts();updateHunt(m,config,0,w,h,false,()=>.5,d);
 m.hunt.pounce={stage:'dodge'};
 assert.ok(beginContact(contacts,m,{part:'body'},1,m.x,m.y,1,config,config.size));cancelContact(contacts,1);
 assert.equal(m.hunt.pounce,undefined);
});

test('slow large companions do not deadlock at overlapping peek targets (critic seed97)',()=>{
 for(const hz of [30,60,120]){
  let seed=97;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const c={...config,size:3.9,speed:0,travelSpeed:1,huntTempo:.5},d=createHuntDirector(97);
  const mice=[0,1].map(i=>({...mouse(),state:'away',castIndex:i,seed:i}));let maxPeek=0,empty=0,maxEmpty=0;
  for(let frame=0;frame<600*hz;frame++){
   const t=frame/hz;updateHuntGroup(d,mice,t,w,h,c);
   for(const m of mice){updateHunt(m,c,t,w,h,false,rng,d);if(m.hunt.phase==='peek')maxPeek=Math.max(maxPeek,t-m.hunt.since);}
   stepMice(mice,c,t,1/hz,w,h);
   const seen=mice.some(m=>m.state!=='away'&&m.x>-47*c.size&&m.x<w+47*c.size&&m.y>-47*c.size&&m.y<h+47*c.size);
   empty=seen?0:empty+1/hz;maxEmpty=Math.max(maxEmpty,empty);
  }
  assert.ok(maxEmpty<12,`${hz}Hz board stayed empty ${maxEmpty}s`);
  assert.ok(maxPeek<30,`${hz}Hz peek stalled ${maxPeek}s`);
 }
});
