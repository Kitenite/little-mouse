import {createHuntChapters,advanceHuntChapters} from './hunt-chapters.js';
import {updateLifecycle,sendOffscreen} from './behavior.js';
import {planHuntRoute,advanceHuntRoute} from './hunt-routes.js';
import {groupWeight,deferSoloExit} from './hunt-group.js';
import {physicalBounds} from './mouse-identity.js';

export const huntDefaults = {huntTempo: 1};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const between = (rng, lo, hi) => lo + rng() * (hi - lo);
const pace = {peek:.24, watch:0, creep:.28, dart:1.22, traverse:1.1, retreat:1.55};
const tuning=(config,key)=>clamp(Number(config[key])||1,.5,2);
const coverPad=(m,config)=>(Math.max(150,physicalBounds(m.identity,config).tail+15)*config.size+30);
function silhouetteVisible(m, size, w, h) {
  const reach=47*size;
  return m.x>-reach&&m.x<w+reach&&m.y>-reach&&m.y<h+reach;
}
export function createHuntDirector(seed) { return {touches:[], serial:0, nextEntrance:0, chapters:createHuntChapters(seed)}; }
export function rememberTouch(director, x, y, time, w, h, details={}) {
  director.touches.push({x:x/w, y:y/h, time, serial:++director.serial,miss:details.miss===true,pointerId:details.pointerId});
  director.touches = director.touches.filter(p => time-p.time < 24).slice(-12);
}
// Edge coordinates are recomputed on resize. At peek depth the nose and ears
// emerge first; the body and tail remain beyond the screen's natural cover.
function edgePoint(edge, slot, depth, w, h) {
  return edge===0 ? [depth,h*slot] : edge===1 ? [w-depth,h*slot] : edge===2 ? [w*slot,depth] : [w*slot,h-depth];
}
function pawReach(p,director) {
  return ((director.pawClearance||100)+Math.max(0,(p.radius||0)-(director.pawBaseRadius||50)))*(p.memory??1);
}
function blockedMouth(x,y,director) {
  return [...director.paws?.values()||[]].some(p=>Math.hypot(x-p.x,y-p.y)<pawReach(p,director));
}
function cover(m, time, w, h, director, rng, preferSame=false) {
  const old=m.hunt?.edge;
  let best, score=-Infinity;
  for(let edge=0;edge<4;edge++) {
    const slot=preferSame&&edge===old ? m.hunt.slot : between(rng,.18,.82);
    const [x,y]=edgePoint(edge,slot,0,w,h);
    // Once hidden, unseen travel has no useful distance cost. Keeping that cost
    // made over 90% of entrances reuse the exit edge despite the variety policy.
    let value=rng()*.35 - (m.state==='away'&&m.hunt?0:Math.hypot(x-m.x,y-m.y)/Math.hypot(w,h)*.6);
    if(preferSame&&edge===old)value+=.9;
    for(const p of director.touches){const age=time-p.time;if(age<16)value-=Math.exp(-age/5)*Math.exp(-Math.hypot(x/w-p.x,y/h-p.y)*5)*2;}
    // An open entrance outranks familiar cover; use the exact entry clearance,
    // including contact size and released-footprint decay. All blocked still waits.
    if(blockedMouth(x,y,director))value-=100;
    for(const p of director.paws?.values()||[]){const reach=pawReach(p,director)*1.5,distance=Math.hypot(x-p.x,y-p.y);if(reach>0&&distance<reach)value-=8*(1-distance/reach);}
    // Reserve room around a companion already emerging through this mouth.
    const separation=Math.min(78*(director.group?.size||1),Math.min(w,h)*.36)+40;
    for(const other of director.group?.members||[]){if(other!==m&&other.state==='active'){
      const distance=Math.hypot(x-other.x,y-other.y);if(distance<separation)value-=4*(1-distance/separation);
    }}
    if(value>score){score=value;best={edge,slot};}
  }
  return best;
}
// Each appearance has a coherent motif, drawn without replacement. Decisions stay
// at phase boundaries: variety must not become per-frame heading noise.
const motifs={
 runner:{watch:.5,creep:.45,dart:1.5,traverse:1.5,dwell:.65},
 scout:{watch:.9,creep:2,dart:.7,traverse:.55,dwell:1},
 tease:{watch:1.5,creep:1.2,dart:.7,traverse:.45,dwell:1.15},
 burst:{watch:.65,creep:.6,dart:2,traverse:.9,dwell:.6},
};
function nextMotif(a,rng){
 if(!a.motifBag?.length){
  a.motifBag=Object.keys(motifs);
  for(let i=a.motifBag.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a.motifBag[i],a.motifBag[j]]=[a.motifBag[j],a.motifBag[i]];}
  if(a.motifBag.at(-1)===a.motif)[a.motifBag[0],a.motifBag[a.motifBag.length-1]]=[a.motifBag.at(-1),a.motifBag[0]];
 }
 a.motif=a.motifBag.pop();a.transitions=[];
 a.visibleBudget=between(rng,10,19);
}
function enter(m, phase, time, config, w, h, rng, director) {
  const a=m.hunt, previousPhase=a.phase, tempo=clamp(Number(config.huntTempo)||1,.5,2);
  a.chapter=director.chapters?.current||{id:'mixed',weights:{}};
  a.transitions??=[];if(previousPhase)a.transitions.push(previousPhase+'>'+phase);a.transitions=a.transitions.slice(-8);
  a.phase=phase;a.since=time;a.arrivedAt=null;a.history.push(phase);a.history=a.history.slice(-4);
  delete a.progress;delete a.travelProgress;delete a.route;
  a.dwell=between(rng,.65,1.65)/tempo;
  a.deadline=time+Math.max(4,Math.hypot(w,h)/Math.max(60,115+config.speed*130)*5)/tempo;
  m.restUntil=0;m.next=time;m.leaving=false;m.entering=false;m.huntSpeed=pace[phase]??1;
  if(phase==='creep'||phase==='dart')m.huntSpeed*=tuning(config,phase+'Speed');
  if(phase==='hidden') {
    const delay=config.hide>0 ? clamp(config.hide*between(rng,.7,1.25)*(a.chapter.hide??1)+a.fear, .8,20) : .65;
    a.deadline=time+delay;m.state='away';m.hiddenUntil=a.deadline;m.vx=m.vy=m.speed=0;m.moving=false;
    a.visibleSince=null;delete a.handoffUntil;return;
  }
  m.state='active';m.hiddenUntil=0;
  if(phase==='peek') {
    a.depth=-10*config.size;
    a.dwell=between(rng,.7,1.6)/tempo*tuning(config,'peekDuration');
  } else if(phase==='watch') {
    a.goal=[clamp(m.x/w,0,1),clamp(m.y/h,0,1)];
    a.dwell=between(rng,.8,2)/tempo*tuning(config,'watchDuration');
    m.restUntil=time+a.dwell;
  } else if(phase==='creep') {
    a.depth=Math.min(65*config.size,Math.min(w,h)*.27);
    const latest=director.touches.at(-1);
    // Investigate where a paw WAS, after it has been quiet. No camera inference.
    if(latest&&time-latest.time>7&&time-latest.time<22&&a.fear<.5&&rng()<.55)
      a.goal=[clamp(latest.x+between(rng,-.12,.12),.18,.82),clamp(latest.y+between(rng,-.12,.12),.18,.82)];
    else if(previousPhase==='peek') {const [x,y]=edgePoint(a.edge,a.slot,a.depth,w,h);a.goal=[x/w,y/h];}
    else {
      // Sniff a fresh patch ahead, rather than returning to the entrance's exact spot.
      const heading=m.angle+between(rng,-.85,.85),reach=Math.min(w,h)*between(rng,.12,.3);
      const inset=Math.min(65*config.size,Math.min(w,h)*.22);
      a.goal=[clamp(m.x+Math.cos(heading)*reach,inset,w-inset)/w,clamp(m.y+Math.sin(heading)*reach,inset,h-inset)/h];
    }
  } else if(phase==='dart') {
    // A dart is a brief commitment, never a long push against another mouse.
    a.deadline=time+6;
    const angle=m.angle+between(rng,-1.1,1.1),reach=Math.min(w,h)*between(rng,.26,.55);
    const inset=Math.min(65*config.size,Math.min(w,h)*.22);
    a.goal=[clamp(m.x+Math.cos(angle)*reach,inset,w-inset)/w,clamp(m.y+Math.sin(angle)*reach,inset,h-inset)/h];
    a.dwell=between(rng,.18,.45)/tempo;
    if(rng()<(a.chapter.routeChance??(a.motif==='runner'||a.motif==='burst'?.85:.5))){
      a.route=planHuntRoute(m,w,h,rng,a.chapter);a.goal=a.route.points[0];
      a.deadline=time+Math.max(8,Math.hypot(w,h)/Math.max(60,115+config.speed*130)*5);
    }
  } else if(phase==='retreat') {
    // A blocked peek backs out along its approach instead of crossing the playfield.
    if(previousPhase!=='peek')Object.assign(a,cover(m,time,w,h,director,rng,true));
    a.depth=-coverPad(m,config);
    a.dwell=0;
  } else if(phase==='traverse') {
    // Commit to the opposite screen edge, then disappear completely into cover.
    a.crossEdge=a.edge===0?1:a.edge===1?0:a.edge===2?3:2;
    a.crossSlot=between(rng,.25,.75);a.depth=-coverPad(m,config);a.dwell=0;
    a.deadline=time+Math.max(8,Math.hypot(w,h)/(115+config.speed*130)*3);
    m.huntSpeed=pace.traverse*tuning(config,'dartSpeed');
  }
  if(phase==='watch'||phase==='creep'||phase==='dart'){a.dwell*=(motifs[a.motif]?.dwell??1)*(a.chapter.dwell??1);if(phase==='watch')m.restUntil=time+a.dwell;}
}
function choose(a, rng, config, time, director, m) {
  const motif=motifs[a.motif]||motifs.scout;
  const cross=clamp(Number(config.runThroughChance??.22),0,1);
  if(a.phase==='peek'&&rng()<(cross===1?1:cross*motif.traverse*(a.chapter?.weights.traverse??1)*groupWeight(director,m,'traverse')))return 'traverse';
  if(config.hide>0&&a.visibleSince!==null&&time-a.visibleSince>(a.visibleBudget??14)*(a.chapter?.visibleBudget??1))return 'retreat';
  const options=a.phase==='peek' ? [['watch',.5],['creep',1.5],['dart',1.2],['retreat',config.hide>0?.35+a.fear:0]]
    : a.phase==='watch' ? [['creep',1],['dart',.8],['retreat',config.hide>0?.45+a.fear:0]]
    : a.phase==='creep' ? [['watch',1.5],['dart',.8],['retreat',config.hide>0?.45+a.fear:0]]
    : [['watch',1.6],['creep',.4],['retreat',config.hide>0?.9+a.fear:0]];
  if(a.phase==='dart'&&a.history.slice(-2).filter(p=>p==='dart').length<2)options.push(['dart',a.motif==='burst'?2:.25]);
  for(const option of options){
    const repeated=(a.transitions||[]).filter(t=>t===a.phase+'>'+option[0]).length;
    option[1]*=groupWeight(director,m,option[0])*(a.chapter?.weights[option[0]]??1)*(motif[option[0]]??1)*Math.pow(.35,a.history.filter(p=>p===option[0]).length)*Math.pow(.25,repeated);
  }
  let roll=rng()*options.reduce((sum,p)=>sum+p[1],0);
  return options.find(p=>(roll-=p[1])<=0)?.[0]||'watch';
}
function discardReaction(a) {
  delete a.reactAt;delete a.reactKind;delete a.lookAt;delete a.pounce;
}
export function clearHunt(m,time) {
  delete m.hunt;delete m.huntSpeed;m.restUntil=Math.min(m.restUntil||0,time);
}
// Semi-Markov policy: transition on arrival + dwell, not on a frame lottery.
// Injury/manual control have priority. Timing uses paused simulation time only.
export function updateHunt(m,config,time,w,h,manual=false,rng=Math.random,director=createHuntDirector()) {
  if(config.mode==='hunt'&&!manual&&director.chapters)advanceHuntChapters(director.chapters,time);
  m.physicalBounds=physicalBounds(m.identity,config);
  if(m.hold){
    if(m.hunt){discardReaction(m.hunt);delete m.hunt.travelProgress;m.hunt.sensed=director.serial;}
    return true;
  }
  director.pawBaseRadius=Number(config.pawAvoidanceRadius)||50;
  director.pawClearance=Math.max(10,Math.min(150,Number(config.pawAvoidanceRadius)||50))+Math.min(39*config.size,Math.min(w,h)*.18);
  if(config.mode!=='hunt'||manual){if(m.hunt)clearHunt(m,time);return false;}
  if(!m.hunt){
    m.hunt={...cover(m,time,w,h,director,rng),fear:0,history:[],lastTime:time,sensed:director.serial,visibleSince:time};
    nextMotif(m.hunt,rng);
    if(m.state==='hurt'||m.state==='defeated'||m.leaving) m.hunt.phase='injury';
    else if(m.state==='away') {enter(m,'hidden',time,config,w,h,rng,director);m.hunt.deadline=time+.35+(m.castIndex||0)*1.4;m.hiddenUntil=m.hunt.deadline;}
    else enter(m,'watch',time,config,w,h,rng,director);
  }
  const a=m.hunt;
  if(a.phase==='toss'){
    // The game may skip policy updates while airborne. Reset on landing too,
    // consuming only pre-release cues so a new paw strike is still noticed.
    discardReaction(a);
    for(const p of director.touches)if(p.time<m.tossAt)a.sensed=Math.max(a.sensed,p.serial);
  }
  if((m.tossUntil||0)>time){delete a.travelProgress;return true;}
  if(a.phase==='toss'){
    if(m.x<0||m.x>w||m.y<0||m.y>h){sendOffscreen(m,time,w,h,config.size,rng,m.x<0?0:m.x>w?1:m.y<0?2:3);a.phase='injury';}
    else {m.reaction=null;enter(m,'watch',time,config,w,h,rng,director);}
  }
  a.fear*=Math.exp(-Math.max(0,time-a.lastTime)/6);a.lastTime=time;
  if((m.harmlessUntil||0)>time) {
    a.phase='touch';a.sensed=director.serial;delete a.reactAt;delete a.reactKind;
    m.huntSpeed=m.reaction==='dodge'?1.1:0;return true;
  }
  if(a.phase==='touch'&&m.state!=='hurt'&&m.state!=='defeated') {m.reaction=null;enter(m,'watch',time,config,w,h,rng,director);}
  if(m.state==='hurt'||m.state==='defeated'||a.phase==='injury'||(m.injuredUntil||0)>time) {
    // Injury owns the response. Do not replay a pre-impact decision on reentry.
    a.sensed=director.serial;delete a.reactAt;delete a.reactKind;delete a.lookAt;delete a.pounce;
    delete a.pounce;a.phase='injury';m.huntSpeed=1;
    if(m.state==='away') {enter(m,'hidden',time,config,w,h,rng,director);return true;}
    updateLifecycle(m,time,w,h,config.size,config.hide,rng,config);
    if(m.state==='active'&&!m.leaving&&(m.injuredUntil||0)<=time)enter(m,'watch',time,config,w,h,rng,director);
    return true;
  }
  if(a.phase==='hidden') {
    // A director spaces entrances; hidden cast members never collide or get hit.
    if(time<a.deadline||time<director.nextEntrance){m.hiddenUntil=Math.max(a.deadline,director.nextEntrance);return true;}
    Object.assign(a,cover(m,time,w,h,director,rng,rng()<(director.chapters?.current.familiar??.35)));
    const mouth=edgePoint(a.edge,a.slot,0,w,h);
    if(blockedMouth(mouth[0],mouth[1],director)){a.deadline=time+.35;m.hiddenUntil=a.deadline;return true;}
    [m.x,m.y]=edgePoint(a.edge,a.slot,-coverPad(m,config),w,h);
    m.angle=[0,Math.PI,Math.PI/2,-Math.PI/2][a.edge];m.vx=m.vy=m.speed=m.turnRate=0;
    m.reaction=null;m.hitAt=undefined;m.startledUntil=m.scrambleUntil=m.injuredUntil=0;
    director.nextEntrance=time+between(rng,1.3,2.5);
    nextMotif(a,rng);
    enter(m,'peek',time,config,w,h,rng,director);
  }
  // Notice new nearby paw strikes after a short reaction delay. Continued tapping
  // strengthens fear but cannot restart the delay forever.
  for(const p of director.touches){if(p.serial<=a.sensed)continue;a.sensed=p.serial;
    if(time-p.time>=1)continue;
    const sensitivity=tuning(config,'touchSensitivity');
    const distance=Math.hypot(m.x-p.x*w,m.y-p.y*h),near=(100+config.size*35)*sensitivity;
    const close=distance<near,moderate=distance<Math.max(near*1.7,Math.hypot(w,h)*.55*sensitivity);
    a.fear=clamp(a.fear+(close?.6:moderate?.22:.06),0,2.5);
    a.misses=(a.misses||[]).filter(t=>time-t<6);
    if(close&&p.miss)a.misses.push(p.time);a.misses=a.misses.slice(-4);
    const kind=close&&p.miss&&a.misses.length<3?'evade':close||(moderate&&a.fear>1.05)?'retreat':moderate?'freeze':'orient';
    const priority={orient:1,freeze:2,evade:3,retreat:4};
    if(!a.reactKind||priority[kind]>=priority[a.reactKind]){a.reactKind=kind;a.lookAt=[p.x,p.y];}
    a.reactAt??=time+between(rng,.16,.3)*tuning(config,'reactionDelay');
  }
  if(a.reactAt&&time>=a.reactAt){delete a.reactAt;const kind=a.reactKind;delete a.reactKind;
    if(a.phase!=='retreat'){
      delete a.pounce;
      if(kind==='evade'&&silhouetteVisible(m,config.size,w,h)){
        const [px,py]=a.lookAt,dx=m.x-px*w,dy=m.y-py*h,angle=Math.atan2(dy,dx);
        enter(m,'dart',time,config,w,h,rng,director);delete a.route;
        const reach=Math.min(w,h)*.28,inset=Math.min(45*config.size,Math.min(w,h)*.2);
        a.goal=[clamp(m.x+Math.cos(angle)*reach,inset,w-inset)/w,clamp(m.y+Math.sin(angle)*reach,inset,h-inset)/h];
        a.pounce={stage:'dodge',at:time,origin:[px,py]};a.dwell=.08;a.deadline=time+2.5;m.startledUntil=time+.8;
      }else if(kind==='retreat'||kind==='evade'){enter(m,'retreat',time,config,w,h,rng,director);m.startledUntil=time+1.2;}
      else {enter(m,'watch',time,config,w,h,rng,director);a.dwell=kind==='freeze'?between(rng,.35,.75):between(rng,.55,1);
        if(kind==='orient'){a.goal=a.lookAt;m.restUntil=time;}
        else m.restUntil=time+a.dwell;
      }
    }
  }
  if(a.phase==='peek') {
    const mouth=edgePoint(a.edge,a.slot,0,w,h);
    if(blockedMouth(mouth[0],mouth[1],director))enter(m,'retreat',time,config,w,h,rng,director);
  }
  if(a.phase==='dart')advanceHuntRoute(m,w,h,time);
  let target;
  if(a.phase==='traverse')target=edgePoint(a.crossEdge,a.crossSlot,a.depth,w,h);
  else if(a.phase==='peek'||a.phase==='retreat')target=edgePoint(a.edge,a.slot,a.depth,w,h);
  else target=[a.goal[0]*w,a.goal[1]*h];
  // A live paw is never an investigation destination, even after its original tap is old.
  for(let pass=0;pass<3;pass++)for(const p of director.paws?.values()||[]){if(p.recent)continue;
    const reach=pawReach(p,director)+35,dx=target[0]-p.x,dy=target[1]-p.y,d=Math.hypot(dx,dy);
    if(d<reach){const ax=m.x-p.x,ay=m.y-p.y,a=Math.hypot(ax,ay);const nx=a>.01?ax/a:Math.cos(m.angle),ny=a>.01?ay/a:Math.sin(m.angle);target=[p.x+nx*reach,p.y+ny*reach];}
  }
  [m.targetX,m.targetY]=target;
  const distance=Math.hypot(m.x-m.targetX,m.y-m.targetY);
  if(a.phase!=='retreat'&&a.visibleSince===null&&silhouetteVisible(m,config.size,w,h))a.visibleSince=time;
  if(a.phase==='peek') {
    // Cross invisible space promptly, then ease into the slow visible nose peek.
    // Otherwise large/slow mice spend their entire exploration budget offscreen.
    const base=Math.max(1,115+config.speed*130);
    const blend=clamp((distance-35*config.size)/(65*config.size),0,1);
    m.huntSpeed=pace.peek+(Math.max(1,240/base)-pace.peek)*blend;
    if(!silhouetteVisible(m,config.size,w,h))m.huntSpeed=Math.max(m.huntSpeed,110/base);
  }
  if(a.phase==='peek'&&a.arrivedAt===null&&silhouetteVisible(m,config.size,w,h)){
    a.progress??={time,distance};
    if(time-a.progress.time>=2.5){
      if(a.progress.distance-distance<4&&distance>15){
        // Collision-separated bodies can never reach two overlapping peek goals.
        // Back out from the CURRENT lane, then choose new cover while concealed.
        a.slot=clamp(a.edge<2?m.y/h:m.x/w,.02,.98);
        enter(m,'retreat',time,config,w,h,rng,director);return true;
      }
      a.progress={time,distance};
    }
  }
  if(a.phase==='creep'&&a.arrivedAt===null&&distance>=8){
    // Collision projection can cancel every step while velocity still reports
    // movement. Measure the actual path; a paw detour moving away from the goal
    // is still progress. Goal/viewport changes and holds start a fresh window.
    const key=[...a.goal,w,h].join(':');
    if(!a.travelProgress||a.travelProgress.key!==key)
      a.travelProgress={key,time,x:m.x,y:m.y,travel:0};
    const p=a.travelProgress;
    p.travel+=Math.hypot(m.x-p.x,m.y-p.y);p.x=m.x;p.y=m.y;
    if(time-p.time>=2.5){
      if(p.travel<4){enter(m,'watch',time,config,w,h,rng,director);return true;}
      p.time=time;p.travel=0;
    }
  }else delete a.travelProgress;
  if(a.phase==='dart'&&a.arrivedAt===null) {
    a.progress??={time,distance};
    if(time-a.progress.time>=1.5) {
      if(a.progress.distance-distance<12) {
        // Yield after a blocked charge. The following decision can take another
        // route; this does not truncate deliberately slow creeping or injury.
        enter(m,'watch',time,config,w,h,rng,director);return true;
      }
      a.progress={time,distance};
    }
  }
  if(distance<8||(a.phase==='watch'))a.arrivedAt??=time;
  if(a.phase==='traverse'){
    const pad=coverPad(m,config)-15;
    const crossed=a.crossEdge===0?m.x < -pad:a.crossEdge===1?m.x>w+pad:a.crossEdge===2?m.y < -pad:m.y>h+pad;
    if(crossed){a.edge=a.crossEdge;a.slot=a.crossSlot;enter(m,'hidden',time,config,w,h,rng,director);return true;}
    // Retarget only after a genuine obstruction; do not vanish in the viewport.
    if(time>a.deadline)enter(m,'retreat',time,config,w,h,rng,director);
    return true;
  }
  if(a.phase==='retreat'){
    const pad=coverPad(m,config)-15;
    // Full concealment completes the exit even if another mouse prevents exact
    // arrival at its offscreen waypoint. Never leave invisible colliders pushing.
    if(distance<15||m.x < -pad||m.x>w+pad||m.y < -pad||m.y>h+pad){enter(m,'hidden',time,config,w,h,rng,director);return true;}
  }
  // A peek must reach the edge before it may become a stationary watch. A
  // timeout while still invisible must not leave a frozen offscreen mouse.
  if((a.arrivedAt!==null&&time-a.arrivedAt>=a.dwell)||(time>a.deadline&&a.phase!=='peek')){
    if(a.pounce?.stage==='dodge'){
      const memory=a.pounce;
      // A near miss earns a brief visible check-back only after reaching safety.
      if(!blockedMouth(m.x,m.y,director)){
        enter(m,'watch',time,config,w,h,rng,director);a.pounce={...memory,stage:'hesitate'};
        a.dwell=between(rng,.2,.4);m.restUntil=time+a.dwell;a.deadline=time+a.dwell+.1;
      }else {delete a.pounce;enter(m,'retreat',time,config,w,h,rng,director);}
    }else if(a.pounce?.stage==='hesitate'){
      delete a.pounce;enter(m,'dart',time,config,w,h,rng,director);
    }else{
      let phase=choose(a,rng,config,time,director,m);
      if(['retreat','traverse'].includes(phase)&&deferSoloExit(director,m,time))phase='creep';
      enter(m,phase,time,config,w,h,rng,director);
    }
  }
  return true;
}

// Explicit lab entry point: reuse the exact gameplay transition and target logic.
// Callers restore a hittable mouse before forcing a new scenario.
export function forceHuntPhase(m,phase,time,config,w,h,rng=Math.random,director=createHuntDirector()){
 if(!['peek','watch','creep','dart','traverse','retreat','hidden'].includes(phase))throw Error('Unknown hunt phase');
 const huntConfig={...config,mode:'hunt'};
 if(!m.hunt)updateHunt(m,huntConfig,time,w,h,false,rng,director);
 enter(m,phase,time,huntConfig,w,h,rng,director);
 updateHunt(m,huntConfig,time,w,h,false,rng,director);
 return m.hunt.phase;
}
