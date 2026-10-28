// Enertiv Dot Field — dependency-free Canvas 2D renderer.
// Round dots on a fixed grid; a slow noise field (or a baked image) drives dot size and tone.
// Consumes the config object copied from the Dot Field generator.

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) {
  return 0.5 * vnoise(x, y, s) + 0.3 * vnoise(x * 2.1 + 7, y * 2.1 + 3, s + 1) + 0.2 * vnoise(x * 4.3 + 11, y * 4.3 + 5, s + 2);
}

const COMP = {
  tide: (u, v, t, sc, seed) => { const n = fbm(u * 3 / sc + t * 0.6, v * 3 / sc, seed); return v * 1.15 - 0.25 + (n - 0.5) * 0.9; },
  band: (u, v, t, sc, seed) => { const n = fbm(u * 3 / sc + t * 0.5, v * 3 / sc, seed); const d = Math.abs(v - 0.62 + (n - 0.5) * 0.25); return 1.05 - d * 4.2 / sc + (n - 0.5) * 0.35; },
  cluster: (u, v, t, sc, seed) => { const cx = 0.5 + 0.18 * Math.cos(t * 0.9), cy = 0.5 + 0.14 * Math.sin(t * 0.7); const n = fbm(u * 4 / sc + t * 0.4, v * 4 / sc, seed); const d = Math.hypot((u - cx) * 1.33, v - cy); return 1.1 - d * 2.6 / sc + (n - 0.5) * 0.75; },
  coverage: (u, v, t, sc, seed) => { const n = fbm(u * 2.2 / sc + t * 0.3, v * 2.2 / sc + t * 0.2, seed); return (n - 0.35) * 2.2; },
};

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, k) { return a.map((x, i) => Math.round(x + (b[i] - x) * k)); }
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

/**
 * Mount a Dot Field on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} config  — the generator's config object
 * @param {{theme?: 'light'|'dark', paused?: boolean}} [opts]
 */
export function createDotField(canvas, config, opts = {}) {
  const ctx = canvas.getContext('2d');
  let cfg = config;
  let theme = opts.theme || 'light';
  let paused = !!opts.paused;
  let visible = true, docVisible = !document.hidden;
  let W = 0, H = 0, dpr = 1, raf = 0, t0 = performance.now(), lastT = 0;
  let blend = 1, from = null; // theme crossfade
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Baked image source (optional): cover-fit the stored luminance grid onto the live grid.
  function sourceLum(cols, rows) {
    const s = cfg.source; if (!s || !s.data) return null;
    const out = new Float32Array(cols * rows);
    const sc = Math.max(cols / s.cols, rows / s.rows), dw = s.cols * sc, dh = s.rows * sc, ox = (cols - dw) / 2, oy = (rows - dh) / 2;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const sx = Math.min(s.cols - 1, Math.max(0, Math.floor((i - ox) / sc)));
      const sy = Math.min(s.rows - 1, Math.max(0, Math.floor((j - oy) / sc)));
      out[j * cols + i] = s.data[sy * s.cols + sx] / 255;
    }
    return out;
  }

  // The accent is optional: configs coloured from chart.sequential have none.
  const accentOf = (p) => p.accent || p.grid;
  function palette() {
    const cur = cfg.color[theme];
    if (!from || blend >= 1) return { tones: cur.tones.map(hexToRgb), grid: hexToRgb(cur.grid), accent: hexToRgb(accentOf(cur)) };
    return {
      tones: cur.tones.map((c, i) => mix(hexToRgb(from.tones[i] || c), hexToRgb(c), blend)),
      grid: mix(hexToRgb(from.grid), hexToRgb(cur.grid), blend),
      accent: mix(hexToRgb(accentOf(from)), hexToRgb(accentOf(cur)), blend),
    };
  }

  function frame(t) {
    const P = palette();
    const { cell, maxDot, baseDot } = cfg.grid;
    const { scale, contrast, toneSteps: n } = cfg.field;
    const tones = [];
    for (let i = 0; i < n; i++) tones.push(P.tones[Math.round(i * (P.tones.length - 1) / (n - 1))]);
    const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const ox = (W - (cols - 1) * cell) / 2, oy = (H - (rows - 1) * cell) / 2;
    const base = cell * 0.5 * baseDot, seed = cfg.seed, accentRate = cfg.color[theme].accent ? (cfg.color.accentRate || 0) : 0;
    const groups = [{ fill: P.grid, dots: [] }, ...tones.map((c) => ({ fill: c, dots: [] })), { fill: P.accent, dots: [] }];
    const grid = groups[0].dots, accent = groups[groups.length - 1].dots;
    const useSrc = cfg.composition === 'source';
    const lum = useSrc ? sourceLum(cols, rows) : null;
    const comp = COMP[cfg.composition] || COMP.tide;
    const src = cfg.source || {};
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + i * cell, y = oy + j * cell;
      let v;
      if (useSrc) {
        if (!lum) v = 0;
        else { let L = lum[j * cols + i]; if (src.invert) L = 1 - L; v = L + (fbm(i / cols * 3 / scale + t * 0.5, j / rows * 3 / scale, seed) - 0.5) * (src.noiseMix || 0); }
      } else v = comp(i / cols, j / rows, t, scale, seed);
      v = Math.max(0, Math.min(1, 0.5 + (v - 0.5) * contrast));
      if (v < 0.06) { if (base > 0.35) grid.push(x, y, base); continue; }
      const r = cell * 0.5 * (baseDot + (maxDot - baseDot) * v);
      const k = Math.min(n - 1, Math.floor(v * n));
      const isAccent = v > 0.35 && hash(i, j, seed + 99) < accentRate * v;
      (isAccent ? accent : groups[k + 1].dots).push(x, y, r);
    }
    return groups;
  }

  function draw(now) {
    raf = 0;
    if (!paused && !reduced) lastT = ((now - t0) / 1000) * cfg.field.speed;
    if (blend < 1) blend = Math.min(1, blend + 0.06);
    ctx.clearRect(0, 0, W, H);
    for (const g of frame(lastT)) {
      if (!g.dots.length) continue;
      const p = new Path2D();
      for (let i = 0; i < g.dots.length; i += 3) { p.moveTo(g.dots[i] + g.dots[i + 2], g.dots[i + 1]); p.arc(g.dots[i], g.dots[i + 1], g.dots[i + 2], 0, 6.2832); }
      ctx.fillStyle = rgb(g.fill); ctx.fill(p);
    }
    const animating = (!paused && !reduced && cfg.field.speed > 0) || blend < 1;
    if (animating && visible && docVisible) raf = requestAnimationFrame(draw);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kick();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { t0 = performance.now() - lastT / Math.max(cfg.field.speed, 1e-6) * 1000; kick(); } });
  io.observe(canvas);
  const onVis = () => { docVisible = !document.hidden; if (docVisible) { t0 = performance.now() - lastT / Math.max(cfg.field.speed, 1e-6) * 1000; kick(); } };
  document.addEventListener('visibilitychange', onVis);
  resize();

  return {
    setTheme(next) { if (next === theme) return; from = cfg.color[theme]; theme = next; blend = 0; kick(); },
    setPaused(p) { paused = !!p; if (!paused) t0 = performance.now() - lastT / Math.max(cfg.field.speed, 1e-6) * 1000; kick(); },
    setConfig(next) { cfg = next; kick(); },
    destroy() { if (raf) cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); },
  };
}
