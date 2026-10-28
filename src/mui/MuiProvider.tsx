import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createKilowattTheme } from './theme';

const theme = createKilowattTheme();

/**
 * Kilowatt's Material UI theme with MUI's CssBaseline. MUI manages the color
 * scheme; switch it with `useColorScheme().setMode`.
 */
export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
