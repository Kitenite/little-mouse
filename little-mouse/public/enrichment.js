import{sendOffscreen}from'./behavior.js';

export const huntDefaults={huntTempo:1};
// A design experiment inspired by research.html, not a validated enrichment protocol.
// Elapsed game time freezes during pause/breaks; no wall-clock timers are used.
export function updateHunt(m,config,time,w,h,manual=false,rng=Math.random){
 if(config.mode!=='hunt'||manual){
  if(m.hunt){delete m.hunt;m.restUntil=Math.min(m.restUntil||0,time);}
  return false;
 }
 // Hits, escapes, re-entry, and nearby-touch flight keep their existing lifecycle.
 if(m.leaving||m.entering||m.state==='hurt'||m.state==='away'||m.state==='defeated'||m.hiddenUntil>time||(m.startledUntil||0)>time||(m.injuredUntil||0)>time){delete m.hunt;return true;}
 if(time<m.next)return true;
 const tempo=Math.max(.5,Math.min(2,Number(config.huntTempo)||1));
 const phase=m.hunt?.phase==='stalk'?'pause':m.hunt?.phase==='pause'?'burst':'stalk';
 const motif=config.variation?Math.floor(time/30)%3:0;
 m.hunt={phase,motif};
 if(phase==='stalk'&&config.hide>0&&rng()<.25){delete m.hunt;sendOffscreen(m,time,w,h,config.size,rng);return true;}
 const duration=(phase==='pause'?.7+rng()*1.8:phase==='stalk'?1.2+rng()*1.6:.45+rng()*.8)/tempo;
 m.next=time+duration;
 m.restUntil=phase==='pause'?m.next:time;
 if(phase!=='pause'){
  // Change path shape over time without automatically increasing speed or intensity.
  const angle=rng()*Math.PI*2,reach=phase==='stalk'?35+rng()*65:Math.min(w,h)*(.4+rng()*.4);
  const dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach;
  m.targetX=Math.max(65,Math.min(Math.max(65,w-65),m.x+dx*(motif===1?.35:1)));
  m.targetY=Math.max(90,Math.min(Math.max(90,h-70),m.y+dy*(motif===2?.35:1)));
 }
 return true;
}
