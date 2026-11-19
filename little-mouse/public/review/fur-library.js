import * as T from '../vendor/three.module.js';
import {makeMouse,disposeMouse} from '../mouse3d.js';
import {createMouseIdentity} from '../mouse-identity.js';
import {createLighting} from '../lighting.js';
import {createBabylonFurPreview} from '../babylon-fur-preview.js';
const $=id=>document.getElementById(id),model=makeMouse(0,createMouseIdentity(314159)),renderer=new T.WebGLRenderer({canvas:$('current'),antialias:true});renderer.setSize(640,400,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new T.Scene();scene.background=new T.Color('#e6e3d9');scene.add(model.group);createLighting(scene).update({},640,400);const camera=new T.OrthographicCamera(-115,95,65,-65,.1,1000);camera.up.set(0,0,1);camera.position.set(0,-350,180);camera.lookAt(-10,0,15);
let preview=createBabylonFurPreview($('library'),model),time=0,top=false,busy=false,animating=false,frame=0;
function pose(){const kind=$('pose').value;model.animate(time,kind==='run',kind==='run'?180:0,1/60,1,.6,false,{x:time*180,y:0,heading:0,size:1,...(kind==='groom'?{activity:{kind:'groom',weight:1,elapsed:time}}:{}),...(kind==='hold'?{held:true,holdReference:{part:'body',pointerId:1,localX:0,localY:0}}:{})},{});}
function draw(){pose();renderer.render(scene,camera);preview.render();$('a').textContent=JSON.stringify({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles},null,2);$('b').textContent=JSON.stringify(preview.diagnostics(),null,2);}
$('shells').onchange=()=>{preview.dispose();preview=createBabylonFurPreview($('library'),model,{shells:Number($('shells').value)});setView();draw();};
function setView(){const y=top?-1:-350,z=top?500:180;camera.position.set(0,y,z);camera.lookAt(-10,0,15);preview.camera.position.set(0,y,z);const target=preview.camera.getTarget();target.set(-10,0,15);preview.camera.setTarget(target);}
$('view').onclick=()=>{top=!top;setView();draw();};$('pose').onchange=draw;
$('benchmark').onclick=async()=>{if(busy)return;busy=true;$('status').textContent='Measuring…';const a=[],b=[];for(let i=0;i<140;i++){time+=1/60;pose();let ta,tb;const measureCurrent=()=>{const t=performance.now();renderer.render(scene,camera);renderer.getContext().finish();ta=performance.now()-t;},measureLibrary=()=>{const t=performance.now();preview.render();preview.engine._gl.finish();tb=performance.now()-t;};if(i%2){measureLibrary();measureCurrent();}else{measureCurrent();measureLibrary();}if(i>=20){a.push(ta);b.push(tb);}if(i%10===0)await new Promise(r=>setTimeout(r,0));}const stats=x=>{x.sort((a,b)=>a-b);return{medianMs:x[60],p95Ms:x[114]}};window.furBenchmark={current:stats(a),library:stats(b),libraryMetrics:preview.diagnostics(),frames:120,gpuSynchronized:true,alternatingOrder:true,includesLibraryAdapter:true,pose:$('pose').value,device:navigator.userAgent};$('status').textContent=JSON.stringify(window.furBenchmark,null,2);busy=false;draw();};
$('animate').onclick=()=>{animating=!animating;$('animate').textContent=animating?'Pause':'Animate';};
function loop(){if(animating&&!busy&&!document.hidden){time+=1/60;draw();}frame=requestAnimationFrame(loop);}frame=requestAnimationFrame(loop);
window.furLibraryReview={model,renderer,get preview(){return preview},draw};
draw();preview.scene.executeWhenReady(()=>{draw();$('status').textContent='Ready';});setTimeout(draw,1000);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);preview.dispose();disposeMouse(model);renderer.dispose();});
