import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,guardrails,assessCandidate,loadRuntime,utility,TRAIN,HOLDOUT} from '../scripts/behavior-benchmark.mjs';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const good={visiblePathRate:.1,visibleSpeed:.2,repetition:.2,coverage:.8,entropy:.6,visibleFraction:.5,finite:1,watchFraction:.1,creepFraction:.2,runFraction:.5,maxEmpty:3,maxPhaseStall:8,maxBlocked:1,freezeDrift:0,creepRate:.05,runRate:.3,fixedGoalTurns:.6,fixedGoalError:5,timeError:0,pawPenetration:0};
const result=m=>({metrics:m,rows:[{seed:11,scenario:'passive',metrics:m}],gates:guardrails(m),objective:utility(m),
 options:{seeds:[11],scenarios:['passive'],seconds:360,hz:30},sourceHash:'a'.repeat(64),benchmarkHash:'b'.repeat(64)});
test('objective gates reject all-run, invisible, NaN and collision-locked candidates despite higher utility',()=>{
 for(const patch of [{watchFraction:0,creepFraction:0,runFraction:1},{visibleFraction:0,visiblePathRate:0},{finite:0,coverage:NaN},{maxBlocked:7}]){
  const c=result({...good,...patch});c.objective=2;assert.equal(assessCandidate(c,result(good)).accepted,false);
 }
});
test('train needs 2 percent; heldout rejects per-scenario speed/coverage and safety regressions',()=>{
 assert.equal(assessCandidate(result(good),result(good)).accepted,false);
 const c=result({...good,coverage:.9});assert.equal(assessCandidate(c,result(good)).accepted,true);
 for(const patch of [{visiblePathRate:.094},{coverage:.75},{maxBlocked:1.1},{pawPenetration:1}])assert.equal(assessCandidate(result({...good,...patch}),result(good),{holdout:true}).accepted,false);
 assert.ok(TRAIN.every(s=>!HOLDOUT.includes(s)));
});
test('actual seeded production evaluation is reproducible and ignores Math.random',async()=>{
 const random=Math.random;Math.random=()=>{throw Error('unseeded randomness');};
 try{
  const options={seconds:12,seeds:[11],scenarios:['passive'],metadata:false};
  const a=await evaluate(options),b=await evaluate(options);assert.deepEqual(a.rows,b.rows);
  assert.equal(a.config.count,2);assert.equal(a.config.size,2.86);assert.equal(a.config.speed,2.8);assert.equal(a.config.morphologyVariation,.8);
  assert.notEqual(a.rows[0].identities[0],a.rows[0].identities[1]);assert.ok(a.metrics.visiblePath>0);
 }finally{Math.random=random;}
});
test('only reviewed bounded knobs can be patched',async()=>{
 for(const patch of [{size:2},{runThroughChance:1},{watchDuration:NaN},{creepSpeed:0}])await assert.rejects(evaluate({patch,seconds:1}));
});
test('frozen simulation clock preserves phase timers and actual paused positions',async()=>{
 const r=await loadRuntime(),m={state:'away',x:200,y:200,angle:0,targetX:200,targetY:200,hiddenUntil:0,restUntil:0,vx:0,vy:0,seed:1,identity:r.createMouseIdentity(11)},d=r.createHuntDirector(11),rng=r.identityRandom(11);
 r.updateHunt(m,r.settingsDefaults,1,1024,768,false,rng,d);const before=structuredClone(m);
 for(let i=0;i<100;i++){r.updateHunt(m,r.settingsDefaults,1,1024,768,false,rng,d);r.stepMice([m],r.settingsDefaults,1,0,1024,768);}
 assert.deepEqual(m,before);
});

test('acceptance fails closed on absent coverage, forged gates, NaN and missing metrics',()=>{
 const baseline=result(good);
 for(const candidate of [{...baseline,rows:[],gates:[],objective:2}, {...result({...good,visiblePathRate:NaN}),gates:[],objective:2}, {...result({}),gates:[],objective:2}, {...baseline,rows:[...baseline.rows,...baseline.rows],objective:2}])assert.equal(assessCandidate(candidate,baseline).accepted,false);
 assert.equal(assessCandidate({...baseline,objective:.01},baseline,{holdout:true}).accepted,false);
});
test('invalid and duplicate seeds/scenarios are rejected',async()=>{
 for(const seeds of [[NaN],['foo'],[11,11],[-1],[1.2]])await assert.rejects(evaluate({seeds,seconds:1}));
 await assert.rejects(evaluate({scenarios:['passive','passive'],seconds:1}));
});

test('forged scores, invalid baselines, negative metrics and incomparable protocols cannot be accepted',()=>{
 const baseline=result(good),candidate=result({...good,coverage:.9});
 for(const patch of [{freezeDrift:-1},{maxBlocked:-1},{pawPenetration:-1},{coverage:4},{entropy:3},{watchFraction:.8}])
  assert.equal(assessCandidate(result({...good,...patch}),baseline).accepted,false);
 for(const patch of [{objective:2},{sourceHash:'c'.repeat(64)},{benchmarkHash:'c'.repeat(64)},
  {options:{...candidate.options,seconds:1}},{options:{...candidate.options,hz:120}},
  {rows:[{...candidate.rows[0],objective:NaN}]}])assert.equal(assessCandidate({...candidate,...patch},baseline).accepted,false);
 for(const bad of [null,{},result({...good,maxBlocked:NaN}),{...baseline,objective:99}])assert.equal(assessCandidate(candidate,bad).accepted,false);
 assert.equal(assessCandidate(candidate,baseline).accepted,true,'valid measured improvement still passes');
});

test('real watch entry/update yields measured stationary exposure',async()=>{
 const r=await evaluate({seconds:12,seeds:[11],scenarios:['passive'],metadata:false});
 assert.ok(r.rows[0].metrics.watchControlSeconds>0);
 assert.equal(r.rows[0].metrics.freezeDrift,0);
 assert.match(r.sourceHash,/^[a-f0-9]{64}$/);assert.match(r.benchmarkHash,/^[a-f0-9]{64}$/);
});

test('a loaded evaluator refuses later on-disk script edits',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'prey-evaluator-'));
 try{
  const path=join(dir,'behavior-benchmark.mjs'),source=await readFile(new URL('../scripts/behavior-benchmark.mjs',import.meta.url),'utf8');
  await writeFile(path,source);
  for(const name of ['behavior-visibility.mjs','behavior-route-metrics.mjs','behavior-excursions.mjs'])
   await writeFile(join(dir,name),await readFile(new URL('../scripts/'+name,import.meta.url),'utf8'));
  const module=await import(pathToFileURL(path));
  module.assertEvaluatorUnchanged();await writeFile(path,source+'\n// changed after import\n');
  assert.throws(()=>module.assertEvaluatorUnchanged(),/Evaluator changed/);
 }finally{await rm(dir,{recursive:true,force:true});}
});


test('helper edits invalidate the loaded evaluator fingerprint',async()=>{
 for(const changed of ['behavior-visibility.mjs','behavior-route-metrics.mjs','behavior-excursions.mjs']){
  const dir=await mkdtemp(join(tmpdir(),'prey-helper-hash-'));
  try{
   for(const name of ['behavior-benchmark.mjs','behavior-visibility.mjs','behavior-route-metrics.mjs','behavior-excursions.mjs'])
    await writeFile(join(dir,name),await readFile(new URL('../scripts/'+name,import.meta.url),'utf8'));
   const module=await import(pathToFileURL(join(dir,'behavior-benchmark.mjs')));
   module.assertEvaluatorUnchanged();
   await writeFile(join(dir,changed),(await readFile(join(dir,changed),'utf8'))+'\n// changed dependency\n');
   assert.throws(()=>module.assertEvaluatorUnchanged(),/Evaluator changed/);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});

test('diagnostics report partial peeks without replacing legacy scores or learning',async()=>{
 const r=await evaluate({seconds:30,seeds:[11],scenarios:['passive'],metadata:true});
 assert.equal(r.version,4);assert.equal(r.diagnosticContract.participatesInUtility,false);
 assert.deepEqual(Object.keys(r.provenance.evaluatorHashes).sort(),['behavior-benchmark.mjs','behavior-excursions.mjs','behavior-route-metrics.mjs','behavior-visibility.mjs']);
 const row=r.rows[0],body=row.diagnostics.bodyVisibility;
 assert.equal(body.samples,1800);assert.equal(body.totalMouseSeconds,60);assert.equal(body.invalidSamples,0);
 assert.ok(body.anyBodyFraction>=row.metrics.visibleFraction-1e-10);
 assert.ok(body.partialOnlyFraction>0);assert.ok(body.areaWeightedFraction<=body.anyBodyFraction+1e-10);
 assert.ok(body.maxNoBodySeconds<=row.metrics.maxEmpty+1e-10);
 assert.equal(row.objective,utility(row.metrics));
 assert.equal(row.diagnostics.routes.length,2);
 for(const route of row.diagnostics.routes){
  assert.equal(route.samples,900);assert.equal(route.finalized,true);
  assert.equal(route.invalidSamples,0);
 }
});

test('archived runtime provides the diagnostic body profile rather than current public source',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'prey-runtime-profile-'));
 try{
  const publicDir=new URL('../public/',import.meta.url);
  for(const name of await readdir(publicDir))if(name.endsWith('.js'))
   await writeFile(join(dir,name),await readFile(new URL(name,publicDir),'utf8'));
  await writeFile(join(dir,'package.json'),' {"type":"module"} ');
  // Only the headless footprint uses this API in the loaded production policy/physics.
  await writeFile(join(dir,'body-profile.js'),'export function bodySection(){return {r:.001,z:1};}');
  const options={seconds:12,seeds:[11],scenarios:['passive'],metadata:false};
  const live=await evaluate(options),archive=await evaluate({...options,sourceDir:dir});
  assert.deepEqual(archive.rows[0].metrics,live.rows[0].metrics);
  assert.notDeepEqual(archive.rows[0].diagnostics.bodyVisibility,live.rows[0].diagnostics.bodyVisibility);
  assert.notEqual(archive.sourceHash,live.sourceHash);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('whole-appearance integration completes geometric crossings and censors contact or hidden interruptions',async()=>{
 for(const mode of ['continuous','hold','hidden','hidden-relocation','touch','toss','injury']){
  const dir=await mkdtemp(join(tmpdir(),'prey-excursion-wiring-'));
  try{
   const publicDir=new URL('../public/',import.meta.url);
   for(const name of await readdir(publicDir))if(name.endsWith('.js'))
    await writeFile(join(dir,name),await readFile(new URL(name,publicDir),'utf8'));
   await writeFile(join(dir,'package.json'),'{"type":"module"}');
   // A scripted input at the runtime boundary isolates adapter classification. It is
   // not evidence that production steering generates this authored trajectory.
   let hunt=await readFile(join(dir,'enrichment.js'),'utf8');
   hunt=hunt.replace('export function updateHunt(', 'function originalUpdateHunt(');
   hunt+=`\nexport function updateHunt(m,c,t,w,h,...rest){
    if(m.castIndex===undefined)return originalUpdateHunt(m,c,t,w,h,...rest);
    m.state='active';m.hiddenUntil=0;m.hunt={phase:'dart',chapter:{id:'fixture'}};
    m.targetX=2*w;m.targetY=h/2;return true;
   }\n`;
   await writeFile(join(dir,'enrichment.js'),hunt);
   let physics=await readFile(join(dir,'physics.js'),'utf8');
   physics=physics.replace('export function stepMice(', 'function originalStepMice(');
   physics+=`\nexport function stepMice(mice,c,t,dt,w,h,...rest){
    if(mice[0]?.castIndex===undefined)return originalStepMice(mice,c,t,dt,w,h,...rest);
    for(const m of mice){m.x=(-.6+t*.28)*w;m.y=h*(m.castIndex?.7:.3);m.angle=0;m.vx=.28*w;m.vy=0;
     const interrupted=t>=3&&t<4;
     m.hold=${JSON.stringify(mode)}==='hold'&&interrupted?{part:'body'}:null;
     m.hiddenUntil=['hidden','hidden-relocation'].includes(${JSON.stringify(mode)})&&interrupted?t+1:0;
     if(${JSON.stringify(mode)}==='hidden-relocation'&&t>=3.5)m.x+=.025*w;
     if(${JSON.stringify(mode)}==='touch'&&interrupted)m.hunt.phase='touch';
     m.tossUntil=${JSON.stringify(mode)}==='toss'&&interrupted?t+1:0;
     m.injuredUntil=${JSON.stringify(mode)}==='injury'&&interrupted?t+1:0;
    }return 0;
   }\n`;
   await writeFile(join(dir,'physics.js'),physics);
   const result=await evaluate({sourceDir:dir,seconds:9,seeds:[11],scenarios:['passive'],metadata:false});
   for(const excursion of result.rows[0].diagnostics.excursions){
    assert.equal(excursion.counts.invalidSamples,0);
    assert.equal(excursion.counts.completedAppearances,mode==='continuous'?1:0,mode);
    if(mode==='continuous'){
     assert.equal(excursion.history[0].entryEdge,'left');assert.equal(excursion.history[0].exitEdge,'right');
     assert.ok(excursion.history[0].signature[0].x<0,'partial entry is retained outside viewport');
     assert.ok(excursion.history[0].signature.at(-1).x>1,'partial exit is retained outside viewport');
    }else assert.ok(excursion.censorReasons.ineligible>0,mode);
   }
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});
