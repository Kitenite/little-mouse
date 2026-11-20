import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HUNT_CHAPTERS,createHuntChapters,advanceHuntChapters} from '../public/hunt-chapters.js';
import {createHuntDirector,updateHunt,forceHuntPhase} from '../public/enrichment.js';
import {settingsDefaults} from '../public/settings.js';
const mouse=()=>({state:'active',x:500,y:380,angle:0,vx:0,vy:0,speed:0,hiddenUntil:0,restUntil:0,seed:1});
test('session chapters cover every policy, avoid repeats and stay fixed while simulation time pauses',()=>{
 const a=createHuntChapters(42),b=createHuntChapters(42);let previous='mixed';
 for(let cycle=0;cycle<4;cycle++){
  const ids=[];
  for(let i=0;i<6;i++){
   const time=a.until,policy=advanceHuntChapters(a,time);advanceHuntChapters(b,time);
   assert.deepEqual(a,b);assert.notEqual(policy.id,previous);previous=policy.id;ids.push(policy.id);
   assert.ok(a.until-time>=30&&a.until-time<=65);
   const seed=a.seed;
   for(let j=0;j<100;j++)assert.equal(advanceHuntChapters(a,time),policy);
   assert.equal(a.seed,seed);assert.equal(a.serial,b.serial);
  }
  assert.equal(new Set(ids).size,HUNT_CHAPTERS.length);
 }
});
test('a shared chapter advances once and does not replace an ongoing route or held mouse',()=>{
 const director=createHuntDirector(7),a=mouse(),b=mouse();
 updateHunt(a,settingsDefaults,0,1024,768,false,()=>.2,director);
 forceHuntPhase(a,'dart',0,settingsDefaults,1024,768,()=>.2,director);
 const route=a.hunt.route;a.hunt.deadline=100;a.hunt.progress={time:35,distance:0};
 Object.assign(a,{targetX:900,targetY:700});
 b.hold={part:'body'};
 updateHunt(a,settingsDefaults,35,1024,768,false,()=>.2,director);
 updateHunt(b,settingsDefaults,35,1024,768,false,()=>.2,director);
 assert.equal(director.chapters.serial,1);assert.equal(a.hunt.route,route);
 assert.equal(a.hunt.chapter.id,'mixed','existing action retains its policy');
 assert.equal(b.x,500);assert.equal(b.hunt,undefined);
 forceHuntPhase(a,'watch',35,settingsDefaults,1024,768,()=>.2,director);
 assert.equal(a.hunt.chapter.id,director.chapters.current.id);
});
test('chapters change actual route choices, not only diagnostic names',()=>{
 function sample(id){
  const director=createHuntDirector();director.chapters.current=HUNT_CHAPTERS.find(c=>c.id===id);director.chapters.until=Infinity;
  let seed=92,hooks=0,routes=0,pauses=0;
  const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const m=mouse();
  for(let i=0;i<300;i++){
   forceHuntPhase(m,'dart',0,settingsDefaults,1024,768,rng,director);
   if(m.hunt.route){routes++;if(m.hunt.route.kind==='edge-hook')hooks++;if(m.hunt.route.pauseAt>=0)pauses++;}
  }
  return {routes,hookRate:hooks/routes,pauseRate:pauses/routes};
 }
 const sweeping=sample('sweeping'),teasing=sample('edge-teasing'),stalking=sample('stalking'),bursts=sample('bursts');
 assert.ok(sweeping.routes>stalking.routes*1.8);
 assert.ok(teasing.hookRate>sweeping.hookRate+.4);
 assert.ok(bursts.pauseRate>sweeping.pauseRate+.15);
});

test('learned duration bias changes only new chapter length, never the deck or opening',()=>{
 const a=createHuntChapters(71),b=createHuntChapters(71);
 a.durationScales=Object.fromEntries(HUNT_CHAPTERS.map(c=>[c.id,100]));
 assert.equal(a.until,35);
 for(let i=0;i<12;i++){
  advanceHuntChapters(a,a.until);advanceHuntChapters(b,b.until);
  assert.equal(a.current.id,b.current.id);assert.equal(a.decision.multiplier,1.15);
  assert.ok(a.until-a.since>=30&&a.until-a.since<=65);
  assert.equal(a.decision.baseDuration,b.decision.baseDuration);
 }
});
