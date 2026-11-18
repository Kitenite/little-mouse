import{test}from'node:test';
import{articulatePoint,unarticulatePoint}from'../public/anatomy.js';
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
 const scene={models:[model],resizeObserver:true,w:1024,h:768,blood:{update(){}},environment:{update(){}},lighting:{update:()=>({materialRoughness:.94})},renderer:{render(){}},scene:{add(){}},camera:{}};
 const mouse={identity,x:400,y:300,angle:.4,state:'active',hiddenUntil:0,turnRate:6,speed:250,moving:true};
 for(let frame=0;frame<60;frame++)MouseScene.prototype.render.call(scene,[mouse],config,frame/60,1/60);
 const before=[model.articulation.head,model.articulation.pelvis];mouse.hold={part:'head',active:false,startedAt:1,localX:35,localY:0};mouse.turnRate=0;mouse.speed=0;mouse.moving=false;
 for(let frame=0;frame<12;frame++)MouseScene.prototype.render.call(scene,[mouse],config,1+frame/60,1/60);
 assert.deepEqual([model.articulation.head,model.articulation.pelvis],before);disposeMouse(model);
});
test('feedback picking includes visible unclaimable mice without changing claim eligibility',async()=>{
 const {MouseScene}=await import('../public/mouse3d.js'),{beginContact,createContacts}=await import('../public/contact.js');
 const model=makeMouse(0,createMouseIdentity(91)),mouse={x:300,y:300,angle:0,state:'active',hiddenUntil:0},scene={models:[model]};
 for(const state of [{hold:{pointerId:1}},{state:'defeated'},{invulnerableUntil:10}]){
  Object.assign(mouse,{hold:undefined,state:'active',invulnerableUntil:0},state);
  const hit=MouseScene.prototype.contactAt.call(scene,[mouse],300,300,1,{includeUnclaimable:true});
  assert.equal(hit?.mouse,mouse);assert.equal(beginContact(createContacts(),mouse,hit,2,300,300,1,{},1),false);
  if(mouse.hold||mouse.state==='defeated')assert.equal(MouseScene.prototype.contactAt.call(scene,[mouse],300,300,1),null);
 }
 model.group.visible=false;assert.equal(MouseScene.prototype.contactAt.call(scene,[mouse],300,300,1,{includeUnclaimable:true}),null);disposeMouse(model);
});

test('environment samples transformed rendered paws at morphology extremes and skips disabled transforms',async()=>{
 const {GroundResponse}=await import('../public/environment3d.js'),T=await import('../public/vendor/three.module.js');
 for(const size of [.6,3]){const config={size,background:'linen',environmentStrength:1,environmentPersistence:2},model=makeMouse(0,createMouseIdentity(55),config),ground=new GroundResponse(new T.Scene());
 const mouse={x:300,y:300,state:'active',hiddenUntil:0};model.group.position.set(-100,0,0);model.group.rotation.z=.7;model.group.scale.setScalar(size);
 ground.update([model],[mouse],config,0,800,600);mouse.x+=20;model.group.position.x+=20;ground.update([model],[mouse],config,.1,800,600);
 const expected=model.feet[0].position.clone().applyMatrix4(model.group.matrixWorld);assert.ok(Math.abs(ground.feet[0]-expected.x-400)<1e-8);assert.ok(Math.abs(ground.feet[1]-(300-expected.y))<1e-8);
 model.group.updateMatrix=()=>{throw Error('disabled transform work');};ground.update([model],[mouse],{...config,environmentStrength:0},.2,800,600);assert.equal(ground.mesh.visible,false);assert.equal(ground.memory.active,0);disposeMouse(model);
 }
});

test('pending body drag, paw hold, toss, pause and grass settling use renderer integration',async()=>{
 const {GroundResponse}=await import('../public/environment3d.js'),T=await import('../public/vendor/three.module.js');
 const c={size:1,background:'grass',environmentStrength:1,environmentPersistence:2},model=makeMouse(0,createMouseIdentity(56),c),ground=new GroundResponse(new T.Scene()),mouse={x:300,y:300,state:'active',hold:{part:'body',active:false}};
 ground.update([model],[mouse],c,0,800,600);mouse.x+=20;model.group.position.x+=20;ground.update([model],[mouse],c,.1,800,600);assert.equal(ground.memory.marks[0].kind,1);
 ground.clear();mouse.hold.part='forepaw';ground.update([model],[mouse],c,.2,800,600);mouse.x+=20;model.group.position.x+=20;ground.update([model],[mouse],c,.3,800,600);assert.ok(ground.memory.marks.filter(p=>p.life).every(p=>p.kind!==1));
 ground.clear();mouse.tossUntil=2;ground.update([model],[mouse],c,.4,800,600);mouse.x+=20;ground.update([model],[mouse],c,.5,800,600);assert.equal(ground.memory.active,0);
 ground.memory.add(200,200,1,5,.2,2);ground.update([],[],c,.5,800,600);const before=Array.from(ground.shape.array);ground.update([],[],c,.5,800,600);assert.deepEqual(Array.from(ground.shape.array),before);ground.update([],[],c,.65,800,600);assert.ok(before.some((v,i)=>Math.abs(v-ground.shape.array[i])>.01));disposeMouse(model);
});

test('region materials preserve UV attachment, eye gloss and shared maps through disposal',()=>{
 const identity=createMouseIdentity(314159),a=makeMouse(0,identity),b=makeMouse(0,identity);
 assert.notEqual(a.body.material.map,a.body.material.bumpMap);
 assert.equal(a.body.material.bumpMap,b.body.material.bumpMap);
 assert.notEqual(a.tail.material.map,a.feet[0].children[0].material.map);
 const uv=Array.from(a.body.geometry.attributes.uv.array),tailUV=Array.from(a.tail.geometry.attributes.uv.array);
 for(let i=0;i<80;i++)a.animate(i/60,true,220,1/60,1,.8,false,{tailHold:{x:-70,y:20,fraction:.7}});
 assert.deepEqual(Array.from(a.body.geometry.attributes.uv.array),uv);
 assert.deepEqual(Array.from(a.tail.geometry.attributes.uv.array),tailUV);
 const eyes=[];a.group.traverse(node=>{if(node.material?.isMeshPhysicalMaterial)eyes.push(node.material);});
 assert.equal(eyes.length,2);assert.ok(eyes.every(m=>m.roughness===.075&&!m.map));
 let disposed=0;a.body.material.bumpMap.addEventListener('dispose',()=>disposed++);disposeMouse(a);assert.equal(disposed,0);disposeMouse(b);assert.equal(disposed,0);
});

test('regional extrema, both turn directions, pause and every hold retain coherent rig roots',()=>{
 for(const extreme of ['min','max'])for(const turn of [-2,2]){
  const config={...Object.fromEntries(Object.entries(identityControls).map(([k,v])=>[k,v[extreme]])),spineBendAmount:1.5};
  const model=makeMouse(0,createMouseIdentity(314159),config),geometry=model.body.geometry,uv=geometry.attributes.uv.array.slice();
  for(let i=0;i<80;i++)model.animate(i/60,true,180,1/60,1,turn,false,{},config);
  const positions=geometry.attributes.position;
  for(let v=0;v<positions.count;v+=7){const x=positions.getX(v),y=positions.getY(v),p=articulatePoint(x,y,positions.getZ(v),model.articulation),u=unarticulatePoint(p[0],p[1],model.articulation);assert.ok(Math.hypot(u[0]-x,u[1]-y)<1e-5,'inverse on extreme rendered surface');}
  const before={...model.articulation};model.animate(9,true,180,0,1,-turn,false,{},config);assert.deepEqual(model.articulation,before);
  for(const motion of [{held:true},{held:true,holdReference:{part:'head'}},{held:true,holdReference:{part:'body'}},{heldPaw:{index:0,x:20,y:12,z:2}},{tailHold:{x:-65,y:12,fraction:.65}}]){
   model.animate(10,true,100,.05,1,-turn,false,motion,config);assert.deepEqual(model.articulation,before);
   assert.equal(model.body.geometry,geometry);assert.deepEqual(geometry.attributes.uv.array,uv);
   for(const leg of model.legRig.legs){const root=articulatePoint(...leg.layout.anchor,model.articulation);assert.deepEqual(leg.shoulder.position.toArray(),root);assert.ok(leg.solution.foot.every(Number.isFinite));}
   assert.ok([...model.tail.geometry.attributes.position.array].every(Number.isFinite));
  }
  disposeMouse(model);
 }
});
test('spine-bent tail pins the selected rendered material ring during dragging',()=>{
 const model=makeMouse(0,createMouseIdentity(71));
 for(const turn of [-1,1]){
  for(let i=0;i<60;i++)model.animate(i/60,true,180,1/60,1,turn,false,{},{});
  for(const ring of [6,19,31,47])for(const drag of [-1,1]){
   const fraction=ring/48,t=model.traits,point=articulatePoint(-36*t.bodyLength-87*fraction*.93*t.tailLength,drag*87*fraction*.12*t.tailLength,5,model.articulation);
   for(let i=0;i<12;i++)model.animate(2+i/60,false,0,1/60,1,0,false,{x:0,y:0,heading:0,size:1,tailHold:{x:point[0],y:point[1],fraction}},{});
   const a=model.tail.geometry.attributes.position.array,k=ring*27;
   assert.ok(Math.hypot((a[k]+a[k+12])/2-point[0],(a[k+1]+a[k+13])/2-point[1])<.0001);
  }
 }
 disposeMouse(model);
});
test('continuous limb surfaces hide internal joints and dispose their bounded buffers',()=>{
 const model=makeMouse(0,createMouseIdentity(314159),{armHairiness:1.5,armWidth:1.35});let disposed=0;
 for(const leg of model.legRig.legs){for(const part of ['shoulder','upper','lower','knee'])assert.equal(leg[part].visible,false);assert.equal(leg.surface.mesh.material,leg.upper.material);for(const geo of [leg.surface.geometry,leg.surface.hair.geometry])geo.addEventListener('dispose',()=>disposed++);}
 for(const held of [undefined,{index:0,x:-40,y:-30,z:3},{index:3,x:35,y:20,z:3}]){model.animate(1,true,120,1/60,1,.8,false,{heldPaw:held});for(const leg of model.legRig.legs){assert.deepEqual(leg.paw.position.toArray(),leg.solution.foot);assert.equal(leg.surface.hair.data,leg.surface.hair.geometry.attributes.position.array);}}
 disposeMouse(model);assert.equal(disposed,8);
});
test('active drag yields free regions while reachable all-four paw and tail pins stay fixed',()=>{
 for(const index of [0,1,2,3]){
  const model=makeMouse(0,createMouseIdentity(81)),leg=model.legRig.legs[index];
  const heldPaw={index,x:leg.layout.anchor[0]+4,y:leg.layout.anchor[1]+3,z:3},holdReference={part:index<2?'hindpaw':'forepaw',active:true};
  for(let i=0;i<80;i++){model.animate(i/60,false,0,1/60,1,0,false,{x:0,y:i<40?i*5:(80-i)*5,heading:0,size:1,held:true,holdReference,heldPaw},{});assert.ok(Math.hypot(leg.paw.position.x-heldPaw.x,leg.paw.position.y-heldPaw.y,leg.paw.position.z-3)<1e-7);for(const l of model.legRig.legs){assert.deepEqual(l.shoulder.position.toArray(),l.anchor);assert.ok(l.paw.position.z>=1);}}
  assert.ok(Math.hypot(...model.dragPose.values)>.1);disposeMouse(model);
 }
 for(const fraction of [.125,.5,.73,1]){
  const model=makeMouse(0,createMouseIdentity(81)),t=model.traits,holdReference={part:'tail',active:true},tailHold={x:-36*t.bodyLength-87*fraction*.7*t.tailLength,y:0,fraction};
  for(let i=0;i<60;i++)model.animate(i/60,false,0,1/60,1,0,false,{x:0,y:i*3,heading:0,size:1,held:true,holdReference,tailHold},{});
  const p=model.tail.geometry.attributes.position.array,ring=fraction*48,lo=Math.floor(ring),hi=Math.ceil(ring),u=ring-lo;const center=(r,axis)=>(p[r*27+axis]+p[r*27+12+axis])/2;
  // Arbitrary material fractions between rendered rings approximate the curve.
  assert.ok(Math.hypot(center(lo,0)*(1-u)+center(hi,0)*u-tailHold.x,center(lo,1)*(1-u)+center(hi,1)*u-tailHold.y)<.25);
  disposeMouse(model);
 }
});
