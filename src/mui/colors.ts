/**
 * Kilowatt's color ramps, in the shape MUI uses for its own (`@mui/material/colors`):
 * plain objects keyed by step, 50 the lightest. They are primitives: nothing reads
 * them except the palette in `departures.ts`, and components read the palette.
 */

/**
 * Cool grays, one neutral ramp from white to near-black. 50 to 300 are the light-scheme surfaces,
 * 400 to 800 the light-scheme borders and control outlines (800, the strongest, below 3:1 on the
 * light surfaces for now, by design decision), and 900 and 950 text: 900 is light-scheme
 * secondary text and icons, at 4.5:1 or more on every light surface and on MUI's selected and
 * filled tints over them, hovered too. In the dark scheme the light
 * steps are text and the light neutral primary. 900 and 950 share 800's hue and its low chroma, so
 * they read grey-navy rather than blue.
 */
export const slate = {
  50: '#ffffff',
  100: '#f9fafc',
  200: '#f3f6f9',
  300: '#edf1f5',
  400: '#e7ecf2',
  500: '#e2e8ef',
  600: '#dce3ec',
  700: '#d6dee8',
  800: '#c3cfdd',
  900: '#535e6b',
  950: '#10161e',
} as const;

/**
 * Enertiv navy, a deep ramp: low-saturation blues from a teal-navy 50 to a near-black 950.
 * 600 to 950 are the dark-scheme surfaces; 600, 500, 400 and 200 the dark-scheme borders
 * (faint to strongest, 200 below 3:1 on the dark surfaces for now, by design decision); 400 and 200 the dark control outline and its hover; 900 is
 * light-scheme primary and 950 light-scheme text. The ramp has no desaturated mid tone, so
 * light secondary text comes from slate.
 */
export const navy = {
  50: '#0d597a',
  100: '#0d506e',
  200: '#0d4963',
  300: '#0b4057',
  400: '#0a374a',
  500: '#0a3142',
  600: '#092c3b',
  700: '#0e2630',
  800: '#0d222b',
  900: '#0b1c24',
  950: '#09161c',
} as const;

/**
 * Enertiv's brand blue, #2EA6E1 at 500. The secondary intent reads from it, at the
 * steps that pass contrast: the brand blue itself is too light to be text.
 */
export const brand = {
  50: '#dcf0fa',
  100: '#b9e1f5',
  200: '#96d3f0',
  300: '#74c4eb',
  400: '#51b5e6',
  500: '#2ea6e1',
  600: '#2585b4',
  700: '#1c6487',
  800: '#12425a',
  900: '#09212d',
} as const;

/** Orange, for the light-scheme warning intent. */
export const orange = {
  50: '#fff1ec',
  100: '#ffe0d6',
  200: '#fdc4b2',
  300: '#fe9e7f',
  400: '#fb6632',
  500: '#e34712',
  600: '#bb3b0f',
  700: '#952f0c',
  800: '#772001',
  900: '#5c1300',
  950: '#410900',
} as const;

/** Yellow, for the dark-scheme warning intent. */
export const yellow = {
  50: '#fff5e4',
  100: '#ffe4bc',
  200: '#ffd491',
  300: '#ffc268',
  400: '#ffb44c',
  500: '#ffa83e',
  600: '#fb9c3a',
  700: '#f48e36',
  800: '#ed7f32',
  900: '#e16a2e',
} as const;
