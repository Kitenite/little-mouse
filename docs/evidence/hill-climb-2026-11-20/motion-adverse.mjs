import {pathToFileURL} from 'node:url';
const base=process.env.MOTION_SOURCE||new URL('../../../little-mouse/public',import.meta.url).pathname,imp=n=>import(pathToFileURL(base+'/'+n+'.js'));
const {createHuntDirector,updateHunt,forceHuntPhase}=await imp('enrichment'),{updateHuntGroup}=await imp('hunt-group'),{stepMice,radius}=await imp('physics'),{settingsDefaults}=await imp('settings'),{createMouseIdentity,identityRandom}=await imp('mouse-identity'),{createContacts,beginContact,updateContacts,cancelContact,recordPointer}=await imp('contact');
const out=[];
for(const hz of [30,60,120])for(const kind of ['opposed-creep','held-obstacle','slow-progress','paw-detour']){
const c={...settingsDefaults,...kind==='slow-progress'?{speed:0,travelSpeed:1,creepSpeed:.5,huntTempo:.5}:{}},w=1024,h=768,rng=identityRandom(11),d=createHuntDirector(11),contacts=createContacts(),r=radius(c.size,w,h);
const mice=[0,1].map(i=>({castIndex:i,identity:createMouseIdentity(1100+i),seed:i,state:'active',x:400+i*r*2,y:384,angle:i*Math.PI,vx:0,vy:0,hiddenUntil:0,restUntil:0}));
if(kind==='slow-progress'||kind==='paw-detour')mice.pop();
for(const m of mice){updateHunt(m,c,0,w,h,false,rng,d);forceHuntPhase(m,'creep',0,c,w,h,rng,d);m.hunt.goal=[(m.x+(m.castIndex===0?1:-1)*(kind==='slow-progress'?180:kind==='paw-detour'?450:20))/w,.5];m.hunt.visibleSince=0;}
if(kind==='held-obstacle')beginContact(contacts,mice[1],{part:'body',localX:0,localY:0},3,mice[1].x,mice[1].y,0,c,c.size);
if(kind==='paw-detour')recordPointer(contacts,9,625,384,0,100,100);
d.paws=contacts.obstacles;let firstExit=null,travel=0,heldShift=0,last=[mice[0].x,mice[0].y],start=mice.map(m=>[m.x,m.y]),phases=[],minPaw=Infinity;
for(let f=1;f<=10*hz;f++){const t=f/hz;updateContacts(contacts,t,mice);updateHuntGroup(d,mice,t,w,h,c);for(const m of mice)updateHunt(m,c,t,w,h,false,rng,d);stepMice(mice,c,t,1/hz,w,h,contacts.obstacles.values());const m=mice[0];travel+=Math.hypot(m.x-last[0],m.y-last[1]);last=[m.x,m.y];if(!firstExit&&m.hunt.phase!=='creep')firstExit={t,phase:m.hunt.phase,travel};if(f%hz===0)phases.push({t,phase:m.hunt.phase,x:m.x,y:m.y});if(kind==='held-obstacle')heldShift=Math.max(heldShift,Math.hypot(mice[1].x-start[1][0],mice[1].y-start[1][1]));if(kind==='paw-detour')minPaw=Math.min(minPaw,Math.hypot(m.x-625,m.y-384));}
out.push({hz,kind,firstExit,travel,heldShift,minPaw,phases});}
console.log(JSON.stringify(out,null,2));
