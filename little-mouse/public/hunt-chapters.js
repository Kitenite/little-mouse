// Session-scale orchestration. Independent seeded RNG avoids per-mouse frame-order bias.
const chapter=(id,weights={},options={})=>Object.freeze({id,weights,...options});
export const HUNT_CHAPTERS=Object.freeze([
 chapter('sweeping',{dart:1.7,creep:.55,watch:.65,traverse:1.5},{routeChance:.95,edgeHookChance:.2,dwell:.75}),
 chapter('stalking',{creep:2,watch:1.6,dart:.65,traverse:.4},{routeChance:.35,dwell:1.15}),
 chapter('edge-teasing',{watch:1.3,creep:1.3,traverse:.45},{routeChance:.85,edgeHookChance:.9,familiar:.7}),
 chapter('bursts',{dart:2.2,watch:.65,creep:.55,traverse:.8},{routeChance:.9,hesitationChance:.65,dwell:.65}),
 chapter('exploring',{creep:1.4,dart:1.3,traverse:.65},{routeChance:.8,familiar:.1,visibleBudget:1.35}),
 chapter('ambush',{watch:.75,dart:1.4,retreat:1.3,traverse:1.2},{hide:1.4,routeChance:.55,dwell:.8}),
]);
const opening=chapter('mixed');
export function createHuntChapters(seed=0x706f6472){
 return {seed:seed>>>0,bag:[],current:opening,since:0,until:35,serial:0};
}
function random(state){state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0;return state.seed/4294967296;}
export function advanceHuntChapters(state,time){
 if(!Number.isFinite(time)||time<state.until)return state.current;
 if(!state.bag.length){
  state.bag=[...HUNT_CHAPTERS];
  for(let i=state.bag.length-1;i>0;i--){const j=Math.floor(random(state)*(i+1));[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}
  if(state.bag.at(-1).id===state.current.id)[state.bag[0],state.bag[state.bag.length-1]]=[state.bag.at(-1),state.bag[0]];
 }
 state.current=state.bag.pop();state.since=time;state.until=time+30+random(state)*35;state.serial++;
 return state.current;
}
