import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRouteMetricsTracker as make} from '../../../little-mouse/scripts/behavior-route-metrics.mjs';
function straight(change){const t=make();for(let i=0;i<=120;i++)t.sample({time:i/60,x:.2+.3*i/120,y:.4,phase:change?(i%2?'dart':'creep'):'dart',eligible:true});return t.finalize({complete:true});}
assert.deepEqual(straight(false),straight(true));
function circles(hz,seconds=8){const t=make();for(let i=0;i<=seconds*hz;i++){const a=i/hz*Math.PI;t.sample({time:i/hz,x:.5+.1*Math.cos(a),y:.5+.1*Math.sin(a),phase:'dart',eligible:true});}return t.finalize();}
const loops=[30,60,120].map(hz=>({hz,...circles(hz)}));assert(loops.every(r=>r.comparisonRoutes>0&&r.corridorRepetition>.5));
const gap=make();for(const [time,x,eligible,discontinuity] of [[0,.2,true,false],[.1,.3,true,false],[.2,-1,false,false],[.3,.4,true,false],[.4,.5,true,true],[.5,.6,true,false],[.6,.7,true,false]])gap.sample({time,x,y:.4,eligible,discontinuity,phase:'dart'});
const g=gap.finalize();assert.equal(g.invalidSamples,0);assert(Math.abs(g.eligibleDistance-.2)<1e-12);assert.equal(g.intervalReasons.ineligible,2);assert.equal(g.intervalReasons.discontinuity,2);
const baseline=JSON.parse(fs.readFileSync(new URL('./training-before.json',import.meta.url)));
let comparison='after artifact not yet present';
if(fs.existsSync(new URL('./training-after.json',import.meta.url))){const after=JSON.parse(fs.readFileSync(new URL('./training-after.json',import.meta.url)));assert.deepEqual(after.options,baseline.options);for(const key of ['metrics','objective','gates'])assert.deepEqual(after[key],baseline[key]);assert.equal(after.rows.length,baseline.rows.length);for(let i=0;i<after.rows.length;i++)for(const key of ['metrics','objective','gates','transitions','collisions','identities','chapters'])assert.deepEqual(after.rows[i][key],baseline.rows[i][key]);comparison=`legacy equality passed: ${after.rows.length} rows`;}
console.log(JSON.stringify({phaseInvariant:true,loops:loops.map(r=>({hz:r.hz,eligibleRoutes:r.eligibleRoutes,comparisons:r.comparisonRoutes,repetition:r.corridorRepetition,censored:r.censoredRoutes,distance:r.eligibleDistance})),eligibilityBreaks:true,comparison},null,2));
