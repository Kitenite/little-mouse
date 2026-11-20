import {pathToFileURL} from 'node:url';
const base=process.env.MOTION_SOURCE||new URL('../../../little-mouse/public',import.meta.url).pathname,imp=n=>import(pathToFileURL(base+'/'+n+'.js'));
const {createHuntDirector,updateHunt,forceHuntPhase}=await imp('enrichment'),{stepMice}=await imp('physics'),{settingsDefaults}=await imp('settings'),{createMouseIdentity,identityRandom}=await imp('mouse-identity'),{createContacts,beginContact,updateContacts,cancelContact}=await imp('contact');
const out=[];
for(const hz of [30,60,120])for(const kind of ['near-free','near-slow','invisible-slow','held-entry']){
const c={...settingsDefaults,...kind.includes('slow')?{speed:0,travelSpeed:1,huntTempo:.5}:{}},w=1024,h=768,rng=identityRandom(11),d=createHuntDirector(11),contacts=createContacts(),m={castIndex:0,identity:createMouseIdentity(1100),seed:0,state:'active',x:kind==='invisible-slow'?-459:-40.6,y:384,angle:0,vx:0,vy:0,hiddenUntil:0,restUntil:0};
updateHunt(m,c,0,w,h,false,rng,d);Object.assign(m.hunt,{edge:0,slot:.5});forceHuntPhase(m,'peek',0,c,w,h,rng,d);
if(kind==='held-entry')beginContact(contacts,m,{part:'body',localX:0,localY:0},3,m.x,m.y,0,c,c.size);
let firstExit=null,arrived=null,firstVisible=null,maxHeldShift=0,samples=[],start=m.x;
for(let f=1;f<=15*hz;f++){const t=f/hz;if(kind==='held-entry'&&f===3*hz)cancelContact(contacts,3);updateContacts(contacts,t,[m]);updateHunt(m,c,t,w,h,false,rng,d);stepMice([m],c,t,1/hz,w,h);if(m.hold)maxHeldShift=Math.max(maxHeldShift,Math.abs(m.x-start));if(firstVisible===null&&m.x>-47*c.size)firstVisible=t;if(arrived===null&&m.hunt.arrivedAt!==null)arrived=m.hunt.arrivedAt;if(!firstExit&&m.hunt.phase!=='peek')firstExit={t,phase:m.hunt.phase};if(f%hz===0)samples.push({t,x:m.x,y:m.y,phase:m.hunt.phase});}
out.push({hz,kind,firstExit,arrived,firstVisible,maxHeldShift,samples});}
console.log(JSON.stringify(out,null,2));
