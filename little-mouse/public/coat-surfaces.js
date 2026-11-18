// Region detail is generated once, in rest UV space, never from animated world positions.
export const SURFACE_SIZE=256;
export const SURFACE_REGIONS=Object.freeze(['body','limb','ear','tail','nose','paw']);
export const SURFACE_GPU_BYTES=10*SURFACE_SIZE**2*4*4/3;
const randomFor=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function paintSurface(x,region){
 if(!SURFACE_REGIONS.includes(region))throw new RangeError('Unknown mouse surface');
 const random=randomFor(817+SURFACE_REGIONS.indexOf(region)),size=SURFACE_SIZE;
 x.fillStyle=region==='ear'?'#ecdcd8':'#dedede';x.fillRect(0,0,size,size);
 const stroke=(u,v,du,dv,width,color)=>{x.strokeStyle=color;x.lineWidth=width;x.beginPath();x.moveTo(u,v);x.lineTo(u+du,v+dv);x.stroke();};
 if(region==='body'||region==='limb'){
  // Body v=1 is nose (canvas top); shorter, softer strokes at the muzzle.
  for(let i=0;i<12500;i++){
   const u=random()*size,v=random()*size,fine=region==='limb'||v<64;
   const length=(fine?1.1:3.5)+random()*(fine?2:6),lean=Math.sin(u/size*Math.PI*2)*length*.22;
   stroke(u,v,lean,length,.35+random()*.35,`rgba(68,68,68,${fine?.13:.19})`);
   if(i%4===0)stroke(u+.6,v,lean,length*.72,.4,'rgba(255,255,255,.36)');
  }
 }else{
  for(let i=0;i<6500;i++){
   const u=random()*size,v=random()*size,g=110+Math.floor(random()*100);
   x.fillStyle=`rgba(${g},${g},${g},${region==='nose'?.23:.1})`;x.fillRect(u,v,region==='nose'?1.5:.7,.7);
  }
  if(region==='tail'){
   for(let v=0;v<size;v+=8){stroke(0,v,size,0,.8,'rgba(92,65,60,.15)');
    for(let u=0;u<size;u+=13)stroke(u+(v%16),v,1,7,.45,'rgba(98,72,65,.16)');}
   for(let i=0;i<160;i++)stroke(random()*size,random()*size,.4,2+random()*4,.4,'rgba(76,65,58,.36)');
  }else if(region==='ear'){
   const g=x.createRadialGradient(128,128,50,128,128,128);g.addColorStop(0,'#e8c9c000');g.addColorStop(.78,'#b59e9310');g.addColorStop(1,'#9b857555');x.fillStyle=g;x.fillRect(0,0,size,size);
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;stroke(128+Math.cos(a)*70,128+Math.sin(a)*70,Math.cos(a)*38,Math.sin(a)*38,.55,'rgba(158,99,96,.12)');}
   for(let i=0;i<380;i++){const a=random()*Math.PI*2,r=108+random()*19;stroke(128+Math.cos(a)*r,128+Math.sin(a)*r,Math.cos(a)*2,Math.sin(a)*2,.45,'rgba(106,91,78,.3)');}
  }else if(region==='paw'){
   for(let v=30;v<240;v+=42)stroke(20,v,216,5,.7,'rgba(124,87,80,.18)');
  }
 }
}
/** One finite cache per renderer module. Color/seed/control values cannot increase it. */
export function createSurfaceCache(T,canvasFactory=()=>document.createElement('canvas')){
 const maps=new Map();return{
  get(region,color=false){if(!SURFACE_REGIONS.includes(region)||(color&&['body','limb'].includes(region)))throw new RangeError('Unknown mouse surface');
   const key=region+(color?'-color':'-relief');
   if(!maps.has(key)){const canvas=canvasFactory();canvas.width=canvas.height=SURFACE_SIZE;paintSurface(canvas.getContext('2d'),region);const map=new T.CanvasTexture(canvas);map.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;map.userData.mouseSurface=true;maps.set(key,map);}return maps.get(key);},
  get size(){return maps.size;},
 };
}
/** Call once during makeMouse; all clones remain owned/disposed by the model. Eyes untouched. */
export function applyCoatSurfaces(T,cache,{bodyMaterial,fur,ears,legRig,tail,nose,traits}){
 bodyMaterial.bumpMap=cache.get('body');bodyMaterial.bumpScale=.17;
 const limb=fur.clone();limb.bumpMap=cache.get('limb');limb.bumpScale=.08;
 const skin=(region,roughness,bumpScale)=>new T.MeshStandardMaterial({color:traits.coat.skin,map:cache.get(region,true),bumpMap:cache.get(region),bumpScale,roughness});
 const replacedSkin=tail.material;
 const paws=skin('paw',.83,.065);
 for(const leg of legRig.legs){if(leg.surface)leg.surface.mesh.material=limb;for(const part of ['upper','lower','shoulder','knee'])leg[part].material=limb;leg.paw.traverse(node=>{if(node.isMesh)node.material=paws;});}
 for(const ear of ears)ear.traverse(node=>{if(node.isMesh){node.material.map?.dispose();node.material.map=cache.get('ear',true);node.material.bumpMap=cache.get('ear');node.material.bumpScale=.06;node.material.color.set(traits.coat.skin);node.material.roughness=.86;}});
 tail.material=skin('tail',.88,.09);tail.material.map.repeat.set(1,3);tail.material.bumpMap.repeat.set(1,3);
 nose.material=skin('nose',.46,.045);replacedSkin.dispose();
}
