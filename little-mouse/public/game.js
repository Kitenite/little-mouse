import{ExperimentSession}from'./experiment-session.js';
import{createExperimentControls}from'./experiment-controls.js';
import{upgradePlayStyle}from'./settings-migration.js';
import{createOwnerGesture}from'./owner-gesture.js';
import{createContacts,recordPointer,removePointer,classifyContact,beginContact,moveContact,updateContacts,endContact,cancelContact,clearContacts}from'./contact.js';
import{updateIdleBehavior}from'./idle-animation.js';
import{settingsDefaults}from'./settings.js';
import{createSettingsControls}from'./controls.js';
import{applyBackground}from'./backgrounds.js';
import{PreyAudio,audioDefaults}from'./audio.js';
import{huntDefaults,updateHunt,createHuntDirector,rememberTouch}from'./enrichment.js';
import{MouseScene}from'./mouse3d.js';
import{sendOffscreen,pressMouse,updateLifecycle}from'./behavior.js';
import{upgradeSettings,stepMice,flee,radius}from'./physics.js';
if(window.mouseBoot&&window.mouseBoot.state!=='loading')throw Error('Startup cancelled; retry loading the game');
const $=id=>document.getElementById(id),defaults=settingsDefaults;
let bootFailed=false;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const persist=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const savedSettings=read('little-mouse',{});
const config=upgradePlayStyle(upgradeSettings({...defaults,...savedSettings}),savedSettings);let playing=false,mice=[],catches=0,elapsed=0,last=0,wake=null,version='',versionBusy=false;
// Apply the requested iPad population once, preserving subsequent owner tuning.
if(document.documentElement.dataset.surface==='ipad'&&config.ipadCountVersion!==1){config.count=2;config.ipadCountVersion=1;}
// Retired remote-only mode must not strand previously saved games.
if(config.mode==='manual')config.mode=defaults.mode;
const preyAudio=new PreyAudio({onPlayback:cue=>experiments.event('audio-playback',cue)});
let experimentStorage;try{experimentStorage=localStorage;}catch{}
const experiments=new ExperimentSession({storage:experimentStorage});
let experimentUI,lastExperimentSample=0,lastExperimentAudio=0,experimentBaseline=null;
function endExperiment(reason){const baseline=experiments.stop(reason);if(baseline)experimentBaseline=baseline;if(experimentBaseline&&(!playing||['owner-ended','new-round','settings-change'].includes(reason))){Object.assign(config,experimentBaseline);experimentBaseline=null;background();controls.sync();}if(baseline)experimentUI?.stopped();return baseline;}

let huntDirector=createHuntDirector();const contacts=createContacts();huntDirector.paws=contacts.obstacles;
const gameCadence={last:null,credit:0},previewCadence={last:null,credit:0};let renderDt=0;
function renderDue(clock,now,hz){if(clock.last===null){clock.last=now;clock.credit=0;return true;}clock.credit+=Math.max(0,now-clock.last);clock.last=now;const interval=1000/hz;if(clock.credit+1e-6<interval)return false;clock.credit=Math.max(0,clock.credit-Math.floor((clock.credit+1e-6)/interval)*interval);return true;}
function resetCadence(){gameCadence.last=previewCadence.last=null;gameCadence.credit=previewCadence.credit=renderDt=0;}
function checkpoint(){if(bootFailed||window.mouseBoot?.recovering)return;persist('mouse-resume',{playing,catches,elapsed,at:Date.now()});}
const previewMouse={hiddenUntil:0,moving:false,state:"active",seed:12};
let preview,scene;try{preview=new MouseScene($('preview'),{preview:true});scene=new MouseScene($('board'));}catch(e){preview?.resizeObserver?.disconnect();preview?.renderer?.dispose();throw e;}
const controls=createSettingsControls($('settingsControls'),{getSettings:()=>config,onTestSound:()=>preyAudio.testSound().then(()=>syncAudio()),onChange:patch=>{endExperiment('settings-change');Object.assign(config,patch);sync();if(patch.sound)unlockAudio();}});
experimentUI=createExperimentControls($('settingsControls'),{recorder:experiments,storage:experimentStorage});
function background(){applyBackground($('game'),config);applyBackground($('preview').parentElement,config);}
function sync(){controls.sync();background();persist('little-mouse',config);syncAudio();if(playing)ensureCount();}
function spawn(){const castIndex=mice.length;const w=scene.w,h=scene.h,r=radius(config.size,w,h);return{castIndex,state:config.mode==='hunt'?'away':'active',x:r+Math.random()*Math.max(1,w-2*r),y:r+Math.random()*Math.max(1,h-2*r),angle:Math.random()*Math.PI*2,targetX:w/2,targetY:h/2,next:elapsed+.6,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,seed:Math.random()*100};}
function ensureCount(){while(mice.length<config.count)mice.push(spawn());mice.length=config.count;}
async function awake(){try{if(playing&&navigator.wakeLock)wake=await navigator.wakeLock.request('screen')}catch{}}
function syncAudio(){preyAudio.configure(config);preyAudio.setState(config.sound,playing&&!document.hidden);$('enableSound').hidden=!playing||!config.sound||preyAudio.ready;const audio=preyAudio.diagnostics();controls.setSoundStatus(`${config.sound?'Sound on':'Muted'} · ${audio.state==='locked'?'tap Test sound to enable':audio.state} · volume ${Math.round(config.soundVolume*100)}%${audio.lastError?' · '+audio.lastError:''}${audio.signalPeak>0?' · signal generated':''}`);}
function unlockAudio(){if(!config.sound)return;preyAudio.unlock().then(()=>syncAudio());}
$('enableSound').addEventListener('click',unlockAudio);
// Native navigation and resumed play are not gestures inside this web document.
// Retry from the actual board touch, including pointerup for iOS activation.
$('board').addEventListener('pointerup',()=>{if(config.sound&&!preyAudio.ready)unlockAudio();});
function start(reset=true,runTrial=false){if(bootFailed||window.mouseBoot?.recovering||!scene)return;
 experimentUI.resetObservation?.();
 let trial=null,audio=null;
 if(runTrial){
  endExperiment('new-round');trial=experimentUI.nextTrial();
  if(trial){
   const alternatives=trial.variants.map(v=>({...config,...v.patch,...(trial.id==='sound-volume'&&v.id==='B'?{soundVolume:config.soundVolume/2}:{})}));
   if(new Set(alternatives.map(v=>JSON.stringify(v))).size!==alternatives.length){experimentUI.message('This comparison matches your current settings. Choose another comparison or adjust the baseline.');return;}
   const textureTrial=['texture-contrast','background-scale','coat-background-2x2'].includes(trial.id);
   if(textureTrial&&['plain','chalk','ink','pale-blue','warm-yellow'].includes(config.background)){experimentUI.message('Choose a textured background before this comparison.');return;}
   if(trial.id==='background-scale'&&config.backgroundContrast===0){experimentUI.message('Texture scale needs visible texture contrast above zero.');return;}
   audio=preyAudio.diagnostics();const banks=audio.loadedBankCounts||{};
   if(trial.requiresAudio&&(!preyAudio.ready||!config.sound||!(config.soundVolume>0)||!(banks.tap>0)||!(banks.squeak>0))){experimentUI.message('Tap Test sound first, then Play. This comparison needs loaded contact and squeak recordings and nonzero volume.');return;}
   if(trial.id==='sound-variety'&&!(banks.tap>2||banks.squeak>2)){experimentUI.message('Sound variety needs more than two loaded contact or squeak recordings. Try Test sound again.');return;}
  }
 }
 // Measure the visible board only after every preflight has passed, before assignment.
 playing=true;document.documentElement.dataset.playing='true';$('home').hidden=true;$('game').hidden=false;scene.resize();
 if(trial){
  const result=experiments.start({trialId:trial.id,settings:config,actor:experimentUI.actor,build:version,device:{width:scene.w,height:scene.h,pixelRatio:globalThis.devicePixelRatio||1,surface:document.documentElement.dataset.surface}});
  Object.assign(config,result.patch);experiments.confirmSettings(config);background();controls.sync();lastExperimentSample=0;lastExperimentAudio=audio.played||0;
  experiments.event('audio-readiness',{required:!!trial.requiresAudio,ready:preyAudio.ready,state:audio.state,loadedBankCounts:audio.loadedBankCounts||{},softwareVolume:config.soundVolume,physicalAudibility:'unknown'});
  experiments.event('visibility-method',{method:'viewport-circle-intersection-approximation',radiusPx:radius(config.size,scene.w,scene.h),partialIntersectionCounts:true,pixelSilhouetteVerified:false});
  experimentUI.started();
 }
 if(reset){cancelTouchSounds();clearContacts(contacts);preyAudio.reset();elapsed=0;catches=0;mice=[];huntDirector=createHuntDirector();huntDirector.paws=contacts.obstacles;scene.clearEffects();}ensureCount();syncAudio();resetCadence();checkpoint();$('score').textContent=`${catches} hits`;awake();}
function pause(){endExperiment('owner-ended');cancelTouchSounds();clearContacts(contacts);playing=false;syncAudio();checkpoint();resetCadence();document.documentElement.dataset.playing='false';clearHold();$('game').hidden=true;$('home').hidden=false;wake?.release().catch(()=>{});wake=null;preview?.resize();}

// Keep multi-touch play on the board from zooming or scrolling the page.
for(const type of ['gesturestart','gesturechange','touchmove'])$('game').addEventListener(type,e=>e.preventDefault(),{passive:false});
$('tabletSettings').addEventListener('toggle',()=>preview?.resize());
$('start').addEventListener('click',async()=>{const button=$('start');button.disabled=true;try{const trial=experimentUI.nextTrial();if(config.sound||trial?.requiresAudio){await preyAudio.unlock();if(trial?.requiresAudio)await preyAudio.loadSamples(true);}start(true,true);}catch(error){recoverBoot(error,'start');}finally{if(!bootFailed)button.disabled=false;}});
const ownerGesture=createOwnerGesture(),ownerPointers=new Set();
function clearHold(){ownerGesture.cancel();ownerPointers.clear();}
$('board').addEventListener('pointerdown',e=>{ownerPointers.add(e.pointerId);const r=$('board').getBoundingClientRect();ownerGesture.down(e.pointerId,e.clientX-r.left,e.clientY-r.top,r.width,r.height,performance.now()/1000,ownerPointers.size===1);});
$('board').addEventListener('pointerup',e=>{const r=$('board').getBoundingClientRect();ownerPointers.delete(e.pointerId);if(ownerGesture.up(e.pointerId,e.clientX-r.left,e.clientY-r.top,r.width,r.height,performance.now()/1000))pause();});
$('board').addEventListener('pointercancel',clearHold);$('board').addEventListener('lostpointercapture',e=>{if(ownerPointers.has(e.pointerId))clearHold();});
window.addEventListener('blur',clearHold);document.addEventListener('keydown',e=>{if(e.key==='Escape')pause();});
function boardPoint(e){const r=$('board').getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
const touchSounds=new Map(),experimentPointers=new Set();
// All corner-origin touches are excluded, including genuine cat touches. This
// deliberately avoids attributing any part of the owner's exit gesture to a cat.
function admitExperimentPointer(e,x,y){
 experimentPointers.delete(e.pointerId); // Pointer IDs can be reused after up/cancel.
 const {width:w,height:h}=$('board').getBoundingClientRect(),r=Math.min(58,w*.12,h*.12);
 if((x<r||x>w-r)&&(y<r||y>h-r))experiments.event('contact-excluded',{pointerId:e.pointerId,reason:'corner-origin-owner-gesture-zone',x,y});
 else experimentPointers.add(e.pointerId);
}
function recordExperimentContact(payload){if(experimentPointers.has(payload.pointerId))experiments.contact(payload);}
// A circle/viewport intersection is an explicit proximity approximation, not a
// rendered silhouette test. Partial circles count; tail/pose/occlusion are unmeasured.
function experimentMouseVisible(m,time,w,h,size){
 if(m.state==='away'||!(m.hiddenUntil<=time)||!Number.isFinite(m.x)||!Number.isFinite(m.y)||!(w>0&&h>0))return false;
 const r=radius(size,w,h),dx=Math.max(0,-m.x,m.x-w),dy=Math.max(0,-m.y,m.y-h);
 return dx*dx+dy*dy<r*r;
}
function cancelTouchSound(id){const mouse=touchSounds.get(id);if(mouse)preyAudio.cancelContactFeedback(mouse,id,{cancelHold:contacts.get(id)?.m===mouse});touchSounds.delete(id);}
function cancelTouchSounds(){experimentPointers.clear();for(const id of touchSounds.keys())cancelTouchSound(id);}
function finishContact(e){const p=boardPoint(e);recordExperimentContact({pointerId:e.pointerId,phase:'up',...p});touchSounds.delete(e.pointerId);const result=endContact(contacts,e.pointerId,elapsed,scene.w,scene.h,config.size,config);if(result)applyContactOutcome(result,e.pointerId);experimentPointers.delete(e.pointerId);}
function applyContactOutcome(result,pointerId){if(experimentPointers.has(pointerId))experiments.outcome({pointerId,outcome:result.outcome});const {mouse:m,outcome,x,y}=result;touchSounds.delete(pointerId);catches++;if(outcome!=='harmless'&&outcome!=='tossed')scene.splatter(x,y,config.size,m.angle,elapsed);preyAudio.hit(m,scene.w,outcome,pointerId);$('score').textContent=`${catches} ${catches===1?'hit':'hits'}`;}
$('board').addEventListener('pointerdown',e=>{e.preventDefault();if(!playing)return;const {x,y}=boardPoint(e);if(!recordPointer(contacts,e.pointerId,x,y,elapsed,e.width,e.height))return;admitExperimentPointer(e,x,y);try{$('board').setPointerCapture(e.pointerId);}catch{}rememberTouch(huntDirector,x,y,elapsed,scene.w,scene.h);
 const eligible=mice.filter(m=>!m.hold&&m.hiddenUntil<=elapsed&&m.state!=='away'&&m.state!=='defeated');
 let hit=scene.contactAt?.(mice,x,y,config.size,{includeUnclaimable:true});
 if(!scene.contactAt){for(const m of mice){if(m.hiddenUntil>elapsed||m.state==='away')continue;const part=classifyContact(m,x,y,config.size);if(part){hit={mouse:m,...part};break;}}}
 recordExperimentContact({pointerId:e.pointerId,phase:'down',x,y,mouseId:hit?.mouse?.identity?.id??null,region:hit?.part??null,outcome:null});
 if(hit){touchSounds.set(e.pointerId,hit.mouse);preyAudio.contactFeedback(hit.mouse,scene.w,'touch',e.pointerId);}
 else if(config.sound&&!preyAudio.ready)unlockAudio();
 if(hit&&beginContact(contacts,hit.mouse,hit,e.pointerId,x,y,elapsed,config,config.size)){try{$('board').setPointerCapture(e.pointerId);}catch{}}
 else if(config.mode!=='hunt')for(const m of eligible)flee(m,x,y,elapsed,scene.w,scene.h,config.size);
});
$('board').addEventListener('pointermove',e=>{if(!contacts.paws.has(e.pointerId))return;e.preventDefault();const {x,y}=boardPoint(e);recordExperimentContact({pointerId:e.pointerId,phase:'move',x,y});recordPointer(contacts,e.pointerId,x,y,elapsed,e.width,e.height);moveContact(contacts,e.pointerId,x,y,config.size,elapsed);});
$('board').addEventListener('pointerup',e=>{if(playing)finishContact(e);else removePointer(contacts,e.pointerId);});
for(const type of ['pointercancel','lostpointercapture'])$('board').addEventListener(type,e=>{recordExperimentContact({pointerId:e.pointerId,phase:'cancel'});experimentPointers.delete(e.pointerId);cancelTouchSound(e.pointerId);removePointer(contacts,e.pointerId);});
window.addEventListener('pointerup',e=>{if(playing&&contacts.paws.has(e.pointerId))finishContact(e);});
window.addEventListener('pointercancel',e=>{recordExperimentContact({pointerId:e.pointerId,phase:'cancel'});experimentPointers.delete(e.pointerId);cancelTouchSound(e.pointerId);removePointer(contacts,e.pointerId);});
window.addEventListener('blur',()=>{endExperiment('blur');cancelTouchSounds();clearContacts(contacts);});
window.addEventListener('resize',()=>{endExperiment('resize');cancelTouchSounds();clearContacts(contacts);preview?.resize();if(playing)scene?.resize();});document.addEventListener('visibilitychange',()=>{if(document.hidden)endExperiment('background');cancelTouchSounds();clearContacts(contacts);checkpoint();syncAudio();last=0;resetCadence();clearHold();if(!document.hidden){awake();checkVersion();}});
function reload(){endExperiment('asset-reload');cancelTouchSounds();clearContacts(contacts);checkpoint();location.reload();}
window.addEventListener('pagehide',()=>{endExperiment('pagehide');cancelTouchSounds();clearContacts(contacts);checkpoint();preyAudio.stop();});window.addEventListener('beforeunload',()=>{endExperiment('unload');cancelTouchSounds();clearContacts(contacts);checkpoint();});setInterval(checkpoint,2000);
// Read-only asset fingerprint: never accepts gameplay state or commands.
async function checkVersion(){
 if(bootFailed||window.mouseBoot?.recovering||versionBusy||document.hidden)return;
 versionBusy=true;
 try{
  const response=await fetch('/api/version',{cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return;
  const data=await response.json();
  if(bootFailed||window.mouseBoot?.recovering||typeof data.version!=='string'||!data.version)return;
  if(version&&data.version!==version){reload();return;}
  version=data.version;
 }catch{/* Offline play continues with locally saved settings. */}
 finally{versionBusy=false;}
}
setInterval(checkVersion,1000);sync();checkVersion();
function canResume(saved){return saved?.playing===true&&Number.isSafeInteger(saved.catches)&&saved.catches>=0&&Number.isFinite(saved.elapsed)&&saved.elapsed>=0&&saved.elapsed<=Number.MAX_SAFE_INTEGER&&Number.isFinite(saved.at)&&Date.now()-saved.at>=0&&Date.now()-saved.at<60000;}
const resume=read('mouse-resume',null);if(canResume(resume)){start();catches=resume.catches;elapsed=resume.elapsed;$('score').textContent=`${catches} hits`;checkpoint();}else if(resume)persist('mouse-resume',null);
function frame(now){if(bootFailed||window.mouseBoot?.recovering)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!document.hidden&&scene&&preview){if(!playing){if($('game').hidden&&renderDue(previewCadence,now,30)){const t=now/1000;Object.assign(previewMouse,{x:preview.w*.56,y:preview.h*.5,angle:Math.sin(t*.2)*.25-.5});preview.render([previewMouse],{...config,size:2.1},t);}}else{elapsed+=dt;renderDt+=dt;experiments.tick({dt,visibleCount:mice.filter(m=>experimentMouseVisible(m,elapsed,scene.w,scene.h,config.size)).length,mouseCount:mice.length,playing:true});for(const result of updateContacts(contacts,elapsed,mice))applyContactOutcome(result,result.pointerId);for(const m of mice){if((m.tossUntil||0)>elapsed)continue;const manual=config.mode==='manual';if(updateHunt(m,config,elapsed,scene.w,scene.h,manual,Math.random,huntDirector))continue;if(!updateLifecycle(m,elapsed,scene.w,scene.h,config.size,config.hide,Math.random,config)){m.moving=false;continue;}if(m.leaving||m.entering||m.state==='hurt')continue;if(!manual&&elapsed>=m.next){if(Math.random()<(config.hide?.24:.13)){sendOffscreen(m,elapsed,scene.w,scene.h,config.size);continue;}m.targetX=65+Math.random()*Math.max(1,scene.w-130);m.targetY=90+Math.random()*Math.max(1,scene.h-160);m.restUntil=config.mode==='stalk'?elapsed+.4+Math.random()*1.8:elapsed;m.next=elapsed+(config.mode==='scurry'?.35+Math.random()*.75:2+Math.random()*3);}}stepMice(mice,config,elapsed,dt,scene.w,scene.h,contacts.obstacles.values());for(const m of mice)updateIdleBehavior(m,elapsed,config);preyAudio.update(mice,elapsed,scene.w,scene.h);syncAudio();if(elapsed-lastExperimentSample>=1){lastExperimentSample=elapsed;experiments.event('behavior-sample',{mice:mice.map(m=>({id:m.identity?.id,phase:m.hunt?.phase,state:m.state,x:m.x,y:m.y,angle:m.angle,held:!!m.hold}))});const a=preyAudio.diagnostics();if(a.played!==lastExperimentAudio){experiments.event('audio-sample',{played:a.played,lastPlayed:a.last,unavailable:a.unavailableKind,ready:a.state==='running'});lastExperimentAudio=a.played;}}if(renderDue(gameCadence,now,60)){scene.render(mice,config,elapsed,renderDt);renderDt=0;}$('gameHint').style.opacity=Math.max(0,1-(elapsed-3)/2);}}requestAnimationFrame(runFrame);}
requestAnimationFrame(runFrame);
// Read-only diagnostics for local device validation.
window.mouseDiagnostics=()=>({experiments:experiments.diagnostics(),playing,recovering:bootFailed||!!window.mouseBoot?.recovering,catches,elapsed,config:{...config},version,mice:mice.map(m=>({...m})),webgl:!!scene,renderer:scene?.diagnostics?.(),previewRenderer:preview?.diagnostics?.(),renderLimits:{game:60,preview:30},audio:preyAudio.diagnostics(),gaits:scene?.models?.map(m=>({...m.gait,feet:m.feet.map(f=>({x:f.position.x,z:f.position.z}))}))});

// A failed render/context must not leave a visible but inert play surface.
function stopForRecovery(){
 if(bootFailed)return;
 endExperiment('recovery');
 try{checkpoint();}catch(error){console.error(error);}
 bootFailed=true;playing=false;document.documentElement.dataset.playing='false';
 // Recovery remains actionable even if one browser resource refuses cleanup.
 for(const cleanup of [()=>cancelTouchSounds(),()=>clearContacts(contacts),()=>clearHold(),()=>preyAudio.setState(config.sound,false),()=>preyAudio.stop(),()=>wake?.release().catch(()=>{})])try{cleanup();}catch(error){console.error(error);}
 wake=null;
}
function recoverBoot(error,reason='runtime'){if(window.mouseBoot)window.mouseBoot.fail(error,false,reason);else stopForRecovery();}
function runFrame(now){try{frame(now);}catch(error){recoverBoot(error,'runtime-frame');}}
window.mouseStopForRecovery=stopForRecovery;
for(const canvas of [$('preview'),$('board')])canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();recoverBoot(Error('Graphics context lost'),'context-loss');});
