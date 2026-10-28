import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { departures, type ColorScheme } from './departures';

/**
 * The Material UI theme: stock MUI with its own light and dark color schemes,
 * plus Kilowatt's departures merged on top. Nothing is set here directly. Every
 * value that differs from MUI's default is an entry in `departures.ts`, with its
 * reason, so the list of differences is the theme itself.
 */

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Merges theme option objects key by key; later values win. */
export function mergeOptions(target: Plain, source: Plain): Plain {
  const out: Plain = { ...target };
  for (const [key, value] of Object.entries(source)) {
    out[key] = isPlain(value) && isPlain(out[key]) ? mergeOptions(out[key] as Plain, value) : value;
  }
  return out;
}

/** The theme options for one scheme: MUI's defaults plus every departure. */
export function themeOptions(scheme: ColorScheme): ThemeOptions {
  return departures.reduce<Plain>(
    (options, departure) => (departure.options ? mergeOptions(options, departure.options(scheme) as Plain) : options),
    { palette: { mode: scheme } },
  ) as ThemeOptions;
}

/** One scheme's theme. What the departures guard and docs compare against stock MUI. */
export function createSchemeTheme(scheme: ColorScheme): Theme {
  return createTheme(themeOptions(scheme));
}

/**
 * The theme Kilowatt runs on: MUI's light and dark color schemes, switched with
 * `useColorScheme()`. Only the palette differs between schemes.
 */
export function createKilowattTheme(): Theme {
  const { palette: lightPalette, ...shared } = themeOptions('light');
  const { palette: darkPalette } = themeOptions('dark');
  return createTheme({
    ...shared,
    colorSchemes: { light: { palette: lightPalette }, dark: { palette: darkPalette } },
  });
}
