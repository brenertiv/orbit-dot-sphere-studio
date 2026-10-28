import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, AppBar, Box, Button, Card, CardContent, CardHeader, Checkbox, Container, FormControlLabel, GlobalStyles, IconButton, Link, MenuItem, Slider, Snackbar, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { Icon } from '../icons';
import { fieldFrame, toneIndexes } from '../../exports/dotfield/dotfield.js';
import { colorsFromTheme, compositions, defaults, fromConfig, parseConfig, ranges, toConfig, toSVG } from './config';

const ORBIT_URL = 'https://brenertiv.github.io/orbit-dot-sphere-studio/';
const DOTFIELD_URL = 'https://brenertiv.github.io/orbit-dot-sphere-studio/dotfield/';
const ZIP_URL = DOTFIELD_URL + 'dotfield-react.zip';
const two = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
function formatValue(id, v) { const r = ranges[id]; return r.unit === 'px' ? whole.format(v) + '\u00a0px' : r.integer ? whole.format(v) : two.format(v); }

// ---- Live image / video sampling --------------------------------------------
const sampler = typeof document !== 'undefined' ? document.createElement('canvas') : null;
function sampleMedia(media, cols, rows) {
  const mw = media.naturalWidth || media.videoWidth, mh = media.naturalHeight || media.videoHeight;
  if (!mw || !mh) return null;
  const ctx = sampler.getContext('2d', { willReadFrequently: true });
  if (sampler.width !== cols || sampler.height !== rows) { sampler.width = cols; sampler.height = rows; }
  const s = Math.max(cols / mw, rows / mh), dw = mw * s, dh = mh * s;
  ctx.drawImage(media, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  const d = ctx.getImageData(0, 0, cols, rows).data, lum = new Float32Array(cols * rows);
  for (let i = 0, p = 0; i < lum.length; i++, p += 4) lum[i] = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
  return lum;
}

// ---- Saving files: the artifact viewer's downloads capability, or a browser download ----
async function saveText(filename, text, type) {
  if (window.claude?.use) {
    const downloads = await window.claude.use('downloads');
    if (!downloads) throw new Error('Saving isn’t available here.');
    await downloads.save({ filename, data: text });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One preview pane: draws the field on its scheme's page surface, every frame while it moves. */
function FieldCanvas({ config, palette, luminance, clock, paused, onSize }) {
  const canvas = useRef(), latest = useRef();
  latest.current = { config, palette, luminance, paused };
  useEffect(() => {
    const el = canvas.current, ctx = el.getContext('2d');
    let W = 0, H = 0, raf = 0;
    const draw = (now) => {
      raf = 0;
      const { config: cfg, palette: pal, luminance: lum, paused: still } = latest.current;
      const t = clock.at(now, cfg.field.speed, still);
      ctx.clearRect(0, 0, W, H);
      if (W && H) for (const g of fieldFrame(cfg, W, H, t, pal, lum)) {
        if (!g.dots.length) continue;
        const path = new Path2D();
        for (let i = 0; i < g.dots.length; i += 3) { path.moveTo(g.dots[i] + g.dots[i + 2], g.dots[i + 1]); path.arc(g.dots[i], g.dots[i + 1], g.dots[i + 2], 0, 6.2832); }
        ctx.fillStyle = g.fill; ctx.fill(path);
      }
      if (clock.moving(cfg.field.speed, still) || lum?.live) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = Math.round(r.width); H = Math.round(r.height);
      el.width = Math.max(1, Math.round(W * dpr)); el.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onSize?.({ W, H }); kick();
    });
    ro.observe(el);
    latest.current.kick = kick;
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => latest.current.kick?.(), [config, palette, luminance, paused]);
  return <canvas ref={canvas} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }} />;
}

/** A shared clock, so both panes and the SVG export use the same moment of the drift. */
function createClock(reduced) {
  let base = 0, since = performance.now(), last = 0;
  return {
    at(now, speed, paused) {
      if (reduced) return 0;
      if (paused) { since = now; base = last; return last; }
      last = base + (now - since) / 1000 * speed; return last;
    },
    moving: (speed, paused) => !reduced && !paused && speed > 0,
    now: () => last,
  };
}

function Hint({ children }) { return <Typography variant="caption" color="text.secondary">{children}</Typography>; }
function Range({ id, value, onChange }) {
  const { label, hint, min, max, step } = ranges[id];
  return <Box>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography id={id + '-label'} variant="body2">{label}</Typography>
      <Typography component="output" variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatValue(id, value)}</Typography>
    </Stack>
    <Box sx={{ px: 1 }}><Slider aria-labelledby={id + '-label'} value={value} min={min} max={max} step={step} valueLabelDisplay="auto" valueLabelFormat={v => formatValue(id, v)} getAriaValueText={v => formatValue(id, v)} onChange={(_, v) => onChange(v)} /></Box>
    <Hint>{hint}</Hint>
  </Box>;
}
function Section({ title, children, defaultExpanded = false }) {
  return <Accordion defaultExpanded={defaultExpanded} elevation={0} disableGutters>
    <AccordionSummary expandIcon={<Icon name="expand_more" />}><Typography variant="h6" component="span">{title}</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={2}>{children}</Stack></AccordionDetails>
  </Accordion>;
}

export function App() {
  const theme = useTheme();
  const colors = useMemo(() => colorsFromTheme(theme), [theme]);
  const { mode, systemMode, setMode } = useColorScheme(), editorMode = (mode === 'system' ? systemMode : mode) || 'light';
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [clock] = useState(() => createClock(window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [state, setState] = useState(defaults);
  const [view, setView] = useState(null), shown = view || editorMode;
  const [paused, setPaused] = useState(false);
  const [media, setMedia] = useState(null);          // { el, kind, name } for a chosen image or video
  const [baked, setBaked] = useState(null);          // a baked source from an imported config
  const [importText, setImportText] = useState(''), [importError, setImportError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const sizes = useRef({}), dragDepth = useRef(0);
  const change = patch => setState(s => ({ ...s, ...patch }));
  const notify = (message, severity = 'success') => setToast({ message, severity, key: Date.now() });

  // Live media overrides any baked source; it re-samples every frame for video.
  const luminance = useMemo(() => {
    if (!media) return undefined;
    const fn = (cols, rows) => sampleMedia(media.el, cols, rows);
    fn.live = media.kind === 'video';
    return fn;
  }, [media]);
  useEffect(() => {
    if (media?.kind !== 'video') return;
    if (state.composition === 'source' && !reduced) media.el.play().catch(() => {}); else media.el.pause();
  }, [media, state.composition, reduced]);

  const source = useMemo(() => {
    if (media?.kind === 'image') {
      const cols = 96, rows = Math.max(1, Math.round(96 * media.el.naturalHeight / media.el.naturalWidth));
      const lum = sampleMedia(media.el, cols, rows);
      return { file: media.name, kind: 'image', cols, rows, data: lum ? Array.from(lum, v => Math.round(v * 255)) : undefined };
    }
    if (media) return { file: media.name, kind: media.kind };
    return baked || { file: null, kind: null };
  }, [media, baked]);
  const config = useMemo(() => toConfig(state, colors, source), [state, colors, source]);
  const configText = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const name = compositions.find(([id]) => id === state.composition)[1];
  const schemes = shown === 'compare' ? ['light', 'dark'] : [shown];
  const needsFile = state.composition === 'source' && !media && !baked;

  function toggleTheme() { setMode(editorMode === 'light' ? 'dark' : 'light'); }
  function loadFile(file) {
    if (!file || !/^(image|video)\//.test(file.type)) { notify('Choose an image or a video file.', 'error'); return; }
    const url = URL.createObjectURL(file);
    if (media) { media.el.pause?.(); URL.revokeObjectURL(media.el.src); }
    if (file.type.startsWith('video/')) {
      const v = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, src: url });
      v.addEventListener('loadeddata', () => setMedia({ el: v, kind: 'video', name: file.name }), { once: true });
    } else {
      const im = new Image();
      im.onload = () => setMedia({ el: im, kind: 'image', name: file.name });
      im.onerror = () => notify('That image couldn’t be read.', 'error');
      im.src = url;
    }
    setBaked(null);
    change({ composition: 'source' });
  }
  async function copyConfig() {
    try { await navigator.clipboard.writeText(configText); notify('Config copied.'); }
    catch { notify('Copy isn’t available here. Open Show Config and copy it with your keyboard.', 'error'); }
  }
  async function downloadSVG() {
    const t = clock.now();
    try {
      for (const scheme of schemes) {
        const { W = 800, H = 600 } = sizes.current[scheme] || {};
        const groups = fieldFrame(config, W, H, t, colors[scheme], luminance);
        const svg = toSVG(groups, W, H, colors[scheme].surface, `Enertiv Dot Field · ${state.composition} · seed ${state.seed} · ${scheme} · Kilowatt chart.sequential on background.level0`);
        await saveText(`enertiv-dotfield-${state.composition}-${scheme}-${state.seed}.svg`, svg, 'image/svg+xml');
      }
      notify(schemes.length > 1 ? 'Light and dark SVGs saved.' : 'SVG saved.');
    } catch (error) {
      if (error?.code !== 'declined') notify(error?.message || 'The SVG couldn’t be saved.', 'error');
    }
  }
  function applyImport() {
    try {
      const result = fromConfig(parseConfig(importText), state);
      setState(result.state);
      if (result.source) { setBaked(result.source); setMedia(null); }
      setImportError(''); setImportOpen(false);
      notify(result.recoloured ? 'Config applied. Its own colours were replaced with Kilowatt’s.' : 'Config applied.');
    } catch (error) {
      setImportError(error instanceof SyntaxError ? 'Couldn’t read that config. Check that it was pasted in full.' : error.message);
    }
  }
  const dragProps = {
    onDragEnter: e => { e.preventDefault(); dragDepth.current++; setDragging(true); },
    onDragOver: e => e.preventDefault(),
    onDragLeave: () => { if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); } },
    onDrop: e => { e.preventDefault(); dragDepth.current = 0; setDragging(false); loadFile(e.dataTransfer.files[0]); },
  };
  const range = id => <Range key={id} id={id} value={state[id]} onChange={v => change({ [id]: v })} />;
  const used = new Set(toneIndexes(5, state.steps));
  const meta = `${name}${state.composition === 'source' ? ' · ' + (media?.name || source.file || 'no file yet') : ''} · seed ${state.seed}`;

  return <>
    {/* Same phone tap targets as the Orbit editor; the upstream theme stays unchanged. */}
    <GlobalStyles styles={t => ({
      [t.breakpoints.down('sm')]: { '.MuiButton-root,.MuiIconButton-root,.MuiToggleButton-root,.MuiTab-root': { minHeight: 44 }, '.MuiIconButton-root': { minWidth: 44 } },
      '@media (pointer: coarse)': { '.MuiButton-root,.MuiIconButton-root,.MuiToggleButton-root,.MuiTab-root': { minHeight: 44 }, '.MuiIconButton-root': { minWidth: 44 } },
    })} />
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: 'background.level2', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="a" href={DOTFIELD_URL} sx={{ color: 'text.primary', textDecoration: 'none' }}>Dot Field</Typography>
        <Tabs value="dotfield" aria-label="Studio tools" sx={{ alignSelf: 'flex-end' }}>
          <Tab value="orbit" label="Orbit" component="a" href={ORBIT_URL} />
          <Tab value="dotfield" label="Dot Field" component="a" href={DOTFIELD_URL} aria-current="page" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={'Switch to ' + (editorMode === 'light' ? 'dark' : 'light') + ' mode'}>
          <IconButton aria-label={'Switch to ' + (editorMode === 'light' ? 'dark' : 'light') + ' mode'} onClick={toggleTheme}><Icon name={editorMode === 'light' ? 'dark_mode' : 'light_mode'} /></IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>

    <Container maxWidth="xl" component="main" sx={{ py: 3 }}>
      <Box sx={t => ({ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: t.spacing(44) + ' minmax(0,1fr)' }, gridTemplateAreas: { xs: '"preview" "controls"', md: '"controls preview"' }, gap: 3, alignItems: 'start' })}>
        <Card variant="outlined" component="section" aria-label="Illustration preview" sx={{ gridArea: 'preview', minWidth: 0, position: { md: 'sticky' }, top: 16 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" component="h1">Preview</Typography>
            <ToggleButtonGroup exclusive value={shown} onChange={(_, v) => { if (v) setView(v); }} aria-label="Preview surface">
              <ToggleButton value="light">Light</ToggleButton><ToggleButton value="dark">Dark</ToggleButton><ToggleButton value="compare">Compare</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box component="figure" aria-label={`Dot field preview: ${meta}, on the ${schemes.join(' and ')} surface${schemes.length > 1 ? 's' : ''}`} sx={{ m: 0, position: 'relative', display: 'flex', aspectRatio: '4 / 3' }} {...dragProps}>
            {['light', 'dark'].map(scheme => {
              const p = theme.colorSchemes[scheme].palette;
              return <Box key={scheme} sx={{ display: schemes.includes(scheme) ? 'flex' : 'none', flexDirection: 'column', flex: 1, minWidth: 0, bgcolor: p.background.level0, color: p.text.secondary }}>
                {schemes.length > 1 && <Typography variant="caption" sx={{ px: 2, pt: 2 }}>{scheme === 'dark' ? 'Dark surface' : 'Light surface'}</Typography>}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <FieldCanvas config={config} palette={colors[scheme]} luminance={luminance} clock={clock} paused={paused} onSize={s => { sizes.current[scheme] = s; }} />
                </Box>
              </Box>;
            })}
            {(dragging || needsFile) && <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 3, textAlign: 'center', bgcolor: 'background.level2', border: 2, borderStyle: 'dashed', borderColor: 'control.focus', pointerEvents: 'none' }}>
              <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <Icon name="image" fontSize="large" sx={{ color: 'text.secondary' }} />
                <Typography variant="body1">{dragging ? 'Drop an image or video to use its shapes' : 'Choose a file under Source, or drop an image or video here'}</Typography>
              </Stack>
            </Box>}
          </Box>
          <CardContent>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}>{meta}</Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                {!reduced && <Button variant="outlined" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Resume animation' : 'Pause animation'}>{paused ? 'Resume' : 'Pause'}</Button>}
                <Button variant="outlined" startIcon={<Icon name="content_copy" />} onClick={copyConfig}>Copy Config</Button>
                <Button variant="contained" startIcon={<Icon name="download" />} onClick={downloadSVG}>{schemes.length > 1 ? 'Download SVGs' : 'Download SVG'}</Button>
              </Stack>
            </Stack>
            {reduced && <Hint>Static preview · reduced motion is on</Hint>}
          </CardContent>
        </Card>

        <Card variant="outlined" component="aside" aria-label="Illustration settings" sx={{ gridArea: 'controls', minWidth: 0 }}>
          <CardHeader title="Design" slotProps={{ title: { variant: 'h6', component: 'h2' } }} action={<Button startIcon={<Icon name="restart_alt" />} onClick={() => { setState(defaults); setMedia(null); setBaked(null); notify('Settings reset.'); }}>Reset</Button>} />
          <Section title="Composition" defaultExpanded>
            <TextField id="composition" select fullWidth label="Composition" value={state.composition} onChange={e => change({ composition: e.target.value })} helperText="Or drop an image or video onto the preview.">
              {compositions.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
            </TextField>
            {state.composition === 'source' && <>
              <Box>
                <Button variant="outlined" component="label" startIcon={<Icon name="image" />}>
                  Choose File
                  <input hidden type="file" accept="image/*,video/*" onChange={e => { loadFile(e.target.files[0]); e.target.value = ''; }} />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {media ? `Using “${media.name}”. ` : baked ? 'Using the image baked into the imported config. ' : ''}Bright areas become large dots. The file stays in your browser.
                </Typography>
              </Box>
              {range('mix')}
              <FormControlLabel control={<Checkbox checked={state.invert} onChange={e => change({ invert: e.target.checked })} />} label="Invert (dark areas become large dots)" />
            </>}
          </Section>
          <Section title="Grid" defaultExpanded>{['cell', 'dot', 'floor'].map(range)}</Section>
          <Section title="Shape" defaultExpanded>{['scale', 'contrast', 'speed'].map(range)}</Section>
          <Section title="Colour">
            {range('steps')}
            <Stack spacing={1} aria-label="Sequential colours in use">
              {['light', 'dark'].map(scheme => {
                const p = theme.colorSchemes[scheme].palette;
                return <Stack key={scheme} direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: p.background.level0, color: p.text.secondary }}>
                  <Typography variant="caption" sx={{ width: t => t.spacing(5), flexShrink: 0 }}>{scheme === 'dark' ? 'Dark' : 'Light'}</Typography>
                  {p.chart.sequential.map((c, k) => <Box key={k} title={`chart.sequential.${k}${used.has(k) ? '' : ' (not used at this step count)'}`} sx={t => ({ flex: 1, height: t.spacing(3), borderRadius: 0.5, bgcolor: c, opacity: used.has(k) ? 1 : 0.38 })} />)}
                </Stack>;
              })}
            </Stack>
            <Hint>Dots use chart.sequential and the background grid uses border.level2, so the illustration follows Kilowatt in both schemes.</Hint>
          </Section>
          <Section title="Config">
            <Box component="pre" tabIndex={0} aria-label="Config" sx={{ m: 0, p: 2, borderRadius: 1, bgcolor: 'background.level0', overflow: 'auto', maxHeight: t => t.spacing(40), typography: 'body2', fontFamily: 'monospace', whiteSpace: 'pre' }}><code>{configText}</code></Box>
            {!importOpen ? <Box><Button startIcon={<Icon name="edit" />} onClick={() => setImportOpen(true)}>Import Config</Button></Box> : <>
              <TextField label="Paste a config" multiline minRows={5} fullWidth value={importText} onChange={e => setImportText(e.target.value)} error={!!importError}
                helperText={importError || 'Copied from this page, or a *-config.js object.'} slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }} />
              <Stack direction="row" sx={{ gap: 1 }}><Button variant="outlined" onClick={applyImport}>Apply Config</Button><Button onClick={() => { setImportOpen(false); setImportError(''); }}>Cancel</Button></Stack>
            </>}
            <Typography variant="body2"><Link href={ZIP_URL}>Download the React component</Link> <Typography component="span" variant="body2" color="text.secondary">(zip). Paste copied configs into it.</Typography></Typography>
          </Section>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField label="Seed" type="number" value={state.seed} onChange={e => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 0) change({ seed: v }); }} slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }} fullWidth />
            <Tooltip title="Generate a new arrangement"><IconButton aria-label="Randomize seed" onClick={() => change({ seed: crypto.getRandomValues(new Uint32Array(1))[0] % 100000 })}><Icon name="refresh" /></IconButton></Tooltip>
          </Box>
        </Card>
      </Box>
    </Container>

    <Snackbar key={toast?.key} open={!!toast} autoHideDuration={toast?.severity === 'error' ? null : 5000} onClose={(_, reason) => { if (reason !== 'clickaway') setToast(null); }}>
      <Alert severity={toast?.severity || 'success'} onClose={() => setToast(null)}>{toast?.message}</Alert>
    </Snackbar>
  </>;
}
