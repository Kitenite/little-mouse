import {createHuntDirector,updateHunt,rememberTouch} from '../../../little-mouse/public/enrichment.js';
import {updateHuntGroup} from '../../../little-mouse/public/hunt-group.js';
import {stepMice} from '../../../little-mouse/public/physics.js';
import {settingsDefaults} from '../../../little-mouse/public/settings.js';
import {createContacts,beginContact,cancelContact,endContact} from '../../../little-mouse/public/contact.js';
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
const mouse=(i,w,h)=>({state:'away',castIndex:i,x:w/2,y:h/2,angle:0,vx:0,vy:0,speed:0,targetX:w/2,targetY:h/2,hiddenUntil:0,restUntil:0,seed:i});
const results=[];
for(const scenario of ['slow-large'])for(const seed of [97])for(const rate of [30,60,120]){
 const w=scenario==='phone'?390:1024,h=scenario==='phone'?844:768,hz=rate;
 const config={...settingsDefaults,...(scenario==='slow-large'?{size:3.9,speed:0,travelSpeed:1,huntTempo:.5}:scenario==='fast-large'?{size:3.9,speed:4,travelSpeed:4}:{} )};
 const rng=seeded(seed),d=createHuntDirector(seed),mice=[mouse(0,w,h),mouse(1,w,h)];
 let maxPeek=0;let empty=0,maxEmpty=0,maxEmptyAfterRelease=0,spinMax=0,spinCase=null,emptyCase=null;
 const invisible=[0,0],maxInvisible=[0,0],segments=[null,null];
 for(let frame=0;frame<600*hz;frame++){
  const t=frame/hz;
  d.paws=new Map(scenario==='blocked-release'&&t<15?[[1,{x:w/2,y:h/2,radius:2000}]]:[]);
  if(scenario==='misses'&&frame%180===0){const m=mice[Math.floor(frame/180)%2];if(m.state==='active')rememberTouch(d,m.x-100,m.y,t,w,h,{miss:true});}
  updateHuntGroup(d,mice,t,w,h,config);
  for(const m of mice)updateHunt(m,config,t,w,h,false,rng,d);
  stepMice(mice,config,t,1/hz,w,h,d.paws.values());
  let seen=0;
  for(let i=0;i<2;i++){
   const m=mice[i];if(m.hunt.phase==='peek')maxPeek=Math.max(maxPeek,t-m.hunt.since);const reach=47*config.size,visible=m.state!=='away'&&m.x>-reach&&m.x<w+reach&&m.y>-reach&&m.y<h+reach;
   if(visible){seen++;invisible[i]=0;}else invisible[i]+=1/hz;
   maxInvisible[i]=Math.max(maxInvisible[i],invisible[i]);
   let s=segments[i];
   if(!s||Math.hypot(s.tx-m.targetX,s.ty-m.targetY)>1||s.phase!==m.hunt.phase)s=segments[i]={tx:m.targetX,ty:m.targetY,phase:m.hunt.phase,angle:m.angle,start:t,x:m.x,y:m.y};
   const turn=Math.abs(m.angle-s.angle);
   if(turn>spinMax){spinMax=turn;spinCase={time:t,phase:s.phase,duration:t-s.start,travel:Math.hypot(m.x-s.x,m.y-s.y)};}
  }
  empty=seen?0:empty+1/hz;
  if(empty>maxEmpty){maxEmpty=empty;emptyCase={t,phases:mice.map(m=>m.hunt.phase)};}
  if(t>20)maxEmptyAfterRelease=Math.max(maxEmptyAfterRelease,empty);
 }
 results.push({hz,maxPeek,finalPhases:mice.map(m=>m.hunt.phase),scenario,seed,maxEmpty:+maxEmpty.toFixed(2),maxEmptyAfterRelease:+maxEmptyAfterRelease.toFixed(2),maxInvisible:maxInvisible.map(x=>+x.toFixed(2)),maxFixedGoalTurn:+spinMax.toFixed(2),spinCase,emptyCase});
}
console.log(JSON.stringify(results,null,2));
