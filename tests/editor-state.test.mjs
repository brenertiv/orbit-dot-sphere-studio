import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorStore, DESIGN_KEY } from '../src/editor-state.js';
import { createPresetLibrary, PRESET_KEY } from '../dist/preset-library.js';
import { presets, validateSettings, prepareDesign } from '../dist/geometry.js';
function memory(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};}

test('Kilowatt editor loads legacy saved presets and drafts without changing prepared geometry',()=>{
  const storage=memory(),library=createPresetLibrary(storage);
  const custom=library.save('Saved torus',{...presets.waveform,shape:'torus',tubeThickness:0.6});
  const edited=validateSettings({...custom.settings,waveSpeed:-1.2});
  storage.setItem(DESIGN_KEY,JSON.stringify({settings:edited,selected:custom.id,drafts:{[custom.id]:edited,halo:presets.halo}}));
  const before=storage.getItem(DESIGN_KEY),store=createEditorStore(storage);
  assert.equal(storage.getItem(DESIGN_KEY),before,'loading must not rewrite existing data');
  assert.equal(store.getSnapshot().selected,custom.id);
  assert.deepEqual(prepareDesign(store.getSnapshot().settings),prepareDesign(edited));
  store.select('halo');store.select(custom.id);
  assert.equal(store.getSnapshot().settings.waveSpeed,-1.2,'switching retains the draft');
  assert.equal(store.getSnapshot().library.items[0].settings.waveSpeed,custom.settings.waveSpeed,'saved snapshot stays independent');
  store.reset();assert.deepEqual(store.getSnapshot().settings,custom.settings);
});

test('editor save, rename, update, removal, undo, and JSON round-trip preserve designs',()=>{
  const storage=memory(),store=createEditorStore(storage);
  store.change({shape:'ellipsoid',shapeHeight:1.35,colorMode:'single',darkColor:'#74c4eb',lightColor:'#1c6487'});
  const saved=store.save('Building glow');store.rename('Building glow blue');
  store.change({twist:0.5});store.update();
  const file=store.exportDesign(),expected=prepareDesign(file.settings);
  store.remove();assert.equal(store.getSnapshot().library.items.length,0);
  const reopened=createEditorStore(storage);reopened.undo();
  assert.equal(reopened.getSnapshot().selected,saved.id);
  assert.equal(reopened.getSnapshot().library.items[0].name,'Building glow blue');
  assert.deepEqual(prepareDesign(reopened.getSnapshot().settings),expected);
  const another=createEditorStore(memory());another.importDesign(JSON.parse(JSON.stringify(file)));
  assert.deepEqual(prepareDesign(another.getSnapshot().settings),expected);
  assert.throws(()=>another.importDesign({format:'unexpected',version:1}),/Choose a design/);
});

test('corrupt preset libraries and unavailable storage are preserved and reported',()=>{
  const storage=memory();storage.setItem(PRESET_KEY,'unreadable');
  const store=createEditorStore(storage);
  assert.match(store.getSnapshot().storageError,/could not be read/);
  assert.throws(()=>store.save('New'),/could not be read/);
  assert.equal(storage.getItem(PRESET_KEY),'unreadable');
  const unavailable=createEditorStore({getItem(){throw new Error();},setItem(){throw new Error();}});
  unavailable.change({shape:'torus'});
  assert.equal(unavailable.getSnapshot().settings.shape,'torus');
  assert.match(unavailable.getSnapshot().storageError,/Autosave is unavailable/);
});
