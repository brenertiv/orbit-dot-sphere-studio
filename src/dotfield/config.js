// Dot Field editor state ↔ the config object the React component consumes. No React here, so it's testable.
import { COMPOSITIONS } from '../../exports/dotfield/dotfield.js';

export const compositions = [
  ['tide', 'Tide'], ['band', 'Band'], ['cluster', 'Cluster'], ['coverage', 'Coverage'], ['source', 'Image or Video'],
];

/** Slider fields: label, hint, range and how the value reads. */
export const ranges = {
  cell: { label: 'Grid spacing', hint: 'Distance between dot centres.', min: 6, max: 28, step: 1, unit: 'px' },
  dot: { label: 'Largest dot', hint: 'Size of the brightest dots, relative to the spacing.', min: 0.3, max: 1, step: 0.01 },
  floor: { label: 'Background grid', hint: 'Size of the faint dots in empty areas. 0 removes the grid.', min: 0, max: 0.4, step: 0.01 },
  scale: { label: 'Shape size', hint: 'Higher values give broader, smoother forms.', min: 0.2, max: 1.5, step: 0.01 },
  contrast: { label: 'Edge contrast', hint: 'Higher values give harder, more stepped edges.', min: 0.6, max: 3, step: 0.05 },
  speed: { label: 'Drift speed', hint: '0 holds a still frame.', min: 0, max: 1, step: 0.01 },
  steps: { label: 'Tone steps', hint: 'How many of the five sequential blues the dots use.', min: 2, max: 5, step: 1, integer: true },
  mix: { label: 'Noise texture', hint: 'Breaks up the image edges into organic shapes.', min: 0, max: 1, step: 0.01 },
};

export const defaults = { composition: 'cluster', seed: 4219, cell: 14, dot: 0.9, floor: 0.12, scale: 1, contrast: 1.6, speed: 0.25, steps: 4, mix: 0.25, invert: false };

const clamp = (id, v, fallback) => {
  const { min, max, integer } = ranges[id]; v = Number(v);
  if (!Number.isFinite(v)) return fallback;
  v = Math.min(max, Math.max(min, v));
  return integer ? Math.round(v) : v;
};

/**
 * Kilowatt colours for each scheme, read from the theme: dots from chart.sequential,
 * the background grid from border.level2, the surface from background.level0.
 */
export function colorsFromTheme(theme) {
  const pick = (scheme) => {
    const p = theme.colorSchemes[scheme].palette;
    return { tones: [...p.chart.sequential], grid: p.border.level2, surface: p.background.level0 };
  };
  return { light: pick('light'), dark: pick('dark') };
}

/** The config the React component consumes. `source` is the baked image, when there is one. */
export function toConfig(state, colors, source) {
  return {
    composition: state.composition, seed: state.seed,
    grid: { cell: state.cell, maxDot: state.dot, baseDot: state.floor },
    field: { scale: state.scale, contrast: state.contrast, toneSteps: state.steps, speed: state.speed },
    ...(state.composition === 'source' ? { source: { ...source, noiseMix: state.mix, invert: state.invert } } : {}),
    color: {
      palette: 'chart.sequential',
      light: { tones: colors.light.tones, grid: colors.light.grid },
      dark: { tones: colors.dark.tones, grid: colors.dark.grid },
    },
  };
}

/** Editor state from a pasted config. Throws an Error with a message for the person when it can't. */
export function fromConfig(c, current = defaults) {
  if (!c || typeof c !== 'object' || !c.grid || !c.field) throw new Error('This doesn’t look like a Dot Field config: it needs grid and field settings.');
  if (!(c.composition in COMPOSITIONS) && c.composition !== 'source') throw new Error(`Unknown composition “${c.composition}”.`);
  const seed = Number(c.seed);
  return {
    state: {
      composition: c.composition,
      seed: Number.isInteger(seed) && seed >= 0 ? seed : current.seed,
      cell: clamp('cell', c.grid.cell, current.cell), dot: clamp('dot', c.grid.maxDot, current.dot), floor: clamp('floor', c.grid.baseDot, current.floor),
      scale: clamp('scale', c.field.scale, current.scale), contrast: clamp('contrast', c.field.contrast, current.contrast),
      steps: clamp('steps', c.field.toneSteps, current.steps), speed: clamp('speed', c.field.speed, current.speed),
      mix: c.source ? clamp('mix', c.source.noiseMix, current.mix) : current.mix,
      invert: c.source ? !!c.source.invert : current.invert,
    },
    /** True when the config carried its own colours, which Kilowatt's replace. */
    recoloured: !!(c.color && c.color.palette !== 'chart.sequential'),
    /** The baked image, when the config has one. */
    source: c.source && c.source.data ? { cols: c.source.cols, rows: c.source.rows, data: c.source.data, file: c.source.file ?? null, kind: 'image' } : null,
  };
}

/** Parse JSON, or a pasted *-config.js object literal (export default, comments, single quotes, unquoted keys, trailing commas, .5). */
export function parseConfig(text) {
  const t = text.trim().replace(/^\s*\/\/.*$/gm, '').replace(/^\s*export\s+default\s*/, '').replace(/;\s*$/, '').trim();
  try { return JSON.parse(t); } catch { /* try as a JS literal */ }
  const json = t
    .replace(/'([^'\\]*)'/g, '"$1"')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([:[,]\s*)(-?)\.(\d)/g, '$1$20.$3');
  return JSON.parse(json);
}

/** An SVG of one frame, layered by group, on the scheme's surface. */
export function toSVG(groups, W, H, surface, note) {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n`;
  if (note) out += `  <!-- ${note} -->\n`;
  out += `  <rect id="background" width="${W}" height="${H}" fill="${surface}"/>\n`;
  for (const g of groups) {
    if (!g.dots.length) continue;
    out += `  <g id="${g.name}" fill="${g.fill}">\n`;
    for (let i = 0; i < g.dots.length; i += 3) out += `    <circle cx="${g.dots[i].toFixed(1)}" cy="${g.dots[i + 1].toFixed(1)}" r="${g.dots[i + 2].toFixed(2)}"/>\n`;
    out += '  </g>\n';
  }
  return out + '</svg>\n';
}

// ---- React export: the DotField component as a ZIP, or one config for an app that already has it ----

export const usage = `import { DotField } from './dotfield/DotField';
import field from './dotfield/field-config';

<div style={{ background: 'var(--surface)' }}>
  <DotField config={field} theme="system" style={{ maxWidth: 720 }} />
</div>`;

/** The config as an ES module. A baked image's luminance grid stays on one line. */
export function configSource(config) {
  const data = config.source?.data, mark = '"__dotfield_data__"';
  let json = JSON.stringify(config, (k, v) => (k === 'data' && data ? '__dotfield_data__' : v), 2);
  if (data) json = json.replace(mark, JSON.stringify(data));
  return '// Generated by Kilowatt Studio (Field). Colours are Kilowatt\'s chart.sequential (dots) and border.level2 (background grid).\nexport default ' + json + ';\n';
}

/** A config-only download sits beside field-config.js in an installed dotfield folder, so it is named after the composition and seed. */
export function configFile(state) {
  const slug = `${state.composition === 'source' ? 'image' : state.composition}-${state.seed}`;
  const id = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()) + 'Config';
  const file = slug + '-config.js';
  return { file, id, usage: `import { DotField } from './dotfield/DotField';
import ${id} from './dotfield/${slug}-config';

<div style={{ background: 'var(--surface)' }}>
  <DotField config={${id}} theme="system" style={{ maxWidth: 720 }} />
</div>` };
}

export const guide = `# Dot Field — React

Copy the dotfield folder into your app. React 18+ is the only peer dependency; no CSS file, no install step.

\`\`\`jsx
${usage}
\`\`\`

## Config

field-config.js is the design you exported from Field in Kilowatt Studio. Import it once at module scope and share it between instances; each instance owns its own animation clock. Changing \`config\` updates in place without remounting.

Compositions: \`tide\`, \`band\`, \`cluster\`, \`coverage\`, and \`source\` (a baked image). For \`source\`, the generator writes a small luminance grid into the config, so no image file ships with the page.

## Add more designs

To add another design to an app that already has this folder, choose Config Only in Field's Export React dialog. It downloads one file named after the composition and seed (for example cluster-4219-config.js). Save it next to field-config.js and pass it as \`config\`; DotField.jsx and dotfield.js stay as they are.

## Appearance

The canvas is transparent, \`aria-hidden\`, and ignores pointer events: supply a background on the parent. It defaults to a 4:3 box that fills its container's width; pass \`style={{ aspectRatio: 'auto', height: 320 }}\` for a fixed-height band. Don't set the canvas \`width\`/\`height\` attributes; the renderer manages its backing store (DPR capped at 1.75).

\`theme="system"\` follows \`prefers-color-scheme\`. If your app has its own toggle, pass its resolved \`"light"\` or \`"dark"\`. Theme changes crossfade the palette without resetting motion. Both palettes live in the config, using Kilowatt's \`chart.sequential\` for the dots and \`border.level2\` for the background grid.

\`paused\` freezes the field at its current frame. Reduced-motion users get a static frame automatically. Animation also stops while the canvas is offscreen or the tab is hidden, and resumes where it left off.

## Integration

\`DotField.jsx\` is marked \`'use client'\`; browser APIs are touched only in effects, so SSR renders an empty canvas safely. Listeners, observers and the animation frame are released on unmount, including Strict Mode's double-mount.

\`createDotField(canvas, config, opts)\` in \`dotfield.js\` is the framework-free renderer if you need it outside React.

## Files

- DotField.jsx, DotField.d.ts — the React component and its types
- dotfield.js — the dependency-free Canvas 2D renderer
- field-config.js — the design you exported

## Performance

Cost scales with cell count, not canvas size: a 1200×900 area at \`cell: 14\` is about 5,500 dots per frame, drawn as one path per tone. Larger cells or a slower \`field.speed\` are the first levers if a page runs several instances. 60 fps is a target, not a guarantee.
`;
