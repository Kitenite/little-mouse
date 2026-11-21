import{recordedSamples,sampleBanks,sampleMix,sampleTrim,surfaceFriction}from'./audio-samples.js';
// Real rodent recordings and explicitly credited light-friction foley.
// Every source buffer is a collected recording; missing assets remain silent.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const OUTPUT_GAIN=1.8;
// Identity through normal levels and a soft knee above .6. The graph scales
// input by 1/4 and restores it in the curve, accommodating three loud voices
// without hard clamping the waveshaper input. Static output stays below .85.
export function createLimiterCurve(inputRange=1){const curve=new Float32Array(2049);for(let i=0;i<curve.length;i++){const x=(i/(curve.length-1)*2-1)*inputRange,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.6?a:.6+.25*(1-Math.exp(-(a-.6)/.25)));}return curve;}
export const audioDefaults={soundVolume:.7,soundFrequency:1,soundVariety:'varied'};
export const audioControlSchema={
  soundVariety:{type:'select',options:['varied','focused'],default:'varied',label:'Sound variety'},
  soundVolume:{min:0,max:1,step:.05,default:.7,label:'Sound volume'},
  soundFrequency:{min:.25,max:2,step:.25,default:1,label:'Sound activity'},
};
export class PreyAudio {
  constructor({contextFactory=()=>new(globalThis.AudioContext||globalThis.webkitAudioContext)(),rng=Math.random,sampleLoader=null,onPlayback=null,audioSession=globalThis.navigator?.audioSession}={}) {
    this.onPlayback=typeof onPlayback==='function'?onPlayback:null;this.contextFactory=contextFactory;this.rng=rng;this.sampleLoader=sampleLoader;this.audioSession=audioSession;this.sampleBuffers=new Map();this.samplesPromise=null;this.sampleLoading=false;this.sampleRetryAt=0;this.sampleErrors=[];this.sampleChoice={};this.sampleRounds={};this.context=null;this.master=null;
    this.enabled=false;this.active=false;this.voices=new Set();this.lastVariant={};this.lastCue=-Infinity;
    this.nextAmbient=null;this.lastHit=-Infinity;this.settings={...audioDefaults};this.nextSocial=null;this.pendingReply=null;this.observations=new WeakMap();this.played=0;this.lastPlayed=null;this.lastError=null;this.signalPeak=0;this.testing=false;this.auditionGeneration=0;this.pendingContacts=[];this.unlockGeneration=0;this.lastTouches=new WeakMap();this.foleyUntil=-Infinity;this.unavailableKind=null;this.surface={background:'photo-clearing',strength:.55};this.surfaceMotion=new WeakMap();
  }
  configure(config={}){
    const value=Number(config.environmentStrength??.55),strength=Number.isFinite(value)?clamp(value,0,1):.55;
    const background=config.background??'photo-clearing';
    if(strength!==this.surface.strength||background!==this.surface.background){
      this.surface={background,strength};this.surfaceMotion=new WeakMap();
      for(const voice of [...this.voices])if(voice.surface)voice.cancel();
    }
    for(const [key,schema] of Object.entries(audioControlSchema)){
      if(schema.type==='select'){this.settings[key]=schema.options.includes(config[key])?config[key]:schema.default;continue;}
      const value=Number(config[key]??schema.default);this.settings[key]=Number.isFinite(value)?clamp(value,schema.min,schema.max):schema.default;
    }
    if(this.settings.soundVolume===0)this.stop();
    const volume=this.settings.soundVolume*OUTPUT_GAIN;
    if(this.master&&this.masterVolume!==volume){this.master.gain.setValueAtTime(volume,this.context.currentTime);this.masterVolume=volume;}
  }
  get ready(){return this.context?.state==='running';}
  setState(enabled,active){
    const wasActive=this.active;this.enabled=!!enabled;this.active=!!active;
    if(!this.enabled||(wasActive&&!this.active)||globalThis.document?.hidden)this.stop();
  }
  unlock(){
    const generation=++this.unlockGeneration;
    // Called directly by a pointer/click handler. Never await before resume().
    try {
      // A supported Safari playback session can play with the ringer switch
      // silent. This never changes physical media volume or application mute.
      try{if(this.audioSession)this.audioSession.type='playback';}catch{}
      if(!this.context||this.context.state==='closed'){
        this.context=this.contextFactory();this.master=this.context.createGain();
        this.masterVolume=this.settings.soundVolume*OUTPUT_GAIN;this.master.gain.value=this.masterVolume;
        this.limiterInput=this.context.createGain();this.limiterInput.gain.value=.25;
        this.limiter=this.context.createWaveShaper();this.limiter.curve=createLimiterCurve(4);this.limiter.oversample='2x';this.master.connect(this.limiterInput);this.limiterInput.connect(this.limiter);
        this.analyser=this.context.createAnalyser?.();
        if(this.analyser){this.analyser.fftSize=256;this.samples=new Float32Array(256);this.limiter.connect(this.analyser);this.analyser.connect(this.context.destination);}else this.limiter.connect(this.context.destination);
        this.context.onstatechange=()=>{if(!this.ready)this.stop();else this.flushContacts();};
      }
      this.loadSamples(true);
      this.lastError=null;
      const resumed=this.context.resume();
      return Promise.resolve(resumed).then(()=>{this.flushContacts();return this.ready;},error=>{if(generation===this.unlockGeneration){this.pendingContacts=[];this.lastError=String(error?.message||error);}return false;});
    }catch(error){this.pendingContacts=[];this.lastError=String(error?.message||error);return Promise.resolve(false);}
  }
  stop(){
    this.nextAmbient=null;this.auditionGeneration++;this.observations=new WeakMap();this.pendingReply=null;this.pendingContacts=[];this.lastTouches=new WeakMap();this.foleyUntil=-Infinity;this.surfaceMotion=new WeakMap();
    for(const voice of [...this.voices])voice.cancel();
  }
  reset(){this.stop();this.observations=new WeakMap();this.lastCue=this.lastHit=-Infinity;this.nextSocial=null;this.pendingReply=null;}
  loadSamples(retryFailed=false){
    if(this.samplesPromise&&(this.sampleLoading||!retryFailed||!this.sampleErrors.length||Date.now()<this.sampleRetryAt))return this.samplesPromise;
    if(!this.context||(!this.sampleLoader&&typeof this.context.decodeAudioData!=='function'))return Promise.resolve();
    const loader=this.sampleLoader|| (async id=>{
      const response=await fetch(new URL(`./assets/audio/${id}.wav`,import.meta.url),{signal:AbortSignal.timeout(6000)});
      if(!response.ok)throw Error(`Audio ${id}: HTTP ${response.status}`);
      return this.context.decodeAudioData(await response.arrayBuffer());
    });
    const requested=this.samplesPromise?recordedSamples.filter(id=>!this.sampleBuffers.has(id)):recordedSamples;
    let next=0;this.sampleLoading=true;
    this.samplesPromise=Promise.all(Array.from({length:4},async()=>{
      while(next<requested.length){const id=requested[next++];try{const buffer=await loader(id);if(!(buffer?.duration>0))throw Error('Empty audio buffer');this.sampleBuffers.set(id,buffer);this.sampleErrors=this.sampleErrors.filter(entry=>entry.id!==id);this.flushContacts();}catch(error){this.sampleErrors=this.sampleErrors.filter(entry=>entry.id!==id);this.sampleErrors.push({id,error:String(error?.message||error)});}}
    })).finally(()=>{this.sampleLoading=false;this.sampleRetryAt=Date.now()+1000;});
    return this.samplesPromise;
  }
  variant(kind){
    const bank=sampleBanks[kind];let index=Math.min(bank.length-1,Math.floor(this.rng()*bank.length));
    if(index===this.lastVariant[kind])index=(index+1)%bank.length;
    this.lastVariant[kind]=index;return bank[index];
  }
  cue(kind,x=.5,owner=null,{priority=0,bypassCooldown=false,pointerId=null,gainScale=1,surface=false}={}){
    if(globalThis.document?.hidden||!sampleBanks[kind]||!this.enabled||(!this.active&&!this.testing)||!this.ready||this.settings.soundVolume===0)return false;
    const context=this.context,t=context.currentTime;
    if(priority<2&&t<this.foleyUntil)return false;
    const impact=['hit','hurt','tap','dragrelease'].includes(kind);
    if(!bypassCooldown&&(t-this.lastCue<(impact?.08:.32)||impact&&t-this.lastHit<.18))return false;
    // Fixed bank order makes focused aliases share a stable pair. Failed clips
    // fall through to the next real recording; fewer than two may mean silence
    // or unavoidable repetition. Varied keeps the complete existing shuffle bag.
    const loaded=sampleBanks[kind].filter(id=>this.sampleBuffers.has(id));
    const available=this.settings.soundVariety==='focused'?loaded.slice(0,2):loaded;
    if(!available.length){this.unavailableKind=kind;return false;}
    this.unavailableKind=null;
    if(this.voices.size>=3){
      const victim=[...this.voices].filter(voice=>voice.priority<priority||priority===2&&voice.priority===2).sort((a,b)=>a.priority-b.priority)[0];
      if(!victim)return false;victim.cancel();
    }
    this.lastCue=t;if(impact)this.lastHit=t;
    const gain=context.createGain(),pan=context.createStereoPanner?.();
    if(pan){pan.pan.value=clamp(x*1.4-.7,-.7,.7);gain.connect(pan);pan.connect(this.master);}else gain.connect(this.master);
    const nodes=[gain,...(pan?[pan]:[])];let source,duration,level,sampleId=null;
    {
      const key=this.settings.soundVariety+':'+available.join('|');let round=this.sampleRounds[kind];
      if(!round||round.key!==key||!round.remaining.length)round=this.sampleRounds[kind]={key,remaining:[...available]};
      // Exhaust a bank's loaded excerpts before refilling. If another bank just
      // used the sole remaining clip, defer that clip rather than repeat it now.
      const fresh=round.remaining.filter(id=>id!==this.lastSample),different=available.filter(id=>id!==this.lastSample);
      const choices=fresh.length?fresh:different.length?different:round.remaining;
      sampleId=choices[Math.min(choices.length-1,Math.floor(this.rng()*choices.length))];round.remaining=round.remaining.filter(id=>id!==sampleId);this.lastSample=sampleId;this.sampleChoice[kind]=sampleId;this.lastVariant[kind]=sampleBanks[kind].indexOf(sampleId);
      source=context.createBufferSource();source.buffer=this.sampleBuffers.get(sampleId);
      source.playbackRate.value=1; // Preserve recorded timing and pitch, including movement.
      duration=source.buffer.duration/source.playbackRate.value;
      level=(sampleMix[kind]??.2)*(sampleTrim[sampleId]??1)*(.9+this.rng()*.15)*clamp(gainScale,0,1);
      gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(level,t+.008);gain.gain.setValueAtTime(level,t+Math.max(.01,duration-.018));gain.gain.linearRampToValueAtTime(.0001,t+duration);
      source.connect(gain);
    }
    if(priority===2||kind==='dragstart'){this.foleyUntil=Math.max(this.foleyUntil,t+Math.max(.45,duration));for(const voice of [...this.voices])if(voice.priority<priority||voice.surface)voice.cancel();}
    nodes.push(source);let cleaned=false;
    const cleanup=()=>{if(cleaned)return;cleaned=true;for(const node of nodes)node.disconnect();this.voices.delete(voice);};
    const voice={owner,priority,pointerId,kind,surface,cancel:()=>{try{source.stop();}catch{}cleanup();}};
    this.voices.add(voice);source.onended=cleanup;source.start(t);source.stop(t+duration);
    this.played++;this.lastPlayed={kind,variant:this.lastVariant[kind],sample:sampleId,soundVariety:this.settings.soundVariety,playbackRate:1,priority,source:'recording',surface,gainScale,at:t};
    // Snapshot the scheduled envelope level (before master/limiter), not the
    // AudioParam's final fade value. Observer failures never affect playback.
    if(this.onPlayback)try{Promise.resolve(this.onPlayback({clip:sampleId,kind,profile:this.settings.soundVariety,gain:level,masterGain:this.master?.gain.value??null,playbackRate:source.playbackRate.value,time:t})).catch(()=>{});}catch{}
    return true;
  }
  contactFeedback(mouse,width,outcome='touch',pointerId=null){
    if(!mouse||!this.enabled||!this.active||this.settings.soundVolume===0||globalThis.document?.hidden)return false;
    const now=Date.now(),touches=this.lastTouches.get(mouse)||new Map();
    for(const [id,touch] of touches)if(now-touch.at>450)touches.delete(id);
    // Prefer the integration's pointer ID; older callers resolve the oldest
    // recent down on this mouse (the claim owner normally arrives first).
    const resolvedPointer=pointerId??touches.keys().next().value;
    const recent=touches.has(resolvedPointer);
    if(outcome!=='touch'&&recent){
      touches.delete(resolvedPointer);
      if(outcome==='harmless')return true;
      this.pendingContacts=this.pendingContacts.filter(event=>!(event.mouse===mouse&&event.pointerId===resolvedPointer&&event.kind==='tap'));
      for(const voice of [...this.voices])if(voice.owner===mouse&&voice.pointerId===resolvedPointer&&voice.kind==='tap')voice.cancel();
      pointerId=resolvedPointer;
    }
    if(outcome==='touch'){touches.set(pointerId,{at:now});if(touches.size>10)touches.delete(touches.keys().next().value);this.lastTouches.set(mouse,touches);}
    const kind=outcome==='touch'||outcome==='harmless'?'tap':outcome==='tossed'?'dragrelease':mouse.reaction==='limp'||mouse.reaction==='stunned'?'hurt':'hit';
    this.foleyUntil=Math.max(this.foleyUntil,(this.context?.currentTime||0)+.45);
    for(const voice of [...this.voices])if(voice.priority<2)voice.cancel();
    const event={kind,mouse,pointerId,x:clamp(mouse.x/Math.max(1,width),0,1),expires:now+800};
    if(this.ready&&this.cue(kind,event.x,mouse,{priority:2,bypassCooldown:true,pointerId}))return true;
    // Bound both activation and recording-load waits; no synthetic substitute.
    this.pendingContacts.push(event);if(this.pendingContacts.length>10)this.pendingContacts.shift();
    if(!this.ready)this.unlock();else this.loadSamples(true);
    return true;
  }
  flushContacts(){
    this.pendingContacts=this.pendingContacts.filter(event=>event.expires>=Date.now());
    if(!this.ready)return;
    const pending=this.pendingContacts.splice(0);
    if(!this.enabled||!this.active||this.settings.soundVolume===0||globalThis.document?.hidden)return;
    for(const event of pending)if(!this.cue(event.kind,event.x,event.mouse,{priority:2,bypassCooldown:true,pointerId:event.pointerId}))this.pendingContacts.push(event);
  }
  cancelContactFeedback(mouse,pointerId=null,{cancelHold=true}={}){
    const matchesPointer=event=>pointerId===null||event.pointerId===pointerId;
    const touches=this.lastTouches.get(mouse);if(pointerId===null)this.lastTouches.delete(mouse);else touches?.delete(pointerId);
    this.pendingContacts=this.pendingContacts.filter(event=>event.mouse!==mouse||!matchesPointer(event));
    for(const voice of [...this.voices])if(voice.owner===mouse&&(voice.priority===2&&matchesPointer(voice)||voice.priority===1&&cancelHold))voice.cancel();
    if(cancelHold){const seen=this.observations.get(mouse);if(seen)seen.held=false;}
  }
  hit(mouse,width,outcome,pointerId=null){const seen=this.observations.get(mouse);if(seen)seen.held=false;return this.contactFeedback(mouse,width,outcome,pointerId);}
  updateSurface(mouse,time,width,height,visible){
    const previous=this.surfaceMotion.get(mouse),held=!!mouse.hold?.active;
    const current={x:mouse.x,y:mouse.y,time,width,height,visible,held,distance:0,next:previous?.next??time};
    this.surfaceMotion.set(mouse,current);
    const dt=time-(previous?.time??time),distance=previous?Math.hypot(mouse.x-previous.x,mouse.y-previous.y):0;
    const valid=visible&&previous?.visible&&previous.held===held&&previous.width===width&&previous.height===height&&dt>0&&dt<=.25&&Number.isFinite(distance)&&distance/dt<=1000;
    const moving=valid&&distance/dt>12&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time);
    if(!moving||!this.surface.strength){
      for(const voice of [...this.voices])if(voice.owner===mouse&&voice.surface)voice.cancel();
      return false;
    }
    current.distance=(previous.distance||0)+distance;
    if(current.distance>=8&&time>=current.next){
      const kind=held?'dragloop':mouse.hunt?.phase==='retreat'?'retreat':'patter';
      if(this.cue(kind,clamp(mouse.x/Math.max(1,width),0,1),mouse,{priority:held?1:0,surface:true,gainScale:this.surface.strength*surfaceFriction(this.surface.background)})){
        current.distance=0;current.next=time+Math.max(2.4,(3+this.rng()*3)/this.settings.soundFrequency);
      }
    }
    return true;
  }
  update(mice,time,width,height=Infinity){
    if(!this.enabled||!this.active||!this.ready)return;
    for(const voice of [...this.voices])if(voice.owner&&(voice.surface||voice.priority<2)&&!mice.includes(voice.owner))voice.cancel();
    const density=this.settings.soundFrequency,visible=mouse=>mouse.state==='active'&&!(mouse.hiddenUntil>time)&&mouse.x>=0&&mouse.x<=width&&mouse.y>=0&&mouse.y<=height;
    const ambientEligible=mouse=>visible(mouse)&&!mouse.hold&&!mouse.activity&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time)&&!(mouse.startledUntil>time);
    for(const voice of [...this.voices])if(voice.kind==='squeak'&&voice.priority===0&&voice.owner&&!ambientEligible(voice.owner))voice.cancel();
    if(this.nextAmbient===null)this.nextAmbient=time+(2+this.rng()*3)/density;
    for(const mouse of mice){
      const phase=mouse.hunt?.phase||(mouse.state==='away'?'hidden':mouse.leaving?'retreat':mouse.entering?'peek':mouse.moving?'creep':'watch');
      let seen=this.observations.get(mouse);
      if(!seen){seen={phase:null,next:time+.5+this.rng(),nibbling:false};this.observations.set(mouse,seen);}
      const x=clamp(mouse.x/Math.max(1,width),0,1),held=!!mouse.hold?.active;
      for(const voice of [...this.voices])if(voice.owner===mouse&&voice.kind==='dragstart'&&(!held||!visible(mouse)))voice.cancel();
      const displaced=this.updateSurface(mouse,time,width,height,visible(mouse));
      const legacyNibbling=visible(mouse)&&!mouse.hold&&!mouse.activity&&phase==='watch'&&!mouse.moving&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time)&&!(mouse.startledUntil>time)&&mouse.nibblingUntil>time;
      const wasLegacyNibbling=seen.legacyNibbling;
      if(wasLegacyNibbling&&!legacyNibbling)for(const voice of [...this.voices])if(voice.owner===mouse&&voice.priority===0&&voice.kind==='nibble')voice.cancel();
      seen.legacyNibbling=legacyNibbling;
      const activity=visible(mouse)&&!mouse.hold&&!mouse.moving&&(mouse.speed||0)<12&&phase==='watch'&&(mouse.hunt?.fear||0)<.3&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time)&&!(mouse.startledUntil>time)&&mouse.activity?.at<=time&&mouse.activity.until>time?mouse.activity:null;
      const activityKey=activity?`${activity.kind}:${activity.at}`:null;
      if(seen.activityKey&&seen.activityKey!==activityKey)for(const voice of [...this.voices])if(voice.owner===mouse&&voice.priority===0&&!voice.surface)voice.cancel();
      if(activity){
        const kind=({nibble:'nibble',groom:'groom',scratch:'hindlegscratch',stretch:'stretch',roll:'roll'})[activity.kind];
        const entered=seen.activityKey!==activityKey;if(entered)seen.activityPlayed=false;
        if(kind&&activity.until-time>.2&&(!seen.activityPlayed||(['nibble','groom','scratch'].includes(activity.kind)&&time>=seen.activityNext&&activity.until-time>.2))){
          if(this.cue(kind,x,mouse)){seen.activityPlayed=true;seen.activityNext=time+Math.max(.9,(1.1+this.rng()*.8)/density);}
        }
        seen.activityKey=activityKey;seen.nibbling=activity.kind==='nibble';seen.next=activity.until+1;seen.phase=phase;continue;
      }
      seen.activityKey=null;
      if(held){
        // Pointer-down already supplies the immediate squeak. A sustained hold or
        // drag gets a sparse recorded response, independent of foot movement.
        if(!seen.held)seen.holdNext=time+3;
        seen.held=true;seen.next=time+2;
        if(visible(mouse)&&time>=seen.holdNext){
          if(this.cue('dragstart',x,mouse,{priority:1}))seen.holdNext=time+4+this.rng()*3;
        }
        continue;
      }
      if(seen.held){seen.held=false;this.cue('dragrelease',x,mouse,{priority:1,bypassCooldown:true});}
      seen.phase=phase;
      // No idle footsteps or phase-change foley. Ambient vocals are scheduled globally.
      if(legacyNibbling&&!wasLegacyNibbling)this.cue('nibble',x,mouse);
      seen.nibbling=legacyNibbling;
    }
    if(time>=this.nextAmbient){
      // One shared schedule prevents a large cast from becoming a chorus.
      this.nextAmbient=time+(5+this.rng()*6)/density;
      const candidates=mice.filter(ambientEligible);
      if(candidates.length&&!this.voices.size){const mouse=candidates[Math.floor(this.rng()*candidates.length)%candidates.length];
        this.cue('squeak',clamp(mouse.x/Math.max(1,width),0,1),mouse,{gainScale:.65});
      }
    }
  }

  async testSound(kind='squeak'){
    if(!Object.hasOwn(sampleBanks,kind))kind='squeak';
    // The caller must invoke this method directly from the local click handler.
    if(!this.enabled||this.settings.soundVolume===0)return this.diagnostics();
    this.stop();const audition=this.auditionGeneration;
    const unlocked=this.unlock();
    let timer;
    const ready=await Promise.race([unlocked,new Promise(resolve=>{timer=setTimeout(()=>resolve(false),800);})]);
    clearTimeout(timer);
    if(!ready||audition!==this.auditionGeneration)return this.diagnostics();
    // Give a real recording a bounded opportunity to load for a useful test.
    if(!this.sampleBuffers.size&&this.samplesPromise){let loadTimer;await Promise.race([this.samplesPromise,new Promise(resolve=>{loadTimer=setTimeout(resolve,1800);})]);clearTimeout(loadTimer);}
    if(audition!==this.auditionGeneration||!this.enabled||this.settings.soundVolume===0)return this.diagnostics();
    this.stop();this.lastCue=this.lastHit=-Infinity;this.signalPeak=0;this.testing=true;
    try{this.cue(kind,.5);}catch(error){this.lastError=String(error?.message||error);}finally{this.testing=false;}
    for(let i=0;i<3;i++){await new Promise(resolve=>setTimeout(resolve,40));this.measure();}
    return this.diagnostics();
  }
  measure(){
    if(this.analyser?.getFloatTimeDomainData&&this.samples){this.analyser.getFloatTimeDomainData(this.samples);let peak=0;for(const sample of this.samples)peak=Math.max(peak,Math.abs(sample));this.signalPeak=Math.max(this.signalPeak,peak);}
    return this.signalPeak;
  }
  diagnostics(){this.pendingContacts=this.pendingContacts.filter(event=>event.expires>=Date.now());this.measure();return{unavailableKind:this.unavailableKind,state:this.context?.state||'locked',enabled:this.enabled,active:this.active,voices:this.voices.size,pendingContacts:this.pendingContacts.length,settings:{...this.settings},sampleCount:this.sampleBuffers.size,loadedBankCounts:Object.fromEntries(Object.entries(sampleBanks).map(([kind,bank])=>[kind,bank.filter(id=>this.sampleBuffers.has(id)).length])),sampleTotal:recordedSamples.length,sampleErrors:this.sampleErrors.slice(0,3),audioSessionType:this.audioSession?.type||'unavailable',signalPeak:this.signalPeak,lastError:this.lastError,blockedReason:!this.enabled?'muted':this.settings.soundVolume===0?'volume-zero':!this.ready?(this.context?.state||'gesture-required'):this.lastError?'audio-error':this.unavailableKind?'sample-unavailable':null,played:this.played,last:this.lastPlayed};}
}
