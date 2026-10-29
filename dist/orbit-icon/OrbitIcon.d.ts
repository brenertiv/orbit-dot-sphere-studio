import type { CSSProperties } from 'react';

export type IconState = 'idle' | 'thinking';
export interface IconMotion {
  /** swing: rings rock on the axis · spin: rings keep turning · still: rings hold their tilt */
  style: 'swing' | 'spin' | 'still';
  /** swing only: how far each ring rocks, in degrees either side. */
  amount: number;
  /** spin only: whole turns per loop. */
  turns: number;
  /** Dot spacings each dot travels along its ring per loop (whole numbers keep the loop seamless). */
  drift: number;
  /** 1 or -1 per ring. */
  directions: [number, number, number];
}
export interface OrbitIconConfig {
  type: 'orbit-icon';
  version: 1;
  structure: { dots: number; tilt: [number, number, number]; stagger: [number, number, number] };
  states: { idle: IconMotion; thinking: IconMotion };
  /** Loop length in seconds. */
  loop: number;
  /** Seconds to blend between states. */
  blend: number;
  /** size: base dot diameter as a share of the icon · left/right: multipliers at the left and right edges · minPx: smallest diameter in CSS px · depthFade: 0–1 · noOverlap: shrink dots that would touch */
  dots: { size: number; left: number; right: number; minPx: number; depthFade: number; noOverlap: boolean };
  /** Five tones each, from the step nearest the surface to the furthest (Kilowatt chart.sequential). */
  color: { palette?: string; light: string[]; dark: string[] };
}
export interface OrbitIconProps {
  config: OrbitIconConfig;
  state?: IconState;
  theme?: 'light' | 'dark' | 'system';
  paused?: boolean;
  /** CSS pixels, square. Default 32. */
  size?: number;
  style?: CSSProperties;
  className?: string;
}
export function OrbitIcon(props: OrbitIconProps): JSX.Element;

export interface IconDot { ring: number; index: number; depth: number; cx: number; cy: number; r: number; opacity: number; tone: number }
export function iconDots(config: OrbitIconConfig, seconds: number, blend?: number): { ring: number; index: number; x: number; y: number; z: number }[];
export function iconFrame(config: OrbitIconConfig, size: number, seconds: number, blend?: number): IconDot[];
export interface OrbitIconInstance { setState(state: IconState): void; setTheme(theme: 'light' | 'dark'): void; setPaused(paused: boolean): void; setConfig(config: OrbitIconConfig): void; destroy(): void }
export function createOrbitIcon(canvas: HTMLCanvasElement, config: OrbitIconConfig, opts?: { state?: IconState; theme?: 'light' | 'dark'; paused?: boolean }): OrbitIconInstance;
