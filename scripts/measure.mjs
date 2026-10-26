import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { prepareDesign, presets } from '../dist/geometry.js';
import { configSource, createZip } from '../dist/export.js';
const runtime=await readFile(new URL('../dist/runtime/sphere.js',import.meta.url),'utf8');
const wrapper=await readFile(new URL('../dist/runtime/DotSphere.js',import.meta.url),'utf8');
const types=await readFile(new URL('../dist/runtime/DotSphere.d.ts',import.meta.url),'utf8');
for(const [name,preset] of Object.entries(presets)){
  const config=prepareDesign(preset),source=configSource(config);
  console.log(JSON.stringify({preset:name,points:config.points.length/3,connections:config.links.length/2,runtimeGzipBytes:gzipSync(runtime+wrapper).length,totalGzipBytes:gzipSync(runtime+wrapper+source).length}));
}
await mkdir('dist/example',{recursive:true});
await writeFile('dist/example/sphere-config.js',configSource(prepareDesign(presets.reference)));
