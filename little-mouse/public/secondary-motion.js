// Lightweight inertial secondary motion. This approximates a flexible tail and
// coat, rather than a biological muscle or individual-hair simulation.
export const secondaryMotionDefaults={tailStiffness:8,tailDamping:7,tailSway:1,furSway:1,earStiffness:90,earDamping:12,earSway:1,whiskerLength:1,whiskerMotion:1};
export const secondaryMotionControls={tailStiffness:{label:'Tail stiffness',min:2,max:24,step:1},tailDamping:{label:'Tail damping',min:2,max:18,step:1},tailSway:{label:'Tail movement',min:0,max:2,step:.05},furSway:{label:'Fur movement',min:0,max:2,step:.05},earStiffness:{label:'Ear stiffness',min:30,max:180,step:5},earDamping:{label:'Ear damping',min:4,max:28,step:1},earSway:{label:'Ear movement',min:0,max:2,step:.05},whiskerLength:{label:'Whisker length',min:.6,max:1.5,step:.05},whiskerMotion:{label:'Whisker movement',min:0,max:2,step:.05}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const setting=(c,k)=>Number.isFinite(c[k])?clamp(c[k],secondaryMotionControls[k].min,secondaryMotionControls[k].max):secondaryMotionDefaults[k];
const angleDelta=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ROOT_X=-36,ROOT_Z=5,LENGTH=87;
export function createSecondaryMotion(segments=24){segments=clamp(Math.round(segments),8,48);return{segments,points:new Float64Array((segments+1)*3),previous:new Float64Array((segments+1)*3),fur:new Float64Array(3),furVelocity:new Float64Array(3),holdSamples:new Float64Array(65*3),releasing:false,releaseFraction:0,releaseIndex:0,releaseLengths:new Float64Array(segments),releaseAngles:new Float64Array(segments),whiskers:new Float64Array(6),whiskerVelocity:new Float64Array(6),whiskerTime:0,ears:new Float64Array(6),earVelocity:new Float64Array(6),ready:false,active:false,x:0,y:0,heading:0,size:1,vx:0,vy:0,revision:0};}
export function resetSecondaryMotion(s,motion={}){for(let i=0;i<=s.segments;i++){const f=i/s.segments,k=i*3;s.points[k]=ROOT_X-LENGTH*f;s.points[k+1]=0;s.points[k+2]=ROOT_Z-2*f;}s.previous.set(s.points);s.fur.fill(0);s.furVelocity.fill(0);s.ears.fill(0);s.earVelocity.fill(0);s.whiskers.fill(0);s.whiskerVelocity.fill(0);s.whiskerTime=0;s.holdSide=0;s.holdFraction=0;s.holdIndex=0;s.releasing=false;s.releaseFraction=0;s.releaseIndex=0;s.releaseLengths.fill(0);s.releaseAngles.fill(0);s.x=Number.isFinite(motion.x)?motion.x:0;s.y=Number.isFinite(motion.y)?motion.y:0;s.heading=Number.isFinite(motion.heading)?motion.heading:0;s.size=Math.max(.1,motion.size||1);s.vx=s.vy=0;s.ready=true;s.active=true;s.revision++;return s;}
export function suspendSecondaryMotion(s){s.active=false;}
export function advanceSecondaryMotion(s,motion={},dt=0,config={}){
 // Pause preserves a live pose, even when a hidden reset or teleport is pending.
 // A cold zero-time frame still initializes safe render geometry.
 if(!Number.isFinite(dt)||dt<0||(dt===0&&s.ready))return s;
 const x=Number.isFinite(motion.x)?motion.x:s.x,y=Number.isFinite(motion.y)?motion.y:s.y,heading=Number.isFinite(motion.heading)?motion.heading:s.heading,size=Math.max(.1,Number.isFinite(motion.size)?motion.size:1);
 if(!s.ready||!s.active||dt>.2||Math.abs(size-s.size)>.001||Math.hypot(x-s.x,y-s.y)/size>250){
  resetSecondaryMotion(s,{x,y,heading,size});
  if(motion.tailHold&&Number.isFinite(motion.tailHold.x)&&Number.isFinite(motion.tailHold.y))applyTailHold(s,motion.tailHold);
  return s;
 }
 if(dt<=0)return s;
 if(s.holdFraction&&!motion.tailHold){
  s.releasing=true;s.releaseFraction=s.holdFraction;s.releaseIndex=s.holdIndex;
  // Capture metric lengths before body-frame transport re-pins the root.
  for(let i=1;i<=s.segments;i++){const k=i*3;s.releaseLengths[i-1]=Math.hypot(s.points[k]-s.points[k-3],s.points[k+1]-s.points[k-2],s.points[k+2]-s.points[k-1]);}
 }
 const elapsed=Math.min(dt,1/15),steps=Math.max(1,Math.ceil(elapsed*120)),h=elapsed/steps;
 const dx=(x-s.x)/size,dy=(y-s.y)/size,rotation=angleDelta(heading-s.heading),vx=dx/elapsed,vy=dy/elapsed;
 const ca=Math.cos(heading),sa=Math.sin(heading),localVX=vx*ca+vy*sa,localVY=-vx*sa+vy*ca;
 const ax=clamp(((vx-s.vx)*ca+(vy-s.vy)*sa)/elapsed,-2500,2500),ay=clamp((-(vx-s.vx)*sa+(vy-s.vy)*ca)/elapsed,-2500,2500);
 const stiffness=setting(config,'tailStiffness'),damping=setting(config,'tailDamping'),sway=setting(config,'tailSway'),furSway=setting(config,'furSway'),earStiffness=setting(config,'earStiffness'),earDamping=setting(config,'earDamping'),earSway=setting(config,'earSway'),whiskerMotion=setting(config,'whiskerMotion'),whisking=clamp(Number.isFinite(motion.whisking)?motion.whisking:0,0,1),whiskerOffset=Number.isFinite(motion.whiskerOffset)?motion.whiskerOffset:0,impact=clamp(Number.isFinite(motion.impact)?motion.impact:0,0,1),attention=clamp(Number.isFinite(motion.attention)?motion.attention:0,-1,1),struggle=clamp(Number.isFinite(motion.struggle)?motion.struggle:0,-1,1);
 const p=s.points,previous=s.previous,segmentLength=Math.hypot(LENGTH,2)/s.segments;
 for(let step=0;step<steps;step++){
  if(s.releasing)for(let i=1;i<=s.segments;i++){const k=i*3;s.releaseAngles[i-1]=angleDelta(Math.atan2(p[k+1]-p[k-2],p[k]-p[k-3])-Math.PI);}
  // Convert the free tail into the moving body's new frame. Both current and
  // previous points move together so a camera/frame change creates no impulse.
  const a=s.heading+rotation*(step+1)/steps,c=Math.cos(a),sn=Math.sin(a),dr=-rotation/steps*sway*.4,cr=Math.cos(dr),sr=Math.sin(dr),tx=(dx*c+dy*sn)/steps*sway/Math.max(1,Math.min(4,Number(config.travelSpeed)||1)),ty=(-dx*sn+dy*c)/steps*sway/Math.max(1,Math.min(4,Number(config.travelSpeed)||1));
  for(let i=1;i<=s.segments;i++){const k=i*3,px=p[k],py=p[k+1],qx=previous[k],qy=previous[k+1];p[k]=px*cr-py*sr-tx;p[k+1]=px*sr+py*cr-ty;previous[k]=qx*cr-qy*sr-tx;previous[k+1]=qx*sr+qy*cr-ty;}
  for(let i=1;i<=s.segments;i++){const k=i*3,f=i/s.segments,drag=Math.exp(-damping*h),restX=ROOT_X-LENGTH*f,restZ=ROOT_Z-2*f;
   for(let axis=0;axis<3;axis++){const current=p[k+axis],rest=axis===0?restX:axis===1?0:restZ,velocity=clamp((current-previous[k+axis])*drag,-8,8);previous[k+axis]=current;p[k+axis]=current+velocity+(rest-current)*stiffness*h*h;}
   // Modest vertical response to acceleration keeps the tail grounded, with a
   // small delayed lift during a burst and a damped return after stopping.
   p[k+2]+=Math.min(100,Math.abs(ax)*.025+Math.abs(ay)*.012)*f*h*h*sway;
  }
  p[0]=ROOT_X;p[1]=0;p[2]=ROOT_Z;previous[0]=ROOT_X;previous[1]=0;previous[2]=ROOT_Z;
  if(s.releasing&&!motion.tailHold)relaxReleasedTail(s,segmentLength,h);
  else for(let pass=0;pass<2;pass++){
   let previousBend=0;
   for(let i=1;i<=s.segments;i++){const k=i*3,b=k-3,f=i/s.segments,xx=p[k]-p[b],yy=p[k+1]-p[b+1],desired=angleDelta(Math.atan2(yy,xx)-Math.PI),maxBend=.10+.12*f;
    // Angular limits act like bending stiffness and prevent the free chain
    // folding into sharp accordion corners when the mouse pivots abruptly.
    const bend=clamp(clamp(desired,previousBend-maxBend,previousBend+maxBend),-1.4,1.4),z=clamp(clamp(p[k+2],p[b+2]-.3,p[b+2]+.3),1.4,7-2*f),dz=z-p[b+2],horizontal=Math.sqrt(Math.max(.01,segmentLength*segmentLength-dz*dz));
    const oldX=p[k],oldY=p[k+1],oldZ=p[k+2];
    p[k]=p[b]-Math.cos(bend)*horizontal;p[k+1]=p[b+1]-Math.sin(bend)*horizontal;p[k+2]=z;
    // Geometric bend/length corrections are not velocity: transport history too.
    previous[k]+=p[k]-oldX;previous[k+1]+=p[k+1]-oldY;previous[k+2]+=p[k+2]-oldZ;
    previousBend=bend;
   }
  }
  const targetX=clamp(-localVX*.0015-ax*.00032,-1.4,1.4)*furSway,targetY=clamp(-localVY*.002-ay*.0005-rotation/elapsed*.055+struggle*.35,-1.7,1.7)*furSway,targetZ=clamp((Math.abs(ax)+Math.abs(ay))*.00015,0,.5)*furSway;
  for(let axis=0;axis<3;axis++){const target=axis===0?targetX:axis===1?targetY:targetZ;s.furVelocity[axis]+=(target-s.fur[axis])*95*h;s.furVelocity[axis]*=Math.exp(-15*h);s.fur[axis]=clamp(s.fur[axis]+s.furVelocity[axis]*h,-3.5,3.5);}
  s.whiskerTime+=h;
  for(let sideIndex=0;sideIndex<2;sideIndex++){
   const side=sideIndex===0?-1:1,whisk=whisking*Math.sin(s.whiskerTime*27+whiskerOffset+sideIndex*.2)*.075;
   for(let axis=0;axis<3;axis++){
    const k=sideIndex*3+axis,limit=axis===0?.32:axis===1?.23:.4;
    const cue=axis===0?-side*whisk-rotation/elapsed*.018-ay*.000035+side*(impact*.13+struggle*.08):axis===1?-ax*.000035-impact*.10+struggle*.04:side*(rotation/elapsed*.015+ay*.00004)+impact*.22+struggle*.10;
    const target=clamp(cue*whiskerMotion,-limit,limit);
    s.whiskerVelocity[k]+=(target-s.whiskers[k])*(axis===2?110:190)*h;
    s.whiskerVelocity[k]*=Math.exp(-(axis===2?12:16)*h);
    s.whiskers[k]=clamp(s.whiskers[k]+s.whiskerVelocity[k]*h,-limit,limit);
    if(Math.abs(s.whiskers[k])>=limit)s.whiskerVelocity[k]*=.25;
   }
  }
  // Each pinna is hinged at its base. Slightly different mass/stiffness makes
  // a stop or pivot resolve asymmetrically without continuous decorative sway.
  for(let ear=0;ear<2;ear++){
   const side=ear===0?-1:1,shape=motion.earTraits?.[ear],flop=clamp(Number(shape?.flop)||0,0,1),earSize=clamp(Number(shape?.size)||1,.4,2.5),mass=(ear===0?.94:1.06)/(1+(earSize-1)*.45+flop*.65);
   for(let axis=0;axis<3;axis++){
    const k=ear*3+axis,limit=axis===0?.34:axis===1?.27:.17;
    const inertial=axis===0?side*(ax*.000055+Math.abs(localVX)*.00005+impact*.20+struggle*.12)+ay*.000035:axis===1?-ax*.00004+side*ay*.000035-impact*.11:rotation/elapsed*.012+attention*.07;
    const target=clamp(inertial*earSway*(1+flop*.6),-limit,limit);
    s.earVelocity[k]+=(target-s.ears[k])*earStiffness*mass*h;
    s.earVelocity[k]*=Math.exp(-earDamping*h);
    s.ears[k]=clamp(s.ears[k]+s.earVelocity[k]*h,-limit,limit);
    if(Math.abs(s.ears[k])>=limit)s.earVelocity[k]*=.25;
   }
  }
 }
 s.holdFraction=0;s.holdIndex=0;
 if(motion.tailHold&&Number.isFinite(motion.tailHold.x)&&Number.isFinite(motion.tailHold.y))applyTailHold(s,motion.tailHold);
 // Sway changes inertial forcing inside the length-constrained solver.
 s.sway=motion.tailHold?1:sway;s.x=x;s.y=y;s.heading=heading;s.size=size;s.vx=vx;s.vy=vy;s.revision++;return s;
}
// A held bow can exceed free-tail bend limits. Relax directions and segment
// lengths, not point positions, so release cannot collapse or snap the chain.
function relaxReleasedTail(s,segmentLength,h){
 const p=s.points,q=s.previous,blend=1-Math.exp(-8*h);let previousBend=0,pending=false;
 for(let i=1;i<=s.segments;i++){
  const k=i*3,b=k-3,f=i/s.segments,dx=q[k]-q[b],dy=q[k+1]-q[b+1],oldLength=s.releaseLengths[i-1];
  const oldBend=angleDelta(Math.atan2(dy,dx)-Math.PI),maxBend=.10+.12*f;
  const target=clamp(clamp(oldBend,previousBend-maxBend,previousBend+maxBend),-1.4,1.4);
  // Body-frame transport is external motion, not release correction. Allow
  // its angular contribution so continuous turning cannot stall recovery.
  const maxTurn=2*h+Math.abs(angleDelta(oldBend-s.releaseAngles[i-1]));
  const turn=angleDelta(target-oldBend),bend=oldBend+clamp(turn,-maxTurn,maxTurn);
  const length=oldLength+(segmentLength-oldLength)*blend;s.releaseLengths[i-1]=length;
  const targetZ=clamp(clamp(q[k+2],p[b+2]-.3,p[b+2]+.3),1.4,7-2*f);
  const z=q[k+2]+clamp(targetZ-q[k+2],-2*h,2*h),rise=clamp(z-p[b+2],-length*.9,length*.9),horizontal=Math.sqrt(Math.max(0,length*length-rise*rise));
  // Rear-plane constraint acts on direction, retaining the segment length.
  const rearLimit=Math.acos(clamp((p[b]-ROOT_X+.2)/(horizontal||1),-1,1));
  const safeBend=clamp(bend,-rearLimit,rearLimit);
  p[k]=p[b]-Math.cos(safeBend)*horizontal;p[k+1]=p[b+1]-Math.sin(safeBend)*horizontal;p[k+2]=p[b+2]+rise;previousBend=safeBend;
  if(Math.abs(turn)>maxTurn||Math.abs(segmentLength-length)>1e-6||Math.abs(targetZ-z)>1e-6)pending=true;
 }
 // Keep the rendered material parametrization continuous while lengths relax.
 const fraction=s.releaseIndex/s.segments;
 s.releaseFraction+=(fraction-s.releaseFraction)*blend;
 if(Math.abs(s.releaseFraction-fraction)>1e-7)pending=true;
 if(!pending){s.releasing=false;s.releaseFraction=0;s.releaseIndex=0;s.releaseLengths.fill(0);s.releaseAngles.fill(0);}
 // Constraint relaxation is geometric; it must not become a Verlet impulse.
 q.set(p);
}
// A held section is a smooth, two-anchor curve with measured arc length.
// This is a geometric constraint during a grab, not a force-based muscle model.
// Its root tangent stays behind the rump; surplus length forms a broad bend
// instead of folding individual links into corners.
export function applyTailHold(s,hold){
 s.releasing=false;s.releaseFraction=0;s.releaseIndex=0;s.releaseLengths.fill(0);s.releaseAngles.fill(0);
 const p=s.points,fraction=clamp(Number.isFinite(hold.fraction)?hold.fraction:1,.125,1),n=clamp(Math.ceil(fraction*s.segments),3,s.segments),length=LENGTH*fraction;
 let gx=Math.min(ROOT_X-.5,hold.x),gy=hold.y,gz=ROOT_Z-2*fraction,dx=gx-ROOT_X,distance=Math.hypot(dx,gy),reach=length;
 if(distance>reach){const scale=reach/distance;gx=ROOT_X+dx*scale;gy*=scale;}
 const side=Math.abs(gy)>2?Math.sign(gy):(s.holdSide||1);s.holdSide=side;
 const cx=ROOT_X-length*.22,ex=Math.min(ROOT_X-.5,gx+length*.22),samples=s.holdSamples;
 const curve=bow=>{let total=0;for(let i=0;i<=64;i++){const t=i/64,v=1-t,k=i*3;samples[k]=v*v*v*ROOT_X+3*v*v*t*cx+3*v*t*t*ex+t*t*t*gx;samples[k+1]=3*v*t*t*(gy+side*bow)+t*t*t*gy;samples[k+2]=ROOT_Z+(gz-ROOT_Z)*t;if(i)total+=Math.hypot(samples[k]-samples[k-3],samples[k+1]-samples[k-2],samples[k+2]-samples[k-1]);}return total;};
 let low=0,high=length*1.4;for(let iteration=0;iteration<12;iteration++){const mid=(low+high)*.5;if(curve(mid)<length)low=mid;else high=mid;}const total=curve((low+high)*.5);
 let sample=1,accumulated=0;
 for(let i=0;i<=n;i++){const target=total*i/n;while(sample<64){const k=sample*3,d=Math.hypot(samples[k]-samples[k-3],samples[k+1]-samples[k-2],samples[k+2]-samples[k-1]);if(accumulated+d>=target)break;accumulated+=d;sample++;}const k=sample*3,d=Math.hypot(samples[k]-samples[k-3],samples[k+1]-samples[k-2],samples[k+2]-samples[k-1])||1,u=clamp((target-accumulated)/d,0,1);for(let axis=0;axis<3;axis++)p[i*3+axis]=samples[k-3+axis]+(samples[k+axis]-samples[k-3+axis])*u;}
 let heading=Math.atan2(p[n*3+1]-p[(n-1)*3+1],p[n*3]-p[(n-1)*3]),segmentLength=(LENGTH-length)/Math.max(1,s.segments-n);
 for(let i=n+1;i<=s.segments;i++){const k=i*3,prev=k-3,desired=Math.atan2(p[k+1]-p[prev+1],p[k]-p[prev]),angle=heading+clamp(angleDelta(desired-heading),-.2,.2);p[k]=Math.min(ROOT_X-.2,p[prev]+Math.cos(angle)*segmentLength);p[k+1]=p[prev+1]+Math.sin(angle)*segmentLength;p[k+2]=clamp(p[k+2],1.4,5);heading=angle;}
 // Release carries the pose, not accumulated correction energy.
 s.previous.set(p);s.holdIndex=n;s.holdFraction=fraction;
}
// Fill a preallocated tapered tube and analytical normals. No normal rebuilding
// or Vector3 allocation is needed per rendered frame.
export function writeTailGeometry(s,positions,normals,rings=48,sides=8){
 const p=s.points,sway=1,blend=1;
 for(let i=0;i<=rings;i++){
  // Preserve the exact material fraction selected by contactAt, including
  // rings between solver nodes. Quantizing this fraction makes grabs slide.
  const f=i/rings,fraction=s.holdFraction||s.releaseFraction,index=s.holdFraction?s.holdIndex:s.releaseIndex,n=fraction?(f<=fraction?f/fraction*index:index+(f-fraction)/Math.max(.000001,1-fraction)*(s.segments-index)):f*s.segments,lo=Math.floor(n),hi=Math.min(s.segments,lo+1),u=n-lo,k=lo*3,j=hi*3,b=Math.max(0,lo-1)*3,a=Math.min(s.segments,hi+1)*3;
  // Cubic Hermite interpolation smooths the constrained chain's short links.
  // The analytical derivative also supplies a genuinely perpendicular tube.
  const u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2;
  const d00=6*u2-6*u,d10=3*u2-4*u+1,d01=-d00,d11=3*u2-2*u;
  let x=0,y=0,z=0,tx=0,ty=0,tz=0;
  for(let axis=0;axis<3;axis++){
   const v0=p[k+axis],v1=p[j+axis],m0=(v1-p[b+axis])/(hi-Math.max(0,lo-1)||1),m1=(p[a+axis]-v0)/(Math.min(s.segments,hi+1)-lo||1);
   const value=h00*v0+h10*m0+h01*v1+h11*m1,derivative=d00*v0+d10*m0+d01*v1+d11*m1;
   if(axis===0){x=ROOT_X-LENGTH*f+(value-(ROOT_X-LENGTH*f))*blend;tx=-LENGTH/s.segments+(derivative+LENGTH/s.segments)*blend;}
   else if(axis===1){y=value*sway;ty=derivative*sway;}
   else{z=ROOT_Z-2*f+(value-(ROOT_Z-2*f))*blend;tz=-2/s.segments+(derivative+2/s.segments)*blend;}
  }
  const tangentLength=Math.hypot(tx,ty,tz)||1;tx/=tangentLength;ty/=tangentLength;tz/=tangentLength;
  const horizontal=Math.hypot(tx,ty)||1,nx=-ty/horizontal,ny=tx/horizontal,bx=-tz*ny,by=tz*nx,bz=horizontal,r=2.3*(1-f)+.2;
  for(let side=0;side<=sides;side++){
   const angle=side/sides*Math.PI*2,c=Math.cos(angle),sn=Math.sin(angle),out=(i*(sides+1)+side)*3,rx=nx*c+bx*sn,ry=ny*c+by*sn,rz=bz*sn;
   positions[out]=x+rx*r;positions[out+1]=y+ry*r;positions[out+2]=Math.max(.3,z+rz*r);normals[out]=rx;normals[out+1]=ry;normals[out+2]=rz;
  }
 }
}

// Sixteen curved vibrissae. Root/control/tip points are transformed once through
// the individual's head anatomy. Dynamic rotations always pivot at that root.
export function createWhiskerShape(transform=(x,y,z)=>[x,y,z]){
 const shape=new Float32Array(16*9);let at=0;
 for(const side of [-1,1])for(let i=0;i<8;i++){
  const x=43-i*.6,y=side*3,z=12+i*.2;
  for(const point of [transform(x,y,z),transform(x+8-i*1.7,side*(16+i*1.4),z+1.8),transform(x+9-i*3,side*(25+i*2),z+.6)])for(const value of point)shape[at++]=value;
 }
 return shape;
}
export function writeWhiskerGeometry(s,shape,positions,config={},segments=6){
 const length=setting(config,'whiskerLength');let at=0;
 for(let whisker=0;whisker<16;whisker++){
  const k=whisker*9,sideIndex=whisker<8?0:1,side=sideIndex===0?-1:1,m=sideIndex*3,rx=shape[k],ry=shape[k+1],rz=shape[k+2],yaw=s.whiskers[m],pitch=s.whiskers[m+1],curve=s.whiskers[m+2],c=Math.cos(yaw),sn=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  for(let segment=0;segment<segments;segment++)for(let end=0;end<2;end++){
   const u=(segment+end)/segments,v=1-u,dx=(2*v*u*(shape[k+3]-rx)+u*u*(shape[k+6]-rx))*length,dy=(2*v*u*(shape[k+4]-ry)+u*u*(shape[k+7]-ry))*length,dz=(2*v*u*(shape[k+5]-rz)+u*u*(shape[k+8]-rz))*length;
   const bend=u*u*curve,px=dx*c-dy*sn+bend*side*2,py=(dx*sn+dy*c)*cp-dz*sp,pz=(dx*sn+dy*c)*sp+dz*cp+bend*3;
   positions[at++]=rx+px;positions[at++]=ry+py;positions[at++]=Math.max(2,rz+pz);
  }
 }
}
