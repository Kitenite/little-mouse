import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planHuntRoute,advanceHuntRoute,isHuntCruising} from '../public/hunt-routes.js';
import {createContacts,beginContact} from '../public/contact.js';
import {stepMice} from '../public/physics.js';
import {settingsDefaults} from '../public/settings.js';
const mouse=()=>({x:100,y:200,angle:0,vx:0,vy:0,speed:0,state:'active',hiddenUntil:0,restUntil:0,seed:1,
 huntSpeed:1,hunt:{phase:'dart',route:{points:[[.4,.25],[.8,.6]],index:0,pauseAt:-1,pauseUsed:false}}});
const w=1024,h=768;
test('intermediate route bends preserve motion; final destination still stops at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){
  const m=mouse();let crossed=false;
  for(let i=0;i<hz*15;i++){
   const old=m.hunt.route.index;advanceHuntRoute(m,w,h,i/hz);
   if(m.hunt.route.index!==old){crossed=true;assert.ok(m.speed>100,'no compulsory waypoint stop');}
   [m.targetX,m.targetY]=m.hunt.goal.map((v,j)=>v*(j?h:w));
   stepMice([m],settingsDefaults,i/hz,1/hz,w,h);
   assert.ok(Number.isFinite(m.angle));
  }
  assert.ok(crossed);assert.equal(m.speed,0);
  assert.ok(Math.hypot(m.x-.8*w,m.y-.6*h)<8);
  assert.equal(isHuntCruising(m),false);
 }
});
test('a route hesitation is scheduled once and does not extend itself on subsequent frames',()=>{
 const m=mouse();Object.assign(m,{x:.4*w,y:.25*h});
 Object.assign(m.hunt.route,{pauseAt:1,pauseDuration:.3});
 advanceHuntRoute(m,w,h,1);assert.equal(m.restUntil,1.3);
 for(let i=0;i<60;i++)advanceHuntRoute(m,w,h,1+i/60);
 assert.equal(m.restUntil,1.3);assert.equal(m.hunt.route.pauseUsed,true);
});
test('route cruise cannot bypass held-body pin or an active paw exclusion',()=>{
 const m=mouse();Object.assign(m,{x:300,y:300,targetX:800,targetY:300});
 beginContact(createContacts(),m,{part:'body',localX:0,localY:0},1,300,300,0,settingsDefaults,settingsDefaults.size);
 stepMice([m],settingsDefaults,1,1/60,w,h);
 assert.ok(Math.hypot(m.x-300,m.y-300)<1);
 delete m.hold;
 const paw={x:400,y:300,radius:50};
 for(let i=0;i<180;i++)stepMice([m],settingsDefaults,2+i/60,1/60,w,h,[paw]);
 assert.ok(Math.hypot(m.x-paw.x,m.y-paw.y)>=50+Math.min(39*settingsDefaults.size,h*.18)-1);
 m.hunt.phase='injury';assert.equal(isHuntCruising(m),false);
});
test('generated routes remain finite and bounded on both tablet and phone aspect ratios',()=>{
 for(const [width,height]of [[1024,768],[390,844]])for(let i=0;i<100;i++){
  let seed=i+1;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const route=planHuntRoute({x:width*rng(),y:height*rng(),angle:rng()*Math.PI*2},width,height,rng);
  assert.ok(route.points.length===2||route.points.length===3);
  for(const point of route.points)for(const v of point)assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
 }
});

test('routes reach their final goal across extreme speed/size and phone/tablet frame rates',async()=>{
 const {updateHunt,forceHuntPhase,createHuntDirector}=await import('../public/enrichment.js');
 for(const hz of [30,60,120])for(const [width,height]of [[1024,768],[390,844]])for(const extreme of [false,true])for(let seed=1;seed<=20;seed++){
  let n=seed;const rng=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
  const config={...settingsDefaults,...(extreme?{speed:4,travelSpeed:4,size:3.9}:{})};
  const m={...mouse(),hunt:undefined,x:width*.2,y:height*.3,angle:(seed%8)*Math.PI/4};
  const director=createHuntDirector();updateHunt(m,config,0,width,height,false,rng,director);
  forceHuntPhase(m,'dart',0,config,width,height,rng,director);
  const route=m.hunt.route=planHuntRoute(m,width,height,rng);m.hunt.goal=route.points[0];m.hunt.deadline=12;
  let settled=false;
  for(let t=1/hz;t<13;t+=1/hz){
   updateHunt(m,config,t,width,height,false,rng,director);
   if(m.hunt.phase!=='dart'||m.hunt.route!==route)break;
   stepMice([m],config,t,1/hz,width,height);
   if(route.index===route.points.length-1&&Math.hypot(m.x-route.points.at(-1)[0]*width,m.y-route.points.at(-1)[1]*height)<8){settled=true;break;}
  }
  assert.ok(settled,`${hz}Hz ${width}x${height} extreme=${extreme} seed=${seed}: route must not orbit an intermediate point`);
 }
});

test('critic narrow-screen maximum-speed reproduction completes without a full orbit',async()=>{
 const {updateHunt,forceHuntPhase,createHuntDirector}=await import('../public/enrichment.js');
 for(const hz of [30,60,120]){
  const width=390,height=844,config={...settingsDefaults,speed:4,travelSpeed:4,size:3.9};
  const m={...mouse(),hunt:undefined,x:78,y:253.2,angle:Math.PI/4};
  const director=createHuntDirector(),rng=()=>.5;
  updateHunt(m,config,0,width,height,false,rng,director);forceHuntPhase(m,'dart',0,config,width,height,rng,director);
  const route={kind:'crossfield',points:[[.54,.3138106572907418],[.88,.2778890570625663]],index:0,pauseAt:-1};
  m.hunt.route=route;m.hunt.goal=route.points[0];m.hunt.deadline=12;
  let turn=0,previous=m.angle,finished=false;
  for(let t=1/hz;t<4;t+=1/hz){
   updateHunt(m,config,t,width,height,false,rng,director);
   if(m.hunt.route!==route){finished=true;break;}
   stepMice([m],config,t,1/hz,width,height);
   turn+=Math.abs(m.angle-previous);previous=m.angle;
  }
  assert.ok(finished);assert.equal(route.index,1);assert.ok(turn<2,`unnecessary orbit: ${turn} radians`);
 }
});
