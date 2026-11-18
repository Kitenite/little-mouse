import{test}from'node:test';
import assert from'node:assert/strict';
import{updateHunt}from'../public/enrichment.js';
import{cleanSettings,defaults}from'../worker/api.js';
import{upgradeSettings}from'../public/physics.js';
const config={mode:'hunt',size:1.2,hide:0,huntTempo:1,variation:true};
const mouse=()=>({x:400,y:300,next:0,restUntil:0,hiddenUntil:0,state:'active'});
const step=(m,c,t,rng=()=>.5)=>updateHunt(m,c,t,800,600,false,rng);
test('hunt cycles stalk, pause and burst with varied timing and owner tempo',()=>{
 const m=mouse();step(m,config,0);assert.equal(m.hunt.phase,'stalk');const distance=Math.hypot(m.targetX-m.x,m.targetY-m.y),next=m.next;
 step(m,config,next-.01);assert.equal(m.next,next);
 step(m,config,next);assert.equal(m.hunt.phase,'pause');assert.equal(m.restUntil,m.next);
 step(m,config,m.next);assert.equal(m.hunt.phase,'burst');assert.ok(Math.hypot(m.targetX-m.x,m.targetY-m.y)>distance);assert.ok(m.restUntil<m.next);
 const fast=mouse(),slow=mouse();step(fast,{...config,huntTempo:2},0);step(slow,{...config,huntTempo:.5},0);assert.equal(slow.next,fast.next*4);
 const varied=mouse();step(varied,config,0,()=>.9);assert.notEqual(varied.next,next);
});
test('hunt hiding uses offscreen lifecycle and hide zero disables voluntary hiding',()=>{
 const m=mouse();step(m,{...config,hide:3},0,()=>0);assert.equal(m.leaving,true);assert.ok(m.targetX<0||m.targetY<0);assert.equal(m.hiddenUntil,0);
 const visible=mouse();step(visible,config,0,()=>0);assert.equal(visible.leaving,undefined);
});
test('novelty changes path shape over time only when enabled',()=>{
 const m=mouse();step(m,config,31);assert.equal(m.hunt.motif,1);
 const fixed=mouse();step(fixed,{...config,variation:false},61);assert.equal(fixed.hunt.motif,0);
});
test('manual takeover clears hunt pauses; other modes keep existing behavior',()=>{
 const m=mouse();step(m,config,0);step(m,config,m.next);const target=[m.targetX,m.targetY];
 assert.equal(updateHunt(m,config,3,800,600,true),false);assert.equal(m.hunt,undefined);assert.ok(m.restUntil<=3);assert.deepEqual([m.targetX,m.targetY],target);
 for(const mode of ['scurry','stalk','manual']){const other=mouse();assert.equal(step(other,{...config,mode},0),false);assert.deepEqual(other,mouse());}
});
test('hits, limp, escape, hiding and re-entry retain movement control',()=>{
 for(const state of [{state:'hurt'},{state:'defeated'},{state:'away'},{leaving:true},{entering:true},{hiddenUntil:5},{startledUntil:5},{injuredUntil:5}]){
 const m={...mouse(),...state,targetX:12,targetY:34,restUntil:4,next:8};step(m,config,1);assert.equal(m.targetX,12);assert.equal(m.targetY,34);assert.equal(m.restUntil,4);assert.equal(m.next,8);assert.equal(m.hunt,undefined);
 }
});
test('API validates hunt controls and preserves lively defaults',()=>{
 assert.deepEqual(cleanSettings({mode:'hunt',huntTempo:.5}),{mode:'hunt',huntTempo:.5});
 for(const huntTempo of [0,2.1,NaN,Infinity,'1',null])assert.throws(()=>cleanSettings({huntTempo}));
 assert.equal(upgradeSettings(defaults).mode,'scurry');assert.equal(upgradeSettings(defaults).speed,3);
});

// Exercise the real game entry point with a minimal DOM and network, without WebGL.
import{readFile}from'node:fs/promises';
import vm from'node:vm';
import{huntDefaults}from'../public/enrichment.js';
async function gameHarness(failure,surface='web'){
 const elements=new Map(),storage=new Map([['mouse-room',JSON.stringify('0123456789abcdef')],['mouse-command',JSON.stringify({steer:'old'})]]),calls=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{setProperty(){}},dataset:{},options:[],listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},setAttribute(){},getContext(){return{};},querySelector(){return{removeAttribute(){}};}});return elements.get(id);};
 let response=failure;
 const context=vm.createContext({console,AbortSignal,Date,Math,JSON,Number,Option:class{},huntDefaults,updateHunt,upgradeSettings,radius:()=>40,
 document:{documentElement:{dataset:{surface}},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},
 window:{addEventListener(){}},navigator:{},location:{origin:'http://local'},
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 MouseScene:class{w=800;h=600;resize(){}clearEffects(){}},setInterval(){},requestAnimationFrame(){},
 fetch:async(path,options)=>{calls.push([path,options]);if(path==='/api/rooms')return Response.json({code:'fedcba9876543210'});if(path==='/api/version')return Response.json({version:'v1'});if(response==='offline')throw TypeError('Failed to fetch');if(response)return new Response('not JSON',{status:response});return Response.json({version:'v1',revision:0,settings:upgradeSettings({...defaults}),command:{}});}
 });
 const source=(await readFile(new URL('../public/game.js',import.meta.url),'utf8')).replace(/^import.*;\n/gm,'');
 vm.runInContext(source+'\nglobalThis.testGame={poll,sync,config,start,pause,rest,get room(){return room},get revision(){return revision},get commandSeen(){return commandSeen}};',context);
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
test('game Hunt controls follow mode changes while Scurry remains the default',async()=>{
 const h=await gameHarness('offline');assert.equal(h.context.testGame.config.mode,'scurry');assert.equal(h.e('huntControls').hidden,true);
 h.context.testGame.config.mode='hunt';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,false);
 h.context.testGame.config.mode='manual';h.context.testGame.sync();assert.equal(h.e('huntControls').hidden,true);
});
test('companion Hunt controls follow pending local mode choices',async()=>{
 const source=await readFile(new URL('../public/companion.js',import.meta.url),'utf8');
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const context=vm.createContext({$:element,keys:['mode'],pending:{mode:'hunt'},settings:{mode:'hunt',speed:3,hide:0,sessionMinutes:5},document:{},Number});
 vm.runInContext(source.slice(source.indexOf('function sync()'),source.indexOf('async function poll()')),context);
 vm.runInContext('sync()',context);assert.equal(element('huntControls').hidden,false);
 context.settings.mode='scurry';vm.runInContext('sync()',context);assert.equal(element('huntControls').hidden,true);
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
test('iPad retains local start, break, pause, pairing recovery and scroll lock',async()=>{
 const h=await gameHarness(404,'ipad');assert.equal(h.e('pair').textContent,'Create pairing code');
 h.context.testGame.start();assert.equal(h.e('home').hidden,true);assert.equal(h.e('game').hidden,false);assert.equal(h.context.document.documentElement.dataset.playing,'true');
 h.context.testGame.rest();assert.equal(h.e('break').hidden,false);assert.equal(h.context.document.documentElement.dataset.playing,'true');
 h.context.testGame.pause();assert.equal(h.e('home').hidden,false);assert.equal(h.e('game').hidden,true);assert.equal(h.context.document.documentElement.dataset.playing,'false');
 let prevented=false;h.e('game').listeners.gesturestart({preventDefault(){prevented=true;}});assert.equal(prevented,true);
});
test('tablet settings remain locally available and desktop settings open automatically',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const panel=html.match(/<details id="tabletSettings">(.*?)<\/details>/s)[1];
 for(const id of ['speed','counts','size','hide','sound','background','backgroundColor','mode','huntTempo','variation','sessionMinutes'])assert.ok(panel.includes(`id="${id}"`),id+' remains available locally');
 assert.ok(!panel.includes('id="start"'));
 const desktop=await gameHarness('offline');assert.equal(desktop.e('tabletSettings').open,true);
 const tablet=await gameHarness('offline','ipad');assert.notEqual(tablet.e('tabletSettings').open,true);assert.equal(typeof tablet.e('tabletSettings').listeners.toggle,'function');
});
