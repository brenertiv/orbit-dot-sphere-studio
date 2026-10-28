# Orbit — Dot Sphere Studio

A browser-local generator for decorative animated dot shapes. The editor uses React and MUI with the Kilowatt theme. Exports are dependency-free Canvas 2D plus a thin React wrapper; React is supplied by the consuming application.

## Run

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4173. The committed dist directory can also be served directly. Run the build after editing src/. Editable designs are autosaved to browser storage where available; Save design / Import design transfers them between browsers or origins. All design processing and ZIP creation happen locally in the browser. The editor loads Roboto and Material Symbols from Google Fonts, with local text font fallbacks; exported components make no font or asset requests.

## Features

- Reference-inspired Constellation preset, Halo, Solar drift, and a GIF-inspired Waveform preset.
- Sphere, Ellipsoid, and Torus shapes; outer radius, ellipsoid width/height/depth ratios, torus tube thickness/depth.
- Surface, layered, or filled arrangements; deterministic seeds and precomputed connections.
- Random, evenly spaced, surface-ring, and spiral point patterns; dot size variation.
- Dot count, size, connections, opacity, depth fade, eight paired palettes, and single colors per theme.
- Surface wave height, frequency, signed travel speed, and twist.
- Rotation speed, X/Y/Z/tumble axis, direction, drift amount/speed, shimmer amount/speed, breathing amount/speed.
- Light/dark/compare preview, pause, reduced motion, offscreen suspension.
- React ZIP with TypeScript declarations and integration guide, editable design JSON, transparent PNG.
- Gzip size estimate includes runtime, React wrapper, and complete prepared design, excluding React itself.

## Design system

The editor uses [Kilowatt](https://kilowatt-ui.vercel.app/), including its unmodified MUI theme, regular-weight Roboto type scale, Material Symbols, semantic surface and border levels, and light/dark schemes. Upstream version and copied files are recorded in `src/mui/UPSTREAM.md`. App layout lives in `src/App.jsx`; presets, drafts, and editable JSON keep their existing storage keys and formats.

The source theme is used by the generator only. Downloaded components contain no MUI, Emotion, fonts, icons, theme provider, or editor code. Preview backgrounds come from Kilowatt’s semantic palettes; exported canvases remain transparent.

## Reference colors

Brand, Navy, Slate, and Green dot palettes are available alongside the four original palettes. Each contains paired light/dark colors and saves with named presets and design JSON. Slate uses navy tones on light backgrounds so the dots remain visible. Green values were sampled directly from the supplied swatches. The exported configuration contains only the selected palette, with no additional runtime code.

## Custom presets

My presets stores up to 50 named snapshots in this browser’s local storage. Save as new captures the complete settings, shape proportions, seed, motion, and both themes. Update explicitly replaces the selected saved snapshot; Rename changes only its name. Remove moves a snapshot into a recoverable local archive; Undo last removal restores it, including after a reload. Edits are kept as separate per-design drafts when switching, and Reset restores the selected snapshot.

Presets and drafts do not sync across devices or origins. Clearing site data removes them. Duplicate names are rejected case-insensitively. Storage failures are shown without reporting a successful save, and unreadable libraries are preserved. The library module and UI are editor-only and do not change the React export.

## Shapes

Outer radius scales every shape. Ellipsoid width, height, and depth are relative proportions; the longest axis is fitted to the chosen outer radius. Torus thickness is the tube radius divided by the ring centerline radius (10–70%); increasing it closes the hole while preserving the outer radius. Tube depth flattens the ring along Z. Filled and layered arrangements fill the tube, preserving the hole. All four point patterns work with every shape.

Shape settings live only in the editor, custom presets, drafts, and editable design JSON. The generator bakes the selected geometry and connections into the existing export format. No shape code or dependencies are added to the runtime. Existing designs without shape fields remain spheres with identical exported coordinates. Motion operates on the prepared points: waves displace radially from the object center, and twist is around Y.

## Source boundaries

`src/App.jsx` is the MUI editor. `src/editor-state.js` preserves the legacy browser storage and design JSON contracts. `npm run build` bundles the editor into `dist/studio.js` while leaving generation, storage, and export modules separate.

`dist/geometry.js` generates geometry in the editor. `dist/runtime/sphere.js` only plays prepared designs. `dist/runtime/DotSphere.js` mounts and updates the renderer without per-frame React state. Both the editor and exported React component use the exact same renderer. `dist/export.js` builds the downloadable ZIP and does not ship as a runtime dependency.

## Verification

```sh
npm ci
npm test
npm run measure
node scripts/react-preview.mjs
node scripts/react-preview.mjs waveform torus
node scripts/export-reference.mjs
node scripts/export-reference.mjs waveform
```

React, React DOM, MUI, and Emotion power the editor. jsdom and esbuild are development/test dependencies. None of MUI, Emotion, or the editor are included in the React export. The React preview is available at `/example/index.html` after generating it. Tests cover deterministic geometry, connection validity, import bounds, ZIP integrity, SSR, React Strict Mode, themes, reduced motion, offscreen/hidden suspension, cleanup, and motion coordinate validity.

The default reference export measured 13,136 bytes gzipped for renderer + wrapper + prepared design (3,613 bytes for renderer + wrapper alone) after adding Waveform. The 1,200-dot Waveform export measures 10,751 bytes gzipped, including both themes. This is source gzip, not a promise about an application's complete bundle. The export dialog recalculates for each design. Desktop preview drawing was around 0.5–1.1 ms per frame in the development browser; this excludes browser compositing/GPU completion. Actual phone hardware and multiple-instance performance still need device-specific profiling. 60 fps is a target, not a guarantee.

## Dot Field

A second generator lives at `src/dotfield/` and is built to `dist/dotfield/` (served at `/dotfield/`): round dots on a fixed grid, sized and toned by a slow noise field or a supplied image or video. Like the Orbit editor, it renders with React and MUI under the vendored Kilowatt theme (`src/mui`) and Kilowatt's `Icon`.

- **Colours come from the theme.** Dots use `chart.sequential` (light to dark in light, reversed in dark), the background grid uses `border.level2`, and previews and SVG backgrounds use each scheme's `background.level0`. Refreshing `src/mui` from upstream recolours the illustrations with it.
- **The preview draws what ships.** The editor calls `fieldFrame` from `exports/dotfield/dotfield.js`, the same function the exported component draws with.
- **Editor logic without React** lives in `src/dotfield/config.js` (state ↔ config, parsing pasted configs, SVG) and is covered by `tests/dotfield.test.mjs`.

It exports SVG stills (light, dark or both) and a config object. The React package is in `exports/dotfield/` (also downloadable from the page as `dotfield-react.zip`). Copy the `dotfield` folder into an app, paste a copied config as `export default { … }`, and render `<DotField config={…} theme="system" />`. See `exports/dotfield/README.md`.

## GitHub Pages

`.github/workflows/pages.yml` publishes `dist/` on every push to `main`. Enable it once under Settings → Pages → Build and deployment → Source: GitHub Actions. The studio is then at the site root and the Dot Field at `/dotfield/`.

## Hosting

The Site serves `dist/`. `.openai/hosting.json` records the private Site identity. Development React fixtures are generated only for verification and removed before packaging. No backend or account integration is required by the generator.
