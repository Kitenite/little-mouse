// Opaque, tapered three-triangle tufts. Rest UV sampling keeps markings on each root.
export const BODY_TUFT_LIMIT=10800,LIMB_TUFT_LIMIT=520;
export function bodyFurScale(v){
 const smooth=(a,b)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 return 1-.45*smooth(.60,.70)-.31*smooth(.73,.83);
}
export function createFurVolume(T,source,material,{count,random,length=1,softness=.5,body=false,triangleCount=source.index.count/3}={}){
 softness=Math.max(0,Math.min(1,softness));
 const positions=new Float32Array(count*15),normals=new Float32Array(count*15),uv=new Float32Array(count*10),colors=new Float32Array(count*15),flex=new Float32Array(count*5),rootNormals=new Float32Array(count*15),indices=new Uint16Array(count*9);
 const roots=new Uint32Array(count*3),weights=new Float32Array(count*3),lengths=new Float32Array(count),widths=new Float32Array(count);
 const srcUV=source.attributes.uv.array,index=source.index.array;
 const area=body?new Float32Array(triangleCount):null;let totalArea=0;
 if(body){const p=source.attributes.position.array;for(let i=0;i<triangleCount;i++){const a=index[i*3]*3,b=index[i*3+1]*3,c=index[i*3+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];totalArea+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);area[i]=totalArea;}}

 for(let i=0;i<count;i++){
  let triangle=Math.floor(random()*triangleCount);if(area){const sample=random()*totalArea;let lo=0,hi=triangleCount-1;while(lo<hi){const mid=(lo+hi)>>1;if(area[mid]<sample)lo=mid+1;else hi=mid;}triangle=lo;}
  const tri=triangle*3,a=Math.sqrt(random()),b=random();weights.set([1-a,a*(1-b),a*b],i*3);
  for(let k=0;k<3;k++)roots[i*3+k]=index[tri+k];
  let v=0,u=0;for(let k=0;k<3;k++){u+=srcUV[roots[i*3+k]*2]*weights[i*3+k];v+=srcUV[roots[i*3+k]*2+1]*weights[i*3+k];}
  // Muzzle is finer and shorter; distal limbs thin toward bare paw skin.
  const regional=body?bodyFurScale(v):(.8-.4*v);
  lengths[i]=Math.min(6,(1.5+random()*3)*length)*regional;widths[i]=(.12+random()*.12)*(.7+softness)*regional;
  const shade=.94+random()*.2;
  for(let k=0;k<5;k++){uv.set([u,v],i*10+k*2);const brightness=shade*(k<2?.93:k<4?1:1.08);colors.set([brightness,brightness,brightness],i*15+k*3);flex[i*5+k]=k<2?0:k<4?.15:.25;}
  const n=i*5;indices.set([n,n+1,n+2,n+1,n+3,n+2,n+2,n+3,n+4],i*9);
 }
 const geometry=new T.BufferGeometry();for(const [name,data,size]of [['position',positions,3],['normal',normals,3],['uv',uv,2],['color',colors,3],['hairFlex',flex,1],['hairNormal',rootNormals,3]])geometry.setAttribute(name,new T.BufferAttribute(data,size).setUsage(body?T.StaticDrawUsage:T.DynamicDrawUsage));geometry.setIndex(new T.BufferAttribute(indices,1));
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.visible=count>0;
 const point=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3(),side=new T.Vector3(),faceNormal=new T.Vector3();
 const volume={mesh,geometry,roots,weights,lengths,widths,update};
 function update(){
  const p=source.attributes.position.array,n=source.attributes.normal.array;
  for(let i=0;i<count;i++){
   point.set(0,0,0);normal.set(0,0,0);for(let k=0;k<3;k++){const root=roots[i*3+k]*3,w=weights[i*3+k];point.x+=p[root]*w;point.y+=p[root+1]*w;point.z+=p[root+2]*w;normal.x+=n[root]*w;normal.y+=n[root+1]*w;normal.z+=n[root+2]*w;}normal.normalize();
   // Derive local increasing-v direction from the sampled rest triangle, including deformed limbs.
   const ia=roots[i*3],ib=roots[i*3+1],ic=roots[i*3+2],du1=srcUV[ib*2]-srcUV[ia*2],du2=srcUV[ic*2]-srcUV[ia*2],dv1=srcUV[ib*2+1]-srcUV[ia*2+1],dv2=srcUV[ic*2+1]-srcUV[ia*2+1],det=du1*dv2-du2*dv1;
   tangent.set((du1*(p[ic*3]-p[ia*3])-du2*(p[ib*3]-p[ia*3]))/(det||1),(du1*(p[ic*3+1]-p[ia*3+1])-du2*(p[ib*3+1]-p[ia*3+1]))/(det||1),(du1*(p[ic*3+2]-p[ia*3+2])-du2*(p[ib*3+2]-p[ia*3+2]))/(det||1));
   tangent.addScaledVector(normal,-tangent.dot(normal));if(tangent.lengthSq()<1e-8)tangent.set(1,0,0).addScaledVector(normal,-normal.x);tangent.normalize().multiplyScalar(body?-1:1);side.crossVectors(tangent,normal).normalize();
   const len=lengths[i],width=widths[i];
   // Reuse seeded shade variation: mixed loft without extra RNG draws or buffers.
   // Mixed shoulder heights break up the rim; tips curl back toward the coat.
   const variation=Math.max(0,Math.min(1,(colors[i*15]/.93-.94)/.2));
   const loft=.55+.45*variation, curl=softness*(.16+.18*(1-variation));
   for(let k=0;k<5;k++){const advance=k<2?0:k<4?.55*(1-softness*.2):1-softness*.2,rise=k<2?.015:k<4?.15+softness*.5*loft:.08+softness*.6*loft-curl,spread=k===4?0:(k%2?1:-1)*(k<2?width:width*.55),at=i*15+k*3;
    positions[at]=point.x+tangent.x*len*advance+normal.x*len*rise+side.x*spread;positions[at+1]=point.y+tangent.y*len*advance+normal.y*len*rise+side.y*spread;positions[at+2]=point.z+tangent.z*len*advance+normal.z*len*rise+side.z*spread;
    // Curved normal profile catches light; no translucent halo or billboard blending.
    faceNormal.copy(normal).addScaledVector(tangent,k<2?-.25:k<4?-.08:.18+curl).normalize();normals[at]=faceNormal.x;normals[at+1]=faceNormal.y;normals[at+2]=faceNormal.z;rootNormals[at]=normal.x;rootNormals[at+1]=normal.y;rootNormals[at+2]=normal.z;
   }
  }
  geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;geometry.attributes.hairNormal.needsUpdate=true;
 }
 return volume;
}
export function furVolumeMaterial(T,fur){const material=fur.clone();material.bumpMap=null;material.vertexColors=true;material.side=T.DoubleSide;material.transparent=false;material.opacity=1;material.depthWrite=true;material.roughness=.86;return material;}

export function updateFurRoughness(model,roughness){
 model.fur.roughness=model.body.material.roughness=roughness;
 model.bodyFur.mesh.material.roughness=roughness;
 for(const leg of model.legRig.legs){leg.surface.mesh.material.roughness=roughness;leg.surface.volume.mesh.material.roughness=roughness;}
}
