import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { webCheckpointScript } from '../src/web-checkpoint.ts';

test('native checkpoint preserves a healthy resume during recovery and respects later pause', () => {
  let state = { playing: true, catches: 7, elapsed: 42, recovering: false };
  let saved = '';
  let tick = () => {};
  const messages: string[] = [];
  runInNewContext(webCheckpointScript('http://10.0.0.49:8787'), {
    location: { origin: 'http://10.0.0.49:8787' },
    window: { mouseDiagnostics: () => state, ReactNativeWebView: { postMessage: (s: string) => messages.push(s) } },
    localStorage: { setItem: (_: string, s: string) => { saved = s; } },
    setInterval: (f: () => void) => { tick = f; },
  });
  const healthy = saved;
  state = { ...state, playing: false, recovering: true };
  tick(); tick();
  assert.equal(saved, healthy);
  assert.equal(JSON.parse(messages.at(-1)!).playing, false);
  state = { ...state, recovering: false };
  tick();
  assert.equal(JSON.parse(saved).playing, false);
  assert.equal(JSON.parse(saved).catches, 7);
});

test('checkpoint ignores other origins and waits for game diagnostics', () => {
  let scheduled = false;
  const context = { location: { origin: 'https://login.example' }, window: {}, setInterval: () => { scheduled = true; } };
  runInNewContext(webCheckpointScript('https://game.example'), context);
  assert.equal(scheduled, false);
  context.location.origin = 'https://game.example';
  runInNewContext(webCheckpointScript('https://game.example'), context);
  assert.equal(scheduled, true);
});
