import {build} from 'esbuild';
await build({entryPoints:['scripts/babylon-entry.mjs'],outfile:'public/vendor/babylon-fur.js',bundle:true,format:'esm',minify:true,legalComments:'linked',target:'es2022'});
import {copyFile} from 'node:fs/promises';
await copyFile('node_modules/@babylonjs/core/license.md','public/vendor/babylon-LICENSE.md');
