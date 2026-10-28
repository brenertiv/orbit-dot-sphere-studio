import type { ThemeOptions } from '@mui/material/styles';
import { iconWeight } from '../icons';
import './augmentation';
import type { BorderLevels } from './augmentation';
import { blueGrey, green, indigo, lime, pink, purple, red, teal } from '@mui/material/colors';
import { brand, navy, orange, slate, yellow } from './colors';

/**
 * Every way Kilowatt departs from stock Material UI, and nothing else.
 *
 * The theme (`theme.ts`) is MUI's defaults with these entries merged on top, so
 * this list and the running theme cannot disagree, and `departures.test.ts`
 * fails if the theme differs from MUI anywhere a departure doesn't claim.
 * Foundations → MUI departures in Storybook is generated from this file.
 *
 * To depart from MUI, add an entry here with the reason. Anything not listed is
 * MUI's default, on purpose.
 */

export type ColorScheme = 'light' | 'dark';

export type DepartureArea = 'Theme' | 'Palette' | 'Typography' | 'Components' | 'Icons';

export type Departure = {
  id: string;
  area: DepartureArea;
  title: string;
  /** Why Kilowatt differs from MUI here, in one or two sentences. */
  why: string;
  /** The theme options this departure sets. Absent for conventions outside the theme. */
  options?: (scheme: ColorScheme) => ThemeOptions;
  /** For a convention outside the theme: what MUI does, what Kilowatt does instead, and where. */
  convention?: { muiDefault: string; kilowatt: string; where: string };
  /**
   * The MUI components (by import name, as in `@mui/material/Button`) whose look or use this
   * departure changes. Each one's docs page lists it under "MUI departures", and
   * `src/components/docs.test.ts` checks that it does. Absent for a theme-wide departure
   * (the palette, CSS variables), which every component inherits and no page lists.
   */
  components?: string[];
};

/** Surfaces by elevation, per scheme: the ramp step each level uses. level0 is the page (darkest), level4 the highest (lightest). */
export const surfaceSteps = {
  light: { level0: 300, level1: 200, level2: 100, level3: 50, level4: 50 },
  dark: { level0: 950, level1: 900, level2: 700, level3: 600, level4: 600 },
} as const satisfies Record<ColorScheme, Record<string, number>>;

/** Surface borders by contrast, per scheme: level0 the faintest, level3 the strongest. `divider` is level1. Control outlines are separate (`control-outlines`). */
export const borderSteps = {
  light: { level0: 400, level1: 500, level2: 700, level3: 800 },
  dark: { level0: 600, level1: 500, level2: 400, level3: 200 },
} as const satisfies Record<ColorScheme, Record<keyof BorderLevels, number>>;

const ramps = { light: slate, dark: navy } as const;

function levels<T extends Record<string, number>>(scheme: ColorScheme, steps: T): Record<keyof T, string> {
  const ramp = ramps[scheme] as Record<number, string>;
  return Object.fromEntries(Object.entries(steps).map(([level, step]) => [level, ramp[step]])) as Record<keyof T, string>;
}

/** The surface level each Paper elevation sits on: flat surfaces, app bars and snackbars, menus, drawers and dialogs. Cards sit on level2 at any elevation (`paper-surface-levels`). */
export const elevationSurfaces: { elevations: [number, number]; level: keyof typeof surfaceSteps.light; uses: string }[] = [
  { elevations: [0, 1], level: 'level1', uses: 'Paper, Accordion' },
  { elevations: [2, 6], level: 'level2', uses: 'AppBar, Snackbar, and every Card' },
  { elevations: [7, 12], level: 'level3', uses: 'Menu, Popover' },
  { elevations: [13, 24], level: 'level4', uses: 'Drawer, Dialog' },
];

type Intent = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

/**
 * The intents Kilowatt moves off MUI's default, per scheme: a step from a color ramp (MUI's
 * own, or Kilowatt's orange and yellow for warning) that passes 4.5:1 as text on every surface level, with its contrast
 * text also at 4.5:1 or better. Intents not listed keep MUI's default, which
 * already passes. MUI derives `light` and `dark` from `main`.
 */
export const intentSteps: Record<ColorScheme, Partial<Record<Intent, { ramp: string; step: string; main: string }>>> = {
  light: {
    error: { ramp: 'red', step: '800', main: red[800] },
    warning: { ramp: 'orange', step: '700', main: orange[700] },
    info: { ramp: 'purple', step: '500', main: purple[500] },
    success: { ramp: 'green', step: '900', main: green[900] },
  },
  dark: {
    error: { ramp: 'red', step: '100', main: red[100] },
    info: { ramp: 'purple', step: '100', main: purple[100] },
    success: { ramp: 'green', step: '300', main: green[300] },
    warning: { ramp: 'yellow', step: '400', main: yellow[400] },
  },
};

/** MUI's contrast text for each scheme: white on light-scheme intents, near-black on dark-scheme ones. */
const intentContrastText: Record<ColorScheme, string> = { light: '#fff', dark: 'rgba(0, 0, 0, 0.87)' };

type RampName = 'navy' | 'slate';
const rampByName = { navy, slate } as const;
type Step = keyof typeof navy & keyof typeof slate;

/**
 * Primary, per scheme: `main`, `light`, the hover step (`dark`) and, where it isn't MUI's,
 * the contrast text. Light is Enertiv navy. Dark is a light neutral (slate) with navy
 * text, so on the navy dark surfaces primary stands apart from the blue secondary and
 * from info instead of becoming another pale blue.
 */
export const primarySteps: Record<
  ColorScheme,
  { ramp: RampName; main: Step; light: Step; dark: Step; contrastText?: { ramp: RampName; step: Step } }
> = {
  light: { ramp: 'navy', main: 900, light: 700, dark: 950 },
  dark: { ramp: 'slate', main: 700, light: 100, dark: 800, contrastText: { ramp: 'navy', step: 950 } },
};

/**
 * Secondary, per scheme, on the brand ramp. The brand blue itself (500) is too light to
 * pass as text or under white text, so light uses 700 for `main`, with 500 as `light`;
 * dark uses 300.
 */
export const secondarySteps: Record<ColorScheme, { main: keyof typeof brand; light: keyof typeof brand; dark: keyof typeof brand }> = {
  light: { main: 700, light: 500, dark: 800 },
  dark: { main: 300, light: 200, dark: 400 },
};

/**
 * Chart colors, per scheme (Rules → Charts). `series` is six hues in a fixed order, each a ramp
 * step that reaches 3:1 on every surface level, chosen so every pair stays apart under normal
 * vision and simulated protanopia, deuteranopia and tritanopia (departures.test.ts). Lightness
 * varies across the six on purpose: it survives color-vision deficiencies best. `neutral` is
 * blue grey, at 3:1 and apart from the six as well. `sequential` is the brand ramp, from the step nearest the surface to the
 * one furthest from it, so it runs light to dark in light and dark to light in dark.
 */
const chartRamps = { brand, orange, teal, pink, indigo, lime, blueGrey } as const;
type ChartRamp = keyof typeof chartRamps;
type ChartStep = { ramp: ChartRamp; step: string };

export const chartSteps: Record<ColorScheme, { series: ChartStep[]; neutral: ChartStep; sequential: ChartStep[] }> = {
  light: {
    series: [
      { ramp: 'brand', step: '600' },
      { ramp: 'orange', step: '800' },
      { ramp: 'teal', step: '900' },
      { ramp: 'pink', step: '500' },
      { ramp: 'indigo', step: '500' },
      { ramp: 'lime', step: '900' },
    ],
    neutral: { ramp: 'blueGrey', step: '500' },
    sequential: ['100', '300', '500', '700', '900'].map((step) => ({ ramp: 'brand', step })),
  },
  dark: {
    series: [
      { ramp: 'brand', step: '100' },
      { ramp: 'orange', step: '200' },
      { ramp: 'teal', step: '400' },
      { ramp: 'pink', step: '300' },
      { ramp: 'indigo', step: '200' },
      { ramp: 'lime', step: '100' },
    ],
    neutral: { ramp: 'blueGrey', step: '200' },
    sequential: ['900', '700', '500', '300', '100'].map((step) => ({ ramp: 'brand', step })),
  },
};

/**
 * The basemap's own colors, per scheme (Rules → Maps), each a step of the surface ramp with no hue
 * of its own. `land` is a step past the page (slate 400 in light, where the page is 300; navy 950,
 * the page's own step, in dark, where cards are 700), so the map reads as a recessed plane in its
 * card; `water` a step past the land; `road` and `boundary`, for the road casings and boundaries
 * CARTO draws when zoomed out, reach past the water so a zoomed-out map shows structure, not labels
 * alone. Light water stops at slate 500: past it, map labels (text.secondary) drop below 4.5:1 on
 * water (src/maps/departures.test.ts).
 */
export const mapSteps: Record<ColorScheme, { land: string; water: string; road: string; boundary: string }> = {
  light: { land: slate[400], water: slate[500], road: slate[800], boundary: slate[800] },
  dark: { land: navy[950], water: navy[600], road: navy[500], boundary: navy[300] },
};

/**
 * Keyboard focus, per scheme (`focus-ring`): the brightest brand step that still reaches 3:1 as a
 * ring and 4.5:1 as a focused label on every surface. Light takes the secondary's main step (brand
 * 500, the brand blue itself, is about 2.4:1 on the page); dark takes its lighter step.
 */
export const focusSteps: Record<ColorScheme, keyof typeof brand> = { light: 700, dark: 200 };

/** Text, per scheme: primary and secondary. Neutral icons take the secondary (`icon-color`). */
export const textSteps: Record<ColorScheme, { primary: string; secondary: string }> = {
  light: { primary: navy[950], secondary: slate[900] },
  dark: { primary: slate[100], secondary: slate[800] },
};

const chartColor = ({ ramp, step }: ChartStep) => (chartRamps[ramp] as Record<string, string>)[step];

/** Selectable MUI controls whose selected state fills their icons. Each gets `Mui-selected` when selected. */
const selectableControls = ['ToggleButton', 'Tab', 'ListItemButton', 'MenuItem', 'BottomNavigationAction'] as const;

export const departures: Departure[] = [
  {
    id: 'css-variables',
    area: 'Theme',
    title: 'CSS theme variables',
    why: "MUI's opt-in CSS variables mode, with the color scheme switched by a `dark` class on <html>. Theme styles can then name a palette value once, as `var(--mui-palette-…)`, and get the right color in each scheme, which the elevation-to-surface mapping needs.",
    options: () => ({ cssVariables: { colorSchemeSelector: 'class' } }),
  },
  {
    id: 'shape-radius',
    area: 'Theme',
    title: 'Corner radius',
    why: "One corner radius of 8px instead of MUI's 4px, for a softer look at Kilowatt's density. It's MUI's single `shape.borderRadius`, so every component that rounds with the theme (buttons, inputs, cards, menus, dialogs, tooltips, toggle buttons) follows it, cards at twice it (`card-radius`), and `sx` multiples scale from it: `borderRadius: 1` is 8px, `2` is 16px.",
    options: () => ({ shape: { borderRadius: 8 } }),
  },
  {
    id: 'surfaces-and-borders',
    area: 'Palette',
    title: 'Surface and border levels',
    why: "Five surfaces by elevation and four borders by contrast, from the slate (light) and navy (dark) ramps, in place of MUI's white or #121212 surfaces and single divider, so each raised surface steps lighter in both schemes and a separator can be as faint or as strong as its job needs. The top two levels share a step in both schemes: light runs out of steps above white, and dark stops at navy 600 because a lighter step (navy 500) would drop the secondary color and border level3 below their contrast. `background.default` is level0 and `background.paper` level1, so MUI's components pick them up; `divider` is border level1.",
    options: (scheme) => {
      const surfaces = levels(scheme, surfaceSteps[scheme]);
      const border = levels(scheme, borderSteps[scheme]);
      return { palette: { background: { ...surfaces, default: surfaces.level0, paper: surfaces.level1 }, border, divider: border.level1 } };
    },
  },
  {
    id: 'intents-on-surfaces',
    area: 'Palette',
    title: 'Intent colors that pass on every surface',
    why: "MUI's intents are tuned for a white or #121212 background, and several fall below 4.5:1 as text on the surface levels. These take a nearby step from MUI's own color ramps that passes on every level in its scheme; the intents that already pass stay as MUI ships them. Warning uses Kilowatt's own ramps: orange 700 in light (clearly apart from error's red) and yellow 400 in dark.",
    options: (scheme) => ({
      palette: Object.fromEntries(
        Object.entries(intentSteps[scheme]).map(([intent, { main }]) => [intent, { main, contrastText: intentContrastText[scheme] }]),
      ),
    }),
  },
  {
    id: 'text-colors',
    area: 'Palette',
    title: 'Navy and slate text',
    why: "MUI sets text in black or white at fixed opacities (87% and 60% in light, 100% and 70% in dark). Kilowatt uses solid navy 950 and slate 900 in light, slate 100 and slate 800 in dark, so text takes the palette's hue and reads the same on every surface instead of blending into it. Light secondary text is slate, a grey-navy, because the navy ramp has no desaturated mid tone.",
    options: (scheme) => ({ palette: { text: textSteps[scheme] } }),
  },
  {
    id: 'primary-navy',
    area: 'Palette',
    title: 'Navy primary, light neutral in dark',
    why: "Primary is Enertiv navy instead of MUI's blue in the light scheme (navy 900), so the main actions carry Enertiv's brand color. In the dark scheme it's a light neutral (slate 700) with navy text: the dark surfaces are navy, so a blue primary there would be another pale blue beside the brand-blue secondary and the info color. Like the other intents, it passes 4.5:1 as text on every surface level, and its contrast text passes on it. Every component that uses `primary` (buttons, links, focus rings, checkboxes, tabs, progress) follows it.",
    options: (scheme) => {
      const { ramp, main, light, dark, contrastText } = primarySteps[scheme];
      const r = rampByName[ramp];
      return {
        palette: {
          primary: {
            main: r[main],
            light: r[light],
            dark: r[dark],
            contrastText: contrastText ? rampByName[contrastText.ramp][contrastText.step] : intentContrastText[scheme],
          },
        },
      };
    },
  },
  {
    id: 'type-scale',
    area: 'Typography',
    components: ['CardHeader'],
    title: 'A compact heading scale',
    why: "MUI's headings are sized for marketing pages (`h1` 96px down to `h6` 20px), which is too large for a dense product UI. Kilowatt's step down from 32px to 16px, one step apart, so `h6` meets body size. Only `h1` to `h6` change: body, caption, button and input text keep MUI's sizes, so reading sizes don't shrink. Line heights and letter spacing stay MUI's, and every style is regular weight (`regular-weight`). `CardHeader` titles use `h5`, so card titles are 18px with no change to the card.",
    options: () => ({
      typography: {
        h1: { fontSize: '2rem' },
        h2: { fontSize: '1.75rem' },
        h3: { fontSize: '1.5rem' },
        h4: { fontSize: '1.25rem' },
        h5: { fontSize: '1.125rem' },
        h6: { fontSize: '1rem' },
      },
    }),
  },
  {
    id: 'card-header-subheader',
    area: 'Components',
    components: ['CardHeader'],
    title: 'Card subtitles in body2',
    why: "MUI sets a `CardHeader` subtitle in `body1` (16px), and in `body2` (14px) only when the header has an avatar. With the compact heading scale the title is 18px, so a 16px subtitle sits almost level with it. Kilowatt sets every subtitle in `body2`, the size MUI already uses beside an avatar, so the title leads. The subtitle keeps MUI's `text.secondary` color and still renders as a `span`.",
    options: () => ({ components: { MuiCardHeader: { defaultProps: { slotProps: { subheader: { variant: 'body2' } } } } } }),
  },
  {
    id: 'card-header-layout',
    area: 'Components',
    components: ['CardHeader'],
    title: 'Card headers: aligned actions and one-line titles',
    why: "MUI pulls a `CardHeader` action out by 4px at the top and bottom and 8px at the right, tuned to its 24px title on a 32px line, and centers the header's contents, so a title moves with the height of whatever sits beside it. Kilowatt pulls the action out by 8px on all three sides, so on its 24px title line the icon inside an icon button sits level with a one-line title, 16px from the card's right edge in line with the content below, and the button never makes the header taller than its title. Contents align to the top, so a title sits 16px from the top and left of every card, with or without a subtitle. Titles and subtitles stay on one line and truncate, so cards in a grid keep one header height; wrap them in `TruncatedText` to show the full text in a tooltip.",
    options: () => ({
      components: {
        MuiCardHeader: {
          defaultProps: { slotProps: { title: { noWrap: true }, subheader: { noWrap: true } } },
          styleOverrides: {
            root: { alignItems: 'flex-start' },
            content: { minWidth: 0 },
            action: { margin: 'calc(-1 * var(--mui-spacing)) calc(-1 * var(--mui-spacing)) calc(-1 * var(--mui-spacing)) 0' },
          },
        },
      },
    }),
  },
  {
    id: 'card-content-padding',
    area: 'Components',
    components: ['CardContent'],
    title: 'Card content is 16px on every side',
    why: "MUI gives the last `CardContent` 24px of bottom padding against 16px everywhere else. Kilowatt keeps 16px on every side, so a card's sections sit on one inset. The `Card` itself stays unpadded, as in MUI: each section sets its own padding, and a list, table or chart runs edge to edge by leaving `CardContent` out.",
    options: () => ({
      components: { MuiCardContent: { styleOverrides: { root: { '&:last-child': { paddingBottom: 'calc(2 * var(--mui-spacing))' } } } } },
    }),
  },
  {
    id: 'card-radius',
    area: 'Components',
    components: ['Card'],
    title: 'Cards round at twice the theme radius',
    why: "A card's header action and its `CardActions` buttons sit 8px from its corners, and a button keeps the theme radius, so the card's corner is the button's radius plus that gap (Rules → Concentric corners): two theme radii, 16px, instead of MUI's one. It follows `shape-radius`, so changing the theme radius moves cards with it.",
    options: () => ({ components: { MuiCard: { styleOverrides: { root: { borderRadius: 'calc(2 * var(--mui-shape-borderRadius))' } } } } }),
  },
  {
    id: 'regular-weight',
    area: 'Typography',
    title: 'Every type style at regular weight',
    why: "MUI sets `h1` and `h2` light (300) and `h6` and `subtitle2` medium (500), so weight shifts between neighbouring styles. Kilowatt sets every type style at regular (400, `fontWeightRegular`): size and color carry the hierarchy, and a headline number reads at the same weight as the text around it. `button` is regular through `button-text-weight`. The weight tokens (`fontWeightLight` to `fontWeightBold`) keep MUI's values, for the components that use them directly and for `strong`.",
    options: () => ({
      typography: {
        h1: { fontWeight: 400 },
        h2: { fontWeight: 400 },
        h6: { fontWeight: 400 },
        subtitle2: { fontWeight: 400 },
      },
    }),
  },
  {
    id: 'button-text-case',
    area: 'Typography',
    components: ['Button', 'ToggleButton', 'Tab', 'Fab', 'BottomNavigationAction'],
    title: 'Button labels in Title Case',
    why: "MUI uppercases every label set in the `button` type style. Kilowatt shows labels as written, and writes them in Title Case. CSS can't do Title Case (`capitalize` also capitalizes minor words such as \"and\"), so it's a writing convention: what's in the code is what people and screen readers get, and it carries through translation.",
    options: () => ({ typography: { button: { textTransform: 'none' } } }),
    convention: {
      muiDefault: 'Labels uppercased by `typography.button.textTransform`',
      kilowatt: 'Labels shown as written, written in Title Case: "Dispatch Ticket", "Export CSV", "Save and Close"',
      where: 'Every label of a Button, ToggleButton, Tab, Fab or BottomNavigationAction',
    },
  },
  {
    id: 'button-text-weight',
    area: 'Typography',
    components: ['Button', 'ToggleButton', 'Tab', 'Fab', 'BottomNavigationAction'],
    title: 'Button labels at regular weight',
    why: "MUI sets the `button` type style at medium weight (500). Kilowatt sets it at regular (400, `fontWeightRegular`), so labels sit at the same weight as body text and a button's emphasis comes from its variant and color, not its type. Every component set in the `button` style follows.",
    options: () => ({ typography: { button: { fontWeight: 400 } } }),
  },
  {
    id: 'flat-buttons',
    area: 'Components',
    components: ['Button', 'ButtonGroup'],
    title: 'Flat buttons',
    why: "Contained buttons sit flat, without MUI's elevation (2, rising to 4 on hover and 8 when pressed), so they read as controls on a surface rather than as surfaces of their own. This is MUI's own `disableElevation`, made the default; `theme.shadows` is unchanged, so Paper, menus and dialogs keep theirs.",
    options: () => ({
      components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiButtonGroup: { defaultProps: { disableElevation: true } },
      },
    }),
  },
  {
    id: 'control-outlines',
    area: 'Components',
    components: ['Button', 'ButtonGroup', 'ToggleButton', 'TextField', 'Select', 'Autocomplete', 'OutlinedInput'],
    title: 'One outline color for every control',
    why: "MUI outlines its controls in three different colors: inputs at 23% black (or white), outlined buttons in their intent color at half strength, toggle buttons in the divider color. Kilowatt gives them one outline per state from their own palette role, `palette.control`, kept apart from the surface border levels so either can change without moving the other. The outline is quiet at rest (slate 600 in light, navy 400 in dark; below 3:1, by design decision), a stronger one on hover (slate 800 in light, navy 200 in dark), the brand blue on keyboard focus (`focus-ring`) and navy 400 or slate 800 when pressed. Inputs show focus with a 2px outline in the same blue. Error and disabled keep MUI's. Outlined buttons in the other intents (secondary, error, warning, info, success) keep MUI's intent-colored outline on purpose: the color carries their meaning.",
    options: (scheme) => ({
      palette: {
        control:
          scheme === 'dark'
            ? { border: navy[400], hover: navy[200], focus: brand[focusSteps.dark], pressed: slate[800] }
            : { border: slate[600], hover: slate[800], focus: brand[focusSteps.light], pressed: navy[400] },
      },
      components: {
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: { borderColor: 'var(--mui-palette-control-border)' },
            root: {
              '@media (hover: hover)': {
                '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--mui-palette-control-hover)',
                },
              },
              // On touch screens MUI resets a hovered outline to its 23% default; keep the control border instead.
              '@media (hover: none)': {
                '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--mui-palette-control-border)',
                },
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              // MUI draws the outline from --variant-outlinedBorder. Primary only: the other intents keep MUI's.
              // Disabled sets its own border.
              '&.MuiButton-outlined.MuiButton-colorPrimary': {
                '--variant-outlinedBorder': 'var(--mui-palette-control-border)',
                '@media (hover: hover)': {
                  '&:hover': { '--variant-outlinedBorder': 'var(--mui-palette-control-hover)' },
                },
                '&.Mui-focusVisible': { '--variant-outlinedBorder': 'var(--mui-palette-control-focus)' },
                '&:active': { '--variant-outlinedBorder': 'var(--mui-palette-control-pressed)' },
              },
            },
          },
        },
        MuiToggleButton: { styleOverrides: { root: { borderColor: 'var(--mui-palette-control-border)' } } },
      },
    }),
  },
  {
    id: 'focus-ring',
    area: 'Components',
    components: ['ButtonBase', 'Button', 'IconButton', 'ToggleButton', 'Chip', 'Tab', 'ListItemButton', 'MenuItem', 'CardActionArea', 'TextField', 'OutlinedInput', 'InputLabel'],
    title: 'Keyboard focus in the brand blue',
    why: "MUI shows keyboard focus on a ButtonBase (buttons, icon buttons, chips, tabs, list rows, card action areas) only as a background tint, which is easy to miss beside a hover, and on inputs as a primary-colored outline, which in light is the navy of the text around it. Kilowatt shows focus everywhere in one color, `palette.control.focus`, the brightest brand blue that passes on every surface (brand 700 in light, brand 200 in dark): a 2px ring, 2px outside every focused ButtonBase, and the focused input's 2px outline and label.",
    options: () => ({
      components: {
        MuiButtonBase: {
          styleOverrides: { root: { '&.Mui-focusVisible': { outline: '2px solid var(--mui-palette-control-focus)', outlineOffset: 2 } } },
        },
        MuiOutlinedInput: {
          styleOverrides: { root: { '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mui-palette-control-focus)' } } },
        },
        MuiInputLabel: { styleOverrides: { root: { '&.Mui-focused:not(.Mui-error)': { color: 'var(--mui-palette-control-focus)' } } } },
      },
    }),
  },
  {
    id: 'icon-color',
    area: 'Palette',
    title: 'Icons in the secondary text color',
    why: "MUI draws neutral icons (icon buttons, list item icons, unchecked checkboxes and radios, sort arrows) in `action.active`: black at 54% in light, white in dark, neither a text color. Kilowatt sets `action.active` to the secondary text color in both schemes, so an icon reads as the text beside it does.",
    options: (scheme) => ({ palette: { action: { active: textSteps[scheme].secondary } } }),
  },
  {
    id: 'icon-button-radius',
    area: 'Components',
    components: ['IconButton'],
    title: 'Icon buttons take the theme radius',
    why: "MUI makes icon buttons circles (`border-radius: 50%`), the one button shape that ignores the theme radius. Kilowatt rounds them with `shape.borderRadius` like every other button, so hover, focus and pressed shapes match the buttons beside them.",
    options: () => ({ components: { MuiIconButton: { styleOverrides: { root: { borderRadius: 'var(--mui-shape-borderRadius)' } } } } }),
  },
  {
    id: 'medium-size',
    area: 'Components',
    components: [
      'Autocomplete', 'Button', 'ButtonGroup', 'Checkbox', 'Chip', 'Fab', 'FormControl', 'IconButton', 'Pagination',
      'Radio', 'Rating', 'Select', 'Slider', 'Switch', 'Table', 'TextField', 'ToggleButton', 'ToggleButtonGroup',
    ],
    title: 'Medium size by default',
    why: "MUI offers `small`, `medium` and sometimes `large` and leaves the choice to each screen, so sizes drift from page to page. Kilowatt uses `medium` wherever a component has a `size` prop, and keeps `small` and `large` for one-off instances. Every MUI component already defaults to `medium` except Fab, which defaults to `large`; Fab defaults to `medium` here so the rule holds without passing `size` anywhere.",
    convention: {
      muiDefault: 'Components default to `medium` (Fab to `large`); MUI leaves the size to each screen',
      kilowatt: 'Leave `size` at `medium`, the default; set `small` or `large` only for a one-off instance',
      where: 'Every component with a `size` prop',
    },
    options: () => ({ components: { MuiFab: { defaultProps: { size: 'medium' } } } }),
  },
  {
    id: 'secondary-brand',
    area: 'Palette',
    title: 'Brand blue secondary',
    why: "Secondary is Enertiv's brand blue instead of MUI's purple, on a brand ramp built around #2EA6E1 (step 500). The brand blue itself passes only 2.3:1 as text and 2.7:1 under white text, so secondary uses the brand step that passes in each scheme: 700 in light (with 500, the exact brand blue, as `light`) and 300 in dark. Like the other intents, it passes 4.5:1 as text on every surface, and its contrast text passes on it.",
    options: (scheme) => {
      const { main, light, dark } = secondarySteps[scheme];
      return { palette: { secondary: { main: brand[main], light: brand[light], dark: brand[dark], contrastText: intentContrastText[scheme] } } };
    },
  },
  {
    id: 'chart-palette',
    area: 'Palette',
    title: 'Chart colors',
    why: "MUI's palette has no colors for data. Charts get three roles: `chart.series`, six hues in a fixed order for telling categories apart; `chart.neutral` for what isn't the focus; and `chart.sequential`, the brand ramp, for magnitude. Each series color reaches 3:1 on every surface and stays apart from the others under simulated color-vision deficiencies. Deviation and status reuse the intents. Product meanings (a utility type) map to a series slot in product code, not to a palette color.",
    options: (scheme) => {
      const { series, neutral, sequential } = chartSteps[scheme];
      return { palette: { chart: { series: series.map(chartColor), neutral: chartColor(neutral), sequential: sequential.map(chartColor) } } };
    },
  },
  {
    id: 'map-palette',
    area: 'Palette',
    title: 'Map colors',
    why: "MUI's palette has nothing for a basemap. A map's buildings, road fills and labels take the surface, border and text roles every component uses. Four roles are the map's own, each a step of the surface ramp with no hue that data could be confused with: `map.land`, a step past the page, so the map sits apart from every app surface; `map.water`, a step past the land; and `map.road` and `map.boundary`, for the road casings and boundaries CARTO draws at low zoom, which reach past the water so a zoomed-out map shows structure, not labels alone. Data on a map takes the chart roles.",
    options: (scheme) => ({ palette: { map: mapSteps[scheme] } }),
  },
  {
    id: 'paper-surface-levels',
    components: ['Paper', 'Card', 'Accordion', 'AppBar', 'Snackbar', 'Menu', 'Popover', 'Drawer', 'Dialog'],
    area: 'Components',
    title: 'Paper takes its surface from its elevation',
    why: "Paper's background steps up the surface levels with its elevation, in both schemes, in place of MUI's white light surfaces and its dark-scheme white overlay. Flat Paper and accordions sit on level1, app bars on level2, menus on level3, drawers and dialogs on level4. Cards, outlined or raised, sit on level2, a step above the level1 frame they're laid out on, so a card reads as a surface on the page rather than only its border.",
    options: () => ({
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              ...Object.fromEntries(
                elevationSurfaces.flatMap(({ elevations: [from, to], level }) =>
                  Array.from({ length: to - from + 1 }, (_, index) => [
                    `&.MuiPaper-elevation${from + index}`,
                    { backgroundColor: `var(--mui-palette-background-${level})` },
                  ]),
                ),
              ),
            },
          },
        },
        // Two classes, to outrank the elevation rules above, which a raised card also matches.
        MuiCard: { styleOverrides: { root: { '&.MuiPaper-root': { backgroundColor: 'var(--mui-palette-background-level2)' } } } },
      },
    }),
  },
  {
    id: 'icons',
    components: ['Icon', 'Button', 'IconButton'],
    area: 'Icons',
    title: 'Icon set',
    why: `Google's Material Symbols variable font through MUI's Icon, instead of MUI's SVG icon package, so weight and fill are axes rather than separate icons. Icons render at weight ${iconWeight}, a step lighter than the font's 400, so they sit lighter beside text.`,
    convention: {
      muiDefault: 'SVG icons from @mui/icons-material',
      kilowatt: `MUI's Icon with Material Symbols Outlined at weight ${iconWeight}, through the Icon component in src/icons.tsx`,
      where: 'src/icons.tsx; @mui/icons-material is not installed',
    },
    options: () => ({
      components: {
        MuiIcon: {
          defaultProps: { baseClassName: 'material-symbols-outlined' },
          styleOverrides: {
            // The axes read inherited custom properties, so a selected control can fill
            // the icons inside it and an icon's own fill or weight prop still wins.
            root: { fontVariationSettings: `'FILL' var(--icon-fill, 0), 'wght' var(--icon-weight, ${iconWeight})` },
          },
        },
      },
    }),
  },
  {
    id: 'selected-fills-icons',
    components: [...selectableControls],
    area: 'Components',
    title: 'Selected controls fill their icons',
    why: 'A selected control shows its icon filled and an unselected one outlined, so selection reads from the glyph as well as from the control\'s color. Applies to every MUI control with a selected state; an icon with an explicit fill keeps it.',
    options: () => ({
      components: Object.fromEntries(
        selectableControls.map((control) => [`Mui${control}`, { styleOverrides: { root: { '&.Mui-selected': { '--icon-fill': 1 } } } }]),
      ),
    }),
  },
  {
    id: 'toggle-button-text',
    components: ['ToggleButton'],
    area: 'Components',
    title: 'Unselected toggle buttons use secondary text',
    why: "MUI colors an unselected toggle button's label with `action.active`, the icon color, which reaches only 4.4:1 as text on the page surface (level0). Kilowatt uses `text.secondary`, the text role for secondary labels, which passes 4.5:1 on every surface level in both schemes. Selected and disabled buttons keep MUI's colors.",
    options: () => ({
      components: { MuiToggleButton: { styleOverrides: { root: { color: 'var(--mui-palette-text-secondary)' } } } },
    }),
  },
  {
    id: 'tabular-numerals',
    components: ['Table', 'TablePagination', 'Badge', 'Chip', 'Slider', 'Pagination'],
    area: 'Typography',
    title: 'Tabular numerals where numbers line up or change',
    why: "MUI sets every digit proportionally, so columns of figures don't align and a value shifts sideways as it updates. Kilowatt shows readings, totals and counts everywhere, so the components that hold numbers (table cells, pagination, badges, chips, slider labels) use Roboto's tabular digits, each the same width. Running text keeps proportional digits, which sit better in a sentence.",
    convention: {
      muiDefault: 'Proportional digits everywhere',
      kilowatt: "Tabular digits in the components listed; on any other number that changes or lines up (a KPI, a meter reading, a timer, a column of figures in your own layout), set `sx={{ fontVariantNumeric: 'tabular-nums' }}`",
      where: 'Every number shown as data rather than as part of a sentence',
    },
    options: () => {
      const tabular = { fontVariantNumeric: 'tabular-nums' };
      return {
        components: {
          MuiTableCell: { styleOverrides: { root: tabular } },
          MuiTablePagination: { styleOverrides: { root: tabular } },
          MuiBadge: { styleOverrides: { badge: tabular } },
          MuiChip: { styleOverrides: { label: tabular } },
          MuiSlider: { styleOverrides: { valueLabel: tabular, markLabel: tabular } },
          MuiPaginationItem: { styleOverrides: { root: tabular } },
        },
      };
    },
  },
  {
    id: 'text-wrap',
    area: 'Typography',
    title: 'Balanced headings, pretty body text',
    why: "MUI leaves wrapping to the browser's default, which can strand one word on a heading's last line. Kilowatt sets the heading styles (`h1` to `h6`) to `text-wrap: balance`, which evens out their lines, and the body styles to `text-wrap: pretty`, which avoids a lone word on a paragraph's last line. CssBaseline sets the page in `body1`, so everything inherits `pretty`; browsers without support wrap as before.",
    options: () => ({
      typography: {
        ...Object.fromEntries((['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((variant) => [variant, { textWrap: 'balance' }])),
        body1: { textWrap: 'pretty' },
        body2: { textWrap: 'pretty' },
      },
    }),
  },
  {
    id: 'font-synthesis',
    area: 'Typography',
    title: 'No synthesized bold or italic',
    why: "When a weight or style isn't loaded, browsers fake it by smearing or slanting the nearest one. Kilowatt loads Roboto at 300, 400, 500 and 700 and no italics, so CssBaseline sets `font-synthesis: none` on the page: text renders only in the cuts that exist, and emphasis comes from weight, not a faked slant.",
    options: () => ({ components: { MuiCssBaseline: { styleOverrides: { body: { fontSynthesis: 'none' } } } } }),
  },
  {
    id: 'reduced-motion',
    area: 'Theme',
    title: 'Respect reduced motion',
    why: "MUI's transitions and ripples play whatever the user's system setting says. When someone asks for reduced motion (`prefers-reduced-motion: reduce`), CssBaseline makes every CSS transition, MUI's included, finish at once, stops smooth scrolling, and lets the touch ripple appear without growing or pulsing. Progress indicators and skeletons keep animating, because the motion is how they show that something is loading.",
    options: () => ({
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '@media (prefers-reduced-motion: reduce)': {
              '*, *::before, *::after': { transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },
              '.MuiTouchRipple-ripple, .MuiTouchRipple-child': {
                animationDuration: '0.01ms !important',
                animationIterationCount: '1 !important',
              },
            },
          },
        },
      },
    }),
  },
];
