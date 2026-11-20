// Shared intent is sampled once per frame. Threat/hold/lifecycle always outrank it.
const visible=(m,w,h,size)=>m.state==='active'&&m.x>-40*size&&m.x<w+40*size&&m.y>-40*size&&m.y<h+40*size;
export function updateHuntGroup(director,mice,time,w,h,config){
 if(config.mode!=='hunt'){delete director.group;return;}
 const available=mice.filter(m=>!m.hold&&!['hurt','defeated'].includes(m.state)&&(m.injuredUntil||0)<=time&&(m.tossUntil||0)<=time);
 const epoch=Math.floor(time/19),offset=(director.groupSeed??=director.chapters?.seed||0)%Math.max(1,available.length);
 const focus=available.length?available[(epoch+offset)%available.length]:null;
 director.group={members:available,focus,time,w,h,size:config.size};
 for(const m of mice)m.huntRole=m===focus?'lead':'sneak';
 // Only expedite the next safe entrance when everyone is actually concealed.
 // Existing peek/traverse approaches are already an entrance in flight.
 if(available.length>1&&!available.some(m=>visible(m,w,h,config.size))&&available.every(m=>m.state==='away')){
  const next=available.reduce((a,b)=>(a.hunt?.deadline??Infinity)<=(b.hunt?.deadline??Infinity)?a:b);
  if(next.hunt?.phase==='hidden')next.hunt.deadline=Math.min(next.hunt.deadline,time+.5);
  director.nextEntrance=Math.min(director.nextEntrance,time+.5);
 }
}
export function groupWeight(director,m,phase){
 if((director.group?.members.length||0)<2)return 1;
 return m===director.group.focus?({dart:1.4,traverse:1.2,watch:.8}[phase]||1):({watch:1.6,creep:1.4,dart:.65,traverse:.65}[phase]||1);
}
export function deferSoloExit(director,m,time){
 const g=director.group;
 if(!g||g.members.length<2||!visible(m,g.w,g.h,g.size))return false;
 if(g.members.some(other=>other!==m&&visible(other,g.w,g.h,g.size)&&!['retreat','traverse'].includes(other.hunt?.phase))){delete m.hunt.handoffUntil;return false;}
 m.hunt.handoffUntil??=time+2.5;
 if(time>=m.hunt.handoffUntil)return false;
 const waiting=g.members.find(other=>other!==m&&other.hunt?.phase==='hidden');
 if(waiting)waiting.hunt.deadline=Math.min(waiting.hunt.deadline,time+.15);
 return true;
}
