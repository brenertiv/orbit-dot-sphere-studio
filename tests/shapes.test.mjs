import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareDesign,presets,validateSettings} from '../dist/geometry.js';
import {createPresetLibrary} from '../dist/preset-library.js';

test('existing designs keep their original sphere geometry and exported configuration',()=>{
  const hashes={reference:'35184bd9246785287a94e2541afdd64d3cd16970ca1b08876d34973fed852270',halo:'d821e733670185c933180a6e1b39ebeff5b089854282c9f1a131d35622761765',drift:'a954f94f70cbe6fb19a5a2be654330f1312d20df8239f825cc729813ddb12920',waveform:'cef3e96f99abb16b49b5a5903f4fcfe0fa44e78e7bfd81f99573489b6e6e32a0'};
  for(const [id,preset] of Object.entries(presets)){
    assert.equal(validateSettings(preset).shape,'sphere');
    assert.equal(createHash('sha256').update(JSON.stringify(prepareDesign(preset))).digest('hex'),hashes[id]);
  }
});

test('all shapes and patterns preserve counts, bounds, proportions, and repeatability',()=>{
  for(const shape of ['sphere','ellipsoid','torus'])for(const pattern of ['random','even','rings','spiral'])for(const distribution of ['shell','cloud','layered'])for(const extreme of [false,true]){
    const s=validateSettings({...presets.halo,shape,pattern,distribution,count:123,shapeRadius:extreme?0.4:1,shapeWidth:extreme?0.25:1.5,shapeHeight:extreme?1.5:0.25,shapeDepth:0.7,tubeThickness:extreme?0.1:0.7,tubeDepth:extreme?0.25:1});
    const d=prepareDesign(s);assert.equal(d.points.length,369);assert.deepEqual(d,prepareDesign(s));
    for(let i=0;i<s.count;i++){
      let [x,y,z]=d.points.slice(i*3,i*3+3).map(v=>v/s.shapeRadius);
      assert.ok(Math.hypot(x,y,z)<=1.0003,'all geometry fits the renderer unit sphere');
      if(shape==='ellipsoid'){
        const fit=Math.max(s.shapeWidth,s.shapeHeight,s.shapeDepth);
        x*=fit/s.shapeWidth;y*=fit/s.shapeHeight;z*=fit/s.shapeDepth;
      }
      let radius=Math.hypot(x,y,z);
      if(shape==='torus'){
        const major=1/(1+s.tubeThickness),minor=major*s.tubeThickness;
        assert.ok(Math.hypot(x,y)>=major-minor-0.0003,'filled tori preserve their hole');
        radius=Math.hypot(Math.hypot(x,y)-major,z/s.tubeDepth)/minor;
      }
      assert.ok(radius<=1.01,'points remain inside the chosen shape');
      if(distribution==='shell')assert.ok(radius>0.979,'surface shell follows the chosen surface');
    }
  }
});

test('shape settings save, update, reopen and reset through normalized preset snapshots',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const library=createPresetLibrary(storage);
  const s=validateSettings({...presets.waveform,shape:'ellipsoid',shapeRadius:0.8,shapeWidth:0.35,shapeHeight:1.25,shapeDepth:0.5,tubeThickness:0.65,tubeDepth:0.4});
  const saved=library.save('Tall wave',s);s.shapeWidth=1;
  const reopened=createPresetLibrary(storage),restored=reopened.list().items[0];
  assert.equal(restored.settings.shapeWidth,0.35);assert.equal(restored.settings.shape,'ellipsoid');
  assert.deepEqual(prepareDesign(restored.settings),prepareDesign(saved.settings));
  reopened.update(saved.id,{...restored.settings,shape:'torus'});
  const torus=createPresetLibrary(storage).list().items[0].settings;
  assert.equal(torus.shape,'torus');assert.equal(torus.tubeThickness,0.65);assert.equal(torus.tubeDepth,0.4);
  assert.equal(torus.shapeWidth,0.35,'inactive shape proportions are retained');
  assert.deepEqual(validateSettings(JSON.parse(JSON.stringify(torus))),torus);
});

test('invalid proportions are rejected before saving or geometry work',()=>{
  for(const input of [{shape:'cube'},{shapeRadius:0},{shapeWidth:Infinity},{shapeHeight:0},{shapeDepth:2},{tubeThickness:1},{tubeDepth:-1},{shapeRadius:'1'}])assert.throws(()=>validateSettings(input));
});
