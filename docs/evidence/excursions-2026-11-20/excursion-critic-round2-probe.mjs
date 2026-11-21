import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createExcursionTracker} from '/Users/kietho/workplace/mouse/little-mouse/scripts/behavior-excursions.mjs';
import {evaluate} from '/Users/kietho/workplace/mouse/little-mouse/scripts/behavior-benchmark.mjs';
const runtimeDir='/tmp/excursion-motion-baseline/little-mouse/public';
const baseline=JSON.parse(readFileSync('/tmp/excursion-critic-baseline.json'));
const current=await evaluate({sourceDir:runtimeDir});
for(const k of ['sourceHash','options','config','patch','metrics','objective','gates'])assert.deepEqual(current[k],baseline[k],k);
assert.deepEqual(current.rows.map(({diagnostics,...r})=>({...r,diagnostics:{bodyVisibility:diagnostics.bodyVisibility,routes:diagnostics.routes}})),baseline.rows);
const support={};for(const row of current.rows)for(const e of row.diagnostics.excursions){
 assert.equal(e.support.completed.appearances,e.counts.completedAppearances);assert.equal(e.support.censored.appearances,e.counts.censoredAppearances);
 for(const [name,bucket]of Object.entries(e.support)){support[name]??={};for(const [k,v]of Object.entries(bucket))support[name][k]=typeof v==='boolean'?(support[name][k]||v):(support[name][k]??0)+v;}
}
// Independent hand-computed cumulative support after history eviction and interruption.
const t=createExcursionTracker({historySize:1});const send=(time,x,visible=true,extra={})=>t.sample({time,x,y:.5,visible,eligible:true,...extra});
for(let j=0;j<4;j++){const start=j;send(start,-.2,false);send(start+.1,0);send(start+.2,.2);send(start+.3,.4);send(start+.4,.6,false);}
send(4,.3);send(4.1,.5);send(4.2,.7,true,{eligible:false});
const hand=t.finalize();const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} vs ${b}`);
assert.equal(hand.support.completed.appearances,4);near(hand.support.completed.pathLength,1.6);near(hand.support.completed.durationSeconds,.8);
assert.equal(hand.support.censored.appearances,1);near(hand.support.censored.pathLength,.2);near(hand.support.censored.durationSeconds,.1);assert.equal(hand.counts.historyEvictions,3);
assert.deepEqual(t.finalize(),hand);
const gap=createExcursionTracker();gap.sample({time:1,x:.2,y:.5,visible:true,eligible:true,discontinuity:true});gap.sample({time:101,x:.3,y:.5,visible:true,eligible:true});const discontinuityGap=gap.finalize();
const teleport=createExcursionTracker();teleport.sample({time:1,x:.2,y:.5,visible:true,eligible:true,discontinuity:true});teleport.sample({time:1.1,x:10,y:.5,visible:true,eligible:true});const discontinuityTeleport=teleport.finalize();
const hashes=Object.fromEntries(['behavior-excursions.mjs','behavior-benchmark.mjs'].map(f=>[f,createHash('sha256').update(readFileSync('/Users/kietho/workplace/mouse/little-mouse/scripts/'+f)).digest('hex')]));
writeFileSync('/tmp/excursion-critic-round2.json',JSON.stringify({runtimeDir,hashes,sourceHash:current.sourceHash,oldFieldsExactlyEqual:true,support,hand,discontinuityGap,discontinuityTeleport},null,2)+'\n');
console.log(JSON.stringify({oldFieldsExactlyEqual:true,support,gap:discontinuityGap.support,gapReasons:discontinuityGap.censorReasons,teleport:discontinuityTeleport.support,teleportReasons:discontinuityTeleport.censorReasons}));
