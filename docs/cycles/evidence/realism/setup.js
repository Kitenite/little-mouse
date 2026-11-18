// Browser-evaluated review harness. Imports production modules; edits no app source.
(async()=>{
 window.playgroundDrive?.pause();
 const {MouseScene}=await import('/mouse3d.js');
 const {PlaygroundSimulation}=await import('/playground-simulation.js');
 const canvas=document.createElement('canvas');
 canvas.style='position:fixed;inset:0;width:1200px;height:700px;background:#ddd8ce;z-index:99999';
 document.body.append(canvas);
 const scene=new MouseScene(canvas);
 const sim=new PlaygroundSimulation({seed:428,width:1200,height:700,settings:{count:1,size:3,sound:false,coatPalette:'natural',morphologyVariation:0,background:'plain',lighting:'studio',idleActivityFrequency:0,nibbleFrequency:0}});
 const draw=(dt=0)=>scene.render(sim.mice,sim.config,sim.time,dt);
 const reset=()=>{sim.reset(428);sim.mice[0].x=650;sim.mice[0].y=350;draw();};
 const camera=view=>{scene.camera.up.set(0,view==='top'?1:0,view==='top'?0:1);scene.camera.position.set(0,view==='top'?0:-700,view==='top'?700:view==='side'?35:210);scene.camera.lookAt(0,0,view==='top'?0:35);draw();};
 const step=n=>{for(let i=0;i<n;i++){sim.advanceOne();draw(1/60);}};
 window.review={scene,sim,canvas,draw,reset,camera,step};reset();camera('top');
 return JSON.stringify({seed:sim.seed,config:sim.config,snapshot:sim.snapshot(),userAgent:navigator.userAgent,canvas:[1200,700]});
})()
