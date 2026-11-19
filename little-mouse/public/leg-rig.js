import{createLimbSurface}from'./limb-surface.js';
import{articulatePoint}from'./anatomy.js';
import{footPose}from'./gait.js';
import{LEG_LAYOUT,solveLeg,legTarget}from'./leg-kinematics.js';
export function applyHeldPawTarget(target,index,heldPaw){if(!heldPaw||heldPaw.index!==index||![heldPaw.x,heldPaw.y,heldPaw.z].every(Number.isFinite))return false;target[0]=heldPaw.x;target[1]=heldPaw.y;target[2]=heldPaw.z;return true;}
export function applyActivityTarget(target,layout,index,activity){
 if(!activity||activity.weight<=0||activity.kind==='nibble')return;
 const side=Math.sign(layout.y),front=layout.x>0,amount=Math.max(0,Math.min(1,activity.weight)),time=activity.elapsed,head=layout.nibblePoint||[35,side*5.2,11];let x=target[0],y=target[1],z=target[2];
 if(activity.kind==='groom'&&front){const wipe=.5+.5*Math.sin(time*13+side*1.8);x=head[0]-7+wipe*4;y=side*(Math.abs(head[1])+2+wipe*3);z=head[2]+7+wipe*8;}
 else if(activity.kind==='scratch'&&!front&&side===activity.side){const scratch=Math.sin(time*24);x=layout.anchor[0]+(layout.upper+layout.lower)*.83;y=side*(Math.abs(layout.anchor[1])+3);z=layout.anchor[2]+5+scratch*2.5;}
 else if(activity.kind==='stretch'){x=layout.x+(front?10:-14);y=layout.y+side*2;z=Math.max(1,layout.z-1);}
 else if(activity.kind==='roll'){x=layout.x+Math.sin(time*8+index)*3;y=layout.y*.7;z=layout.z+8+Math.sin(time*9+index)*3;}
 else return;
 target[0]+=(x-target[0])*amount;target[1]+=(y-target[1])*amount;target[2]+=(z-target[2])*amount;
}
export function createLegRig(T,group,{fur,skin},ellipsoid,layouts=LEG_LAYOUT){
 const axis=new T.Vector3(0,1,0),direction=new T.Vector3();
 const legs=layouts.map(layout=>{
  const shoulder=ellipsoid(group,fur,...layout.anchor,(layout.x<0?8:5)*(layout.width||1),5*(layout.width||1),6);
  const upper=ellipsoid(group,fur,0,0,0,1,1,1),lower=ellipsoid(group,fur,0,0,0,1,1,1);
  const knee=ellipsoid(group,fur,0,0,0,3.3,3.3,3.3);
  const paw=new T.Group();paw.scale.set(layout.pawLength||1,layout.pawWidth||1,Math.sqrt((layout.pawLength||1)*(layout.pawWidth||1)));group.add(paw);ellipsoid(paw,skin,2,0,0,5,2.8,1.4);
  for(let j=0;j<4;j++)ellipsoid(paw,skin,6.2+j*.16,-2.3+j*1.5,-.15,2.7,.64,.7,false);
  const surface=createLimbSurface(T,group,fur,layout);for(const mesh of [shoulder,upper,lower,knee])mesh.visible=false;
  return{surface,layout,anchor:[...layout.anchor],shoulder,upper,lower,knee,paw,target:[0,0,0],solution:{joint:[0,0,0],foot:[0,0,0]}};
 });
 function segment(mesh,a,b,radius){direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const length=direction.length();mesh.position.set((a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5);mesh.quaternion.setFromUnitVectors(axis,direction.multiplyScalar(1/Math.max(.001,length)));mesh.scale.set(radius,length*.5+.35,radius);}
 return{legs,animate(gait,options={}){for(let index=0;index<legs.length;index++){const leg=legs[index],{layout,solution}=leg,pose=footPose(gait,layout.phase);legTarget(layout,pose,options,leg.target);applyActivityTarget(leg.target,layout,index,options.activity);if(layout.nibblePoint&&layout.x>0&&options.nibble>0){const blend=Math.min(1,options.nibble),base=[35,Math.sign(layout.y)*5.2,11];for(let axis=0;axis<3;axis++)leg.target[axis]+=(layout.nibblePoint[axis]-base[axis])*blend;}if(options.articulation){articulatePoint(...layout.anchor,options.articulation,leg.anchor);articulatePoint(...leg.target,options.articulation,leg.target);}else leg.anchor.splice(0,3,...layout.anchor);leg.shoulder.position.set(...leg.anchor);if(options.dragOffset){leg.target[0]+=options.dragOffset[3];leg.target[1]+=options.dragOffset[4];}const held=applyHeldPawTarget(leg.target,index,options.heldPaw);solveLeg(leg.anchor,leg.target,layout.upper,layout.lower,layout.bend,solution);leg.surface.update(leg.anchor,solution.joint,solution.foot);segment(leg.upper,leg.anchor,solution.joint,(layout.x<0?4.2:3.2)*(layout.width||1));segment(leg.lower,solution.joint,solution.foot,2.4*(layout.width||1));leg.knee.position.set(...solution.joint);leg.paw.position.set(...solution.foot);leg.paw.rotation.y=held?0:pose.pitch*(1-(options.nibble||0));leg.paw.rotation.z=held?0:Math.sign(layout.y)*(options.nibble||0)*.22;}}};
}
