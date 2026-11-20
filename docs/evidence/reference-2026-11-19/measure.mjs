import {pathToFileURL} from 'node:url';
const results=[];
if(process.argv.length!==4)throw Error('Usage: node measure.mjs BASELINE_PUBLIC CURRENT_PUBLIC');
for(const [index,root] of process.argv.slice(2).entries()){
 const {updateHunt,createHuntDirector}=await import(pathToFileURL(root+'/enrichment.js'));
 const {stepMice}=await import(pathToFileURL(root+'/physics.js'));
 const {settingsDefaults}=await import(pathToFileURL(root+'/settings.js'));
 const rows=[];
 for(const initial of [1,42,71,97,123]){
  let seed=initial;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const m={state:'away',x:512,y:384,angle:0,vx:0,vy:0,speed:0,targetX:512,targetY:384,hiddenUntil:0,restUntil:0,next:0,seed:1};
  const director=createHuntDirector();let visible=0,fast=0,distance=0,routeTime=0;
  for(let i=0;i<60*180;i++){
   const x=m.x,y=m.y;
   updateHunt(m,settingsDefaults,i/60,1024,768,false,rng,director);stepMice([m],settingsDefaults,i/60,1/60,1024,768);
   if(m.state!=='away'&&m.x>=0&&m.x<=1024&&m.y>=0&&m.y<=768){
    visible+=1/60;if(m.speed>300)fast+=1/60;
    const d=Math.hypot(m.x-x,m.y-y);if(d<100)distance+=d;
    if(m.hunt.route)routeTime+=1/60;
   }
  }
  rows.push({seed:initial,visibleSeconds:visible,fastVisibleSeconds:fast,visiblePathWidths:distance/1024,routeSeconds:routeTime});
 }
 results.push({variant:index===0?'before':'after',rows});
}
console.log(JSON.stringify(results,null,2));
