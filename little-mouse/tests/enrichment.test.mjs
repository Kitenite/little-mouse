import{test}from'node:test';
import assert from'node:assert/strict';
import{updateHunt,createHuntDirector,rememberTouch,clearHunt}from'../public/enrichment.js';
import{cleanSettings,defaults}from'../worker/api.js';
import{upgradeSettings}from'../public/physics.js';
test('API validates hunt controls and migrates to the teasing defaults',()=>{
 assert.deepEqual(cleanSettings({mode:'hunt',huntTempo:.5}),{mode:'hunt',huntTempo:.5});
 for(const huntTempo of [0,2.1,NaN,Infinity,'1',null])assert.throws(()=>cleanSettings({huntTempo}));
 const settings=upgradeSettings(defaults);
 for(const [key,value] of Object.entries({behaviorVersion:3,audioVersion:1,count:1,speed:1.2,mode:'hunt',hide:3,size:2.2,sound:true}))assert.equal(settings[key],value,key);
});

// Exercise the real game entry point with a minimal DOM and network, without WebGL.
import{readFile}from'node:fs/promises';
import vm from'node:vm';
import{huntDefaults}from'../public/enrichment.js';
import{settingsDefaults,settingsSchema}from'../public/settings.js';
import{updateIdleBehavior}from'../public/idle-animation.js';
import{PreyAudio,audioDefaults}from'../public/audio.js';
import{stepMice,flee}from'../public/physics.js';
import{sendOffscreen,pressMouse,updateLifecycle}from'../public/behavior.js';
import * as contact from '../public/contact.js';
import{createOwnerGesture}from'../public/owner-gesture.js';
async function gameHarness(failure,surface='web'){
 const elements=new Map(),storage=new Map([['mouse-room',JSON.stringify('0123456789abcdef')],['mouse-command',JSON.stringify({steer:'old'})]]),calls=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{setProperty(){}},dataset:{},options:[],listeners:{},addEventListener(name,fn){const old=this.listeners[name];this.listeners[name]=old?e=>{old(e);fn(e);}:fn;},setAttribute(){},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:800,height:600};},getContext(){return{};},querySelector(){return{removeAttribute(){}};}});return elements.get(id);};
 let response=failure;
 const context=vm.createContext({console,AbortSignal,Date,Math,JSON,Number,performance,createOwnerGesture,...contact,settingsDefaults,updateIdleBehavior,applyBackground(){},createSettingsControls(root,{getSettings}){return{setSoundStatus(){},sync(){element('huntControls').hidden=getSettings().mode!=='hunt';}};},PreyAudio,audioDefaults,stepMice,flee,sendOffscreen,pressMouse,updateLifecycle,Option:class{},huntDefaults,updateHunt,createHuntDirector,rememberTouch,clearHunt,upgradeSettings,radius:()=>40,
 document:{documentElement:{dataset:{surface}},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},
 window:{addEventListener(){}},navigator:{},location:{origin:'http://local'},
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 MouseScene:class{w=800;h=600;resize(){}clearEffects(){}render(){}splatter(){}},setInterval(){},requestAnimationFrame(){},
 fetch:async(path,options)=>{calls.push([path,options]);if(path==='/api/rooms')return Response.json({code:'fedcba9876543210'});if(path==='/api/version')return Response.json({version:'v1'});if(response==='offline')throw TypeError('Failed to fetch');if(response)return new Response('not JSON',{status:response});return Response.json({version:'v1',revision:0,settings:upgradeSettings({...defaults}),command:{}});}
 });
 const source=(await readFile(new URL('../public/game.js',import.meta.url),'utf8')).replace(/^import.*;\n/gm,'');
 vm.runInContext(source+'\nglobalThis.testGame={poll,sync,sendSettings,flushSettings,config,start,pause,frame,applyCommand,contacts,get catches(){return catches},get mice(){return mice},get elapsed(){return elapsed},get room(){return room},get revision(){return revision},get commandSeen(){return commandSeen}};',context);
 await new Promise(resolve=>setImmediate(resolve));
 return{context,e:element,storage,calls,recover(){response=0;}};
}
test('missing saved room clears pairing and allows creating a fresh room',async()=>{
 const h=await gameHarness(404);assert.equal(h.context.testGame.room,null);assert.equal(JSON.parse(h.storage.get('mouse-room')),null);assert.equal(h.storage.get('mouse-command'),'{}');
 assert.equal(h.e('pairCode').textContent,'');assert.equal(h.e('pair').textContent,'Create pairing code');assert.match(h.e('networkStatus').textContent,/expired/);assert.equal(h.e('connection').textContent,'Not paired');assert.equal(h.context.testGame.revision,-1);
 h.recover();await h.e('pair').listeners.click();assert.equal(h.context.testGame.room,'fedcba9876543210');assert.equal(h.e('pair').textContent,'Copy companion link');assert.ok(h.calls.some(([path,options])=>path==='/api/rooms'&&options.method==='POST'));
});
test('offline and server failures preserve the saved pairing and recover on retry',async()=>{
 for(const failure of ['offline',503]){const h=await gameHarness(failure);assert.equal(h.context.testGame.room,'0123456789abcdef');assert.equal(JSON.parse(h.storage.get('mouse-room')),'0123456789abcdef');assert.match(h.e('networkStatus').textContent,/Reconnecting/);h.recover();await h.context.testGame.poll();assert.equal(h.e('connection').textContent,'Companion ready');}
});
test('game Hunt controls default to visible and follow mode changes',async()=>{
 const h=await gameHarness('offline');assert.equal(h.context.testGame.config.mode,'hunt');assert.equal(h.e('huntControls').hidden,false);
 h.context.testGame.config.mode='hunt';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,false);
 h.context.testGame.config.mode='manual';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,true);
});
test('companion delegates its settings to the shared controls',async()=>{
 const source=await readFile(new URL('../public/companion.js',import.meta.url),'utf8');
 assert.match(source,/createSettingsControls/);assert.match(source,/function sync\(\)\{controls.sync\(\);\}/);
});
test('iPad query chooses its surface before stylesheet loads; desktop stays web',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const script=html.match(/<script>(.*?)<\/script>/s)[1];
 assert.ok(html.indexOf('<script>')<html.indexOf('rel="stylesheet"'));
 assert.match(html,/viewport-fit=cover/);
 for(const [search,expected] of [['?surface=ipad','ipad'],['?surface=ipad&other=1','ipad'],['','web'],['?surface=other','web']]){
 const context=vm.createContext({document:{documentElement:{dataset:{}}},location:{search},URLSearchParams});vm.runInContext(script,context);assert.equal(context.document.documentElement.dataset.surface,expected);
 }
});
test('iPad retains local start, pause, pairing recovery and scroll lock',async()=>{
 const h=await gameHarness(404,'ipad');assert.equal(h.e('pair').textContent,'Create pairing code');
 h.context.testGame.start();assert.equal(h.e('home').hidden,true);assert.equal(h.e('game').hidden,false);assert.equal(h.context.document.documentElement.dataset.playing,'true');
 h.context.testGame.pause();assert.equal(h.e('home').hidden,false);assert.equal(h.e('game').hidden,true);assert.equal(h.context.document.documentElement.dataset.playing,'false');
 let prevented=false;h.e('game').listeners.gesturestart({preventDefault(){prevented=true;}});assert.equal(prevented,true);
});
test('tablet settings remain locally available and desktop settings open automatically',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const panel=html.match(/<details id="tabletSettings">(.*?)<\/details>/s)[1];
 assert.ok(panel.includes('id="settingsControls"'));
 for(const id of ['speed','count','size','hide','sound','background','backgroundColor','mode','huntTempo','variation'])assert.ok(settingsSchema[id],id+' remains available locally');
 assert.ok(!panel.includes('id="start"'));
 const desktop=await gameHarness('offline');assert.equal(desktop.e('tabletSettings').open,true);
 const tablet=await gameHarness('offline','ipad');assert.notEqual(tablet.e('tabletSettings').open,true);assert.equal(typeof tablet.e('tabletSettings').listeners.toggle,'function');
});


test('pausing the game freezes simulation and resume does not spend wall time',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;
 g.start();for(let now=1000;now<=2000;now+=1000/60)g.frame(now);
 g.pause();const elapsed=g.elapsed,snapshot=JSON.stringify(g.mice);
 for(let now=3000;now<=13000;now+=1000/60)g.frame(now);
 assert.equal(g.elapsed,elapsed);assert.equal(JSON.stringify(g.mice),snapshot);
 g.start(false);g.frame(13000+1000/60);assert.ok(g.elapsed-elapsed<.06);
});

test('owner steer and recall release hidden hunt mice and retain control',async()=>{
 for(const action of ['steer','recall']){
  const h=await gameHarness('offline'),g=h.context.testGame;g.start();g.frame(1000);g.frame(1017);
  assert.equal(g.mice[0].hunt.phase,'hidden');
  g.applyCommand({action,nonce:action,x:.8,y:.3},action);
  const m=g.mice[0],target=[m.targetX,m.targetY];assert.equal(m.hunt,undefined);assert.equal(m.state,'active');assert.equal(m.hiddenUntil,0);assert.ok(m.restUntil<=g.elapsed);
  for(let now=1034;now<1500;now+=17)g.frame(now);
  assert.equal(m.hunt,undefined);assert.deepEqual([m.targetX,m.targetY],target);
 }
});


test('pending local settings survive stale polling and later yield to acknowledged remote changes',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;let remote={...upgradeSettings(settingsDefaults),speed:1.2},revision=0,resolveWrite;
 h.context.fetch=async(path,options)=>{if(path.endsWith('/settings'))return new Promise(resolve=>{resolveWrite=()=>resolve(Response.json({ok:true}));});if(path.endsWith('/telemetry'))return Response.json({ok:true});return Response.json({version:'v1',revision,settings:remote,command:{}});};
 g.config.speed=2;const saving=g.sendSettings({speed:2});await g.poll();assert.equal(g.config.speed,2,'stale response cannot erase an in-flight slider change');resolveWrite();await saving;
 remote={...remote,speed:2};revision++;await g.poll();assert.equal(g.config.speed,2);
 remote={...remote,speed:.8};revision++;await g.poll();assert.equal(g.config.speed,.8,'after server acknowledgement, companion changes take effect');
});

test('real pointer handlers defer hit until release, cancel cleanly and retain stationary missed paws',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;Object.assign(g.config,{mode:'manual',sound:false,harmlessChance:1});g.start();const m=g.mice[0];Object.assign(m,{x:400,y:300,angle:0});
 const event=(id,x=400,y=300)=>({pointerId:id,clientX:x,clientY:y,width:22,height:22,preventDefault(){}}),board=h.e('board');
 board.listeners.pointerdown(event(1));assert.equal(g.catches,0);assert.ok(m.hold);board.listeners.pointerup(event(1));assert.equal(g.catches,1);board.listeners.pointerup(event(1));assert.equal(g.catches,1);
 m.invulnerableUntil=0;board.listeners.pointerdown(event(2));board.listeners.pointercancel(event(2));assert.equal(g.catches,1);assert.equal(m.hold,undefined);
 board.listeners.pointerdown(event(3,40,500));assert.equal(g.contacts.paws.size,1);g.frame(1000);g.frame(1033);assert.equal(g.contacts.paws.size,1);g.pause();assert.equal(g.contacts.paws.size,0);
});

test('legacy session duration cannot automatically stop ongoing play',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.config.sessionMinutes=.0001;g.start();g.frame(1000);for(let i=1;i<20;i++)g.frame(1000+i*50);assert.equal(h.context.document.documentElement.dataset.playing,'true');assert.ok(g.elapsed>.5);
});
