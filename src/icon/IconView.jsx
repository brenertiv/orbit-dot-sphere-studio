import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, CardHeader, Checkbox, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControlLabel, MenuItem, Slider, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { Icon } from '../icons';
import { createOrbitIcon, iconFrame } from '../../exports/orbiticon/orbitIcon.js';
import { createZip } from '../../dist/export.js';
import { parseConfig } from '../dotfield/config';
import { saveFile } from '../save';
import { animatedSVG, colorsFromTheme, defaults, directions, fromConfig, guide, ranges, staticSVG, styles, toConfig, usage } from './config';
import { encodeGIF, iconPalette, indexPixels } from './gif';

const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const two = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
function formatValue(id, v) {
  const { unit, integer } = ranges[id];
  if (unit === 'deg') return whole.format(v) + '°';
  if (unit === 's') return two.format(v) + ' s';
  if (unit === 'px') return two.format(v) + ' px';
  if (unit === 'x') return two.format(v) + '×';
  if (unit === '%') return percent.format(v);
  return integer ? whole.format(v) : two.format(v);
}
const SIZES = [96, 64, 48, 32];
const BACKGROUNDS = [
  ['transparent-light', 'Transparent, for light surfaces'], ['transparent-dark', 'Transparent, for dark surfaces'],
  ['light-page', 'Light page (background.level0)'], ['light-card', 'Light card (background.level2)'],
  ['dark-page', 'Dark page (background.level0)'], ['dark-card', 'Dark card (background.level2)'],
];

/** A live OrbitIcon on a canvas, through the same renderer the exported component uses. */
function LiveIcon({ config, size, scheme, state, paused, label }) {
  const ref = useRef(), inst = useRef();
  useEffect(() => {
    inst.current = createOrbitIcon(ref.current, config, { state, theme: scheme, paused });
    return () => inst.current.destroy();
  }, []);
  useEffect(() => inst.current?.setConfig(config), [config]);
  useEffect(() => inst.current?.setState(state), [state]);
  useEffect(() => inst.current?.setTheme(scheme), [scheme]);
  useEffect(() => inst.current?.setPaused(paused), [paused]);
  return <canvas ref={ref} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} style={{ display: 'block', width: size, height: size }} />;
}

function Hint({ children }) { return <Typography variant="caption" color="text.secondary">{children}</Typography>; }
function Range({ id, value, onChange, label }) {
  const r = ranges[id];
  return <Box>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography id={id + '-' + (label || '') + '-label'} variant="body2">{label || r.label}</Typography>
      <Typography component="output" variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatValue(id, value)}</Typography>
    </Stack>
    <Box sx={{ px: 1 }}><Slider aria-labelledby={id + '-' + (label || '') + '-label'} value={value} min={r.min} max={r.max} step={r.step} valueLabelDisplay="auto" valueLabelFormat={v => formatValue(id, v)} getAriaValueText={v => formatValue(id, v)} onChange={(_, v) => onChange(v)} /></Box>
    <Hint>{r.hint}</Hint>
  </Box>;
}
function Section({ title, children, defaultExpanded = false }) {
  return <Accordion defaultExpanded={defaultExpanded} elevation={0} disableGutters>
    <AccordionSummary expandIcon={<Icon name="expand_more" />}><Typography variant="h6" component="span">{title}</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={2}>{children}</Stack></AccordionDetails>
  </Accordion>;
}
function MotionControls({ name, motion, onChange }) {
  const set = patch => onChange({ ...motion, ...patch });
  return <>
    <TextField select fullWidth label="Ring motion" value={motion.style} onChange={e => set({ style: e.target.value })}>
      {styles.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
    </TextField>
    {motion.style === 'swing' && <Range id="amount" label={`${name} swing`} value={motion.amount} onChange={v => set({ amount: v })} />}
    {motion.style === 'spin' && <Range id="turns" label={`${name} turns per loop`} value={motion.turns} onChange={v => set({ turns: v })} />}
    {motion.style !== 'still' && <TextField select fullWidth label="Ring direction" value={motion.direction} onChange={e => set({ direction: e.target.value })}>
      {directions.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
    </TextField>}
    <Range id="drift" label={`${name} dot drift`} value={motion.drift} onChange={v => set({ drift: v })} />
  </>;
}

/** Render frames of one state to a canvas and return RGBA data for each. */
function rasterFrames(cfg, size, scale, tones, background, blend, fps) {
  const c = document.createElement('canvas'); c.width = c.height = size * scale;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const count = Math.round(cfg.loop * fps), out = [];
  for (let f = 0; f < count; f++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height); } else ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    for (const d of iconFrame(cfg, size, (f / count) * cfg.loop, blend).sort((a, b) => a.depth - b.depth)) {
      ctx.globalAlpha = d.opacity; ctx.fillStyle = tones[d.tone];
      ctx.beginPath(); ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    out.push(ctx.getImageData(0, 0, c.width, c.height).data);
  }
  return { frames: out, canvas: c, count };
}

/**
 * Icon: the small animated Orbit avatar for the chat. Rendered inside the Kilowatt Studio shell (src/Studio.jsx);
 * `active` is false while another tool's tab is showing, which pauses every preview.
 */
export function IconView({ active = true }) {
  const theme = useTheme();
  const colors = useMemo(() => colorsFromTheme(theme), [theme]);
  const { mode, systemMode } = useColorScheme(), editorMode = (mode === 'system' ? systemMode : mode) || 'light';
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [s, setS] = useState(defaults);
  const [state, setState] = useState('idle');
  const [view, setView] = useState(null), shown = view || editorMode;
  const [paused, setPaused] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSize, setExportSize] = useState(32), [retina, setRetina] = useState(true), [background, setBackground] = useState('light-card');
  const [busy, setBusy] = useState(null);
  const [importOpen, setImportOpen] = useState(false), [importText, setImportText] = useState(''), [importError, setImportError] = useState('');
  const [toast, setToast] = useState(null);
  const config = useMemo(() => toConfig(s, colors), [s, colors]);
  const configText = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const change = patch => setS(v => ({ ...v, ...patch }));
  const notify = (message, severity = 'success') => setToast({ message, severity, key: Date.now() });
  const schemes = shown === 'compare' ? ['light', 'dark'] : [shown];
  const still = paused || !active;
  const range = id => <Range key={id} id={id} value={s[id]} onChange={v => change({ [id]: v })} />;

  // Export settings resolved to colours.
  const [bgScheme, bgKind] = background.split('-');
  const exportScheme = bgScheme === 'transparent' ? bgKind : bgScheme;
  const exportTones = colors[exportScheme].tones;
  const exportBackground = bgScheme === 'transparent' ? null : colors[bgScheme].surfaces[bgKind];
  const fileBase = `enertiv-orbit-icon-${exportSize}`;

  async function run(key, task) {
    setBusy(key);
    try { await task(); } catch (error) { if (error?.code !== 'declined') notify(error?.message || 'That export didn’t finish.', 'error'); }
    finally { setBusy(null); }
  }
  const exportReact = () => run('react', async () => {
    const sources = Object.fromEntries(await Promise.all(['orbitIcon.js', 'OrbitIcon.jsx', 'OrbitIcon.d.ts'].map(async name => {
      const res = await fetch(new URL('./orbit-icon/' + name, import.meta.url));
      if (!res.ok) throw new Error('Couldn’t load the component files. Reload and try again.');
      return [name, await res.text()];
    })));
    const files = { ...sources, 'orbit-icon-config.js': '// Generated by Kilowatt Studio (Icon).\nexport default ' + JSON.stringify(config, null, 2) + ';\n', 'README.md': guide };
    await saveFile('orbit-icon-react.zip', createZip(files, 'orbit-icon'), 'application/zip');
    notify('React component saved.');
  });
  const exportSVG = which => run('svg-' + which, async () => {
    const svg = animatedSVG(config, exportSize, exportTones, exportBackground, which === 'thinking' ? 1 : 0);
    await saveFile(`${fileBase}-${which}.svg`, svg, 'image/svg+xml');
    notify(`Animated ${which} SVG saved.`);
  });
  const exportGIF = which => run('gif-' + which, async () => {
    if (!exportBackground) throw new Error('GIFs can’t fade dots into a transparent background. Choose a light or dark surface.');
    await new Promise(r => setTimeout(r, 30)); // let the button show its busy state
    const scale = retina ? 2 : 1, px = exportSize * scale;
    const { frames } = rasterFrames(config, exportSize, scale, exportTones, exportBackground, which === 'thinking' ? 1 : 0, 25);
    const palette = iconPalette(exportBackground, exportTones), cache = new Map();
    const gif = encodeGIF(frames.map(f => indexPixels(f, palette, cache)), px, px, palette, 4);
    await saveFile(`${fileBase}${retina ? '@2x' : ''}-${which}.gif`, new Blob([gif], { type: 'image/gif' }), 'image/gif');
    notify(`${which === 'thinking' ? 'Thinking' : 'Idle'} GIF saved.`);
  });
  const exportStill = kind => run('still-' + kind, async () => {
    if (kind === 'svg') { await saveFile(`${fileBase}-still.svg`, staticSVG(config, exportSize, exportTones, exportBackground), 'image/svg+xml'); }
    else {
      const scale = retina ? 2 : 1, { canvas } = rasterFrames({ ...config, loop: 1 / 25 }, exportSize, scale, exportTones, exportBackground, 0, 25);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      await saveFile(`${fileBase}${retina ? '@2x' : ''}-still.png`, blob, 'image/png');
    }
    notify('Still image saved.');
  });
  async function copyConfig() {
    try { await navigator.clipboard.writeText(configText); notify('Config copied.'); }
    catch { notify('Copy isn’t available here. Open Config and copy it with your keyboard.', 'error'); }
  }
  function applyImport() {
    try { setS(fromConfig(parseConfig(importText), s)); setImportError(''); setImportOpen(false); notify('Config applied.'); }
    catch (error) { setImportError(error instanceof SyntaxError ? 'Couldn’t read that config. Check that it was pasted in full.' : error.message); }
  }

  return <>
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={t => ({ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: t.spacing(44) + ' minmax(0,1fr)' }, gridTemplateAreas: { xs: '"preview" "controls"', md: '"controls preview"' }, gap: 3, alignItems: 'start' })}>
        <Card variant="outlined" component="section" aria-label="Icon preview" sx={{ gridArea: 'preview', minWidth: 0, position: { md: 'sticky' }, top: 16 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" component="h1">Preview</Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
              <ToggleButtonGroup exclusive value={state} onChange={(_, v) => { if (v) setState(v); }} aria-label="Icon state">
                <ToggleButton value="idle">Idle</ToggleButton><ToggleButton value="thinking">Thinking</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup exclusive value={shown} onChange={(_, v) => { if (v) setView(v); }} aria-label="Preview surface">
                <ToggleButton value="light">Light</ToggleButton><ToggleButton value="dark">Dark</ToggleButton><ToggleButton value="compare">Compare</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex' }}>
            {['light', 'dark'].map(scheme => {
              const p = theme.colorSchemes[scheme].palette;
              if (!schemes.includes(scheme)) return null;
              return <Stack key={scheme} spacing={3} sx={{ flex: 1, minWidth: 0, p: 3, bgcolor: p.background.level0, color: p.text.secondary, alignItems: 'center' }}>
                {schemes.length > 1 && <Typography variant="caption" sx={{ alignSelf: 'flex-start' }}>{scheme === 'dark' ? 'Dark surface' : 'Light surface'}</Typography>}
                <LiveIcon config={config} size={192} scheme={scheme} state={state} paused={still} label={`Orbit icon, ${state}, on the ${scheme} surface, shown at 192 pixels`} />
                <Stack direction="row" useFlexGap sx={{ alignItems: 'flex-end', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {SIZES.map(px => <Stack key={px} spacing={1} sx={{ alignItems: 'center' }}>
                    <LiveIcon config={config} size={px} scheme={scheme} state={state} paused={still} />
                    <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>{whole.format(px)}&nbsp;px</Typography>
                  </Stack>)}
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'flex-start', alignSelf: 'stretch', p: 2, borderRadius: 2, bgcolor: p.background.level2, color: p.text.primary }}>
                  <Box sx={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}><LiveIcon config={config} size={32} scheme={scheme} state={state} paused={still} /></Box>
                  <Typography variant="body2" sx={{ pt: 0.75 }}>{state === 'thinking' ? 'Looking at Q3 utility spend across your buildings…' : 'Your Q3 utility spend is 4% under budget. Want the breakdown by building?'}</Typography>
                </Stack>
              </Stack>;
            })}
          </Box>
          <CardContent>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">{whole.format(s.dots * 3)} dots · {state === 'thinking' ? 'Thinking' : 'Idle'} · {two.format(s.loop)}&nbsp;s loop</Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                {!reduced && <Button variant="outlined" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Resume animation' : 'Pause animation'}>{paused ? 'Resume' : 'Pause'}</Button>}
                <Button variant="outlined" startIcon={<Icon name="content_copy" />} onClick={copyConfig}>Copy Config</Button>
                <Button variant="contained" startIcon={<Icon name="download" />} onClick={() => setExportOpen(true)}>Export</Button>
              </Stack>
            </Stack>
            {reduced && <Hint>Static preview · reduced motion is on</Hint>}
          </CardContent>
        </Card>

        <Card variant="outlined" component="aside" aria-label="Icon settings" sx={{ gridArea: 'controls', minWidth: 0 }}>
          <CardHeader title="Design" slotProps={{ title: { variant: 'h6', component: 'h2' } }} action={<Button startIcon={<Icon name="restart_alt" />} onClick={() => { setS(defaults); notify('Settings reset.'); }}>Reset</Button>} />
          <Section title="Structure" defaultExpanded>{['dots', 'tilt0', 'tilt1', 'tilt2', 'stagger'].map(range)}</Section>
          <Section title="Idle" defaultExpanded><MotionControls name="Idle" motion={s.idle} onChange={m => change({ idle: m })} /></Section>
          <Section title="Thinking"><MotionControls name="Thinking" motion={s.thinking} onChange={m => change({ thinking: m })} /></Section>
          <Section title="Timing">{['loop', 'blend'].map(range)}</Section>
          <Section title="Dots" defaultExpanded>
            {['size', 'left', 'right', 'minPx', 'depthFade'].map(range)}
            <FormControlLabel control={<Checkbox checked={s.noOverlap} onChange={e => change({ noOverlap: e.target.checked })} />} label="Shrink dots that would overlap" />
            <Hint>Size follows each dot’s position on screen, small at the left and large at the right. Depth sets tone and fade. Colours come from chart.sequential.</Hint>
          </Section>
          <Section title="Config">
            <Box component="pre" tabIndex={0} aria-label="Config" sx={{ m: 0, p: 2, borderRadius: 1, bgcolor: 'background.level0', overflow: 'auto', maxHeight: t => t.spacing(40), typography: 'body2', fontFamily: 'monospace', whiteSpace: 'pre' }}><code>{configText}</code></Box>
            {!importOpen ? <Box><Button startIcon={<Icon name="edit" />} onClick={() => setImportOpen(true)}>Import Config</Button></Box> : <>
              <TextField label="Paste a config" multiline minRows={5} fullWidth value={importText} onChange={e => setImportText(e.target.value)} error={!!importError}
                helperText={importError || 'Copied from this tab, or an orbit-icon-config.js object.'} slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }} />
              <Stack direction="row" sx={{ gap: 1 }}><Button variant="outlined" onClick={applyImport}>Apply Config</Button><Button onClick={() => { setImportOpen(false); setImportError(''); }}>Cancel</Button></Stack>
            </>}
          </Section>
        </Card>
      </Box>
    </Container>

    <Dialog open={exportOpen} onClose={() => setExportOpen(false)} fullWidth maxWidth="sm" aria-labelledby="icon-export-heading">
      <DialogTitle id="icon-export-heading">Export Orbit Icon</DialogTitle>
      <DialogContent>
        <DialogContentText>Use the React component in the app. The SVG and GIF files are for places that can’t run code, such as Slack, email and slides.</DialogContentText>
        <Stack spacing={2} sx={{ my: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField select fullWidth label="Size" value={exportSize} onChange={e => setExportSize(Number(e.target.value))}>
              {SIZES.map(px => <MenuItem key={px} value={px}>{whole.format(px)} × {whole.format(px)} px</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Background" value={background} onChange={e => setBackground(e.target.value)}>
              {BACKGROUNDS.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
            </TextField>
          </Stack>
          <FormControlLabel control={<Checkbox checked={retina} onChange={e => setRetina(e.target.checked)} />} label="2× pixels for high-resolution screens (GIF and PNG)" />
        </Stack>
        <Stack divider={<Divider />} spacing={2}>
          <Box>
            <Typography variant="subtitle2" component="h3">React Component</Typography>
            <Hint>OrbitIcon with an idle/thinking state prop, both themes and this design. Size, background and colours are set where you use it.</Hint>
            <Box component="pre" tabIndex={0} sx={{ m: 0, my: 1, p: 2, borderRadius: 1, bgcolor: 'background.level0', overflow: 'auto', typography: 'body2', fontFamily: 'monospace', whiteSpace: 'pre' }}><code>{usage}</code></Box>
            <Button variant="contained" loading={busy === 'react'} startIcon={<Icon name="download" />} onClick={exportReact}>Download React Component</Button>
          </Box>
          <Box>
            <Typography variant="subtitle2" component="h3">Animated SVG</Typography>
            <Hint>Plays as an ordinary image, sharp at any size. One file per state.</Hint>
            <Stack direction="row" sx={{ gap: 1, mt: 1 }}><Button variant="outlined" loading={busy === 'svg-idle'} onClick={() => exportSVG('idle')}>Idle SVG</Button><Button variant="outlined" loading={busy === 'svg-thinking'} onClick={() => exportSVG('thinking')}>Thinking SVG</Button></Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" component="h3">Animated GIF</Typography>
            <Hint>For tools that don’t play SVG. Needs a solid background, because GIF can’t fade dots into transparency.</Hint>
            {!exportBackground && <Alert severity="info" sx={{ mt: 1 }}>Choose a light or dark surface under Background to export a GIF.</Alert>}
            <Stack direction="row" sx={{ gap: 1, mt: 1 }}><Button variant="outlined" disabled={!exportBackground} loading={busy === 'gif-idle'} onClick={() => exportGIF('idle')}>Idle GIF</Button><Button variant="outlined" disabled={!exportBackground} loading={busy === 'gif-thinking'} onClick={() => exportGIF('thinking')}>Thinking GIF</Button></Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" component="h3">Still Image</Typography>
            <Hint>The first idle frame, for when motion is off and for app icons.</Hint>
            <Stack direction="row" sx={{ gap: 1, mt: 1 }}><Button variant="outlined" loading={busy === 'still-png'} onClick={() => exportStill('png')}>PNG</Button><Button variant="outlined" loading={busy === 'still-svg'} onClick={() => exportStill('svg')}>SVG</Button></Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => setExportOpen(false)}>Close</Button></DialogActions>
    </Dialog>

    <Snackbar key={toast?.key} open={!!toast} autoHideDuration={toast?.severity === 'error' ? null : 5000} onClose={(_, reason) => { if (reason !== 'clickaway') setToast(null); }}>
      <Alert severity={toast?.severity || 'success'} onClose={() => setToast(null)}>{toast?.message}</Alert>
    </Snackbar>
  </>;
}
