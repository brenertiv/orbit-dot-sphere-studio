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
