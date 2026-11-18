// Bounded, renderer-independent ground memory. Coordinates are CSS pixels.
export const ENVIRONMENT_CAPACITY=160;
export const materialResponses=Object.freeze(Object.fromEntries([
 ...['photo-linen','linen','felt','woven','denim','cork','paper'].map(id=>[id,'soft']),
 ...['photo-clearing','earth','sand'].map(id=>[id,'soil']),['grass','grass'],
 ...['photo-boards','chalk','ink','pale-blue','warm-yellow','plain','wood','walnut','birch','weathered','parquet','marble','limestone','slate','terrazzo','ceramic','terracotta','concrete','night'].map(id=>[id,'hard'])
]));
export class GroundMemory{
 constructor(){this.marks=Array.from({length:ENVIRONMENT_CAPACITY},()=>({life:0}));this.tracks=Array.from({length:8},()=>({id:null,x:0,y:0,distance:0,drag:false,feet:new Float64Array(8).fill(NaN)}));this.cursor=0;this.emitted=0;this.clear();}
 clear(){for(const p of this.marks)p.life=0;for(const s of this.tracks){s.id=null;s.distance=0;s.feet.fill(NaN);}this.active=0;}
 begin(config,t,w,h){const material=materialResponses[config.background]||'hard',strength=Math.max(0,Math.min(1,config.environmentStrength??.55));
  if(this.surface!==config.background||this.w!==w||this.h!==h||this.size!==config.size||t<this.time||t-this.time>.25||strength===0)this.clear();
  this.size=config.size;this.surface=config.background;this.material=material;this.strength=strength;this.persistence=Math.max(.2,Math.min(6,config.environmentPersistence??1.8));this.w=w;this.h=h;this.time=t;this.active=0;
  for(const p of this.marks){if(p.life&&t-p.at>=p.life)p.life=0;if(p.life)this.active++;}
 }
 add(x,y,rx,ry,angle,kind=0){if(x<0||y<0||x>this.w||y>this.h)return;const p=this.marks[this.cursor++%ENVIRONMENT_CAPACITY];if(!p.life)this.active++;p.x=x;p.y=y;p.rx=rx;p.ry=ry;p.angle=angle;p.kind=kind;p.at=this.time;p.life=kind===2?Math.min(.65,this.persistence):this.persistence;p.alpha=(this.material==='soft'?.075:.12)*this.strength;this.emitted++;}
 // feet is a reused array of rendered world x/y/z triples, not gait phase.
 sample(index,id,x,y,size,feet,drag=false,visible=true){const s=this.tracks[index];if(!s)return;
  if(!visible||!this.strength||this.material==='hard'){s.id=null;return;}
  if(s.id!==id){s.id=id;s.x=x;s.y=y;s.distance=0;s.drag=drag;for(let j=0;j<4;j++){const grounded=feet[j*3+2]>=0&&feet[j*3+2]<=3.7*size;s.feet[j*2]=grounded?feet[j*3]:NaN;s.feet[j*2+1]=grounded?feet[j*3+1]:NaN;}return;}
  // Claims can switch while stationary; never carry footprint or spacing history across modes.
  if(s.drag!==drag){s.drag=drag;s.distance=0;s.feet.fill(NaN);}
  const oldX=s.x,oldY=s.y,dx=x-oldX,dy=y-oldY,d=Math.hypot(dx,dy);s.x=x;s.y=y;
  if(d>Math.max(100,size*65)){this.clear();return;}
  if(d<.001){for(let j=0;j<4;j++)if(!(feet[j*3+2]>=0&&feet[j*3+2]<=3.7*size))s.feet[j*2]=s.feet[j*2+1]=NaN;return;} // Stationary animation cannot emit.
  const angle=Math.atan2(dy,dx);
  if(drag){const spacing=12*size,first=spacing-s.distance;let count=0;
   for(let travel=first;travel<=d+1e-8&&count<8;travel+=spacing,count++)this.add(oldX+dx*travel/d,oldY+dy*travel/d,17*size,8*size,angle,1);
   s.distance=(s.distance+d)%spacing;return;
  }
  s.distance=0;
  for(let j=0;j<4;j++){const k=j*3,q=j*2,fx=feet[k],fy=feet[k+1],z=feet[k+2];
   if(z>3.7*size||z<0||!Number.isFinite(fx+fy+z)){s.feet[q]=s.feet[q+1]=NaN;continue;}
   if(Number.isNaN(s.feet[q])){s.feet[q]=fx;s.feet[q+1]=fy;continue;}
   const footDX=fx-s.feet[q],footDY=fy-s.feet[q+1],gap=Math.hypot(footDX,footDY),spacing=14*size;
   const count=Math.min(8,Math.floor((gap+1e-8)/spacing));
   for(let n=0;n<count;n++){s.feet[q]+=footDX/gap*spacing;s.feet[q+1]+=footDY/gap*spacing;
    this.add(s.feet[q],s.feet[q+1],4.5*size,2.2*size,angle);
    // Sparse ground-level grit. Clearing stays soil; no invented leaves in its open center.
    if(this.material!=='soft'&&this.emitted%7===0)this.add(s.feet[q]-3*size,s.feet[q+1]+3*size,this.material==='grass'?1:1.8*size,this.material==='grass'?5*size:1*size,angle+.7,2);
   }
   // Discontinuities cannot create catch-up storms on later frames.
   if(gap>8*spacing){s.feet[q]=fx;s.feet[q+1]=fy;}
  }
 }
 opacity(p){return p.life?p.alpha*Math.exp(-3*(this.time-p.at)/p.life)*Math.min(1,(p.life-this.time+p.at)/.2):0;}
}
