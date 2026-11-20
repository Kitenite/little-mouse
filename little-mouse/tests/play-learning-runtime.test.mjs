import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLearningRuntime} from '../public/play-learning-runtime.js';
const fixture=()=>{const calls=[];const learner={status:()=>({actor:'cat'}),start:p=>calls.push(['start',p]),end:p=>calls.push(['end',p]),sample:p=>calls.push(['sample',p]),contact:p=>calls.push(['contact',p]),decision:p=>calls.push(['decision',p])};return{calls,r:createLearningRuntime(learner)};};
test('completed episodes distinguish taps, stationary holds, accumulated drag and cancel',()=>{
 const {r,calls}=fixture();r.begin();
 r.down(1,100,100,0,'sweeping');assert.equal(calls.some(c=>c[0]==='contact'),false);
 r.up(1,.1);r.up(1,.2);
 r.down(1,100,100,1,'bursts');r.up(1,2);
 r.down(2,100,100,2,'stalking');r.move(2,106,100);r.move(2,100,100);r.up(2,2.1);
 r.down(3,100,100,3,'ambush');r.cancel();
 const contacts=calls.filter(c=>c[0]==='contact').map(c=>c[1]);
 assert.deepEqual(contacts.map(p=>p.kind),['tap','hold','drag','cancel']);assert.equal(new Set(contacts.map(p=>p.id)).size,4);
 assert.equal(contacts[0].chapterId,'sweeping');assert.ok(contacts.every(p=>p.actor==='cat'));
});
test('unknown pointers are ignored; stopping cannot turn pending touches into taps',()=>{
 const {r,calls}=fixture();r.begin({experiment:true});r.up(99,1);r.down(2,1,1,0,'sweeping');r.end(false);r.up(2,.1);
 assert.equal(calls.some(c=>c[0]==='contact'),false);assert.equal(calls.at(-1)[1].complete,false);
 assert.equal(calls.find(c=>c[0]==='start')[1].experiment,true);
});
test('frame adapter records hidden transitions, route instances and one decision per chapter',()=>{
 const {r,calls}=fixture(),m={castIndex:0,state:'active',x:50,y:50,angle:0,hunt:{phase:'dart',since:1,chapter:{id:'bursts'},route:{kind:'crossfield',points:[[.2,.4],[.8,.7]]}}};
 const d={chapters:{serial:1,current:{id:'bursts'},since:1,decision:{baseDuration:40,multiplier:1.1,duration:44}}};
 r.frame([m],d,2,100,100);m.state='away';m.x=-50;r.frame([m],d,3,100,100);
 const samples=calls.filter(c=>c[0]==='sample').map(c=>c[1]);assert.equal(samples[0].visible,true);assert.equal(samples[1].visible,false);
 assert.equal(samples[0].mouseId,samples[1].mouseId);assert.equal(samples[0].routeInstanceId,'1:dart');
 assert.equal(calls.filter(c=>c[0]==='decision').length,1);
});

test('anonymous mice have stable distinct identities instead of a shared undefined key',()=>{
 const {r,calls}=fixture(),a={state:'active',x:10,y:50,angle:0},b={state:'active',x:90,y:50,angle:0},d={chapters:{serial:0}};
 r.frame([a,b],d,0,100,100);r.frame([a,b],d,.1,100,100);
 const ids=calls.filter(c=>c[0]==='sample').map(c=>c[1].mouseId);
 assert.notEqual(ids[0],ids[1]);assert.equal(ids[0],ids[2]);assert.equal(ids[1],ids[3]);
});
