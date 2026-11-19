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
 for(const leg of model.legRig.legs){for(const part of ['shoulder','upper','lower','knee'])assert.equal(leg[part].visible,false);assert.equal(leg.surface.mesh.material,leg.upper.material);for(const geo of [leg.surface.geometry,leg.surface.volume.geometry])geo.addEventListener('dispose',()=>disposed++);}
 for(const held of [undefined,{index:0,x:-40,y:-30,z:3},{index:3,x:35,y:20,z:3}]){model.animate(1,true,120,1/60,1,.8,false,{heldPaw:held});for(const leg of model.legRig.legs){assert.deepEqual(leg.paw.position.toArray(),leg.solution.foot);assert.equal(leg.surface.volume.geometry.attributes.position.array,leg.surface.volume.geometry.attributes.position.array);}}
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
test('volume coat inherits drag uniforms once, obeys live roughness, and disposes without shared maps',async()=>{
 const {updateFurRoughness}=await import('../public/fur-volume.js'),model=makeMouse(0,createMouseIdentity(314159));
 const makeShader=()=>({uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'});const body=makeShader(),fur=makeShader();model.body.material.onBeforeCompile(body);model.bodyFur.mesh.material.onBeforeCompile(fur);for(const key of ['anatomyPose','anatomySpine','anatomyOffset'])assert.equal(fur.uniforms[key],body.uniforms[key]);
 for(const roughness of [.5,.94,1]){updateFurRoughness(model,roughness);assert.equal(model.bodyFur.mesh.material.roughness,roughness);for(const leg of model.legRig.legs){assert.equal(leg.surface.volume.mesh.material.roughness,roughness);assert.equal(leg.surface.mesh.material.roughness,roughness);}}
 const geometries=[model.bodyFur.geometry,...model.legRig.legs.map(l=>l.surface.volume.geometry)],materials=new Set([model.bodyFur.mesh.material,...model.legRig.legs.map(l=>l.surface.volume.mesh.material)]);let disposed=0,maps=0;for(const resource of [...geometries,...materials])resource.addEventListener('dispose',()=>disposed++);model.fur.map.addEventListener('dispose',()=>maps++);disposeMouse(model);assert.equal(disposed,7);assert.equal(maps,0);
});
test('fur sway projects in posed normal frame under combined bend, and pause keeps roots fixed',()=>{
 const model=makeMouse(0,createMouseIdentity(81)),motion={x:0,y:0,heading:0,size:1};for(let i=0;i<80;i++)model.animate(i/60,true,250,1/60,1,1,false,motion,{});
 assert.ok(Math.abs(model.articulation.head)+Math.abs(model.articulation.spine)>.1);
 const shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'};model.bodyFur.mesh.material.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.indexOf('transformed=articulateMouse(transformed);')<shader.vertexShader.indexOf('vec3 posedHairNormal=articulateMouseNormal(position,hairNormal);'));
 assert.match(shader.vertexShader,/hairDisplacement-=posedHairNormal\*min\(0.0,dot\(hairDisplacement,posedHairNormal\)\)/);
 // Evaluate the same finite-difference posed normal with a nonzero group-local sway.
 const p=[35,8,20],n=[.5,.8,.2],state=model.articulation,f=articulatePoint(...p,state),dx=articulatePoint(p[0]+.01,p[1],p[2],state),dy=articulatePoint(p[0],p[1]+.01,p[2],state),a=(dx[0]-f[0])/.01,b=(dy[0]-f[0])/.01,c=(dx[1]-f[1])/.01,d=(dy[1]-f[1])/.01,det=a*d-b*c,normal=[(d*n[0]-c*n[1])/det,(-b*n[0]+a*n[1])/det,n[2]],norm=Math.hypot(...normal);for(let i=0;i<3;i++)normal[i]/=norm;
 const displacement=[-1,-2,.1],dot=normal.reduce((sum,v,i)=>sum+v*displacement[i],0);for(let i=0;i<3;i++)displacement[i]-=normal[i]*Math.min(0,dot);assert.ok(normal.reduce((sum,v,i)=>sum+v*displacement[i],0)>-1e-10);
 const pose={...model.articulation},roots=model.legRig.legs.map(l=>Array.from(l.surface.volume.geometry.attributes.position.array));model.animate(2,true,250,0,1,1,false,motion,{});assert.deepEqual(model.articulation,pose);for(let i=0;i<4;i++)assert.deepEqual(Array.from(model.legRig.legs[i].surface.volume.geometry.attributes.position.array),roots[i]);disposeMouse(model);
});
test('embedded jaw stays attached through nibbling and both head turns at morphology extremes',async()=>{
 const {bodySection}=await import('../public/body-profile.js'),{morphologyPoint}=await import('../public/mouse-identity.js');
 for(const extreme of ['min','max']){
  const config=Object.fromEntries(Object.entries(identityControls).map(([key,value])=>[key,value[extreme]])),model=makeMouse(0,createMouseIdentity(428),config),s=bodySection(40),base=morphologyPoint(40,0,s.z-s.r*.73+1.1,model.traits),underside=morphologyPoint(40,0,s.z-s.r*.73,model.traits)[2];
  const geometry=model.jaw.geometry;let low=Infinity,high=-Infinity;
  for(let frame=0;frame<120;frame++){
   model.animate(frame/60,true,180,1/60,1,frame<60?-1:1,false,{nibble:1},config);
   const expected=articulatePoint(...base,model.articulation),p=model.jaw.position;
   assert.ok(Math.hypot(p.x-expected[0],p.y-expected[1])<1e-9);
   assert.ok(p.z+model.jaw.scale.z>underside,'jaw remains embedded in muzzle');
   assert.ok(p.z-model.jaw.scale.z>0,'jaw stays above model ground');
   assert.equal(model.jaw.geometry,geometry);low=Math.min(low,p.z);high=Math.max(high,p.z);
  }
  assert.ok(high-low>1,'nibble displacement remains active');disposeMouse(model);
 }
});
test('individual ear shapes keep fixed base attachments through motion and pause',()=>{
 const model=makeMouse(0,createMouseIdentity(71),{morphologyVariation:1});
 for(let i=0;i<2;i++)assert.equal(model.ears[i].scale.y,model.traits.ears[i].size);
 const positions=model.ears.map(e=>e.children[0].geometry.attributes.position.array.slice());
 for(let frame=0;frame<60;frame++)model.animate(frame/60,true,300,1/60,1,.5,false,{x:frame*5,y:0,heading:frame*.02,size:1},{});
 model.ears.forEach((e,i)=>{assert.deepEqual(e.children[0].geometry.attributes.position.array,positions[i]);assert.ok(e.position.toArray().every(Number.isFinite));});
 const rotations=model.ears.map(e=>e.quaternion.toArray());
 model.animate(1,true,300,0,1,.5,false,{x:300,y:0,heading:1.2,size:1},{});
 model.ears.forEach((e,i)=>assert.deepEqual(e.quaternion.toArray(),rotations[i]));
 disposeMouse(model);
});
test('individual paw sizes affect geometry and picking while held paw offsets stay in model units',async()=>{
 const {MouseScene}=await import('../public/mouse3d.js');
 const model=makeMouse(0,createMouseIdentity(72),{morphologyVariation:1});
 model.animate(0,false,0,1/60,1,0,false,{x:0,y:0,heading:0,size:1},{});
 for(let i=0;i<4;i++){
  const leg=model.legRig.legs[i];assert.equal(leg.paw.scale.x,leg.layout.pawLength);assert.equal(leg.paw.scale.y,leg.layout.pawWidth);
 }
 // Isolate a paw beyond the torso so a miss cannot fall through to a body hit.
 const paw=model.feet[2];paw.position.set(100,100,3);paw.scale.set(1.5,1.5,1.5);
 const mouse={x:300,y:300,angle:0,state:'active',hiddenUntil:0},scene={models:[model]};
 const hit=MouseScene.prototype.contactAt.call(scene,[mouse],300+112,300-100,1);
 assert.equal(hit?.part,'forepaw');assert.equal(hit.legIndex,2);assert.equal(hit.pawOffsetX,12);
 paw.scale.set(0.8,0.8,0.8);
 assert.equal(MouseScene.prototype.contactAt.call(scene,[mouse],300+112,300-100,1),null);
 disposeMouse(model);
});
test('body fur compression shares the live contact uniform and freezes on pause',()=>{
 const model=makeMouse(0,createMouseIdentity(77)),shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'};model.bodyFur.mesh.material.onBeforeCompile(shader);
 const motion={x:0,y:0,heading:0,size:1,held:true,holdReference:{part:'body',pointerId:2,localX:0,localY:5}};
 for(let i=0;i<60;i++)model.animate(i/60,false,0,1/60,1,0,false,motion,{});
 assert.ok(shader.uniforms.furContact.value.z>.8);assert.ok(model.bodyFur.geometry.attributes.hairRoot);
 const saved={...model.compression};model.animate(1,false,0,0,1,0,false,{},{});assert.deepEqual(model.compression,saved);
 for(let i=0;i<180;i++)model.animate(1+i/60,false,0,1/60,1,0,false,{},{});
 assert.equal(shader.uniforms.furContact.value.z,0);disposeMouse(model);
});
