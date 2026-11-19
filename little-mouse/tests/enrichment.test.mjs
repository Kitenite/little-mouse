import{test}from'node:test';
import assert from'node:assert/strict';
import{updateHunt,createHuntDirector,rememberTouch,clearHunt}from'../public/enrichment.js';
import{validateSettings as cleanSettings,settingsDefaults as defaults}from'../public/settings.js';
import{upgradeSettings}from'../public/physics.js';
test('Local settings validate hunt controls and migrates to the teasing defaults',()=>{
 assert.deepEqual(cleanSettings({mode:'hunt',huntTempo:.5}),{mode:'hunt',huntTempo:.5});
 for(const huntTempo of [0,2.1,NaN,Infinity,'1',null])assert.throws(()=>cleanSettings({huntTempo}));
 const settings=upgradeSettings(defaults);
 for(const [key,value] of Object.entries({behaviorVersion:3,audioVersion:1,count:2,speed:1.2,mode:'hunt',hide:2.5,size:2.2,sound:true}))assert.equal(settings[key],value,key);
});

// Exercise the real game entry point with a minimal DOM and network, without WebGL.
import{readFile}from'node:fs/promises';
import vm from'node:vm';
import{huntDefaults}from'../public/enrichment.js';
import{settingsDefaults,settingsSchema,validateSettings}from'../public/settings.js';
import{updateIdleBehavior}from'../public/idle-animation.js';
import{PreyAudio,audioDefaults}from'../public/audio.js';
import{stepMice,flee}from'../public/physics.js';
import{sendOffscreen,pressMouse,updateLifecycle}from'../public/behavior.js';
import * as contact from '../public/contact.js';
import{createOwnerGesture}from'../public/owner-gesture.js';
async function gameHarness(failure,surface='web',fault={}){
 const elements=new Map(),storage=new Map(fault.storage||[]),calls=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{setProperty(){}},dataset:{},options:[],listeners:{},addEventListener(name,fn){const old=this.listeners[name];this.listeners[name]=old?e=>{old(e);fn(e);}:fn;},setAttribute(){},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:800,height:600};},getContext(){return{};},querySelector(){return{removeAttribute(){}};}});return elements.get(id);};
 let response=failure,pendingResponse=null;
 const context=vm.createContext({console,AbortSignal,Date,Math,JSON,Number,performance,createOwnerGesture,...contact,settingsDefaults,validateSettings,updateIdleBehavior,applyBackground(){},createSettingsControls(root,{getSettings}){return{setSoundStatus(){},sync(){element('huntControls').hidden=getSettings().mode!=='hunt';}};},PreyAudio,audioDefaults,stepMice,flee,sendOffscreen,pressMouse,updateLifecycle,Option:class{},huntDefaults,updateHunt,createHuntDirector,rememberTouch,clearHunt,upgradeSettings,radius:()=>40,
 document:{documentElement:{dataset:{surface}},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},
 window:{addEventListener(){}},navigator:{},location:{origin:'http://local'},
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 MouseScene:class{constructor(){if(fault.construct)throw Error('Injected WebGL initialization failure');}w=800;h=600;resize(){}clearEffects(){}render(){if(fault.render)throw Error('Injected first render failure');}splatter(){}},setInterval(){},requestAnimationFrame(){},
 fetch:async(path,options)=>{calls.push([path,options]);if(pendingResponse)await pendingResponse;if(response==='offline')throw TypeError('Failed to fetch');if(response)return new Response('not JSON',{status:response});return Response.json({version:'v1'});}
 });
 const source=(await readFile(new URL('../public/game.js',import.meta.url),'utf8')).replace(/^import.*;\n/gm,'');
 vm.runInContext(source+'\nglobalThis.testGame={checkVersion,reload,sync,config,start,pause,frame,contacts,get catches(){return catches},get mice(){return mice},get elapsed(){return elapsed}};',context);
 await new Promise(resolve=>setImmediate(resolve));
 return{context,e:element,storage,calls,deferResponse(status){response=status;let release;pendingResponse=new Promise(resolve=>{release=resolve;});return release;},recover(){response=0;}};
}
test('game Hunt controls default to visible and follow mode changes',async()=>{
 const h=await gameHarness('offline');assert.equal(h.context.testGame.config.mode,'hunt');assert.equal(h.e('huntControls').hidden,false);
 h.context.testGame.config.mode='hunt';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,false);
 h.context.testGame.config.mode='manual';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,true);
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
test('iPad retains local start, pause and scroll lock',async()=>{
 const h=await gameHarness(404,'ipad');
 h.context.testGame.start();assert.equal(h.e('home').hidden,true);assert.equal(h.e('game').hidden,false);assert.equal(h.context.document.documentElement.dataset.playing,'true');
 h.context.testGame.pause();assert.equal(h.e('home').hidden,false);assert.equal(h.e('game').hidden,true);assert.equal(h.context.document.documentElement.dataset.playing,'false');
 let prevented=false;h.e('game').listeners.gesturestart({preventDefault(){prevented=true;}});assert.equal(prevented,true);
});
test('settings remain locally available and initially collapsed on every surface',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const panel=html.match(/<details id="tabletSettings">(.*?)<\/details>/s)[1];
 assert.ok(panel.includes('id="settingsControls"'));
 for(const id of ['speed','count','size','hide','sound','background','backgroundColor','mode','huntTempo','variation'])assert.ok(settingsSchema[id],id+' remains available locally');
 assert.ok(!panel.includes('id="start"'));
 const desktop=await gameHarness('offline');assert.notEqual(desktop.e('tabletSettings').open,true);
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


test('WebGL constructor failure rejects boot instead of leaving a permanently disabled play button',async()=>{
 await assert.rejects(gameHarness('offline','ipad',{construct:true}),/Injected WebGL initialization failure/);
});
test('first preview RAF exception stops the game and reaches recovery after readiness',async()=>{
 const h=await gameHarness('offline','ipad',{render:true});let failures=0;h.context.window.mouseBoot={state:'ready',fail(){failures++;h.context.window.mouseStopForRecovery();this.state='failed';this.recovering=true;}};h.e('game').hidden=true;
 h.context.runFrame(1000);assert.equal(failures,1);assert.equal(JSON.parse(h.storage.get('mouse-resume')).playing,false);
 h.context.testGame.start();h.context.runFrame(1017);assert.equal(failures,1);assert.equal(h.context.document.documentElement.dataset.playing,'false');
});
test('context loss preserves active resume and intentional pause checkpoints, then blocks stale polling',async()=>{
 for(const paused of [false,true]){
  const h=await gameHarness('offline','ipad'),g=h.context.testGame;g.start();if(paused)g.pause();
  h.context.window.mouseBoot={state:'ready',fail(){h.context.window.mouseStopForRecovery();this.state='failed';this.recovering=true;}};let prevented=false;
  h.e('board').listeners.webglcontextlost({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(h.context.window.mouseBoot.state,'failed');
  const saved=h.storage.get('mouse-resume');assert.equal(JSON.parse(saved).playing,!paused);assert.equal(h.context.window.mouseDiagnostics().recovering,true);assert.equal(h.context.window.mouseDiagnostics().playing,false);const calls=h.calls.length;await g.checkVersion();assert.equal(h.calls.length,calls);
  g.start();h.context.checkpoint();assert.equal(h.storage.get('mouse-resume'),saved);assert.equal(h.context.document.documentElement.dataset.playing,'false');
 }
});


test('partial setup failure keeps checkpoint and polling blocked throughout deferred retry',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.start();g.frame(1000);g.frame(1017);h.context.checkpoint();const saved=h.storage.get('mouse-resume');
 // Represent failure before the stop hook is assigned: only the inline latch exists.
 h.context.window.mouseStopForRecovery=undefined;h.context.window.mouseBoot={state:'failed',recovering:true};
 for(const state of ['failed','checking','reloading']){h.context.window.mouseBoot.state=state;g.pause();h.context.checkpoint();const calls=h.calls.length;await g.checkVersion();assert.equal(h.calls.length,calls);assert.equal(h.storage.get('mouse-resume'),saved);assert.equal(h.context.window.mouseDiagnostics().recovering,true);g.start();assert.equal(h.context.document.documentElement.dataset.playing,'false');}
});
test('faulting audio cleanup cannot prevent stopped diagnostics or preserve a live frame loop',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.start();
 vm.runInContext("preyAudio.setState=()=>{throw Error('Injected audio cleanup failure');};preyAudio.stop=()=>{throw Error('Injected audio stop failure');};",h.context);
 h.context.window.mouseStopForRecovery();assert.equal(h.context.window.mouseDiagnostics().recovering,true);assert.equal(h.context.window.mouseDiagnostics().playing,false);assert.equal(JSON.parse(h.storage.get('mouse-resume')).playing,true);
});


test('held contact reload preserves session without resurrecting a grab or awarding a hit',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;Object.assign(g.config,{mode:'manual',count:1,sound:false});g.sync();g.start();
 const m=g.mice[0];Object.assign(m,{x:400,y:300,angle:0});
 h.e('board').listeners.pointerdown({pointerId:7,clientX:400,clientY:300,width:22,height:22,preventDefault(){}});
 for(let now=1000;now<=1400;now+=20)g.frame(now);assert.equal(m.hold.active,true);
 let reloads=0;h.context.location.reload=()=>reloads++;
 g.reload();
 assert.equal(reloads,1);assert.equal(g.contacts.paws.size,0);assert.equal(m.hold,undefined);assert.equal(g.catches,0);
 const saved=JSON.parse(h.storage.get('mouse-resume'));assert.equal(saved.playing,true);assert.ok(saved.elapsed>.3);
 const restored=await gameHarness('offline','web',{storage:h.storage});assert.equal(restored.context.testGame.elapsed,saved.elapsed);assert.equal(restored.context.testGame.catches,0);assert.equal(restored.context.testGame.contacts.paws.size,0);
});

test('invalid resume payload is ignored without losing settings',async()=>{
 for(const resume of [
  {playing:true,catches:7,elapsed:'broken',at:Date.now()},
  {playing:true,catches:-1,elapsed:42,at:Date.now()},
  {playing:'yes',catches:7,elapsed:42,at:Date.now()},
  {playing:true,catches:7,elapsed:42,at:Date.now()+60000},
 ]){
  const storage=new Map([['little-mouse',JSON.stringify({...upgradeSettings(defaults),speed:2})],['mouse-resume',JSON.stringify(resume)]]);
  const h=await gameHarness('offline','web',{storage});assert.equal(h.context.window.mouseDiagnostics().playing,false);assert.equal(h.context.testGame.elapsed,0);assert.equal(h.context.testGame.config.speed,2);
 }
});

test('local settings survive reload and version responses cannot apply remote state',async()=>{
 const first=await gameHarness('offline'),g=first.context.testGame;
 g.config.speed=2;g.sync();
 const second=await gameHarness(0,'web',{storage:first.storage});
 assert.equal(second.context.testGame.config.speed,2);
 second.context.fetch=async()=>Response.json({version:'v1',settings:{speed:.8},command:{playback:{action:'play'}}});
 await second.context.testGame.checkVersion();
 assert.equal(second.context.testGame.config.speed,2);assert.equal(second.context.window.mouseDiagnostics().playing,false);
 assert.ok(second.calls.every(([path,options])=>path==='/api/version'&&!options.body));
});
test('asset version changes reload after checkpoint while failures leave play running',async()=>{
 const h=await gameHarness(0),g=h.context.testGame;let reloads=0;h.context.location.reload=()=>reloads++;
 g.start();h.context.fetch=async()=>{throw Error('offline')};await g.checkVersion();
 assert.equal(h.context.window.mouseDiagnostics().playing,true);assert.equal(reloads,0);
 h.context.fetch=async()=>Response.json({version:'v2'});await g.checkVersion();
 assert.equal(reloads,1);assert.equal(JSON.parse(h.storage.get('mouse-resume')).playing,true);
});

test('legacy remote manual mode returns to active local hunt without changing other choices',async()=>{
 const storage=new Map([['little-mouse',JSON.stringify({...upgradeSettings(defaults),mode:'manual',speed:2})]]);
 const h=await gameHarness('offline','web',{storage}),g=h.context.testGame;
 assert.equal(g.config.mode,'hunt');assert.equal(g.config.speed,2);
 assert.equal(JSON.parse(h.storage.get('little-mouse')).mode,'hunt');
 g.start();let active=false;for(let now=1000;now<16000;now+=50){g.frame(now);active ||= g.mice.some(m=>m.hunt&&m.hunt.phase!=='hidden');}
 assert.ok(active,'local hunt progresses out of hiding');
 assert.ok(!settingsSchema.mode.options.some(o=>o.value==='manual'));
});

test('successful local audio unlock activates without a synthetic peek cue',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.start();
 vm.runInContext("globalThis.audioUnlocks=0;globalThis.audioCues=0;preyAudio.unlock=async()=>{audioUnlocks++;return true;};preyAudio.cue=()=>audioCues++;",h.context);
 h.e('enableSound').listeners.click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.context.audioUnlocks,1);assert.equal(h.context.audioCues,0);
});
