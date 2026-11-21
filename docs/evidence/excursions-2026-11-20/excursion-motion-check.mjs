import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=n=>readFileSync(`/tmp/excursion-motion-${n}.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
const original=read('paw-59-30'),replay=read('control-replay-paw-59-30');
const strip=s=>{const {entered,...rest}=s;return rest};
assert.deepEqual(replay.map(a=>a.map(strip)),original.slice(0,replay.length).map(a=>a.map(strip)));
const summary=JSON.parse(readFileSync('/tmp/excursion-motion-summary.json'));
for(const [name,hash]of Object.entries(summary.hashes))assert.equal(createHash('sha256').update(readFileSync('/tmp/excursion-motion-baseline/little-mouse/public/'+name)).digest('hex'),hash);
const result={replayFramesEqual:replay.length,sourceHashesVerified:Object.keys(summary.hashes).length,controls:{}};
for(const name of ['replay','no-companion','no-paw']){
 const frames=read(`control-${name}-paw-59-30`),samples=frames.map(a=>a[0]).filter(s=>s.time>=56.9&&s.time<=75),bout=[];
 for(const s of samples){if(s.phase!=='retreat')break;bout.push(s);}
 let turns=0;for(let j=1;j<bout.length;j++){const d=bout[j].angle-bout[j-1].angle;turns+=Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))/(2*Math.PI);}
 result.controls[name]={lastRetreatTime:bout.at(-1).time,turns,collisionImpulses:bout.reduce((n,s)=>n+s.collisions,0)};
}
assert(result.controls.replay.turns>12);assert(result.controls['no-companion'].turns<.3);assert(result.controls['no-paw'].turns<.3);
writeFileSync('/tmp/excursion-motion-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
