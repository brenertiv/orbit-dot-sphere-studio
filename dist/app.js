import { presets, palettes, prepareDesign, validateSettings, motionFromSettings } from './geometry.js';
import { createSphere } from './runtime/sphere.js';
import { usage, measure, exportFiles, createZip, download } from './export.js';

const $=id=>document.getElementById(id);
let settings=validateSettings(presets.reference),selected='reference',paused=false,view='dark',design,measurement,measureTimer,geometryTimer,toastTimer,revision=0;
let persistence=true;
try {const saved=JSON.parse(localStorage.getItem('orbit-design-v1')||'null');if(saved){settings=validateSettings(saved.settings);selected=Object.keys(presets).includes(saved.selected)?saved.selected:'reference';}}catch {persistence=false;}
design=prepareDesign(settings);
const dark=createSphere($('dark-canvas'),design,{theme:'dark',onMetrics:({drawMs})=>{$('render-stat').textContent=drawMs.toFixed(1)+' ms draw';}});
const light=createSphere($('light-canvas'),design,{theme:'light'});
const thumbnails=[];
function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function persist(){try{localStorage.setItem('orbit-design-v1',JSON.stringify({settings,selected}));}catch{if(persistence){persistence=false;notify('Autosave is unavailable. Use Save design to keep your work.');}}}
function updateStats(){ $('dots-stat').textContent=design.points.length/3;$('links-stat').textContent=design.links.length/2; }
function scheduleMeasure(){clearTimeout(measureTimer);const id=++revision;measureTimer=setTimeout(async()=>{try{const result=await measure(design);if(id!==revision)return;measurement=result;$('size-estimate').textContent=(result.bytes/1024).toFixed(1)+' KB';$('size-description').textContent=(result.compressed?'gzip':'uncompressed')+' · runtime + design';$('export-detail').textContent=(result.bytes/1024).toFixed(1)+' KB '+(result.compressed?'gzipped':'uncompressed')+' for the runtime and this design, excluding React. The ZIP contains readable source and documentation.';}catch{$('size-estimate').textContent='Size unavailable';}},220);}
function render(){dark.update(design,{paused});light.update(design,{paused});updateStats();scheduleMeasure();persist();}
function refreshGeometry(){clearTimeout(geometryTimer);design=prepareDesign(settings);render();}
function updateAppearance(){design={...design,appearance:{size:settings.size,lineOpacity:settings.lineOpacity,depth:settings.depth},motion:motionFromSettings(settings),themes:{dark:{colors:[...palettes[settings.palette].dark],line:'#8b9eab'},light:{colors:[...palettes[settings.palette].light],line:'#4d6574'}}};render();}
const rangeIds=['count','size','connections','lineOpacity','speed','deformation','pulse','depth','driftSpeed','pulseSpeed','breathing','breathSpeed'];
function updateRange(id){const input=$(id);input.value=settings[id];input.style.setProperty('--fill',((settings[id]-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');$(id+'-value').textContent=['lineOpacity','deformation','pulse','depth','breathing'].includes(id)?Math.round(settings[id]*100)+'%':['speed','driftSpeed','pulseSpeed','breathSpeed'].includes(id)?settings[id].toFixed(2):settings[id];}
function syncControls(){for(const id of rangeIds)updateRange(id);$('axis').value=settings.axis;$('direction').value=String(settings.direction);$('distribution').value=settings.distribution;$('seed').value=settings.seed;$('palette-name').textContent=palettes[settings.palette].name;document.querySelectorAll('[data-palette]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.palette===settings.palette)));document.querySelectorAll('[data-preset]').forEach(el=>{const active=el.dataset.preset===selected;el.setAttribute('aria-pressed',String(active));el.querySelector('.preset-check').hidden=!active;});$('stage-caption').textContent=presets[selected].name.toUpperCase()+' / '+String(Object.keys(presets).indexOf(selected)+1).padStart(3,'0');}
for(const id of rangeIds){$(id).addEventListener('input',()=>{settings[id]=Number($(id).value);updateRange(id);if(['count','connections'].includes(id)){clearTimeout(geometryTimer);geometryTimer=setTimeout(refreshGeometry,75);}else updateAppearance();});$(id).addEventListener('change',()=>{if(['count','connections'].includes(id))refreshGeometry();});}
for(const id of ['axis','direction'])$(id).addEventListener('change',()=>{settings[id]=id==='direction'?Number($(id).value):$(id).value;updateAppearance();});
$('distribution').addEventListener('change',()=>{settings.distribution=$('distribution').value;refreshGeometry();});
for(const [id,palette] of Object.entries(palettes)){const button=document.createElement('button');button.className='palette';button.dataset.palette=id;button.setAttribute('aria-label',palette.name+' palette');button.title=palette.name;for(const color of palette.dark){const swatch=document.createElement('i');swatch.style.background=color;button.append(swatch);}button.addEventListener('click',()=>{settings.palette=id;syncControls();updateAppearance();});$('palettes').append(button);}
for(const [id,preset] of Object.entries(presets)){
  const button=document.createElement('button');button.className='preset';button.dataset.preset=id;button.setAttribute('aria-label',preset.name+' preset');
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
  const text=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small'),check=document.createElement('span');title.textContent=preset.name;description.textContent=preset.subtitle;text.append(title,description);check.className='preset-check';check.textContent='✓';check.setAttribute('aria-hidden','true');button.append(canvas,text,check);$('presets').append(button);
  thumbnails.push(createSphere(canvas,prepareDesign({...preset,count:150,size:4}),{theme:'dark',paused:true}));
  button.addEventListener('click',()=>{selected=id;settings=validateSettings(preset);syncControls();refreshGeometry();});
}
$('seed').addEventListener('change',()=>{const value=Number($('seed').value);if(!Number.isInteger(value)||value<0||value>4294967295){$('seed').value=settings.seed;notify('Use a whole-number seed from 0 to 4294967295.');return;}settings.seed=value;refreshGeometry();});
$('randomize').addEventListener('click',()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];$('seed').value=settings.seed;refreshGeometry();});
$('reset').addEventListener('click',()=>{settings=validateSettings(presets[selected]);syncControls();refreshGeometry();notify('Preset restored.');});
document.querySelectorAll('[data-view]').forEach(button=>{if(button.tagName!=='BUTTON')return;button.addEventListener('click',()=>{const seconds=(view==='light'?light:dark).getState();view=button.dataset.view;$('stage').dataset.view=view;dark.seek(seconds);light.seek(seconds);document.querySelectorAll('button[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));});});
$('pause').addEventListener('click',()=>{paused=!paused;dark.update(null,{paused});light.update(null,{paused});$('pause-icon').textContent=paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Play animation':'Pause animation');$('pause').title=paused?'Play animation':'Pause animation';});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');function updateReduced(){ $('reduced-note').hidden=!reduced.matches;$('pause').hidden=reduced.matches;}reduced.addEventListener('change',updateReduced);updateReduced();
$('app-theme').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;$('app-theme').setAttribute('aria-label','Switch editor to '+(next==='light'?'dark':'light')+' mode');});
async function openExport(){refreshGeometry();$('export-dialog').showModal();try{await exportFiles(design);}catch(error){notify(error.message);}}
$('export-top').addEventListener('click',openExport);$('export-bottom').addEventListener('click',openExport);$('close-export').addEventListener('click',()=>$('export-dialog').close());
$('export-dialog').addEventListener('click',event=>{if(event.target===$('export-dialog')){const r=$('export-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('export-dialog').close();}});
$('usage-code').textContent=usage;
$('copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(usage);$('copy-code').textContent='Copied';setTimeout(()=>$('copy-code').textContent='Copy code',2000);}catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents($('usage-code'));selection.removeAllRanges();selection.addRange(range);notify('Code selected. Press ⌘C or Ctrl+C to copy.');}});
$('download').addEventListener('click',async()=>{$('download').disabled=true;try{refreshGeometry();const files=await exportFiles(design);download(createZip(files),'orbit-react.zip');notify('React component downloaded.');}catch(error){notify(error.message);}finally{$('download').disabled=false;}});
$('save-design').addEventListener('click',()=>{download(new Blob([JSON.stringify({format:'orbit-design',version:1,settings},null,2)],{type:'application/json'}),'orbit-design.json');notify('Editable design saved.');});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('Design file is too large. Choose an Orbit design JSON.');const json=JSON.parse(await file.text());if(json.format!=='orbit-design'||json.version!==1)throw new Error('Choose a design saved with Orbit’s Save design button.');settings=validateSettings(json.settings);selected='reference';syncControls();refreshGeometry();notify('Design imported.');}catch(error){notify(error.message||'Could not import this design.');}finally{event.target.value='';}});
$('snapshot').addEventListener('click',()=>{const canvas=$(view==='light'?'light-canvas':'dark-canvas');canvas.toBlob(blob=>{if(blob){download(blob,'orbit-'+(view==='light'?'light':'dark')+'.png');notify('Transparent PNG saved'+(view==='compare'?' from the dark preview.':'.'));}});});
window.addEventListener('pagehide',()=>{dark.destroy();light.destroy();thumbnails.forEach(instance=>instance.destroy());});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
syncControls();updateStats();scheduleMeasure();
