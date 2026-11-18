import * as T from './vendor/three.module.js';
import{GroundMemory,ENVIRONMENT_CAPACITY}from'./environment.js';
export class GroundResponse{
 constructor(scene){this.memory=new GroundMemory();this.feet=new Float64Array(12);this.point=new T.Vector3();
  const geometry=new T.InstancedBufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));geometry.setIndex([0,1,2,0,2,3]);
  this.shape=new T.InstancedBufferAttribute(new Float32Array(ENVIRONMENT_CAPACITY*4),4).setUsage(T.DynamicDrawUsage);this.style=new T.InstancedBufferAttribute(new Float32Array(ENVIRONMENT_CAPACITY*3),3).setUsage(T.DynamicDrawUsage);geometry.setAttribute('shape',this.shape);geometry.setAttribute('style',this.style);geometry.instanceCount=ENVIRONMENT_CAPACITY;
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{floorColor:{value:new T.Color('#65553d')}},vertexShader:`attribute vec4 shape; attribute vec3 style; varying vec2 uvGround; varying float opacityGround; void main(){uvGround=position.xy;opacityGround=style.y;float c=cos(style.x),s=sin(style.x);vec2 p=position.xy*shape.zw;p=mat2(c,s,-s,c)*p+shape.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,0.12,1.0);}`,fragmentShader:`uniform vec3 floorColor;varying vec2 uvGround;varying float opacityGround;void main(){float r=dot(uvGround,uvGround);float a=pow(max(0.0,1.0-r),2.0)*opacityGround;if(a<0.001)discard;gl_FragColor=vec4(floorColor,a);}`});
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
  for(let i=0;i<ENVIRONMENT_CAPACITY;i++){const p=memory.marks[i],age=Math.max(0,t-(p.at||0)),settle=p.kind===2?1-Math.exp(-age*12):0,travel=settle*3;this.shape.setXYZW(i,(p.x||0)+Math.cos(p.angle||0)*travel-w/2,h/2-(p.y||0)-Math.sin(p.angle||0)*travel,p.rx||0,(p.ry||0)*(1-settle*.2));this.style.setXYZ(i,-(p.angle||0)+settle*.2,memory.opacity(p),0);}this.shape.needsUpdate=this.style.needsUpdate=true;
 }
}
