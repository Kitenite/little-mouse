import{updateHuntGroup}from'../public/hunt-group.js';
import{createPlayLearning}from'../public/play-learning.js';
import{createLearningRuntime}from'../public/play-learning-runtime.js';
import{sensoryTrials}from'../public/experiment-trials.js';
import{ExperimentSession}from'../public/experiment-session.js';
import{upgradePlayStyle}from'../public/settings-migration.js';
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
 const context=vm.createContext({updateHuntGroup,createPlayLearning,createLearningRuntime,createLearningControls(){return{refresh(){}};},console,AbortSignal,Date,Math,JSON,Number,performance,ExperimentSession,createExperimentControls(){return{nextTrial:()=>fault.trial||null,actor:fault.actor||"human",resetObservation(){calls.push(["observation-reset"]);},started(){calls.push(["trial-started"]);},stopped(){},message(text){calls.push(["trial-message",text]);}};},createOwnerGesture,...contact,settingsDefaults,validateSettings,updateIdleBehavior,applyBackground(){},createSettingsControls(root,{getSettings}){return{setSoundStatus(){},sync(){element('huntControls').hidden=getSettings().mode!=='hunt';}};},PreyAudio,audioDefaults,stepMice,flee,sendOffscreen,pressMouse,updateLifecycle,Option:class{},huntDefaults,updateHunt,createHuntDirector,rememberTouch,clearHunt,upgradeSettings,upgradePlayStyle,radius:()=>40,
 document:{documentElement:{dataset:{surface}},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},
 window:{addEventListener(){}},navigator:{},location:{origin:'http://local'},
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 MouseScene:class{constructor(){if(fault.construct)throw Error('Injected WebGL initialization failure');}w=fault.initialDimensions||800;h=fault.initialDimensions||600;resize(){if(!element('game').hidden){this.w=800;this.h=600;}}clearEffects(){}render(){if(fault.render)throw Error('Injected first render failure');}splatter(){}},setInterval(){},requestAnimationFrame(){},
 fetch:async(path,options)=>{calls.push([path,options]);if(pendingResponse)await pendingResponse;if(response==='offline')throw TypeError('Failed to fetch');if(response)return new Response('not JSON',{status:response});return Response.json({version:'v1'});}
 });
 const source=(await readFile(new URL('../public/game.js',import.meta.url),'utf8')).replace(/^import.*;\n/gm,'');
 vm.runInContext(source+'\nglobalThis.testGame={learning,learningRuntime,experiments,preyAudio,experimentMouseVisible,endExperiment,checkVersion,reload,sync,config,start,pause,frame,contacts,get catches(){return catches},get mice(){return mice},get elapsed(){return elapsed}};',context);
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
  const storage=new Map([['little-mouse',JSON.stringify({...upgradeSettings(defaults),playStyleVersion:1,speed:2})],['mouse-resume',JSON.stringify(resume)]]);
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
 const storage=new Map([['little-mouse',JSON.stringify({...upgradeSettings(defaults),playStyleVersion:1,mode:'manual',speed:2})]]);
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

test('iPad migrates a saved large cast to two once, then preserves owner tuning',async()=>{
 const saved={...upgradeSettings(defaults),playStyleVersion:1,count:7};
 const first=await gameHarness('offline','ipad',{storage:new Map([['little-mouse',JSON.stringify(saved)]])});
 assert.equal(first.context.testGame.config.count,2);
 first.context.testGame.config.count=3;first.context.testGame.sync();
 const second=await gameHarness('offline','ipad',{storage:first.storage});assert.equal(second.context.testGame.config.count,3);
});

test('sensory trial applies confirmed settings only to new play and restores baseline on pause',async()=>{
 const h=await gameHarness('offline','web',{trial:{id:'coat-brightness',variants:[{id:'A',patch:{}},{id:'B',patch:{coatBrightness:1.25}}]}});
 const g=h.context.testGame,baseline=g.config.coatBrightness;
 g.start(true,true);assert.equal(g.experiments.active,true);
 const record=g.experiments.exportData().sessions[0];assert.ok(record);
 g.pause();assert.equal(g.config.coatBrightness,baseline);assert.equal(g.experiments.active,false);
});
test('ordinary play does not create experiment records',async()=>{
 const h=await gameHarness('offline');h.context.testGame.start();
 assert.equal(h.context.testGame.experiments.exportData().sessions.length,0);
});

const sensoryTrial=id=>sensoryTrials.find(trial=>trial.id===id);
const pointer=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,width:22,height:22,preventDefault(){}});
test('pilot frame exposure excludes fully offscreen approaches/exits and counts partial circle intersection',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;
 Object.assign(g.config,{mode:'manual',count:2,sound:false});g.start();
 const samples=[];g.experiments.tick=sample=>samples.push(sample);
 Object.assign(g.mice[0],{x:-500,y:300,state:'active',hiddenUntil:0,entering:true});
 Object.assign(g.mice[1],{x:1300,y:300,state:'active',hiddenUntil:0,leaving:true});
 g.frame(1000);assert.equal(samples.at(-1).visibleCount,0);assert.equal(samples.at(-1).mouseCount,2);
 const m={state:'active',hiddenUntil:0,x:400,y:300};
 for(const [x,y] of [[-41,300],[841,300],[400,-41],[400,641],[-30,-30]])assert.equal(g.experimentMouseVisible({...m,x,y},0,800,600,1),false,`${x},${y}`);
 for(const [x,y] of [[-20,300],[820,300],[400,-20],[400,620]])assert.equal(g.experimentMouseVisible({...m,x,y},0,800,600,1),true,`${x},${y}`);
 assert.equal(g.experimentMouseVisible({...m,state:'away'},0,800,600,1),false);
 assert.equal(g.experimentMouseVisible({...m,hiddenUntil:1},0,800,600,1),false);
});
test('entire owner exit gesture excludes all corner contacts and outcomes while gameplay stays functional',async()=>{
 const h=await gameHarness('offline','web',{trial:sensoryTrial('coat-brightness'),actor:'cat'}),g=h.context.testGame,board=h.e('board');
 Object.assign(g.config,{mode:'manual',count:1,sound:false,harmlessChance:1});g.start(true,true);
 let id=10;
 for(const [x,y]of [[10,10],[790,10],[790,590],[10,590]]){
  Object.assign(g.mice[0],{x,y,angle:0,state:'active',hiddenUntil:0,invulnerableUntil:0});
  board.listeners.pointerdown(pointer(id,x,y));board.listeners.pointerup(pointer(id++,x,y));
 }
 const record=g.experiments.exportData().sessions[0];
 assert.equal(h.context.window.mouseDiagnostics().playing,false);assert.equal(record.end.reason,'owner-ended');
 assert.equal(record.actor,'cat');assert.equal(record.contacts.episodes,0);assert.equal(record.contacts.outcomes,0);
 assert.equal(record.records.filter(r=>r.kind==='event:contact-excluded').length,4);
 assert.equal(g.catches,3,'the first three corner hits still affect gameplay; final exit pauses as before');
});
test('corner-origin exclusion follows drags, cancellation, and pointer ID reuse',async()=>{
 const h=await gameHarness('offline','web',{trial:sensoryTrial('coat-brightness'),actor:'cat'}),g=h.context.testGame,board=h.e('board');
 Object.assign(g.config,{mode:'manual',count:1,sound:false,harmlessChance:1});g.start(true,true);
 Object.assign(g.mice[0],{x:10,y:10,angle:0,state:'active',hiddenUntil:0});
 board.listeners.pointerdown(pointer(1,10,10));board.listeners.pointermove(pointer(1,400,300));board.listeners.pointerup(pointer(1,400,300));
 assert.equal(g.experiments.exportData().sessions[0].contacts.episodes,0);
 Object.assign(g.mice[0],{x:400,y:300,angle:0,state:'active',hiddenUntil:0,invulnerableUntil:0});
 board.listeners.pointerdown(pointer(1,400,300));board.listeners.pointerup(pointer(1,400,300));
 let record=g.experiments.exportData().sessions[0];assert.equal(record.contacts.episodes,1);assert.equal(record.contacts.outcomes,1);
 board.listeners.pointerdown(pointer(1,790,10));board.listeners.pointercancel(pointer(1,790,10));
 board.listeners.pointerdown(pointer(1,350,350));board.listeners.pointercancel(pointer(1,350,350));
 record=g.experiments.exportData().sessions[0];assert.equal(record.contacts.episodes,2);assert.equal(record.contacts.outcomes,1);
});
test('preflight keeps board hidden on inapplicable textures; successful assignment snapshots resized dimensions',async()=>{
 for(const id of ['texture-contrast','background-scale','coat-background-2x2'])for(const background of ['plain','chalk','ink','pale-blue','warm-yellow']){
  const h=await gameHarness('offline','web',{trial:sensoryTrial(id),initialDimensions:1}),g=h.context.testGame;
  h.e('game').hidden=true;h.e('home').hidden=false;g.config.background=background;g.start(true,true);
  assert.equal(g.experiments.active,false,`${id}/${background}`);assert.equal(h.e('game').hidden,true);assert.equal(h.e('home').hidden,false);
 }
 const blocked=await gameHarness('offline','web',{trial:sensoryTrial('background-scale')});blocked.context.testGame.config.backgroundContrast=0;blocked.context.testGame.start(true,true);assert.equal(blocked.context.testGame.experiments.active,false);
 const h=await gameHarness('offline','web',{trial:sensoryTrial('coat-brightness'),initialDimensions:1}),g=h.context.testGame;
 h.e('game').hidden=true;g.start(true,true);
 const record=g.experiments.exportData().sessions[0];assert.equal(record.device.width,800);assert.equal(record.device.height,600);
 assert.ok(record.records.some(r=>r.kind==='event:visibility-method'&&r.payload.pixelSilhouetteVerified===false));
 const reset=h.calls.findIndex(([name])=>name==='observation-reset'),started=h.calls.findIndex(([name])=>name==='trial-started');assert.ok(reset>=0&&started>reset);
 g.pause();const count=h.calls.filter(([name])=>name==='observation-reset').length;g.start();assert.equal(h.calls.filter(([name])=>name==='observation-reset').length,count+1);
});
function mockAudio(g,banks){
 Object.defineProperty(g.preyAudio,'ready',{get:()=>true});
 g.preyAudio.diagnostics=()=>({state:'running',sampleCount:20,loadedBankCounts:banks,played:0});
}
test('sound pilots require both usable banks and variety requires a genuinely larger repertoire',async()=>{
 for(const id of ['sound-presence','sound-frequency','sound-volume','sound-variety'])for(const banks of [{tap:0,squeak:4},{tap:4,squeak:0},{}]){
  const h=await gameHarness('offline','web',{trial:sensoryTrial(id)}),g=h.context.testGame;mockAudio(g,banks);h.e('game').hidden=true;g.start(true,true);
  assert.equal(g.experiments.active,false,`${id}/${JSON.stringify(banks)}`);assert.equal(h.e('game').hidden,true);
 }
 for(const [banks,allowed]of [[{tap:2,squeak:2},false],[{tap:3,squeak:1},true],[{tap:1,squeak:3},true]]){
  const h=await gameHarness('offline','web',{trial:sensoryTrial('sound-variety')}),g=h.context.testGame;mockAudio(g,banks);g.start(true,true);
  assert.equal(g.experiments.active,allowed);
  if(allowed){const event=g.experiments.exportData().sessions[0].records.find(r=>r.kind==='event:audio-readiness');assert.deepEqual(event.payload.loadedBankCounts,banks);assert.equal(event.payload.physicalAudibility,'unknown');}
 }
});

test('ordinary play records labeled completed contacts locally and excludes owner corners and cancelled grabs',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.learning.configure({actor:'cat'});g.config.sound=false;g.start();
 const m=g.mice[0];Object.assign(m,{state:'active',x:400,y:300,angle:0,hiddenUntil:0,hunt:{chapter:{id:'bursts'},phase:'watch',since:0}});
 const e=(pointerId,x=400,y=300)=>({pointerId,clientX:x,clientY:y,width:10,height:10,preventDefault(){}}),board=h.e('board');
 board.listeners.pointerdown(e(1));board.listeners.pointerup(e(1));
 board.listeners.pointerdown(e(2));board.listeners.pointercancel(e(2));
 board.listeners.pointerdown(e(3,5,5));board.listeners.pointerup(e(3,5,5));
 g.pause();const data=JSON.parse(g.learning.export()),r=data.sessions.at(-1);
 assert.equal(r.actor,'cat');assert.equal(r.complete,true);assert.equal(r.chapters.bursts.contacts.cat.tap,1);
 assert.equal(Object.values(r.chapters).reduce((n,c)=>n+c.contacts.cat.tap,0),1,'owner corner adds no learning tap');
 assert.equal(g.learning.status().support.bursts.sessions,0,'short play cannot establish chapter support');
});
test('sensory comparisons and graphics recovery cannot become eligible learning sessions',async()=>{
 const trial=sensoryTrials.find(t=>t.id==='texture-contrast');
 const h=await gameHarness('offline','ipad',{trial}),g=h.context.testGame;
 g.learning.configure({actor:'cat'});g.config.background='wood';g.start(true,true);g.pause();
 assert.equal(JSON.parse(g.learning.export()).sessions.at(-1).excluded,true);
 g.start();h.context.window.mouseStopForRecovery();
 assert.equal(JSON.parse(g.learning.export()).sessions.at(-1).complete,false);
});

test('learning snapshots the actual build, settings and measured board before play',async()=>{
 const h=await gameHarness(0),g=h.context.testGame;g.config.sound=false;g.start();
 const context=g.learning.status().active.context;
 assert.equal(context.build,'v1');assert.equal(context.policyVersion,'chapter-duration-v1');
 assert.equal(context.device.width,800);assert.equal(context.device.height,600);assert.equal(context.device.platform,'web');
 assert.equal(context.settings.size,g.config.size);assert.equal(context.settings.count,2);
 assert.equal(Object.keys(context.settings).length,Object.keys(settingsSchema).length);
 g.pause();const saved=JSON.parse(g.learning.export()).sessions.at(-1).context;
 g.config.size=1.8;g.start();assert.equal(g.learning.status().active.context.settings.size,1.8);
 assert.equal(saved.settings.size,context.settings.size,'later owner changes cannot mutate prior provenance');
});
test('a start before any successful build lookup stays descriptive instead of fabricating provenance',async()=>{
 const h=await gameHarness('offline'),g=h.context.testGame;g.learning.configure({actor:'cat'});g.start();
 assert.equal(g.learning.status().active.context,null);assert.ok(Object.values(g.learning.status().multipliers).every(v=>v===1));
});
