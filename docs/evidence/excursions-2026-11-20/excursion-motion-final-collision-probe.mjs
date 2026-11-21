import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='/tmp/excursion-motion-candidate2-final/little-mouse';
const r=Object.assign({},...await Promise.all(['enrichment','hunt-group','physics','mouse-identity','settings'].map(n=>import(`${base}/public/${n}.js`))));
const {createRouteMetricsTracker}=await import(`${base}/scripts/behavior-route-metrics.mjs`);
Math.random=()=>{throw Error('unseeded randomness')};
const hashes=Object.fromEntries(readdirSync(base+'/public').filter(n=>n.endsWith('.js')).sort().map(n=>[n,createHash('sha256').update(readFileSync(base+'/public/'+n)).digest('hex')]));
const rows=[];const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
for(const hz of [30])for(const scenario of ['paw'])for(const seed of [23]){
 const seconds=34,w=1024,h=768,dt=1/hz,config=r.settingsDefaults,rng=r.identityRandom(seed),director=r.createHuntDirector(seed);
 const paw=scenario==='paw'?[{x:512,y:384,radius:50}]:[];director.paws=new Map(paw.map((p,i)=>[i,p]));
 const mice=Array.from({length:2},(_,castIndex)=>{const rad=r.radius(config.size,w,h);return {castIndex,state:'away',x:rad+rng()*(w-2*rad),y:rad+rng()*(h-2*rad),angle:rng()*Math.PI*2,targetX:w/2,targetY:h/2,next:.6,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,speed:0,seed:rng()*100,identity:r.createMouseIdentity((seed+castIndex*2654435761)>>>0)};});
 const frames=[],trackers=mice.map(()=>createRouteMetricsTracker()),segments=[],seg=[null,null];
 for(let f=1;f<=seconds*hz;f++){
 const time=f*dt,old=mice.map(m=>({...m}));
 r.updateHuntGroup(director,mice,time,w,h,config);for(const m of mice)r.updateHunt(m,config,time,w,h,false,rng,director);
 const collisions=r.stepMice(process.env.NO_COMPANION&&time>=33.6?[mice[0]]:mice,config,time,dt,w,h,paw);
 const samples=mice.map((m,i)=>{const visible=m.state==='active'&&m.hiddenUntil<=time&&m.x>=0&&m.x<=w&&m.y>=0&&m.y<=h,phase=m.hunt?.phase||'none';
 trackers[i].sample({time,x:m.x/w,y:m.y/h,phase,eligible:visible,discontinuity:false});
 const route=m.hunt?.route;
 const s={time,mouse:i,x:m.x,y:m.y,angle:m.angle,targetX:m.targetX,targetY:m.targetY,phase,state:m.state,visible,collisions,route:route?`${route.kind}/${route.index}`:null,goal:m.hunt?.goal,entered:m.hunt?.enteredAt,arrived:m.hunt?.arrivedAt,deadline:m.hunt?.deadline,restUntil:m.restUntil,vx:m.vx,vy:m.vy};
 const key=[phase,route?.index,m.hunt?.goal?.join(','),m.hunt?.edge,m.hunt?.slot].join('|');
 if(!seg[i]||seg[i].key!==key||!visible){if(seg[i])segments.push(seg[i]);seg[i]=visible?{key,mouse:i,start:time,end:time,phase,route:s.route,turn:0,netTurn:0,path:0,targetPath:0,collisions:0,x:m.x,y:m.y,endX:m.x,endY:m.y,startError:Math.hypot(m.x-m.targetX,m.y-m.targetY),endError:0}:null;}
 const a=seg[i];if(a&&time>a.start){a.end=time;const d=wrap(m.angle-old[i].angle);a.turn+=Math.abs(d)/(2*Math.PI);a.netTurn+=d/(2*Math.PI);a.path+=Math.hypot(m.x-old[i].x,m.y-old[i].y);a.targetPath+=Math.hypot(m.targetX-old[i].targetX,m.targetY-old[i].targetY);a.collisions+=collisions;a.endX=m.x;a.endY=m.y;a.endError=Math.hypot(m.x-m.targetX,m.y-m.targetY);}
 return s;});frames.push(samples);
 }
 segments.push(...seg.filter(Boolean));segments.forEach(s=>s.duration=s.end-s.start);
 const windows=[];for(let i=0;i<2;i++)for(let f=0;f+3*hz<frames.length;f+=hz/2){const ss=frames.slice(f,f+3*hz+1).map(x=>x[i]);if(ss.some(s=>!s.visible))continue;let turns=0,net=0,path=0,targetPath=0,changes=0;for(let j=1;j<ss.length;j++){const a=ss[j-1],b=ss[j],d=wrap(b.angle-a.angle);turns+=Math.abs(d)/(2*Math.PI);net+=d/(2*Math.PI);path+=Math.hypot(b.x-a.x,b.y-a.y);targetPath+=Math.hypot(b.targetX-a.targetX,b.targetY-a.targetY);changes+=a.phase!==b.phase?1:0;}
 windows.push({mouse:i,start:ss[0].time,end:ss.at(-1).time,turns,net,path,targetPath,changes,phases:[...new Set(ss.map(s=>s.phase))],collisions:ss.reduce((s,f)=>s+f.collisions,0),displacement:Math.hypot(ss.at(-1).x-ss[0].x,ss.at(-1).y-ss[0].y)});}
 const name=`${scenario}-${seed}-${hz}`;writeFileSync(`/tmp/excursion-motion-final-collision-${process.env.NO_COMPANION?"control":"replay"}-${name}.jsonl`,frames.map(x=>JSON.stringify(x)).join('\n')+'\n');
 rows.push({name,hz,seed,scenario,seconds,routes:trackers.map(t=>t.finalize()),segments:segments.sort((a,b)=>b.turn-a.turn).slice(0,15),windows:windows.sort((a,b)=>b.turns-a.turns).slice(0,15),targetChurn:segments.sort((a,b)=>b.targetPath-a.targetPath).slice(0,5)});
 console.log(name,JSON.stringify(rows.at(-1).segments[0]));
}
writeFileSync(`/tmp/excursion-motion-final-collision-${process.env.NO_COMPANION?"control":"replay"}-summary.json`,JSON.stringify({revision:'4ba72c4 plus candidate snapshot; hashes authoritative',hashes,config:r.settingsDefaults,rows},null,2));
