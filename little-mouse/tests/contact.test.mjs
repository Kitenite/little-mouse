import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createContacts,recordPointer,removePointer,localContact,classifyContact,beginContact,updateContacts,moveContact,endContact,cancelContact,clearContacts} from '../public/contact.js';
import {stepMice,radius} from '../public/physics.js';
import {updateHunt,createHuntDirector} from '../public/enrichment.js';
import {updateLifecycle} from '../public/behavior.js';
import {createMouseIdentity,physicalBounds} from '../public/mouse-identity.js';
const cfg={size:2.2,speed:1.2,mode:'hunt',hide:3,huntTempo:1,harmlessChance:1,holdThreshold:.25,pawAvoidanceRadius:50};
const mouse=()=>({x:400,y:300,angle:.7,state:'active',vx:0,vy:0,targetX:700,targetY:500,restUntil:0,hiddenUntil:0,seed:1});
const point=(m,lx,ly)=>({x:m.x+cfg.size*(lx*Math.cos(m.angle)+ly*Math.sin(m.angle)),y:m.y+cfg.size*(lx*Math.sin(m.angle)-ly*Math.cos(m.angle))});
test('rendered model coordinates anchor body/head exactly without mirrored jumps',()=>{
 for(const part of ['head','body']){const m=mouse(),c=createContacts(),p=point(m,part==='head'?32:0,12),before=[m.x,m.y];
  const local=localContact(m,p.x,p.y,cfg.size);assert.ok(Math.abs(local.localY-12)<1e-9);
  beginContact(c,m,{part,...local},1,p.x,p.y,0,cfg,cfg.size);
  assert.equal(m.state,'active');assert.equal(m.hitAt,undefined,'down does not damage');
  for(let i=0;i<90;i++){updateContacts(c,i/60);stepMice([m],cfg,i/60,1/60,1024,768);}
  assert.equal(m.hold.active,true);assert.ok(Math.hypot(m.x-before[0],m.y-before[1])<1e-8);assert.equal(m.speed,0);assert.equal(m.hitAt,undefined);
 }
});
test('location classification separates head, body, paws and tail under rotation',()=>{
 const m=mouse();for(const[part,lx,ly]of[['head',36,0],['body',0,0],['forepaw',20,22],['hindpaw',-22,-22],['tail',-80,0]]){const p=point(m,lx,ly);assert.equal(classifyContact(m,p.x,p.y,cfg.size).part,part);}
});
test('one mouse per pointer, multiple independent claims, cancel and cleanup never score',()=>{
 const c=createContacts(),a=mouse(),b={...mouse(),x:700};
 assert.equal(beginContact(c,a,{part:'body'},1,400,300,0,cfg,cfg.size),true);
 assert.equal(beginContact(c,a,{part:'head'},2,400,300,0,cfg,cfg.size),false);
 assert.equal(beginContact(c,b,{part:'body'},2,700,300,0,cfg,cfg.size),true);
 cancelContact(c,1);assert.equal(a.hold,undefined);assert.equal(endContact(c,1,1,1024,768,cfg.size,cfg),null);
 clearContacts(c);assert.equal(b.hold,undefined);assert.equal(c.size,0);assert.equal(a.hitAt,undefined);assert.equal(b.hitAt,undefined);
});
test('held release resolves once, escapes harmlessly, and preserves selected paw identity',()=>{
 const m=mouse(),c=createContacts();beginContact(c,m,{part:'forepaw',legIndex:3,pawOffsetX:2,pawOffsetY:-1},1,400,300,0,cfg,cfg.size);
 assert.equal(m.hold.legIndex,3);updateContacts(c,.5);const result=endContact(c,1,.5,1024,768,cfg.size,cfg,()=>0);
 assert.equal(result.outcome,'harmless');assert.equal(m.reaction,'dodge');assert.equal(m.hold,undefined);assert.equal(endContact(c,1,.6,1024,768,cfg.size,cfg),null);
});
test('stationary tail and paw contacts stay tethered with finite bounded motion',()=>{
 for(const part of ['tail','forepaw']){const m={...mouse(),angle:0},c=createContacts(),p=point(m,part==='tail'?-75:20,part==='tail'?0:21);
  beginContact(c,m,{part,fraction:.5,...localContact(m,p.x,p.y,cfg.size)},1,p.x,p.y,0,cfg,cfg.size);updateContacts(c,.3);
  let maxStep=0;for(let i=0;i<180;i++){const before=[m.x,m.y];stepMice([m],cfg,.3+i/60,1/60,1024,768);maxStep=Math.max(maxStep,Math.hypot(m.x-before[0],m.y-before[1]));assert.ok(Number.isFinite(m.x+m.y+m.angle));}
  const root=point(m,part==='tail'?-36:m.hold.localX,part==='tail'?0:m.hold.localY),reach=cfg.size*(part==='tail'?.93*87*.5:5);
  assert.ok(Math.hypot(root.x-p.x,root.y-p.y)<=reach+2);assert.ok(maxStep<7,'no tether teleport');
 }
});
test('drag follows with bounded speed and release tosses once without move damage',()=>{
 const m={...mouse(),angle:0},c=createContacts();beginContact(c,m,{part:'body'},1,400,300,0,cfg,cfg.size);
 for(let i=1;i<=24;i++){moveContact(c,1,400+i*8,300,cfg.size,i/60);updateContacts(c,i/60);const before=m.x;stepMice([m],cfg,i/60,1/60,1024,768);assert.ok(m.x-before<=800/60+.001);assert.equal(m.hitAt,undefined);}
 const at=m.x,result=endContact(c,1,.4,1024,768,cfg.size,cfg);assert.equal(result.outcome,'tossed');assert.ok(Math.hypot(m.throwVX,m.throwVY)<=900);assert.ok(m.throwVX>0);
 stepMice([m],cfg,.42,1/60,1024,768);assert.ok(m.x>at);assert.equal(endContact(c,1,.43,1024,768,cfg.size,cfg),null);
 const n=mouse(),d=createContacts();beginContact(d,n,{part:'body'},2,n.x,n.y,0,cfg,cfg.size);moveContact(d,2,1e6,-1e6,cfg.size,0);const before=[n.x,n.y];stepMice([n],cfg,0,0,1024,768);assert.deepEqual([n.x,n.y],before);stepMice([n],cfg,.01,.01,1024,768);assert.ok(Math.hypot(n.x-before[0],n.y-before[1])<=8.01);
});
test('stationary missed touches persist, have bounded capacity and steer mice around footprints',()=>{
 const c=createContacts();recordPointer(c,1,500,300,0,160,120);assert.equal(c.paws.get(1).radius,80);
 const m={...mouse(),x:200,y:300,angle:0,targetX:850,targetY:300};let min=Infinity;
 for(let i=0;i<360;i++){stepMice([m],cfg,i/60,1/60,1024,768,c.paws.values());min=Math.min(min,Math.hypot(m.x-500,m.y-300));}
 assert.ok(min>=80+radius(cfg.size,1024,768)-3,`clearance ${min}`);assert.ok(m.x>600,'detours and progresses beyond stationary paw');assert.equal(c.paws.size,1);
 for(let i=2;i<20;i++)recordPointer(c,i,0,0,1);assert.equal(c.paws.size,10);removePointer(c,1);assert.equal(c.paws.has(1),false);clearContacts(c);assert.equal(c.paws.size,0);
});
test('run-through crosses the viewport before hiding, then can return',()=>{
 const m={...mouse(),state:'away'},d=createHuntDirector();let seed=43;const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);let crossed=false,hidden=false,returned=false,entry;
 for(let i=0;i<120*60;i++){const t=i/60;updateHunt(m,{...cfg,runThroughChance:1},t,1024,768,false,rng,d);stepMice([m],cfg,t,1/60,1024,768);
  if(m.hunt.phase==='traverse'){entry??={x:m.x,y:m.y};if(Math.hypot(m.x-entry.x,m.y-entry.y)>700)crossed=true;}
  if(crossed&&m.hunt.phase==='hidden'){assert.ok(m.x<0||m.x>1024||m.y<0||m.y>768);hidden=true;}
  if(hidden&&m.hunt.phase==='peek'){returned=true;break;}
 }
 assert.ok(crossed&&hidden&&returned);
});
test('large individual tails clear the display completely before injury escape hides them',()=>{
 const c={...cfg,bodyLength:1.2,tailLength:1.4,morphologyVariation:1},m={...mouse(),identity:createMouseIdentity(21),leaving:true,exitEdge:0,state:'active',x:-140*cfg.size};
 const bound=physicalBounds(m.identity,c).tail;assert.ok(bound>140);updateLifecycle(m,1,1024,768,c.size,c.hide,()=>.5,c);assert.equal(m.state,'active');
 m.x=-(bound+10)*c.size;updateLifecycle(m,2,1024,768,c.size,c.hide,()=>.5,c);assert.equal(m.state,'away');
});

test('released paw footprints decay for four seconds without becoming physical walls',()=>{
 const c=createContacts();recordPointer(c,1,400,300,0,120,100);endContact(c,1,1,1024,768,cfg.size,cfg);assert.equal(c.paws.size,0);assert.equal(c.obstacles.size,1);assert.equal([...c.obstacles.values()][0].memory,1);
 updateContacts(c,3);assert.equal([...c.obstacles.values()][0].memory,.5);assert.equal([...c.obstacles.values()][0].releasedAt,1);
 const m={...mouse(),x:400,y:300,targetX:400,targetY:300,restUntil:10};stepMice([m],cfg,3,1/60,1024,768,c.obstacles.values());assert.ok(Math.hypot(m.x-400,m.y-300)<.01,'remembered touch does not physically push a resting mouse');
 updateContacts(c,5);assert.equal(c.obstacles.size,0);assert.equal(c.recentPaws.size,0);recordPointer(c,2,400,300,6);endContact(c,2,6,1024,768,cfg.size,cfg);clearContacts(c);assert.equal(c.obstacles.size,0);
});

test('tail tether respects a pelvis-rotated root instead of pulling toward the old centerline',()=>{
 const m={...mouse(),angle:.4},c=createContacts(),rootX=-34,rootY=14,p=point(m,rootX-39,rootY);
 beginContact(c,m,{part:'tail',fraction:.5,tailRootX:rootX,tailRootY:rootY,tailLength:87,...localContact(m,p.x,p.y,cfg.size)},1,p.x,p.y,0,cfg,cfg.size);updateContacts(c,.3);
 for(let i=0;i<180;i++)stepMice([m],cfg,.3+i/60,1/60,1024,768);
 const root=point(m,rootX,rootY);assert.ok(Math.hypot(root.x-p.x,root.y-p.y)<=cfg.size*.93*87*.5+2);assert.equal(m.hold.tailRootY,14);
});

test('fast paw and tail dragging carries the body instead of leaving the contact behind',()=>{
 for(const part of ['forepaw','hindpaw','tail']){const m={...mouse(),angle:0},c=createContacts(),p=point(m,part==='tail'?-75:part==='forepaw'?20:-22,part==='tail'?0:21);beginContact(c,m,{part,fraction:.5,...localContact(m,p.x,p.y,cfg.size)},1,p.x,p.y,0,cfg,cfg.size);updateContacts(c,.3);
  for(let i=1;i<=90;i++){const t=.3+i/60,targetX=p.x+i*7,targetY=p.y+20*Math.sin(i/12);moveContact(c,1,targetX,targetY,cfg.size,t);updateContacts(c,t);stepMice([m],cfg,t,1/60,2048,1536);assert.ok(Math.hypot(m.hold.x-targetX,m.hold.y-targetY)<.01,'contact should follow an ordinary fast drag');const root=point(m,part==='tail'?-36:m.hold.localX,part==='tail'?0:m.hold.localY),reach=cfg.size*(part==='tail'?.93*87*.5:5);assert.ok(Math.hypot(root.x-m.hold.x,root.y-m.hold.y)<=reach+2,'body must travel with the held anchor');}
 }
});
test('paused and invalid time steps do not move overlapping mice or contact anchors',()=>{const a=mouse(),b=mouse(),c=createContacts();beginContact(c,a,{part:'body'},1,a.x,a.y,0,cfg,cfg.size);moveContact(c,1,900,600,cfg.size,.1);const before=JSON.stringify([a,b]);for(const dt of [0,-1,NaN,Infinity]){stepMice([a,b],cfg,1,dt,1024,768);assert.equal(JSON.stringify([a,b]),before);}});
test('collision moves the free mouse without displacing a claimed mouse',()=>{const a={...mouse(),angle:0},b={...mouse(),x:410},c=createContacts();beginContact(c,a,{part:'body'},1,a.x,a.y,0,cfg,cfg.size);updateContacts(c,.3);const at=[a.x,a.y];stepMice([a,b],cfg,.4,1/60,1024,768);assert.deepEqual([a.x,a.y],at);assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>=2*radius(cfg.size,1024,768)-.001);});


test('release toss depends on integrated anchor motion, not redundant pointer events',()=>{
 const run=redundant=>{
  const m={...mouse(),x:300,y:300,angle:0},c=createContacts();beginContact(c,m,{part:'body'},1,300,300,0,cfg,cfg.size);
  for(let i=1;i<=18;i++){updateContacts(c,i/60);stepMice([m],cfg,i/60,1/60,2048,1536);}
  moveContact(c,1,900,300,cfg.size,.3);
  for(let i=19;i<=36;i++){updateContacts(c,i/60);stepMice([m],cfg,i/60,1/60,2048,1536);}
  if(redundant)moveContact(c,1,900,300,cfg.size,.6);
  const anchorVelocity=m.hold.anchorVX,result=endContact(c,1,.6,2048,1536,cfg.size,cfg,()=>0);
  return{outcome:result.outcome,vx:m.throwVX,anchorVelocity,x:m.x};
 };
 const a=run(false),b=run(true);assert.equal(a.outcome,'tossed');assert.deepEqual(a,b);assert.ok(a.vx>790&&a.vx<=800);
});
test('stationary settled release and cancellation never reuse prior drag energy',()=>{
 for(const cancel of [false,true]){
  const m={...mouse(),x:300,y:300,angle:0},c=createContacts();beginContact(c,m,{part:'body'},1,300,300,0,cfg,cfg.size);
  moveContact(c,1,380,300,cfg.size,.3);
  for(let i=1;i<=120;i++){updateContacts(c,i/60);stepMice([m],cfg,i/60,1/60,2048,1536);}
  moveContact(c,1,380,300,cfg.size,2);assert.ok(Math.hypot(m.hold.anchorVX,m.hold.anchorVY)<1e-6);
  if(cancel){cancelContact(c,1);assert.equal(endContact(c,1,2,2048,1536,cfg.size,cfg),null);assert.equal(m.throwVX,undefined);}
  else assert.equal(endContact(c,1,2,2048,1536,cfg.size,cfg,()=>0).outcome,'harmless');
 }
});


test('successful claim discards queued hunt cues even when cancelled before a policy tick',()=>{
 const c=createContacts(),m=mouse(),hunt={phase:'watch',sensed:17,reactAt:.5,reactKind:'retreat',lookAt:[390,300]};m.hunt=hunt;
 assert.equal(beginContact(c,m,{part:'body'},1,400,300,0,cfg,cfg.size),true);
 assert.equal(m.hunt,hunt);assert.deepEqual(hunt,{phase:'watch',sensed:17});
 assert.equal(cancelContact(c,1),true);assert.equal(m.hitAt,undefined);assert.equal(m.hold,undefined);
 assert.deepEqual(hunt,{phase:'watch',sensed:17});
 Object.assign(hunt,{reactAt:1,reactKind:'orient',lookAt:[650,450]});
 assert.equal(cancelContact(c,1),false);assert.equal(endContact(c,1,.2,1024,768,cfg.size,cfg),null);
 assert.deepEqual(hunt,{phase:'watch',sensed:17,reactAt:1,reactKind:'orient',lookAt:[650,450]},'fresh post-cancel cue survives stale cleanup');
});
test('rejected claims leave queued hunt cues untouched',()=>{
 const c=createContacts(),m=mouse();m.hunt={reactAt:.5,reactKind:'orient',lookAt:[600,300]};m.invulnerableUntil=1;
 const before=structuredClone(m.hunt);assert.equal(beginContact(c,m,{part:'body'},1,400,300,0,cfg,cfg.size),false);assert.deepEqual(m.hunt,before);
 m.invulnerableUntil=0;assert.equal(beginContact(c,m,{part:'body'},1,400,300,0,cfg,cfg.size),true);
 Object.assign(m.hunt,before);assert.equal(beginContact(c,m,{part:'head'},2,400,300,.1,cfg,cfg.size),false);assert.deepEqual(m.hunt,before);
});

test('sustained actual dragging defeats once while stationary holds stay alive',()=>{
 for(const part of ['body','head','forepaw','hindpaw','tail']){
  const m=mouse(),c=createContacts();recordPointer(c,1,m.x,m.y,0);
  beginContact(c,m,{part},1,m.x,m.y,0,{...cfg,dragDefeatAfter:2},cfg.size);
  let outcomes=[];for(let i=1;i<240;i++){const t=i/60;moveContact(c,1,400+Math.sin(t*3)*150,300,cfg.size,t);outcomes.push(...updateContacts(c,t,[m]));stepMice([m],cfg,t,1/60,1024,768);}
  assert.equal(outcomes.length,1,part);assert.equal(m.state,'defeated',part);assert.equal(c.has(1),false);assert.ok(c.paws.has(1),'paw persists after defeat');assert.equal(endContact(c,1,4,1024,768,cfg.size,cfg),null);
 }
 const m=mouse(),c=createContacts();beginContact(c,m,{part:'body'},1,m.x,m.y,0,cfg,cfg.size);
 for(let i=0;i<600;i++){assert.equal(updateContacts(c,i/60,[m]).length,0);stepMice([m],cfg,i/60,1/60,1024,768);}assert.equal(m.state,'active');
});
test('a live paw interrupts watching and repels a mouse instead of attracting it',()=>{
 const m={...mouse(),x:500,y:300,angle:0,targetX:450,targetY:300,restUntil:100};
 const paw={x:450,y:300,radius:50};const before=m.x;
 for(let i=0;i<60;i++)stepMice([m],{...cfg,travelSpeed:2.2},i/60,1/60,1024,768,[paw]);
 assert.ok(m.x>before+80);assert.ok(m.vx>=0);
});
