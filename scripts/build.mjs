import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const result=await build({
  entryPoints:['src/main.jsx'],outfile:'dist/studio.js',bundle:true,minify:true,
  format:'esm',target:['es2022'],jsx:'automatic',metafile:true,
  define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked',
  plugins:[{name:'keep-export-boundary',setup(build){
    build.onResolve({filter:/dist\/(geometry|preset-library|export|runtime\/sphere)\.js$/},args=>({path:'./'+args.path.split('/dist/')[1],external:true}));
  }}]
});
await writeFile(join(tmpdir(),'orbit-build-meta.json'),JSON.stringify(result.metafile));
console.log('Built Kilowatt Studio (Orbit + Field) → dist/studio.js. Runtime/export modules remain separate.');
