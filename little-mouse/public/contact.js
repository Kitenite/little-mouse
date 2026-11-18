import {pressMouse} from './behavior.js';
import {physicalTraits} from './mouse-identity.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function localContact(m,x,y,size){const dx=(x-m.x)/size,dy=(y-m.y)/size,c=Math.cos(m.angle),s=Math.sin(m.angle);return{localX:dx*c+dy*s,localY:dx*s-dy*c};}
// Fallback for headless tests / a renderer without articulated contact geometry.
export function classifyContact(m,x,y,size){
 const p=localContact(m,x,y,size),u=p.localX,v=p.localY;
 for(const [part,px]of[['forepaw',20],['hindpaw',-22]])if(Math.hypot(u-px,Math.abs(v)-21)<10)return{part,...p};
 if(((u-31)/21)**2+(v/17)**2<1)return{part:'head',...p};
 if((u/36)**2+(v/23)**2<1)return{part:'body',...p};
 if(u<-32&&u>-125&&Math.abs(v)<9)return{part:'tail',fraction:clamp((-u-36)/87,.05,1),...p};
 return null;
}
export function createContacts(){const contacts=new Map();contacts.paws=new Map();contacts.recentPaws=new Map();contacts.obstacles=new Map();return contacts;}
export function recordPointer(contacts,pointerId,x,y,time,width=0,height=0){if(!contacts.paws.has(pointerId)&&contacts.paws.size>=10)return false;contacts.recentPaws.delete(pointerId);contacts.paws.set(pointerId,{pointerId,x,y,time,radius:Math.min(180,Math.max(0,width||0,height||0)/2)});refreshObstacles(contacts,time);return true;}
export function removePointer(contacts,pointerId){contacts.paws.delete(pointerId);contacts.obstacles.delete(pointerId);return cancelContact(contacts,pointerId);}
export function beginContact(contacts,m,hit,pointerId,x,y,time,config,size){
 if(!m||!hit||m.hold||contacts.has(pointerId)||m.state==='away'||m.state==='defeated'||m.hiddenUntil>time||(m.invulnerableUntil||0)>time)return false;
 const local=localContact(m,x,y,size);
 const traits=m.identity?physicalTraits(m.identity,config):{bodyLength:config.bodyLength||1,tailLength:config.tailLength||1};
 const hold={part:hit.part,x,y,targetX:x,targetY:y,anchorVX:0,anchorVY:0,lastAnchorMoveAt:time,lastMoveAt:time,localX:hit.localX??local.localX,localY:hit.localY??local.localY,fraction:hit.fraction??.5,legIndex:hit.legIndex,pawOffsetX:hit.pawOffsetX,pawOffsetY:hit.pawOffsetY,startedAt:time,pointerId,active:false,angle:m.angle,originX:x,originY:y,threshold:clamp(Number(config.holdThreshold)||.25,.15,1)};
 m.hold=hold;m.vx=m.vy=m.speed=0;m.moving=false;m.turnRate=0;
 hold.tailRoot=hit.tailRoot??-36*traits.bodyLength;hold.tailRootX=hit.tailRootX??hold.tailRoot;hold.tailRootY=hit.tailRootY??0;hold.tailLength=hit.tailLength??87*traits.tailLength;
 contacts.set(pointerId,{m,hold});return true;
}
export function cancelContact(contacts,pointerId){const record=contacts.get(pointerId);if(!record)return false;if(record.m.hold===record.hold)delete record.m.hold;contacts.delete(pointerId);return true;}
export function clearContacts(contacts){for(const id of [...contacts.keys()])cancelContact(contacts,id);contacts.paws.clear();contacts.recentPaws.clear();contacts.obstacles.clear();}
export function moveContact(contacts,pointerId,x,y,size,time){const record=contacts.get(pointerId);if(!record||!Number.isFinite(x+y))return false;
 record.hold.targetX=x;record.hold.targetY=y;record.hold.lastMoveAt=time??record.hold.lastMoveAt;return true;
}
export function advanceContactAnchor(m,time,dt){const hold=m.hold;if(!hold||!Number.isFinite(dt)||dt<=0)return;const dx=hold.targetX-hold.x,dy=hold.targetY-hold.y,d=Math.hypot(dx,dy),limit=800*dt,scale=d>0?Math.min(1,limit/d):0;
 const vx=dx*scale/dt,vy=dy*scale/dt;hold.x+=dx*scale;hold.y+=dy*scale;if(d*scale>1e-9)hold.lastAnchorMoveAt=time;if(hold.active&&hold.part!=='body'&&hold.part!=='head'){m.x+=dx*scale;m.y+=dy*scale;}hold.anchorVX+=(vx-hold.anchorVX)*Math.min(1,dt*30);hold.anchorVY+=(vy-hold.anchorVY)*Math.min(1,dt*30);}
function refreshObstacles(contacts,time){contacts.obstacles.clear();for(const[id,p]of contacts.paws)contacts.obstacles.set(id,p);for(const[id,p]of contacts.recentPaws){const memory=clamp(1-(time-p.releasedAt)/4,0,1);if(memory<=0){contacts.recentPaws.delete(id);continue;}if(contacts.obstacles.size<10)contacts.obstacles.set(`recent:${id}`,{...p,memory,recent:true});}}
export function updateContacts(contacts,time,mice){refreshObstacles(contacts,time);for(const[id,{m,hold}]of contacts){if(m.hold!==hold||(mice&&!mice.includes(m))){cancelContact(contacts,id);continue;}hold.active=time-hold.startedAt>=hold.threshold;}}
export function endContact(contacts,pointerId,time,w,h,size,config,rng=Math.random){
 const paw=contacts.paws.get(pointerId);if(paw){contacts.recentPaws.delete(pointerId);contacts.recentPaws.set(pointerId,{...paw,releasedAt:time});while(contacts.recentPaws.size>10)contacts.recentPaws.delete(contacts.recentPaws.keys().next().value);}
 contacts.paws.delete(pointerId);refreshObstacles(contacts,time);
 const record=contacts.get(pointerId);if(!record)return null;
 const {m,hold}=record;cancelContact(contacts,pointerId);
 const held=hold.active||time-hold.startedAt>=hold.threshold;
 const velocity=Math.hypot(hold.anchorVX||0,hold.anchorVY||0),recent=Number.isFinite(hold.lastAnchorMoveAt)&&time>=hold.lastAnchorMoveAt&&time-hold.lastAnchorMoveAt<.15;
 if(recent&&velocity>140&&time-hold.startedAt>.08){const scale=Math.min(1,900/velocity);m.throwVX=hold.anchorVX*scale;m.throwVY=hold.anchorVY*scale;m.vx=m.throwVX;m.vy=m.throwVY;m.tossAt=time;m.tossUntil=time+.65;m.state='active';m.reaction='tossed';m.hitPart=hold.part;m.hitAt=time;m.harmlessUntil=m.injuredUntil=m.hurtUntil=m.scrambleUntil=0;m.invulnerableUntil=time+.8;if(m.hunt)m.hunt.phase='toss';return{mouse:m,outcome:'tossed',part:hold.part,held,x:hold.x,y:hold.y};}
 m.invulnerableUntil=0; // The claim was acquired while hittable; resolve once.
 const outcome=pressMouse(m,hold.x,hold.y,time,w,h,size,rng,{...config,hitPart:hold.part,held,holdDuration:time-hold.startedAt});
 return outcome?{mouse:m,outcome,part:hold.part,held,x:hold.x,y:hold.y}:null;
}

// A short geometric detour keeps a travelling mouse from aiming through a
// stationary touch. At most ten active pointers are considered per substep.
export function avoidPaws(m,dx,dy,paws,clearance,baseRadius=50){
 const distance=Math.hypot(dx,dy);if(distance<1||m.hold)return[dx,dy];const ux=dx/distance,uy=dy/distance;
 let closest=null,nearest=Infinity;
 for(const p of paws){const reach=(clearance+Math.max(0,(p.radius||0)-baseRadius))*(p.memory??1),ox=p.x-m.x,oy=p.y-m.y,along=ox*ux+oy*uy,side=ox*-uy+oy*ux;
  if(along>0&&along<Math.min(distance,reach+180)&&Math.abs(side)<reach+10&&along<nearest){closest={p,side,reach};nearest=along;}}
 if(!closest)return[dx,dy];const sign=closest.side===0?((m.seed||0)%2<1?1:-1):-Math.sign(closest.side);
 return[closest.p.x-uy*sign*(closest.reach+20)-m.x,closest.p.y+ux*sign*(closest.reach+20)-m.y];
}
export function constrainPaws(m,paws,clearance,dt,baseRadius=50){if(m.hold)return;for(const p of paws){if(p.recent)continue;const reach=clearance+Math.max(0,(p.radius||0)-baseRadius),dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy);if(d>=reach)continue;const nx=d>.01?dx/d:Math.cos(m.angle),ny=d>.01?dy/d:Math.sin(m.angle),push=Math.min(reach-d,Math.max(1,180*dt));m.x+=nx*push;m.y+=ny*push;const inward=m.vx*nx+m.vy*ny;if(inward<0){m.vx-=inward*nx;m.vy-=inward*ny;}}}
export function constrainContact(m,size,time,dt){
 const hold=m.hold;if(!hold)return;
 if(hold.part==='head'||hold.part==='body'||!hold.active){
  m.angle=hold.angle;m.turnRate=0;const c=Math.cos(m.angle),s=Math.sin(m.angle);
  m.x=hold.x-size*(hold.localX*c+hold.localY*s);m.y=hold.y-size*(hold.localX*s-hold.localY*c);
  m.vx=m.vy=m.speed=0;m.moving=false;return;
 }
 // A paw pivots close to its captured position. A tail permits a longer tether
 // measured from the rendered tail root, with no instantaneous release teleport.
 const tail=hold.part==='tail',lx=tail?(hold.tailRootX??hold.tailRoot??-36):hold.localX,ly=tail?(hold.tailRootY??0):hold.localY,c=Math.cos(m.angle),s=Math.sin(m.angle);
 const px=m.x+size*(lx*c+ly*s),py=m.y+size*(lx*s-ly*c),dx=px-hold.x,dy=py-hold.y,d=Math.hypot(dx,dy);
 const reach=size*(tail?.93*(hold.tailLength??87)*clamp(hold.fraction,.05,1):5);
 if(d>reach&&d>0){const correction=Math.min(d-reach,Math.max(1,180*dt));m.x-=dx/d*correction;m.y-=dy/d*correction;const outward=(m.vx*dx+m.vy*dy)/d;if(outward>0){m.vx-=outward*dx/d;m.vy-=outward*dy/d;}}
}
