import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const script=html.match(/<script id="boot-recovery">([\s\S]*?)<\/script>/)[1].replace("import('./game.js')",'loadGame()');
function harness(){
 const listeners={},elements=new Map(),timers=new Map();let resolve,reject,imports=0,reloads=0,requests=0,response='ok',stop=0,fetchGate=null;
 const element=id=>{if(!elements.has(id))elements.set(id,{disabled:id==='start',hidden:false,textContent:'',addEventListener(type,fn){listeners[id+':'+type]=fn;}});return elements.get(id);};
 const window={addEventListener(type,fn){listeners[type]=fn;},mouseStopForRecovery(){stop++;}};
 const context=vm.createContext({window,document:{getElementById:element},console:{error(){}},AbortSignal,Error,
 setTimeout(fn){timers.set(1,fn);return 1;},clearTimeout(id){timers.delete(id);},
 loadGame(){imports++;return new Promise((a,b)=>{resolve=a;reject=b;});},
 fetch:async()=>{requests++;if(fetchGate)await fetchGate;if(response==='offline')throw Error('offline');return new Response('',{status:response==='503'?503:200,headers:{'content-type':response==='html'?'text/html':'text/javascript'}});},
 location:{reload(){reloads++;}}});
 vm.runInContext(script,context);
 return {window,element,listeners,timers,resolve,reject,setResponse(v){response=v;},deferFetch(){let release;fetchGate=new Promise(resolve=>{release=resolve;});return release;},get imports(){return imports;},get reloads(){return reloads;},get requests(){return requests;},get stop(){return stop;},click(){let blocked=false;listeners['start:click']({preventDefault(){},stopImmediatePropagation(){blocked=true;}});return blocked;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('HTML starts visibly loading; one successful import enables the unchanged play handler',async()=>{
 assert.match(html,/<button id="start"[^>]*disabled>Loading game/);assert.doesNotMatch(html,/<script type="module" src="game.js"/);
 const h=harness();assert.equal(h.click(),true);assert.equal(h.imports,1);assert.equal(h.requests,0);
 h.resolve();await settle();assert.equal(h.window.mouseBoot.state,'ready');assert.equal(h.element('start').disabled,false);assert.equal(h.click(),false);assert.equal(h.timers.size,0);assert.equal(h.reloads,0);
});
test('failed module import exposes retry; offline/server failure stays actionable without automatic reload',async()=>{
 const h=harness();h.reject(Error('module unavailable'));await settle();assert.equal(h.window.mouseBoot.state,'failed');assert.equal(h.element('start').disabled,false);assert.match(h.element('start').textContent,/Retry/);
 for(const response of ['offline','503','html']){h.setResponse(response);h.click();h.click();await settle();assert.equal(h.window.mouseBoot.state,'failed');assert.equal(h.element('start').disabled,false);assert.equal(h.reloads,0);}
 assert.equal(h.requests,3);assert.equal(h.imports,1);h.listeners.online();assert.match(h.element('bootStatus').textContent,/Connection returned/);assert.equal(h.reloads,0);
 h.setResponse('ok');h.click();h.click();await settle();assert.equal(h.reloads,1);assert.equal(h.window.mouseBoot.recovering,true);assert.equal(h.requests,4);assert.equal(h.imports,1);
});
test('hung startup times out; late completion cannot silently enable a partially stopped game',async()=>{
 const h=harness();h.timers.get(1)();assert.equal(h.window.mouseBoot.state,'failed');h.resolve();await settle();assert.equal(h.window.mouseBoot.state,'failed');assert.match(h.element('start').textContent,/Retry/);assert.equal(h.reloads,0);
});
test('runtime renderer failure returns to recovery and stops once without re-import or reload loop',async()=>{
 const h=harness();h.resolve();await settle();h.window.mouseBoot.fail(Error('context lost'));h.window.mouseBoot.fail(Error('repeat'));
 assert.equal(h.stop,1);assert.equal(h.element('home').hidden,false);assert.equal(h.element('game').hidden,true);assert.equal(h.window.mouseBoot.state,'failed');assert.equal(h.imports,1);assert.equal(h.reloads,0);
});


test('throwing stop hook cannot strand the recovery UI or clear the durable retry latch',async()=>{
 const h=harness();assert.equal(h.window.mouseDiagnostics().recovering,true);
 h.window.mouseStopForRecovery=()=>{throw Error('cleanup failed');};h.reject(Error('initialization failed'));await settle();
 assert.equal(h.window.mouseBoot.state,'failed');assert.equal(h.window.mouseBoot.recovering,true);assert.equal(h.element('start').disabled,false);
 h.click();assert.equal(h.window.mouseBoot.state,'checking');assert.equal(h.window.mouseBoot.recovering,true);await settle();assert.equal(h.window.mouseBoot.recovering,true);assert.equal(h.reloads,1);
});


test('late import rejection cannot reopen a pending retry or cause duplicate navigation',async()=>{
 const h=harness();h.timers.get(1)();const release=h.deferFetch();h.click();assert.equal(h.window.mouseBoot.state,'checking');
 h.reject(Error('late module failure'));await settle();assert.equal(h.window.mouseBoot.state,'checking');h.window.mouseBoot.fail(Error('repeat context loss'));assert.equal(h.window.mouseBoot.state,'checking');
 h.click();assert.equal(h.requests,1);release();await settle();assert.equal(h.reloads,1);assert.equal(h.window.mouseBoot.state,'reloading');h.click();assert.equal(h.requests,1);
});
