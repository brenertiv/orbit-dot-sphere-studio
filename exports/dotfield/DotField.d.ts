import type { CSSProperties } from 'react';

export type Composition = 'tide' | 'band' | 'cluster' | 'coverage' | 'source';

export interface DotFieldPalette {
  /** Dark→light on dark surfaces, light→dark on light surfaces. 3–5 entries. */
  tones: string[];
  /** Fill for the faint scaffolding dots where the field is empty. */
  grid: string;
  /** Sparse decorative accent (green). */
  accent: string;
}

export interface DotFieldConfig {
  composition: Composition;
  seed: number;
  grid: { cell: number; maxDot: number; baseDot: number };
  field: { scale: number; contrast: number; toneSteps: number; speed: number };
  color: { ramp: 'deep' | 'bright'; accentRate: number; dark: DotFieldPalette; light: DotFieldPalette };
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
