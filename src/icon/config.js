// Orbit Icon editor state ↔ the config the OrbitIcon component consumes, plus SVG export. No React here.
import { iconFrame } from '../../exports/orbiticon/orbitIcon.js';

export const styles = [['swing', 'Swing (rings rock)'], ['spin', 'Spin (rings turn)'], ['still', 'Still (rings hold)']];
export const directions = [['together', 'All together'], ['middle', 'Middle ring reversed'], ['outer', 'Outer ring reversed']];
const directionSets = { together: [1, 1, 1], middle: [1, -1, 1], outer: [-1, 1, 1] };
const directionName = d => Object.entries(directionSets).find(([, v]) => v.every((x, i) => x === d?.[i]))?.[0] || 'together';

/** Slider fields: label, hint, range, and how the value reads (`unit`: deg, s, px, x, %). */
export const ranges = {
  dots: { label: 'Dots per ring', hint: 'Fewer dots read better at small sizes.', min: 3, max: 10, step: 1, integer: true },
  tilt0: { label: 'Outer ring tilt', hint: '0° faces the viewer and draws the outline.', min: 0, max: 90, step: 1, unit: 'deg' },
  tilt1: { label: 'Middle ring tilt', hint: 'How far the ring is tipped back on the shared axis.', min: 0, max: 90, step: 1, unit: 'deg' },
  tilt2: { label: 'Inner ring tilt', hint: 'Near 90° the ring flattens to a line.', min: 0, max: 90, step: 1, unit: 'deg' },
  stagger: { label: 'Ring stagger', hint: 'Offsets the rings’ dots so they don’t reach the meeting points together.', min: 0, max: 1, step: 0.01, unit: '%' },
  amount: { label: 'Swing', hint: 'How far each ring rocks either side of its tilt.', min: 0, max: 90, step: 1, unit: 'deg' },
  turns: { label: 'Turns per loop', hint: 'Whole turns keep the loop seamless.', min: 1, max: 3, step: 1, integer: true },
  drift: { label: 'Dot drift', hint: 'Dot spacings each dot travels along its ring per loop. 0 holds dots in place.', min: 0, max: 3, step: 1, integer: true },
  loop: { label: 'Loop length', hint: 'One full cycle of both states.', min: 1, max: 8, step: 0.5, unit: 's' },
  blend: { label: 'State blend', hint: 'How long idle and thinking take to blend into each other.', min: 0, max: 2, step: 0.1, unit: 's' },
  size: { label: 'Dot size', hint: 'Base diameter, as a share of the icon, at its horizontal centre.', min: 0.02, max: 0.12, step: 0.005, unit: '%' },
  left: { label: 'Left-edge size', hint: 'Multiplier for dots at the left edge.', min: 0.1, max: 1.5, step: 0.05, unit: 'x' },
  right: { label: 'Right-edge size', hint: 'Multiplier for dots at the right edge.', min: 0.5, max: 2, step: 0.05, unit: 'x' },
  minPx: { label: 'Smallest dot', hint: 'Keeps far-left dots visible at small sizes.', min: 0, max: 3, step: 0.25, unit: 'px' },
  depthFade: { label: 'Depth fade', hint: 'How much dots behind the sphere dim.', min: 0, max: 1, step: 0.05, unit: '%' },
};

export const defaults = {
  dots: 6, tilt0: 0, tilt1: 45, tilt2: 72, stagger: 1,
  idle: { style: 'swing', amount: 35, turns: 1, drift: 1, direction: 'together' },
  thinking: { style: 'spin', amount: 35, turns: 1, drift: 1, direction: 'middle' },
  loop: 4, blend: 0.6,
  size: 0.05, left: 0.45, right: 1.15, minPx: 1, depthFade: 0.65, noOverlap: false,
};

/** Kilowatt colours per scheme, read from the theme: tones from chart.sequential, preview surface from background.level0. */
export function colorsFromTheme(theme) {
  const pick = scheme => {
    const p = theme.colorSchemes[scheme].palette;
    return { tones: [...p.chart.sequential], surfaces: { page: p.background.level0, card: p.background.level2 } };
  };
  return { light: pick('light'), dark: pick('dark') };
}

/** The config OrbitIcon consumes. */
export function toConfig(s, colors) {
  const motion = m => ({ style: m.style, amount: m.amount, turns: m.turns, drift: m.drift, directions: directionSets[m.direction] });
  return {
    type: 'orbit-icon', version: 1,
    structure: { dots: s.dots, tilt: [s.tilt0, s.tilt1, s.tilt2], stagger: [0, s.stagger / 3, 2 * s.stagger / 3] },
    states: { idle: motion(s.idle), thinking: motion(s.thinking) },
    loop: s.loop, blend: s.blend,
    dots: { size: s.size, left: s.left, right: s.right, minPx: s.minPx, depthFade: s.depthFade, noOverlap: s.noOverlap },
    color: { palette: 'chart.sequential', light: colors.light.tones, dark: colors.dark.tones },
  };
}

const clamp = (id, v, fallback) => {
  const { min, max, integer } = ranges[id]; v = Number(v);
  if (!Number.isFinite(v)) return fallback;
  v = Math.min(max, Math.max(min, v));
  return integer ? Math.round(v) : v;
};

/** Editor state from a pasted config. Throws an Error with a message for the person when it can't. */
export function fromConfig(c, current = defaults) {
  if (!c || c.type !== 'orbit-icon' || !c.structure || !c.states || !c.dots) throw new Error('This doesn’t look like an Orbit Icon config.');
  const motion = (m, cur) => ({
    style: styles.some(([id]) => id === m?.style) ? m.style : cur.style,
    amount: clamp('amount', m?.amount, cur.amount), turns: clamp('turns', m?.turns, cur.turns),
    drift: clamp('drift', m?.drift, cur.drift), direction: m?.directions ? directionName(m.directions) : cur.direction,
  });
  const [t0, t1, t2] = c.structure.tilt || [];
  const stagger = Array.isArray(c.structure.stagger) ? c.structure.stagger[1] * 3 : current.stagger;
  return {
    dots: clamp('dots', c.structure.dots, current.dots),
    tilt0: clamp('tilt0', t0, current.tilt0), tilt1: clamp('tilt1', t1, current.tilt1), tilt2: clamp('tilt2', t2, current.tilt2),
    stagger: clamp('stagger', stagger, current.stagger),
    idle: motion(c.states.idle, current.idle), thinking: motion(c.states.thinking, current.thinking),
    loop: clamp('loop', c.loop, current.loop), blend: clamp('blend', c.blend, current.blend),
    size: clamp('size', c.dots.size, current.size), left: clamp('left', c.dots.left, current.left), right: clamp('right', c.dots.right, current.right),
    minPx: clamp('minPx', c.dots.minPx, current.minPx), depthFade: clamp('depthFade', c.dots.depthFade, current.depthFade),
    noOverlap: !!c.dots.noOverlap,
  };
}

const n2 = v => Math.round(v * 100) / 100;

/** A still SVG of one moment. `background` is a colour, or null for transparent. */
export function staticSVG(cfg, size, tones, background, sec = 0, blend = 0) {
  const dots = iconFrame(cfg, size, sec, blend).sort((a, b) => a.depth - b.depth);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n`;
  if (background) out += `  <rect width="${size}" height="${size}" fill="${background}"/>\n`;
  for (const d of dots) out += `  <circle cx="${n2(d.cx)}" cy="${n2(d.cy)}" r="${n2(d.r)}" fill="${tones[d.tone]}" fill-opacity="${n2(d.opacity)}"/>\n`;
  return out + '</svg>\n';
}

/**
 * A looping animated SVG of one state (blend 0 = idle, 1 = thinking), sampled at `frames` keyframes.
 * Each dot animates its position, size, opacity and tone with SMIL, so it plays as an <img> with no script.
 * After one loop every dot sits where its neighbour started, so the picture repeats without a seam.
 */
export function animatedSVG(cfg, size, tones, background, blend = 0, frames = 48) {
  const samples = [];
  for (let f = 0; f <= frames; f++) samples.push(iconFrame(cfg, size, (f / frames) * cfg.loop, blend));
  const count = samples[0].length;
  const meanDepth = i => samples.reduce((sum, fr) => sum + fr[i].depth, 0) / samples.length;
  const order = [...Array(count).keys()].sort((a, b) => meanDepth(a) - meanDepth(b));
  const dur = `${cfg.loop}s`;
  const anim = (attr, values, mode = 'linear') => `<animate attributeName="${attr}" dur="${dur}" repeatCount="indefinite" calcMode="${mode}" values="${values.join(';')}"/>`;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n`;
  out += `  <!-- Enertiv Orbit Icon · ${blend ? 'thinking' : 'idle'} · ${cfg.loop}s loop · Kilowatt chart.sequential -->\n`;
  if (background) out += `  <rect width="${size}" height="${size}" fill="${background}"/>\n`;
  for (const i of order) {
    const s0 = samples[0][i];
    out += `  <circle cx="${n2(s0.cx)}" cy="${n2(s0.cy)}" r="${n2(s0.r)}" fill="${tones[s0.tone]}" fill-opacity="${n2(s0.opacity)}">`;
    out += anim('cx', samples.map(fr => n2(fr[i].cx))) + anim('cy', samples.map(fr => n2(fr[i].cy)));
    out += anim('r', samples.map(fr => n2(fr[i].r))) + anim('fill-opacity', samples.map(fr => n2(fr[i].opacity)));
    out += anim('fill', samples.map(fr => tones[fr[i].tone]), 'discrete');
    out += '</circle>\n';
  }
  return out + '</svg>\n';
}

export const usage = `import { OrbitIcon } from './orbit-icon/OrbitIcon';
import icon from './orbit-icon/orbit-icon-config';

<OrbitIcon config={icon} state={isThinking ? 'thinking' : 'idle'} theme="system" size={32} />`;

export const guide = `# Orbit Icon — animated avatar for React

Copy the orbit-icon folder into your React application. React 18+ is the only peer dependency; there is no CSS file or install step.

\`\`\`jsx
${usage}
\`\`\`

## States

\`state\` is "idle" or "thinking". Changing it blends the motion over the config's blend time, so the avatar can follow the chat (idle while waiting, thinking while working) without a jump. Both states loop seamlessly.

## Appearance

The canvas is transparent, decorative (aria-hidden) and ignores pointer events: give the parent a background or a circular crop. \`size\` is in CSS pixels (default 32). Dot sizes, the smallest dot and the no-overlap rule are applied at that size, so the icon stays legible small.

\`theme="system"\` follows the operating system. If your app has its own theme toggle, pass its resolved "light" or "dark". Colours come from Kilowatt's chart.sequential and are stored in the config for both schemes.

\`paused\` freezes the icon. Reduced motion shows a still frame of the current state. Animation also stops while the icon is offscreen or the tab is hidden.

## Files

- OrbitIcon.jsx, OrbitIcon.d.ts — the React component ('use client'; SSR-safe)
- orbitIcon.js — the dependency-free renderer (createOrbitIcon, iconFrame)
- orbit-icon-config.js — the design you exported

Edit the design in Kilowatt Studio (Icon tab), then export again.
`;
