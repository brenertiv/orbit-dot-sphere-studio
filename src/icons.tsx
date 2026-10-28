import MuiIcon, { type IconProps as MuiIconProps } from '@mui/material/Icon';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * The icon names Kilowatt uses: Material Symbols ligatures. Add a name here to
 * use a new icon; `name` only accepts these, so a typo is a type error rather
 * than a word on screen. Browse the set at https://fonts.google.com/icons.
 */
export const iconNames = [
  'account_balance',
  'account_circle',
  'account_tree',
  'add',
  'add_circle',
  'apartment',
  'arrow_back',
  'arrow_downward',
  'arrow_drop_down',
  'arrow_outward',
  'arrow_right_alt',
  'arrow_upward',
  'assignment',
  'badge',
  'bar_chart',
  'bolt',
  'business',
  'chat',
  'check',
  'check_circle',
  'chevron_left',
  'chevron_right',
  'circle',
  'close',
  'close_small',
  'contact_page',
  'content_copy',
  'dark_mode',
  'dashboard',
  'date_range',
  'delete',
  'density_medium',
  'density_small',
  'description',
  'desktop_windows',
  'devices',
  'diamond',
  'dock_to_right',
  'domain',
  'download',
  'edit',
  'edit_square',
  'electric_bolt',
  'engineering',
  'error',
  'event',
  'expand_all',
  'expand_more',
  'filter_alt_off',
  'filter_list',
  'fit_screen',
  'folder',
  'folder_open',
  'format_list_bulleted',
  'fullscreen',
  'fullscreen_exit',
  'group',
  'handyman',
  'help',
  'history',
  'home_work',
  'image',
  'inbox',
  'info',
  'keyboard_arrow_right',
  'laptop',
  'layers',
  'left_panel_close',
  'left_panel_open',
  'light_mode',
  'lightbulb',
  'link',
  'lock',
  'logout',
  'map',
  'menu',
  'more_horiz',
  'notifications',
  'payments',
  'person',
  'picture_in_picture_small',
  'push_pin',
  'receipt_long',
  'refresh',
  'remove',
  'report',
  'restart_alt',
  'right_panel_close',
  'right_panel_open',
  'save',
  'savings',
  'schedule',
  'search',
  'send',
  'settings',
  'share',
  'show_chart',
  'smart_toy',
  'smartphone',
  'speed',
  'storefront',
  'table_rows',
  'tablet',
  'task_alt',
  'trending_down',
  'trending_up',
  'tune',
  'unfold_more',
  'verified',
  'view_column',
  'visibility',
  'visibility_off',
  'warehouse',
  'warning',
  'web_traffic',
  'workspace_premium',
] as const;

export type IconName = (typeof iconNames)[number];

/** The `wght` axis every icon renders at unless it passes `weight`. Set in the theme (src/mui/departures.ts). */
export const iconWeight = 300;

export type IconProps = Omit<MuiIconProps, 'children' | 'baseClassName'> & {
  /** The Material Symbols ligature to show. */
  name: IconName;
  /** Filled glyph (the `FILL` axis). Unset, the icon is outlined, or filled when its control is selected. */
  fill?: boolean;
  /** Weight on the `wght` axis. Defaults to 300. */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
};

/**
 * An icon from Material Symbols Outlined, Google's variable icon font, rendered
 * by MUI's `Icon`. The theme sets the font and its default axes, so size and
 * color are MUI's own props: `fontSize` (`small`, `medium`, `large`, `inherit`)
 * and `color` (a palette intent). Decorative (`aria-hidden`); an icon-only
 * control needs its own `aria-label`.
 *
 * @summary A Material Symbols icon by name, with fill and weight.
 * @import import { Icon } from 'src/icons';
 */
export function Icon({ name, fill, weight, sx, ...props }: IconProps) {
  const axes: SxProps<Theme> = {
    ...(fill === undefined ? {} : { '--icon-fill': fill ? 1 : 0 }),
    ...(weight === undefined ? {} : { '--icon-weight': weight }),
  };
  return (
    <MuiIcon translate="no" sx={[axes, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
      {name}
    </MuiIcon>
  );
}
