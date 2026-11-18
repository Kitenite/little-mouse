// Bounded expressive articulation, not an anatomical muscle simulation.
export const anatomyDefaults={headTurnAmount:1,pelvisTurnAmount:1,spineBendAmount:1};
export const anatomyControls={spineBendAmount:{label:'Spine / waist bend',min:0,max:1.5,step:.05},headTurnAmount:{label:'Head anticipation',min:0,max:1.5,step:.05},pelvisTurnAmount:{label:'Pelvis follow through',min:0,max:1.5,step:.05}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),smooth=n=>{const x=clamp(n,0,1);return x*x*(3-2*x);};
export function createArticulation(traits){return{head:0,pelvis:0,spine:0,neck:17*traits.bodyLength,hip:-14*traits.bodyLength,scale:traits.bodyLength};}
export function advanceArticulation(state,{turn=0,moving=false,attention=0,time=0,offset=0,phase=0,activity=0,held=false}={},dt=0,config={}){
 if(held||!Number.isFinite(dt)||dt<=0)return state;
 turn=Number.isFinite(turn)?turn:0;
 const step=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0)),headAmount=clamp(config.headTurnAmount??1,0,1.5),pelvisAmount=clamp(config.pelvisTurnAmount??1,0,1.5);
 const inspect=!moving&&!held?Math.sin(time*1.3+offset)*.07*attention:0;
 const head=clamp((-turn*.25+inspect)*headAmount,-.32,.32),pelvis=clamp(turn*.17*pelvisAmount,-.22,.22);
 // Fast neck, slower central trunk, slowest pelvis. Gait contributes only
 // while active; idle inspection uses a small counterbalance, not a wag.
 const amount=clamp(Number.isFinite(config.spineBendAmount)?config.spineBendAmount:1,0,1.5);
 const spine=clamp((-turn*.13+(moving?Math.sin(phase)*.035*clamp(activity,0,1):-inspect*.35))*amount,-.18,.18);
 state.spine=((state.spine||0)+(spine-(state.spine||0))*(1-Math.exp(-8*step)));
 state.head+=(head-state.head)*(1-Math.exp(-12*step));state.pelvis+=(pelvis-state.pelvis)*(1-Math.exp(-6*step));return state;
}
const spineSlope=(x,length)=>{const t=clamp(x/length,-1,1);return t*(1.5-.5*t*t);};
const spineCenter=(x,length)=>{const t=x/length;return Math.abs(t)<=1?length*(.75*t*t-.125*t*t*t*t):Math.abs(x)-.375*length;};
const tangentA=[0,0,0],tangentB=[0,0,0];
export function articulationAngle(x,state){articulatePoint(x-.001,0,0,state,tangentA);articulatePoint(x+.001,0,0,state,tangentB);return Math.atan2(tangentB[1]-tangentA[1],tangentB[0]-tangentA[0]);}
function articulateSegments(x,y,z,state,out){const h=smooth((x/state.scale-10)/20),p=smooth((-x/state.scale-4)/20),ha=state.head,pa=state.pelvis,dx=x-state.neck,px=x-state.hip;out[0]=x+h*(state.neck+Math.cos(ha)*dx-Math.sin(ha)*y-x)+p*(state.hip+Math.cos(pa)*px-Math.sin(pa)*y-x);out[1]=y+h*(Math.sin(ha)*dx+Math.cos(ha)*y-y)+p*(Math.sin(pa)*px+Math.cos(pa)*y-y);out[2]=z;return out;}
export function articulatePoint(x,y,z,state,out=[0,0,0]){articulateSegments(x,y,z,state,out);
 // Continuous centerline, straight tangent extensions beyond the trunk.
 const length=20*state.scale,bx=out[0],by=out[1],q=spineSlope(bx,length),bend=state.spine||0;
 const a=Math.atan(bend*q),center=bend*spineCenter(bx,length);
 out[0]=bx-Math.sin(a)*by+(state.offsetX||0);out[1]=center+Math.cos(a)*by+(state.offsetY||0);out[2]=z;return out;}
// Newton inversion shares exactly the shader deformation. Angles are bounded
// so the neck/hip transition remains continuous and locally invertible.
export function unarticulatePoint(x,y,state,out=[0,0]){// Undo the central bend first. Its scalar derivative remains positive over
 // supported body widths, avoiding a poor combined-Newton initial guess.
 x-=state.offsetX||0;y-=state.offsetY||0;
 const length=20*state.scale,bend=state.spine||0;let bx=x;
 for(let i=0;i<10;i++){const q=spineSlope(bx,length),slope=bend*q,center=bend*spineCenter(bx,length),error=bx-slope*(y-center)-x;
 if(Math.abs(error)<1e-9)break;bx-=error/(1-(Math.abs(bx)<length?bend*1.5*(1-bx*bx/(length*length))/length:0)*(y-center)+slope*slope);}
 const q=spineSlope(bx,length),center=bend*spineCenter(bx,length);
 y=(y-center)/Math.cos(Math.atan(bend*q));x=bx;
 let px=x,py=y;const f=[0,0,0],fx=[0,0,0],fy=[0,0,0];for(let i=0;i<16;i++){articulateSegments(px,py,0,state,f);const ex=f[0]-x,ey=f[1]-y;if(Math.hypot(ex,ey)<1e-7)break;articulateSegments(px+.001,py,0,state,fx);articulateSegments(px,py+.001,0,state,fy);const a=(fx[0]-f[0])*1000,b=(fy[0]-f[0])*1000,c=(fx[1]-f[1])*1000,d=(fy[1]-f[1])*1000,det=a*d-b*c;if(Math.abs(det)<.01)break;px-=(d*ex-b*ey)/det;py-=(-c*ex+a*ey)/det;}out[0]=px;out[1]=py;return out;}
export const articulationGLSL=`uniform vec4 anatomyPose;
uniform float anatomyScale;
uniform float anatomySpine;
uniform vec2 anatomyOffset;
float anatomyWeight(float x){float q=clamp(x,0.0,1.0);return q*q*(3.0-2.0*q);}
vec3 articulateMouse(vec3 v){float h=anatomyWeight((v.x/anatomyScale-10.0)/20.0),p=anatomyWeight((-v.x/anatomyScale-4.0)/20.0);vec2 hd=v.xy-vec2(anatomyPose.z,0.0),pd=v.xy-vec2(anatomyPose.w,0.0);float hc=cos(anatomyPose.x),hs=sin(anatomyPose.x),pc=cos(anatomyPose.y),ps=sin(anatomyPose.y);v.xy+=h*(vec2(hc*hd.x-hs*hd.y,hs*hd.x+hc*hd.y)+vec2(anatomyPose.z,0.0)-v.xy)+p*(vec2(pc*pd.x-ps*pd.y,ps*pd.x+pc*pd.y)+vec2(anatomyPose.w,0.0)-v.xy);float length=20.0*anatomyScale;float t=clamp(v.x/length,-1.0,1.0),q=t*(1.5-.5*t*t),a=atan(anatomySpine*q);float center=anatomySpine*(abs(v.x)<=length?length*(.75*t*t-.125*t*t*t*t):abs(v.x)-.375*length);v.xy=vec2(v.x-sin(a)*v.y,center+cos(a)*v.y)+anatomyOffset;return v;}
vec3 articulateMouseNormal(vec3 p,vec3 n){vec3 f=articulateMouse(p);vec2 dx=(articulateMouse(p+vec3(.01,0.0,0.0)).xy-f.xy)/.01,dy=(articulateMouse(p+vec3(0.0,.01,0.0)).xy-f.xy)/.01;float det=dx.x*dy.y-dy.x*dx.y;return normalize(vec3((dy.y*n.x-dx.y*n.y)/det,(-dy.x*n.x+dx.x*n.y)/det,n.z));}
`;
