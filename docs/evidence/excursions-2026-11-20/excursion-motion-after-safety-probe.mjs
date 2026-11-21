import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('/tmp/excursion-motion-after-paw-23-120.jsonl','utf8').trim().split('\n').map(JSON.parse).find(p=>Math.abs(p[1].time-137.55833333333334)<1e-8)[1];
const rows=[];
for(const variant of ['baseline','candidate']){
 const base=`/tmp/excursion-motion-${variant}/little-mouse/public`;
 const {stepMice}=await import(`${base}/physics.js`);const {settingsDefaults:config}=await import(`${base}/settings.js`);
 const m={state:'active',x:source.x,y:source.y,angle:source.angle,vx:0,vy:0,turnRate:0,hiddenUntil:0,restUntil:0,targetX:901.12,targetY:362.5319553494453,seed:0,huntSpeed:1.22*config.dartSpeed,hunt:{phase:'dart',route:{index:0,points:[[.88,.47204681686125693],[.88,.18]]}}};
 const paw={x:512,y:384,radius:50},trace=[];let min=Infinity;
 for(let f=1;f<=180;f++){const time=source.time+f/120;stepMice([m],config,time,1/120,1024,768,[paw]);const distance=Math.hypot(m.x-512,m.y-384);min=Math.min(min,distance);trace.push({time,x:m.x,y:m.y,angle:m.angle,vx:m.vx,vy:m.vy,distance});}
 rows.push({variant,minDistance:min,penetration:161.54-min,end:trace.at(-1)});writeFileSync(`/tmp/excursion-motion-after-safety-${variant}.json`,JSON.stringify(trace));
}
writeFileSync('/tmp/excursion-motion-after-safety-summary.json',JSON.stringify({description:'Matched isolated production physics approach from observed candidate phase-entry position; fixed intermediate goal, no companion, reconstructed huntSpeed and cleared arrival state',source,rows},null,2));console.log(JSON.stringify(rows));
