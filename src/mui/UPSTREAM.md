# Kilowatt theme

Copied unchanged from https://github.com/brenertiv/project-kilowatt-ui at commit
`922fe51f3dfd8b7bede8d7c2cf484f202792a728` on 2026-10-28:

- theme.ts, departures.ts, colors.ts, augmentation.ts, MuiProvider.tsx
- ../icons.tsx

Documentation: https://kilowatt-ui.vercel.app/mcp

Refresh these files from upstream together. App-specific layout belongs in
src/App.jsx, using MUI components and semantic theme roles. Dot palette swatches
are user design data, not UI theme colors. All Kilowatt dependencies are confined
to the studio bundle; dist/runtime and downloaded React packages remain separate.

The Dot Field generator (src/dotfield) renders under the same MuiProvider and Icon,
and reads its illustration colours from the theme (chart.sequential, border.level2,
background.level0), so refreshing these files recolours it too.
