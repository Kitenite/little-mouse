import {createHuntDirector,updateHunt,forceHuntPhase} from '../../../little-mouse/public/enrichment.js';
import {updateHuntGroup} from '../../../little-mouse/public/hunt-group.js';
import {settingsDefaults as cfg} from '../../../little-mouse/public/settings.js';
const mouse=x=>({state:'active',x,y:384,angle:0,vx:0,vy:0,speed:0,hiddenUntil:0,restUntil:0,seed:1});
let lead=0,sneak=0,mismatches=0;
for(let seed=1;seed<=1000;seed++){
 const phases=[];
 for(const role of ['lead','sneak']){
  let s=seed;const rng=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296),d=createHuntDirector(7),m=mouse(500),b=mouse(800);
  updateHunt(m,cfg,0,1024,768,false,rng,d);updateHunt(b,cfg,0,1024,768,false,rng,d);
  forceHuntPhase(m,'peek',0,cfg,1024,768,rng,d);m.hunt.arrivedAt=0;m.hunt.dwell=0;
  updateHuntGroup(d,[m,b],1,1024,768,cfg);d.group.focus=role==='lead'?m:b;
  updateHunt(m,cfg,1,1024,768,false,rng,d);phases.push(m.hunt.phase==='traverse');
 }
 lead+=phases[0];sneak+=phases[1];mismatches+=phases[0]!==phases[1];
}
console.log({lead,sneak,mismatches});
