'use client';
import { useEffect, useReducer, useRef } from 'react';
import { createDotField } from './dotfield';

/**
 * Decorative dot-field illustration. The canvas is transparent and aria-hidden;
 * give its parent a background. Defaults to a 4:3 box filling its container's width.
 */
export function DotField({ config, theme = 'system', paused = false, style, className }) {
  const ref = useRef(null);
  const inst = useRef(null);
  const resolved = useResolvedTheme(theme);

  useEffect(() => {
    if (!ref.current) return;
    inst.current = createDotField(ref.current, config, { theme: resolved, paused });
    return () => { inst.current?.destroy(); inst.current = null; };
    // config identity changes are handled below without remounting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { inst.current?.setConfig(config); }, [config]);
  useEffect(() => { inst.current?.setTheme(resolved); }, [resolved]);
  useEffect(() => { inst.current?.setPaused(paused); }, [paused]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', pointerEvents: 'none', ...style }}
    />
  );
}

function useResolvedTheme(theme) {
  const ref = useRef(theme === 'system' ? 'light' : theme);
  const [, force] = useForceRender();
  useEffect(() => {
    if (theme !== 'system') { ref.current = theme; force(); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { ref.current = mq.matches ? 'dark' : 'light'; force(); };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  return ref.current;
}

function useForceRender() { return useReducer((x) => x + 1, 0); }
