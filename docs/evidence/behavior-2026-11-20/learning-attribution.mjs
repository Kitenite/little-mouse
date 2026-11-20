import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createPlayLearning} from '../../../little-mouse/public/play-learning.js';
import {createLearningRuntime} from '../../../little-mouse/public/play-learning-runtime.js';
const director={chapters:{serial:1,current:{id:'sweeping'},since:0,decision:{baseDuration:40,multiplier:1,duration:40}}};
const mouse=()=>({castIndex:0,state:'active',x:10,y:50,angle:0,hunt:{phase:'dart',since:0,chapter:{id:'sweeping'}}});
function setup(actor='cat',options={}){const l=createPlayLearning();l.configure({actor});const r=createLearningRuntime(l);r.begin(options);return{l,r};}
test('regression: release interval excludes owner-driven displacement',()=>{
 const {l,r}=setup(),m=mouse();r.frame([m],director,0,100,100);
 m.hold={active:true};m.x=50;r.frame([m],director,.1,100,100);
 // Release/drag settles to its final position before next frame.
 delete m.hold;m.x=90;r.frame([m],director,.2,100,100);
 const metric=l.status().active.chapters.sweeping;
 assert.equal(metric.pathDistance,0);assert.equal(metric.visibleSeconds,0);
 console.log('release regression',JSON.stringify({pathDistance:metric.pathDistance,visibleSeconds:metric.visibleSeconds}));
});
test('regression: unrelated anonymous mice have separate motion baselines',()=>{
 const {l,r}=setup(),a=mouse(),b=mouse();delete a.castIndex;delete b.castIndex;b.x=90;
 r.frame([a],director,0,100,100);r.frame([b],director,.1,100,100);
 assert.equal(l.status().active.chapters.sweeping.pathDistance,0);
 console.log('anonymous identity path',l.status().active.chapters.sweeping.pathDistance);
});
test('controls: interruptions, experiments, manual and unknown actor never gain support',()=>{
 for(const mode of ['interrupted','experiment','manual','unknown']){
 const {l,r}=setup(mode==='unknown'?'unknown':'cat',{experiment:mode==='experiment',manual:mode==='manual'}),m=mouse();
 for(let t=0;t<=31;t++)r.frame([m],director,t,100,100);
 r.down(1,10,10,30,'sweeping');r.up(1,30.1);r.end(mode!=='interrupted');
 assert.equal(l.status().support.sweeping.sessions,0,mode);
 }
});
test('controls: hold/drag/cancel do not become positive tap evidence',()=>{
 const {l,r}=setup(),m=mouse();for(let t=0;t<=31;t++)r.frame([m],director,t,100,100);
 r.down(1,10,10,30,'sweeping');r.up(1,31);
 r.down(2,10,10,31,'sweeping');r.move(2,30,10);r.up(2,31.1);
 r.down(3,10,10,31,'sweeping');r.cancel();r.end(true);
 assert.equal(l.status().support.sweeping.contactSessions,0);
});

test('same execution target changes and visibility transitions do not invent route entries',()=>{
 const {l,r}=setup(),m=mouse();m.targetX=50;m.targetY=50;
 r.frame([m],director,0,100,100);m.targetX=80;r.frame([m],director,.1,100,100);
 m.state='away';r.frame([m],director,.2,100,100);m.state='active';r.frame([m],director,.3,100,100);
 assert.equal(l.status().active.chapters.sweeping.routeEntries,1);
 m.hunt.since=1;m.targetX=50;r.frame([m],director,.4,100,100);
 assert.equal(l.status().active.chapters.sweeping.routeEntries,2);
 assert.equal(l.status().active.chapters.sweeping.routeRepetitions,1);
});
