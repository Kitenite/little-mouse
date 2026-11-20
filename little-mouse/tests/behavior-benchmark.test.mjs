import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,guardrails,assessCandidate,loadRuntime,utility,TRAIN,HOLDOUT} from '../scripts/behavior-benchmark.mjs';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
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
  const path=join(dir,'benchmark.mjs'),source=await readFile(new URL('../scripts/behavior-benchmark.mjs',import.meta.url),'utf8');
  await writeFile(path,source);const module=await import(pathToFileURL(path));
  module.assertEvaluatorUnchanged();await writeFile(path,source+'\n// changed after import\n');
  assert.throws(()=>module.assertEvaluatorUnchanged(),/Evaluator changed/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
