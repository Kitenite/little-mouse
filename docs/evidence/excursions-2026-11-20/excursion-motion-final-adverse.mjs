import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {sweepPaws,constrainPaws} from '/tmp/excursion-motion-candidate2-final/little-mouse/public/contact.js';
import {stepMice} from '/tmp/excursion-motion-candidate2-final/little-mouse/public/physics.js';
import {settingsDefaults as cfg} from '/tmp/excursion-motion-candidate2-final/little-mouse/public/settings.js';
let cases=0;const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const angle of [0,.7,2.1])for(const offset of [0,25,49.99]){
 const c=Math.cos(angle),s=Math.sin(angle),point=(x,y)=>({x:300+x*c-y*s,y:400+x*s+y*c});
 const start=point(-200,offset),m={...point(200,offset),vx:12,vy:13},p={x:300,y:400};
 sweepPaws(m,start.x,start.y,[p],50);const expected=point(-Math.sqrt(2500-offset*offset),offset);near(m.x,expected.x);near(m.y,expected.y);assert.equal(m.vx,12);assert.equal(m.vy,13);cases++;
}
const p={x:0,y:0};
for(const [start,end,expected] of [[[50,0],[0,0],[50,0]],[[50,0],[75,0],[75,0]],[[50,0],[50,20],[50,20]],[[-100,50],[100,50],[100,50]],[[10,0],[20,0],[20,0]],[[0,0],[0,0],[0,0]]]){
 const m={x:end[0],y:end[1]};sweepPaws(m,...start,[p],50);near(m.x,expected[0]);near(m.y,expected[1]);cases++;
}
for(const hold of [{part:'body'},{part:'forepaw'},{part:'tail'},{}]){const m={x:100,y:0,hold};sweepPaws(m,-100,0,[p],50);assert.equal(m.x,100);cases++;}
const recent={x:0,y:0,recent:true,memory:1};{const m={x:100,y:0};sweepPaws(m,-100,0,[recent],50);assert.equal(m.x,100);cases++;}
for(const paws of [[p,{x:100,y:0}],[{x:100,y:0},p]]){const m={x:200,y:0};sweepPaws(m,-200,0,paws,50);near(m.x,-50);cases++;}
{const m={x:100,y:0};sweepPaws(m,-100,0,[{...p,radius:80}],50,50);near(m.x,-80);cases++;}
// Starting inside one paw must not disable a different paw's new crossing.
{const m={x:200,y:0};sweepPaws(m,0,0,[p,{x:100,y:0}],50);near(m.x,50);cases++;}
for(const hz of [30,60,120]){const m={x:10,y:0,vx:0,vy:0};sweepPaws(m,0,0,[p],50);assert.equal(m.x,10);constrainPaws(m,[p],50,1/hz);assert.ok(m.x<=10+180/hz+1e-9);cases++;}
for(const dt of [0,-1,NaN,Infinity]){const m={state:'active',hiddenUntil:0,x:400,y:384,angle:0,vx:1000,vy:0,targetX:900,targetY:384,restUntil:0};const before=JSON.stringify(m);stepMice([m],cfg,1,dt,1024,768,[{x:512,y:384,radius:50}]);assert.equal(JSON.stringify(m),before);cases++;}
writeFileSync('/tmp/excursion-motion-final-adverse.json',JSON.stringify({passed:cases,scope:'Direct geometric cases and zero/invalid time; no new seed search. No substep collision-position guarantee.'},null,2));console.log({passed:cases});
