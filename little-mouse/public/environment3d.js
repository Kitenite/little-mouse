import * as T from './vendor/three.module.js';
import{GroundMemory,ENVIRONMENT_CAPACITY}from'./environment.js';
// Caller-owned output keeps per-frame pose evaluation allocation-free.
export function groundMarkPose(p,t,material,out){
 const age=Math.max(0,t-(p.at||0)),settle=p.kind===2?1-Math.exp(-age*12):0;
 const blade=material==='grass'&&p.kind===2,angle=(p.angle||0)+(blade?.3:-.2)*settle;
 const ry=(p.ry||0)*(1-settle*(blade?.15:.2));
 out.x=p.x||0;out.y=p.y||0;out.rx=p.rx||0;out.ry=ry;out.angle=angle;out.kind=blade?3:(p.kind||0);
 if(blade){ // Bend about the ground root instead of sliding a grass blade sideways.
  out.x+=Math.sin(angle)*ry-Math.sin(p.angle)*p.ry;
  out.y+=Math.cos(p.angle)*p.ry-Math.cos(angle)*ry;
 }else if(p.kind===2){out.x+=Math.cos(p.angle)*settle*3;out.y+=Math.sin(p.angle)*settle*3;}
 return out;
}
export class GroundResponse{
 constructor(scene){this.memory=new GroundMemory();this.feet=new Float64Array(12);this.point=new T.Vector3();this.pose={};
  const geometry=new T.InstancedBufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));geometry.setIndex([0,1,2,0,2,3]);
  this.shape=new T.InstancedBufferAttribute(new Float32Array(ENVIRONMENT_CAPACITY*4),4).setUsage(T.DynamicDrawUsage);this.style=new T.InstancedBufferAttribute(new Float32Array(ENVIRONMENT_CAPACITY*3),3).setUsage(T.DynamicDrawUsage);geometry.setAttribute('shape',this.shape);geometry.setAttribute('style',this.style);geometry.instanceCount=ENVIRONMENT_CAPACITY;
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{floorColor:{value:new T.Color('#65553d')}},vertexShader:`attribute vec4 shape; attribute vec3 style; varying vec2 uvGround; varying float opacityGround; varying float kindGround; void main(){uvGround=position.xy;opacityGround=style.y;kindGround=style.z;float c=cos(style.x),s=sin(style.x);vec2 p=position.xy*shape.zw;p=mat2(c,s,-s,c)*p+shape.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,0.12,1.0);}`,fragmentShader:`uniform vec3 floorColor;varying vec2 uvGround;varying float opacityGround;varying float kindGround;void main(){float r=dot(uvGround,uvGround);float mask=pow(max(0.0,1.0-r),2.0);if(kindGround>2.5){float v=(uvGround.y+1.0)*0.5;float center=0.28*sin(v*3.14159);float width=0.7*(1.0-v)+0.02;mask=(1.0-smoothstep(width*0.45,width,abs(uvGround.x-center)))*smoothstep(0.0,0.08,v)*(1.0-smoothstep(0.94,1.0,v));}float a=mask*opacityGround;if(a<0.001)discard;gl_FragColor=vec4(floorColor,a);}`});
  this.mesh=new T.Mesh(geometry,material);this.mesh.frustumCulled=false;this.mesh.renderOrder=-1;scene.add(this.mesh);this.clear();
 }
 clear(){this.memory.clear();this.mesh.visible=false;}
 update(models,mice,config,t,w,h){const memory=this.memory;memory.begin(config,t,w,h);
  if(!memory.strength||memory.material==='hard'){this.mesh.visible=false;return;}
  for(let i=0;i<models.length;i++){const model=models[i],data=mice[i];model.group.updateMatrix();model.group.matrixWorld.copy(model.group.matrix);
   for(let j=0;j<4;j++){this.point.copy(model.feet[j].position).applyMatrix4(model.group.matrixWorld);this.feet[j*3]=this.point.x+w/2;this.feet[j*3+1]=h/2-this.point.y;this.feet[j*3+2]=this.point.z;}
   memory.sample(i,model,data.x,data.y,config.size,this.feet,!!data.hold&&(data.hold.part==='head'||data.hold.part==='body'),model.group.visible&&data.state!=='defeated'&&!(data.tossUntil>t));
  }
  this.mesh.visible=memory.active>0;if(!this.mesh.visible)return;
  this.mesh.material.uniforms.floorColor.value.set(memory.material==='grass'?'#52603a':'#65553d');
  for(let i=0;i<ENVIRONMENT_CAPACITY;i++){const p=memory.marks[i],pose=groundMarkPose(p,t,memory.material,this.pose);this.shape.setXYZW(i,pose.x-w/2,h/2-pose.y,pose.rx,pose.ry);this.style.setXYZ(i,-pose.angle,memory.opacity(p),pose.kind);}this.shape.needsUpdate=this.style.needsUpdate=true;
 }
}
