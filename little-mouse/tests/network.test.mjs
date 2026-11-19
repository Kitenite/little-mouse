import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { api } from '../worker/api.js';

test('only read-only asset version API remains, with no database dependency', async () => {
 const env = new Proxy({}, {get(){throw Error('Database must never be accessed');}});
 const response = await api(new Request('http://local/api/version'),env,'abc123');
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{version:'abc123'});
 assert.equal(response.headers.get('cache-control'),'no-store');
 for(const path of ['/api/rooms','/api/rooms/0123456789abcdef','/api/rooms/0123456789abcdef/settings','/api/rooms/0123456789abcdef/command','/api/rooms/0123456789abcdef/telemetry','/companion']){
  for(const method of ['GET','POST','PUT','DELETE'])assert.equal((await api(new Request('http://local'+path,{method}),env,'v1')).status,404);
 }
 assert.equal((await api(new Request('http://local/api/version',{method:'POST'}),env,'v1')).status,404);
});
test('runtime and server have no pairing, command polling, telemetry or room database',async()=>{
 for(const file of ['public/game.js','scripts/dev.mjs','scripts/build.mjs','worker/api.js']){
  const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
  assert.doesNotMatch(source,/\/api\/rooms|companion|mouse-room|mouse-command|pendingSettings|applyCommand|DatabaseSync|CREATE TABLE|env\.DB/);
 }
 for(const file of ['public/companion.js','public/companion.html','drizzle/0000_rooms.sql'])await assert.rejects(access(new URL('../'+file,import.meta.url)));
});
