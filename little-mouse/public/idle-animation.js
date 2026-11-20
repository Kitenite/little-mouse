// Short activity bouts share simulation timestamps with the renderer and audio.
// They never override a claim, threat, injury, or travelling mouse.
export const idleActivityDefaults={idleActivityFrequency:1};
export const idleActivityControls={idleActivityFrequency:{label:'Grooming and idle activity',min:0,max:2,step:.05}};
export const IDLE_ACTIVITIES=Object.freeze(['nibble','groom','scratch','stretch','roll']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const duration={nibble:1.1,groom:1.8,scratch:1.55,stretch:1.9,roll:1.65};
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const safe=(m,t)=>!m.hold&&m.state==='active'&&m.hunt?.phase==='watch'&&!m.moving&&(m.speed||0)<12&&(m.hunt?.fear||0)<.3&&(m.injuredUntil||0)<=t&&(m.startledUntil||0)<=t;
export function cancelIdleActivity(mouse){delete mouse.activity;mouse.nibblingUntil=0;}
export function forceIdleActivity(mouse,kind,time,config={},options={}){
 if(!IDLE_ACTIVITIES.includes(kind)||!safe(mouse,time))return false;
 const span=duration[kind]*(options.durationScale??1),side=options.side===-1?-1:1;
 mouse.activity={kind,at:time,until:time+span,side,forced:options.forced!==false};
 if(kind==='nibble'){mouse.nibblingAt=time;mouse.nibblingUntil=time+span;}else mouse.nibblingUntil=0;
 // Let a safe watch complete its one short activity; perception still runs and
 // may interrupt immediately. This is not a session or automatic break timer.
 if(mouse.hunt){const a=mouse.hunt;a.arrivedAt??=time;a.dwell=Math.max(a.dwell||0,time+span+.08-a.arrivedAt);a.deadline=Math.max(a.deadline||0,time+span+.1);}
 return true;
}
export function updateIdleBehavior(mouse,time,config={},rng=Math.random){
 const frequency=clamp(config.nibbleFrequency??1,0,2),activityFrequency=clamp(config.idleActivityFrequency??1,0,2);
 if(!safe(mouse,time)){cancelIdleActivity(mouse);if(mouse.nextNibbleAt===undefined)mouse.nextNibbleAt=time+8+rng()*14;return;}
 if(mouse.activity){const disabled=mouse.activity.kind==='nibble'?frequency===0:activityFrequency===0;if(time>=mouse.activity.until||disabled){mouse.lastActivity=mouse.activity.kind;cancelIdleActivity(mouse);}else return;}
 if(frequency===0)mouse.nibblingUntil=0;
 if(mouse.nextNibbleAt===undefined)mouse.nextNibbleAt=time+(8+rng()*14)/Math.max(.1,frequency);
 if(mouse.nextActivityAt===undefined)mouse.nextActivityAt=time+(9+rng()*14)/Math.max(.1,activityFrequency);
 if(frequency>0&&time>=mouse.nextNibbleAt){forceIdleActivity(mouse,'nibble',time,config,{forced:false,durationScale:(.7+rng()*.7)/duration.nibble});mouse.nextNibbleAt=time+(10+rng()*22)/frequency;return;}
 if(activityFrequency>0&&time>=mouse.nextActivityAt){const options=[['groom',.46],['scratch',.30],['stretch',.20],['roll',.04]].filter(([kind])=>kind!==mouse.lastActivity);let roll=rng()*options.reduce((sum,p)=>sum+p[1],0);const kind=options.find(([,weight])=>(roll-=weight)<=0)?.[0]||'groom';forceIdleActivity(mouse,kind,time,config,{forced:false,side:rng()<.5?-1:1});mouse.nextActivityAt=time+(12+rng()*18)/activityFrequency;}
}
export function activityPose(mouse,time){
 const a=mouse.activity;if(!a||mouse.hold||a.until<=time||time<a.at)return null;
 const elapsed=time-a.at,span=a.until-a.at,weight=smooth(elapsed/.18)*smooth((a.until-time)/.24),progress=clamp(elapsed/span,0,1);
 return{kind:a.kind,weight,elapsed,progress,side:a.side||1,roll:a.kind==='roll'?Math.sin(progress*Math.PI)**2*(a.side||1)*1.18:0};
}
export function nibblePose(mouse,time){
 if(mouse.hold||(mouse.nibblingUntil||0)<=time)return 0;
 return Math.max(0,Math.min(1,(time-(mouse.nibblingAt??time))/.16,(mouse.nibblingUntil-time)/.18));
}

// Pure simulation-time sampling: no timers, scheduling, travel edits or random draws.
// Renderers can reuse this hook without running the behavior scheduler.
export function watchPausePose(mouse,time){
 if(!Number.isFinite(time)||!safe(mouse,time)||(mouse.tossUntil||0)>time||
   mouse.entering||mouse.leaving||Math.abs(mouse.turnRate||0)>.3||
   (mouse.activity&&mouse.activity.at<=time&&mouse.activity.until>time)||
   (mouse.nibblingUntil||0)>time)return null;
 const at=Number.isFinite(mouse.hunt.arrivedAt)?mouse.hunt.arrivedAt:0;
 if(time<at)return null;
 const seed=Number.isFinite(mouse.identity?.seed)?mouse.identity.seed:0;
 const elapsed=time-at,phase=((seed%997)+997)%997/997*Math.PI*2;
 const weight=smooth(elapsed/.25),scan=Math.sin(elapsed*1.15+phase);
 // Two soft sniff pulses per cycle; each ear listens on its own slower rhythm.
 const sniff=Math.max(0,Math.sin(elapsed*4.6+phase))**6;
 return{head:weight*(.045*scan+.012*sniff),sniff:weight*sniff,
  earLeft:weight*.045*Math.sin(elapsed*1.7+phase),
  earRight:weight*.035*Math.sin(elapsed*2.1+phase+1.9)};
}
