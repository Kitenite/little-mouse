// Bounded expressive articulation, not an anatomical muscle simulation.
export const anatomyDefaults={headTurnAmount:1,pelvisTurnAmount:1};
export const anatomyControls={headTurnAmount:{label:'Head anticipation',min:0,max:1.5,step:.05},pelvisTurnAmount:{label:'Pelvis follow through',min:0,max:1.5,step:.05}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),smooth=n=>{const x=clamp(n,0,1);return x*x*(3-2*x);};
export function createArticulation(traits){return{head:0,pelvis:0,neck:17*traits.bodyLength,hip:-14*traits.bodyLength,scale:traits.bodyLength};}
export function advanceArticulation(state,{turn=0,moving=false,attention=0,time=0,offset=0,held=false}={},dt=0,config={}){
 if(held)return state;
 const step=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0)),headAmount=clamp(config.headTurnAmount??1,0,1.5),pelvisAmount=clamp(config.pelvisTurnAmount??1,0,1.5);
 const inspect=!moving&&!held?Math.sin(time*1.3+offset)*.07*attention:0;
 const head=clamp((-turn*.25+inspect)*headAmount,-.32,.32),pelvis=clamp(turn*.17*pelvisAmount,-.22,.22);
 state.head+=(head-state.head)*(1-Math.exp(-12*step));state.pelvis+=(pelvis-state.pelvis)*(1-Math.exp(-6*step));return state;
}
export function articulationAngle(x,state){return state.head*smooth((x/state.scale-10)/20)+state.pelvis*smooth((-x/state.scale-4)/20);}
export function articulatePoint(x,y,z,state,out=[0,0,0]){const h=smooth((x/state.scale-10)/20),p=smooth((-x/state.scale-4)/20),ha=state.head,pa=state.pelvis,dx=x-state.neck,px=x-state.hip;out[0]=x+h*(state.neck+Math.cos(ha)*dx-Math.sin(ha)*y-x)+p*(state.hip+Math.cos(pa)*px-Math.sin(pa)*y-x);out[1]=y+h*(Math.sin(ha)*dx+Math.cos(ha)*y-y)+p*(Math.sin(pa)*px+Math.cos(pa)*y-y);out[2]=z;return out;}
// Newton inversion shares exactly the shader deformation. Angles are bounded
// so the neck/hip transition remains continuous and locally invertible.
export function unarticulatePoint(x,y,state,out=[0,0]){let px=x,py=y;const f=[0,0,0],fx=[0,0,0],fy=[0,0,0];for(let i=0;i<7;i++){articulatePoint(px,py,0,state,f);const ex=f[0]-x,ey=f[1]-y;if(Math.hypot(ex,ey)<1e-7)break;articulatePoint(px+.001,py,0,state,fx);articulatePoint(px,py+.001,0,state,fy);const a=(fx[0]-f[0])*1000,b=(fy[0]-f[0])*1000,c=(fx[1]-f[1])*1000,d=(fy[1]-f[1])*1000,det=a*d-b*c;if(Math.abs(det)<.01)break;px-=(d*ex-b*ey)/det;py-=(-c*ex+a*ey)/det;}out[0]=px;out[1]=py;return out;}
export const articulationGLSL=`uniform vec4 anatomyPose;
uniform float anatomyScale;
float anatomyWeight(float x){float q=clamp(x,0.0,1.0);return q*q*(3.0-2.0*q);}
vec3 articulateMouse(vec3 v){float h=anatomyWeight((v.x/anatomyScale-10.0)/20.0),p=anatomyWeight((-v.x/anatomyScale-4.0)/20.0);vec2 hd=v.xy-vec2(anatomyPose.z,0.0),pd=v.xy-vec2(anatomyPose.w,0.0);float hc=cos(anatomyPose.x),hs=sin(anatomyPose.x),pc=cos(anatomyPose.y),ps=sin(anatomyPose.y);v.xy+=h*(vec2(hc*hd.x-hs*hd.y,hs*hd.x+hc*hd.y)+vec2(anatomyPose.z,0.0)-v.xy)+p*(vec2(pc*pd.x-ps*pd.y,ps*pd.x+pc*pd.y)+vec2(anatomyPose.w,0.0)-v.xy);return v;}
`;
