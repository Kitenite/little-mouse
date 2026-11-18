import * as pl from 'planck';
import {stepMice} from '../../little-mouse/public/physics.js';
import {createContacts, beginContact, moveContact, updateContacts, endContact, cancelContact} from '../../little-mouse/public/contact.js';

export const LIMITS = Object.freeze({step:1/120, substeps:8, speed:900, spin:12, anchorSpeed:800, hold:.25, width:800, height:500, scale:50});
const {width:W,height:H,scale:S}=LIMITS;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=p=>({x:clamp(p.x,0,W),y:clamp(p.y,0,H)});
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const vec=p=>pl.Vec2(p.x/S,p.y/S);
const px=p=>({x:p.x*S,y:p.y*S});
const config={size:1,speed:0,variation:false,bounded:true,holdThreshold:.25,harmlessChance:1};

// Shared fixed-step budget; excess elapsed time is deliberately discarded, never queued.
export class Simulation {
  constructor(kind='planck', positions=[{x:220,y:250},{x:550,y:250}]) {
    this.kind=kind; this.time=0; this.accumulator=0; this.paused=false;
    this.claims=new Map(); this.contacts=createContacts(); this.collisions=0; this.steps=0;
    this.world=kind==='planck'?new pl.World(pl.Vec2(0,0)):null;
    if(this.world){
      this.ground=this.world.createBody();
      for(const [a,b] of [[{x:0,y:0},{x:W,y:0}],[{x:W,y:0},{x:W,y:H}],[{x:W,y:H},{x:0,y:H}],[{x:0,y:H},{x:0,y:0}]])this.ground.createFixture(new pl.Edge(vec(a),vec(b)));
      this.world.on('begin-contact',()=>this.collisions++);
    }
    this.mice=positions.map((p,id)=>this.makeMouse(p,id));
  }
  makeMouse(p,id){
    if(!this.world)return {id,...p,angle:0,vx:0,vy:0,turnRate:0,targetX:p.x,targetY:p.y,restUntil:1e9,hiddenUntil:0,state:'active',seed:id};
    const parts=[],joints=[];
    const add=(name,x,y,r)=>{
      const body=this.world.createDynamicBody({position:vec({x,y}),linearDamping:3.4,angularDamping:2,bullet:true});
      body.createFixture(new pl.Circle(r/S),{density:name==='body'?1:4,friction:.2,restitution:.35,filterGroupIndex:-(id+1)});
      parts.push({name,body,r});return body;
    };
    const body=add('body',p.x,p.y,39);
    for(const [name,dx,dy] of [['forepaw',24,-32],['forepaw',24,32],['hindpaw',-24,-32],['hindpaw',-24,32]]){
      const limb=add(name,p.x+dx,p.y+dy,9);
      joints.push(this.world.createJoint(new pl.RevoluteJoint({enableLimit:true,lowerAngle:-.65,upperAngle:.65},body,limb,vec({x:p.x+dx*.7,y:p.y+dy*.7}))));
    }
    let previous=body;
    for(let i=0;i<3;i++){
      const tail=add('tail',p.x-48-i*18,p.y,7);
      joints.push(this.world.createJoint(new pl.RevoluteJoint({enableLimit:true,lowerAngle:-.5,upperAngle:.5},previous,tail,vec({x:p.x-39-i*18,y:p.y}))));previous=tail;
    }
    return {id,body,parts,joints};
  }
  center(id){const m=this.mice[id];return this.world?px(m.body.getPosition()):{x:m.x,y:m.y};}
  partPose(id,index){
    const m=this.mice[id];
    if(this.world){const p=m.parts[index];return p?{...px(p.body.getPosition()),angle:p.body.getAngle(),name:p.name,r:p.r}:null;}
    const offsets=[[0,0,'body',39],[24,-32,'forepaw',9],[24,32,'forepaw',9],[-24,-32,'hindpaw',9],[-24,32,'hindpaw',9],[-48,0,'tail',7],[-66,0,'tail',7],[-84,0,'tail',7]];
    const p=offsets[index];if(!p)return null;const c=Math.cos(m.angle),t=Math.sin(m.angle);
    return {x:m.x+p[0]*c-p[1]*t,y:m.y+p[0]*t+p[1]*c,angle:m.angle,name:p[2],r:p[3]};
  }
  hit(p){
    if(!valid(p))return null;
    for(const m of this.mice)for(let index=7;index>=0;index--){const pose=this.partPose(m.id,index);if(Math.hypot(p.x-pose.x,p.y-pose.y)<=pose.r+5)return {id:m.id,part:pose.name,partIndex:index,body:this.world?m.parts[index].body:undefined};}
    return null;
  }
  begin(pointer,id,p,part='body',selectedBody,partIndex){
    if(this.paused||!valid(p)||!this.mice[id]||this.claims.has(pointer)||[...this.claims.values()].some(c=>c.id===id))return false;
    const m=this.mice[id],target=point(p),c={id,part,partIndex,target,anchor:{...target},started:this.time,active:false};
    if(this.world){
      const selected=partIndex!==undefined?m.parts[partIndex]:selectedBody?m.parts.find(x=>x.body===selectedBody):m.parts.find(x=>x.name===part);
      if(selected&&selected.name!==part&&part!=='head')return false;
      if(!selected&&part!=='head')return false;
      const body=selected?.body??m.body;
      for(const x of m.parts){x.body.setLinearVelocity(pl.Vec2());x.body.setAngularVelocity(0);}
      c.body=body;c.local=body.getLocalPoint(vec(target));
      // Pending ownership freezes the entire simplified pose while translating the anchor.
      for(const x of m.parts)x.body.setType('kinematic');
    }else if(!beginContact(this.contacts,m,{part,legIndex:partIndex>=1&&partIndex<=4?partIndex-1:undefined,fraction:part==='tail'&&partIndex>=5?Math.min(1,(12+(partIndex-5)*18)/87):undefined},pointer,target.x,target.y,this.time,config,1))return false;
    this.claims.set(pointer,c);return true;
  }
  move(pointer,p){const c=this.claims.get(pointer);if(!c||!valid(p))return false;c.target=point(p);if(!this.world)moveContact(this.contacts,pointer,c.target.x,c.target.y,1,this.time);return true;}
  release(pointer,cancel=false){
    const c=this.claims.get(pointer);if(!c)return null;const m=this.mice[c.id];let outcome;
    if(this.world){if(c.joint)this.world.destroyJoint(c.joint);for(const p of m.parts)p.body.setType('dynamic');if(cancel||!c.active)this.stop(m);else this.bound(m);outcome=cancel?'cancelled':c.active?'released':'tap';}
    else {if(cancel){cancelContact(this.contacts,pointer);this.stop(m);outcome='cancelled';}else outcome=endContact(this.contacts,pointer,this.time,W,H,1,config,()=>0)?.outcome;}
    this.claims.delete(pointer);return outcome;
  }
  stop(m){if(this.world){for(const p of m.parts){p.body.setLinearVelocity(pl.Vec2());p.body.setAngularVelocity(0);}}else {m.vx=m.vy=m.turnRate=0;m.tossUntil=0;}}
  bound(m){for(const p of m.parts){const v=p.body.getLinearVelocity(),speed=v.length(),scale=Math.min(1,LIMITS.speed/S/(speed||1));p.body.setLinearVelocity(pl.Vec2(v.x*scale,v.y*scale));p.body.setAngularVelocity(clamp(p.body.getAngularVelocity(),-LIMITS.spin,LIMITS.spin));}}
  cleanup(){for(const id of [...this.claims.keys()])this.release(id,true);}
  pause(value){this.cleanup();this.paused=value;this.accumulator=0;}
  step(dt){
    if(this.paused||!Number.isFinite(dt)||dt<=0)return 0;
    this.accumulator=Math.min(this.accumulator+dt,LIMITS.step*LIMITS.substeps);let count=0;
    while(this.accumulator+1e-12>=LIMITS.step&&count<LIMITS.substeps){
      this.accumulator=Math.max(0,this.accumulator-LIMITS.step);this.time+=LIMITS.step;count++;this.steps++;
      for(const c of this.claims.values()){
        c.active=this.time-c.started+1e-12>=LIMITS.hold;
        const dx=c.target.x-c.anchor.x,dy=c.target.y-c.anchor.y,d=Math.hypot(dx,dy),scale=Math.min(1,LIMITS.anchorSpeed*LIMITS.step/(d||1));
        c.anchor.x+=dx*scale;c.anchor.y+=dy*scale;
        if(this.world){
          const m=this.mice[c.id];
          if(!c.active){for(const p of m.parts){const old=p.body.getPosition();p.body.setTransform(pl.Vec2(old.x+dx*scale/S,old.y+dy*scale/S),p.body.getAngle());}}
          else {
            if(!c.joint){for(const p of m.parts)p.body.setType('dynamic');c.joint=this.world.createJoint(new pl.MouseJoint({maxForce:120*m.parts.reduce((sum,p)=>sum+p.body.getMass(),0),frequencyHz:6,dampingRatio:.85},this.ground,c.body,c.body.getWorldPoint(c.local)));}
            c.joint.setTarget(vec(c.anchor));
          }
        }
      }
      if(this.world){this.world.step(LIMITS.step,12,8);for(const m of this.mice)this.bound(m);}
      else {updateContacts(this.contacts,this.time,this.mice);this.collisions+=stepMice(this.mice,config,this.time,LIMITS.step,W,H);}
    }return count;
  }
  kick(id,vx,vy,spin=0){const m=this.mice[id];if(this.world){for(const p of m.parts){p.body.setLinearVelocity(vec({x:vx,y:vy}));p.body.setAngularVelocity(spin);}this.bound(m);}else {m.vx=vx;m.vy=vy;m.tossUntil=this.time+.65;m.turnRate=spin;}}
  snapshot(){return {kind:this.kind,time:this.time,steps:this.steps,paused:this.paused,collisions:this.collisions,claims:[...this.claims].map(([pointer,c])=>({pointer,id:c.id,part:c.part,partIndex:c.partIndex,active:c.active,target:{...c.target},anchor:{...c.anchor}})),mice:this.mice.map(m=>this.world?{id:m.id,...px(m.body.getPosition()),angle:m.body.getAngle(),vx:m.body.getLinearVelocity().x*S,vy:m.body.getLinearVelocity().y*S,spin:m.body.getAngularVelocity(),parts:m.parts.map(p=>({name:p.name,...px(p.body.getPosition()),r:p.r,angle:p.body.getAngle()})),joints:m.joints.map(j=>({angle:j.getJointAngle(),lower:j.getLowerLimit(),upper:j.getUpperLimit(),gap:pl.Vec2.distance(j.getAnchorA(),j.getAnchorB())*S}))}:{id:m.id,x:m.x,y:m.y,angle:m.angle,vx:m.vx,vy:m.vy,spin:m.turnRate,parts:[],joints:[]})};}
}
