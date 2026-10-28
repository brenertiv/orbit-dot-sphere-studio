import React from 'react';
import { createRoot } from 'react-dom/client';
import { MuiProvider } from './mui/MuiProvider';
import { Studio } from './Studio';
createRoot(document.getElementById('root')).render(<MuiProvider><Studio /></MuiProvider>);
