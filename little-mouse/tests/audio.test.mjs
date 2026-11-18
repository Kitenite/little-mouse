import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PreyAudio,createLimiterCurve} from '../public/audio.js';
import{recordedSamples,sampleBanks,sampleTrim,sampleMix,surfaceFriction}from'../public/audio-samples.js';
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
  const mouse={x:0,y:100,state:'away',hunt:{phase:'hidden'},moving:false};
  audio.update([mouse],0,1000);assert.equal(audio.played,0);
  context.advance(1.1);audio.update([mouse],1.1,1000);assert.equal(audio.lastPlayed.kind,'rustle');
  context.advance(2);audio.update([mouse],2,1000);assert.equal(audio.played,1);
  mouse.state='active';mouse.hunt.phase='peek';context.advance(3);audio.update([mouse],3,1000);assert.equal(audio.lastPlayed.kind,'peek');
  mouse.hunt.phase='dart';context.advance(4);audio.update([mouse],4,1000);assert.equal(audio.lastPlayed.kind,'peek');
  mouse.x+=20;context.advance(4.1);audio.update([mouse],4.1,1000);assert.equal(audio.lastPlayed.kind,'patter');
  mouse.hunt.phase='retreat';context.advance(6);audio.update([mouse],6,1000);mouse.x+=20;context.advance(6.1);audio.update([mouse],6.1,1000);assert.equal(audio.lastPlayed.kind,'retreat');
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

test('harmless contacts choose recorded vocal taps instead of injury sounds',async()=>{
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  for(const [reaction,kind] of [['flinch','tap'],['freeze','tap'],['dodge','tap']]){
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
test('failed sample loads remain silent and expose unavailable recordings',async()=>{
 const context=new Context(),audio=new PreyAudio({contextFactory:()=>context,sampleLoader:async()=>{throw Error('Offline');}});
 audio.setState(true,true);await audio.unlock();await audio.loadSamples();assert.equal(audio.sampleBuffers.size,0);assert.equal(audio.sampleErrors.length,recordedSamples.length);
 assert.equal(audio.cue('patter'),false);assert.equal(audio.cue('dragloop'),false);assert.equal(audio.cue('tap'),false);assert.equal(audio.played,0);assert.equal(context.sources.length,0);assert.equal(audio.diagnostics().blockedReason,'sample-unavailable');
});
test('loading accepts available recordings despite individual download failures',async()=>{
 const context=new Context();let inFlight=0,maximum=0;
 const audio=new PreyAudio({contextFactory:()=>context,sampleLoader:async id=>{inFlight++;maximum=Math.max(maximum,inFlight);await Promise.resolve();inFlight--;if(id==='mouse-01')throw Error('404');return{duration:.35};}});
 audio.setState(true,true);await audio.unlock();await audio.loadSamples();assert.equal(audio.sampleBuffers.size,recordedSamples.length-1);assert.equal(audio.sampleErrors.length,1);assert.ok(maximum<=4);assert.equal(audio.cue('peek'),true);assert.notEqual(audio.lastPlayed.sample,'mouse-01');
});
test('drag sounds require actual displacement, releases resolve once, stationary struggle is silent',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const m={x:200,y:200,state:'active',moving:false,speed:0,hunt:{phase:'watch'}};
 audio.update([m],0,1000,700);m.hold={active:true,part:'body',anchorVX:0,anchorVY:0};context.advance(1);audio.update([m],1,1000,700);assert.equal(audio.played,0);
 const count=audio.played;context.advance(2);audio.update([m],2,1000,700);assert.equal(audio.played,count);
 m.hold.anchorVX=90;context.advance(3);audio.update([m],3,1000,700);assert.equal(audio.played,count);
 m.x+=20;context.advance(3.1);audio.update([m],3.1,1000,700);assert.equal(audio.lastPlayed.kind,'dragloop');
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
  for(const id of recordedSamples)assert.equal(manifest.clips.filter(c=>c.id===id).length,1);
  let total=0;
  for(const clip of manifest.clips){
    const bytes=readFileSync(new URL(clip.file,base));if(recordedSamples.includes(clip.id))total+=bytes.length;
    assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    let offset=12,pcm;
    while(offset+8<=bytes.length){const name=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(name==='data'){pcm=bytes.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size%2);}
    assert.ok(pcm?.length>0);let peak=0,sum=0;
    for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
    assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
    assert.ok(peak<=.551);const rms=Math.sqrt(sum/(pcm.length/2));
    if(['mouse','rat','floor'].includes(clip.source))assert.ok(rms>.03,`${clip.id} vocal cut is too quiet: ${rms}`);
    assert.ok(Math.abs(rms-clip.rms)<.00001);
  }
  assert.ok(total<600000); // Runtime collection excludes archived rat and hamster clips.
  assert.deepEqual(new Set(Object.values(sampleBanks).flat()),new Set(recordedSamples));
});

test('paused audition selects an event family and repeated impact previews are not rate-suppressed',async()=>{
 const {audio}=setup();audio.setState(true,false);await audio.testSound('hurt');assert.equal(audio.lastPlayed.kind,'hurt');
 const played=audio.played;await audio.testSound('hit');assert.equal(audio.lastPlayed.kind,'hit');assert.equal(audio.played,played+1);
 await audio.testSound('constructor');assert.equal(audio.lastPlayed.kind,'squeak');assert.equal(audio.active,false);
});

test('calm idle banks remain nonvocal; explicit touch uses collected vocals',async()=>{
  for(const kind of ['peek','tease','call','reply','flinch','dragrelease','groom','facewipe','hindlegscratch','stretch','roll'])assert.ok(sampleBanks[kind].every(id=>id.startsWith('paper-')),kind);
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

test('each direct touch and harmless outcome bypasses cooldown and ambient congestion',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 for(let i=0;i<3;i++){context.currentTime=i;audio.cue('rustle');}
 const ambient=[...audio.voices];assert.equal(ambient.length,3);
 const mouse={x:100,reaction:'dodge'};
 for(let i=0;i<8;i++){const before=audio.played;assert.equal(audio.contactFeedback(mouse,1000),true);assert.equal(audio.played,before+1);assert.equal(audio.lastPlayed.kind,'tap');assert.equal(audio.lastPlayed.priority,2);assert.ok(audio.voices.size<=3);}
 assert.equal(ambient.some(voice=>audio.voices.has(voice)),false);
 const before=audio.played;assert.equal(audio.hit(mouse,1000,'harmless'),true);assert.equal(audio.played,before);assert.equal(audio.lastPlayed.kind,'tap');
 assert.equal(audio.cue('peek'),false);assert.equal(audio.voices.size,3);
});
test('missing touch vocals queue briefly without synthetic fallback',async()=>{
 const {audio}=setup();audio.sampleBuffers.clear();audio.setState(true,true);await audio.unlock();
 assert.equal(audio.contactFeedback({x:100,reaction:'dodge'},1000,'harmless'),true);
 assert.equal(audio.lastPlayed,null);assert.equal(audio.played,0);assert.equal(audio.pendingContacts.length,1);assert.equal(audio.diagnostics().blockedReason,'sample-unavailable');
});
test('hold friction preempts ambience but cannot steal voices from direct contacts',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hold:{active:true,part:'tail',anchorVX:100,anchorVY:0}};
 for(let i=0;i<3;i++){context.currentTime=i;audio.cue('rustle');}
 audio.update([mouse],2,1000,700);mouse.x+=20;context.currentTime=2.4;audio.update([mouse],2.2,1000,700);assert.equal(audio.lastPlayed.kind,'dragloop');assert.equal(audio.lastPlayed.priority,1);
 for(let i=0;i<3;i++)audio.contactFeedback(mouse,1000);
 const contacts=[...audio.voices],played=audio.played;context.currentTime=3;audio.update([mouse],3,1000,700);
 assert.equal(audio.played,played);assert.ok(contacts.every(v=>audio.voices.has(v)));
});
test('first-gesture feedback survives asynchronous resume, queues bounded contacts and never replays cancelled input',async()=>{
 for(const cancel of [null,a=>a.setState(false,true),a=>a.setState(true,false),a=>a.configure({soundVolume:0}),a=>a.stop()]){
  const {audio,context}=setup();let resume;context.resume=()=>new Promise(resolve=>{resume=()=>{context.state='running';context.onstatechange?.();resolve();};});
  audio.setState(true,true);for(let i=0;i<12;i++)assert.equal(audio.contactFeedback({x:100},1000),true);
  assert.equal(audio.pendingContacts.length,10);assert.equal(audio.played,0);if(cancel)cancel(audio);resume();await Promise.resolve();
  assert.equal(audio.played,cancel?0:10);assert.equal(audio.pendingContacts.length,0);assert.ok(audio.voices.size<=3);
 }
});
test('expired, hidden, muted, zero-volume and paused contacts never start later',async()=>{
 const {audio,context}=setup();audio.setState(true,true);let resume;
 context.resume=()=>new Promise(resolve=>{resume=()=>{context.state='running';resolve();};});audio.contactFeedback({x:0},1000);
 audio.pendingContacts[0].expires=Date.now()-1;resume();await Promise.resolve();assert.equal(audio.played,0);
 for(const [enabled,active,volume] of [[false,true,.7],[true,false,.7],[true,true,0]]){audio.setState(enabled,active);audio.configure({soundVolume:volume});assert.equal(audio.contactFeedback({x:0},1000),false);}
 audio.setState(true,true);audio.configure({soundVolume:.7});const previous=globalThis.document;
 try{globalThis.document={hidden:true};assert.equal(audio.contactFeedback({x:0},1000),false);assert.equal(audio.cue('tap'),false);}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
 assert.equal(audio.played,0);
});

test('an older resume failure cannot cancel a newer gesture waiting to activate',async()=>{
 const {audio,context}=setup();const resumes=[];
 context.resume=()=>new Promise((resolve,reject)=>resumes.push({resolve,reject}));audio.setState(true,true);
 audio.contactFeedback({x:10},1000);audio.contactFeedback({x:20},1000);assert.equal(audio.pendingContacts.length,2);
 resumes[0].reject(Error('earlier activation failed'));await Promise.resolve();assert.equal(audio.pendingContacts.length,2);
 context.state='running';resumes[1].resolve();await Promise.resolve();assert.equal(audio.played,2);assert.equal(audio.lastError,null);
});

test('pointer cancellation removes only that mouse pending feedback before resume',async()=>{
 const {audio,context}=setup();let resume;context.resume=()=>new Promise(resolve=>{resume=()=>{context.state='running';resolve();};});audio.setState(true,true);
 const cancelled={x:50},other={x:100};audio.contactFeedback(cancelled,1000);audio.contactFeedback(other,1000);audio.cancelContactFeedback(cancelled);
 assert.equal(audio.pendingContacts.length,1);resume();await Promise.resolve();assert.equal(audio.played,1);assert.equal([...audio.voices][0].owner,other);
});
test('pointer cancellation stops contact and hold voices without a phantom release',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},hold:{active:true,part:'tail',anchorVX:0,anchorVY:0}};
 audio.contactFeedback(mouse,1000);audio.update([mouse],0,1000,700);assert.equal(audio.voices.size,1);
 audio.cancelContactFeedback(mouse);delete mouse.hold;assert.equal(audio.voices.size,0);assert.equal(audio.observations.get(mouse).held,false);
 const played=audio.played;context.advance(.1);audio.update([mouse],.1,1000,700);assert.equal(audio.played,played);
});
test('interrupting an old idle activity does not cancel new contact feedback for the same mouse',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:'groom',at:0,until:2}};
 audio.update([mouse],0,1000,700);audio.contactFeedback(mouse,1000);delete mouse.activity;
 context.advance(.1);audio.update([mouse],.1,1000,700);assert.ok([...audio.voices].some(voice=>voice.owner===mouse&&voice.priority===2));
});

test('canceling a second pointer preserves another pointer queued on the same mouse',async()=>{
 const {audio,context}=setup();let resume;context.resume=()=>new Promise(resolve=>{resume=()=>{context.state='running';resolve();};});audio.setState(true,true);
 const mouse={x:100};audio.contactFeedback(mouse,1000,'touch',1);audio.contactFeedback(mouse,1000,'touch',2);
 audio.cancelContactFeedback(mouse,2,{cancelHold:false});assert.equal(audio.pendingContacts.length,1);assert.equal(audio.pendingContacts[0].pointerId,1);
 resume();await Promise.resolve();assert.equal(audio.played,1);assert.equal([...audio.voices][0].pointerId,1);
});
test('canceling a nonowner pointer preserves owner vocal and held observation without restarting hold',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},hold:{active:true,part:'tail',anchorVX:0,anchorVY:0}};
 audio.contactFeedback(mouse,1000,'touch',1);audio.update([mouse],0,1000,700);audio.contactFeedback(mouse,1000,'touch',2);
 assert.equal(audio.voices.size,2);audio.cancelContactFeedback(mouse,2,{cancelHold:false});
 assert.equal(audio.voices.size,1);assert.equal(audio.observations.get(mouse).held,true);
 assert.ok([...audio.voices].some(v=>v.priority===2&&v.pointerId===1));assert.equal([...audio.voices].some(v=>v.priority===1),false);
 const played=audio.played;context.advance(.1);audio.update([mouse],.1,1000,700);assert.equal(audio.played,played);
 audio.cancelContactFeedback(mouse,1,{cancelHold:true});delete mouse.hold;assert.equal(audio.voices.size,0);assert.equal(audio.observations.get(mouse).held,false);
 context.advance(.2);audio.update([mouse],.2,1000,700);assert.equal(audio.played,played);
});


test('walking and dragging stay substantially below squeaks while contact gain remains audible',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/assets/audio/ATTRIBUTION.json',import.meta.url)));
 const rms=new Map(manifest.clips.map(c=>[c.id,c.rms]));
 const power=kind=>Math.sqrt(sampleBanks[kind].reduce((sum,id)=>sum+(rms.get(id)*(sampleTrim[id]??1)*sampleMix[kind])**2,0)/sampleBanks[kind].length);
 for(const kind of ['patter','retreat','dragloop'])assert.ok(20*Math.log10(power(kind)/power('squeak')) < -22,kind);
 assert.equal(sampleMix.tap,.2);assert.equal(sampleMix.hit,.38);assert.equal(sampleMix.hurt,.32);assert.equal(sampleMix.squeak,.28);
 assert.ok(power('tap')>power('patter')*5);
});
test('startup loads touch vocal recordings before movement textures',async()=>{
 const {audio}=setup();const starts=[];let release;
 const gate=new Promise(resolve=>{release=resolve;});audio.sampleLoader=async id=>{starts.push(id);await gate;return{duration:.3};};
 await audio.unlock();assert.deepEqual(starts,sampleBanks.tap);release();await audio.loadSamples();
 assert.equal(starts.length,recordedSamples.length);assert.equal(new Set(starts).size,recordedSamples.length);assert.equal(audio.sampleBuffers.size,recordedSamples.length);
});

test('direct touch silences foley through its vocal and quick harmless release does not double it',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
 const mouse={x:100};audio.cue('patter');assert.equal(audio.voices.size,1);
 audio.contactFeedback(mouse,1000,'touch',1);assert.equal(audio.voices.size,1);
 assert.ok(sampleBanks.tap.includes(audio.lastPlayed.sample));assert.equal(audio.lastPlayed.source,'recording');
 for(const kind of ['patter','rustle','dragstart','dragloop','scratch','peek'])assert.equal(audio.cue(kind,.5,mouse,{priority:1,bypassCooldown:true}),false,kind);
 const before=audio.played;audio.hit(mouse,1000,'harmless');assert.equal(audio.played,before);
 audio.contactFeedback(mouse,1000,'touch',2);assert.equal(audio.played,before+1);
 audio.hit(mouse,1000,'tossed');assert.equal(audio.lastPlayed.kind,'dragrelease');
 mouse.reaction='stunned';audio.hit(mouse,1000,'injured');assert.equal(audio.lastPlayed.kind,'hurt');
 context.advance(1);assert.equal(audio.cue('patter'),true);
});
test('canceling secondary touch still deduplicates the owner harmless release',async()=>{
 const {audio}=setup();audio.setState(true,true);await audio.unlock();const mouse={x:100};
 audio.contactFeedback(mouse,1000,'touch',1);audio.contactFeedback(mouse,1000,'touch',2);audio.cancelContactFeedback(mouse,2,{cancelHold:false});
 const before=audio.played;audio.hit(mouse,1000,'harmless');assert.equal(audio.played,before);
});
test('first touch waits for an actual recording, load completion respects cancellation and expiration',async()=>{
 for(const cancel of [null,(a,m)=>a.cancelContactFeedback(m,1),(a)=>a.setState(false,true),(a)=>a.setState(true,false),(a)=>a.configure({soundVolume:0}),(a)=>{a.pendingContacts[0].expires=Date.now()-1;}]){
  const context=new Context();let release;const gate=new Promise(resolve=>{release=resolve;});const requested=[];
  const audio=new PreyAudio({contextFactory:()=>context,sampleLoader:async id=>{requested.push(id);await gate;return {duration:.3,id};}});
  audio.setState(true,true);const mouse={x:100};audio.contactFeedback(mouse,1000,'touch',1);audio.hit(mouse,1000,'harmless');
  await Promise.resolve();assert.equal(audio.played,0);assert.equal(context.sources.length,0);assert.equal(audio.pendingContacts.length,1);assert.deepEqual(requested,sampleBanks.tap);
  if(cancel)cancel(audio,mouse);release();await audio.loadSamples();assert.equal(audio.played,cancel?0:1);assert.equal(audio.pendingContacts.length,0);
  for(const source of context.sources)assert.ok(source.buffer?.id?.startsWith('floor-'));
 }
});

test('quick injury replaces its pointer down vocal while preserving other paws',async()=>{
 const {audio}=setup();audio.setState(true,true);await audio.unlock();const mouse={x:100,reaction:'stunned'};
 audio.contactFeedback(mouse,1000,'touch',1);audio.contactFeedback(mouse,1000,'touch',2);
 audio.hit(mouse,1000,'injured',1);
 assert.equal(audio.voices.size,2);assert.ok([...audio.voices].some(v=>v.pointerId===2&&v.kind==='tap'));
 assert.ok([...audio.voices].some(v=>v.pointerId===1&&v.kind==='hurt'));assert.equal([...audio.voices].some(v=>v.pointerId===1&&v.kind==='tap'),false);
});
test('quick injury replaces queued down before activation instead of flushing both',async()=>{
 const {audio,context}=setup();let resume;context.resume=()=>new Promise(resolve=>{resume=()=>{context.state='running';resolve();};});
 audio.setState(true,true);const mouse={x:100,reaction:'stunned'};audio.contactFeedback(mouse,1000,'touch',1);audio.contactFeedback(mouse,1000,'touch',2);audio.hit(mouse,1000,'injured');
 assert.deepEqual(audio.pendingContacts.map(e=>[e.pointerId,e.kind]),[[2,'tap'],[1,'hurt']]);resume();await Promise.resolve();assert.equal(audio.played,2);
});


test('runtime uses mouse-eating cracker cuts and excludes archived rat, hamster and crawl recordings',()=>{
 assert.deepEqual(sampleBanks.nibble,Array.from({length:6},(_,i)=>`cracker-${String(i+1).padStart(2,'0')}`));
 assert.deepEqual(sampleBanks.eat,sampleBanks.nibble);assert.equal(recordedSamples.length,26);
 for(const id of Object.values(sampleBanks).flat())assert.ok(!/^(rat|chew|crawl)-/.test(id),id);
 assert.ok(sampleBanks.hit.every(id=>/^(mouse|floor)-/.test(id)));assert.ok(sampleBanks.hurt.every(id=>/^(mouse|floor)-/.test(id)));
 assert.equal(sampleMix.nibble,.3);assert.equal(sampleMix.eat,.3);
});

test('surface friction scales existing recorded movement by material and strength, never adds a voice',async()=>{
 for(const background of ['photo-linen','linen','felt','woven','denim','cork','paper','photo-clearing','earth','sand','grass','photo-boards','marble']){
  const {audio,context}=setup();audio.configure({background,environmentStrength:.55});audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',moving:true,speed:0,vx:0,vy:0,hunt:{phase:'creep'}};
  audio.update([mouse],0,1000,700);mouse.x+=20;context.advance(.1);audio.update([mouse],.1,1000,700);
  assert.equal(audio.played,1);assert.equal(audio.voices.size,1);assert.equal(audio.lastPlayed.kind,'patter');assert.equal(audio.lastPlayed.source,'recording');
  assert.equal(audio.lastPlayed.gainScale,.55*surfaceFriction(background));assert.ok(audio.lastPlayed.sample.startsWith('paper-'));
 }
 assert.equal(surfaceFriction('photo-boards'),.08);assert.ok(surfaceFriction('photo-boards')<surfaceFriction('grass'));
});
test('stationary anchor struggle is silent but actual zero-velocity dragging rustles sparsely',async()=>{
 const {audio,context}=setup();audio.configure({background:'linen',environmentStrength:1});audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',vx:0,vy:0,speed:0,hold:{active:true,part:'tail',anchorVX:800,anchorVY:800}};
 for(let i=0;i<=100;i++){context.advance(i/10);audio.update([mouse],i/10,5000,700);}
 assert.equal(audio.played,0);
 const starts=[];for(let i=101;i<=300;i++){mouse.x+=10;context.advance(i/10);const before=audio.played;audio.update([mouse],i/10,5000,700);if(audio.played>before)starts.push(i/10);assert.ok(audio.voices.size<=1);}
 assert.ok(starts.length>=8&&starts.length<=14);for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]>=.9);
 assert.equal(audio.lastPlayed.kind,'dragloop');const played=audio.played;context.advance(30.1);audio.update([mouse],30.1,5000,700);assert.equal(audio.voices.size,0);assert.equal(audio.played,played);
});
test('material changes, zero strength, pause and mute cancel surface voices without replaying movement',async()=>{
 const {audio,context}=setup();audio.configure({background:'linen'});audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hold:{active:true,part:'body'}};
 const tick=(t,dx=20)=>{mouse.x+=dx;context.advance(t);audio.update([mouse],t,5000,700);};
 tick(0,0);tick(.1);assert.equal(audio.voices.size,1);
 audio.configure({background:'marble'});assert.equal(audio.voices.size,0);tick(.3);tick(.5);assert.equal(audio.lastPlayed.gainScale,.55*.08);
 audio.configure({background:'linen',environmentStrength:0});assert.equal(audio.voices.size,0);const count=audio.played;tick(.6);tick(.7);assert.equal(audio.played,count);
 audio.configure({background:'linen',environmentStrength:1});tick(.9);tick(1.1);assert.equal(audio.voices.size,1);
 let time=2;for(const state of [[true,false],[false,true]]){audio.setState(...state);assert.equal(audio.voices.size,0);const before=audio.played;tick(time);audio.setState(true,true);tick(time+.1);assert.equal(audio.played,before);tick(time+.2);assert.equal(audio.played,before+1);time+=2;}
});
test('contact ducking blocks surface friction for at least 450 ms despite ongoing displacement',async()=>{
 const {audio,context}=setup();audio.configure({background:'linen'});audio.setState(true,true);await audio.unlock();
 const mouse={x:100,y:100,state:'active',hold:{active:true,part:'body'}};audio.update([mouse],0,5000,700);audio.contactFeedback(mouse,5000,'touch',1);const count=audio.played;
 for(let i=1;i<=4;i++){mouse.x+=20;context.advance(i/10);audio.update([mouse],i/10,5000,700);assert.equal(audio.played,count);assert.equal([...audio.voices].some(v=>v.surface),false);}
 mouse.x+=20;context.advance(.6);audio.update([mouse],.6,5000,700);assert.equal(audio.played,count+1);assert.equal(audio.lastPlayed.kind,'dragloop');
});
test('surface travel ignores teleport, hidden, resized and discontinuous frames',async()=>{
 const {audio,context}=setup();audio.setState(true,true);await audio.unlock();const mouse={x:100,y:100,state:'active',hold:{active:true,part:'body'}};
 const tick=(t,x,w=5000)=>{mouse.x=x;context.advance(t);audio.update([mouse],t,w,700);};
 tick(0,100);tick(.1,4000);tick(2,4100);tick(2.1,4120,5100);mouse.hiddenUntil=10;tick(2.2,4140);mouse.hiddenUntil=0;tick(2.3,4160);assert.equal(audio.played,0);
 tick(2.4,4180);assert.equal(audio.played,1);
});


test('irregular update cadence preserves bounded displacement-driven friction spacing',async()=>{
 const counts=[];
 for(const intervals of [[1/30],[1/60],[.01,.04,.025,.1]]){
  const {audio,context}=setup();audio.configure({background:'felt',soundFrequency:2});audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',moving:true,hunt:{phase:'creep'}};audio.update([mouse],0,10000,700);let time=0,index=0,last=-Infinity;
  while(time<10){const dt=Math.min(intervals[index++%intervals.length],10-time);time+=dt;mouse.x+=100*dt;context.advance(time);const before=audio.played;audio.update([mouse],time,10000,700);if(audio.played>before){assert.ok(time-last>=.9-1e-9);last=time;}assert.ok(audio.voices.size<=1);}
  counts.push(audio.played);
 }
 assert.ok(Math.min(...counts)>=10);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
});
