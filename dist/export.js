export const usage = `import { DotSphere } from './orbit/DotSphere';
import sphere from './orbit/sphere-config';

<DotSphere
  config={sphere}
  theme="system"
  style={{ width: '100%', maxWidth: 600 }}
/>`;
export const guide = `# Orbit — lightweight React sphere

Copy the orbit folder into your React application. React 18+ is the only peer dependency. No installation step or CSS file is required. Import DotSphere and the generated configuration:

\`\`\`jsx
${usage}
\`\`\`

## Appearance and layout

The canvas is transparent and decorative (aria-hidden, no pointer events). Supply a background on its parent. The component defaults to a square that fills its container's width; use style={{ width: '100%', height: 400, aspectRatio: 'auto' }} for a fixed-height area. Avoid changing only the canvas HTML width/height attributes: the renderer manages its backing resolution.

theme="system" follows the operating system. If your application has its own theme toggle, pass its resolved "light" or "dark" value. Theme changes blend colors without resetting animation. Both palettes are included in sphere-config.js. No React context or theme package is required.

paused={true} freezes animation at its current position. Reduced motion automatically renders a static frame. Animation pauses when the canvas is offscreen or the document is hidden. Resizing is observed automatically; pixel density is capped at 1.75 and may decrease when measured draw cost exceeds its budget.

## Animation controls

The generator exports rotation speed, axis (X, Y, Z, or tumble), forward/reverse direction, drift amount and speed, shimmer amount and speed, and breathing amount and speed. Drift deforms the sphere locally; breathing expands and contracts it uniformly. Each effect advances independently, so changing its speed preserves its cycle position. Changing the rotation axis changes the orientation model immediately.

Sphere, Ellipsoid, and Torus geometry, including radius and proportions, is baked into sphere-config.js. No shape generator or new dependency ships with the component. Re-export from Orbit to change proportions.

Point patterns (random, evenly spaced, surface rings, spiral rows) and size variation are prepared in the editor and stored as coordinates and sizes. The component does not ship a pattern generator. Surface waves add height, frequency, and signed travel speed; zero speed freezes the folds, while zero height disables them. Twist bends the shape around its vertical axis. All wave and twist fields are optional for older exports. Single-color mode stores a separate color for each theme in the same palette format, with no additional runtime dependency.

## Integration

DotSphere.js includes 'use client' for Next.js / React Server Components. Browser APIs are used only in useEffect, so server rendering produces an empty canvas safely. The component removes its animation frame, observers, and event listeners on unmount, including React Strict Mode's development remount.

Import the configuration once at module scope. Do not recreate a large configuration object on every parent render. You can share one imported configuration across instances; each instance owns its animation state. Animation does not trigger React renders.

## What ships

- DotSphere.js: thin React wrapper.
- DotSphere.d.ts: TypeScript types.
- sphere.js: dependency-free Canvas 2D renderer.
- sphere-config.js: precomputed point positions, connection indices, sizes, colors, motion, and both themes.

The geometry generator, editor, fonts, presets, ZIP writer, and size measurement utilities are NOT runtime dependencies. Your app's bundler can minify these source files. Export sizes in Orbit measure gzip of runtime + wrapper + design source, excluding React, types, and this guide. ZIP download size is different: it contains readable source and documentation without compression.

## Performance

This renderer projects 3D points onto a 2D canvas. It uses no physics, blur, textures, or per-frame React state. Connections are precomputed. Test your final design at its intended display size on your target phones and laptops, especially when embedding multiple spheres. 60 fps is a target, not a guarantee on every device. The editor's draw-time measurement covers JavaScript and canvas submission, not total GPU/browser frame time.

Browsers must support Canvas 2D, ResizeObserver, IntersectionObserver, and MediaQueryList.addEventListener. Keep decorative spheres nonessential to understanding your page.

## Edit again

Use My presets in Orbit to save and name designs in this browser. Shapes and proportions are included. Use Save design / Import design to transfer editable JSON between browsers. The React configuration is generated output; the editable design file is separate.
`;
let sources;
export async function runtimeSources() {
  if (!sources) sources = Promise.all(['DotSphere.js','DotSphere.d.ts','sphere.js'].map(async name => {
    const res = await fetch(new URL('./runtime/'+name,import.meta.url));
    if(!res.ok)throw new Error('Could not load export sources. Please reload and try again.');
    return [name,await res.text()];
  })).then(Object.fromEntries).catch(error=>{sources=null;throw error;});
  return sources;
}
export const configSource = config => '// Generated by Orbit. Geometry is prepared at export time.\nexport default '+JSON.stringify(config)+';\n';
export async function exportFiles(config) {
  const code=await runtimeSources();
  return {...code,'sphere-config.js':configSource(config),'README.md':guide};
}
export async function measure(config) {
  const code=await runtimeSources();
  const text=code['sphere.js']+code['DotSphere.js']+configSource(config);
  if(typeof CompressionStream==='undefined')return {bytes:new TextEncoder().encode(text).length,compressed:false};
  const stream=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return {bytes:(await new Response(stream).arrayBuffer()).byteLength,compressed:true};
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
// Stored ZIP, kept inside the editor only. No external download service or ZIP dependency.
export function createZip(files) {
  const encoder=new TextEncoder(),chunks=[],central=[];let offset=0,centralSize=0;
  for(const [name,text] of Object.entries(files)) {
    const filename=encoder.encode('orbit/'+name),content=encoder.encode(text),crc=crc32(content);
    const local=new Uint8Array(30+filename.length),v=new DataView(local.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,content.length,true);v.setUint32(22,content.length,true);v.setUint16(26,filename.length,true);local.set(filename,30);
    const record=new Uint8Array(46+filename.length),c=new DataView(record.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,content.length,true);c.setUint32(24,content.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);record.set(filename,46);
    chunks.push(local,content);central.push(record);offset+=local.length+content.length;centralSize+=record.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length,true);e.setUint16(10,central.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...chunks,...central,end],{type:'application/zip'});
}
export function download(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
