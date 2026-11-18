import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.argv[2]||process.cwd();
const {PreyAudio}=await import(pathToFileURL(root+'/little-mouse/public/audio.js'));
const {recordedSamples,sampleBanks}=await import(pathToFileURL(root+'/little-mouse/public/audio-samples.js'));
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

const clock=Date.now;let now=10000;Date.now=()=>now;
try{
 {
  const {audio}=setup();audio.sampleBuffers.clear();let online=false,requests=0;
  audio.sampleLoader=async()=>{requests++;if(!online)throw Error('503');return{duration:.3};};
  audio.setState(true,true);audio.contactFeedback({x:100},1000,'touch',1);await audio.loadSamples();
  const firstRequests=requests;now+=1001;online=true;audio.contactFeedback({x:100},1000,'touch',2);await audio.loadSamples();
  console.log(JSON.stringify({case:'503-recovery',firstRequests,requests,decoded:audio.sampleBuffers.size,played:audio.played,errors:audio.sampleErrors.length}));
 }
 {
  const {audio,context}=setup();audio.sampleBuffers.clear();let phase=0,requests=0;const delayed=[];
  audio.sampleLoader=async id=>{requests++;if(!id.startsWith('floor-'))return{duration:.3};if(!phase)throw Error('503');return await new Promise(resolve=>delayed.push(resolve));};
  audio.setState(true,true);audio.contactFeedback({x:100},1000,'touch',1);await audio.loadSamples();
  const cached=audio.sampleBuffers.size;now+=500;audio.contactFeedback({x:100},1000,'touch',2);await audio.loadSamples();const beforeBackoff=requests;
  now+=501;phase=1;for(let i=0;i<20;i++)audio.contactFeedback({x:100},1000,'touch',i+10);
  const inFlightRequests=requests;audio.setState(false,true);for(const resolve of delayed)resolve({duration:.3});await audio.loadSamples();
  console.log(JSON.stringify({case:'partial-retry-mute',cached,beforeBackoff,inFlightRequests,finalRequests:requests,decoded:audio.sampleBuffers.size,errors:audio.sampleErrors.length,played:audio.played}));
 }
 for(const control of ['cancel','pause','expiry','none']){
  const {audio}=setup();audio.sampleBuffers.clear();let recovering=false,requests=0;const delayed=[];
  audio.sampleLoader=async()=>{requests++;if(!recovering)throw Error('503');return await new Promise(resolve=>delayed.push(resolve));};
  const mouse={x:100};audio.setState(true,true);audio.contactFeedback(mouse,1000,'touch',1);await audio.loadSamples();
  now+=1001;await audio.loadSamples();const unsolicited=requests-26;
  audio.contactFeedback(mouse,1000,'touch',2);await audio.loadSamples();const errorsAfterSecondFailure=audio.sampleErrors.length;
  now+=1001;recovering=true;audio.contactFeedback(mouse,1000,'touch',3);
  if(control==='cancel')audio.cancelContactFeedback(mouse,3);if(control==='pause')audio.setState(true,false);if(control==='expiry')now+=801;
  for(let i=0;i<26;i++){delayed[i]?.({duration:.3});await new Promise(r=>setImmediate(r));}await audio.loadSamples();
  console.log(JSON.stringify({case:'retry-'+control,unsolicited,errorsAfterSecondFailure,played:audio.played,errors:audio.sampleErrors.length,requests}));
 }
 for(const finish of ['harmless','cancel','expire']){
  const {audio,context}=setup();audio.sampleBuffers.clear();const loads=[];
  audio.sampleLoader=id=>new Promise(resolve=>loads.push({id,resolve}));audio.setState(true,true);
  audio.contactFeedback({x:100},1000,'touch',1);const mouse=audio.pendingContacts[0].mouse;
  await Promise.resolve();now+=100;context.currentTime=.1;
  if(finish==='harmless')audio.hit(mouse,1000,'harmless',1);
  if(finish==='cancel')audio.cancelContactFeedback(mouse,1);
  if(finish==='expire')now+=801;
  const before=audio.played;loads[0].resolve({duration:.3});await new Promise(r=>setImmediate(r));
  console.log(JSON.stringify({case:'slow-load-'+finish,lateVoices:audio.played-before,pending:audio.pendingContacts.length,last:audio.lastPlayed?.kind}));
 }
 {
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();let previous,repeats=0;
  for(let i=0;i<300;i++){const kind=['tap','hit','squeak','hurt','tap','dragrelease'][i%6];context.advance(i+1);audio.cue(kind);if(audio.lastPlayed.sample===previous)repeats++;previous=audio.lastPlayed.sample;}
  audio.sampleBuffers.clear();for(const id of ['floor-01','floor-02'])audio.sampleBuffers.set(id,{duration:.3});
  const partial=[];for(let i=0;i<4;i++){context.advance(400+i);audio.cue('tap');partial.push(audio.lastPlayed.sample);}
  for(const id of ['floor-03','floor-04'])audio.sampleBuffers.set(id,{duration:.3});
  const restored=[];for(let i=0;i<4;i++){context.advance(410+i);audio.cue('tap');restored.push(audio.lastPlayed.sample);}
  console.log(JSON.stringify({case:'crossbank-partial',repeats,partial,restored}));
 }
 {
  let checked=0;const failures=[];
  for(const rng of [0,.5,.999999])for(const kind of Object.keys(sampleBanks)){
   const {audio,context}=setup();audio.rng=()=>rng;audio.setState(true,true);await audio.unlock();const picks=[];
   for(let i=0;i<sampleBanks[kind].length*3;i++){context.advance(i+1);audio.cue(kind);picks.push(audio.lastPlayed.sample);}
   for(let i=0;i<picks.length;i+=sampleBanks[kind].length)if(new Set(picks.slice(i,i+sampleBanks[kind].length)).size!==sampleBanks[kind].length)failures.push(kind+':'+rng);
   checked++;
  }
  console.log(JSON.stringify({case:'bank-rounds',checked,failures}));
 }
 {
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();const picks=[];
  for(let i=0;i<12;i++){context.advance(i+1);audio.contactFeedback({x:100},1000,'touch',i);picks.push(audio.lastPlayed.sample);}
  console.log(JSON.stringify({case:'variety-fixed-half',unique:new Set(picks).size,picks}));
 }
 {
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},nibblingUntil:3};
  audio.update([mouse],0,1000,700);const before=[...audio.voices].map(v=>({kind:v.kind,owned:v.owner===mouse}));
  mouse.moving=true;mouse.speed=50;delete mouse.nibblingUntil;context.currentTime=.1;audio.update([mouse],.1,1000,700);
  console.log(JSON.stringify({case:'legacy-nibble-interruption',before,remaining:[...audio.voices].map(v=>v.kind)}));
 }
 {
  const failures=[];let checked=0;
  for(const legacy of [false,true])for(const end of ['hidden','held','expiry','offscreen','phase']){
   const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
   const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},...(legacy?{nibblingUntil:3}:{activity:{kind:'nibble',at:0,until:3}})};
   audio.update([mouse],0,1000,700);
   if(end==='hidden')mouse.hiddenUntil=3;if(end==='held')mouse.hold={active:true};if(end==='expiry'){mouse.nibblingUntil=.1;if(mouse.activity)mouse.activity.until=.1;}if(end==='offscreen')mouse.x=-100;if(end==='phase')mouse.hunt.phase='retreat';
   context.currentTime=.1;audio.update([mouse],.1,1000,700);if([...audio.voices].some(v=>v.kind==='nibble'))failures.push({legacy,end});checked++;
  }
  console.log(JSON.stringify({case:'activity-stop-adverse',checked,failures}));
 }
 {
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const a={x:100,y:100,state:'active',hunt:{phase:'watch'},activity:{kind:'nibble',at:0,until:3}};
  const b={x:500,y:100,state:'active',hunt:{phase:'watch'},nibblingUntil:3};
  audio.update([a],0,1000,700);context.currentTime=.4;audio.update([a,b],.4,1000,700);
  context.currentTime=.5;audio.update([b],.5,1000,700);
  const otherRetained=[...audio.voices].some(v=>v.owner===b&&v.kind==='nibble');
  audio.contactFeedback(a,1000,'touch',9);audio.update([],.6,1000,700);
  console.log(JSON.stringify({case:'activity-owner-isolation',otherRetained,directRetained:[...audio.voices].some(v=>v.owner===a&&v.priority===2)}));
 }
 for(const legacy of [false,true]){
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();
  const mouse={x:100,y:100,state:'active',hunt:{phase:'watch'},...(legacy?{nibblingUntil:3}:{activity:{kind:'nibble',at:0,until:3}})};
  audio.update([mouse],0,1000,700);context.currentTime=.1;audio.update([],.1,1000,700);
  console.log(JSON.stringify({case:legacy?'legacy-removal':'activity-removal',remaining:[...audio.voices].map(v=>v.kind)}));
 }
 {
  const {audio,context}=setup();audio.setState(true,true);await audio.unlock();const mouse={x:100};
  audio.contactFeedback(mouse,1000,'touch',1);context.advance(1);now+=1000;const before=audio.played;
  audio.hit(mouse,1000,'harmless',1);console.log(JSON.stringify({case:'long-harmless-release',extraVoices:audio.played-before,last:audio.lastPlayed?.kind}));
 }
}finally{Date.now=clock;}
