import {Simulation} from './core.mjs';
import {createReplay,advanceReplay} from './replay.mjs';
let sims,previous,script=null;const captures=new Map();
const canvases=[...document.querySelectorAll('canvas')];
function cleanup(){for(const s of sims)s.cleanup();for(const [id,{canvas}] of captures){if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}captures.clear();}
function reset(positions){if(sims)cleanup();sims=['kinematic','planck'].map(k=>new Simulation(k,positions));script=null;document.querySelector('#pause').textContent='Pause';}
reset();
for(const [index,canvas] of canvases.entries()){
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*800/r.width,y:(e.clientY-r.top)*500/r.height};};
 canvas.addEventListener('pointerdown',e=>{const p=point(e),hit=sims[index].hit(p);if(!hit||sims[index].paused)return;script=null;
   const origin=sims[index].partPose(hit.id,hit.partIndex),dx=p.x-origin.x,dy=p.y-origin.y;
   const local={x:dx*Math.cos(origin.angle)+dy*Math.sin(origin.angle),y:-dx*Math.sin(origin.angle)+dy*Math.cos(origin.angle)};
   const offsets=sims.map(s=>{const pose=s.partPose(hit.id,hit.partIndex);return {x:pose.x+local.x*Math.cos(pose.angle)-local.y*Math.sin(pose.angle)-p.x,y:pose.y+local.x*Math.sin(pose.angle)+local.y*Math.cos(pose.angle)-p.y};});
   const accepted=sims.map((s,i)=>s.begin(e.pointerId,hit.id,{x:p.x+offsets[i].x,y:p.y+offsets[i].y},hit.part,undefined,hit.partIndex));
   if(accepted.some(Boolean)){canvas.setPointerCapture(e.pointerId);captures.set(e.pointerId,{canvas,offsets});}
 });
 canvas.addEventListener('pointermove',e=>{const capture=captures.get(e.pointerId);if(capture?.canvas!==canvas)return;const p=point(e);sims.forEach((s,i)=>s.move(e.pointerId,{x:p.x+capture.offsets[i].x,y:p.y+capture.offsets[i].y}));});
 const end=(e,cancel)=>{for(const s of sims)s.release(e.pointerId,cancel);captures.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
 canvas.addEventListener('pointerup',e=>end(e,false));
 canvas.addEventListener('pointercancel',e=>end(e,true));
 canvas.addEventListener('lostpointercapture',e=>end(e,true));
}
window.addEventListener('blur',()=>{cleanup();script=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cleanup();script=null;previous=undefined;}});
window.addEventListener('pagehide',cleanup);
window.addEventListener('resize',()=>{cleanup();script=null;});
document.querySelector('#reset').onclick=()=>reset();
document.querySelector('#cancel').onclick=()=>{cleanup();script=null;};
document.querySelector('#pause').onclick=()=>{const paused=!sims[0].paused;cleanup();script=null;for(const s of sims)s.pause(paused);document.querySelector('#pause').textContent=paused?'Resume':'Pause';};
document.querySelector('#run').onclick=()=>{cleanup();const result=createReplay(document.querySelector('#scenario').value);sims=result.simulations;script=result.replay;document.querySelector('#pause').textContent='Pause';};
function draw(s,canvas){const snap=s.snapshot(),ctx=canvas.getContext('2d');ctx.clearRect(0,0,800,500);for(const m of snap.mice){ctx.strokeStyle='#475468';ctx.fillStyle=m.id?'#a87559':'#64788e';if(m.parts.length){for(const p of m.parts){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();}}else{ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.angle);ctx.beginPath();ctx.moveTo(-36,0);ctx.lineTo(-90,0);ctx.stroke();for(const x of [-24,24])for(const y of [-32,32]){ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.arc(0,0,39,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x+35*Math.cos(m.angle),m.y+35*Math.sin(m.angle));ctx.stroke();}for(const c of snap.claims){ctx.fillStyle=c.active?'#cf9800':'#e66840';ctx.beginPath();ctx.arc(c.target.x,c.target.y,6,0,Math.PI*2);ctx.fill();}document.querySelector(`#${s.kind}-status`).textContent=`time ${snap.time.toFixed(2)} s · claims ${snap.claims.length} · contacts/impulses ${snap.collisions}\n`+snap.mice.map(m=>`mouse ${m.id}: speed ${Math.hypot(m.vx,m.vy).toFixed(1)} px/s · spin ${m.spin.toFixed(2)} rad/s`).join('\n');}
function tick(now){const dt=previous===undefined?0:(now-previous)/1000;previous=now;
 if(script&&!sims[0].paused){ // One shared deterministic input/physics step per rendered frame.
  advanceReplay(sims,script);if(script.done)script=null;
 }else for(const s of sims)s.step(dt);
 sims.forEach((s,i)=>draw(s,canvases[i]));requestAnimationFrame(tick);
}
// Detached JSON data only: callers cannot reach mutable simulations or Planck objects.
Object.defineProperty(window,'physicsPrototype',{value:Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({simulations:sims.map(s=>s.snapshot()),captures:captures.size,scenario:script?{...script}:null}))}),writable:false,configurable:false});
requestAnimationFrame(tick);
