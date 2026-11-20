import {createHuntDirector,updateHunt,rememberTouch} from '../../../little-mouse/public/enrichment.js';
import {updateHuntGroup} from '../../../little-mouse/public/hunt-group.js';
import {stepMice} from '../../../little-mouse/public/physics.js';
import {settingsDefaults} from '../../../little-mouse/public/settings.js';
import {createContacts,beginContact,cancelContact,endContact} from '../../../little-mouse/public/contact.js';
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
const mouse=(i,w,h)=>({state:'away',castIndex:i,x:w/2,y:h/2,angle:0,vx:0,vy:0,speed:0,targetX:w/2,targetY:h/2,hiddenUntil:0,restUntil:0,seed:i});
// Real near miss, then a claim/cancel or harmless release between policy ticks.
for(const outcome of ['cancel','harmless']){
 const config={...settingsDefaults,harmlessChance:1},m={...mouse(0,1024,768),state:'active',x:500,y:380},d=createHuntDirector(4),rng=()=>.5,c=createContacts();
 updateHunt(m,config,0,1024,768,false,rng,d);rememberTouch(d,400,380,.1,1024,768,{miss:true});
 let t=.1;for(;t<2;t+=1/60){updateHunt(m,config,t,1024,768,false,rng,d);stepMice([m],config,t,1/60,1024,768);if(m.hunt.pounce)break;}
 const claimed=beginContact(c,m,{part:'body',localX:0,localY:0},1,m.x,m.y,t,config,config.size);
 if(outcome==='cancel')cancelContact(c,1);else endContact(c,1,t+.001,1024,768,config.size,config,()=>0);
 const after=m.hunt.pounce?.stage,stages=[];
 for(let j=1;j<180;j++){const time=t+j/60;updateHunt(m,config,time,1024,768,false,rng,d);stepMice([m],config,time,1/60,1024,768);if(m.hunt.pounce&&!stages.includes(m.hunt.pounce.stage))stages.push(m.hunt.pounce.stage);}
 console.log(JSON.stringify({probe:'claim-between-ticks',outcome,claimed,at:t,pounceAfterClaim:after,laterStages:stages}));
}
