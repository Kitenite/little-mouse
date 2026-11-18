import {Simulation} from './core.mjs';
export function createReplay(name){
 const positions=name==='wall'?[{x:650,y:250},{x:220,y:120}]:name==='collision'?[{x:280,y:250},{x:460,y:250}]:undefined;
 const simulations=['kinematic','planck'].map(kind=>new Simulation(kind,positions));
 const frames=name==='wall'?25:60;
 for(const s of simulations){if(name==='collision'){s.kick(0,420,0);s.kick(1,-420,0);}else {const p=s.center(0);s.begin('scenario',0,{x:p.x,y:p.y-24});}}
 return {simulations,replay:{name,frame:0,frames,releaseFrame:36+frames+(name==='hold'?120:0),done:false}};
}
// Shared CLI/UI ordering: move, fixed step, measure grabbed point, release, measure release.
export function advanceReplay(simulations,replay,onEvent=()=>{}){
 if(replay.done)return;
 replay.frame++;const i=replay.frame-36;
 if(replay.name!=='collision'&&i>0&&i<=replay.frames){for(const s of simulations)s.move('scenario',{x:(replay.name==='wall'?650:220)+i*(replay.name==='wall'?5:3),y:226+(replay.name==='hold'?0:Math.sin(i/18)*35)});}
 for(const s of simulations)s.step(1/120);
 if(replay.name!=='collision'){
  if(i===replay.frames)onEvent('dragged',simulations);
  if(replay.frame===replay.releaseFrame){for(const s of simulations)s.release('scenario',replay.name==='cancel');onEvent('released',simulations);}
 }
 replay.done=replay.frame>=(replay.name==='collision'?120:replay.releaseFrame+120);
}
