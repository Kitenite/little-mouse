import {LIMITS} from './core.mjs';
import {createReplay,advanceReplay} from './replay.mjs';
import {pathToFileURL} from 'node:url';
export function runScenario(kind,name='drag'){
 const {simulations,replay}=createReplay(name);const s=simulations.find(s=>s.kind===kind);let peakGap=0,peakLimit=0,peakSpeed=0,peakWall=0,dragError=0,releaseSpin=0,releaseSpeed=0;
 const sample=()=>{for(const m of s.snapshot().mice){peakSpeed=Math.max(peakSpeed,Math.hypot(m.vx,m.vy));peakWall=Math.max(peakWall,39-m.x,m.x+39-800,39-m.y,m.y+39-500);for(const j of m.joints){peakGap=Math.max(peakGap,j.gap);peakLimit=Math.max(peakLimit,j.lower-j.angle,j.angle-j.upper);}}};
 while(!replay.done){advanceReplay([s],replay,event=>{
  if(event==='dragged'){
   const before=s.snapshot(),claim=before.claims[0],m=before.mice[0],c=s.claims.get('scenario');
   const a=s.world?c.joint.getAnchorB():{x:m.x,y:m.y-24};
   dragError=Math.hypot((s.world?a.x*LIMITS.scale:a.x)-claim.target.x,(s.world?a.y*LIMITS.scale:a.y)-claim.target.y);
  }else {const m=s.snapshot().mice[0];releaseSpin=m.spin;releaseSpeed=Math.hypot(m.vx,m.vy);}
 });sample();}
 const m=s.snapshot().mice;
 return {kind,scenario:name,dragErrorPx:dragError,releaseSpeedPxS:releaseSpeed,releaseSpinRadS:releaseSpin,peakSpeedPxS:peakSpeed,peakWallOverrunPx:Math.max(0,peakWall),peakJointGapPx:peakGap,peakLimitExcessRad:Math.max(0,peakLimit),finalCenterDistancePx:Math.hypot(m[0].x-m[1].x,m[0].y-m[1].y),collisionEvents:s.collisions};
}
export function comparisons(){return ['drag','collision','hold','cancel','wall'].flatMap(name=>['kinematic','planck'].map(kind=>runScenario(kind,name)));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(comparisons(),null,2));
