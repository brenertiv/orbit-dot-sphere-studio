import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareDesign,presets,validateSettings } from '../dist/geometry.js';
import { createZip } from '../dist/export.js';
import { writeFile,mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
test('seeded geometry is repeatable and changes with the seed',()=>{
  const a=prepareDesign(presets.reference),b=prepareDesign(presets.reference);
  assert.deepEqual(a,b);assert.notDeepEqual(a.points,prepareDesign({...presets.reference,seed:42}).points);
});
test('all presets have valid, unique links and bounded coordinates',()=>{
  for(const preset of Object.values(presets)){
    const d=prepareDesign(preset);assert.equal(d.points.length,preset.count*3);
    assert.ok(d.points.every(Number.isFinite));assert.ok(d.points.every(n=>Math.abs(n)<=1.001));
    assert.equal(d.sizes.length,preset.count);assert.ok(d.colors.every(c=>c>=0&&c<4));
    const seen=new Set();for(let i=0;i<d.links.length;i+=2){const a=d.links[i],b=d.links[i+1];assert.ok(a>=0&&a<b&&b<preset.count);assert.ok(!seen.has(a+':'+b));seen.add(a+':'+b);}
    assert.ok(d.links.length/2<=preset.count*(preset.connections+1));
    assert.equal(d.themes.dark.colors.length,d.themes.light.colors.length);
  }
});
test('import rejects invalid or expensive settings',()=>{
  for(const input of [null,{count:1e8},{count:NaN},{seed:-1},{connections:7},{speed:'0.4'},{palette:'bad'},{palette:'toString'},{axis:'diagonal'},{direction:0},{breathing:1},{distribution:'bad'}])assert.throws(()=>validateSettings(input));
  assert.equal(validateSettings({count:100}).count,100);
});
test('download is a valid ZIP with intact Unicode content',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'orbit-zip-')),file=join(dir,'test.zip');
  await writeFile(file,new Uint8Array(await createZip({'README.md':'Hello — sphere ✓','sphere.js':'export const x=1;'}).arrayBuffer()));
  const result=execFileSync('unzip',['-t',file],{encoding:'utf8'});assert.match(result,/No errors detected/);
  assert.equal(execFileSync('unzip',['-p',file,'orbit/README.md'],{encoding:'utf8'}),'Hello — sphere ✓');
});
