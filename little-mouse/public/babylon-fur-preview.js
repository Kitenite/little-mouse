import * as B from './vendor/babylon-fur.js';
import {articulatePoint} from './anatomy.js';
import {identityRandom} from './mouse-identity.js';
// Official FurMaterial, kept behind a lazy-loaded review surface until feature gates pass.
export function createBabylonFurPreview(canvas,model,{shells=16,width=640,height=400}={}){
 const engine=new B.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});engine.setSize(width,height);
 const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.clearColor=new B.Color4(.9,.89,.85,1);
 const camera=new B.FreeCamera('camera',new B.Vector3(0,-350,180),scene);camera.upVector=new B.Vector3(0,0,1);camera.setTarget(new B.Vector3(-10,0,15));camera.mode=1;
 camera.orthoLeft=-115;camera.orthoRight=95;camera.orthoTop=65;camera.orthoBottom=-65;camera.minZ=.1;camera.maxZ=1000;
 const ambient=new B.HemisphericLight('sky',new B.Vector3(0,0,1),scene);ambient.intensity=1.2;ambient.groundColor=new B.Color3(.35,.32,.28);
 const key=new B.DirectionalLight('key',new B.Vector3(.5,.6,-1),scene);key.intensity=1.4;
 const noise=new B.DynamicTexture('seeded-fur',256,scene,true),ctx=noise.getContext(),random=identityRandom(model.identity.seed);
 // Same channel encoding as FurMaterial.GenerateTexture, seeded for paired comparison.
 for(let i=0;i<20000;i++){ctx.fillStyle=`rgb(255,${Math.floor(random()*255)},${Math.floor(random()*255)})`;ctx.fillRect(random()*256,random()*256,2,2);}noise.update(false);noise.wrapU=noise.wrapV=1;
 const excluded=new Set([model.bodyFur.mesh,...model.legRig.legs.map(l=>l.surface.volume.mesh)]),furred=new Set([model.body,...model.legRig.legs.map(l=>l.surface.mesh)]),textures=new Map(),entries=[];
 function texture(source){if(!source?.image)return null;if(textures.has(source))return textures.get(source).texture;const image=source.image,w=image.width||128,h=image.height||128;if(!w||!h)return null;const t=new B.DynamicTexture('coat-'+source.id,{width:w,height:h},scene,true);try{t.getContext().drawImage(image,0,0,w,h);t.update(false);}catch{t.dispose();return null;}textures.set(source,{texture:t,version:source.version});return t;}
 model.group.updateMatrixWorld(true);
 model.group.traverse(object=>{
  if(!object.isMesh||excluded.has(object)||!object.visible)return;for(let p=object.parent;p;p=p.parent)if(!p.visible)return;
  const g=object.geometry,mesh=new B.Mesh('part-'+object.id,scene),data=new B.VertexData();data.positions=g.attributes.position.array.slice();data.normals=g.attributes.normal?.array.slice();data.uvs=g.attributes.uv?.array.slice();data.indices=g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i);data.applyToMesh(mesh,true);
  const material=furred.has(object)?new B.FurMaterial('fur-'+object.id,scene):new B.StandardMaterial('skin-'+object.id,scene),color=object.material.color;
  material.diffuseColor=new B.Color3(color?.r??1,color?.g??1,color?.b??1);material.diffuseTexture=texture(object.material.map);material.backFaceCulling=false;material.specularColor=new B.Color3(.03,.03,.03);
  mesh.material=material;let layers=[mesh];if(furred.has(object)){material.furTexture=noise;material.furLength=.4;material.furSpacing=(object===model.body?2.7:1)*model.traits.furLength;material.furDensity=24;material.furAngle=0;material.furGravity=new B.Vector3(-.35,0,-.12);material.furSpeed=Infinity;material.furTime=0;material.furColor=material.diffuseColor;layers=B.FurMaterial.FurifyMesh(mesh,shells);for(const layer of layers){layer.material.furOcclusion=.8;layer.material.diffuseColor=material.diffuseColor;layer.material.backFaceCulling=false;}}
  entries.push({object,mesh,layers,data});
 });
 const point=[0,0,0];let disposed=false,drawCalls=0;
 function sync(){model.group.updateMatrixWorld(true);for(const e of entries){const {object,mesh,data}=e,g=object.geometry;mesh.freezeWorldMatrix(B.Matrix.FromArray(object.matrixWorld.elements));if(object===model.body){const p=g.attributes.position.array;for(let i=0;i<p.length;i+=3){articulatePoint(p[i],p[i+1],p[i+2],model.articulation,point);data.positions.set(point,i);}B.VertexData.ComputeNormals(data.positions,data.indices,data.normals);}else{data.positions.set(g.attributes.position.array);if(g.attributes.normal)data.normals.set(g.attributes.normal.array);}mesh.updateVerticesData(B.VertexBuffer.PositionKind,data.positions);mesh.updateVerticesData(B.VertexBuffer.NormalKind,data.normals);}
  for(const [source,t]of textures)if(t.version!==source.version&&source.image){const size=t.texture.getSize();t.texture.getContext().drawImage(source.image,0,0,size.width,size.height);t.texture.update(false);t.version=source.version;}
 }
 function render(){if(disposed)return;sync();const before=engine._drawCalls.current;engine.beginFrame();scene.render();engine.endFrame();drawCalls=engine._drawCalls.current-before;}
 function diagnostics(){return{library:'@babylonjs/materials@9.37.1 FurMaterial',shells,drawCalls,triangles:entries.reduce((n,e)=>n+e.data.indices.length/3*e.layers.length,0),meshes:scene.meshes.length,materials:entries.reduce((n,e)=>n+e.layers.length,0),textures:scene.textures.length,ready:scene.isReady(),compressionSupported:false,regionalGroomingSupported:false};}
 function dispose(){if(disposed)return;disposed=true;for(const e of entries)for(const layer of e.layers)layer.material?.dispose(false,false);scene.dispose();engine.dispose();}
 return{engine,scene,camera,render,diagnostics,dispose};
}
