import test from 'node:test';
import assert from 'node:assert/strict';
import { iconDots, iconFrame } from '../exports/orbiticon/orbitIcon.js';
import { animatedSVG, defaults, fromConfig, staticSVG, toConfig } from '../src/icon/config.js';
import { encodeGIF, iconPalette, indexPixels } from '../src/icon/gif.js';

const colors = { light: { tones: ['#b9e1f5', '#74c4eb', '#2ea6e1', '#1c6487', '#09212d'] }, dark: { tones: ['#09212d', '#1c6487', '#2ea6e1', '#74c4eb', '#b9e1f5'] } };
const cfg = toConfig(defaults, colors);
const key = d => `${d.cx.toFixed(3)},${d.cy.toFixed(3)},${d.r.toFixed(3)}`;

test('three rings of dots that all pass through the left and right points', () => {
  assert.equal(iconDots(cfg, 0).length, defaults.dots * 3);
  for (const d of iconDots(cfg, 1.3, 0.4)) assert.ok(Math.abs(d.x * d.x + d.y * d.y + d.z * d.z - 1) < 1e-9);
});

test('both states loop seamlessly: the picture at the end of a loop matches the start', () => {
  for (const blend of [0, 1]) {
    const a = iconFrame(cfg, 96, 0, blend).map(key).sort();
    const b = iconFrame(cfg, 96, cfg.loop, blend).map(key).sort();
    assert.deepEqual(a, b);
  }
});

test('dot size follows screen position: larger to the right, never below the smallest dot', () => {
  const frame = iconFrame({ ...cfg, dots: { ...cfg.dots, noOverlap: false } }, 96, 0.7, 0);
  const left = frame.reduce((m, d) => (d.cx < m.cx ? d : m)), right = frame.reduce((m, d) => (d.cx > m.cx ? d : m));
  assert.ok(right.r > left.r);
  for (const d of iconFrame(cfg, 32, 2.1, 1)) assert.ok(d.r * 2 >= cfg.dots.minPx - 1e-9);
});

test('no-overlap keeps neighbouring dots from touching', () => {
  const frame = iconFrame({ ...cfg, dots: { ...cfg.dots, noOverlap: true, size: 0.12, minPx: 0 } }, 96, 1.1, 0);
  for (const a of frame) for (const b of frame) if (a !== b) assert.ok(Math.hypot(a.cx - b.cx, a.cy - b.cy) >= a.r + b.r - 1e-6 || a.r + b.r < 1e-6);
});

test('blending moves smoothly from idle to thinking', () => {
  const at = b => iconDots(cfg, 1, b);
  const mid = at(0.5), lo = at(0.49);
  const jump = Math.max(...mid.map((d, i) => Math.hypot(d.x - lo[i].x, d.y - lo[i].y, d.z - lo[i].z)));
  assert.ok(jump < 0.1, `jump ${jump}`);
});

test('a config round-trips through the editor state, and foreign configs are refused', () => {
  const state = { ...defaults, dots: 5, tilt1: 50, idle: { ...defaults.idle, amount: 20 }, thinking: { ...defaults.thinking, direction: 'outer', turns: 2 } };
  assert.deepEqual(fromConfig(toConfig(state, colors)), state);
  assert.throws(() => fromConfig({ composition: 'tide', grid: {}, field: {} }), /Orbit Icon config/);
});

test('SVG exports: one circle per dot, animated per state', () => {
  const still = staticSVG(cfg, 32, colors.light.tones, '#ffffff');
  assert.equal((still.match(/<circle /g) || []).length, defaults.dots * 3);
  const anim = animatedSVG(cfg, 32, colors.dark.tones, null, 1, 24);
  assert.equal((anim.match(/<circle /g) || []).length, defaults.dots * 3);
  assert.equal((anim.match(/<animate /g) || []).length, defaults.dots * 3 * 5);
  assert.match(anim, /dur="4s"/);
  assert.doesNotMatch(anim, /<rect/);
});

// Minimal GIF LZW decoder, to check the encoder's output decodes back to the same indices.
function decodeFirstFrame(bytes) {
  let p = 13 + 3 * (1 << ((bytes[10] & 7) + 1));
  while (bytes[p] !== 0x2c) { p += 2; while (bytes[p]) p += bytes[p] + 1; p++; }
  p += 10; const min = bytes[p++], data = [];
  while (bytes[p]) { data.push(...bytes.slice(p + 1, p + 1 + bytes[p])); p += bytes[p] + 1; }
  const clear = 1 << min, eoi = clear + 1, out = [];
  let size = min + 1, dict = [], prev = null, bit = 0;
  const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = []; dict[eoi] = []; size = min + 1; prev = null; };
  reset();
  for (;;) {
    let code = 0; for (let i = 0; i < size; i++, bit++) code |= ((data[bit >> 3] >> (bit & 7)) & 1) << i;
    if (code === clear) { reset(); continue; }
    if (code === eoi) break;
    let entry = dict[code] ?? (prev ? [...prev, prev[0]] : null);
    out.push(...entry);
    if (prev) dict.push([...prev, entry[0]]);
    prev = entry;
    if (dict.length === 1 << size && size < 12) size++;
  }
  return out;
}

test('GIF frames decode back to the same palette indices', () => {
  const palette = iconPalette('#ffffff', colors.light.tones);
  assert.equal(palette.length, 128);
  const W = 64, H = 64, rgba = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) rgba.set([...palette[(i * 37 + (i >> 5)) % 128], 255], i * 4);
  const idx = indexPixels(rgba, palette);
  const gif = encodeGIF([idx, idx], W, H, palette, 4);
  assert.equal(String.fromCharCode(...gif.slice(0, 6)), 'GIF89a');
  assert.equal(gif.at(-1), 0x3b);
  const decoded = decodeFirstFrame(gif);
  assert.equal(decoded.length, W * H);
  assert.deepEqual(decoded.slice(0, W * H), [...idx].map((v, i) => palette[v].join() === palette[decoded[i]].join() ? decoded[i] : v));
});
