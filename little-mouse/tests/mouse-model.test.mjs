import{test}from'node:test';
import{articulatePoint}from'../public/anatomy.js';
import assert from'node:assert/strict';
import{createMouseIdentity,identityControls,COATS}from'../public/mouse-identity.js';
// The model and resource lifecycle do not need a WebGL context. Minimal canvas
// fixtures keep these checks deterministic; browser QA verifies actual pixels.
const context={ellipse(){},fill(){},bezierCurveTo(){},save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},quadraticCurveTo(){},drawImage(){},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};},createElementNS(){return{addEventListener(){},removeEventListener(){},set src(value){}};}};
const {makeMouse,disposeMouse}=await import('../public/mouse3d.js');
test('distinct bodies own materials while named coat textures remain bounded',()=>{
 const maps=new Set(),models=[];
 for(let i=0;i<24;i++){
  const model=makeMouse(i,createMouseIdentity(i+1));models.push(model);maps.add(model.fur.map);
  assert.notEqual(model.fur,models[0]===model?null:models[0].fur);
  model.animate(1,true,180,1/60,2.2,.5,false,{x:100,y:100,heading:0,size:2.2},{});
  for(const part of [model.body,model.tail])assert.ok([...part.geometry.attributes.position.array].every(Number.isFinite));
 }
 assert.ok(maps.size<=COATS.length);
 for(const model of models){let geometryDisposed=0,materialDisposed=0;model.body.geometry.addEventListener('dispose',()=>geometryDisposed++);model.fur.addEventListener('dispose',()=>materialDisposed++);disposeMouse(model);assert.equal(geometryDisposed,1);assert.equal(materialDisposed,1);}
});
test('extreme anatomy retains attached paws, bounded tail geometry and live grab response',()=>{
 for(const extreme of ['min','max']){
  const config=Object.fromEntries(Object.entries(identityControls).map(([key,value])=>[key,value[extreme]])),model=makeMouse(0,createMouseIdentity(61),config),traits=model.traits;
  for(let frame=0;frame<30;frame++)model.animate(frame/60,true,300,1/60,2.2,.8,false,{x:frame*4,y:100,heading:frame*.03,size:2.2,tailHold:frame>15?{x:-80,y:30,fraction:.7}:null},config);
  const positions=model.tail.geometry.attributes.position.array;
  assert.ok([...positions].every(Number.isFinite));
  // Root tube center stays at the rump under every tail length and body length.
  const rootX=(positions[0]+positions[12])*.5;
  assert.ok(Math.abs(rootX-articulatePoint(-36*traits.bodyLength,0,5,model.articulation)[0])<1e-4);
  for(const paw of model.feet)assert.ok(paw.position.toArray().every(Number.isFinite));
  disposeMouse(model);
 }
});
test('turning head, pelvis, limbs and grabbed-tail picking share one articulated frame',async()=>{
 const {MouseScene}=await import('../public/mouse3d.js'),{morphologyPoint}=await import('../public/mouse-identity.js');
 const model=makeMouse(0,createMouseIdentity(91)),mouse={x:300,y:300,angle:0,state:'active'},scene={models:[model]};
 for(let frame=0;frame<100;frame++)model.animate(frame/60,true,240,1/60,1,1,false,{x:frame*3,y:100,heading:0,size:1},{});
 for(const leg of model.legRig.legs){const expected=articulatePoint(...leg.layout.anchor,model.articulation);assert.ok(Math.hypot(...leg.anchor.map((v,i)=>v-expected[i]))<1e-9);assert.deepEqual(leg.shoulder.position.toArray(),leg.anchor);const length=Math.hypot(...leg.solution.joint.map((v,i)=>v-leg.anchor[i]));assert.ok(Math.abs(length-leg.layout.upper)<1e-8);}
 const head=articulatePoint(...morphologyPoint(43,0,10,model.traits),model.articulation),hit=MouseScene.prototype.contactAt.call(scene,[mouse],300+head[0],300-head[1],1);assert.equal(hit?.part,'head');assert.ok(Math.abs(hit.localX-head[0])<1e-6);
 const array=model.tail.geometry.attributes.position.array,k=36*27,tailX=(array[k]+array[k+12])*.5,tailY=(array[k+1]+array[k+13])*.5,tailHit=MouseScene.prototype.contactAt.call(scene,[mouse],300+tailX,300-tailY,1);assert.equal(tailHit?.part,'tail');const expectedRoot=articulatePoint(-36*model.traits.bodyLength,0,5,model.articulation);assert.ok(Math.abs(tailHit.tailRootX-expectedRoot[0])<1e-6);assert.ok(Math.abs(tailHit.tailRootY-expectedRoot[1])<1e-6);
 let depthDisposed=0;model.body.customDepthMaterial.addEventListener('dispose',()=>depthDisposed++);disposeMouse(model);assert.equal(depthDisposed,1);
});
test('pending head claims freeze the rendered anatomy before the hold threshold',async()=>{
 const {MouseScene}=await import('../public/mouse3d.js'),{identitySettings}=await import('../public/mouse-identity.js');const config={size:2.2,brightness:1},identity=createMouseIdentity(39),model=makeMouse(0,identity,config);model.settingsKey=JSON.stringify(identitySettings(config));
 const scene={models:[model],resizeObserver:true,w:1024,h:768,blood:{update(){}},lighting:{update:()=>({materialRoughness:.94})},renderer:{render(){}},scene:{add(){}},camera:{}};
 const mouse={identity,x:400,y:300,angle:.4,state:'active',hiddenUntil:0,turnRate:6,speed:250,moving:true};
 for(let frame=0;frame<60;frame++)MouseScene.prototype.render.call(scene,[mouse],config,frame/60,1/60);
 const before=[model.articulation.head,model.articulation.pelvis];mouse.hold={part:'head',active:false,startedAt:1,localX:35,localY:0};mouse.turnRate=0;mouse.speed=0;mouse.moving=false;
 for(let frame=0;frame<12;frame++)MouseScene.prototype.render.call(scene,[mouse],config,1+frame/60,1/60);
 assert.deepEqual([model.articulation.head,model.articulation.pelvis],before);disposeMouse(model);
});
