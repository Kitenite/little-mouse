// HISTORICAL failure assertions: expected to fail against repaired helper.
import assert from 'node:assert/strict';
import {createRouteMetricsTracker} from '../../../little-mouse/scripts/behavior-route-metrics.mjs';
import {createBodyVisibility} from '../../../little-mouse/scripts/behavior-visibility.mjs';
import {bodySection} from '../../../little-mouse/public/body-profile.js';
import {morphologyPoint,physicalTraits,createMouseIdentity} from '../../../little-mouse/public/mouse-identity.js';
const visibility=createBodyVisibility({bodySection,morphologyPoint,physicalTraits});
const mouse={identity:createMouseIdentity(11),x:512,y:384,angle:0};
assert.equal(visibility(mouse,{size:1},1024,768).fraction,1);
assert.equal(visibility({...mouse,x:-1000},{size:1},1024,768).fraction,0);
const peek=visibility({...mouse,x:-10},{size:1},1024,768);
assert(peek.fraction>0&&peek.fraction<1);
function route(changing){const tracker=createRouteMetricsTracker();for(let i=0;i<=120;i++)tracker.sample({time:i/60,x:.2+.3*i/120,y:.4,phase:changing?(i%2?'dart':'creep'):'dart',eligible:true});return tracker.finalize({complete:true});}
const stable=route(false),relabeled=route(true);
assert.equal(stable.eligibleRoutes,1);assert.equal(relabeled.eligibleRoutes,0);
function loops(){const t=createRouteMetricsTracker();for(let i=0;i<=480;i++){const a=i/120*2*Math.PI;t.sample({time:i/60,x:.5+.1*Math.cos(a),y:.5+.1*Math.sin(a),phase:'dart',eligible:true});}return t.finalize({complete:true});}
const repeatedLoops=loops();
assert.equal(repeatedLoops.comparisonRoutes,0);
console.log(JSON.stringify({visibility:{full:1,offscreen:0,peek:peek.fraction},phaseDependence:{stableRoutes:stable.eligibleRoutes,relabeledRoutes:relabeled.eligibleRoutes,stableDistance:stable.eligibleDistance,relabeledDistance:relabeled.eligibleDistance},fourIdenticalLoops:{eligibleRoutes:repeatedLoops.eligibleRoutes,comparisonRoutes:repeatedLoops.comparisonRoutes,repetition:repeatedLoops.corridorRepetition}},null,2));
