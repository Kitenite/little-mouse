// Four brief, ordered corner taps are much harder for resting paws to trigger
// than a single long press. Companion Pause and Escape remain alternatives.
export function createOwnerGesture(){let next=0,deadline=0,down=null;
 const corner=(x,y,w,h)=>{const r=Math.min(58,w*.12,h*.12);return x<r&&y<r?0:x>w-r&&y<r?1:x>w-r&&y>h-r?2:x<r&&y>h-r?3:-1;};
 return{cancel(){next=0;down=null;deadline=0;},down(id,x,y,w,h,time,single=true){if(!single||down){this.cancel();return;}if(time>deadline)next=0;const c=corner(x,y,w,h);if(c!==next){next=0;if(c!==0)return;}down={id,corner:c,time,x,y};},up(id,x,y,w,h,time){if(!down||down.id!==id)return false;const press=down;down=null;if(time-press.time>.45||Math.hypot(x-press.x,y-press.y)>18||corner(x,y,w,h)!==press.corner){this.cancel();return false;}if(next===0)deadline=time+4;next++;if(next===4){this.cancel();return true;}return false;}};
}
