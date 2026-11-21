import {writeFileSync} from 'node:fs';
import {evaluate} from '/Users/kietho/workplace/mouse/little-mouse/scripts/behavior-benchmark.mjs';
const result=await evaluate();
writeFileSync('/tmp/excursion-critic-baseline.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({rows:result.rows.length,sourceHash:result.sourceHash,benchmarkHash:result.benchmarkHash,elapsedMs:result.elapsedMs,objective:result.objective}));
