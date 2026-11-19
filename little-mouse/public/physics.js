import {constrainContact,advanceContactAnchor,avoidPaws,constrainPaws} from './contact.js';
// Units are CSS pixels and seconds. Fixed substeps keep fast mice from tunnelling.
export{livelyDefaults,upgradeSettings}from'./settings-migration.js';
export function radius(size,w,h){return Math.min(39*size,Math.min(w,h)*.18);}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function flee(mouse,x,y,time,w,h,size){let dx=mouse.x-x,dy=mouse.y-y;const distance=Math.hypot(dx,dy);if(distance>160+size*70)return false;if(distance<.01){dx=Math.cos(mouse.angle);dy=Math.sin(mouse.angle);}const length=Math.hypot(dx,dy),nx=dx/length,ny=dy/length,r=radius(size,w,h);if(Math.hypot(mouse.vx||0,mouse.vy||0)<80){mouse.vx=Math.cos(mouse.angle)*80;mouse.vy=Math.sin(mouse.angle)*80;}if(!mouse.leaving&&!mouse.entering){mouse.targetX=clamp(mouse.x+nx*450,r,w-r);mouse.targetY=clamp(mouse.y+ny*450,r,h-r);}mouse.startledUntil=time+1.15;mouse.restUntil=0;mouse.next=time+1.15;return true;}
export function stepMice(mice,config,time,dt,w,h,obstacles=[]){if(!Number.isFinite(dt)||dt<=0)return 0;dt=Math.min(dt,1/15);const paws=[...obstacles].slice(0,10),clearance=Math.max(10,Math.min(150,Number(config.pawAvoidanceRadius)||50))+radius(config.size,w,h);const r=radius(config.size,w,h),active=mice.filter(m=>m.hiddenUntil<=time&&m.state!=='defeated'&&m.state!=='away');let collisions=0;
 const travel=Math.max(1,Math.min(4,Number(config.travelSpeed)||1));
 const steps=Math.max(1,Math.ceil(dt/(1/120))),step=dt/steps;
 for(let s=0;s<steps;s++){
  for(const m of active){m.vx??=0;m.vy??=0;if((m.tossUntil||0)>time){m.vx*=Math.exp(-step*3.4);m.vy*=Math.exp(-step*3.4);m.x+=m.vx*step;m.y+=m.vy*step;continue;}advanceContactAnchor(m,time,step);if(m.hold){const hold=m.hold;if(hold.part==='body'||hold.part==='head'||!hold.active){constrainContact(m,config.size,time,step);continue;}const angle=Math.atan2(m.y-hold.y,m.x-hold.x)+Math.sin((time-hold.startedAt)*9)*.4;m.targetX=m.x+Math.cos(angle)*120;m.targetY=m.y+Math.sin(angle)*120;m.restUntil=0;}let dx=m.targetX-m.x,dy=m.targetY-m.y;const straight=Math.hypot(dx,dy);if(m.reaction==='zigzag'&&(m.scrambleUntil||0)>time&&straight>1){const weave=Math.sin((time-m.hitAt)*15)*.65;[dx,dy]=[dx-dy*weave,dy+dx*weave];}[dx,dy]=avoidPaws(m,dx,dy,paws,clearance,Number(config.pawAvoidanceRadius)||50);const d=Math.hypot(dx,dy);const scared=(m.startledUntil||0)>time;const variation=config.variation?1+.18*Math.sin(time*3+m.seed):1;const injured=(m.injuredUntil||0)>time;
   const escape=(m.scrambleUntil||0)>time?(m.reaction==='dash'?2.35:1.95):scared?1.65:1;
   const limpPace=injured?.48*(.8+.2*Math.sin((time-m.hitAt)*12)):1;
   const pace=m.hold?65:(115+config.speed*130)*travel*(m.huntSpeed??1)*(m.hunt?1:variation)*escape*limpPace;
   const threatened=paws.some(p=>!p.recent&&Math.hypot(m.x-p.x,m.y-p.y)<clearance+Math.max(0,(p.radius||0)-(Number(config.pawAvoidanceRadius)||50))+25);
   if(m.arrivalTarget&&(threatened||m.hold||Math.hypot(m.targetX-m.arrivalTarget.x,m.targetY-m.arrivalTarget.y)>1))delete m.arrivalTarget;
   const arrived=!!m.arrivalTarget;
   const ready=!arrived&&d>5&&(time>=m.restUntil||threatened);
   const error=ready?Math.atan2(Math.sin(Math.atan2(dy,dx)-m.angle),Math.cos(Math.atan2(dy,dx)-m.angle)):0;
   const speed=Math.hypot(m.vx,m.vy),localSpeed=speed/Math.max(.1,config.size)/(m.hold?1:travel);
   // Brake for reversals; at speed, a wider arc replaces a sideways slide.
   const maxTurn=(m.hold?1.6:scared?9:7)/(1+localSpeed/240);
   const targetTurn=ready?clamp(error*9,-maxTurn,maxTurn):0;
   m.turnRate??=0;m.turnRate+=clamp(targetTurn-m.turnRate,-32*step,32*step);
   const rotation=m.turnRate*step;
   if(!ready){m.turnRate=0;}else if(Math.abs(rotation)>=Math.abs(error)&&rotation*error>=0){m.angle+=error;m.turnRate=0;}else m.angle+=rotation;
   const alignment=Math.max(0,Math.cos(error));
   const desired=ready?Math.min(pace,d*3)*alignment*alignment:0;
   const blend=1-Math.exp(-step*(scared?18:12));
   m.vx+=(Math.cos(m.angle)*desired-m.vx)*blend;m.vy+=(Math.sin(m.angle)*desired-m.vy)*blend;
   const oldX=m.x,oldY=m.y;m.x+=m.vx*step;m.y+=m.vy*step;
   // Stop on swept arrival, rather than orbiting a target passed between frames.
   if(!m.hold&&!threatened){const sx=m.x-oldX,sy=m.y-oldY,len=sx*sx+sy*sy;
    const u=len>0?clamp(((m.targetX-oldX)*sx+(m.targetY-oldY)*sy)/len,0,1):0;
    if(arrived||Math.hypot(oldX+u*sx-m.targetX,oldY+u*sy-m.targetY)<=5){m.arrivalTarget={x:m.targetX,y:m.targetY};m.vx=m.vy=m.turnRate=0;}
   }
   if(config.bounded&&(m.x<r||m.x>w-r)){m.x=clamp(m.x,r,w-r);m.vx*=-.85;m.targetX=clamp(m.x+Math.sign(m.vx)*250,r,w-r);m.next=time+.45;}
   if(config.bounded&&(m.y<r||m.y>h-r)){m.y=clamp(m.y,r,h-r);m.vy*=-.85;m.targetY=clamp(m.y+Math.sign(m.vy)*250,r,h-r);m.next=time+.45;}
  }
  for(let pass=0;pass<3;pass++)for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=r*2)continue;if(d<.001){dx=Math.cos(i*2.4+j);dy=Math.sin(i*2.4+j);d=1;}const nx=dx/d,ny=dy/d,overlap=r*2-Math.hypot(b.x-a.x,b.y-a.y);const wa=a.hold?0:1,wb=b.hold?0:1,total=wa+wb;if(!total)continue;a.x-=nx*overlap*wa/total;a.y-=ny*overlap*wa/total;b.x+=nx*overlap*wb/total;b.y+=ny*overlap*wb/total;if(config.bounded){if(wa){a.x=clamp(a.x,r,w-r);a.y=clamp(a.y,r,h-r);}if(wb){b.x=clamp(b.x,r,w-r);b.y=clamp(b.y,r,h-r);}}const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(closing<0){const impulse=-closing*1.76/total;a.vx-=impulse*nx*wa;a.vy-=impulse*ny*wa;b.vx+=impulse*nx*wb;b.vy+=impulse*ny*wb;collisions++;for(const[m,sign]of[[a,-1],[b,1]]){if(!m.hunt&&!m.leaving&&!m.entering){m.targetX=clamp(m.x+sign*nx*260,r,w-r);m.targetY=clamp(m.y+sign*ny*260,r,h-r);m.next=time+.65;}if(m.state!=='hurt'&&!m.hunt)m.restUntil=0;}}}
  for(const m of active){constrainPaws(m,paws,clearance,step,Number(config.pawAvoidanceRadius)||50);constrainContact(m,config.size,time,step);}
 }
 for(const m of active){m.speed=Math.hypot(m.vx,m.vy);m.moving=m.speed>8;}
 return collisions;
}
