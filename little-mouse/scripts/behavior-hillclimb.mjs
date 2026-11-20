import {writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {evaluate,assessCandidate,loadRuntime,assertEvaluatorUnchanged,TRAIN,HOLDOUT,KNOBS,cliOptions} from './behavior-benchmark.mjs';
const hash=()=>createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),searchHash=hash();
function assertSearchUnchanged(){assertEvaluatorUnchanged();if(hash()!==searchHash)throw Error('Search script changed; restart the process');}
export async function hillclimb({final=false,sourceDir}={}){
 assertSearchUnchanged();
 const started=performance.now(),runtime=await loadRuntime(sourceDir),options={sourceDir,seeds:final?TRAIN:[11],seconds:final?360:30,hz:30};
 const baseline=await evaluate(options),candidates=[],rounds=[],cache=new Map([['{}',baseline]]);let incumbent=baseline,patch={};
 for(let round=1;round<=3;round++){
  const start=incumbent;let best=incumbent,bestPatch=patch;
  // A round evaluates the coordinate neighborhood of its frozen incumbent.
  for(const key of KNOBS)for(const direction of [-1,1]){
   const spec=runtime.settingsSchema[key],base=runtime.settingsDefaults[key];
   const value=+Math.max(spec.min,base*.8,Math.min(spec.max,base*1.2,(patch[key]??base)+direction*base*.1)).toFixed(8);
   const next={...patch,[key]:value};if(value===base)delete next[key];
   const id=JSON.stringify(Object.fromEntries(Object.entries(next).sort()));
   let result=cache.get(id);if(!result){result=await evaluate({...options,patch:next,metadata:false});cache.set(id,result);}
   const decision=assessCandidate(result,start);
   candidates.push({round,key,direction,patch:next,...decision,result});
   if(decision.accepted&&result.objective>best.objective){best=result;bestPatch=next;}
  }
  rounds.push({round,startPatch:patch,selectedPatch:bestPatch,startObjective:start.objective,selectedObjective:best.objective,changed:best!==incumbent});
  incumbent=best;patch=bestPatch;
 }
 // Holdout is opened exactly once after all training choices, never used to pick an alternative.
 let holdout=null,accepted=false;
 if(final&&Object.keys(patch).length){const opts={sourceDir,seeds:HOLDOUT,seconds:600,hz:60};const b=await evaluate(opts),c=Object.keys(patch).length?await evaluate({...opts,patch}):b;holdout={baseline:b,candidate:c,decision:assessCandidate(c,b,{holdout:true})};accepted=Object.keys(patch).length>0&&holdout.decision.accepted;}
 assertSearchUnchanged();
 return {version:2,mode:final?'final':'quick',kind:'offline engineering proxy; not cat reward',searchHash,baseline,rounds,candidates,trainingSelectedPatch:patch,holdout,accepted,recommendedPatch:accepted?patch:{},reason:!final?'quick smoke only':!Object.keys(patch).length?'no training candidate passed':accepted?'training and holdout gates passed':'holdout rejected; baseline retained',elapsedMs:performance.now()-started};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const o=cliOptions(),result=await hillclimb(o),json=JSON.stringify(result,null,2)+'\n';if(o.out)writeFileSync(o.out,json);else process.stdout.write(json);
}
