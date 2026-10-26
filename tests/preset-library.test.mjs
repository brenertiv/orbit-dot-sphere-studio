import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresetLibrary,PRESET_KEY } from '../dist/preset-library.js';
import { presets,validateSettings } from '../dist/geometry.js';
function memory(){const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
test('named presets survive reopening, remain independent, and support rename/update',()=>{
  const storage=memory(),library=createPresetLibrary(storage),settings=validateSettings(presets.waveform);
  const a=library.save(' Midnight   ripple ',settings),b=library.save('Soft halo',presets.halo);
  settings.waveHeight=0;
  const reopened=createPresetLibrary(storage);assert.equal(reopened.list().items.length,2);
  assert.equal(reopened.list().items[0].name,'Midnight ripple');assert.equal(reopened.list().items[0].settings.waveHeight,0.14);
  reopened.rename(a.id,'Evening ripple');reopened.update(a.id,{...presets.waveform,waveHeight:0.23});
  assert.equal(reopened.list().items[0].name,'Evening ripple');assert.equal(reopened.list().items[0].settings.waveHeight,0.23);
  assert.equal(reopened.list().items.find(p=>p.id===b.id).settings.count,420);
});
test('invalid names and settings cannot overwrite existing presets',()=>{
  const storage=memory(),library=createPresetLibrary(storage),a=library.save('Halo',presets.halo);
  const before=storage.getItem(PRESET_KEY);
  for(const name of ['','   ','halo','x'.repeat(61)])assert.throws(()=>library.save(name,presets.reference));
  assert.throws(()=>library.update(a.id,{count:1e6}));assert.equal(storage.getItem(PRESET_KEY),before);
});
test('removal is undoable across reloads and failed storage writes preserve data',()=>{
  const storage=memory(),library=createPresetLibrary(storage),a=library.save('Ripple',presets.waveform);
  library.remove(a.id);assert.equal(library.list().items.length,0);
  const reopened=createPresetLibrary(storage);assert.equal(reopened.undo().id,a.id);assert.equal(reopened.list().items.length,1);
  const before=storage.getItem(PRESET_KEY),blocked=createPresetLibrary({getItem:storage.getItem,setItem(){throw new Error('quota');}});
  assert.throws(()=>blocked.remove(a.id),/could not be saved/);assert.equal(storage.getItem(PRESET_KEY),before);
});
test('corrupt libraries are preserved and independent library handles read fresh snapshots',()=>{
  const storage=memory();storage.setItem(PRESET_KEY,'not valid JSON');
  assert.throws(()=>createPresetLibrary(storage).save('New',presets.halo),/left untouched/);assert.equal(storage.getItem(PRESET_KEY),'not valid JSON');
  const clean=memory(),a=createPresetLibrary(clean),b=createPresetLibrary(clean);
  a.save('One',presets.reference);b.save('Two',presets.waveform);assert.equal(a.list().items.length,2);
});
