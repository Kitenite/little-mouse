// Two-bone IK in mouse-local coordinates. The anchor never leaves the body;
// unreachable paw requests are projected onto the limb's reachable shell.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const LEG_LAYOUT=Object.freeze([
 {x:-22,y:-18,z:3,anchor:[-24,-11,19],upper:18,lower:20,bend:[1,-.35,0],phase:Math.PI},
 {x:-22,y:18,z:3,anchor:[-24,11,19],upper:18,lower:20,bend:[1,.35,0],phase:0},
 {x:18,y:-13,z:3,anchor:[18,-8,16],upper:15,lower:19,bend:[-1,-.3,0],phase:0},
 {x:18,y:13,z:3,anchor:[18,8,16],upper:15,lower:19,bend:[-1,.3,0],phase:Math.PI}
]);
export function solveLeg(anchor,target,upper,lower,pole,out={joint:[0,0,0],foot:[0,0,0]}){
 let x=target[0]-anchor[0],y=target[1]-anchor[1],z=target[2]-anchor[2];
 const raw=Math.hypot(x,y,z);if(raw<1e-8){x=0;y=0;z=-1;}else{x/=raw;y/=raw;z/=raw;}
 const d=clamp(raw,Math.abs(upper-lower)+.15,upper+lower-.15);
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const dot=pole[0]*x+pole[1]*y+pole[2]*z;
 let px=pole[0]-dot*x,py=pole[1]-dot*y,pz=pole[2]-dot*z,plen=Math.hypot(px,py,pz);
 if(plen<1e-6){const ax=Math.abs(x)<.8?1:0,ay=ax?0:1,dot2=ax*x+ay*y;px=ax-dot2*x;py=ay-dot2*y;pz=-dot2*z;plen=Math.hypot(px,py,pz);}
 px/=plen;py/=plen;pz/=plen;
 out.joint[0]=anchor[0]+x*along+px*height;out.joint[1]=anchor[1]+y*along+py*height;out.joint[2]=anchor[2]+z*along+pz*height;
 out.foot[0]=anchor[0]+x*d;out.foot[1]=anchor[1]+y*d;out.foot[2]=anchor[2]+z*d;
 return out;
}
export function legTarget(layout,pose,{turn=0,limp=false,nibble=0,time=0}={},out=[0,0,0]){
 const weak=limp&&layout.x<0&&layout.y<0,side=Math.sign(layout.y),front=layout.x>0;
 out[0]=layout.x+pose.x*(1+side*clamp(turn,-1,1)*.16)*(weak?.42:1);
 out[1]=layout.y;out[2]=layout.z+pose.lift*(weak?.3:1)+(weak?1.2:0);
 if(front&&nibble>0){const a=clamp(nibble,0,1);out[0]+=(35+Math.sin(time*28+side)*.65-out[0])*a;out[1]+=(side*5.2-out[1])*a;out[2]+=(11+Math.sin(time*35)*.45-out[2])*a;}
 return out;
}
