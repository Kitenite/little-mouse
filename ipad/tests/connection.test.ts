import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGameUrl } from '../src/connection.ts';
test('hosted and LAN game addresses normalize to the game root', () => {
  assert.equal(normalizeGameUrl(' https://example.com/old-path?x=1#secret '), 'https://example.com/');
  for (const host of ['localhost', '127.0.0.1', '192.168.1.4', '10.0.0.4', '172.16.1.4', 'macbook.local']) assert.equal(normalizeGameUrl(`http://${host}:8787/`), `http://${host}:8787/`);
});
test('rejects invalid protocols, public cleartext, and embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'http://example.com', 'http://10.attacker.example', 'http://192.168.evil.example', 'http://127.evil.example', 'https://user:password@example.com', 'not a url']) assert.throws(() => normalizeGameUrl(url));
});
