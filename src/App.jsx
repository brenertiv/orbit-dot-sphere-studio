import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardActionArea, CardContent, CardHeader, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, MenuItem, Snackbar, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Icon } from './icons';
import { ExportDialog } from './ExportDialog';
import { createEditorStore, PRESET_KEY } from './editor-state';
import { ranges, selects } from './fields';
import { presets, palettes, shapes, prepareDesign, motionFromSettings, themesFromSettings } from '../dist/geometry.js';
import { createSphere } from '../dist/runtime/sphere.js';
import { usage, measure, exportFiles, configSource, configFile, createZip, download } from '../dist/export.js';

const percent = new Set(['shapeRadius','tubeThickness','tubeDepth','lineOpacity','deformation','pulse','depth','breathing','waveHeight','sizeVariation']);
const speeds = new Set(['speed','driftSpeed','pulseSpeed','breathSpeed','waveSpeed']);
const ratios = new Set(['shapeWidth','shapeHeight','shapeDepth']);
const geometryKeys=['shape','shapeRadius','shapeWidth','shapeHeight','shapeDepth','tubeThickness','tubeDepth','distribution','pattern','count','sizeVariation','connections','seed'];
const number = new Intl.NumberFormat(undefined,{maximumFractionDigits:2});
function formatValue(id,value) {
  if(percent.has(id))return new Intl.NumberFormat(undefined,{style:'percent',maximumFractionDigits:0}).format(value);
  if(speeds.has(id)||ratios.has(id))return new Intl.NumberFormat(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+(ratios.has(id)?'×':'');
  if(id==='twist')return number.format(Math.round(value*180/Math.PI))+'°';
  return number.format(value);
}
const thumbnails=Object.fromEntries(Object.entries(presets).map(([id,preset])=>[id,prepareDesign({...preset,count:150,size:2})]));

function Canvas({design,theme,paused=false,instanceRef,onMetrics,canvasRef}) {
  const local=useRef(), instance=useRef(), metrics=useRef(onMetrics);metrics.current=onMetrics;
  useEffect(()=>{
    instance.current=createSphere(local.current,design,{theme,paused,onMetrics:m=>metrics.current?.(m)});
    if(instanceRef)instanceRef.current=instance.current;
    if(canvasRef)canvasRef.current=local.current;
    return()=>{instance.current.destroy();if(instanceRef)instanceRef.current=null;if(canvasRef)canvasRef.current=null;};
  },[]);
  useEffect(()=>instance.current?.update(design,{theme,paused}),[design,theme,paused]);
  return <canvas ref={local} aria-hidden="true" style={{display:'block',width:'100%',height:'100%',pointerEvents:'none'}} />;
}
function Hint({children}) {return <Typography variant="caption" color="text.secondary">{children}</Typography>;}
function Range({id,settings,change}) {
  const {label,min,max,step}=ranges[id];
  return <Box>
    <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:1}}>
      <Typography id={id+'-label'} variant="body2">{label}</Typography>
      <Typography component="output" variant="caption" color="text.secondary" sx={{fontVariantNumeric:'tabular-nums'}}>{formatValue(id,settings[id])}</Typography>
    </Stack>
    <Box sx={{px:1}}><Slider aria-labelledby={id+'-label'} value={settings[id]} min={min} max={max} step={step} valueLabelDisplay="auto" valueLabelFormat={v=>formatValue(id,v)} getAriaValueText={v=>formatValue(id,v)} onChange={(_,v)=>change({[id]:v})} /></Box>
  </Box>;
}
function SelectField({id,settings,change}) {
  const {label,options}=selects[id];
  return <TextField id={id} select fullWidth label={label} value={String(settings[id])} onChange={e=>change({[id]:id==='direction'?Number(e.target.value):e.target.value})}>
    {options.map(([value,text])=><MenuItem key={value} value={value}>{text}</MenuItem>)}
  </TextField>;
}
function ControlSection({title,children,defaultExpanded=false,expanded,onChange}) {
  return <Accordion defaultExpanded={defaultExpanded} expanded={expanded} onChange={onChange} elevation={0} disableGutters>
    <AccordionSummary expandIcon={<Icon name="expand_more" />}><Typography variant="h6" component="span">{title}</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={2}>{children}</Stack></AccordionDetails>
  </Accordion>;
}
function PreviewPane({appearance,design,paused,renderer,canvas,onMetrics,visible}) {
  const theme=useTheme(), colors=theme.colorSchemes[appearance].palette;
  return <Box sx={{display:visible?'flex':'none',flexDirection:'column',flex:1,minWidth:0,bgcolor:colors.background.level0,color:colors.text.secondary}}>
    <Typography variant="caption" sx={{px:2,pt:2}}>{appearance==='dark'?'Dark appearance':'Light appearance'}</Typography>
    <Box sx={t=>({height:{xs:t.spacing(36),md:t.spacing(54)},minWidth:0})}>
      <Canvas design={design} theme={appearance} paused={paused} instanceRef={renderer} canvasRef={canvas} onMetrics={onMetrics}/>
    </Box>
  </Box>;
}
function PresetCard({id,preset,active,onClick}) {
  const theme=useTheme();
  return <Card variant="outlined" sx={{minWidth:0,...(active?{borderColor:'control.focus'}:{})}}>
    <CardActionArea aria-label={preset.name+' preset'} aria-pressed={active} onClick={onClick}>
      <CardContent sx={{display:'flex',alignItems:'center',gap:2}}>
        <Box sx={t=>({width:t.spacing(8),height:t.spacing(8),flexShrink:0,borderRadius:1,overflow:'hidden',bgcolor:theme.colorSchemes.dark.palette.background.level0})}><Canvas design={thumbnails[id]} theme="dark" paused /></Box>
        <Box sx={{minWidth:0,flex:1}}><Typography variant="body1">{preset.name}</Typography></Box>
        {active&&<Icon name="check" color="secondary"/>}
      </CardContent>
    </CardActionArea>
  </Card>;
}

/** Orbit, the dot sphere editor. Rendered inside the Kilowatt Studio shell (src/Studio.jsx), which owns the app bar and theme toggle. */
export function OrbitView() {
  const [store]=useState(()=>createEditorStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}));
  const state=useSyncExternalStore(store.subscribe,store.getSnapshot), {settings,selected}=state;
  const item=state.library.items.find(p=>p.id===selected), selectedName=item?.name || presets[selected]?.name || 'Current design';
  const dirty=item && JSON.stringify(item.settings)!==JSON.stringify(settings);
  const reduced=useMediaQuery('(prefers-reduced-motion: reduce)');
  const [paused,setPaused]=useState(false),[view,setView]=useState('dark'),[drawMs,setDrawMs]=useState(null);
  const [toast,setToast]=useState(null),[exportOpen,setExportOpen]=useState(false),[busy,setBusy]=useState(false),[size,setSize]=useState(null);
  const [presetDialog,setPresetDialog]=useState(null),[name,setName]=useState(''),[nameError,setNameError]=useState('');
  const [waveOpen,setWaveOpen]=useState(false),[seed,setSeed]=useState(String(settings.seed)),[seedError,setSeedError]=useState('');
  const [geometry,setGeometry]=useState(()=>prepareDesign(settings));
  const dark=useRef(),light=useRef(),darkCanvas=useRef(),lightCanvas=useRef(),nameInput=useRef(),previousView=useRef(view);
  const key=JSON.stringify(geometryKeys.map(id=>settings[id]));
  useEffect(()=>{const timer=setTimeout(()=>setGeometry(prepareDesign(settings)),75);return()=>clearTimeout(timer);},[key]);
  const design=useMemo(()=>({...geometry,appearance:{size:settings.size,lineOpacity:settings.lineOpacity,depth:settings.depth},motion:motionFromSettings(settings),themes:themesFromSettings(settings)}),[geometry,settings]);
  useEffect(()=>{let current=true;const timer=setTimeout(()=>measure(design).then(result=>{if(current)setSize(result);}).catch(()=>{if(current)setSize(null);}),220);return()=>{current=false;clearTimeout(timer);};},[design]);
  useEffect(()=>{setSeed(String(settings.seed));setSeedError('');},[settings.seed]);
  useEffect(()=>setWaveOpen(settings.waveHeight>0 || settings.twist!==0),[selected]);
  useEffect(()=>{function reload(e){if(e.key!==PRESET_KEY&&e.key!==null)return;try{store.reload();}catch(error){notify(error.message,'error');}}window.addEventListener('storage',reload);return()=>window.removeEventListener('storage',reload);},[store]);
  useLayoutEffect(()=>{
    const source=previousView.current==='light'?light.current:dark.current;
    if(source){const phase=source.getState();dark.current?.seek(phase);light.current?.seek(phase);}
    previousView.current=view;
  },[view]);
  function notify(message,severity='success'){setToast({message,severity,key:Date.now()});}
  function attempt(action,message){try{action();if(message)notify(message);}catch(error){notify(error.message,'error');}}
  function change(patch){store.change(patch);}
  function openPreset(mode){setName(mode==='rename'?selectedName:'');setNameError('');setPresetDialog(mode);}
  function savePreset(e){e.preventDefault();try{presetDialog==='rename'?store.rename(name):store.save(name);setPresetDialog(null);notify(presetDialog==='rename'?'Preset renamed.':'Preset saved in this browser.');}catch(error){setNameError(error.message);nameInput.current?.focus();}}
  function commitSeed(){const value=Number(seed);if(!seed.trim()||!Number.isInteger(value)||value<0||value>4294967295){setSeedError('Use a whole number from 0 to 4294967295.');return;}change({seed:value});setSeedError('');}
  async function exportReact(){setBusy(true);try{const files=await exportFiles(prepareDesign(settings));download(createZip(files),'orbit-react.zip');notify('React component downloaded.');}catch(error){notify(error.message,'error');}finally{setBusy(false);}}
  function downloadConfig(){try{download(new Blob([configSource(prepareDesign(settings))],{type:'text/javascript'}),configTarget.file);notify('Config downloaded.');}catch(error){notify(error.message,'error');}}
  function savePNG(){const target=view==='light'?lightCanvas:darkCanvas,renderer=view==='light'?light:dark;renderer.current?.update(prepareDesign(settings),{paused});target.current?.toBlob(blob=>{if(blob){download(blob,'orbit-'+(view==='light'?'light':'dark')+'.png');notify(view==='compare'?'Dark preview saved as transparent PNG.':'Transparent PNG saved.');}else notify('Could not save the preview.','error');});}
  const configTarget=configFile(selectedName);
  const range=id=><Range key={id} id={id} settings={settings} change={change}/>;
  const select=id=><SelectField key={id} id={id} settings={settings} change={change}/>;
  const measured=size?number.format(size.bytes/1024)+' KB'+(size.compressed?' gzipped':' uncompressed'):'Measuring…';
  const status=reduced?'Static preview':paused?'Paused':'Live preview';
  return <>
    <Container maxWidth="xl" sx={{py:3}}>
      {state.storageError&&<Alert severity="warning" sx={{mb:3}}>{state.storageError}</Alert>}
      <Box sx={t=>({display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',md:t.spacing(44)+' minmax(0,1fr)'},gridTemplateAreas:{xs:'"preview" "controls"',md:'"controls preview"'},gap:3,alignItems:'start'})}>
        <Stack component="section" aria-label="Object preview" spacing={3} sx={{gridArea:'preview',minWidth:0}}>
          <Card variant="outlined">
            <Box sx={{p:2,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:2}}>
              <Typography variant="h6" component="h1">{status}</Typography>
              <ToggleButtonGroup exclusive value={view} onChange={(_,value)=>{if(value)setView(value);}} aria-label="Preview appearance">
                <ToggleButton value="dark">Dark</ToggleButton><ToggleButton value="light">Light</ToggleButton><ToggleButton value="compare">Compare</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{display:'flex'}}>
              <PreviewPane appearance="dark" design={design} paused={paused} renderer={dark} canvas={darkCanvas} onMetrics={m=>setDrawMs(m.drawMs)} visible={view!=='light'}/>
              <PreviewPane appearance="light" design={design} paused={paused} renderer={light} canvas={lightCanvas} visible={view!=='dark'}/>
            </Box>
            <CardContent>
              <Stack direction="row" useFlexGap sx={{alignItems:"center",justifyContent:"space-between",flexWrap:'wrap',gap:2}}>
                <Typography variant="body2" sx={{overflowWrap:'anywhere',minWidth:0}}>{selectedName}</Typography>
                <Stack direction="row" useFlexGap sx={{flexWrap:'wrap',gap:1}}>
                  <Button onClick={savePNG}>Save PNG</Button>
                  {!reduced&&<Button variant="outlined" onClick={()=>setPaused(v=>!v)} aria-label={paused?'Play animation':'Pause animation'}>{paused?'Resume':'Pause'}</Button>}
                  <Button variant="contained" startIcon={<Icon name="download"/>} onClick={()=>setExportOpen(true)}>Export React</Button>
                </Stack>
              </Stack>
              {reduced&&<Typography variant="caption" color="text.secondary">Static preview · reduced motion enabled</Typography>}
              <Stack direction="row" useFlexGap sx={{justifyContent:"space-between",flexWrap:"wrap",gap:1,mt:1}}>
                <Hint>{number.format(design.points.length/3)} dots · {number.format(design.links.length/2)} connections</Hint>
                <Hint>{reduced?'No animation':paused?'Paused':drawMs===null?'Canvas 2D':number.format(drawMs)+' ms draw'} · Dependency-free runtime</Hint>
              </Stack>
            </CardContent>
          </Card>
          <Box>
            <Typography variant="h6" component="h2" sx={{mb:2}}>Presets</Typography>
            <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))'},gap:2}}>
              {Object.entries(presets).map(([id,preset])=><PresetCard key={id} id={id} preset={preset} active={id===selected} onClick={()=>attempt(()=>store.select(id))}/>)}
            </Box>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" useFlexGap sx={{justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:1,mb:1}}>
                <Typography variant="h6" component="h2">My Presets{state.library.items.length?' · '+number.format(state.library.items.length):''}</Typography>
                <Button variant="outlined" startIcon={<Icon name="add"/>} onClick={()=>openPreset('save')}>Save As New</Button>
              </Stack>
              <Typography variant="body2" color="text.secondary">Saved in this browser. Your edits stay as drafts when you switch.</Typography>
              {state.library.items.length===0?<Typography variant="body2" color="text.secondary" sx={{py:3}}>Save a design to keep it here.</Typography>:<Stack spacing={1} sx={{my:2}}>
                {state.library.items.map(p=><Button key={p.id} variant="outlined" aria-label={'Load '+p.name} aria-pressed={p.id===selected} onClick={()=>attempt(()=>store.select(p.id))} startIcon={<Icon name={p.id===selected?'check':'circle'}/>} sx={{justifyContent:'flex-start',textAlign:'start'}}>
                  <Box sx={{minWidth:0,overflowWrap:'anywhere'}}>{p.name}<Typography component="span" variant="caption" color="text.secondary" sx={{display:'block'}}>{shapes[p.settings.shape]} · {number.format(p.settings.count)} dots · {p.settings.colorMode==='single'?'Single color':palettes[p.settings.palette].name}</Typography></Box>
                </Button>)}
              </Stack>}
              {item&&<Stack direction="row" useFlexGap sx={{alignItems:"center",flexWrap:"wrap",gap:1}}>
                <Hint>{dirty?'Draft changes · saved version kept':'Saved'}</Hint><Button disabled={!dirty} onClick={()=>attempt(()=>store.update(),'Saved preset updated.')}>Update Preset</Button><Button onClick={()=>openPreset('rename')}>Rename</Button><Button onClick={()=>attempt(()=>store.remove(),'Preset removed. Use Undo Removal to restore it.')}>Remove</Button>
              </Stack>}
              {!!state.library.trash.length&&<Button startIcon={<Icon name="history"/>} onClick={()=>attempt(()=>store.undo(),'Preset restored.')}>Undo Removal</Button>}
              <Typography variant="caption" color="text.secondary" sx={{display:'block',mt:1}}>Presets don’t sync between devices. Clearing site data removes them.</Typography>
            </CardContent>
          </Card>
        </Stack>
        <Card variant="outlined" component="aside" aria-label="Object design controls" sx={{gridArea:'controls',minWidth:0,position:{md:'sticky'},top:2,maxHeight:{md:'calc(100dvh - 32px)'},overflowY:{md:'auto'}}}>
          <CardHeader title="Design" slotProps={{title:{variant:'h6',component:'h2'}}} action={<Button startIcon={<Icon name="restart_alt"/>} onClick={()=>attempt(()=>store.reset(),'Saved preset restored.')}>Reset</Button>}/>
          <ControlSection title="Structure" defaultExpanded>
            {select('shape')}{range('shapeRadius')}
            {settings.shape==='ellipsoid'&&<>{['shapeWidth','shapeHeight','shapeDepth'].map(range)}<Hint>Relative proportions. The longest axis fits the outer radius.</Hint></>}
            {settings.shape==='torus'&&<>{['tubeThickness','tubeDepth'].map(range)}<Hint>A thicker tube makes a smaller hole. Lower depth flattens the ring.</Hint></>}
            {select('distribution')}{select('pattern')}
            {['count','size','sizeVariation','connections','lineOpacity'].map(range)}
          </ControlSection>
          <ControlSection title="Motion">
            {reduced&&<Alert severity="info">Motion settings are saved, but this preview stays still while reduced motion is enabled.</Alert>}
            {['speed','deformation','pulse'].map(range)}{select('axis')}{select('direction')}
            {['driftSpeed','pulseSpeed','breathing','breathSpeed'].map(range)}
          </ControlSection>
          <ControlSection title="Surface Waves & Twist" expanded={waveOpen} onChange={(_,value)=>setWaveOpen(value)}>
            {['waveHeight','waveFrequency','waveSpeed','twist'].map(range)}<Hint>Low frequency makes broad folds. Negative travel reverses the waves. Zero height turns waves off.</Hint>
          </ControlSection>
          <ControlSection title="Appearance" defaultExpanded>
            {select('colorMode')}
            {settings.colorMode==='palette'?<Box>
              <Typography variant="body2" sx={{mb:1}}>Color palette · {palettes[settings.palette].name}</Typography>
              <Box role="group" aria-label="Color palettes" sx={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:1}}>
                {Object.entries(palettes).map(([id,p])=><Button key={id} variant="outlined" aria-label={p.name+' palette'} aria-pressed={settings.palette===id} onClick={()=>change({palette:id})} sx={{flexDirection:'column',gap:1,py:1,...(settings.palette===id?{borderColor:'control.focus',bgcolor:'action.selected'}:{})}}>
                  <Box aria-hidden="true" sx={{display:'flex',gap:0.5}}>{p.dark.map((color,i)=><Box key={i} sx={t=>({width:t.spacing(1),height:t.spacing(2),borderRadius:0.5,backgroundColor:color})}/>)}</Box>{p.name}
                </Button>)}
              </Box>
            </Box>:<>{['darkColor','lightColor'].map(id=><TextField key={id} label={id==='darkColor'?'On dark':'On light'} type="color" value={settings[id]} onChange={e=>change({[id]:e.target.value})} fullWidth slotProps={{inputLabel:{shrink:true}}}/>)}</>}
            {range('depth')}<Hint>Each palette includes light and dark colors.</Hint>
          </ControlSection>
          <Box sx={{p:2,display:'flex',alignItems:'flex-start',gap:1}}>
            <TextField label="Seed" type="number" value={seed} error={!!seedError} helperText={seedError} onChange={e=>setSeed(e.target.value)} onBlur={commitSeed} onKeyDown={e=>{if(e.key==='Enter')commitSeed();}} slotProps={{htmlInput:{min:0,max:4294967295,step:1,inputMode:'numeric'}}} fullWidth/>
            <Tooltip title="Generate a new arrangement"><IconButton aria-label="Randomize seed" onClick={()=>change({seed:crypto.getRandomValues(new Uint32Array(1))[0]})}><Icon name="refresh"/></IconButton></Tooltip>
          </Box>
        </Card>
      </Box>
    </Container>
    <Dialog open={presetDialog!==null} onClose={()=>setPresetDialog(null)} fullWidth maxWidth="sm" aria-labelledby="preset-heading">
      <Box component="form" onSubmit={savePreset}>
        <DialogTitle id="preset-heading">{presetDialog==='rename'?'Rename Preset':'Save Preset'}</DialogTitle>
        <DialogContent><DialogContentText sx={{mb:3}}>{presetDialog==='rename'?'The saved design and draft changes stay the same.':'Keep the current shape, motion, and both color themes as a named preset.'}</DialogContentText>
          <TextField autoFocus inputRef={nameInput} required fullWidth label="Preset name" value={name} onChange={e=>setName(e.target.value)} error={!!nameError} helperText={nameError} slotProps={{htmlInput:{maxLength:60,autoComplete:'off'}}}/>
        </DialogContent>
        <DialogActions><Button onClick={()=>setPresetDialog(null)}>Cancel</Button><Button variant="contained" type="submit">{presetDialog==='rename'?'Rename Preset':'Save Preset'}</Button></DialogActions>
      </Box>
    </Dialog>
    <ExportDialog open={exportOpen} onClose={()=>setExportOpen(false)} busy={busy} onDownloadComponent={exportReact} onDownloadConfig={downloadConfig} onError={message=>notify(message,'error')}
      component={{intro:'Drop these files into your React app. The editor and design-system dependencies stay here.',chips:['Light + dark','Transparent canvas','React 18+'],
        files:[['DotSphere.js + types','React wrapper'],['sphere.js','Canvas runtime'],['sphere-config.js','Prepared design'],['README.md','Integration guide']],
        usage,caption:measured+' for the renderer and prepared design, excluding React. The ZIP contains readable source and documentation.'}}
      config={{intro:'Already installed the component? Add this design as another config. Save it in your orbit folder next to sphere-config.js; the runtime and wrapper stay the same.',
        files:[[configTarget.file,'Prepared design · light + dark']],usage:configTarget.usage,
        caption:'Each config carries its own geometry, motion, and both themes, so several designs can share one installed component.'}}/>
    <Snackbar key={toast?.key} open={!!toast} autoHideDuration={toast?.severity==='error'?null:5000} onClose={(_,reason)=>{if(reason!=='clickaway')setToast(null);}}>
      <Alert severity={toast?.severity||'success'} onClose={()=>setToast(null)}>{toast?.message}</Alert>
    </Snackbar>
  </>;
}
