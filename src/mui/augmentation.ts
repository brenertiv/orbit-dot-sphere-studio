/**
 * Types for the palette keys Kilowatt adds to MUI's, through MUI's documented
 * module augmentation. The values are set in `departures.ts`.
 */

/** Surfaces by elevation: level0 is the page (darkest), level4 the highest surface (lightest). */
type SurfaceLevels = { level0: string; level1: string; level2: string; level3: string; level4: string };

/**
 * Surface borders by contrast, in both schemes, for separators and frames: level0 is the
 * faintest, level3 the strongest. Control outlines don't use them; they have `control`.
 */
export type BorderLevels = { level0: string; level1: string; level2: string; level3: string };

/** Control outlines (inputs, selects, outlined buttons, toggle buttons), by state. Independent of the surface border levels. */
export type ControlColors = { border: string; hover: string; focus: string; pressed: string };

/**
 * Chart data colors (Rules → Charts): `series` tells up to six categories apart, in a fixed
 * order; `neutral` is for what isn't the focus (a baseline, the previous period); `sequential`
 * shows magnitude, from the step nearest the surface to the one furthest from it.
 */
export type ChartColors = { series: string[]; neutral: string; sequential: string[] };

/**
 * Basemap colors the surface roles don't cover (Rules → Maps): `land`, a step past the page;
 * `water`, a step past the land; and `road` and `boundary`, for the lines CARTO draws at low zoom.
 */
export type MapColors = { land: string; water: string; road: string; boundary: string };

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TypeBackground extends SurfaceLevels {}
  interface Palette {
    border: BorderLevels;
    control: ControlColors;
    chart: ChartColors;
    map: MapColors;
  }
  interface PaletteOptions {
    border?: Partial<BorderLevels>;
    control?: ControlColors;
    chart?: ChartColors;
    map?: MapColors;
  }
}
