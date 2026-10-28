// Orbit Icon — dependency-free Canvas 2D renderer for the small animated avatar.
// Three great circles share a horizontal axis; their rings pivot on it while dots drift along them.
// Dot size follows each dot's position on screen (small at the left, large at the right); depth sets tone and fade.
// Two states, "idle" and "thinking", blend smoothly. Every loop is seamless.

const TAU = Math.PI * 2;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Pivot angle of ring i, in degrees from facing the viewer, for one state's motion at loop position u (any real). */
function statePivot(cfg, motion, i, u) {
  const base = cfg.structure.tilt[i];
  const dir = motion.directions?.[i] ?? 1;
  if (motion.style === 'spin') return base + dir * 360 * motion.turns * u;
  if (motion.style === 'swing') return base + dir * motion.amount * Math.sin(TAU * (u + i / 3));
  return base; // "still": rings hold their tilt
}

/**
 * Dot positions for one moment, unsorted, in dot order (ring, index), so a dot keeps its identity across frames.
 * `sec` is time in seconds; `blend` mixes idle (0) and thinking (1). Positions are unit-sphere coordinates:
 * x right, y up, z toward the viewer.
 */
export function iconDots(cfg, sec, blend = 0) {
  const { dots: n, stagger } = cfg.structure;
  const u = sec / cfg.loop;
  const idle = cfg.states.idle, thinking = cfg.states.thinking;
  const drift = idle.drift * (1 - blend) + thinking.drift * blend;
  const out = [];
  for (let i = 0; i < 3; i++) {
    const beta = (statePivot(cfg, idle, i, u) * (1 - blend) + statePivot(cfg, thinking, i, u) * blend) * Math.PI / 180;
    const cb = Math.cos(beta), sb = Math.sin(beta), step = TAU / n;
    for (let k = 0; k < n; k++) {
      const a = (k + stagger[i] + drift * u) * step;
      const s = Math.sin(a);
      out.push({ ring: i, index: k, x: Math.cos(a), y: s * cb, z: s * sb });
    }
  }
  return out;
}

/**
 * One drawable frame at `size` CSS pixels: circles with centre, radius, opacity and tone index (0–4 into the palette).
 * Size comes from screen position; depth sets tone and opacity; optional no-overlap shrinks dots that would touch.
 */
export function iconFrame(cfg, size, sec, blend = 0) {
  const d = cfg.dots, R = size * 0.4, c = size / 2;
  const base = size * d.size;
  const list = iconDots(cfg, sec, blend).map((p) => {
    const across = (p.x + 1) / 2, depth = (p.z + 1) / 2;
    return {
      ring: p.ring, index: p.index, depth,
      cx: c + R * p.x, cy: c - R * p.y,
      r: Math.max(d.minPx / 2, base * (d.left + (d.right - d.left) * across)),
      opacity: 1 - d.depthFade * (1 - depth),
      tone: Math.min(4, 1 + Math.floor(depth * 4)),
    };
  });
  if (d.noOverlap) {
    for (const a of list) {
      let nearest = Infinity;
      for (const b of list) if (a !== b) nearest = Math.min(nearest, Math.hypot(a.cx - b.cx, a.cy - b.cy));
      a.r = Math.max(d.minPx / 2, Math.min(a.r, nearest * 0.5));
    }
  }
  return list;
}

function draw(ctx, cfg, size, sec, blend, tones) {
  ctx.clearRect(0, 0, size, size);
  const frame = iconFrame(cfg, size, sec, blend).sort((a, b) => a.depth - b.depth);
  for (const dot of frame) {
    ctx.globalAlpha = dot.opacity;
    ctx.fillStyle = tones[dot.tone];
    ctx.beginPath(); ctx.arc(dot.cx, dot.cy, dot.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Mount an Orbit Icon on a canvas. The canvas is transparent; size it with CSS (square).
 * @param {HTMLCanvasElement} canvas
 * @param {object} config  the generator's config
 * @param {{state?: 'idle'|'thinking', theme?: 'light'|'dark', paused?: boolean}} [opts]
 */
export function createOrbitIcon(canvas, config, opts = {}) {
  const ctx = canvas.getContext('2d');
  let cfg = config, theme = opts.theme || 'light', paused = !!opts.paused;
  let target = opts.state === 'thinking' ? 1 : 0, blend = target;
  let size = 0, raf = 0, visible = true, docVisible = !document.hidden;
  let sec = 0, last = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    if (!paused && !reduced) sec += dt;
    if (blend !== target) {
      const stepBy = dt / Math.max(0.001, cfg.blend);
      blend = target > blend ? Math.min(target, blend + stepBy) : Math.max(target, blend - stepBy);
    }
    draw(ctx, cfg, size, sec, reduced ? target : ease(blend), cfg.color[theme]);
    if (!paused && !reduced && visible && docVisible) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = Math.round(Math.min(r.width, r.height));
    canvas.width = Math.max(1, Math.round(size * dpr)); canvas.height = canvas.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kick();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
  io.observe(canvas);
  const onVis = () => { docVisible = !document.hidden; if (docVisible) kick(); };
  document.addEventListener('visibilitychange', onVis);
  resize();

  return {
    setState(state) { target = state === 'thinking' ? 1 : 0; if (reduced) blend = target; kick(); },
    setTheme(next) { theme = next; kick(); },
    setPaused(p) { paused = !!p; kick(); },
    setConfig(next) { cfg = next; kick(); },
    destroy() { if (raf) cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); },
  };
}
