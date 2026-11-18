import{MouseScene}from'./mouse3d.js';
import{createSettingsControls}from'./controls.js';
import{applyBackground}from'./backgrounds.js';
import{PreyAudio}from'./audio.js';
import{sampleBanks}from'./audio-samples.js';
import{PlaygroundSimulation,LAB_STEP}from'./playground-simulation.js';
const $=id=>document.getElementById(id),board=$('labBoard');
const scopedStorage={getItem:key=>localStorage.getItem('little-mouse-playground:'+key),setItem:(key,value)=>localStorage.setItem('little-mouse-playground:'+key,value)};
let saved={};try{saved=JSON.parse(scopedStorage.getItem('settings')||'{}');}catch{}
let scene,sim,controls;const audio=new PreyAudio();let last=0,rendered=0,fpsStart=0,fps=0,lastInspector=-Infinity,auditionUntil=0,lastRender=0,renderDelta=0;
function error(message){$('labError').hidden=false;$('labError').textContent=message;}
try{scene=new MouseScene(board);sim=new PlaygroundSimulation({width:scene.w,height:scene.h,settings:saved});}catch(e){error('Playground could not start: '+e.message);$('labRun').disabled=$('labStep').disabled=true;}
if(scene&&sim){
 controls=createSettingsControls($('labSettings'),{getSettings:()=>sim.config,onChange:patch=>{sim.configure(patch);syncSettings();try{scopedStorage.setItem('settings',JSON.stringify(sim.config));}catch{}},onTestSound:()=>testCue('squeak'),storage:scopedStorage});
 for(const note of $('labSettings').querySelectorAll('.control-note'))if(note.textContent.startsWith('Profiles are saved'))note.textContent='These profiles belong only to the playground. Applying one changes this lab; the paired game is untouched.';
 function syncSettings(){controls.sync();applyBackground($('labSurface'),sim.config);audio.configure(sim.config);syncAudio();syncSelection();}
 function syncAudio(){audio.setState(sim.config.sound,!document.hidden&&(!sim.paused||performance.now()<auditionUntil));const d=audio.diagnostics(),text=`${d.blockedReason||d.state} · ${d.sampleCount}/${d.sampleTotal} recordings · peak ${d.signalPeak.toFixed(3)}${d.lastError?' · '+d.lastError:''}`;$('labAudio').textContent=text;controls.setSoundStatus(text);}
 async function testCue(kind){
  // Unlock must be called on the original local user gesture.
  audio.configure(sim.config);audio.setState(sim.config.sound,!sim.paused);auditionUntil=performance.now()+4000;
  const result=await audio.testSound(kind);syncAudio();return result;
 }
 function syncSelection(){const selection=$('labMouse');if(selection.options.length!==sim.mice.length){selection.replaceChildren(...sim.mice.map((m,i)=>new Option(`Mouse ${i+1} · ${m.identity.id}`,i)));}else sim.mice.forEach((m,i)=>{selection.options[i].textContent=`Mouse ${i+1} · ${m.identity.id}`;});selection.value=sim.selected;}
 for(const kind of Object.keys(sampleBanks))$('labCue').append(new Option(kind,kind));
 $('labPlayCue').addEventListener('click',()=>testCue($('labCue').value).catch(e=>error(e.message)));
 $('labMouse').addEventListener('change',()=>{sim.selected=Number($('labMouse').value);lastInspector=-Infinity;});
 function pause(value){if(value){auditionUntil=0;audio.stop();}sim.setPaused(value);if(value)renderDelta=0;$('labRun').textContent=value?'▶ Run':'Ⅱ Pause';syncAudio();}
 $('labRun').addEventListener('click',()=>{if(sim.paused&&sim.config.sound)audio.unlock();pause(!sim.paused);});
 $('labStep').addEventListener('click',()=>{pause(true);sim.advanceOne();render(LAB_STEP);});
 $('labScale').addEventListener('input',e=>{sim.setTimeScale(e.target.value);$('labScaleValue').textContent=sim.timeScale.toFixed(1)+'×';});
 $('labReset').addEventListener('click',()=>{pause(true);sim.reset($('labSeed').value);audio.reset();scene.clearEffects();syncSelection();render(0);$('labStatus').textContent='Seeded cast reset; paused.';});
 for(const[button,layout]of[['labLineup','lineup'],['labScatter','scatter']])$(button).addEventListener('click',()=>{sim.arrange(layout);scene.clearEffects();render(0);});
 $('labScenarios').addEventListener('click',e=>{const action=e.target.dataset.scenario;if(!action)return;sim.force(action,$('labAll').checked);drainEvents();render(0);$('labStatus').textContent=`${action} · ${$('labAll').checked?'all mice':'mouse '+(sim.selected+1)} · ${sim.paused?'paused; step or run':'running'}`;});
 $('labClearPaws').addEventListener('click',()=>{sim.clearPaws();render(0);});
 function point(e){const r=board.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 board.addEventListener('pointerdown',e=>{e.preventDefault();const{x,y}=point(e);if($('labPlacePaw').checked){sim.placePaw(x,y,Math.max(10,Math.min(150,Number($('labPawSize').value)||45)));render(0);return;}if(sim.config.sound)audio.unlock();const hit=scene.contactAt?.(sim.mice,x,y,sim.config.size);sim.pointerDown(e.pointerId,x,y,e.width,e.height,scene.contactAt?hit:undefined);board.setPointerCapture(e.pointerId);syncSelection();});
 board.addEventListener('pointermove',e=>{if(!sim.contacts.paws.has(e.pointerId))return;e.preventDefault();const{x,y}=point(e);sim.pointerMove(e.pointerId,x,y,e.width,e.height);});
 board.addEventListener('pointerup',e=>{sim.pointerUp(e.pointerId);drainEvents();render(0);});
 for(const type of ['pointercancel','lostpointercapture'])board.addEventListener(type,e=>sim.cancelPointer(e.pointerId));
 function cancelTouches(){for(const id of [...sim.contacts.paws.keys()])if(typeof id==='number')sim.cancelPointer(id);}
 window.addEventListener('blur',()=>{cancelTouches();pause(true);});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelTouches();pause(true);}syncAudio();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape')pause(true);});
 window.addEventListener('pagehide',()=>{audio.stop();sim.clearPaws();});
 function drainEvents(){for(const event of sim.events.splice(0)){if(event.outcome!=='harmless'&&event.outcome!=='tossed')scene.splatter(event.x,event.y,sim.config.size,event.mouse.angle,sim.time);audio.hit(event.mouse,sim.width,event.outcome);}}
 function render(dt){scene.resize();sim.resize(scene.w,scene.h);drainEvents();scene.render(sim.mice,sim.config,sim.time,dt);const markers=[];for(const p of sim.contacts.obstacles.values()){const marker=document.createElement('div');marker.className='lab-marker'+(p.recent?' recent':'');Object.assign(marker.style,{left:p.x+'px',top:p.y+'px',width:Math.max(12,p.radius*2)+'px',height:Math.max(12,p.radius*2)+'px'});markers.push(marker);}const m=sim.mice[sim.selected];if(m&&m.state!=='away'&&m.hiddenUntil<=sim.time){const marker=document.createElement('div');marker.className='lab-selected';marker.textContent='Mouse '+(sim.selected+1);Object.assign(marker.style,{left:m.x+'px',top:(m.y+38*sim.config.size)+'px'});markers.push(marker);}$('labOverlay').replaceChildren(...markers);}
 function inspect(now){if(now-lastInspector<200)return;lastInspector=now;syncSelection();syncAudio();const m=sim.snapshot().mice[sim.selected],diagnostic=scene.diagnostics();$('labClock').textContent=`${sim.time.toFixed(3)} s · frame ${sim.frames}`;$('labMetrics').textContent=`${fps.toFixed(0)} render fps · ${sim.mice.length} mice · ${diagnostic.render.calls} draws · ${Math.round(diagnostic.render.triangles/1000)}k triangles · ${sim.hits} hits`;$('labState').textContent=JSON.stringify({...m,x:Math.round(m.x*10)/10,y:Math.round(m.y*10)/10,angle:Math.round(m.angle*100)/100,hold:sim.mice[sim.selected].hold?.part,paws:sim.contacts.obstacles.size},null,2);}
 function frame(now){const wall=last?Math.min(.25,(now-last)/1000):0;last=now;if(!document.hidden){const advanced=sim.tick(wall);renderDelta+=advanced;if(advanced>0)audio.update(sim.mice,sim.time,sim.width,sim.height);const interval=1000/(sim.paused?30:60);if(now-lastRender>=interval-.1){render(renderDelta);renderDelta=0;lastRender=now;rendered++;}if(now-fpsStart>=1000){fps=rendered*1000/(now-fpsStart);rendered=0;fpsStart=now;}inspect(now);}requestAnimationFrame(frame);}
 const finite=(value,name)=>{if(!Number.isFinite(value))throw Error('Invalid '+name);return value;};
 const pointArgs=(id,x,y)=>[Math.trunc(finite(id,'pointer')),Math.max(0,Math.min(sim.width,finite(x,'x'))),Math.max(0,Math.min(sim.height,finite(y,'y')))];
 window.playgroundDrive=Object.freeze({pause(value=true){pause(value);return sim.snapshot();},step(count=1){if(!Number.isInteger(count)||count<1||count>600)throw Error('Step count must be 1–600');pause(true);for(let i=0;i<count;i++)sim.advanceOne();render(count*LAB_STEP);return sim.snapshot();},select(index){if(!Number.isInteger(index)||index<0||index>=sim.mice.length)throw Error('Invalid mouse index');sim.selected=index;syncSelection();return sim.snapshot();},force(action,all=false){sim.force(action,all===true);drainEvents();render(0);return sim.snapshot();},reset(seed=sim.seed){finite(seed,'seed');pause(true);sim.reset(seed);audio.reset();scene.clearEffects();syncSelection();render(0);return sim.snapshot();},configure(patch){sim.configure(patch);syncSettings();render(0);return sim.snapshot();},pointerDown(id,x,y){const args=pointArgs(id,x,y);const hit=scene.contactAt?.(sim.mice,args[1],args[2],sim.config.size);sim.pointerDown(...args,0,0,scene.contactAt?hit:undefined);return sim.snapshot();},pointerMove(id,x,y){sim.pointerMove(...pointArgs(id,x,y));return sim.snapshot();},pointerUp(id){sim.pointerUp(Math.trunc(finite(id,'pointer')));drainEvents();render(0);return sim.snapshot();},placePaw(x,y,radius=45){finite(radius,'radius');const[,px,py]=pointArgs(0,x,y);sim.placePaw(px,py,Math.max(10,Math.min(150,radius)));render(0);return sim.snapshot();},clearPaws(){sim.clearPaws();render(0);return sim.snapshot();}});
 window.playgroundDiagnostics=()=>({...sim.snapshot(),paused:sim.paused,timeScale:sim.timeScale,config:{...sim.config},renderer:scene.diagnostics(),audio:audio.diagnostics(),fps});
 syncSettings();render(0);requestAnimationFrame(frame);
}
