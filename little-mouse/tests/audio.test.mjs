import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PreyAudio,createLimiterCurve} from '../public/audio.js';
import{recordedSamples,sampleBanks,sampleTrim}from'../public/audio-samples.js';
class Param {
  value=0;
  setValueAtTime(value,time){assert.ok(Number.isFinite(value)&&Number.isFinite(time));this.value=value;}
  linearRampToValueAtTime(value,time){this.setValueAtTime(value,time);}
  exponentialRampToValueAtTime(value,time){assert.ok(value>0);this.setValueAtTime(value,time);}
}
class Node {
  gain=new Param();frequency=new Param();Q=new Param();pan=new Param();playbackRate=new Param();
  connect(){} disconnect(){this.disconnected=true;} start(time=0){this.startAt=time;} stop(time){this.stopAt=time;if(time===undefined)this.onended?.();}
}
class Context {
  state='suspended';currentTime=0;sampleRate=1000;destination={};sources=[];
  resume(){this.state='running';this.onstatechange?.();return Promise.resolve();}
  createGain(){return new Node();}createWaveShaper(){return new Node();}createStereoPanner(){return new Node();}createBiquadFilter(){return new Node();}
  createBuffer(_channels,size){return {getChannelData:()=>new Float32Array(size)};}
  createBufferSource(){const node=new Node();this.sources.push(node);return node;}
  createOscillator(){return this.createBufferSource();}
  advance(time){this.currentTime=time;for(const source of this.sources)if(source.stopAt<=time)source.onended?.();}
}
const setup=()=>{const context=new Context(),audio=new PreyAudio({contextFactory:()=>context,rng:()=>.5});for(const id of recordedSamples)audio.sampleBuffers.set(id,{duration:.3});return{context,audio};};
test('remote start cannot bypass the gesture gate; local unlock enables sound',async()=>{
  const {audio}=setup();audio.setState(true,true);
  assert.equal(audio.cue('peek'),false);assert.equal(audio.diagnostics().state,'locked');
  assert.equal(await audio.unlock(),true);assert.equal(audio.cue('peek'),true);
});
test('all recorded sound families schedule finite short voices and avoid immediate repeats',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  let time=0;
  for(const kind of Object.keys(sampleBanks)){
    context.advance(time+=1);assert.equal(audio.cue(kind,.2),true);const first=audio.lastPlayed.variant;
    context.advance(time+=1);assert.equal(audio.cue(kind,.8),true);assert.notEqual(audio.lastPlayed.variant,first);
    for(const source of context.sources.filter(s=>s.stopAt!==undefined))assert.ok(source.stopAt-source.startAt<=.7);
  }
  context.advance(time+1);assert.equal(audio.voices.size,0);
});
test('multi-touch spam and a large cast cannot build an unbounded chorus',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  for(let i=0;i<100;i++)audio.cue('hit');assert.equal(audio.played,1);
  // Advance clock without delivering ended events to exercise the actual cap.
  for(let i=1;i<20;i++){context.currentTime=i;audio.cue('hit');}
  assert.equal(audio.voices.size,3);assert.equal(audio.played,3);
});
test('mute/pause/background stops already scheduled phrases immediately',async()=>{
  for(const [enabled,active] of [[false,true],[true,false]]){
    const {audio}=setup();audio.setState(true,true);await audio.unlock();audio.cue('patter');
    assert.equal(audio.voices.size,1);audio.setState(enabled,active);
    assert.equal(audio.voices.size,0);assert.equal(audio.cue('hit'),false);
  }
});
test('concealed mice rustle occasionally, active transitions get specific cues',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const mouse={x:0,state:'away',hunt:{phase:'hidden'},moving:false};
  audio.update([mouse],0,1000);assert.equal(audio.played,0);
  context.advance(1.1);audio.update([mouse],1.1,1000);assert.equal(audio.lastPlayed.kind,'rustle');
  context.advance(2);audio.update([mouse],2,1000);assert.equal(audio.played,1);
  mouse.state='active';mouse.hunt.phase='peek';context.advance(3);audio.update([mouse],3,1000);assert.equal(audio.lastPlayed.kind,'peek');
  mouse.hunt.phase='dart';context.advance(4);audio.update([mouse],4,1000);assert.equal(audio.lastPlayed.kind,'patter');
  mouse.hunt.phase='retreat';context.advance(5);audio.update([mouse],5,1000);assert.equal(audio.lastPlayed.kind,'retreat');
});
test('interruption can be recovered by another gesture without a stale voice backlog',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();audio.cue('patter');
  context.state='interrupted';context.onstatechange();assert.equal(audio.voices.size,0);assert.equal(audio.cue('hit'),false);
  context.advance(2);await audio.unlock();assert.equal(audio.cue('squeak'),true);
  audio.reset();assert.equal(audio.voices.size,0);assert.equal(audio.lastCue,-Infinity);
});

test('social calls require two nearby visible mice; reply rechecks visibility',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const mice=[{x:100,y:100,state:'active',hunt:{phase:'watch'}},{x:190,y:100,state:'active',hunt:{phase:'watch'}}];
  audio.update(mice,0,1000,700);
  // Silence incidental cues to isolate the proximity gate.
  for(const mouse of mice)audio.observations.get(mouse).next=100;
  context.advance(5);audio.update(mice,5,1000,700);assert.equal(audio.lastPlayed.kind,'call');
  context.advance(6);audio.update(mice,6,1000,700);assert.equal(audio.lastPlayed.kind,'reply');
  context.advance(15);audio.update(mice,15,1000,700);assert.equal(audio.lastPlayed.kind,'call');
  const played=audio.played;mice[1].state='away';context.advance(16);audio.update(mice,16,1000,700);assert.equal(audio.played,played);
});
test('nibble sound requires the explicit visible nibbling animation contract',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'}};
  audio.update([mouse],0,1000,700);assert.equal(audio.played,0);
  mouse.nibblingUntil=3;context.advance(.5);audio.update([mouse],.5,1000,700);assert.equal(audio.lastPlayed.kind,'nibble');
  const played=audio.played;context.advance(.6);audio.update([mouse],.6,1000,700);assert.equal(audio.played,played);
});
test('numeric sound settings clamp invalid values, volume zero mutes, activity controls spacing',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  audio.configure({soundVolume:-1,soundFrequency:100});assert.equal(audio.settings.soundVolume,0);assert.equal(audio.settings.soundFrequency,2);assert.equal(audio.cue('squeak'),false);
  audio.configure({soundVolume:1,soundFrequency:.25});assert.equal(audio.master.gain.value,1.8);
  const mouse={x:0,y:0,state:'away',hunt:{phase:'hidden'}};
  audio.update([mouse],0,1000,700);context.advance(2);audio.update([mouse],2,1000,700);
  assert.ok(audio.observations.get(mouse).next>=12);
  audio.configure({soundVolume:NaN,soundFrequency:Infinity});assert.equal(audio.settings.soundVolume,.7);assert.equal(audio.settings.soundFrequency,1);
});

test('harmless contacts choose soft reactions instead of injury sounds',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  for(const [reaction,kind] of [['flinch','tap'],['freeze','sniff'],['dodge','dodge']]){
    context.advance(context.currentTime+1);audio.hit({x:100,reaction},1000,'harmless');assert.equal(audio.lastPlayed.kind,kind);
  }
  context.advance(4);audio.hit({x:100,reaction:'limp'},1000,'hurt');assert.equal(audio.lastPlayed.kind,'hurt');
});

test('explicit local Test sound plays while paused without resuming the game',async()=>{
  const {audio}=setup();audio.setState(true,false);
  const state=await audio.testSound();assert.equal(state.state,'running');assert.equal(state.played,1);
  assert.equal(state.active,false);assert.equal(state.blockedReason,null);assert.equal(state.last.kind,'squeak');
});
test('Test sound reports mute, zero volume, and activation failures explicitly',async()=>{
  const {audio,context}=setup();assert.equal((await audio.testSound()).blockedReason,'muted');
  audio.setState(true,false);audio.configure({soundVolume:0});assert.equal((await audio.testSound()).blockedReason,'volume-zero');
  audio.configure({soundVolume:.7});context.resume=()=>Promise.reject(Error('Activation rejected'));
  const state=await audio.testSound();assert.equal(state.played,0);assert.equal(state.state,'suspended');assert.equal(state.lastError,'Activation rejected');
});
test('diagnostic signal comes from the post-master analyser, not cue counts',async()=>{
  const {audio,context}=setup();context.createAnalyser=()=>Object.assign(new Node(),{getFloatTimeDomainData:data=>{data.fill(0);data[5]=.025;}});
  audio.setState(true,false);const state=await audio.testSound();assert.ok(state.signalPeak>.024&&state.signalPeak<.026);
});

test('output limiter is continuous, monotone, transparent below knee and bounds peaks',()=>{
  const curve=createLimiterCurve();assert.equal(curve.length,2049);
  for(let i=0;i<curve.length;i++){
    assert.ok(Number.isFinite(curve[i])&&Math.abs(curve[i])<.81);
    if(i)assert.ok(curve[i]>=curve[i-1]&&curve[i]-curve[i-1]<.001);
    const input=i/(curve.length-1)*2-1;if(Math.abs(input)<.6)assert.ok(Math.abs(curve[i]-input)<1e-7);
  }
  assert.equal(curve[1024],0);assert.ok(curve[2048]>.79);
});

test('recorded cue selection avoids the same physical sample across neighboring event banks',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();let previous;
 for(const kind of ['peek','squeak','peek','reply','tease','call','hit','hurt','tap','dragstart','dragloop','scratch','dragrelease']){
  context.advance(context.currentTime+1);assert.equal(audio.cue(kind),true);assert.equal(audio.lastPlayed.source,'recording');assert.notEqual(audio.lastPlayed.sample,previous);previous=audio.lastPlayed.sample;
 }
});
test('failed sample loads retain quiet contact fallback and never fake mechanical footsteps',async()=>{
 const context=new Context(),audio=new PreyAudio({contextFactory:()=>context,sampleLoader:async()=>{throw Error('Offline');}});
 audio.setState(true,true);await audio.unlock();await audio.loadSamples();assert.equal(audio.sampleBuffers.size,0);assert.equal(audio.sampleErrors.length,recordedSamples.length);
 assert.equal(audio.cue('patter'),false);assert.equal(audio.cue('dragloop'),false);assert.equal(audio.cue('tap'),true);assert.equal(audio.lastPlayed.source,'quiet-noise-fallback');
});
test('loading accepts available recordings despite individual download failures',async()=>{
 const context=new Context();let inFlight=0,maximum=0;
 const audio=new PreyAudio({contextFactory:()=>context,sampleLoader:async id=>{inFlight++;maximum=Math.max(maximum,inFlight);await Promise.resolve();inFlight--;if(id==='mouse-01')throw Error('404');return{duration:.35};}});
 audio.setState(true,true);await audio.unlock();await audio.loadSamples();assert.equal(audio.sampleBuffers.size,recordedSamples.length-1);assert.equal(audio.sampleErrors.length,1);assert.ok(maximum<=4);assert.equal(audio.cue('peek'),true);assert.notEqual(audio.lastPlayed.sample,'mouse-01');
});
test('drag sounds follow actual anchor motion, releases resolve once, idle mouse has no foot beat',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const m={x:200,y:200,state:'active',moving:false,speed:0,hunt:{phase:'watch'}};
 audio.update([m],0,1000,700);m.hold={active:true,part:'body',anchorVX:0,anchorVY:0};context.advance(1);audio.update([m],1,1000,700);assert.equal(audio.lastPlayed.kind,'dragstart');
 const count=audio.played;context.advance(2);audio.update([m],2,1000,700);assert.equal(audio.played,count);
 m.hold.anchorVX=90;context.advance(3);audio.update([m],3,1000,700);assert.equal(audio.lastPlayed.kind,'dragloop');
 delete m.hold;context.advance(4);audio.hit(m,1000,'tossed');const releaseCount=audio.played;assert.equal(audio.lastPlayed.kind,'dragrelease');audio.update([m],4,1000,700);assert.equal(audio.played,releaseCount);
});
test('supported Safari session requests playback only during activation and preserves app mute',async()=>{
 const session={type:'auto'},context=new Context(),audio=new PreyAudio({contextFactory:()=>context,audioSession:session});audio.setState(false,false);
 assert.equal((await audio.testSound()).blockedReason,'muted');assert.equal(session.type,'auto');audio.setState(true,false);await audio.unlock();assert.equal(session.type,'playback');
 audio.setState(false,false);assert.equal(audio.cue('hit'),false);
});

test('muting during a paused preview cancels its voice immediately',async()=>{
 const {audio}=setup();audio.setState(true,false);await audio.testSound();assert.equal(audio.voices.size,1);
 audio.setState(false,false);assert.equal(audio.voices.size,0);
});
test('a pending calm reply is cancelled if its mouse is grabbed or injured',async()=>{
 for(const change of [m=>{m.hold={active:true,part:'body'};},m=>{m.injuredUntil=20;},m=>{m.hunt.phase='retreat';}]){
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const a={x:100,y:100,state:'active',hunt:{phase:'watch'}},b={x:180,y:100,state:'active',hunt:{phase:'watch'}};
  audio.update([a,b],0,1000,700);for(const m of [a,b])audio.observations.get(m).next=100;
  context.advance(5);audio.update([a,b],5,1000,700);assert.equal(audio.lastPlayed.kind,'call');change(b);
  context.advance(6);audio.update([a,b],6,1000,700);assert.notEqual(audio.lastPlayed.kind,'reply');assert.equal(audio.pendingReply,null);
 }
});

test('shipped recording files match provenance, have faded endpoints and no near-silent vocal cuts',()=>{
  const base=new URL('../public/assets/audio/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('ATTRIBUTION.json',base)));
  assert.equal(manifest.clips.length,recordedSamples.length);
  let total=0;
  for(const clip of manifest.clips){
    const bytes=readFileSync(new URL(clip.file,base));total+=bytes.length;
    assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    let offset=12,pcm;
    while(offset+8<=bytes.length){const name=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(name==='data'){pcm=bytes.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size%2);}
    assert.ok(pcm?.length>0);let peak=0,sum=0;
    for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
    assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
    assert.ok(peak<=.551);const rms=Math.sqrt(sum/(pcm.length/2));
    if(['mouse','rat'].includes(clip.source))assert.ok(rms>.03,`${clip.id} vocal cut is too quiet: ${rms}`);
    assert.ok(Math.abs(rms-clip.rms)<.00001);
  }
  assert.ok(total<600000);
  assert.deepEqual(new Set(Object.values(sampleBanks).flat()),new Set(recordedSamples));
});

test('paused audition selects an event family and repeated impact previews are not rate-suppressed',async()=>{
 const {audio}=setup();audio.setState(true,false);await audio.testSound('hurt');assert.equal(audio.lastPlayed.kind,'hurt');
 const played=audio.played;await audio.testSound('hit');assert.equal(audio.lastPlayed.kind,'hit');assert.equal(audio.played,played+1);
 await audio.testSound('constructor');assert.equal(audio.lastPlayed.kind,'squeak');assert.equal(audio.active,false);
});

test('calm and harmless banks never reuse distress vocals; idle remains nonvocal',async()=>{
  for(const kind of ['peek','tease','call','reply','tap','flinch','dragrelease','groom','facewipe','hindlegscratch','stretch','roll'])assert.ok(sampleBanks[kind].every(id=>id.startsWith('paper-')),kind);
  const {audio,context}=setup();audio.rng=()=>.99;audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'}};
  for(let time=0;time<60;time++){context.advance(time);audio.update([mouse],time,1000,700);if(audio.lastPlayed)assert.ok(audio.lastPlayed.sample.startsWith('paper-'));}
});
test('animated activities cue once on entry with sparse repeats and cancel their own voice on interruption',async()=>{
  for(const [activity,kind] of [['nibble','nibble'],['groom','groom'],['scratch','hindlegscratch'],['stretch','stretch'],['roll','roll']]){
    const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
    const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:activity,at:0,until:4}};
    audio.update([mouse],0,1000,700);assert.equal(audio.lastPlayed.kind,kind);
    const voice=[...audio.voices][0];assert.equal(voice.owner,mouse);
    context.advance(.1);audio.update([mouse],.1,1000,700);assert.equal(audio.played,1);
    mouse.hold={active:true,part:'tail',anchorVX:0,anchorVY:0};
    context.advance(.2);audio.update([mouse],.2,1000,700);assert.equal(audio.voices.has(voice),false);
  }
});
test('activity cues require visible stationary safe animation and do not outlive an expired pose',async()=>{
  for(const patch of [{x:-100},{moving:true},{speed:50},{hunt:{phase:'toss'}},{hunt:{phase:'retreat'}},{hunt:{phase:'watch',fear:.8}},{tossUntil:10},{activity:{kind:'groom',at:2,until:5}},{injuredUntil:10},{startledUntil:10},{hold:{active:false}},{activity:{kind:'groom',at:0,until:0}}]){
    const {audio}=setup();audio.setState(true,true);await audio.unlock();
    const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:'groom',at:0,until:5},...patch};
    audio.update([mouse],0,1000,700);assert.equal([...audio.voices].some(voice=>voice.owner===mouse),false,JSON.stringify(patch));
  }
});

test('rate-limited activity entry retries while the visible pose remains active',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();audio.cue('tap');
  const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:'stretch',at:.1,until:2}};
  context.advance(.1);audio.update([mouse],.1,1000,700);assert.equal(audio.played,1);
  context.advance(.4);audio.update([mouse],.4,1000,700);assert.equal(audio.lastPlayed.kind,'stretch');assert.equal(audio.played,2);
  context.advance(1);audio.update([mouse],1,1000,700);assert.equal(audio.played,2);
});
test('a sounding activity cancels on expiry, removal, offscreen, toss or incompatible phase',async()=>{
  for(const cancel of [m=>m.activity.until=.1,m=>delete m.activity,m=>m.x=-100,m=>m.tossUntil=4,m=>m.hunt.phase='retreat']){
    const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
    const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:'nibble',at:0,until:3},nibblingUntil:3};
    audio.update([mouse],0,1000,700);const voice=[...audio.voices][0];assert.equal(voice.owner,mouse);
    cancel(mouse);context.advance(.2);audio.update([mouse],.2,1000,700);assert.equal(audio.voices.has(voice),false);
    if(mouse.activity||mouse.tossUntil||mouse.x<0||mouse.hunt.phase!=='watch')assert.equal(audio.played,1);
  }
});


test('friction clip trims match RMS within one dB and retain bounded transient gain',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/assets/audio/ATTRIBUTION.json',import.meta.url)));
  const levels=manifest.clips.filter(c=>c.source==='paper').map(c=>{assert.ok(sampleTrim[c.id]>0&&sampleTrim[c.id]<=2);return c.rms*sampleTrim[c.id];});
  assert.ok(20*Math.log10(Math.max(...levels)/Math.min(...levels))<1);
});

test('stopping while an audition awaits recordings prevents delayed playback after pause',async()=>{
 const {audio}=setup();audio.sampleBuffers.clear();let release;
 const pending=new Promise(resolve=>{release=resolve;});audio.sampleLoader=()=>pending;audio.setState(true,false);
 const audition=audio.testSound('roll');await new Promise(resolve=>setImmediate(resolve));audio.stop();release({duration:.3});await audition;
 assert.equal(audio.played,0);assert.equal(audio.voices.size,0);
});
