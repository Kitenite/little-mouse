import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
test('committed browser validation matches its library-backed source', async () => {
 const root = fileURLToPath(new URL('../', import.meta.url));
 const result = await build({ absWorkingDir: root, entryPoints: ['scripts/experiment-schema.mjs'],
  outfile: 'public/vendor/experiment-schema.js', bundle: true, format: 'esm', minify: true,
  legalComments: 'linked', target: 'es2022', write: false });
 assert.equal(result.outputFiles.find(file => file.path.endsWith('experiment-schema.js')).text,
  await readFile(new URL('../public/vendor/experiment-schema.js', import.meta.url), 'utf8'));
});
