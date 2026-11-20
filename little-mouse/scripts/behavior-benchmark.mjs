import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const TRAIN=[11,37,83], HOLDOUT=[127,211,337];
export const SCENARIOS=['passive','central-paw','near-misses','tall-phone'];
export const KNOBS=['runThroughChance','watchDuration','creepSpeed','peekDuration'];
const here=dirname(fileURLToPath(import.meta.url));
const defaultSource=resolve(here,'../public');
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const scriptHash=()=>createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex');
const benchmarkHash=scriptHash();
export function assertEvaluatorUnchanged(){if(scriptHash()!==benchmarkHash)throw Error('Evaluator changed; restart the process');}
const loadedHashes=new Map();
export async function loadRuntime(sourceDir=process.env.BEHAVIOR_SOURCE_DIR||defaultSource){
 const source=resolve(sourceDir), names=['enrichment','hunt-group','physics','mouse-identity','settings'];
 const fingerprint=provenance(source).sourceHash;
 if(loadedHashes.has(source)&&loadedHashes.get(source)!==fingerprint)throw Error('Runtime source changed; restart with immutable archive');
 loadedHashes.set(source,fingerprint);
 const modules=await Promise.all(names.map(n=>import(pathToFileURL(resolve(source,n+'.js')).href)));
 if(provenance(source).sourceHash!==fingerprint)throw Error('Runtime changed during import');
 return Object.assign({source,fingerprint},...modules);
}
export function provenance(source){
 assertEvaluatorUnchanged();
 const hashes=Object.fromEntries(readdirSync(source).filter(n=>n.endsWith('.js')).sort().map(n=>[n,createHash('sha256').update(readFileSync(resolve(source,n))).digest('hex')]));
 let git={};try{git={head:execFileSync('git',['rev-parse','HEAD'],{cwd:here,encoding:'utf8'}).trim(),status:execFileSync('git',['status','--porcelain'],{cwd:here,encoding:'utf8'}).trim()};}catch{}
 return {source,evaluatorGit:git,runtimeRevision:source===defaultSource?git.head:"archive: revision unverified; source hashes authoritative",sourceHashes:hashes,sourceHash:createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),node:process.version,platform:process.platform,arch:process.arch,benchmarkHash};
}
export function utility(m){return .35*Math.min(1,m.visiblePathRate/.15)+.3*m.coverage+.15*m.entropy*(1-.25*m.repetition)+.2*Math.min(1,m.visibleFraction/.55);}
export function guardrails(m){
 const reasons=[];
 if(!m||typeof m!=='object'||Array.isArray(m))return ['missing metric object'];
 const required=['visiblePathRate','visibleSpeed','coverage','entropy','repetition','visibleFraction','finite','watchFraction','creepFraction','runFraction','maxEmpty','maxPhaseStall','maxBlocked','freezeDrift','creepRate','runRate','fixedGoalTurns','fixedGoalError','timeError','pawPenetration'];
 if(required.some(k=>!Number.isFinite(m[k])))reasons.push('missing/non-finite required metric');
 if(!Object.values(m).every(Number.isFinite)||m.finite!==1)reasons.push('non-finite state/metric');
 if(Object.values(m).some(v=>v<0))reasons.push('negative metric');
 for(const key of ['coverage','entropy','repetition','visibleFraction','watchFraction','creepFraction','runFraction'])
  if(m[key]>1+1e-9)reasons.push(`${key} outside [0,1]`);
 if(m.watchFraction+m.creepFraction+m.runFraction>1+1e-8)reasons.push('phase time exceeds exposure');
 if(m.visibleFraction<.05||m.visiblePathRate<=0)reasons.push('no useful visible travel');
 if(m.watchFraction<.002||m.creepFraction<.002||m.runFraction>.94)reasons.push('lost watch/creep balance');
 if(m.maxEmpty>40||m.maxPhaseStall>45)reasons.push('empty/phase stall');
 if(m.maxBlocked>6)reasons.push('blocked travel exceeds 6 seconds');
 if(m.freezeDrift>2)reasons.push('watch fails to freeze');
 if(m.creepRate>m.runRate*.9)reasons.push('creep not slower than run');
 if(m.fixedGoalTurns>1.25||m.fixedGoalError>8)reasons.push('fixed goal excessive turn/nonarrival');
 if(m.timeError>1e-8)reasons.push('simulation clock mismatch');
 return reasons;
}
export function assessCandidate(candidate,baseline,{holdout=false}={}){
 const reasons=[];
 const reject=reason=>({accepted:false,reasons:[reason],improvement:null});
 if(!candidate||!baseline||!Array.isArray(candidate.rows)||!Array.isArray(baseline.rows))return reject('missing evaluation rows');
 if(!validOptions(candidate.options)||!validOptions(baseline.options))return reject('missing/invalid evaluation protocol');
 const protocol=o=>JSON.stringify({seconds:o.seconds,hz:o.hz,seeds:[...o.seeds].sort((a,b)=>a-b),scenarios:[...o.scenarios].sort()});
 if(protocol(candidate.options)!==protocol(baseline.options))return reject('incomparable evaluation protocol');
 for(const key of ['sourceHash','benchmarkHash'])if(!/^[a-f0-9]{64}$/.test(candidate[key]||'')||candidate[key]!==baseline[key])return reject(`missing/incomparable ${key}`);
 const signature=r=>`${r.scenario}/${r.seed}`;
 for(const [name,result]of [['candidate',candidate],['baseline',baseline]]){
  if(result.rows.some(r=>!r||typeof r!=='object'))return reject(`${name}: invalid row`);
  const expected=new Set(result.options.scenarios.flatMap(s=>result.options.seeds.map(seed=>`${s}/${seed}`)));
  if(result.rows.length!==expected.size||result.rows.some(r=>!expected.has(signature(r))))reasons.push(`${name}: protocol coverage mismatch`);
  for(const row of result.rows)reasons.push(...guardrails(row.metrics).map(g=>`${name} ${signature(row)}: ${g}`));
 }
 if(reasons.length)return {accepted:false,reasons,improvement:null};
 const cs=candidate.rows.map(signature),bs=baseline.rows.map(signature);
 if(!cs.length||new Set(cs).size!==cs.length||new Set(bs).size!==bs.length||cs.length!==bs.length||cs.some(k=>!bs.includes(k)))reasons.push('incomplete or duplicate scenario/seed coverage');
 const objective=result=>mean(result.rows.map(row=>utility(row.metrics)));
 const cScore=objective(candidate),bScore=objective(baseline);
 for(const [name,result,score]of [['candidate',candidate,cScore],['baseline',baseline,bScore]]){
  if(!Number.isFinite(result.objective)||Math.abs(result.objective-score)>1e-9)reasons.push(`${name}: objective does not match row metrics`);
  for(const row of result.rows)if(row.objective!==undefined&&(!Number.isFinite(row.objective)||Math.abs(row.objective-utility(row.metrics))>1e-9))reasons.push(`${name}: inconsistent row objective`);
 }
 if(holdout&&cScore<bScore*.95)reasons.push('holdout objective regressed >5%');
 if(!holdout&&cScore<bScore*1.02)reasons.push('train improvement below 2%');
 for(let i=0;i<candidate.rows.length;i++){
  const c=candidate.rows[i],b=baseline.rows.find(r=>r.seed===c.seed&&r.scenario===c.scenario);
  if(!b){reasons.push('unmatched scenario/seed');continue;}
  for(const key of ['visiblePathRate','visibleSpeed','coverage','visibleFraction'])if(c.metrics[key]<b.metrics[key]*.95)reasons.push(`${c.scenario}/${c.seed}: ${key} regressed >5%`);
  for(const key of ['maxEmpty','maxPhaseStall','maxBlocked','pawPenetration'])if(c.metrics[key]>b.metrics[key]+1e-7)reasons.push(`${c.scenario}/${c.seed}: ${key} safety regression`);
 }
 return {accepted:reasons.length===0,reasons,improvement:cScore/bScore-1};
}
function validOptions(o){return !!o&&Number.isFinite(o.seconds)&&o.seconds>0&&[30,60,120].includes(o.hz)
 &&Array.isArray(o.seeds)&&o.seeds.length>0&&o.seeds.every(s=>Number.isInteger(s)&&s>=0&&s<=4294967295)&&new Set(o.seeds).size===o.seeds.length
 &&Array.isArray(o.scenarios)&&o.scenarios.length>0&&o.scenarios.every(s=>SCENARIOS.includes(s))&&new Set(o.scenarios).size===o.scenarios.length;}
function run(r,config,{seed,scenario,seconds,hz}){
 const w=scenario==='tall-phone'?390:1024,h=scenario==='tall-phone'?844:768,dt=1/hz,n=Math.round(seconds*hz),rng=r.identityRandom(seed),director=r.createHuntDirector(seed);
 const paw=scenario==='central-paw'?[{x:w/2,y:h/2,radius:50}]:[];director.paws=new Map(paw.map((p,i)=>[i,p]));
 const mice=Array.from({length:2},(_,castIndex)=>{const rad=r.radius(config.size,w,h);return {castIndex,state:'away',x:rad+rng()*(w-2*rad),y:rad+rng()*(h-2*rad),angle:rng()*Math.PI*2,targetX:w/2,targetY:h/2,next:.6,hiddenUntil:0,restUntil:0,moving:false,vx:0,vy:0,speed:0,seed:rng()*100,identity:r.createMouseIdentity((seed+castIndex*2654435761)>>>0)};});
 const tracks=mice.map(()=>({phase:null,phaseTime:0,blocked:0,recentTransitions:[]})),cells=new Set(),transitions={},chapters=new Set();
 let path=0,visible=0,empty=0,maxEmpty=0,maxPhaseStall=0,maxBlocked=0,finite=1,watch=0,creep=0,running=0,creepPath=0,runPath=0,freezeDrift=0,pawPenetration=0,repeats=0,events=0,collisions=0;
 for(let frame=1;frame<=n;frame++){
  const time=frame*dt;
  if(scenario==='near-misses'&&frame%Math.round(7*hz)===0){const m=mice[Math.floor(frame/(7*hz))%2];r.rememberTouch(director,m.x+90,m.y,time,w,h,{miss:true,pointerId:frame});}
  const old=mice.map(m=>({x:m.x,y:m.y,phase:m.hunt?.phase,state:m.state}));
  r.updateHuntGroup(director,mice,time,w,h,config);
  for(const m of mice)r.updateHunt(m,config,time,w,h,false,rng,director);
  collisions+=r.stepMice(mice,config,time,dt,w,h,paw);
  let any=false;
  for(let i=0;i<2;i++){
   const m=mice[i],o=old[i],t=tracks[i],phase=m.hunt?.phase,dist=Math.hypot(m.x-o.x,m.y-o.y),on=m.state==='active'&&m.hiddenUntil<=time&&m.x>=0&&m.x<=w&&m.y>=0&&m.y<=h;
   if(![m.x,m.y,m.angle,m.vx,m.vy,m.targetX,m.targetY].every(Number.isFinite))finite=0;
   chapters.add(m.hunt?.chapter?.id);
   if(phase!==t.phase){if(t.phase){const key=t.phase+'>'+phase;transitions[key]=(transitions[key]||0)+1;events++;if(t.recentTransitions.includes(key))repeats++;t.recentTransitions.push(key);if(t.recentTransitions.length>8)t.recentTransitions.shift();}t.phase=phase;t.phaseTime=time;t.blocked=0;}
   maxPhaseStall=Math.max(maxPhaseStall,time-t.phaseTime);
   if(on){any=true;visible+=dt;cells.add(Math.min(5,Math.floor(m.x/w*6))+6*Math.min(3,Math.floor(m.y/h*4)));}
   // Both endpoints must be visible and active: no teleport/hidden placement is rewarded.
   if(on&&o.state==='active'&&o.x>=0&&o.x<=w&&o.y>=0&&o.y<=h)path+=dist/w;
   if(phase==='watch'){watch+=dt;if(time-t.phaseTime>.6&&o.phase===phase)freezeDrift=Math.max(freezeDrift,dist/dt);}
   if(phase==='creep'){creep+=dt;if(o.phase===phase)creepPath+=dist/w;}
   if(['dart','traverse','retreat'].includes(phase)){running+=dt;if(o.phase===phase)runPath+=dist/w;}
   if(['creep','dart','peek','traverse','retreat'].includes(phase)&&Math.hypot(m.targetX-m.x,m.targetY-m.y)>8&&dist/dt<3)t.blocked+=dt;else t.blocked=0;
   maxBlocked=Math.max(maxBlocked,t.blocked);
   for(const p of paw)if(on)pawPenetration=Math.max(pawPenetration,Math.max(0,r.radius(config.size,w,h)+p.radius-Math.hypot(m.x-p.x,m.y-p.y)));
  }
  empty=any?0:empty+dt;maxEmpty=Math.max(maxEmpty,empty);
 }
 const entropy=events?-Object.values(transitions).reduce((s,v)=>s+v/events*Math.log(v/events),0)/Math.log(42):0;
 // Isolated ordinary fixed goals distinguish unexplained orbits from paw/collision turns.
 const observedWatchDrift=freezeDrift;
 // Enter/update real watch policy in isolation; measure its actual dwell only.
 const watcher={state:'active',x:w/2,y:h/2,angle:0,targetX:w*.75,targetY:h/2,vx:0,vy:0,hiddenUntil:0,restUntil:0,seed:1};
 const watchDirector=r.createHuntDirector(seed),watchRng=r.identityRandom(seed);
 r.forceHuntPhase(watcher,'watch',0,config,w,h,watchRng,watchDirector);
 let watchControlSeconds=0;
 freezeDrift=0;
 for(let j=1;j<=2*hz;j++){
  r.updateHunt(watcher,config,j*dt,w,h,false,watchRng,watchDirector);if(watcher.hunt.phase!=='watch')break;
  const x=watcher.x,y=watcher.y;r.stepMice([watcher],config,j*dt,dt,w,h);
  freezeDrift=Math.max(freezeDrift,Math.hypot(watcher.x-x,watcher.y-y)/dt);watchControlSeconds+=dt;
 }
 if(watchControlSeconds<dt)finite=0;
 let fixedGoalTurns=0,fixedGoalError=0;
 for(const angle of [0,Math.PI/2,Math.PI]){
  const m={state:'active',x:w*.25,y:h*.5,targetX:w*.75,targetY:h*.5,angle,vx:0,vy:0,hiddenUntil:0,restUntil:0,seed:1};let turns=0;
  for(let j=1;j<=10*hz;j++){const a=m.angle;r.stepMice([m],config,j*dt,dt,w,h);turns+=Math.abs(wrap(m.angle-a))/(2*Math.PI);}
  fixedGoalTurns=Math.max(fixedGoalTurns,turns);fixedGoalError=Math.max(fixedGoalError,Math.hypot(m.x-m.targetX,m.y-m.targetY));
 }
 const metrics={visiblePath:path,visibleSpeed:visible?path/visible:0,visiblePathRate:path/(seconds*2),coverage:cells.size/24,entropy,repetition:events?repeats/events:0,visibleFraction:visible/(seconds*2),maxEmpty,maxPhaseStall,maxBlocked,finite,watchFraction:watch/(seconds*2),creepFraction:creep/(seconds*2),runFraction:running/(seconds*2),creepRate:creep?creepPath/creep:0,runRate:running?runPath/running:0,freezeDrift,watchControlSeconds,observedWatchDrift,pawPenetration,fixedGoalTurns,fixedGoalError,timeError:Math.abs(n*dt-seconds)};
 return {seed,scenario,width:w,height:h,identities:mice.map(m=>m.identity.seed),chapters:[...chapters],transitions,collisions,metrics,gates:guardrails(metrics),objective:utility(metrics)};
}
export async function evaluate({patch={},seeds=TRAIN,seconds=360,hz=30,scenarios=SCENARIOS,sourceDir,metadata=true}={}){
 assertEvaluatorUnchanged();
 if(!validOptions({seconds,hz,seeds,scenarios}))throw Error('Invalid evaluation options');
 const started=performance.now(),r=await loadRuntime(sourceDir);
 for(const [key,value]of Object.entries(patch))if(!KNOBS.includes(key)||!Number.isFinite(value)||value<r.settingsDefaults[key]*.8-1e-9||value>r.settingsDefaults[key]*1.2+1e-9)throw Error('Patch outside reviewed bounds: '+key);
 const config={...r.settingsDefaults,...r.validateSettings(patch)};
 if(config.mode!=='hunt')throw Error('Benchmark requires production hunt mode');
 if(config.count!==2)throw Error('Benchmark requires production count two');
 const rows=[];for(const scenario of scenarios)for(const seed of seeds)rows.push(run(r,config,{seed,scenario,seconds,hz}));
 if(provenance(r.source).sourceHash!==r.fingerprint)throw Error('Runtime changed during evaluation');
 const metrics=Object.fromEntries(Object.keys(rows[0].metrics).map(k=>[k,mean(rows.map(x=>x.metrics[k]))]));
 return {version:2,kind:'engineering proxy; not cat reward',sourceHash:r.fingerprint,benchmarkHash,options:{seeds,seconds,hz,scenarios},config,patch,provenance:metadata?provenance(r.source):undefined,rows,metrics,objective:mean(rows.map(x=>x.objective)),gates:rows.flatMap(x=>x.gates.map(g=>`${x.scenario}/${x.seed}: ${g}`)),elapsedMs:performance.now()-started};
}
export function cliOptions(args=process.argv.slice(2)){
 const value=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
 return {final:args.includes('--final'),out:value('--out'),sourceDir:value('--source-dir'),patch:JSON.parse(value('--patch')||'{}')};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const o=cliOptions(),result=await evaluate({...o,...(!o.final?{seconds:30,seeds:[11]}:{})});result.mode=o.final?'final':'quick';
 const json=JSON.stringify(result,null,2)+'\n';if(o.out)writeFileSync(o.out,json);else process.stdout.write(json);
}
