import { presets, palettes, prepareDesign, validateSettings, motionFromSettings, themesFromSettings } from './geometry.js';
import { createPresetLibrary, PRESET_KEY } from './preset-library.js';
import { createSphere } from './runtime/sphere.js';
import { usage, measure, exportFiles, createZip, download } from './export.js';

const $=id=>document.getElementById(id);
let settings=validateSettings(presets.reference),selected='reference',paused=false,view='dark',design,measurement,measureTimer,geometryTimer,toastTimer,revision=0;
let persistence=true,drafts={},libraryData={items:[],trash:[]},libraryError='';
const library=createPresetLibrary({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
try{libraryData=library.list();}catch(error){libraryError=error.message;}
function customPreset(id=selected){return libraryData.items.find(p=>p.id===id);}
function knownPreset(id){return Object.hasOwn(presets,id)||!!customPreset(id);}
function selectedSnapshot(){return customPreset()?.settings || presets[selected] || presets.reference;}
function selectedName(){return customPreset()?.name || presets[selected]?.name || 'Current design';}
try {const saved=JSON.parse(localStorage.getItem('orbit-design-v1')||'null');if(saved){settings=validateSettings(saved.settings);selected=knownPreset(saved.selected)?saved.selected:'reference';if(saved.drafts&&typeof saved.drafts==='object'){for(const [id,value] of Object.entries(saved.drafts)){if(knownPreset(id)){try{drafts[id]=validateSettings(value);}catch{}}}}}}catch {persistence=false;}
design=prepareDesign(settings);
const dark=createSphere($('dark-canvas'),design,{theme:'dark',onMetrics:({drawMs})=>{$('render-stat').textContent=drawMs.toFixed(1)+' ms draw';}});
const light=createSphere($('light-canvas'),design,{theme:'light'});
const thumbnails=[];
function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function persist(){drafts[selected]=validateSettings(settings);try{localStorage.setItem('orbit-design-v1',JSON.stringify({settings,selected,drafts}));}catch{if(persistence){persistence=false;notify('Autosave is unavailable. Use Save design to keep your work.');}}}
function updateStats(){ $('dots-stat').textContent=design.points.length/3;$('links-stat').textContent=design.links.length/2; }
function scheduleMeasure(){clearTimeout(measureTimer);const id=++revision;measureTimer=setTimeout(async()=>{try{const result=await measure(design);if(id!==revision)return;measurement=result;$('size-estimate').textContent=(result.bytes/1024).toFixed(1)+' KB';$('size-description').textContent=(result.compressed?'gzip':'uncompressed')+' · runtime + design';$('export-detail').textContent=(result.bytes/1024).toFixed(1)+' KB '+(result.compressed?'gzipped':'uncompressed')+' for the runtime and this design, excluding React. The ZIP contains readable source and documentation.';}catch{$('size-estimate').textContent='Size unavailable';}},220);}
function render(){dark.update(design,{paused});light.update(design,{paused});updateStats();scheduleMeasure();persist();syncPresetState();}
function refreshGeometry(){clearTimeout(geometryTimer);design=prepareDesign(settings);render();}
function updateAppearance(){design={...design,appearance:{size:settings.size,lineOpacity:settings.lineOpacity,depth:settings.depth},motion:motionFromSettings(settings),themes:themesFromSettings(settings)};render();}
const rangeIds=['count','size','connections','lineOpacity','speed','deformation','pulse','depth','driftSpeed','pulseSpeed','breathing','breathSpeed','sizeVariation','waveHeight','waveFrequency','waveSpeed','twist'];
function updateRange(id){const input=$(id);input.value=settings[id];input.style.setProperty('--fill',((settings[id]-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');$(id+'-value').textContent=['lineOpacity','deformation','pulse','depth','breathing','waveHeight','sizeVariation'].includes(id)?Math.round(settings[id]*100)+'%':['speed','driftSpeed','pulseSpeed','breathSpeed','waveSpeed'].includes(id)?settings[id].toFixed(2):id==='twist'?Math.round(settings[id]*180/Math.PI)+'°':settings[id];}
function syncControls(){for(const id of rangeIds)updateRange(id);$('pattern').value=settings.pattern;$('colorMode').value=settings.colorMode;$('palette-controls').hidden=settings.colorMode==='single';$('single-controls').hidden=settings.colorMode!=='single';for(const id of ['darkColor','lightColor']){$(id).value=settings[id];$(id+'-value').textContent=settings[id];}$('axis').value=settings.axis;$('direction').value=String(settings.direction);$('distribution').value=settings.distribution;$('seed').value=settings.seed;$('palette-name').textContent=palettes[settings.palette].name;document.querySelectorAll('[data-palette]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.palette===settings.palette)));document.querySelectorAll('[data-preset]').forEach(el=>{const active=el.dataset.preset===selected;el.setAttribute('aria-pressed',String(active));el.querySelector('.preset-check').hidden=!active;});$('stage-caption').textContent=selectedName().toUpperCase()+(customPreset()?' / CUSTOM':' / '+String(Object.keys(presets).indexOf(selected)+1).padStart(3,'0'));syncPresetState();}
for(const id of rangeIds){$(id).addEventListener('input',()=>{settings[id]=Number($(id).value);updateRange(id);if(['count','connections','sizeVariation'].includes(id)){clearTimeout(geometryTimer);geometryTimer=setTimeout(refreshGeometry,75);}else updateAppearance();});$(id).addEventListener('change',()=>{if(['count','connections','sizeVariation'].includes(id))refreshGeometry();});}
for(const id of ['axis','direction'])$(id).addEventListener('change',()=>{settings[id]=id==='direction'?Number($(id).value):$(id).value;updateAppearance();});
for(const id of ['distribution','pattern'])$(id).addEventListener('change',()=>{settings[id]=$(id).value;refreshGeometry();});
$('colorMode').addEventListener('change',()=>{settings.colorMode=$('colorMode').value;syncControls();updateAppearance();});
for(const id of ['darkColor','lightColor'])$(id).addEventListener('input',()=>{settings[id]=$(id).value;$(id+'-value').textContent=settings[id];updateAppearance();});
for(const [id,palette] of Object.entries(palettes)){const button=document.createElement('button');button.className='palette';button.dataset.palette=id;button.setAttribute('aria-label',palette.name+' palette');button.title=palette.name;for(const color of palette.dark){const swatch=document.createElement('i');swatch.style.background=color;button.append(swatch);}button.addEventListener('click',()=>{settings.palette=id;syncControls();updateAppearance();});$('palettes').append(button);}
for(const [id,preset] of Object.entries(presets)){
  const button=document.createElement('button');button.className='preset';button.dataset.preset=id;button.setAttribute('aria-label',preset.name+' preset');
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
  const text=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small'),check=document.createElement('span');title.textContent=preset.name;description.textContent=preset.subtitle;text.append(title,description);check.className='preset-check';check.textContent='✓';check.setAttribute('aria-hidden','true');button.append(canvas,text,check);$('presets').append(button);
  thumbnails.push(createSphere(canvas,prepareDesign({...preset,count:150,size:2}),{theme:'dark',paused:true}));
  button.addEventListener('click',()=>{selectPreset(id);});
}
$('seed').addEventListener('change',()=>{const value=Number($('seed').value);if(!Number.isInteger(value)||value<0||value>4294967295){$('seed').value=settings.seed;notify('Use a whole-number seed from 0 to 4294967295.');return;}settings.seed=value;refreshGeometry();});
$('randomize').addEventListener('click',()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];$('seed').value=settings.seed;refreshGeometry();});
$('reset').addEventListener('click',()=>{settings=validateSettings(selectedSnapshot());syncControls();refreshGeometry();notify('Saved preset restored.');});
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
$('save-design').addEventListener('click',()=>{download(new Blob([JSON.stringify({format:'orbit-design',version:1,settings,selected},null,2)],{type:'application/json'}),'orbit-design.json');notify('Editable design saved.');});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('Design file is too large. Choose an Orbit design JSON.');const json=JSON.parse(await file.text());if(json.format!=='orbit-design'||json.version!==1)throw new Error('Choose a design saved with Orbit’s Save design button.');settings=validateSettings(json.settings);selected=knownPreset(json.selected)?json.selected:'reference';syncControls();$('wave-controls').open=settings.waveHeight>0||settings.twist!==0;refreshGeometry();notify('Design imported.');}catch(error){notify(error.message||'Could not import this design.');}finally{event.target.value='';}});
$('snapshot').addEventListener('click',()=>{const canvas=$(view==='light'?'light-canvas':'dark-canvas');canvas.toBlob(blob=>{if(blob){download(blob,'orbit-'+(view==='light'?'light':'dark')+'.png');notify('Transparent PNG saved'+(view==='compare'?' from the dark preview.':'.'));}});});
function selectPreset(id){
  drafts[selected]=validateSettings(settings);selected=id;
  settings=validateSettings(drafts[id] || selectedSnapshot());syncControls();
  $('wave-controls').open=settings.waveHeight>0||settings.twist!==0;refreshGeometry();
}
function syncPresetState(){
  const item=customPreset(),dirty=item&&JSON.stringify(validateSettings(settings))!==JSON.stringify(item.settings);
  $('preset-actions').hidden=!item;$('update-preset').disabled=!dirty;
  $('preset-state').textContent=dirty?'Draft changes · saved version kept':'Saved';
  document.querySelectorAll('[data-custom-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.customPreset===selected)));
}
function renderLibrary(){
  $('custom-presets').replaceChildren();$('custom-count').textContent=libraryData.items.length || '';
  $('presets-empty').hidden=libraryData.items.length>0;$('undo-preset').hidden=!libraryData.trash.length;
  for(const item of libraryData.items){
    const button=document.createElement('button');button.className='custom-preset';button.dataset.customPreset=item.id;
    button.setAttribute('aria-label','Load '+item.name);button.setAttribute('aria-pressed',String(item.id===selected));
    const swatch=document.createElement('span');swatch.className='preset-swatch';swatch.setAttribute('aria-hidden','true');
    const colors=themesFromSettings(item.settings).dark.colors;swatch.style.background='linear-gradient(135deg,'+colors[0]+','+colors[1]+')';
    const text=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=item.name;
    detail.textContent=item.settings.count+' dots · '+(item.settings.colorMode==='single'?'Single color':palettes[item.settings.palette].name);
    text.append(name,detail);button.append(swatch,text);button.addEventListener('click',()=>selectPreset(item.id));$('custom-presets').append(button);
  }
  syncPresetState();
}
function reloadLibrary(){libraryData=library.list();renderLibrary();}
let presetDialogMode='save',renamingId=null;
function openPresetDialog(mode){
  presetDialogMode=mode;renamingId=mode==='rename'?selected:null;
  $('preset-dialog-heading').textContent=mode==='rename'?'Give it a new name.':'Save this moment.';
  $('preset-dialog-description').textContent=mode==='rename'?'The saved design and any draft changes stay the same.':'Keep the current design, motion, and both color themes as a named preset.';
  $('confirm-preset').textContent=mode==='rename'?'Rename preset':'Save preset';
  $('preset-name').value=mode==='rename'?selectedName():'';$('preset-error').hidden=true;
  $('preset-dialog').showModal();$('preset-name').focus();
}
$('save-preset').addEventListener('click',()=>openPresetDialog('save'));
$('rename-preset').addEventListener('click',()=>openPresetDialog('rename'));
for(const id of ['close-preset','cancel-preset'])$(id).addEventListener('click',()=>$('preset-dialog').close());
$('preset-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
    if(presetDialogMode==='rename')library.rename(renamingId,$('preset-name').value);
    else{drafts[selected]=validateSettings(settings);const item=library.save($('preset-name').value,settings);selected=item.id;}
    reloadLibrary();syncControls();persist();$('preset-dialog').close();notify(presetDialogMode==='rename'?'Preset renamed.':'Preset saved in this browser.');
  }catch(error){$('preset-error').textContent=error.message;$('preset-error').hidden=false;}
});
$('update-preset').addEventListener('click',()=>{
  try{library.update(selected,settings);reloadLibrary();persist();notify('Saved preset updated.');}catch(error){notify(error.message);}
});
$('remove-preset').addEventListener('click',()=>{
  try{drafts[selected]=validateSettings(settings);const removed=library.remove(selected);selected='reference';reloadLibrary();syncControls();persist();notify(removed.name+' removed. Use Undo last removal to restore it.');}catch(error){notify(error.message);}
});
$('undo-preset').addEventListener('click',()=>{
  try{const item=library.undo();reloadLibrary();if(item){selectPreset(item.id);notify(item.name+' restored.');}}catch(error){notify(error.message);}
});
window.addEventListener('storage',event=>{
  if(event.key!==PRESET_KEY&&event.key!==null)return;
  try{reloadLibrary();if(!knownPreset(selected))selected='reference';syncControls();}catch(error){notify(error.message);}
});
window.addEventListener('pagehide',()=>{dark.destroy();light.destroy();thumbnails.forEach(instance=>instance.destroy());});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
renderLibrary();syncControls();updateStats();scheduleMeasure();if(libraryError)notify(libraryError);
