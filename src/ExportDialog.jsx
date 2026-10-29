import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Icon } from './icons';

function Hint({children}) {return <Typography variant="caption" color="text.secondary">{children}</Typography>;}
function FileList({files}) {
  return <Stack divider={<Divider/>} spacing={1} sx={{my:3}}>{files.map(([file,description])=><Stack key={file} direction="row" useFlexGap sx={{justifyContent:"space-between",flexWrap:"wrap",gap:1}}><Typography variant="body2" sx={{overflowWrap:'anywhere'}}>{file}</Typography><Hint>{description}</Hint></Stack>)}</Stack>;
}

/**
 * Export React, shared by Orbit and Field: the full component as a ZIP, or only the config for an app that already has it.
 * `component` and `config` describe each choice: { intro, files: [[name, description]], usage, caption }, plus chips for the component.
 */
export function ExportDialog({open,onClose,component,config,busy=false,onDownloadComponent,onDownloadConfig,onError}) {
  const [kind,setKind]=useState('component'),[copied,setCopied]=useState(false),copyTimer=useRef();
  useEffect(()=>()=>clearTimeout(copyTimer.current),[]);
  const shown=kind==='config'?config:component;
  async function copyCode(){try{await navigator.clipboard.writeText(shown.usage);setCopied(true);clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),2000);}catch{onError?.('Copy is unavailable. Select the code and copy it with your keyboard.');}}
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="export-heading">
    <DialogTitle id="export-heading">Export React</DialogTitle>
    <DialogContent>
      <ToggleButtonGroup exclusive fullWidth value={kind} onChange={(_,value)=>{if(value)setKind(value);}} aria-label="What to download" sx={{mb:2}}>
        <ToggleButton value="component">Full Component</ToggleButton><ToggleButton value="config">Config Only</ToggleButton>
      </ToggleButtonGroup>
      <DialogContentText>{shown.intro}</DialogContentText>
      {kind==='component'&&!!component.chips?.length&&<Stack direction="row" useFlexGap sx={{flexWrap:"wrap",gap:1,my:2}}>{component.chips.map(label=><Chip key={label} label={label}/>)}</Stack>}
      <FileList files={shown.files}/>
      <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:1}}><Typography variant="subtitle2" component="h3">Use in Your App</Typography><Button onClick={copyCode} startIcon={<Icon name={copied?'check':'content_copy'}/>}>{copied?'Copied':'Copy Code'}</Button></Stack>
      <Box component="pre" tabIndex={0} sx={{m:0,my:1,p:2,borderRadius:1,bgcolor:'background.level0',overflow:'auto',typography:'body2',fontFamily:'monospace',whiteSpace:'pre'}}><code>{shown.usage}</code></Box>
      <Typography variant="caption" color="text.secondary">{shown.caption}</Typography>
    </DialogContent>
    <DialogActions sx={{flexWrap:'wrap',gap:1}}><Button onClick={onClose}>Close</Button>{kind==='component'?<Button variant="contained" loading={busy} onClick={onDownloadComponent} startIcon={<Icon name="download"/>}>Download React Component</Button>:<Button variant="contained" onClick={onDownloadConfig} startIcon={<Icon name="download"/>}>Download Config</Button>}</DialogActions>
  </Dialog>;
}
