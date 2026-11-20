import {writeFileSync} from 'node:fs';
import {createRouteMetricsTracker} from '../../../little-mouse/scripts/behavior-route-metrics.mjs';
import {fileURLToPath} from 'node:url';
const source=process.env.MOTION_SOURCE||fileURLToPath(new URL('../../../little-mouse/public',import.meta.url));
const r=Object.assign({},...await Promise.all(['enrichment','hunt-group','physics','mouse-identity','settings'].map(n=>import(`${source}/${n}.js`))));
const rows=[];
for(const hz of [30,60,120])for(const scenario of ['passive','central-paw','near-misses','tall-phone']){
 const seed=11,seconds=360,config=r.settingsDefaults,w=scenario==='tall-phone'?390:1024,h=scenario==='tall-phone'?844:768,dt=1/hz;
 const rng=r.identityRandom(seed),director=r.createHuntDirector(seed);
 const paw=scenario==='central-paw'?[{x:w/2,y:h/2,radius:50}]:[];
 director.paws=new Map(paw.map((p,i)=>[i,p]));
 const mice=Array.from({length:2},(_,castIndex)=>{const rad=r.radius(config.size,w,h);return {castIndex,state:'away',x:rad+rng()*(w-2*rad),y:rad+rng()*(h-2*rad),angle:rng()*Math.PI*2,targetX:w/2,targetY:h/2,next:.6,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,speed:0,seed:rng()*100,identity:r.createMouseIdentity((seed+castIndex*2654435761)>>>0)};});
 const trackers=mice.map(()=>createRouteMetricsTracker({maxPoints:Number(process.env.ROUTE_MAX_POINTS)||2048}));
 for(let frame=1;frame<=seconds*hz;frame++){
  const time=frame*dt;
  if(scenario==='near-misses'&&frame%Math.round(7*hz)===0){const m=mice[Math.floor(frame/(7*hz))%2];r.rememberTouch(director,m.x+90,m.y,time,w,h,{miss:true,pointerId:frame});}
  r.updateHuntGroup(director,mice,time,w,h,config);
  for(const m of mice)r.updateHunt(m,config,time,w,h,false,rng,director);
  r.stepMice(mice,config,time,dt,w,h,paw);
  mice.forEach((m,i)=>trackers[i].sample({time,x:m.x/w,y:m.y/h,phase:m.hunt?.phase||'none',eligible:m.state==='active'&&m.hiddenUntil<=time&&m.x>=0&&m.x<=w&&m.y>=0&&m.y<=h&&!m.hold&&!(m.tossUntil>time)&&!(m.injuredUntil>time)}));
 }
 const snapshots=trackers.map(t=>t.finalize());
 rows.push({hz,scenario,seed,seconds,snapshots});
 console.log(JSON.stringify({hz,scenario,eligible:snapshots.map(s=>s.eligibleRoutes),censored:snapshots.map(s=>s.censoredRoutes),overflow:snapshots.map(s=>s.closures.overflow),highWater:snapshots.map(s=>s.storage.highWaterPoints)}));
}
if(process.env.METRICS_OUT)writeFileSync(process.env.METRICS_OUT,JSON.stringify({source,runtimeRevision:'caller-selected; verify archive/source separately',rows},null,2));
