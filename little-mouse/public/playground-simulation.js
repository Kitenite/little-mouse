import{settingsDefaults,validateSettings}from'./settings.js';
import{identityRandom,createMouseIdentity,physicalBounds}from'./mouse-identity.js';
import{createHuntDirector,updateHunt,rememberTouch,clearHunt,forceHuntPhase}from'./enrichment.js';
import{updateLifecycle,sendOffscreen,pressMouse}from'./behavior.js';
import{stepMice,flee,radius}from'./physics.js';
import{updateIdleBehavior,forceIdleActivity,IDLE_ACTIVITIES}from'./idle-animation.js';
import{createContacts,recordPointer,removePointer,classifyContact,beginContact,moveContact,updateContacts,endContact,clearContacts}from'./contact.js';
export const LAB_STEP=1/60;
export const labDefaults={...settingsDefaults,count:8,size:.9};
export class PlaygroundSimulation{
 constructor({seed=314159,width=1024,height=768,settings={}}={}){this.width=width;this.height=height;this.config={...labDefaults,...validateSettings(settings)};this.paused=true;this.timeScale=1;this.selected=0;this.reset(seed);}
 reset(seed=this.seed,layout='lineup'){
  this.seed=(Number(seed)||0)>>>0;this.rng=identityRandom(this.seed);this.time=0;this.frames=0;this.accumulator=0;this.hits=0;this.events=[];this.obstacleSerial=0;
  if(this.contacts)clearContacts(this.contacts);this.contacts=createContacts();this.director=createHuntDirector();this.director.paws=this.contacts.obstacles;this.mice=[];this.ensureCount();this.arrange(layout);return this;
 }
 spawn(){const i=this.mice.length,r=radius(this.config.size,this.width,this.height);return{castIndex:i,identity:createMouseIdentity(Math.floor(this.rng()*4294967296)),state:'active',x:r+this.rng()*Math.max(1,this.width-2*r),y:r+this.rng()*Math.max(1,this.height-2*r),angle:this.rng()*Math.PI*2,targetX:this.width/2,targetY:this.height/2,next:0,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,seed:this.rng()*100};}
 ensureCount(){while(this.mice.length<this.config.count)this.mice.push(this.spawn());this.mice.length=this.config.count;this.selected=Math.min(this.selected,this.mice.length-1);updateContacts(this.contacts,this.time,this.mice);}
 configure(patch){const checked=validateSettings(patch);Object.assign(this.config,checked);if('mode'in checked)for(const m of this.mice)delete m.labMode;this.ensureCount();}
 setPaused(paused){this.paused=!!paused;this.accumulator=0;}
 setTimeScale(value){this.timeScale=Math.max(.1,Math.min(2,Number(value)||1));}
 resize(width,height){if(width>0&&height>0&&(width!==this.width||height!==this.height)){this.width=width;this.height=height;if(this.layout==='lineup'&&this.paused)this.arrange('lineup');}}
 targets(all=false){return all?this.mice:[this.mice[this.selected]].filter(Boolean);}
 restore(m){for(const[id,record]of this.contacts)if(record.m===m)removePointer(this.contacts,id);const identity=m.identity;const castIndex=m.castIndex;const seed=m.seed;const x=m.x,y=m.y;for(const key of Object.keys(m))delete m[key];Object.assign(m,{identity,castIndex,seed,x:Math.max(60,Math.min(this.width-60,x)),y:Math.max(60,Math.min(this.height-60,y)),angle:0,state:'active',hiddenUntil:0,restUntil:0,next:this.time,vx:0,vy:0,speed:0,moving:false,targetX:this.width/2,targetY:this.height/2});}
 arrange(layout='lineup'){
  clearContacts(this.contacts);this.layout=layout;const bounds=this.mice.map(m=>physicalBounds(m.identity,this.config)),rear=Math.max(...bounds.map(b=>b.tail))*this.config.size,front=Math.max(...bounds.map(b=>b.front))*this.config.size;const columns=Math.max(1,Math.min(this.mice.length,Math.floor(this.width/(rear+front+24)))),rows=Math.ceil(this.mice.length/columns);this.lineupFits=this.width>=rear+front+24&&this.height/rows>=Math.max(...bounds.map(b=>b.width))*this.config.size*2+14;
  this.mice.forEach((m,i)=>{this.restore(m);m.x=layout==='scatter'?this.width*(.15+this.rng()*.7):this.width*(i%columns)/columns+rear+(this.width/columns-rear-front)/2;m.y=layout==='scatter'?this.height*(.15+this.rng()*.7):this.height*(Math.floor(i/columns)+.5)/rows;m.angle=layout==='scatter'?this.rng()*Math.PI*2:0;forceHuntPhase(m,'watch',this.time,this.config,this.width,this.height,this.rng,this.director);});
 }
 force(action,all=false){
  if(![...IDLE_ACTIVITIES,'chase','tease','runthrough','hide','reentry','harmless','limp','hurt','defeat'].includes(action))throw Error('Unknown scenario');this.layout=null;
  for(const m of this.targets(all)){
   this.restore(m);m.labMode='hunt';
   if(IDLE_ACTIVITIES.includes(action)){forceHuntPhase(m,'watch',this.time,this.config,this.width,this.height,this.rng,this.director);forceIdleActivity(m,action,this.time,this.config);continue;}
   if(['harmless','limp','hurt','defeat'].includes(action)){
    // Inject only the outcome lottery; all contact reaction timing and escape setup are shared.
    const roll=action==='limp'?.70:action==='hurt'?.94:action==='defeat'?.1:.1;
    const result=pressMouse(m,m.x+4,m.y,this.time,this.width,this.height,this.config.size,()=>roll,{...this.config,harmlessChance:action==='harmless'?1:0,hitPart:'body'});
    this.recordHit({mouse:m,outcome:result,x:m.x,y:m.y});continue;
   }
   if(action==='reentry'||action==='runthrough'){
    clearHunt(m,this.time);m.state='away';m.hiddenUntil=this.time;updateLifecycle(m,this.time,this.width,this.height,this.config.size,this.config.hide,this.rng,this.config);
    if(action==='reentry'){m.labMode='stalk';continue;}
   }
   const phase={chase:'dart',tease:'peek',runthrough:'traverse',hide:'retreat'}[action];
   if(!phase)throw Error('Unknown scenario');forceHuntPhase(m,phase,this.time,this.config,this.width,this.height,this.rng,this.director);
  }
 }
 recordHit(result){if(!result?.outcome)return;this.hits++;this.events.push(result);}
 pointerDown(id,x,y,width=0,height=0,renderedHit){
  if(!recordPointer(this.contacts,id,x,y,this.time,width,height))return false;
  rememberTouch(this.director,x,y,this.time,this.width,this.height);
  let hit=renderedHit;
  if(renderedHit===undefined){for(const mouse of this.mice){if(mouse.state==='away'||mouse.state==='defeated'||mouse.hiddenUntil>this.time)continue;const part=classifyContact(mouse,x,y,this.config.size);if(part){hit={mouse,...part};break;}}}
  if(hit){this.selected=this.mice.indexOf(hit.mouse);return beginContact(this.contacts,hit.mouse,hit,id,x,y,this.time,this.config,this.config.size);}
  if(this.config.mode!=='hunt')for(const m of this.mice)flee(m,x,y,this.time,this.width,this.height,this.config.size);return false;
 }
 pointerMove(id,x,y,width=0,height=0){if(!this.contacts.paws.has(id))return;recordPointer(this.contacts,id,x,y,this.time,width,height);moveContact(this.contacts,id,x,y,this.config.size,this.time);}
 pointerUp(id){const result=endContact(this.contacts,id,this.time,this.width,this.height,this.config.size,this.config,this.rng);if(result)result.pointerId=id;this.recordHit(result);return result;}
 cancelPointer(id){removePointer(this.contacts,id);}
 placePaw(x,y,radius=45){const id='lab-paw-'+(++this.obstacleSerial);recordPointer(this.contacts,id,x,y,this.time,radius*2,radius*2);return id;}
 clearPaws(){clearContacts(this.contacts);}
 advanceOne(){this.advance(LAB_STEP);return LAB_STEP;}
 tick(wallSeconds){if(this.paused||!Number.isFinite(wallSeconds)||wallSeconds<=0)return 0;this.accumulator+=Math.min(.25,wallSeconds)*this.timeScale;let advanced=0;while(this.accumulator+1e-9>=LAB_STEP){this.advance(LAB_STEP);this.accumulator-=LAB_STEP;advanced+=LAB_STEP;}return advanced;}
 advance(dt){
  this.layout=null;this.time+=dt;this.frames++;updateContacts(this.contacts,this.time,this.mice);
  for(const m of this.mice){
   const wasDefeated=m.state==='defeated';const config=m.labMode?{...this.config,mode:m.labMode}:this.config;
   if((m.tossUntil||0)>this.time)continue;
   const handled=updateHunt(m,config,this.time,this.width,this.height,config.mode==='manual',this.rng,this.director);
   if(!handled&&updateLifecycle(m,this.time,this.width,this.height,config.size,config.hide,this.rng,config)&&!m.leaving&&!m.entering&&m.state!=='hurt'&&config.mode!=='manual'&&this.time>=m.next){
    if(this.rng()<(config.hide?.24:.13))sendOffscreen(m,this.time,this.width,this.height,config.size,this.rng);
    else{m.targetX=65+this.rng()*Math.max(1,this.width-130);m.targetY=90+this.rng()*Math.max(1,this.height-160);m.restUntil=config.mode==='stalk'?this.time+.4+this.rng()*1.8:this.time;m.next=this.time+(config.mode==='scurry'?.35+this.rng()*.75:2+this.rng()*3);}
   }
   if((wasDefeated||m.identityWasDefeated)&&m.state!=='defeated'){m.identity=createMouseIdentity(Math.floor(this.rng()*4294967296));delete m.identityWasDefeated;}
  }
  stepMice(this.mice,this.config,this.time,dt,this.width,this.height,this.contacts.obstacles.values());for(const m of this.mice)updateIdleBehavior(m,this.time,this.config,this.rng);
 }
 snapshot(){return{seed:this.seed,time:this.time,frames:this.frames,hits:this.hits,selected:this.selected,mice:this.mice.map(m=>({id:m.identity.id,state:m.state,phase:m.hunt?.phase,reaction:m.reaction,x:m.x,y:m.y,angle:m.angle,vx:m.vx,vy:m.vy,hiddenUntil:m.hiddenUntil,held:m.hold?.part,activity:m.activity?{...m.activity}:null})),paws:[...this.contacts.obstacles.values()].map(p=>({x:p.x,y:p.y,radius:p.radius,recent:p.recent||false}))};}
}
