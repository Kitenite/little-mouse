import{createOwnerGesture}from'./owner-gesture.js';
import{createContacts,recordPointer,removePointer,classifyContact,beginContact,moveContact,updateContacts,endContact,cancelContact,clearContacts}from'./contact.js';
import{updateIdleBehavior}from'./idle-animation.js';
import{settingsDefaults}from'./settings.js';
import{createSettingsControls}from'./controls.js';
import{applyBackground}from'./backgrounds.js';
import{PreyAudio,audioDefaults}from'./audio.js';
import{huntDefaults,updateHunt,createHuntDirector,rememberTouch,clearHunt}from'./enrichment.js';
import{MouseScene}from'./mouse3d.js';
import{sendOffscreen,pressMouse,updateLifecycle}from'./behavior.js';
import{upgradeSettings,stepMice,flee,radius}from'./physics.js';
const $=id=>document.getElementById(id),defaults=settingsDefaults;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const persist=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const config=upgradeSettings({...defaults,...read('little-mouse',{})});let playing=false,mice=[],catches=0,elapsed=0,last=0,wake=null,room=read('mouse-room',null),revision=-1,commandSeen={},version='',pollBusy=false,telemetryAt=0,manualUntil=0,networkFailures=0;
const preyAudio=new PreyAudio();
let huntDirector=createHuntDirector();const contacts=createContacts();huntDirector.paws=contacts.obstacles;
const gameCadence={last:null,credit:0},previewCadence={last:null,credit:0};let renderDt=0;
function renderDue(clock,now,hz){if(clock.last===null){clock.last=now;clock.credit=0;return true;}clock.credit+=Math.max(0,now-clock.last);clock.last=now;const interval=1000/hz;if(clock.credit+1e-6<interval)return false;clock.credit=Math.max(0,clock.credit-Math.floor((clock.credit+1e-6)/interval)*interval);return true;}
function resetCadence(){gameCadence.last=previewCadence.last=null;gameCadence.credit=previewCadence.credit=renderDt=0;}
function checkpoint(){persist('mouse-resume',{playing,catches,elapsed,at:Date.now()});}
const previewMouse={hiddenUntil:0,moving:false,state:"active",seed:12};
let preview,scene;try{preview=new MouseScene($('preview'),{preview:true});scene=new MouseScene($('board'));}catch(e){$('start').disabled=true;$('start').textContent='WebGL unavailable — try Safari or Chrome';console.error(e);}
let pendingSettings={},sendingSettings={},localSettings={};
const controls=createSettingsControls($('settingsControls'),{getSettings:()=>config,onTestSound:()=>preyAudio.testSound().then(()=>syncAudio()),onChange:patch=>{Object.assign(config,patch);sync();if(patch.sound)unlockAudio();sendSettings(patch);}});
function background(){applyBackground($('game'),config);applyBackground($('preview').parentElement,config);}
function sync(){controls.sync();background();persist('little-mouse',config);syncAudio();if(playing)ensureCount();}
async function request(path,body){const res=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(5000)});if(!res.ok){const error=Error((await res.json().catch(()=>({}))).error||'Connection failed');error.status=res.status;error.path=path;throw error;}return res.json();}
async function sendSettings(patch){Object.assign(pendingSettings,patch);Object.assign(localSettings,patch);await flushSettings();}
async function flushSettings(){if(!room||Object.keys(sendingSettings).length||!Object.keys(pendingSettings).length)return;const patch=pendingSettings;pendingSettings={};sendingSettings=patch;try{await request(`/api/rooms/${room}/settings`,patch);}catch{pendingSettings={...patch,...pendingSettings};$('networkStatus').textContent='Settings saved here; companion offline';}finally{sendingSettings={};}}
setInterval(flushSettings,200);
function spawn(){const castIndex=mice.length;const w=scene.w,h=scene.h,r=radius(config.size,w,h);return{castIndex,state:config.mode==='hunt'?'away':'active',x:r+Math.random()*Math.max(1,w-2*r),y:r+Math.random()*Math.max(1,h-2*r),angle:Math.random()*Math.PI*2,targetX:w/2,targetY:h/2,next:elapsed+.6,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,seed:Math.random()*100};}
function ensureCount(){while(mice.length<config.count)mice.push(spawn());mice.length=config.count;}
async function awake(){try{if(playing&&navigator.wakeLock)wake=await navigator.wakeLock.request('screen')}catch{}}
function syncAudio(){preyAudio.configure(config);preyAudio.setState(config.sound,playing&&!document.hidden);$('enableSound').hidden=!playing||!config.sound||preyAudio.ready;const audio=preyAudio.diagnostics();controls.setSoundStatus(`${config.sound?'Sound on':'Muted'} · ${audio.state==='locked'?'tap Test sound to enable':audio.state} · volume ${Math.round(config.soundVolume*100)}%${audio.lastError?' · '+audio.lastError:''}${audio.signalPeak>0?' · signal generated':''}`);}
function unlockAudio(){if(!config.sound)return;preyAudio.unlock().then(ready=>{syncAudio();if(ready&&playing)preyAudio.cue('peek',.5);});}
$('enableSound').addEventListener('click',unlockAudio);
// Native navigation and remote Play are not gestures inside this web document.
// Retry from the actual board touch, including pointerup for iOS activation.
$('board').addEventListener('pointerup',()=>{if(config.sound&&!preyAudio.ready)unlockAudio();});
function start(reset=true){if(!scene)return;playing=true;document.documentElement.dataset.playing='true';$('home').hidden=true;$('game').hidden=false;scene.resize();if(reset){cancelTouchSounds();clearContacts(contacts);preyAudio.reset();elapsed=0;catches=0;mice=[];huntDirector=createHuntDirector();huntDirector.paws=contacts.obstacles;scene.clearEffects();}ensureCount();syncAudio();resetCadence();checkpoint();$('score').textContent=`${catches} hits`;awake();}
function pause(){cancelTouchSounds();clearContacts(contacts);playing=false;syncAudio();checkpoint();resetCadence();document.documentElement.dataset.playing='false';clearHold();$('game').hidden=true;$('home').hidden=false;wake?.release().catch(()=>{});wake=null;preview?.resize();}

// Keep multi-touch play on the board from zooming or scrolling the page.
for(const type of ['gesturestart','gesturechange','touchmove'])$('game').addEventListener(type,e=>e.preventDefault(),{passive:false});
if(document.documentElement.dataset.surface==='ipad')$('home').querySelector('.brand').removeAttribute('href');
else $('tabletSettings').open=true;
$('tabletSettings').addEventListener('toggle',()=>preview?.resize());
$('start').addEventListener('click',()=>{unlockAudio();start();});
const ownerGesture=createOwnerGesture(),ownerPointers=new Set();
function clearHold(){ownerGesture.cancel();ownerPointers.clear();}
$('board').addEventListener('pointerdown',e=>{ownerPointers.add(e.pointerId);const r=$('board').getBoundingClientRect();ownerGesture.down(e.pointerId,e.clientX-r.left,e.clientY-r.top,r.width,r.height,performance.now()/1000,ownerPointers.size===1);});
$('board').addEventListener('pointerup',e=>{const r=$('board').getBoundingClientRect();ownerPointers.delete(e.pointerId);if(ownerGesture.up(e.pointerId,e.clientX-r.left,e.clientY-r.top,r.width,r.height,performance.now()/1000))pause();});
$('board').addEventListener('pointercancel',clearHold);$('board').addEventListener('lostpointercapture',e=>{if(ownerPointers.has(e.pointerId))clearHold();});
window.addEventListener('blur',clearHold);document.addEventListener('keydown',e=>{if(e.key==='Escape')pause();});
function boardPoint(e){const r=$('board').getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
const touchSounds=new Map();
function cancelTouchSound(id){const mouse=touchSounds.get(id);if(mouse)preyAudio.cancelContactFeedback(mouse,id,{cancelHold:contacts.get(id)?.m===mouse});touchSounds.delete(id);}
function cancelTouchSounds(){for(const id of touchSounds.keys())cancelTouchSound(id);}
function finishContact(e){touchSounds.delete(e.pointerId);const result=endContact(contacts,e.pointerId,elapsed,scene.w,scene.h,config.size,config);if(!result)return;const {mouse:m,outcome,x,y}=result;catches++;if(outcome!=='harmless'&&outcome!=='tossed')scene.splatter(x,y,config.size,m.angle,elapsed);preyAudio.hit(m,scene.w,outcome,e.pointerId);$('score').textContent=`${catches} ${catches===1?'hit':'hits'}`;}
$('board').addEventListener('pointerdown',e=>{e.preventDefault();if(!playing)return;const {x,y}=boardPoint(e);if(!recordPointer(contacts,e.pointerId,x,y,elapsed,e.width,e.height))return;try{$('board').setPointerCapture(e.pointerId);}catch{}rememberTouch(huntDirector,x,y,elapsed,scene.w,scene.h);
 const eligible=mice.filter(m=>!m.hold&&m.hiddenUntil<=elapsed&&m.state!=='away'&&m.state!=='defeated');
 let hit=scene.contactAt?.(mice,x,y,config.size,{includeUnclaimable:true});
 if(!scene.contactAt){for(const m of mice){if(m.hiddenUntil>elapsed||m.state==='away')continue;const part=classifyContact(m,x,y,config.size);if(part){hit={mouse:m,...part};break;}}}
 if(hit){touchSounds.set(e.pointerId,hit.mouse);preyAudio.contactFeedback(hit.mouse,scene.w,'touch',e.pointerId);}
 else if(config.sound&&!preyAudio.ready)unlockAudio();
 if(hit&&beginContact(contacts,hit.mouse,hit,e.pointerId,x,y,elapsed,config,config.size)){try{$('board').setPointerCapture(e.pointerId);}catch{}}
 else if(config.mode!=='hunt')for(const m of eligible)flee(m,x,y,elapsed,scene.w,scene.h,config.size);
});
$('board').addEventListener('pointermove',e=>{if(!contacts.paws.has(e.pointerId))return;e.preventDefault();const {x,y}=boardPoint(e);recordPointer(contacts,e.pointerId,x,y,elapsed,e.width,e.height);moveContact(contacts,e.pointerId,x,y,config.size,elapsed);});
$('board').addEventListener('pointerup',e=>{if(playing)finishContact(e);else removePointer(contacts,e.pointerId);});
for(const type of ['pointercancel','lostpointercapture'])$('board').addEventListener(type,e=>{cancelTouchSound(e.pointerId);removePointer(contacts,e.pointerId);});
window.addEventListener('pointerup',e=>{if(playing&&contacts.paws.has(e.pointerId))finishContact(e);});
window.addEventListener('pointercancel',e=>{cancelTouchSound(e.pointerId);removePointer(contacts,e.pointerId);});
window.addEventListener('blur',()=>{cancelTouchSounds();clearContacts(contacts);});
window.addEventListener('resize',()=>{cancelTouchSounds();clearContacts(contacts);preview?.resize();if(playing)scene?.resize();});document.addEventListener('visibilitychange',()=>{cancelTouchSounds();clearContacts(contacts);checkpoint();syncAudio();last=0;resetCadence();clearHold();if(!document.hidden){awake();poll();}});
function showCode(){if(room){$('pairCode').textContent=room.match(/.{1,4}/g).join(' ');$('pair').textContent='Copy companion link';}else{$('pairCode').textContent='';$('pair').textContent='Create pairing code';}}
function clearPairing(){room=null;revision=-1;commandSeen={};telemetryAt=0;networkFailures=0;persist('mouse-room',null);persist('mouse-command',{});showCode();$('networkStatus').textContent='Pairing expired · create a new pairing code';$('connection').textContent='Not paired';}
$('pair').addEventListener('click',async()=>{try{if(!room){room=(await request('/api/rooms',{settings:config})).code;persist('mouse-room',room);showCode();await poll();}else{await navigator.clipboard.writeText(`${location.origin}/companion#${room}`);$('networkStatus').textContent='Companion link copied';}}catch(e){$('networkStatus').textContent=e.message;}});
function applyCommands(commands){for(const [slot,cmd] of Object.entries(commands).sort((a,b)=>(a[1].at||0)-(b[1].at||0))){applyCommand(cmd,slot);}}
function applyCommand(cmd,slot){if(!cmd||cmd.nonce===commandSeen[slot])return;commandSeen[slot]=cmd.nonce;persist('mouse-command',commandSeen);if(cmd.at&&Date.now()-cmd.at>30000)return;if(cmd.action==='play')start(!playing);if(cmd.action==='pause')pause();if(cmd.action==='reload')reload();if(cmd.action==='recall'){cancelTouchSounds();clearContacts(contacts);manualUntil=elapsed+2;mice.forEach(m=>{clearHunt(m,elapsed);m.restUntil=0;m.hiddenUntil=0;m.state='active';m.leaving=false;m.entering=m.x<60||m.x>scene.w-60||m.y<60||m.y>scene.h-60;m.targetX=scene.w/2;m.targetY=scene.h/2;m.next=elapsed+2;});}if(cmd.action==='steer'){cancelTouchSounds();clearContacts(contacts);manualUntil=elapsed+2;mice.forEach(m=>{clearHunt(m,elapsed);m.hiddenUntil=0;m.state='active';m.leaving=false;m.entering=m.x<60||m.x>scene.w-60||m.y<60||m.y>scene.h-60;m.restUntil=0;m.targetX=60+cmd.x*Math.max(1,scene.w-120);m.targetY=85+cmd.y*Math.max(1,scene.h-145);m.next=elapsed+2;});}}
function reload(){cancelTouchSounds();clearContacts(contacts);checkpoint();location.reload();}
window.addEventListener('pagehide',()=>{cancelTouchSounds();clearContacts(contacts);checkpoint();preyAudio.stop();});window.addEventListener('beforeunload',()=>{cancelTouchSounds();clearContacts(contacts);checkpoint();});setInterval(checkpoint,2000);
async function poll(){if(pollBusy||document.hidden)return;pollBusy=true;try{const data=await request(room?`/api/rooms/${room}`:'/api/version');if(version&&data.version!==version){reload();return;}version=data.version;networkFailures=0;if(room){if(data.revision!==revision){revision=data.revision;for(const key of Object.keys(localSettings))if(data.settings[key]===localSettings[key])delete localSettings[key];Object.assign(config,settingsDefaults,upgradeSettings(data.settings),localSettings);sync();applyCommands(data.command);}$('networkStatus').textContent='Paired · live settings and automatic updates';$('connection').textContent='Companion ready';if(Date.now()-telemetryAt>1000){telemetryAt=Date.now();await request(`/api/rooms/${room}/telemetry`,{playing,catches,elapsed,mouse:mice.map(m=>({x:m.x/scene.w,y:m.y/scene.h,visible:m.state!=='away'&&m.hiddenUntil<=elapsed&&m.x>-50*config.size&&m.x<scene.w+50*config.size&&m.y>-50*config.size&&m.y<scene.h+50*config.size}))});}}}catch(error){if(room&&error.status===404&&(error.path===`/api/rooms/${room}`||error.path===`/api/rooms/${room}/telemetry`)){clearPairing();return;}networkFailures++;$('networkStatus').textContent='Reconnecting… game continues locally';$('connection').textContent='Reconnecting';}finally{pollBusy=false;}}
setInterval(poll,400);commandSeen=read('mouse-command',{});if(typeof commandSeen!=='object')commandSeen={};showCode();sync();poll();
const resume=read('mouse-resume',null);if(resume&&Date.now()-resume.at<60000&&resume.playing){start();catches=resume.catches;elapsed=resume.elapsed;$('score').textContent=`${catches} hits`;checkpoint();}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!document.hidden&&scene&&preview){if(!playing){if($('game').hidden&&renderDue(previewCadence,now,30)){const t=now/1000;Object.assign(previewMouse,{x:preview.w*.56,y:preview.h*.5,angle:Math.sin(t*.2)*.25-.5});preview.render([previewMouse],{...config,size:2.1},t);}}else{elapsed+=dt;renderDt+=dt;updateContacts(contacts,elapsed,mice);for(const m of mice){if((m.tossUntil||0)>elapsed)continue;const manual=config.mode==='manual'||elapsed<manualUntil;if(updateHunt(m,config,elapsed,scene.w,scene.h,manual,Math.random,huntDirector))continue;if(!updateLifecycle(m,elapsed,scene.w,scene.h,config.size,config.hide,Math.random,config)){m.moving=false;continue;}if(m.leaving||m.entering||m.state==='hurt')continue;if(!manual&&elapsed>=m.next){if(Math.random()<(config.hide?.24:.13)){sendOffscreen(m,elapsed,scene.w,scene.h,config.size);continue;}m.targetX=65+Math.random()*Math.max(1,scene.w-130);m.targetY=90+Math.random()*Math.max(1,scene.h-160);m.restUntil=config.mode==='stalk'?elapsed+.4+Math.random()*1.8:elapsed;m.next=elapsed+(config.mode==='scurry'?.35+Math.random()*.75:2+Math.random()*3);}}stepMice(mice,config,elapsed,dt,scene.w,scene.h,contacts.obstacles.values());for(const m of mice)updateIdleBehavior(m,elapsed,config);preyAudio.update(mice,elapsed,scene.w,scene.h);syncAudio();if(renderDue(gameCadence,now,60)){scene.render(mice,config,elapsed,renderDt);renderDt=0;}$('gameHint').style.opacity=Math.max(0,1-(elapsed-3)/2);}}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
// Read-only diagnostics for device validation and companion support.
window.mouseDiagnostics=()=>({playing,catches,elapsed,config:{...config},room,version,mice:mice.map(m=>({...m})),webgl:!!scene,renderer:scene?.diagnostics?.(),previewRenderer:preview?.diagnostics?.(),renderLimits:{game:60,preview:30},audio:preyAudio.diagnostics(),gaits:scene?.models.map(m=>({...m.gait,feet:m.feet.map(f=>({x:f.position.x,z:f.position.z}))}))});
