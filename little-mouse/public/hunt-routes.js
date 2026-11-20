// Normalized, finite routes: broad runs with an optional edge hook, never a loop.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function planHuntRoute(m,w,h,rng=Math.random){
 const x=m.x/w,y=m.y/h;
 const horizontal=Math.abs(Math.cos(m.angle))>.55;
 const far=horizontal?(x<.5?.88:.12):(y<.5?.88:.12);
 const across=.2+rng()*.6;
 const first=horizontal?[far,across]:[across,far];
 const kind=rng()<.45?'edge-hook':'crossfield';
 let points;
 if(kind==='edge-hook'){
  const along=across<.5?.82:.18;
  points=horizontal?[first,[far,along],[1-far,clamp(along+(rng()-.5)*.2,.15,.85)]]
   :[first,[along,far],[clamp(along+(rng()-.5)*.2,.15,.85),1-far]];
 }else{
  // The intermediate bend is crossed without an obligatory stop.
  const bend=horizontal?[(x+far)/2,clamp((y+across)/2+(rng()-.5)*.3,.15,.85)]
   :[clamp((x+across)/2+(rng()-.5)*.3,.15,.85),(y+far)/2];
  points=[bend,first];
 }
 return {kind,points,index:0,pauseAt:rng()<.35?1:-1,pauseDuration:.18+rng()*.22,pauseUsed:false};
}
export function advanceHuntRoute(m,w,h,time){
 const route=m.hunt?.route;
 if(!route)return false;
 const goal=route.points[route.index];
 const lookahead=Math.min(Math.min(w,h)*.18,Math.max(35,(m.speed||0)*.18));
 if(route.index<route.points.length-1&&Math.hypot(m.x-goal[0]*w,m.y-goal[1]*h)<lookahead){
  route.index++;
  // One authored hesitation, not a fresh random decision every frame.
  if(route.index===route.pauseAt&&!route.pauseUsed){m.restUntil=time+route.pauseDuration;route.pauseUsed=true;}
  delete m.hunt.progress;
 }
 m.hunt.goal=route.points[route.index];
 return true;
}
export function isHuntCruising(m){
 const route=m.hunt?.route;
 return m.hunt?.phase==='dart'&&route&&route.index<route.points.length-1;
}
