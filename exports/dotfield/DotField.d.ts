import type { CSSProperties } from 'react';

export type Composition = 'tide' | 'band' | 'cluster' | 'coverage' | 'source';

export interface DotFieldPalette {
  /** Dark→light on dark surfaces, light→dark on light surfaces. 3–5 entries. */
  tones: string[];
  /** Fill for the faint scaffolding dots where the field is empty. */
  grid: string;
  /** Optional decorative accent. Kilowatt configs have none. */
  accent?: string;
}

export interface DotFieldConfig {
  composition: Composition;
  seed: number;
  grid: { cell: number; maxDot: number; baseDot: number };
  field: { scale: number; contrast: number; toneSteps: number; speed: number };
  /** Kilowatt configs use palette "chart.sequential"; older configs carry ramp and accentRate. */
  color: { palette?: 'chart.sequential'; ramp?: 'deep' | 'bright'; accentRate?: number; dark: DotFieldPalette; light: DotFieldPalette };
  /** Only for composition "source": a baked luminance grid (0–255), row-major. */
  source?: { cols: number; rows: number; data: number[]; noiseMix?: number; invert?: boolean; file?: string | null };
}

export interface DotFieldProps {
  config: DotFieldConfig;
  /** "system" follows prefers-color-scheme; pass your app's resolved value if it has its own toggle. */
  theme?: 'light' | 'dark' | 'system';
  paused?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function DotField(props: DotFieldProps): JSX.Element;

export interface DotFieldInstance {
  setTheme(theme: 'light' | 'dark'): void;
  setPaused(paused: boolean): void;
  setConfig(config: DotFieldConfig): void;
  destroy(): void;
}
export function createDotField(canvas: HTMLCanvasElement, config: DotFieldConfig, opts?: { theme?: 'light' | 'dark'; paused?: boolean }): DotFieldInstance;

export type DotFieldGroup = { name: string; fill: string; dots: number[] };
/** One frame without drawing it: circles grouped by fill, as flat [x, y, r, …] lists. */
export function fieldFrame(config: DotFieldConfig, width: number, height: number, time: number, palette: DotFieldPalette, luminance?: (cols: number, rows: number) => Float32Array | null): DotFieldGroup[];
export function toneIndexes(count: number, steps: number): number[];
export function bakedLuminance(source: DotFieldConfig['source'], cols: number, rows: number): Float32Array | null;
export const COMPOSITIONS: Record<Exclude<Composition, 'source'>, (u: number, v: number, t: number, scale: number, seed: number) => number>;
