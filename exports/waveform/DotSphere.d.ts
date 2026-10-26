import type { CSSProperties, ReactElement } from 'react';
export interface SphereConfig {
  version: number;
  seed: number;
  points: number[];
  colors: number[];
  sizes: number[];
  links: number[];
  appearance: { size: number; lineOpacity: number; depth: number };
  motion: { speed: number; deformation: number; pulse: number; axis?: 'x' | 'y' | 'z' | 'tumble'; direction?: 1 | -1; driftSpeed?: number; pulseSpeed?: number; breathing?: number; breathSpeed?: number; waveHeight?: number; waveFrequency?: number; waveSpeed?: number; twist?: number };
  themes: Record<'light' | 'dark', { colors: string[]; line: string }>;
}
export interface DotSphereProps {
  config: SphereConfig;
  theme?: 'light' | 'dark' | 'system';
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}
export declare function DotSphere(props: DotSphereProps): ReactElement;
