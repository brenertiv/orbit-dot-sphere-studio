# Orbit Icon — animated avatar for React

Copy the orbit-icon folder into your React application. React 18+ is the only peer dependency; there is no CSS file or install step.

```jsx
import { OrbitIcon } from './orbit-icon/OrbitIcon';
import icon from './orbit-icon/orbit-icon-config';

<OrbitIcon config={icon} state={isThinking ? 'thinking' : 'idle'} theme="system" size={32} />
```

## States

`state` is "idle" or "thinking". Changing it blends the motion over the config's blend time, so the avatar can follow the chat (idle while waiting, thinking while working) without a jump. Both states loop seamlessly.

## Appearance

The canvas is transparent, decorative (aria-hidden) and ignores pointer events: give the parent a background or a circular crop. `size` is in CSS pixels (default 32). Dot sizes, the smallest dot and the no-overlap rule are applied at that size, so the icon stays legible small.

`theme="system"` follows the operating system. If your app has its own theme toggle, pass its resolved "light" or "dark". Colours come from Kilowatt's chart.sequential and are stored in the config for both schemes.

`paused` freezes the icon. Reduced motion shows a still frame of the current state. Animation also stops while the icon is offscreen or the tab is hidden.

## Files

- OrbitIcon.jsx, OrbitIcon.d.ts — the React component ('use client'; SSR-safe)
- orbitIcon.js — the dependency-free renderer (createOrbitIcon, iconFrame)
- orbit-icon-config.js — the design you exported

Edit the design in Kilowatt Studio (Icon tab), then export again.
