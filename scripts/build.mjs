import { build } from 'esbuild';
import { writeFile, mkdir, copyFile } from 'node:fs/promises';
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
// The Icon tab zips the OrbitIcon component with the current design; it fetches these sources at export time.
await mkdir('dist/orbit-icon',{recursive:true});
for(const name of ['orbitIcon.js','OrbitIcon.jsx','OrbitIcon.d.ts'])await copyFile('exports/orbiticon/'+name,'dist/orbit-icon/'+name);
// Field's Export React zips the DotField component with the current design the same way.
await mkdir('dist/dotfield',{recursive:true});
for(const name of ['dotfield.js','DotField.jsx','DotField.d.ts'])await copyFile('exports/dotfield/'+name,'dist/dotfield/'+name);
console.log('Built Kilowatt Studio (Orbit + Field + Icon) → dist/studio.js. Runtime/export modules remain separate.');
