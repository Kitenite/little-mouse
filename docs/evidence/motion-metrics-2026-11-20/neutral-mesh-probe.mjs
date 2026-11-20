// Independent neutral geometry comparison: project/clamp actual mesh triangles.
// No GPU, live shader articulation or rendered pixels are evaluated.
import assert from 'node:assert/strict';
import {createBodyVisibility} from '../../../little-mouse/scripts/behavior-visibility.mjs';
import * as identity from '../../../little-mouse/public/mouse-identity.js';
import * as profile from '../../../little-mouse/public/body-profile.js';
import {settingsDefaults} from '../../../little-mouse/public/settings.js';
const context={ellipse(){},fill(){},bezierCurveTo(){},save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},quadraticCurveTo(){},drawImage(){},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};},createElementNS(){return{addEventListener(){},removeEventListener(){},set src(value){}};}};
const {makeMouse,disposeMouse}=await import('../../../little-mouse/public/mouse3d.js');
const visibility=createBodyVisibility({...identity,...profile});
function area(points){let s=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];s+=a[0]*b[1]-a[1]*b[0];}return Math.abs(s)/2;}
function clip(points,axis,limit,inside){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=inside(a[axis],limit),bi=inside(b[axis],limit);if(ai)out.push(a);if(ai!==bi){const t=(limit-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
const rows=[];
for(const extreme of ['default','min','max']){
 const config={...settingsDefaults,...(extreme==='default'?{}:Object.fromEntries(Object.entries(identity.identityControls).map(([k,v])=>[k,v[extreme]])))};
 const mouse={identity:identity.createMouseIdentity(39),angle:0,x:0,y:0},model=makeMouse(0,mouse.identity,config),geometry=model.body.geometry,index=geometry.index.array,positions=geometry.attributes.position;
 for(const [w,h]of [[1024,768],[390,844]])for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI])for(const [x,y]of [[w/2,h/2],[-10,h/2],[w+10,h/2],[w/2,-10],[w/2,h+10],[-30,-30]]){
  Object.assign(mouse,{x,y,angle});const c=Math.cos(angle),s=Math.sin(angle),projected=[];
  for(let i=0;i<positions.count;i++)projected.push([x+config.size*(positions.getX(i)*c+positions.getY(i)*s),y+config.size*(positions.getX(i)*s-positions.getY(i)*c)]);
  let full=0,visible=0;
  for(let i=0;i<index.length;i+=3){let p=[projected[index[i]],projected[index[i+1]],projected[index[i+2]]];full+=area(p);for(const [axis,limit,inside]of [[0,0,(a,b)=>a>=b],[0,w,(a,b)=>a<=b],[1,0,(a,b)=>a>=b],[1,h,(a,b)=>a<=b]])p=clip(p,axis,limit,inside);visible+=area(p);}
  // Closed body surface projects twice, once from each side.
  full/=2;visible/=2;const estimate=visibility(mouse,config,w,h),fraction=visible/full;
  assert.equal(estimate.valid,true);assert.ok(Math.abs(estimate.fraction-fraction)<1e-6);
  assert.ok(Math.abs(estimate.bodyArea/full-1)<1e-6);
  rows.push({extreme,w,h,angle,x,y,estimatedFraction:estimate.fraction,meshFraction:fraction});
 }
 disposeMouse(model);
}
console.log(JSON.stringify({kind:'CPU neutral core mesh triangle projection; not rendered visibility',cases:rows.length,maxFractionError:Math.max(...rows.map(r=>Math.abs(r.estimatedFraction-r.meshFraction))),rows}));
