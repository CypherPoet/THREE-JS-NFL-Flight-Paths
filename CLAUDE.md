# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server. Open `http://localhost:5173/THREE-JS-NFL-Flight-Paths/` (the base path is the repo name; override with `VITE_BASE`).
- `npm run build` / `npm run preview` — production build to `dist/`, served at port 4173.
- `npm run deploy` — manual gh-pages publish. Pushes to `main` also auto-deploy via `.github/workflows/deploy.yml`.
- `npm test` / `npm run test:run` — Vitest. Watch mode and one-shot, respectively. Suite covers `src/geo.js` math, `src/schedule.js` data shape, the team-panel ARIA state machine (`src/ui.js` via happy-dom), and cross-file presentational sync.
- `npm run media:derive` — regenerate `public/og-image.png` from `media/04-dark-hero.png` (needs ImageMagick `magick`). Idempotent.
- `npm run media:check` — alias for `vitest run tests/presentational-sync.test.mjs`; asserts `styles.css --bg` ↔ `index.html` theme-color ↔ `site.webmanifest` colors stay in sync, and `og-image.png` matches the latest hero crop. Run after any palette change.

Full-scene rendering (Three.js, WebGL) is still verified visually via the dev server — Vitest browser mode is a future addition. No linter yet.

## Architecture notes

Source modules live in `src/` — `ls src/` for the current map. Worth knowing on top of that:

- **Schedule rows are `{ week, away, home, venue? }`.** `venue` is a key into `INTERNATIONAL_VENUES` (`src/data/teams.js`). When a row has a `venue`, **both** teams get a travel leg (`schedule.js:buildTravelLegs`) — neither plays at home.
- **Theme switches never rebuild geometry.** `applyThemeToGlobe` / `applyThemeToPaths` / `applyThemeToLights` repaint textures, swap shader uniforms, and update colors in place. A new theme-aware element must extend both `THEMES.light` and `THEMES.dark` in `src/themes.js` and be routed through the existing `applyThemeTo*` functions.
- **Travelers use pre-sampled point arrays + lerp** (`paths.js:tickTravelers`) — no curve allocation per frame. Per-leg start phase is deterministic via `pseudoRandomPhase`, so the same schedule always animates the same.
- **First-paint theme.** `index.html` runs an inline script that reads `localStorage["nfl-flight-paths-theme"]` and sets `data-theme` on `<html>` before any module loads, to avoid a flash.

## Conventions

- Three.js reference skills are installed under `.claude/skills/threejs-*` — reach for them when working with Three APIs.
- Session handoffs live in `.claude/handoffs/` (latest file = current state, chained via "Continues from"). Use the `session-handoff` skill to read/write them.
- **Presentational sync.** `styles.css --bg` is the single source of truth for chrome color; `index.html` `theme-color` metas and `public/site.webmanifest` mirror it. `public/og-image.png` is derived from `media/04-dark-hero.png`. When `--bg` or the dark-hero shot changes, run `npm run media:check` — it surfaces drift with a precise diff. `npm run media:derive` regenerates the OG image; manifest/meta colors are hand-edited from the diff. The `capture-presentational-media` skill runs both at the end of its loop, so a full skill invocation leaves the tree green.
