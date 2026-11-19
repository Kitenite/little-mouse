import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';
await build({ entryPoints: ['scripts/experiment-schema.mjs'], outfile: 'public/vendor/experiment-schema.js',
 bundle: true, format: 'esm', minify: true, legalComments: 'linked', target: 'es2022' });
await copyFile('node_modules/valibot/LICENSE.md', 'public/vendor/valibot-LICENSE.md');
