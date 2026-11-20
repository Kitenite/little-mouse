import {createRouteMetricsTracker as make} from '../../../little-mouse/scripts/behavior-route-metrics.mjs';
import fs from 'node:fs';
const results=[];
for(const radius of [.005,.015,.03])for(const hz of [30,60,120]){
 const t=make({loopClosureDistance:radius});
 for(let i=0;i<=20*hz;i++){const a=i/hz*Math.PI;t.sample({time:i/hz,x:.5+.1*Math.cos(a),y:.5+.1*Math.sin(a),eligible:true,phase:'dart'});}
 const s=t.finalize();results.push({radius,hz,loops:s.closures.loop,comparisons:s.comparisonRoutes,repeats:s.repeatedCorridorRoutes,repetition:s.corridorRepetition,censored:s.censoredRoutes});
}
const after=JSON.parse(fs.readFileSync(new URL('./training-after.json',import.meta.url)));
const support=after.rows.map(row=>{const routes=row.diagnostics.routes,closures={};for(const r of routes)for(const[k,v]of Object.entries(r.closures))closures[k]=(closures[k]||0)+v;return{scenario:row.scenario,seed:row.seed,eligible:routes.reduce((s,r)=>s+r.eligibleRoutes,0),censored:routes.reduce((s,r)=>s+r.censoredRoutes,0),closures};});
console.log(JSON.stringify({results,support},null,2));
