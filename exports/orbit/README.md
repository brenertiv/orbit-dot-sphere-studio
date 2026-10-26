# Orbit — lightweight React sphere

Copy the orbit folder into your React application. React 18+ is the only peer dependency. No installation step or CSS file is required. Import DotSphere and the generated configuration:

```jsx
import { DotSphere } from './orbit/DotSphere';
import sphere from './orbit/sphere-config';

<DotSphere
  config={sphere}
  theme="system"
  style={{ width: '100%', maxWidth: 600 }}
/>
```

## Appearance and layout

The canvas is transparent and decorative (aria-hidden, no pointer events). Supply a background on its parent. The component defaults to a square that fills its container's width; use style={{ width: '100%', height: 400, aspectRatio: 'auto' }} for a fixed-height area. Avoid changing only the canvas HTML width/height attributes: the renderer manages its backing resolution.

theme="system" follows the operating system. If your application has its own theme toggle, pass its resolved "light" or "dark" value. Theme changes blend colors without resetting animation. Both palettes are included in sphere-config.js. No React context or theme package is required.

paused={true} freezes animation at its current position. Reduced motion automatically renders a static frame. Animation pauses when the canvas is offscreen or the document is hidden. Resizing is observed automatically; pixel density is capped at 1.75 and may decrease when measured draw cost exceeds its budget.

## Animation controls

The generator exports rotation speed, axis (X, Y, Z, or tumble), forward/reverse direction, drift amount and speed, shimmer amount and speed, and breathing amount and speed. Drift deforms the sphere locally; breathing expands and contracts it uniformly. Each effect advances independently, so changing its speed preserves its cycle position. Changing the rotation axis changes the orientation model immediately.

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

Use Save design in Orbit to retain the editable JSON, then Import design to continue editing. The React configuration is generated output; the editable design file is separate.
