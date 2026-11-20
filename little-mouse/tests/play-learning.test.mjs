import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayLearning, PLAY_LEARNING_KEY, PLAY_LEARNING_LIMITS, metricVersion, heuristicVersion } from '../public/play-learning.js';
const chapterId = 'sweeping';
function memory() { const map = new Map(); return { writes:0, getItem:k=>map.get(k)??null, setItem(k,v){this.writes++;map.set(k,v);} }; }
function sample(l,time,extra={}) { return l.sample({mouseId:'mouse', chapterId, time, x:.2, y:.2, heading:0, visible:true, ...extra}); }
function session(l,id,{actor='cat',kind='tap',complete=true,experiment=false,manual=false,seconds=30}={}) {
  assert.equal(l.start({id,actor,experiment,manual}),true);
  for(let t=0;t<=seconds;t++) sample(l,t);
  if(kind) l.contact({id:'contact',chapterId,actor,kind});
  l.end({complete});
}
test('requires three whole explicit cat sessions and per-chapter exposure; shrinks prior',()=>{
 const l=createPlayLearning();
 for(let i=0;i<2;i++) session(l,`cat${i}`);
 assert.equal(l.status().multipliers.sweeping,1);
 session(l,'cat2');
 assert.equal(l.status().support.sweeping.sessions,3);
 assert.equal(l.status().multipliers.sweeping,1.05);
 assert.equal(l.status().multipliers.stalking,1);
 assert.equal(l.status().metricVersion,metricVersion);
 assert.equal(l.status().heuristicVersion,heuristicVersion);
});
test('same-session duplicate contacts and start/end cannot create independent support',()=>{
 const l=createPlayLearning(); l.start({id:'one',actor:'cat'});
 for(let t=0;t<=300;t++)sample(l,t);
 for(let i=0;i<100;i++)l.contact({id:`tap${i}`,chapterId,actor:'cat',kind:'tap'});
 assert.equal(l.contact({id:'tap1',chapterId,actor:'cat',kind:'tap'}),false);
 assert.equal(l.start({id:'two',actor:'cat'}),false);
 l.end({complete:true}); assert.equal(l.end({complete:true}),false);
 assert.equal(l.start({id:'one',actor:'cat'}),false);
 assert.equal(l.status().support.sweeping.sessions,1);
 assert.equal(l.status().multipliers.sweeping,1);
});
test('excludes short, unknown, human, test, manual, experiment and interrupted sessions',()=>{
 const l=createPlayLearning();
 for(const actor of ['unknown','human','test'])session(l,actor,{actor});
 session(l,'short',{seconds:29}); session(l,'interrupted',{complete:false});
 session(l,'manual',{manual:true}); session(l,'experiment',{experiment:true});
 l.start({id:'mid',actor:'cat'}); for(let t=0;t<=30;t++)sample(l,t);
 l.configure({experiment:true});l.configure({experiment:false});l.end({complete:true});
 assert.equal(l.status().support.sweeping.sessions,0);
});
test('holds, drags, cancels and unattributed taps do not reward contact presence',()=>{
 const l=createPlayLearning();
 for(const kind of ['hold','drag','cancel'])session(l,kind,{kind});
 assert.equal(l.status().support.sweeping.contactSessions,0);
 assert.equal(l.status().multipliers.sweeping,.95);
 l.start({id:'unknown-contact',actor:'cat'});for(let t=0;t<=30;t++)sample(l,t);
 l.contact({id:'x',chapterId,kind:'tap'});l.end({complete:true});
 assert.equal(l.status().support.sweeping.contactSessions,0);
});
test('measures actual normalized displacement, wrapped turns and visible/elapsed fractions',()=>{
 const l=createPlayLearning();l.start({id:'metrics'});
 sample(l,0,{heading:Math.PI-.1});sample(l,.5,{x:.5,y:.6,heading:-Math.PI+.1});
 sample(l,1,{visible:false});sample(l,1.5,{x:1,y:1});sample(l,2,{discontinuity:true,x:0,y:0});
 const m=l.status().metrics.sweeping;
 assert.ok(Math.abs(m.pathDistance-.5)<1e-10);
 assert.ok(Math.abs(m.headingRotations-.2/(2*Math.PI))<1e-10);
 assert.equal(m.visibleSeconds,.5);assert.equal(m.elapsedSeconds,2);assert.equal(m.visibleFraction,.25);
 assert.equal(sample(l,2),false);sample(l,20,{x:1,y:1});
 assert.equal(l.status().metrics.sweeping.pathDistance,m.pathDistance);
});
test('route execution identity dominates changing signatures; successive executions repeat',()=>{
 const l=createPlayLearning();l.start({id:'routes'});
 sample(l,0,{routeId:'a',routeInstanceId:'1'});
 sample(l,.1,{routeId:'b',routeInstanceId:'1'});
 sample(l,.2,{routeId:'a',routeInstanceId:'2'});
 let m=l.status().metrics.sweeping;assert.equal(m.routeEntries,2);assert.equal(m.routeRepetitions,1);
 assert.equal(m.routeRepetitionFraction,.5);
});
test('actor preference is durable, defaults unknown, changing it excludes mixed session',()=>{
 const s=memory(),l=createPlayLearning(s);assert.equal(l.status().actor,'unknown');
 l.configure({actor:'cat'});const restored=createPlayLearning(s);restored.start({id:'cat'});
 assert.equal(restored.status().active.actor,'cat');restored.configure({actor:'human'});
 assert.equal(restored.status().active.excluded,true);
});
test('freeze fixes policy, excludes spanning sessions, reset clears evidence and preference',()=>{
 const s=memory(),l=createPlayLearning(s);for(let i=0;i<3;i++)session(l,`${i}`);
 l.start({id:'frozen',actor:'cat'});for(let t=0;t<=30;t++)sample(l,t);
 l.configure({frozen:true});assert.equal(l.status().multipliers.sweeping,1);
 assert.equal(createPlayLearning(s).status().frozen,true);
 l.configure({frozen:false});l.end({complete:true});assert.equal(l.status().support.sweeping.sessions,3);
 l.reset();assert.equal(l.status().retainedSessions,0);assert.equal(l.status().actor,'unknown');
 assert.equal(createPlayLearning(s).status().retainedSessions,0);
});
test('validated restore rejects corrupt, duplicate, oversized and out-of-bound records',()=>{
 const s=memory(),l=createPlayLearning(s);session(l,'valid');const good=l.export();
 assert.equal(createPlayLearning(s).status().retainedSessions,1);
 const bad=[ '{', 'x'.repeat(PLAY_LEARNING_LIMITS.bytes+1) ];
 let d=JSON.parse(good);d.sessions.push(d.sessions[0]);bad.push(JSON.stringify(d));
 d=JSON.parse(good);d.sessions[0].chapters.sweeping.pathDistance=-1;bad.push(JSON.stringify(d));
 d=JSON.parse(good);d.sessions[0].chapters.sweeping.visibleSeconds=100;bad.push(JSON.stringify(d));
 for(const raw of bad){s.setItem(PLAY_LEARNING_KEY,raw);const r=createPlayLearning(s);assert.equal(r.status().retainedSessions,0);assert.equal(r.status().storageError,'restore rejected');}
});
test('bounded retention, contacts, mice, decisions; no per-frame persistence; detached export/status',()=>{
 const s=memory(),l=createPlayLearning(s);l.start({id:'bounded',actor:'cat'});
 for(let t=0;t<1000;t++)sample(l,t/60);
 assert.equal(s.writes,0);
 for(let i=0;i<520;i++)l.contact({id:`c${i}`,chapterId,actor:'cat',kind:'tap'});
 assert.equal(l.status().active.chapters.sweeping.contacts.cat.tap,512);
 for(let i=0;i<20;i++)sample(l,0,{mouseId:`m${i}`});assert.equal(sample(l,1,{mouseId:'extra'}),false);
 for(let i=0;i<130;i++)l.decision({chapterId,time:i,baseDuration:60,multiplier:1.1,duration:65});
 assert.equal(l.status().active.decisions.length,128);
 assert.equal(l.decision({chapterId,time:0,baseDuration:60,multiplier:100,duration:6000}),false);
 l.end({complete:true});const exported=JSON.parse(l.export());assert.equal(exported.sessions[0].decisions.length,128);
 exported.sessions[0].id='changed';assert.equal(JSON.parse(l.export()).sessions[0].id,'bounded');
 for(let i=0;i<40;i++)session(l,`retained${i}`);
 assert.equal(l.status().retainedSessions,32);assert.ok(l.export().length<PLAY_LEARNING_LIMITS.bytes);
 assert.equal(createPlayLearning(s).status().retainedSessions,32);
 for(const scale of Object.values(l.status().multipliers))assert.ok(scale>=.85&&scale<=1.15);
});
test('storage failure is reported without breaking play',()=>{
 const l=createPlayLearning({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});
 assert.equal(l.status().storageError,'restore rejected');session(l,'works');
 assert.equal(l.status().storageError,'storage unavailable');assert.equal(l.status().retainedSessions,1);
});

test('hold discontinuity excludes both endpoints from motion and eligible exposure',()=>{
 const l=createPlayLearning();l.start({id:'hold-release',actor:'cat'});
 sample(l,0,{x:.1});sample(l,.1,{x:.2});
 const before=l.status().metrics.sweeping;
 sample(l,.2,{x:.4,discontinuity:true});sample(l,.3,{x:.8});
 const after=l.status().metrics.sweeping;
 assert.equal(after.pathDistance,before.pathDistance);
 assert.equal(after.visibleSeconds,before.visibleSeconds);
 sample(l,.4,{x:.9});
 assert.ok(Math.abs(l.status().metrics.sweeping.pathDistance-.2)<1e-10);
 assert.ok(Math.abs(l.status().metrics.sweeping.visibleSeconds-.2)<1e-10);
});

test('export declares research limits and pruning stays restorable with full decision logs',()=>{
 const storage=memory(),l=createPlayLearning(storage);
 assert.equal(createPlayLearning().status().storageMode,'memory-only');
 for(let i=0;i<32;i++){
  l.start({id:`full${i}`,actor:'cat'});
  for(let j=0;j<129;j++)l.decision({chapterId,time:j+.123456789,baseDuration:64.123456789,multiplier:1.123456789,duration:65});
  l.end({complete:true});
 }
 assert.equal(JSON.parse(l.export()).trainingReady,false);
 assert.ok(l.status().droppedSessions>0);
 assert.equal(l.status().droppedDecisions,32);
 assert.ok(storage.getItem(PLAY_LEARNING_KEY).length<=PLAY_LEARNING_LIMITS.bytes);
 const restored=createPlayLearning(storage);
 assert.equal(restored.status().storageError,null);
 assert.equal(restored.status().retainedSessions,l.status().retainedSessions);
 assert.equal(restored.status().droppedSessions,l.status().droppedSessions);
 assert.equal(restored.status().droppedDecisions,32);
});
