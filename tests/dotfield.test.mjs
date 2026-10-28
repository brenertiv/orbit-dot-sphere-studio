import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldFrame, toneIndexes, bakedLuminance } from '../exports/dotfield/dotfield.js';
import { defaults, fromConfig, parseConfig, ranges, toConfig, toSVG } from '../src/dotfield/config.js';

const sequential = { light: { tones: ['#b9e1f5', '#74c4eb', '#2ea6e1', '#1c6487', '#09212d'], grid: '#d6dee8', surface: '#edf1f5' },
  dark: { tones: ['#09212d', '#1c6487', '#2ea6e1', '#74c4eb', '#b9e1f5'], grid: '#0a374a', surface: '#09161c' } };

test('frames are deterministic and change with the seed', () => {
  const cfg = toConfig(defaults, sequential, {});
  const a = fieldFrame(cfg, 400, 300, 1.5, sequential.light), b = fieldFrame(cfg, 400, 300, 1.5, sequential.light);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, fieldFrame({ ...cfg, seed: 7 }, 400, 300, 1.5, sequential.light));
});

test('tone steps pick evenly from the five sequential stops', () => {
  assert.deepEqual(toneIndexes(5, 2), [0, 4]);
  assert.deepEqual(toneIndexes(5, 4), [0, 1, 3, 4]);
  assert.deepEqual(toneIndexes(5, 5), [0, 1, 2, 3, 4]);
});

test('Kilowatt configs have no accent group; legacy configs still draw theirs', () => {
  const cfg = toConfig(defaults, sequential, {});
  const names = fieldFrame(cfg, 200, 150, 0, sequential.light).map(g => g.name);
  assert.deepEqual(names, ['grid', 'tone-1', 'tone-2', 'tone-3', 'tone-4']);
  const legacy = { ...cfg, color: { ...cfg.color, accentRate: 0.2 } };
  const withAccent = fieldFrame(legacy, 200, 150, 0, { ...sequential.light, accent: '#00e5a0' });
  assert.equal(withAccent.at(-1).name, 'accent');
});

test('every dot sits on the grid and inside its cell', () => {
  const cfg = toConfig({ ...defaults, composition: 'coverage' }, sequential, {});
  for (const g of fieldFrame(cfg, 320, 240, 0.7, sequential.dark)) {
    for (let i = 0; i < g.dots.length; i += 3) {
      assert.ok(g.dots[i + 2] > 0 && g.dots[i + 2] <= cfg.grid.cell / 2);
      assert.ok(Number.isFinite(g.dots[i]) && Number.isFinite(g.dots[i + 1]));
    }
  }
});

test('a config round-trips through the editor state', () => {
  const state = { ...defaults, composition: 'band', seed: 77, cell: 10, steps: 3 };
  const back = fromConfig(toConfig(state, sequential, {}));
  assert.deepEqual(back.state, state);
  assert.equal(back.recoloured, false);
});

test('pasted *-config.js objects parse, clamp, and flag their own colours', () => {
  const text = "// note\nexport default { composition: 'tide', seed: 9, grid: { cell: 99, maxDot: .9, baseDot: -1, }, field: { scale: .6, contrast: 1.6, toneSteps: 4, speed: .2 }, color: { ramp: 'deep', accentRate: .06 } };";
  const { state, recoloured } = fromConfig(parseConfig(text));
  assert.equal(state.cell, ranges.cell.max);
  assert.equal(state.floor, ranges.floor.min);
  assert.equal(state.dot, 0.9);
  assert.equal(recoloured, true);
  assert.throws(() => fromConfig({ composition: 'spiral', grid: {}, field: {} }), /Unknown composition/);
  assert.throws(() => fromConfig({}), /needs grid and field/);
});

test('baked sources cover-fit and drive the image composition', () => {
  const source = { cols: 2, rows: 2, data: [0, 255, 255, 0] };
  const lum = bakedLuminance(source, 4, 4);
  assert.equal(lum.length, 16);
  assert.equal(lum[0], 0); assert.equal(lum[3], 1);
  const cfg = toConfig({ ...defaults, composition: 'source', mix: 0 }, sequential, source);
  const dots = fieldFrame(cfg, 120, 120, 0, sequential.light).slice(1).reduce((n, g) => n + g.dots.length / 3, 0);
  assert.ok(dots > 0);
});

test('SVG export layers each group on the scheme surface', () => {
  const groups = fieldFrame(toConfig(defaults, sequential, {}), 200, 150, 0, sequential.dark);
  const svg = toSVG(groups, 200, 150, sequential.dark.surface, 'test');
  assert.match(svg, /<rect id="background" width="200" height="150" fill="#09161c"\/>/);
  assert.match(svg, /<g id="tone-1" fill="#09212d">/);
  assert.equal((svg.match(/<circle /g) || []).length, groups.reduce((n, g) => n + g.dots.length / 3, 0));
});
