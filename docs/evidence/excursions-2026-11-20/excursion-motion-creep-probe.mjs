import {writeFileSync} from 'node:fs';
const rows=[];
for(const variant of ['baseline','candidate']){
 const base='/tmp/excursion-motion-'+variant+'/little-mouse/public';
 const r=Object.assign({},...await Promise.all(['enrichment','hunt-group','physics','settings','mouse-identity','contact'].map(n=>import(base+'/'+n+'.js'))));
 const {createHuntDirector,updateHunt,forceHuntPhase,updateHuntGroup,stepMice,radius,settingsDefaults,createMouseIdentity,identityRandom,createContacts,beginContact,updateContacts,recordPointer}=r;
const w=1024,h=768;
function fixture(kind='opposed-creep'){
 const config={...settingsDefaults,...kind==='slow-progress'?{speed:0,travelSpeed:1,creepSpeed:.5,huntTempo:.5}:{}};
 const rng=identityRandom(11),director=createHuntDirector(11),contacts=createContacts();
 const mice=[0,1].map(i=>({castIndex:i,identity:createMouseIdentity(1100+i),seed:i,state:'active',x:400+i*radius(config.size,w,h)*2,y:384,angle:i*Math.PI,vx:0,vy:0,hiddenUntil:0,restUntil:0}));
 if(kind==='slow-progress'||kind==='paw-detour')mice.pop();
 for(const m of mice){
  updateHunt(m,config,0,w,h,false,rng,director);
  forceHuntPhase(m,'creep',0,config,w,h,rng,director);
  m.hunt.goal=[(m.x+(m.castIndex===0?1:-1)*(kind==='slow-progress'?180:kind==='paw-detour'?450:20))/w,.5];
  m.hunt.visibleSince=0;
 }
 if(kind==='held-obstacle')beginContact(contacts,mice[1],{part:'body',localX:0,localY:0},3,mice[1].x,mice[1].y,0,config,config.size);
 if(kind==='paw-detour')recordPointer(contacts,9,625,384,0,100,100);
 director.paws=contacts.obstacles;
 return {config,rng,director,contacts,mice,tick(t,hz){
  updateContacts(contacts,t,mice);updateHuntGroup(director,mice,t,w,h,config);
  for(const m of mice)updateHunt(m,config,t,w,h,false,rng,director);
  stepMice(mice,config,t,1/hz,w,h,contacts.obstacles.values());
 }};
}


for(const hz of [30,60,120])for(const kind of ['slow-progress','paw-detour']){
 const f=fixture(kind),m=f.mice[0],trace=[];let path=0,minPaw=Infinity,maxStep=0,exit=null;
 for(let frame=1;frame<=10*hz;frame++){
 const before={x:m.x,y:m.y,phase:m.hunt.phase,arrived:m.hunt.arrivedAt,dwell:m.hunt.dwell,deadline:m.hunt.deadline,goal:[...m.hunt.goal]};
 f.tick(frame/hz,hz);const step=Math.hypot(m.x-before.x,m.y-before.y);path+=step;maxStep=Math.max(maxStep,step);minPaw=Math.min(minPaw,Math.hypot(m.x-625,m.y-384));
 trace.push({time:frame/hz,x:m.x,y:m.y,angle:m.angle,targetX:m.targetX,targetY:m.targetY,phase:m.hunt.phase,arrived:m.hunt.arrivedAt,dwell:m.hunt.dwell,deadline:m.hunt.deadline,step,before});
 if(m.hunt.phase!=='creep'){exit=frame/hz;break;}
 }
 const row={variant,hz,kind,exit,path,minPaw,maxStep,end:trace.at(-1),firstArrival:trace.find(s=>s.phase==='creep'&&s.arrived!==null)};rows.push(row);
 writeFileSync(`/tmp/excursion-motion-creep-${variant}-${kind}-${hz}.json`,JSON.stringify(trace));
}
}
writeFileSync('/tmp/excursion-motion-creep-summary.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows.map(({end,firstArrival,...r})=>({...r,lastX:end.x,lastY:end.y,phase:end.phase,beforeExit:end.before,firstArrival:firstArrival?.time})),null,2));
