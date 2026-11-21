import assert from 'node:assert/strict';
import {mkdirSync,copyFileSync,appendFileSync,writeFileSync} from 'node:fs';
import {createExcursionTracker} from '/Users/kietho/workplace/mouse/little-mouse/scripts/behavior-excursions.mjs';
const dir='/tmp/excursion-critic-hash-probe';mkdirSync(dir,{recursive:true});
for(const f of ['behavior-benchmark.mjs','behavior-excursions.mjs','behavior-route-metrics.mjs','behavior-visibility.mjs'])copyFileSync('/Users/kietho/workplace/mouse/little-mouse/scripts/'+f,dir+'/'+f);
const bench=await import(dir+'/behavior-benchmark.mjs');bench.assertEvaluatorUnchanged();
appendFileSync(dir+'/behavior-excursions.mjs','\n// critic mutation\n');assert.throws(()=>bench.assertEvaluatorUnchanged(),/Evaluator changed/);
const rates={};for(const hz of [30,60,120]){
 const t=createExcursionTracker();for(let i=0;i<=hz*4;i++){const time=i/hz,x=-.2+time*.35;t.sample({time,x,y:.5,eligible:true,visible:x>-.1&&x<1.1});}rates[hz]=t.finalize();assert.equal(rates[hz].counts.completedAppearances,1);
}
const t=createExcursionTracker({maxPoints:8,historySize:2});for(let i=0;i<50000;i++){const time=i/60,x=.5+.2*Math.sin(time);t.sample({time,x,y:.5,visible:true,eligible:true});}const bounded=t.finalize();assert.ok(bounded.storage.highWaterPoints<=8);assert.equal(bounded.censorReasons.overflow,1);
const mutate=createExcursionTracker();const p={time:0,x:.5,y:.5,visible:true,eligible:true};mutate.sample(p);p.x=100;const snapshot=mutate.snapshot();snapshot.active.pathLength=999;assert.equal(mutate.snapshot().active.pathLength,0);assert.deepEqual(mutate.finalize(),mutate.finalize());
writeFileSync('/tmp/excursion-critic-extra.json',JSON.stringify({helperMutationRejected:true,rates,bounded,inputSnapshotIsolation:true},null,2)+'\n');console.log('PASS hash mutation, 30/60/120 Hz crossing, 50000-sample bound, mutation isolation, idempotent finalize');
