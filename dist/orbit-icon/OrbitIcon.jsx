'use client';
import { useEffect, useReducer, useRef } from 'react';
import { createOrbitIcon } from './orbitIcon';

/**
 * Enertiv's animated Orbit avatar. Decorative: the canvas is transparent, aria-hidden and ignores pointer events.
 * `state` switches between "idle" and "thinking"; the change blends over the config's blend time.
 */
export function OrbitIcon({ config, state = 'idle', theme = 'system', paused = false, size = 32, style, className }) {
  const ref = useRef(null), inst = useRef(null);
  const resolved = useResolvedTheme(theme);
  useEffect(() => {
    inst.current = createOrbitIcon(ref.current, config, { state, theme: resolved, paused });
    return () => { inst.current?.destroy(); inst.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { inst.current?.setConfig(config); }, [config]);
  useEffect(() => { inst.current?.setState(state); }, [state]);
  useEffect(() => { inst.current?.setTheme(resolved); }, [resolved]);
  useEffect(() => { inst.current?.setPaused(paused); }, [paused]);
  return <canvas ref={ref} aria-hidden="true" className={className}
    style={{ display: 'block', width: size, height: size, pointerEvents: 'none', ...style }} />;
}

function useResolvedTheme(theme) {
  const value = useRef(theme === 'system' ? 'light' : theme);
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    if (theme !== 'system') { value.current = theme; force(); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { value.current = mq.matches ? 'dark' : 'light'; force(); };
    apply(); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  return value.current;
}
