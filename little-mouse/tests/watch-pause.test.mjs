import {test} from 'node:test';
import assert from 'node:assert/strict';
import {watchPausePose,forceIdleActivity,IDLE_ACTIVITIES} from '../public/idle-animation.js';
import {createMouseIdentity} from '../public/mouse-identity.js';
const mouse=()=>({state:'active',moving:false,speed:0,hunt:{phase:'watch',fear:0,arrivedAt:2},identity:createMouseIdentity(42)});
test('watch samples are bounded, asymmetric, deterministic and read-only',()=>{
 const m=mouse(),before=structuredClone(m),heads=new Set();
 const random=Math.random;Math.random=()=>{throw Error('unexpected random draw');};
 try{for(let n=0;n<20000;n++){const t=2+n*.013,p=watchPausePose(m,t);assert.deepEqual(p,watchPausePose(m,t));assert.ok(Math.abs(p.head)<=.057);assert.ok(Math.abs(p.earLeft)<=.045);assert.ok(Math.abs(p.earRight)<=.035);assert.ok(p.sniff>=0&&p.sniff<=1);heads.add(p.head);}assert.ok(heads.size>100);assert.notEqual(watchPausePose(m,3).earLeft,watchPausePose(m,3).earRight);assert.deepEqual(m,before);}finally{Math.random=random;}
 assert.equal(watchPausePose(m,NaN),null);assert.equal(watchPausePose(m,1),null);
});
test('watch yields immediately to claims, injury, toss, movement, danger and existing actions',()=>{
 for(const change of [{hold:{active:false}},{hold:{active:true}},{injuredUntil:10},{startledUntil:10},{tossUntil:10},{moving:true},{speed:20},{turnRate:1},{state:'hurt'},{state:'away'},{state:'defeated'},{entering:true},{leaving:true},{hunt:{phase:'watch',fear:.5}},{hunt:{phase:'creep'}},{nibblingUntil:10}])assert.equal(watchPausePose(Object.assign(mouse(),change),3),null);
 for(const kind of IDLE_ACTIVITIES){const m=mouse();assert.ok(forceIdleActivity(m,kind,2));assert.equal(watchPausePose(m,2.5),null);}
});
const context={ellipse(){},fill(){},bezierCurveTo(){},save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},quadraticCurveTo(){},drawImage(){},createRadialGradient(){return{addColorStop(){}};}};
globalThis.document={createElement(){return{width:0,height:0,getContext:()=>context};},createElementNS(){return{addEventListener(){},removeEventListener(){},set src(value){}};}};
const {makeMouse,disposeMouse,MouseScene}=await import('../public/mouse3d.js');
const {identitySettings}=await import('../public/mouse-identity.js');
test('renderer keeps watch feet planted, geometry stable and simulation pause frozen',()=>{
 const data=Object.assign(mouse(),{x:300,y:300,angle:0,hiddenUntil:0}),config={size:1},model=makeMouse(0,data.identity,config);model.settingsKey=JSON.stringify(identitySettings(config));
 const scene={models:[model],resizeObserver:true,w:800,h:600,blood:{update(){}},environment:{update(){}},lighting:{update:()=>({materialRoughness:.94})},renderer:{render(){}},scene:{add(){}},camera:{}};
 const render=(t,dt=1/60)=>MouseScene.prototype.render.call(scene,[data],config,t,dt);
 const feet=()=>model.feet.map(f=>f.position.toArray());
 render(2);const planted=feet(),geometry=model.body.geometry,heads=new Set();
 for(let i=1;i<300;i++){render(2+i/60);assert.deepEqual(feet(),planted);assert.equal(model.body.geometry,geometry);heads.add(model.articulation.head);assert.equal(data.x,300);assert.equal(data.speed,0);}
 assert.ok(heads.size>200);const head=model.articulation.head,ears=model.ears.map(e=>e.rotation.toArray());render(2+299/60,0);assert.equal(model.articulation.head,head);assert.deepEqual(model.ears.map(e=>e.rotation.toArray()),ears);
 data.hold={active:false,part:'head',localX:35,localY:0};render(8);assert.equal(model.articulation.head,head);feet().flat().forEach((v,i)=>assert.ok(Math.abs(v-planted.flat()[i])<1e-9));
 delete data.hold;data.injuredUntil=20;render(9);assert.equal(model.watchHead,0);assert.deepEqual(model.watchEars,[0,0]);
 data.injuredUntil=0;data.tossUntil=20;render(10);assert.equal(model.watchHead,0);
 disposeMouse(model);
});
