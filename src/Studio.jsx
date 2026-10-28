import React, { useEffect, useState } from 'react';
import { AppBar, Box, GlobalStyles, IconButton, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { Icon } from './icons';
import { OrbitView } from './App';
import { FieldView } from './dotfield/App';

/** The tools, in tab order. The hash names the open one (#orbit, #field), so links and bookmarks open it. */
const tools = [
  { id: 'orbit', label: 'Orbit' },
  { id: 'field', label: 'Field' },
];
const aliases = { dotfield: 'field' };
function toolFromHash() {
  const id = window.location.hash.slice(1).toLowerCase();
  const resolved = aliases[id] || id;
  return tools.some(t => t.id === resolved) ? resolved : 'orbit';
}

/**
 * Kilowatt Studio: one app bar with the tool tabs and the theme toggle, and each tool below it.
 * Both tools stay mounted so switching tabs keeps their settings; the hidden one stops animating.
 */
export function Studio() {
  const [tool, setTool] = useState(toolFromHash);
  const { mode, systemMode, setMode } = useColorScheme(), editorMode = (mode === 'system' ? systemMode : mode) || 'light';
  const next = editorMode === 'light' ? 'dark' : 'light';

  useEffect(() => {
    const onHash = () => setTool(toolFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.title = `${tools.find(t => t.id === tool).label} · Kilowatt Studio`;
    if (window.location.hash.slice(1) !== tool) window.history.replaceState(null, '', '#' + tool);
  }, [tool]);

  function choose(id) {
    if (id === tool) return;
    window.history.pushState(null, '', '#' + id);
    setTool(id);
  }
  // Switch schemes in one step: suppress transitions so surfaces don't animate through the change.
  function toggleTheme() {
    const override = document.createElement('style');
    override.textContent = '*,*::before,*::after{transition:none !important}';
    document.head.append(override);
    setMode(next);
    requestAnimationFrame(() => { void document.body.offsetHeight; requestAnimationFrame(() => override.remove()); });
  }

  return <>
    {/* Preserve the phone tap targets from the mobile review; the upstream theme stays unchanged. */}
    <GlobalStyles styles={theme => ({
      [theme.breakpoints.down('sm')]: { '.MuiButton-root,.MuiIconButton-root,.MuiToggleButton-root,.MuiTab-root': { minHeight: 44 }, '.MuiIconButton-root': { minWidth: 44 } },
      '@media (pointer: coarse)': { '.MuiButton-root,.MuiIconButton-root,.MuiToggleButton-root,.MuiTab-root': { minHeight: 44 }, '.MuiIconButton-root': { minWidth: 44 } },
    })} />
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: 'background.level2', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h5" component="p" sx={{ color: 'text.primary', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>Kilowatt Studio</Typography>
        <Tabs value={tool} onChange={(_, id) => choose(id)} aria-label="Studio tools" sx={{ alignSelf: 'flex-end' }}>
          {tools.map(t => <Tab key={t.id} value={t.id} label={t.label} id={'tab-' + t.id} aria-controls={'panel-' + t.id} />)}
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={'Switch to ' + next + ' mode'}>
          <IconButton aria-label={'Switch to ' + next + ' mode'} onClick={toggleTheme}><Icon name={editorMode === 'light' ? 'dark_mode' : 'light_mode'} /></IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
    <Box component="main">
      <Box role="tabpanel" id="panel-orbit" aria-labelledby="tab-orbit" hidden={tool !== 'orbit'}><OrbitView /></Box>
      <Box role="tabpanel" id="panel-field" aria-labelledby="tab-field" hidden={tool !== 'field'}><FieldView active={tool === 'field'} /></Box>
    </Box>
  </>;
}
