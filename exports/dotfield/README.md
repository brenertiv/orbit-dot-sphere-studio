# Dot Field — React

Copy the `dotfield` folder into your app. React 18+ is the only peer dependency; no CSS file, no install step.

```jsx
import { DotField } from './dotfield/DotField';
import tide from './dotfield/tide-config';

<div style={{ background: 'var(--surface)' }}>
  <DotField config={tide} theme="system" style={{ maxWidth: 720 }} />
</div>
```

## Config

`config` is the object you copy from the Dot Field generator ("Copy config"). Import it once at module scope and share it between instances; each instance owns its own animation clock. Changing `config` updates in place without remounting.

Compositions: `tide`, `band`, `cluster`, `coverage`, and `source` (a baked image). For `source`, the generator writes a small luminance grid into the config, so no image file ships with the page.

## Appearance

The canvas is transparent, `aria-hidden`, and ignores pointer events: supply a background on the parent. It defaults to a 4:3 box that fills its container's width; pass `style={{ aspectRatio: 'auto', height: 320 }}` for a fixed-height band. Don't set the canvas `width`/`height` attributes; the renderer manages its backing store (DPR capped at 1.75).

`theme="system"` follows `prefers-color-scheme`. If your app has its own toggle, pass its resolved `"light"` or `"dark"`. Theme changes crossfade the palette without resetting motion. Both palettes live in the config.

`paused` freezes the field at its current frame. Reduced-motion users get a static frame automatically. Animation also stops while the canvas is offscreen or the tab is hidden, and resumes where it left off.

## Integration

`DotField.jsx` is marked `'use client'`; browser APIs are touched only in effects, so SSR renders an empty canvas safely. Listeners, observers and the animation frame are released on unmount, including Strict Mode's double-mount.

`createDotField(canvas, config, opts)` in `dotfield.js` is the framework-free renderer if you need it outside React.

## Performance

Cost scales with cell count, not canvas size: a 1200×900 area at `cell: 14` is about 5,500 dots per frame, drawn as one path per tone. Larger cells or a slower `field.speed` are the first levers if a page runs several instances. 60 fps is a target, not a guarantee.
