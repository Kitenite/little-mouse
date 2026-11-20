// Browser-event adapter: classify completed episodes; never count pointerdown as a tap.
export function createLearningRuntime(learning){
 const pending=new Map(),anonymous=new WeakMap();let anonymousSerial=0;let serial=0,chapterSerial=-1,sessionActor='unknown';
 const clip=v=>Math.max(0,Math.min(1,v));
 return {
  begin({experiment=false,manual=false,context=null}={}){
   this.end(false);learning.configure({context});sessionActor=learning.status().actor||'unknown';
   learning.start({id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,actor:sessionActor,experiment,manual,context});chapterSerial=-1;
  },
  end(complete=false){pending.clear();learning.end({complete});},
  down(id,x,y,time,chapterId){if(pending.size<10)pending.set(id,{id:String(++serial),x,y,time,chapterId,distance:0});},
  move(id,x,y){const p=pending.get(id);if(p){p.distance+=Math.hypot(x-p.x,y-p.y);p.x=x;p.y=y;}},
  up(id,time,cancel=false,holdThreshold=.25){
   const p=pending.get(id);if(!p)return;pending.delete(id);
   learning.contact({id:p.id,chapterId:p.chapterId,actor:sessionActor,kind:cancel?'cancel':p.distance>8?'drag':time-p.time>=holdThreshold?'hold':'tap'});
  },
  cancel(){for(const id of pending.keys())this.up(id,0,true);},
  frame(mice,director,time,w,h){
   if(director.chapters.serial!==chapterSerial){
    chapterSerial=director.chapters.serial;const c=director.chapters;
    if(c.decision)learning.decision?.({chapterId:c.current.id,time:c.since,...c.decision});
   }
   for(const m of mice){
    const route=m.hunt?.route,phase=m.hunt?.phase;
    const signature=route?route.kind+':'+route.points.map(p=>p.map(v=>Math.round(v*5)).join(',')).join(';'):
     ['traverse','retreat','creep','dart'].includes(phase)?`${phase}:${Math.round((m.targetX/w)*5)},${Math.round((m.targetY/h)*5)}`:null;
    if(!anonymous.has(m))anonymous.set(m,`anonymous-${++anonymousSerial}`);
    const mouseId=Number.isInteger(m.castIndex)&&m.castIndex>=0?`cast-${m.castIndex}`:typeof m.identity?.id==='string'&&m.identity.id?m.identity.id:anonymous.get(m);
    learning.sample({mouseId,chapterId:m.hunt?.chapter?.id,time,
     x:clip(m.x/w),y:clip(m.y/h),heading:m.angle||0,
     visible:m.state==='active'&&(m.hiddenUntil||0)<=time&&m.x>=0&&m.x<=w&&m.y>=0&&m.y<=h,
     routeId:signature,routeInstanceId:`${m.hunt?.since}:${phase}`,discontinuity:!!m.hold||(m.tossUntil||0)>time});
   }
  }
 };
}
