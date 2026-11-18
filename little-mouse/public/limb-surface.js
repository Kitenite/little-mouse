// A single connected envelope follows solved IK. It never changes targets or contacts.
export const LIMB_RINGS=21, LIMB_SIDES=12;
export function createLimbSurface(T,parent,material,layout){
 const count=LIMB_RINGS*(LIMB_SIDES+1)+2,positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),indices=[];
 for(let i=0;i<LIMB_RINGS;i++)for(let j=0;j<=LIMB_SIDES;j++){
  const k=i*(LIMB_SIDES+1)+j;uv[k*2]=j/LIMB_SIDES;uv[k*2+1]=i/(LIMB_RINGS-1);
  if(i<LIMB_RINGS-1&&j<LIMB_SIDES)indices.push(k,k+1,k+LIMB_SIDES+1,k+1,k+LIMB_SIDES+2,k+LIMB_SIDES+1);
 }
 const rootCap=count-2,tipCap=count-1;uv[rootCap*2]=uv[tipCap*2]=.5;uv[tipCap*2+1]=1;
 for(let j=0;j<LIMB_SIDES;j++){indices.push(rootCap,j+1,j);const k=(LIMB_RINGS-1)*(LIMB_SIDES+1)+j;indices.push(tipCap,k,k+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setIndex(indices);
 const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.frustumCulled=false;parent.add(mesh);
 const centers=new Float32Array(LIMB_RINGS*3),radius=new Float32Array(LIMB_RINGS),u=new T.Vector3(),v=new T.Vector3(),plane=new T.Vector3(),tangent=new T.Vector3(),radial=new T.Vector3(),other=new T.Vector3();
 const surface={mesh,geometry,positions,normals,centers,radius,hair:null,update};
 function update(anchor,joint,foot){
  u.set(joint[0]-anchor[0],joint[1]-anchor[1],joint[2]-anchor[2]).normalize();v.set(foot[0]-joint[0],foot[1]-joint[1],foot[2]-joint[2]).normalize();
  plane.crossVectors(u,v);if(plane.lengthSq()<1e-8){plane.set(...layout.bend).cross(u);if(plane.lengthSq()<1e-8)plane.set(Math.abs(u.x)<.8?1:0,Math.abs(u.x)<.8?0:1,0).cross(u);}plane.normalize();
  const width=layout.width||1,thigh=layout.x<0?6:4.1;
  for(let i=0;i<LIMB_RINGS;i++){
   const t=i/(LIMB_RINGS-1),k=i*3;
   // Rounded elbow occupies only the middle 20%; straight shafts retain bone lengths.
   for(let axis=0;axis<3;axis++){
    const a=anchor[axis],b=joint[axis],c=foot[axis];let value;
    if(t<.4)value=a+(b-a)*t*2;
    else if(t>.6)value=b+(c-b)*(t*2-1);
    else{const q=(t-.4)/.2,start=a+(b-a)*.8,end=b+(c-b)*.2;value=(1-q)**2*start+2*(1-q)*q*b+q*q*end;}
    centers[k+axis]=value;
   }
   const r=t<.5?thigh+(2.6-thigh)*(t*2):2.6+(1.45-2.6)*((t-.5)*2);
   radius[i]=r*width;
  }
  for(let i=0;i<LIMB_RINGS;i++){
   const prev=Math.max(0,i-1)*3,next=Math.min(LIMB_RINGS-1,i+1)*3,k=i*3;
   tangent.set(centers[next]-centers[prev],centers[next+1]-centers[prev+1],centers[next+2]-centers[prev+2]).normalize();
   const slope=(radius[Math.min(LIMB_RINGS-1,i+1)]-radius[Math.max(0,i-1)])/Math.max(.001,Math.hypot(centers[next]-centers[prev],centers[next+1]-centers[prev+1],centers[next+2]-centers[prev+2]));
   radial.crossVectors(plane,tangent).normalize();other.crossVectors(tangent,radial).normalize();
   for(let j=0;j<=LIMB_SIDES;j++){
    const a=j/LIMB_SIDES*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a),index=(i*(LIMB_SIDES+1)+j)*3;
    const nx=radial.x*cs+other.x*sn,ny=radial.y*cs+other.y*sn,nz=radial.z*cs+other.z*sn;
    positions[index]=centers[k]+nx*radius[i];positions[index+1]=centers[k+1]+ny*radius[i];positions[index+2]=centers[k+2]+nz*radius[i];const normalLength=Math.hypot(nx-tangent.x*slope,ny-tangent.y*slope,nz-tangent.z*slope);normals[index]=(nx-tangent.x*slope)/normalLength;normals[index+1]=(ny-tangent.y*slope)/normalLength;normals[index+2]=(nz-tangent.z*slope)/normalLength;
   }
  }
  for(let axis=0;axis<3;axis++){positions[rootCap*3+axis]=anchor[axis];positions[tipCap*3+axis]=foot[axis];normals[rootCap*3+axis]=-u.getComponent(axis);normals[tipCap*3+axis]=v.getComponent(axis);}
  geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;
  if(surface.volume)surface.volume.update();
  if(surface.hair){const {data,roots,lengths,geometry:hairGeometry}=surface.hair;for(let i=0;i<roots.length;i++){const root=roots[i]*3,k=i*6;for(let axis=0;axis<3;axis++){data[k+axis]=positions[root+axis];data[k+3+axis]=positions[root+axis]+normals[root+axis]*lengths[i];}}hairGeometry.attributes.position.needsUpdate=true;}
 }
 return surface;
}
export function addLimbSurfaceHair(T,parent,surface,material,density,random){
 const count=Math.min(520,Math.round(300*density)),roots=new Uint16Array(count),lengths=new Float32Array(count),data=new Float32Array(count*6);
 for(let i=0;i<count;i++){const ring=1+Math.floor(random()*(LIMB_RINGS-3));roots[i]=ring*(LIMB_SIDES+1)+Math.floor(random()*LIMB_SIDES);lengths[i]=.35+random()*.65;}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(data,3).setUsage(T.DynamicDrawUsage));const mesh=new T.LineSegments(geometry,material);mesh.frustumCulled=false;parent.add(mesh);surface.hair={mesh,geometry,data,roots,lengths};
}
