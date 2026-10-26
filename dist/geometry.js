// Editor-only geometry preparation. This file is never included in React exports.
export const palettes = {
  aurora: { name: 'Aurora', dark: ['#647ce3','#5bd4eb','#8970d3','#a9e784'], light: ['#3d53ac','#007e97','#7950a9','#4a812c'] },
  glacier: { name: 'Glacier', dark: ['#74a1ff','#8cdbef','#b5d6ff','#67b7d2'], light: ['#315caa','#087e99','#546d9d','#27738b'] },
  ember: { name: 'Ember', dark: ['#ee9973','#f4cc98','#d98292','#eab84f'], light: ['#a64924','#9b6b16','#a73d60','#90711a'] },
  mono: { name: 'Graphite', dark: ['#e6e9e5','#aebcb6','#c8d1cf','#879a91'], light: ['#273f35','#53695e','#384f43','#6b7e74'] }
};
export const presets = {
  reference: { name: 'Constellation', subtitle: 'Inspired by your reference', count: 560, size: 2.3, connections: 2, lineOpacity: 0.16, speed: 0.24, deformation: 0.12, pulse: 0.13, depth: 0.7, seed: 4219, palette: 'aurora', distribution: 'layered' },
  halo: { name: 'Halo', subtitle: 'Quiet, precise, weightless', count: 420, size: 1.8, connections: 0, lineOpacity: 0.14, speed: 0.15, deformation: 0.025, pulse: 0.08, depth: 0.85, seed: 7612, palette: 'glacier', distribution: 'shell' },
  drift: { name: 'Solar drift', subtitle: 'Warm light, organic motion', count: 380, size: 2.8, connections: 1, lineOpacity: 0.12, speed: 0.18, deformation: 0.2, pulse: 0.28, depth: 0.6, seed: 1018, palette: 'ember', distribution: 'cloud' },
  waveform: { name:'Waveform', subtitle:'Flowing folds, inspired by your GIF', count:1200, size:1.7, connections:0, lineOpacity:0.12, speed:0.32, deformation:0, pulse:0, depth:0.24, seed:2408, palette:'mono', distribution:'shell', pattern:'rings', sizeVariation:0, colorMode:'single', darkColor:'#f5f7f7', lightColor:'#28343a', waveHeight:0.14, waveFrequency:1.5, waveSpeed:0.8, twist:1.2, axis:'tumble' }
};
export const motionDefaults = { axis:'y', direction:1, driftSpeed:0.65, pulseSpeed:1.3, breathing:0, breathSpeed:0.6, waveHeight:0, waveFrequency:2.2, waveSpeed:0.8, twist:0 };
export const shapes = { sphere:'Sphere', ellipsoid:'Ellipsoid', torus:'Torus' };
const shapeDefaults = { shape:'sphere', shapeRadius:1, shapeWidth:1, shapeHeight:0.7, shapeDepth:0.7, tubeThickness:0.35, tubeDepth:1 };
const designDefaults = { pattern:'random', sizeVariation:1, colorMode:'palette', darkColor:'#f5f7f7', lightColor:'#28343a' };
export function themesFromSettings(s) {
  return {dark:{colors:s.colorMode==='single'?Array(4).fill(s.darkColor):[...palettes[s.palette].dark],line:'#8b9eab'},light:{colors:s.colorMode==='single'?Array(4).fill(s.lightColor):[...palettes[s.palette].light],line:'#4d6574'}};
}
export function motionFromSettings(s) {
  return { speed:s.speed, deformation:s.deformation, pulse:s.pulse, axis:s.axis, direction:s.direction, driftSpeed:s.driftSpeed, pulseSpeed:s.pulseSpeed, breathing:s.breathing, breathSpeed:s.breathSpeed, waveHeight:s.waveHeight, waveFrequency:s.waveFrequency, waveSpeed:s.waveSpeed, twist:s.twist };
}
export function random(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const round = n => Math.round(n * 10000) / 10000;
// Editor only: distribute an exact count over equal-spacing latitude rows.
function ringDirections(count, offset) {
  const rows=Math.max(4,Math.round(Math.sqrt(count/2))),weights=Array.from({length:rows},(_,i)=>Math.sin(Math.PI*(i+0.5)/rows));
  const total=weights.reduce((a,b)=>a+b,0),counts=weights.map(w=>Math.floor(w/total*count));
  const remainder=weights.map((w,i)=>({i,f:w/total*count-counts[i]})).sort((a,b)=>b.f-a.f);
  for(let i=0,left=count-counts.reduce((a,b)=>a+b,0);i<left;i++)counts[remainder[i].i]++;
  return counts.flatMap((n,row)=>Array.from({length:n},(_,i)=>[Math.cos(Math.PI*(row+0.5)/rows),offset+2*Math.PI*i/n]));
}
// Invert the torus surface-area CDF, avoiding a dense inner seam.
function tubeAngle(fraction, ratio) {
  const target=fraction*Math.PI*2;
  let angle=target;
  for(let j=0;j<7;j++)angle-=(angle+ratio*Math.sin(angle)-target)/(1+ratio*Math.cos(angle));
  return angle;
}
function torusDirections(count, ratio, offset) {
  const rows=Math.max(4,Math.round(Math.sqrt(count*ratio)));
  const angles=Array.from({length:rows},(_,i)=>2*Math.PI*(i+0.5)/rows);
  const weights=angles.map(a=>1+ratio*Math.cos(a)),total=weights.reduce((a,b)=>a+b,0);
  const counts=weights.map(w=>Math.floor(count*w/total));
  const remainder=weights.map((w,i)=>({i,f:count*w/total-counts[i]})).sort((a,b)=>b.f-a.f);
  for(let i=0,left=count-counts.reduce((a,b)=>a+b,0);i<left;i++)counts[remainder[i].i]++;
  return counts.flatMap((n,row)=>Array.from({length:n},(_,i)=>[angles[row],offset+2*Math.PI*i/n]));
}
export function prepareDesign(settings) {
  const s = validateSettings(settings), rng = random(s.seed), points = [], colors = [], sizes = [];
  const offset=random(s.seed)()*Math.PI*2,rings=s.pattern==='rings'?(s.shape==='torus'?torusDirections(s.count,s.tubeThickness,offset):ringDirections(s.count,offset)):null;
  for (let i = 0; i < s.count; i++) {
    const strand = s.pattern==='random' && s.distribution === 'layered' && i > s.count * 0.85;
    let x, y, z;
    if (s.shape === 'torus') {
      const major=1/(1+s.tubeThickness),minor=s.tubeThickness*major;
      const fill=s.distribution==='shell'?1:s.distribution==='cloud'?Math.sqrt(rng()):rng()>0.36?0.87+rng()*0.13:0.18+Math.sqrt(rng())*0.62;
      const tube=minor*fill;
      const v=rings?rings[i][0]:tubeAngle(s.pattern==='random'?rng():(i+0.5)/s.count,tube/major);
      const u=rings?rings[i][1]:s.pattern==='random'?rng()*Math.PI*2:offset+(s.pattern==='even'?i*Math.PI*(3-Math.sqrt(5)):i/s.count*Math.PI*2*Math.sqrt(s.count)*0.65);
      x=(major+tube*Math.cos(v))*Math.cos(u);
      y=(major+tube*Math.cos(v))*Math.sin(u);
      z=tube*Math.sin(v)*s.tubeDepth;
    } else if (strand) {
      const t = (i - s.count * 0.85) / (s.count * 0.15), a = t * Math.PI * 7;
      x = Math.cos(a) * (0.22 + t * 0.18); y = (t - 0.5) * 1.35; z = Math.sin(a) * 0.38;
    } else {
      const v = rings?rings[i][0]:s.pattern==='random'?1-rng()*2:1-2*(i+0.5)/s.count;
      const a = rings?rings[i][1]:s.pattern==='random'?rng()*Math.PI*2:offset+(s.pattern==='even'?i*Math.PI*(3-Math.sqrt(5)):i/s.count*Math.PI*2*Math.sqrt(s.count)*0.65);
      const r = s.distribution === 'shell' ? s.pattern==='random'?0.98+rng()*0.02:1 : s.distribution === 'cloud' ? Math.cbrt(rng()) : rng() > 0.36 ? 0.87 + rng() * 0.13 : 0.18 + Math.cbrt(rng()) * 0.62;
      const h = Math.sqrt(1 - v*v); x = Math.cos(a)*h*r; y = v*r; z = Math.sin(a)*h*r;
    }
    if(s.shape==='ellipsoid') {
      const fit=Math.max(s.shapeWidth,s.shapeHeight,s.shapeDepth);
      x*=s.shapeWidth/fit;y*=s.shapeHeight/fit;z*=s.shapeDepth/fit;
    }
    x*=s.shapeRadius;y*=s.shapeRadius;z*=s.shapeRadius;
    points.push(round(x), round(y), round(z));
    const r = Math.hypot(x,y,z);
    colors.push(r > 0.82 ? (rng() > 0.86 ? 2 : 0) : rng() > 0.82 ? 3 : 1);
    sizes.push(round(1+(0.6+rng()*0.65-1)*s.sizeVariation));
  }
  const links = [], seen = new Set();
  for (let i = 0; i < s.count && s.connections; i++) {
    const near = [];
    for (let j = 0; j < s.count; j++) {
      if (i === j) continue;
      const d = (points[i*3]-points[j*3])**2 + (points[i*3+1]-points[j*3+1])**2 + (points[i*3+2]-points[j*3+2])**2;
      near.push([j,d]);
    }
    near.sort((a,b) => a[1]-b[1]);
    for (let k = 0; k < s.connections; k++) {
      const j = near[k][0], a = Math.min(i,j), b = Math.max(i,j), key = a+':'+b;
      if (!seen.has(key)) { seen.add(key); links.push(a,b); }
    }
    // A handful of longer chords gives the reference preset its airy network.
    if (s.shape !== 'torus' && s.distribution === 'layered' && i % 9 === 0) {
      const j = Math.floor(rng()*s.count), a = Math.min(i,j), b = Math.max(i,j), key = a+':'+b;
      if (a !== b && !seen.has(key)) { seen.add(key); links.push(a,b); }
    }
  }
  return { version: 1, seed: s.seed, points, colors, sizes, links, appearance: { size:s.size, lineOpacity:s.lineOpacity, depth:s.depth }, motion: motionFromSettings(s), themes: themesFromSettings(s) };
}
export function validateSettings(input) {
  if (!input || typeof input !== 'object') throw new Error('Expected an Orbit design object.');
  const s = { ...presets.reference, ...motionDefaults, ...designDefaults, ...shapeDefaults };
  const ranges = {shapeRadius:[0.4,1],shapeWidth:[0.25,1.5],shapeHeight:[0.25,1.5],shapeDepth:[0.25,1.5],tubeThickness:[0.1,0.7],tubeDepth:[0.25,1],count:[100,1200],size:[0.7,4],connections:[0,3],lineOpacity:[0,0.45],speed:[0,0.8],deformation:[0,0.3],pulse:[0,0.5],depth:[0,1],seed:[0,4294967295],driftSpeed:[0,2],pulseSpeed:[0,4],breathing:[0,0.2],breathSpeed:[0,2],sizeVariation:[0,1],waveHeight:[0,0.3],waveFrequency:[0.5,6],waveSpeed:[-2,2],twist:[-2,2]};
  for (const [key,[min,max]] of Object.entries(ranges)) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key]<min || input[key]>max) throw new Error('Invalid '+key+' setting.');
      s[key] = ['count','connections','seed'].includes(key) ? Math.round(input[key]) : input[key];
    }
  }
  if (input.palette !== undefined) { if (!Object.hasOwn(palettes,input.palette)) throw new Error('Unknown palette.'); s.palette=input.palette; }
  if (input.distribution !== undefined) { if (!['layered','shell','cloud'].includes(input.distribution)) throw new Error('Unknown distribution.'); s.distribution=input.distribution; }
  if (input.axis !== undefined) { if (!['x','y','z','tumble'].includes(input.axis)) throw new Error('Unknown rotation axis.'); s.axis=input.axis; }
  if (input.direction !== undefined) { if (![1,-1].includes(input.direction)) throw new Error('Invalid rotation direction.'); s.direction=input.direction; }
  for(const [key,allowed] of Object.entries({shape:Object.keys(shapes),pattern:['random','even','rings','spiral'],colorMode:['palette','single']})) {
    if(input[key]!==undefined){if(!allowed.includes(input[key]))throw new Error('Invalid '+key+'.');s[key]=input[key];}
  }
  for(const key of ['darkColor','lightColor'])if(input[key]!==undefined){if(typeof input[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(input[key]))throw new Error('Invalid '+key+'.');s[key]=input[key];}
  return s;
}
