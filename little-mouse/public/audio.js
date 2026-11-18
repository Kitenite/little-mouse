import{recordedSamples,sampleBanks,sampleMix,sampleTrim}from'./audio-samples.js';
// Real rodent recordings and explicitly credited light-friction foley.
// Procedural fallback is a quiet short rustle, never a synthetic footstep loop.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const OUTPUT_GAIN=1.8;
// Identity through normal cue levels, a soft knee above .6, and a bounded
// ceiling below .81 even if three unusually strong phrases overlap.
export function createLimiterCurve(){const curve=new Float32Array(2049);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.6?a:.6+.25*(1-Math.exp(-(a-.6)/.25)));}return curve;}
export const audioDefaults={soundVolume:.7,soundFrequency:1};
export const audioControlSchema={
  soundVolume:{min:0,max:1,step:.05,default:.7,label:'Sound volume'},
  soundFrequency:{min:.25,max:2,step:.25,default:1,label:'Sound activity'},
};
export class PreyAudio {
  constructor({contextFactory=()=>new(globalThis.AudioContext||globalThis.webkitAudioContext)(),rng=Math.random,sampleLoader=null,audioSession=globalThis.navigator?.audioSession}={}) {
    this.contextFactory=contextFactory;this.rng=rng;this.sampleLoader=sampleLoader;this.audioSession=audioSession;this.sampleBuffers=new Map();this.samplesPromise=null;this.sampleErrors=[];this.sampleChoice={};this.context=null;this.master=null;
    this.enabled=false;this.active=false;this.voices=new Set();this.lastVariant={};this.lastCue=-Infinity;
    this.lastHit=-Infinity;this.settings={...audioDefaults};this.nextSocial=null;this.pendingReply=null;this.observations=new WeakMap();this.played=0;this.lastPlayed=null;this.lastError=null;this.signalPeak=0;this.testing=false;this.auditionGeneration=0;this.pendingContacts=[];this.unlockGeneration=0;
  }
  configure(config={}){
    for(const [key,schema] of Object.entries(audioControlSchema)){const value=Number(config[key]??schema.default);this.settings[key]=Number.isFinite(value)?clamp(value,schema.min,schema.max):schema.default;}
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
        this.limiter=this.context.createWaveShaper();this.limiter.curve=createLimiterCurve();this.limiter.oversample='2x';this.master.connect(this.limiter);
        this.analyser=this.context.createAnalyser?.();
        if(this.analyser){this.analyser.fftSize=256;this.samples=new Float32Array(256);this.limiter.connect(this.analyser);this.analyser.connect(this.context.destination);}else this.limiter.connect(this.context.destination);
        this.noise=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*.65),this.context.sampleRate);
        const data=this.noise.getChannelData(0);let smooth=0;
        for(let i=0;i<data.length;i++){smooth=.65*smooth+.35*(this.rng()*2-1);data[i]=smooth;}
        this.context.onstatechange=()=>{if(!this.ready)this.stop();else this.flushContacts();};
      }
      this.loadSamples();
      this.lastError=null;
      const resumed=this.context.resume();
      // A silent one-sample source also primes older iOS Web Audio implementations.
      const source=this.context.createBufferSource();source.buffer=this.context.createBuffer(1,1,this.context.sampleRate);
      source.connect(this.master);source.onended=()=>source.disconnect();source.start();
      return Promise.resolve(resumed).then(()=>{this.flushContacts();return this.ready;},error=>{if(generation===this.unlockGeneration){this.pendingContacts=[];this.lastError=String(error?.message||error);}return false;});
    }catch(error){this.pendingContacts=[];this.lastError=String(error?.message||error);return Promise.resolve(false);}
  }
  stop(){
    this.auditionGeneration++;this.pendingReply=null;this.pendingContacts=[];
    for(const voice of [...this.voices])voice.cancel();
  }
  reset(){this.stop();this.observations=new WeakMap();this.lastCue=this.lastHit=-Infinity;this.nextSocial=null;this.pendingReply=null;}
  loadSamples(){
    if(this.samplesPromise)return this.samplesPromise;
    if(!this.context||(!this.sampleLoader&&typeof this.context.decodeAudioData!=='function'))return Promise.resolve();
    const loader=this.sampleLoader|| (async id=>{
      const response=await fetch(new URL(`./assets/audio/${id}.wav`,import.meta.url),{signal:AbortSignal.timeout(6000)});
      if(!response.ok)throw Error(`Audio ${id}: HTTP ${response.status}`);
      return this.context.decodeAudioData(await response.arrayBuffer());
    });
    let next=0;
    this.samplesPromise=Promise.all(Array.from({length:4},async()=>{
      while(next<recordedSamples.length){const id=recordedSamples[next++];try{const buffer=await loader(id);if(!(buffer?.duration>0))throw Error('Empty audio buffer');this.sampleBuffers.set(id,buffer);}catch(error){this.sampleErrors.push({id,error:String(error?.message||error)});}}
    }));
    return this.samplesPromise;
  }
  variant(kind){
    const bank=sampleBanks[kind];let index=Math.min(bank.length-1,Math.floor(this.rng()*bank.length));
    if(index===this.lastVariant[kind])index=(index+1)%bank.length;
    this.lastVariant[kind]=index;return bank[index];
  }
  cue(kind,x=.5,owner=null,{priority=0,bypassCooldown=false,pointerId=null}={}){
    if(globalThis.document?.hidden||!sampleBanks[kind]||!this.enabled||(!this.active&&!this.testing)||!this.ready||this.settings.soundVolume===0)return false;
    const context=this.context,t=context.currentTime;
    const impact=['hit','hurt','tap','dragrelease'].includes(kind);
    if(!bypassCooldown&&(t-this.lastCue<(impact?.08:.32)||impact&&t-this.lastHit<.18))return false;
    const available=sampleBanks[kind].filter(id=>this.sampleBuffers.has(id));
    // Foot friction must never fall back to the old mechanical beat pattern.
    if(!available.length&&priority<2&&['patter','retreat','dodge','dragloop'].includes(kind))return false;
    if(this.voices.size>=3){
      const victim=[...this.voices].filter(voice=>voice.priority<priority||priority===2&&voice.priority===2).sort((a,b)=>a.priority-b.priority)[0];
      if(!victim)return false;victim.cancel();
    }
    this.lastCue=t;if(impact)this.lastHit=t;
    const gain=context.createGain(),pan=context.createStereoPanner?.();
    if(pan){pan.pan.value=clamp(x*1.4-.7,-.7,.7);gain.connect(pan);pan.connect(this.master);}else gain.connect(this.master);
    const nodes=[gain,...(pan?[pan]:[])];let source,duration,sampleId=null;
    if(available.length){
      const different=available.filter(id=>id!==this.lastSample),pool=different.length?different:available;
      const varied=pool.filter(id=>id!==this.sampleChoice[kind]),choices=varied.length?varied:pool;
      sampleId=choices[Math.min(choices.length-1,Math.floor(this.rng()*choices.length))];this.lastSample=sampleId;this.sampleChoice[kind]=sampleId;this.lastVariant[kind]=sampleBanks[kind].indexOf(sampleId);
      source=context.createBufferSource();source.buffer=this.sampleBuffers.get(sampleId);
      source.playbackRate.value=.96+this.rng()*.08;
      duration=source.buffer.duration/source.playbackRate.value;
      const level=(sampleMix[kind]??.2)*(sampleTrim[sampleId]??1)*(.9+this.rng()*.15);
      gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(level,t+.008);gain.gain.setValueAtTime(level,t+Math.max(.01,duration-.018));gain.gain.linearRampToValueAtTime(.0001,t+duration);
      source.connect(gain);
    }else{
      // Tiny broadband fallback keeps a failed download from silencing contacts;
      // it is intentionally much quieter than the recorded bank and has no tone.
      this.variant(kind);duration=.09+this.rng()*.06;
      source=context.createBufferSource();source.buffer=this.noise;
      const filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1400+this.rng()*1400;filter.Q.value=.6;
      source.connect(filter);filter.connect(gain);nodes.push(filter);
      gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.055,t+.01);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    }
    nodes.push(source);let cleaned=false;
    const cleanup=()=>{if(cleaned)return;cleaned=true;for(const node of nodes)node.disconnect();this.voices.delete(voice);};
    const voice={owner,priority,pointerId,cancel:()=>{try{source.stop();}catch{}cleanup();}};
    this.voices.add(voice);source.onended=cleanup;source.start(t);source.stop(t+duration);
    this.played++;this.lastPlayed={kind,variant:this.lastVariant[kind],sample:sampleId,priority,source:sampleId?'recording':'quiet-noise-fallback',at:t};
    return true;
  }
  contactFeedback(mouse,width,outcome='touch',pointerId=null){
    if(!mouse||!this.enabled||!this.active||this.settings.soundVolume===0||globalThis.document?.hidden)return false;
    const kind=outcome==='touch'?'tap':outcome==='tossed'?'dragrelease':outcome==='harmless'?(mouse.reaction==='dodge'?'dodge':mouse.reaction==='freeze'?'sniff':'tap'):mouse.reaction==='limp'||mouse.reaction==='stunned'?'hurt':'hit';
    const event={kind,mouse,pointerId,x:clamp(mouse.x/Math.max(1,width),0,1),expires:Date.now()+800};
    if(this.ready)return this.cue(kind,event.x,mouse,{priority:2,bypassCooldown:true,pointerId});
    // Keep only the latest ten contacts while the local gesture resumes iOS.
    this.pendingContacts.push(event);if(this.pendingContacts.length>10)this.pendingContacts.shift();
    this.unlock();return true;
  }
  flushContacts(){
    if(!this.ready)return;
    const pending=this.pendingContacts.splice(0);
    if(!this.enabled||!this.active||this.settings.soundVolume===0||globalThis.document?.hidden)return;
    for(const event of pending)if(event.expires>=Date.now())this.cue(event.kind,event.x,event.mouse,{priority:2,bypassCooldown:true,pointerId:event.pointerId});
  }
  cancelContactFeedback(mouse,pointerId=null,{cancelHold=true}={}){
    const matchesPointer=event=>pointerId===null||event.pointerId===pointerId;
    this.pendingContacts=this.pendingContacts.filter(event=>event.mouse!==mouse||!matchesPointer(event));
    for(const voice of [...this.voices])if(voice.owner===mouse&&(voice.priority===2&&matchesPointer(voice)||voice.priority===1&&cancelHold))voice.cancel();
    if(cancelHold){const seen=this.observations.get(mouse);if(seen)seen.held=false;}
  }
  hit(mouse,width,outcome){const seen=this.observations.get(mouse);if(seen)seen.held=false;return this.contactFeedback(mouse,width,outcome);}
  update(mice,time,width,height=Infinity){
    if(!this.enabled||!this.active||!this.ready)return;
    const density=this.settings.soundFrequency,visible=mouse=>mouse.state==='active'&&!(mouse.hiddenUntil>time)&&mouse.x>=0&&mouse.x<=width&&mouse.y>=0&&mouse.y<=height;
    const calm=mouse=>visible(mouse)&&!mouse.hold&&!(mouse.activity?.until>time)&&!(mouse.injuredUntil>time)&&!['retreat','dart','injury','toss'].includes(mouse.hunt?.phase);
    for(const mouse of mice){
      const phase=mouse.hunt?.phase||(mouse.state==='away'?'hidden':mouse.leaving?'retreat':mouse.entering?'peek':mouse.moving?'creep':'watch');
      let seen=this.observations.get(mouse);
      if(!seen){seen={phase:null,next:time+.5+this.rng(),nibbling:false};this.observations.set(mouse,seen);}
      const x=clamp(mouse.x/Math.max(1,width),0,1),held=!!mouse.hold?.active;
      const activity=visible(mouse)&&!mouse.hold&&!mouse.moving&&(mouse.speed||0)<12&&phase==='watch'&&(mouse.hunt?.fear||0)<.3&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time)&&!(mouse.startledUntil>time)&&mouse.activity?.at<=time&&mouse.activity.until>time?mouse.activity:null;
      const activityKey=activity?`${activity.kind}:${activity.at}`:null;
      if(seen.activityKey&&seen.activityKey!==activityKey)for(const voice of [...this.voices])if(voice.owner===mouse&&voice.priority===0)voice.cancel();
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
        const hold=mouse.hold,dragSpeed=Math.hypot(hold.anchorVX||0,hold.anchorVY||0);
        if(!seen.held){this.cue('dragstart',x,mouse,{priority:1,bypassCooldown:true});seen.dragNext=time+.7;seen.scratchNext=time+1.2;}
        else if(dragSpeed>45&&time>=seen.dragNext){this.cue('dragloop',x,mouse,{priority:1,bypassCooldown:true});seen.dragNext=time+.7+this.rng()*.7;}
        else if(['tail','forepaw','hindpaw'].includes(hold.part)&&time>=seen.scratchNext){this.cue('scratch',x,mouse,{priority:1,bypassCooldown:true});seen.scratchNext=time+1.4+this.rng()*1.5;}
        seen.held=true;seen.next=time+2;continue;
      }
      if(seen.held){seen.held=false;this.cue('dragrelease',x,mouse,{priority:1,bypassCooldown:true});}
      const changed=seen.phase!==phase;
      seen.phase=phase;
      // One concealed rustle suggests a hiding place, then leave several seconds
      // of quiet. Faster movement earns short patter phrases, not a constant loop.
      const nibbling=visible(mouse)&&!mouse.hold&&!mouse.activity&&phase==='watch'&&!mouse.moving&&!(mouse.tossUntil>time)&&!(mouse.injuredUntil>time)&&!(mouse.startledUntil>time)&&mouse.nibblingUntil>time;
      if(nibbling&&!seen.nibbling&&visible(mouse)){this.cue('nibble',x);seen.next=time+2/density;}
      seen.nibbling=nibbling;
      if(changed&&['peek','dart','retreat'].includes(phase)){
        this.cue(phase==='dart'?'patter':phase,x);seen.next=time+(1+this.rng()*1.8)/density;
      }else if(time>=seen.next&&mouse.state!=='defeated'&&phase!=='injury'){
        const moving=mouse.moving&&phase!=='hidden'&&(mouse.speed??Math.hypot(mouse.vx||0,mouse.vy||0))>35;
        const roll=this.rng(),kind=nibbling?'nibble':moving?'patter':phase==='hidden'?'rustle':phase==='watch'&&roll<.3?'tease':roll<.55?'sniff':'rustle';
        this.cue(kind,x);
        seen.next=time+(moving?1.7+this.rng()*2.2:2.5+this.rng()*3.5)/density;
      }
    }
    // Sparse movement textures between nearby calm mice. Legacy call/reply
    // identifiers deliberately contain no distress vocal recordings.
    if(this.pendingReply&&time>=this.pendingReply.at){
      const {mouse,caller}=this.pendingReply;this.pendingReply=null;
      if(calm(mouse)&&calm(caller)&&Math.hypot(mouse.x-caller.x,mouse.y-caller.y)<Math.min(240,width*.3))this.cue('reply',mouse.x/width);
    }
    this.nextSocial??=time+4/density;
    if(time>=this.nextSocial){
      this.nextSocial=time+(6+this.rng()*6)/density;
      const nearby=mice.filter(calm);
      let pair;
      for(let i=0;i<nearby.length&&!pair;i++)for(let j=i+1;j<nearby.length;j++)if(Math.hypot(nearby[i].x-nearby[j].x,nearby[i].y-nearby[j].y)<Math.min(240,width*.3)){pair=[nearby[i],nearby[j]];break;}
      if(pair&&this.cue('call',pair[0].x/width))this.pendingReply={caller:pair[0],mouse:pair[1],at:time+.55+this.rng()*.35};
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
  diagnostics(){this.measure();return{state:this.context?.state||'locked',enabled:this.enabled,active:this.active,voices:this.voices.size,pendingContacts:this.pendingContacts.length,settings:{...this.settings},sampleCount:this.sampleBuffers.size,sampleTotal:recordedSamples.length,sampleErrors:this.sampleErrors.slice(0,3),audioSessionType:this.audioSession?.type||'unavailable',signalPeak:this.signalPeak,lastError:this.lastError,blockedReason:!this.enabled?'muted':this.settings.soundVolume===0?'volume-zero':!this.ready?(this.context?.state||'gesture-required'):this.lastError?'audio-error':null,played:this.played,last:this.lastPlayed};}
}
