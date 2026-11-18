import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('../public/assets/audio/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('CURATION.json',base)));
test('curated assets retain provenance and exact bounded faded PCM',()=>{
 assert.equal(manifest.clips.length,13);
 assert.equal(new Set(manifest.clips.map(c=>c.id)).size,13);
 assert.equal(new Set(manifest.clips.map(c=>c.sha256)).size,13);
 for(const clip of manifest.clips){
  const source=manifest.sources[clip.source];assert.ok(source.url.startsWith('https://freesound.org/people/'));
  assert.equal(source.license,'CC0 1.0');assert.match(source.previewSha256,/^[0-9a-f]{64}$/);
  const bytes=readFileSync(new URL(clip.file,base));
  assert.equal(bytes.length,clip.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
  let pcm,format;
  for(let at=12;at+8<=bytes.length;){const name=bytes.toString('ascii',at,at+4),size=bytes.readUInt32LE(at+4);if(name==='data')pcm=bytes.subarray(at+8,at+8+size);if(name==='fmt ')format=bytes.subarray(at+8,at+8+size);at+=8+size+(size%2);}
  assert.equal(format.readUInt16LE(0),1);assert.equal(format.readUInt16LE(2),1);assert.equal(format.readUInt32LE(4),22050);assert.equal(format.readUInt16LE(14),16);
  assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
  let sum=0,peak=0;for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;sum+=v*v;peak=Math.max(peak,Math.abs(v));}
  assert.ok(peak<=.55);assert.ok(Math.abs(peak-clip.peak)<1e-9);assert.ok(Math.abs(Math.sqrt(sum/(pcm.length/2))-clip.rms)<1e-9);
  assert.ok(Math.abs(pcm.length/2/22050-clip.duration)<1e-9);
 }
});
test('four vocal phrases are one explicitly uncertain source with nonoverlapping cuts',()=>{
 const calls=manifest.clips.filter(c=>c.source==='floor');assert.equal(calls.length,4);
 assert.match(manifest.sources.floor.recording,/context.*unverified/);
 for(let i=0;i<calls.length;i++){assert.ok(calls[i].rms>.04);if(i)assert.ok(calls[i].start>=calls[i-1].start+calls[i-1].duration);}
});
