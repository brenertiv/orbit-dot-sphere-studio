import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement, StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { DotSphere } from '../dist/runtime/DotSphere.js';
import { createSphere } from '../dist/runtime/sphere.js';
import { prepareDesign, presets } from '../dist/geometry.js';

const design=prepareDesign(presets.reference);
test('server rendering uses no browser APIs',()=>{
  const html=renderToString(createElement(DotSphere,{config:design}));
  assert.match(html,/aria-hidden="true"/);assert.match(html,/<canvas/);
});

test('React Strict Mode, themes, pause, reduced motion, visibility, and cleanup',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  const queries=new Map(),frames=new Map(),observers=[];let frameId=0,draws=0;
  globalThis.matchMedia=query=>{if(!queries.has(query))queries.set(query,{matches:false,listeners:new Set(),addEventListener(_,fn){this.listeners.add(fn);},removeEventListener(_,fn){this.listeners.delete(fn);}});return queries.get(query);};
  globalThis.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
  globalThis.IntersectionObserver=class extends ResizeObserver{};
  const ctx={setTransform(){},clearRect(){draws++;},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
  dom.window.HTMLCanvasElement.prototype.getContext=()=>ctx;
  dom.window.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:600,height:600});
  const root=createRoot(document.getElementById('root'));
  const render=props=>act(()=>root.render(createElement(StrictMode,null,createElement(DotSphere,{config:design,...props}))));
  await render({theme:'dark'});
  assert.equal(document.querySelectorAll('canvas').length,1);
  assert.equal(frames.size,1,'Strict Mode must leave one animation loop');
  assert.equal(observers.filter(o=>!o.disconnected).length,2);
  const before=draws;await render({theme:'light'});assert.ok(draws>before);
  assert.equal(frames.size,1,'theme changes reuse one animation loop');
  // Advance the transition before checking a paused static state.
  await render({theme:'light',paused:true});
  const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(performance.now()+1000));
  assert.equal(frames.size,0,'pause finishes any palette transition and stops');
  await render({theme:'light',paused:false});assert.equal(frames.size,1);
  const reduced=queries.get('(prefers-reduced-motion: reduce)');reduced.matches=true;reduced.listeners.forEach(fn=>fn());assert.equal(frames.size,0);
  reduced.matches=false;reduced.listeners.forEach(fn=>fn());assert.equal(frames.size,1);
  const intersection=observers.filter(o=>!o.disconnected).at(-1);
  intersection.fn([{isIntersecting:false}]);assert.equal(frames.size,0);
  intersection.fn([{isIntersecting:true}]);assert.equal(frames.size,1);
  Object.defineProperty(document,'hidden',{value:true});document.dispatchEvent(new dom.window.Event('visibilitychange'));assert.equal(frames.size,0);
  Object.defineProperty(document,'hidden',{value:false});document.dispatchEvent(new dom.window.Event('visibilitychange'));assert.equal(frames.size,1);
  await act(()=>root.unmount());assert.equal(frames.size,0);assert.ok(observers.every(o=>o.disconnected));assert.ok([...queries.values()].every(q=>q.listeners.size===0));
  dom.window.close();
});

test('all new motion combinations produce finite drawing coordinates without changing config',()=>{
  const dom=new JSDOM('<canvas></canvas>');globalThis.window=dom.window;globalThis.document=dom.window.document;
  Object.defineProperty(document,'hidden',{value:false});
  globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  const callbacks=new Map();let n=0;globalThis.requestAnimationFrame=fn=>{callbacks.set(++n,fn);return n;};globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.IntersectionObserver=ResizeObserver;
  const coords=[];const context={setTransform(){},clearRect(){},beginPath(){},moveTo(x,y){coords.push(x,y);},lineTo(x,y){coords.push(x,y);},stroke(){},arc(x,y,r){coords.push(x,y,r);},fill(){}};
  const canvas=document.querySelector('canvas');canvas.getContext=()=>context;canvas.getBoundingClientRect=()=>({width:390,height:390});
  for(const axis of ['x','y','z','tumble'])for(const direction of [-1,1]){
    const config=prepareDesign({...presets.reference,axis,direction,breathing:0.2,breathSpeed:2,driftSpeed:2,pulseSpeed:4});
    const snapshot=JSON.stringify(config),instance=createSphere(canvas,config,{theme:'dark'});instance.seek(10);instance.destroy();assert.equal(JSON.stringify(config),snapshot);
  }
  assert.ok(coords.length>0);assert.ok(coords.every(Number.isFinite));assert.equal(callbacks.size,0);dom.window.close();
});
