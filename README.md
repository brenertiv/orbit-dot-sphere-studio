# Orbit — Dot Sphere Studio

A browser-local generator for decorative animated dot spheres. The editor is buildless HTML/CSS/JavaScript. Exports are dependency-free Canvas 2D plus a thin React wrapper; React is supplied by the consuming application.

## Run

```sh
npm run dev
```

Open http://127.0.0.1:4173. No dependencies need to be installed to run the generator. Editable designs are autosaved to browser storage where available; Save design / Import design transfers them between browsers or origins. All design processing and ZIP creation happen locally in the browser. The editor loads Google Fonts, with local font fallbacks; exported components make no font or asset requests.

## Features

- Reference-inspired Constellation preset, Halo, and Solar drift.
- Surface, layered, or filled arrangements; deterministic seeds and precomputed connections.
- Dot count, size, connections, opacity, depth fade, and four paired palettes.
- Rotation speed, X/Y/Z/tumble axis, direction, drift amount/speed, shimmer amount/speed, breathing amount/speed.
- Light/dark/compare preview, pause, reduced motion, offscreen suspension.
- React ZIP with TypeScript declarations and integration guide, editable design JSON, transparent PNG.
- Gzip size estimate includes runtime, React wrapper, and complete prepared design, excluding React itself.

## Source boundaries

`dist/geometry.js` generates geometry in the editor. `dist/runtime/sphere.js` only plays prepared designs. `dist/runtime/DotSphere.js` mounts and updates the renderer without per-frame React state. Both the editor and exported React component use the exact same renderer. `dist/export.js` builds the downloadable ZIP and does not ship as a runtime dependency.

## Verification

```sh
npm ci
npm test
npm run measure
node scripts/react-preview.mjs
node scripts/export-reference.mjs
```

React, React DOM, jsdom, and esbuild are development/test dependencies only. The React preview is available at `/example/index.html` after generating it. Tests cover deterministic geometry, connection validity, import bounds, ZIP integrity, SSR, React Strict Mode, themes, reduced motion, offscreen/hidden suspension, cleanup, and motion coordinate validity.

The default reference export measured 12,825 bytes gzipped for renderer + wrapper + prepared design (3,338 bytes for renderer + wrapper alone) at initial completion. This is source gzip, not a promise about an application's complete bundle. The export dialog recalculates for each design. Desktop preview drawing was around 0.5 ms per frame in the development browser; this excludes browser compositing/GPU completion. Actual phone hardware and multiple-instance performance still need device-specific profiling. 60 fps is a target, not a guarantee.

## Hosting

The Site serves `dist/`. `.openai/hosting.json` records the private Site identity. Development React fixtures are generated only for verification and removed before packaging. No backend or account integration is required by the generator.
