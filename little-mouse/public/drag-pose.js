import{advanceArticulation,articulatePoint,unarticulatePoint}from'./anatomy.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
// Kinematic compliance around an exact contact, not a free-falling ragdoll.
// [head, pelvis, waist] distribute torque away from the restrained region.
const poseKeys=['head','pelvis','spine'],limits=[.32,.22,.18];
const pinned=h=>h&&(h.part==='head'||h.part==='body')&&Number.isFinite(h.localX)&&Number.isFinite(h.localY);
const policies={head:[.12,-1,-.7],body:[1,-.8,.35],forepaw:[.35,-1,-.65],hindpaw:[1,-.3,.7],tail:[1,.2,.65]};
export function createDragPose(){return{hold:null,ready:false,x:0,y:0,heading:0,vx:0,vy:0,values:new Float64Array(5),velocity:new Float64Array(5),added:new Float64Array(3),material:[0,0],point:[0,0,0],offsetX:0,offsetY:0};}
export function suspendDragPose(s){s.ready=false;}
export function advanceDragPose(s,pose,motion,input,dt,config={}){
 if(!Number.isFinite(dt)||dt<=0)return s;
 const hold=motion.holdReference||null;
 // Capture the material coordinate while the previous frame is still applied.
 if(hold!==s.hold){if(pinned(hold))unarticulatePoint(hold.localX,hold.localY,pose,s.material);s.hold=hold;}
 for(let i=0;i<3;i++)pose[poseKeys[i]]-=s.added[i];
 pose.offsetX=pose.offsetY=0;
 advanceArticulation(pose,input,dt,config);
 const x=Number.isFinite(motion.x)?motion.x:s.x,y=Number.isFinite(motion.y)?motion.y:s.y,heading=Number.isFinite(motion.heading)?motion.heading:s.heading,size=Math.max(.1,motion.size||1);
 if(!s.ready||dt>.2||Number.isFinite(input.time)&&input.time<s.time||Math.hypot(x-s.x,y-s.y)>size*250){s.x=x;s.y=y;s.heading=heading;s.vx=s.vy=0;s.ready=true;s.values.fill(0);s.velocity.fill(0);s.offsetX=s.offsetY=0;}
 {
  const step=Math.min(dt,.1),vx=(x-s.x)/size/step,vy=(y-s.y)/size/step,c=Math.cos(heading),sn=Math.sin(heading);
  const localX=clamp(vx*c+vy*sn,-800,800),localY=clamp(-vx*sn+vy*c,-800,800);
  const ax=clamp(((vx-s.vx)*c+(vy-s.vy)*sn)/step,-2500,2500),ay=clamp((-(vx-s.vx)*sn+(vy-s.vy)*c)/step,-2500,2500),turn=clamp(angle(heading-s.heading)/step,-8,8);
  const amount=clamp(Number.isFinite(config.dragCompliance)?config.dragCompliance:1,0,1.5),damping=clamp(Number.isFinite(config.dragDamping)?config.dragDamping:12,6,24),policy=hold?.active?policies[hold.part]:null;
  const torque=clamp(-localY*.00065-ay*.000045-turn*.018,-.14,.14)*amount;
  const steps=hold&&!hold.active?0:Math.ceil(step*120),h=steps?step/steps:0;
  for(let n=0;n<steps;n++)for(let i=0;i<5;i++){
   const target=!policy?0:i<3?torque*policy[i]:clamp(-(i===3?localX:localY)*.012-(i===3?ax:ay)*.0008,-5,5)*amount;
   const limit=i<3?.16:7.5;s.velocity[i]+=(target-s.values[i])*(i<3?65:45)*h;s.velocity[i]*=Math.exp(-damping*h);s.values[i]=clamp(s.values[i]+s.velocity[i]*h,-limit,limit);
   if(Math.abs(s.values[i])===limit)s.velocity[i]=0;
  }
  if(!pinned(hold)&&(!hold||hold.active)){const decay=Math.exp(-10*step);s.offsetX*=decay;s.offsetY*=decay;}
  s.x=x;s.y=y;s.heading=heading;s.vx=vx;s.vy=vy;s.time=input.time;
 }
 for(let i=0;i<3;i++){const key=poseKeys[i],limit=limits[i],base=pose[key];pose[key]=clamp(base+s.values[i],-limit,limit);s.added[i]=pose[key]-base;}
 if(pinned(hold)){articulatePoint(s.material[0],s.material[1],0,pose,s.point);s.offsetX=hold.localX-s.point[0];s.offsetY=hold.localY-s.point[1];}
 pose.offsetX=s.offsetX;pose.offsetY=s.offsetY;
 return s;
}
