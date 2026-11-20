import {pathToFileURL} from 'node:url';
const base=process.env.MOTION_SOURCE||new URL('../../../little-mouse/public',import.meta.url).pathname,imp=n=>import(pathToFileURL(base+'/'+n+'.js'));
const {createHuntDirector,updateHunt}=await imp('enrichment'),{updateHuntGroup}=await imp('hunt-group'),{stepMice,radius}=await imp('physics'),{settingsDefaults:config}=await imp('settings'),{createMouseIdentity,identityRandom}=await imp('mouse-identity');
const output=[];
for(const hz of [30,60,120])for(const identities of [true,false]){
const seed=11,w=1024,h=768,rng=identityRandom(seed),d=createHuntDirector(seed),mice=[0,1].map(i=>({castIndex:i,...identities?{identity:createMouseIdentity(seed*100+i)}:{},seed:i,state:'away',x:w/2,y:h/2,angle:0,vx:0,vy:0,hiddenUntil:0,restUntil:0}));let trace=[],samples=[],episodes=[],episode=null;
for(let f=0;f<180*hz;f++){const t=f/hz,prev=mice.map(m=>({x:m.x,y:m.y}));updateHuntGroup(d,mice,t,w,h,config);for(const m of mice)updateHunt(m,config,t,w,h,false,rng,d);const collisions=stepMice(mice,config,t,1/hz,w,h);for(let i=0;i<2;i++){const m=mice[i],actual=Math.hypot(m.x-prev[i].x,m.y-prev[i].y),distance=Math.hypot(m.targetX-m.x,m.targetY-m.y);if(hz===30&&identities&&t>=165&&t<=176){trace.push({t,i,x:m.x,y:m.y,phase:m.hunt.phase,since:m.hunt.since,distance,speed:m.speed,actual,collisions,separation:Math.hypot(mice[0].x-mice[1].x,mice[0].y-mice[1].y)});}}
if(f%hz===0){for(let i=0;i<2;i++){const m=mice[i],prev=samples[i];if(prev){const travel=Math.hypot(m.x-prev.x,m.y-prev.y),distance=Math.hypot(m.targetX-m.x,m.targetY-m.y);if(m.hunt.phase==='creep'&&prev.phase==='creep'&&m.hunt.since===prev.since&&travel<3&&distance>8)episodes.push({t,i,travel,distance,speed:m.speed,since:m.hunt.since});}samples[i]={x:m.x,y:m.y,phase:m.hunt.phase,since:m.hunt.since};}}
}
output.push({hz,identities,collisionDiameter:2*radius(config.size,w,h),stalledSamples:episodes,trace});}
console.log(JSON.stringify(output,null,2));
