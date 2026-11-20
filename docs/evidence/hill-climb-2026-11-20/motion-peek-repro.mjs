import {pathToFileURL} from 'node:url';
const base=process.env.MOTION_SOURCE||new URL('../../../little-mouse/public',import.meta.url).pathname,imp=n=>import(pathToFileURL(base+'/'+n+'.js'));
const {createHuntDirector,updateHunt,forceHuntPhase}=await imp('enrichment'),{updateHuntGroup}=await imp('hunt-group'),{stepMice,radius}=await imp('physics'),{settingsDefaults:c}=await imp('settings'),{createMouseIdentity,identityRandom}=await imp('mouse-identity'),{createContacts,beginContact,updateContacts,recordPointer}=await imp('contact');
const out=[];
for(const hz of [30,60,120])for(const gap of [12,15,16]){
const w=1024,h=768,rng=identityRandom(11),d=createHuntDirector(11),contacts=createContacts(),x=-10*c.size-gap,r=radius(c.size,w,h),mice=[0,1].map(i=>({castIndex:i,identity:createMouseIdentity(1100+i),seed:i,state:'active',x:x+i*2*r,y:384,angle:0,vx:0,vy:0,hiddenUntil:0,restUntil:0}));
for(const m of mice)updateHunt(m,c,0,w,h,false,rng,d);
Object.assign(mice[0].hunt,{edge:0,slot:.5});forceHuntPhase(mice[0],'peek',0,c,w,h,rng,d);
beginContact(contacts,mice[1],{part:'body',localX:0,localY:0},3,mice[1].x,mice[1].y,0,c,c.size);
// A real held pointer is also a persistent paw obstacle. Its radius is below
// mouse collision separation and does not overlap the entrance mouth.
recordPointer(contacts,3,mice[1].x,mice[1].y,0,20,20);d.paws=contacts.obstacles;
const start=mice.map(m=>[m.x,m.y]);let last=start[0],travel=0,maxHeldShift=0,collisions=0,firstExit=null,samples=[];
for(let f=1;f<=15*hz;f++){const t=f/hz;updateContacts(contacts,t,mice);updateHuntGroup(d,mice,t,w,h,c);for(const m of mice)updateHunt(m,c,t,w,h,false,rng,d);collisions+=stepMice(mice,c,t,1/hz,w,h,contacts.obstacles.values());const m=mice[0];travel+=Math.hypot(m.x-last[0],m.y-last[1]);last=[m.x,m.y];maxHeldShift=Math.max(maxHeldShift,Math.hypot(mice[1].x-start[1][0],mice[1].y-start[1][1]));if(!firstExit&&m.hunt.phase!=='peek')firstExit={t,phase:m.hunt.phase,travel};if(f%hz===0)samples.push({t,phase:m.hunt.phase,x:m.x,y:m.y,targetX:m.targetX,targetY:m.targetY,distance:Math.hypot(m.targetX-m.x,m.targetY-m.y),arrivedAt:m.hunt.arrivedAt,deadline:m.hunt.deadline,speed:m.speed});}
out.push({hz,gap,config:c,start,identities:[1100,1101],firstExit,travel,maxHeldShift,collisions,samples});}
console.log(JSON.stringify(out,null,2));
