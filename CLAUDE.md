# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server. Open `http://localhost:5173/THREE-JS-NFL-Flight-Paths/` (the base path is the repo name; override with `VITE_BASE`).
- `npm run build` / `npm run preview` — production build to `dist/`, served at port 4173.
- `npm run deploy` — manual gh-pages publish. Pushes to `main` also auto-deploy via `.github/workflows/deploy.yml`.

No tests, no linter — verification is visual via the dev server.

## Architecture notes

The README's "How it works" section is the source of truth for the module map. Worth knowing on top of it:

- **Schedule rows are `{ week, away, home, venue? }`.** `venue` is a key into `INTERNATIONAL_VENUES` (`src/data/teams.js`). When a row has a `venue`, **both** teams get a travel leg (`schedule.js:buildTravelLegs`) — neither plays at home.
- **Theme switches never rebuild geometry.** `applyThemeToGlobe` / `applyThemeToPaths` / `applyThemeToLights` repaint textures, swap shader uniforms, and update colors in place. A new theme-aware element must extend both `THEMES.light` and `THEMES.dark` in `src/themes.js` and be routed through the existing `applyThemeTo*` functions.
- **Travelers use pre-sampled point arrays + lerp** (`paths.js:tickTravelers`) — no curve allocation per frame. Per-leg start phase is deterministic via `pseudoRandomPhase`, so the same schedule always animates the same.
- **First-paint theme.** `index.html` runs an inline script that reads `localStorage["nfl-flight-paths-theme"]` and sets `data-theme` on `<html>` before any module loads, to avoid a flash.

## Conventions

- Match the gitmoji-prefixed commit style in `git log` (`🎨` style/refactor, `🔧` config, `✨` feature, `📝` docs, `🐛` fix).
- Three.js reference skills are installed under `.claude/skills/threejs-*` — reach for them when working with Three APIs.
