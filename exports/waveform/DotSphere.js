'use client';
import { createElement, useEffect, useRef } from 'react';
import { createSphere } from './sphere.js';

/** Decorative sphere. Give its container a width; the default aspect ratio is 1:1. */
export function DotSphere({ config, theme = 'system', paused = false, className, style }) {
  const canvas = useRef(null);
  const renderer = useRef(null);
  const initial = useRef({ config, theme, paused });
  useEffect(() => {
    renderer.current = createSphere(canvas.current, initial.current.config, initial.current);
    return () => { renderer.current?.destroy(); renderer.current = null; };
  }, []);
  useEffect(() => { renderer.current?.update(config, { theme, paused }); }, [config, theme, paused]);
  return createElement('canvas', {
    ref: canvas, className, 'aria-hidden': true,
    style: { display: 'block', width: '100%', aspectRatio: '1', pointerEvents: 'none', ...style }
  });
}
