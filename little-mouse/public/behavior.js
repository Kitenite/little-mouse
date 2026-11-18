const margin=size=>140*size;
export function sendOffscreen(m,time,w,h,size,rng=Math.random,edge){
 edge??=Math.floor(rng()*4);const pad=margin(size)+70;
 const targets=[[-pad,rng()*h],[w+pad,rng()*h],[rng()*w,-pad],[rng()*w,h+pad]];
 [m.targetX,m.targetY]=targets[edge];m.exitEdge=edge;m.leaving=true;m.entering=false;m.next=time+12;m.restUntil=Math.min(m.restUntil||0,time);return edge;
}
export function pressMouse(m,x,y,time,w,h,size,rng=Math.random){
 if(m.hiddenUntil>time||m.state==='defeated'||(m.invulnerableUntil||0)>time)return null;
 const roll=rng();m.reaction=roll<.28?'squash':roll<.45?'tumble':roll<.65?'zigzag':roll<.76?'limp':roll<.88?'dash':'stunned';
 m.invulnerableUntil=time+.8;m.hitAt=time;m.vx=m.vy=0;m.speed=0;m.moving=false;
 if(roll<.45){m.state='defeated';m.defeatedUntil=time+.95;m.leaving=false;m.restUntil=time+2;return'defeated';}
 const stun=m.reaction==='stunned'?.55:.2;
 m.state='hurt';m.hurtUntil=time+stun;m.startledUntil=time+2.2;m.scrambleUntil=time+2.2;m.injuredUntil=m.reaction==='limp'?time+5:0;
 const dx=m.x-x,dy=m.y-y;const edge=Math.abs(dx)>Math.abs(dy)?(dx<0?0:1):(dy<0?2:3);
 sendOffscreen(m,time,w,h,size,rng,edge);m.restUntil=time+stun;return'hurt';
}
// A sharp impact spreads the silhouette as it compresses against the floor.
// Survivors rebound after the brief stun; defeated mice remain flattened.
export function impactPose(m,time){
 const age=time-m.hitAt;
 if(!Number.isFinite(age)||age<0||age>1||m.state==='away')return{x:1,y:1,z:1,shake:0};
 const down=m.state==='defeated';
 const attack=Math.min(1,age/.045);
 const hold=m.reaction==='stunned'?.51:.16;
 const recovery=down?1:Math.max(0,1-Math.max(0,age-hold)/.2);
 const squash=attack*recovery;
 const rebound=!down&&age>.36&&age<.55?Math.sin((age-.36)/.19*Math.PI)*.12:0;
 return{x:1+.28*squash-rebound*.3,y:1+.65*squash-rebound*.5,z:1-.87*squash+rebound,shake:Math.sin(age*90)*Math.exp(-age*18)*8};
}
export function updateLifecycle(m,time,w,h,size,hide=0,rng=Math.random){
 if(m.state==='defeated'){
  if(time<m.defeatedUntil)return false;
  m.state='away';m.hiddenUntil=time+Math.max(.7,hide);m.leaving=false;
 }
 if(m.hiddenUntil>time)return false;
 if(m.state==='away'){
  // Re-enter from another edge, beyond the full body and tail silhouette.
  const edge=((m.exitEdge??Math.floor(rng()*4))+1+Math.floor(rng()*3))%4,pad=margin(size);
  const positions=[[-pad,rng()*h],[w+pad,rng()*h],[rng()*w,-pad],[rng()*w,h+pad]];
  [m.x,m.y]=positions[edge];m.targetX=w*(.2+rng()*.6);m.targetY=h*(.2+rng()*.6);
  m.reaction=null;m.hitAt=undefined;m.scrambleUntil=0;m.injuredUntil=0;m.turnRate=0;
  m.angle=Math.atan2(m.targetY-m.y,m.targetX-m.x);m.vx=m.vy=0;m.restUntil=0;m.next=time+10;m.entering=true;m.leaving=false;m.state='active';
 }
 if(m.state==='hurt'&&time>=m.hurtUntil)m.state='active';
 const pad=margin(size);
 if(m.leaving){const edge=m.exitEdge;m.targetX=edge===0?-pad-70:edge===1?w+pad+70:Math.max(0,Math.min(w,m.targetX));m.targetY=edge===2?-pad-70:edge===3?h+pad+70:Math.max(0,Math.min(h,m.targetY));}
 if(m.leaving&&(m.x < -pad||m.x>w+pad||m.y < -pad||m.y>h+pad)){
  m.state='away';m.hiddenUntil=time+Math.max(.7,hide)+rng()*1.1;m.moving=false;m.vx=m.vy=0;return false;
 }
 if(m.entering&&m.x>60&&m.x<w-60&&m.y>60&&m.y<h-60){m.entering=false;m.next=time+.4;}
 // If an impact carries a mouse across an edge, let it complete the exit.
 if(!m.entering&&!m.leaving&&(m.x<0||m.x>w||m.y<0||m.y>h))sendOffscreen(m,time,w,h,size,rng,m.x<0?0:m.x>w?1:m.y<0?2:3);
 return true;
}
