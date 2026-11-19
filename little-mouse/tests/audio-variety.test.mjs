import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {PreyAudio} from '../public/audio.js';
import {sampleBanks,recordedSamples,sampleMix} from '../public/audio-samples.js';
import {settingsSchema,settingsDefaults,normalizeProfile,validateSettings} from '../public/settings.js';
class Param {value=0;setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}}
class Node {
 gain=new Param();pan=new Param();playbackRate=new Param();
 connect(){}disconnect(){}start(t){this.startAt=t;}stop(t){this.stopAt=t;if(t===undefined)this.onended?.();}
}
class Context {
 state='running';currentTime=0;destination={};sources=[];
 resume(){return Promise.resolve();}
 createGain(){return new Node();}createStereoPanner(){return new Node();}createWaveShaper(){return new Node();}
 createOscillator(){assert.fail('Synthetic sound forbidden');}createBuffer(){assert.fail('Generated buffer forbidden');}
 createBufferSource(){const n=new Node();this.sources.push(n);return n;}
 advance(){this.currentTime+=1;for(const n of this.sources)if(n.stopAt<=this.currentTime)n.onended?.();}
}
async function setup(profile='focused',ids=recordedSamples,onPlayback=null){
 const context=new Context(),audio=new PreyAudio({contextFactory:()=>context,rng:()=>.5,onPlayback,sampleLoader:async()=>{throw Error('missing');}});
 for(const id of ids)audio.sampleBuffers.set(id,{duration:.3,id});
 audio.configure({soundVariety:profile});audio.setState(true,true);await audio.unlock();await audio.samplesPromise;
 return {audio,context};
}
test('sound variety is a validated sound select with backward compatible varied default',()=>{
 assert.equal(settingsSchema.soundVariety.group,'sound');assert.equal(settingsSchema.soundVariety.type,'select');
 assert.deepEqual(settingsSchema.soundVariety.options.map(o=>o.value),['varied','focused']);
 assert.equal(settingsDefaults.soundVariety,'varied');assert.equal(normalizeProfile({}).soundVariety,'varied');
 assert.equal(normalizeProfile({soundVariety:'focused'}).soundVariety,'focused');
 assert.throws(()=>validateSettings({soundVariety:'synthetic'}));
 const audio=new PreyAudio();assert.equal(audio.settings.soundVariety,'varied');audio.configure({soundVariety:'invalid'});assert.equal(audio.settings.soundVariety,'varied');
});
for(const profile of ['varied','focused'])test(`${profile}: every bank uses real assets at native rate without immediate repeats`,async()=>{
 const {audio,context}=await setup(profile);
 for(const [kind,bank] of Object.entries(sampleBanks)){
  const expected=profile==='focused'?bank.slice(0,2):bank,seen=new Set();let previous;
  // Clear cross-bank history so full-round exhaustion can be measured separately.
  audio.lastSample=null;
  for(let i=0;i<expected.length*3;i++){
   context.advance();assert.equal(audio.cue(kind),true);
   const last=audio.diagnostics().last,source=context.sources.at(-1);
   assert.ok(expected.includes(last.sample));assert.notEqual(last.sample,previous);previous=last.sample;seen.add(last.sample);
   assert.equal(last.soundVariety,profile);assert.equal(last.playbackRate,1);assert.equal(last.source,'recording');
   assert.equal(source.playbackRate.value,1);assert.equal(source.buffer.id,last.sample);assert.ok(Math.abs(source.stopAt-source.startAt-.3)<1e-10);
   assert.ok(existsSync(new URL(`../public/assets/audio/${last.sample}.wav`,import.meta.url)));
  }
  assert.deepEqual([...seen].sort(),[...expected].sort());
 }
});
test('focused aliases and profile switches avoid immediate cross-bank repeats',async()=>{
 const {audio,context}=await setup();let previous;
 for(const kind of ['tap','dragstart','dragrelease','tap','patter','retreat','groom','dragloop']){
  context.advance();assert.ok(audio.cue(kind));assert.notEqual(audio.lastPlayed.sample,previous);previous=audio.lastPlayed.sample;
 }
 audio.configure({soundVariety:'varied'});context.advance();assert.ok(audio.cue('patter'));assert.notEqual(audio.lastPlayed.sample,previous);
 assert.equal(audio.lastPlayed.soundVariety,'varied');
});
test('focused missing recordings use remaining stable pair, a lone clip, or silence',async()=>{
 const {audio,context}=await setup('focused',['floor-02','floor-03','floor-04']);
 const seen=new Set();let previous;
 for(let i=0;i<6;i++){context.advance();assert.ok(audio.cue('tap'));assert.notEqual(audio.lastPlayed.sample,previous);previous=audio.lastPlayed.sample;seen.add(previous);}
 assert.deepEqual([...seen].sort(),['floor-02','floor-03']);
 audio.sampleBuffers.delete('floor-02');audio.sampleBuffers.delete('floor-03');
 for(let i=0;i<2;i++){context.advance();assert.ok(audio.cue('tap'));assert.equal(audio.lastPlayed.sample,'floor-04');}
 audio.sampleBuffers.clear();context.advance();const count=context.sources.length;assert.equal(audio.cue('tap'),false);assert.equal(context.sources.length,count);assert.equal(audio.diagnostics().blockedReason,'sample-unavailable');
});
test('focused preserves touch priority, cooldowns, surface gating and quiet movement',async()=>{
 const {audio,context}=await setup(),mouse={x:100,y:100,state:'active'};
 assert.equal(sampleMix.patter,.018);assert.equal(sampleMix.retreat,.022);assert.equal(sampleMix.dragloop,.022);
 audio.updateSurface(mouse,0,1000,700,true);assert.equal(audio.played,0);
 mouse.x+=20;audio.updateSurface(mouse,.1,1000,700,true);assert.equal(audio.lastPlayed.kind,'patter');assert.equal(audio.lastPlayed.surface,true);
 assert.equal(audio.cue('patter'),false);
 assert.ok(audio.contactFeedback(mouse,1000,'touch',1));assert.match(audio.lastPlayed.sample,/^floor-/);assert.equal(audio.lastPlayed.priority,2);
 assert.equal(audio.voices.size,1);assert.equal(audio.cue('patter'),false);
 context.advance();audio.updateSurface(mouse,.2,1000,700,true);assert.equal(audio.played,2);
 audio.configure({soundVariety:'focused',soundVolume:0});assert.equal(audio.cue('tap'),false);
 audio.configure({soundVariety:'focused'});audio.setState(true,false);assert.equal(audio.cue('tap'),false);
});

test('playback observer receives each started clip with actual gain and audio clock time',async()=>{
 const events=[];
 const {audio,context}=await setup('focused',recordedSamples,event=>{
  assert.equal(context.sources.at(-1).startAt,event.time);events.push(event);
 });
 for(let i=0;i<3;i++){
  context.advance();assert.ok(audio.cue('patter',.5,null,{gainScale:.25}));
  assert.deepEqual(events.at(-1),{clip:audio.lastPlayed.sample,kind:'patter',profile:'focused',gain:sampleMix.patter*(.9+.5*.15)*.25,masterGain:.7*1.8,playbackRate:1,time:context.currentTime});
  assert.equal(audio.cue('patter'),false);
 }
 assert.equal(events.length,3);
 audio.sampleBuffers.clear();context.advance();assert.equal(audio.cue('tap'),false);assert.equal(events.length,3);
});
test('observer exceptions and rejected promises never interrupt audio or later events',async()=>{
 let calls=0;
 const {audio,context}=await setup('varied',recordedSamples,()=>{
  calls++;if(calls===1)throw Error('observer failed');return Promise.reject(Error('async observer failed'));
 });
 for(let i=0;i<2;i++){context.advance();assert.equal(audio.cue('tap'),true);assert.equal(audio.played,i+1);assert.equal(audio.voices.size,1);}
 await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);
});
test('a failed source start never emits a playback event',async()=>{
 const events=[],{audio,context}=await setup('focused',recordedSamples,event=>events.push(event));
 context.createBufferSource=()=>{const source=new Node();source.start=()=>{throw Error('start failed');};return source;};
 assert.throws(()=>audio.cue('tap'),/start failed/);assert.equal(events.length,0);
});

test('diagnostics expose plain loaded counts for every bank independent of variety profile',async()=>{
 const empty=new PreyAudio().diagnostics().loadedBankCounts;
 assert.deepEqual(empty,Object.fromEntries(Object.keys(sampleBanks).map(kind=>[kind,0])));
 const {audio}=await setup('focused',['floor-01','floor-02','floor-03','mouse-01','mouse-03','mouse-07','crawl-01']);
 const counts=audio.diagnostics().loadedBankCounts;
 assert.equal(Object.getPrototypeOf(counts),Object.prototype);
 for(const [kind,bank] of Object.entries(sampleBanks))assert.equal(counts[kind],bank.filter(id=>audio.sampleBuffers.has(id)).length);
 assert.equal(counts.tap,3);assert.equal(counts.squeak,3);assert.equal(counts.patter,1);assert.equal(counts.nibble,0);
 audio.configure({soundVariety:'varied'});assert.deepEqual(audio.diagnostics().loadedBankCounts,counts);
 audio.sampleBuffers.delete('floor-01');assert.equal(audio.diagnostics().loadedBankCounts.tap,2);
 assert.equal(counts.tap,3); // Previously returned snapshots remain plain detached data.
 audio.sampleBuffers.set('floor-04',{duration:.3});assert.equal(audio.diagnostics().loadedBankCounts.tap,3);
});
