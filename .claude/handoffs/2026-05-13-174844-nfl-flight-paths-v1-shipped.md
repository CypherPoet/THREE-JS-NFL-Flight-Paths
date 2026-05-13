# 🤝 Handoff: NFL Flight Paths globe — v1 shipped, awaiting 2026 full slate

## 🧾 Session Metadata
- Created: 2026-05-13T17:48:44Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch: main
- Live URL: https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/
- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths

### Recent Commits (for context)
  - 48272dd Dark mode, animated travelers, more elevation, spirited typography
  - 8b395d7 Wire up the 2026 confirmed slate as the primary view
  - 902ca6f Initial commit: NFL Flight Paths globe

## 🔗 Handoff Chain

- **Continues from**: None (fresh start)
- **Supersedes**: None

> This is the first handoff for this task.

## 📍 Current State Summary

A complete, deployed Three.js scene that visualises every NFL team's road-game flight paths as great-circle arcs on a clay-styled globe. The session built the project from scratch through three iterations: (1) initial 2025 sample-slate version, (2) swap to 2026 confirmed-slate as the primary view (12 publicly-announced games as of 2026-05-13), (3) polish pass — dark mode, animated arc travelers, more pronounced land elevation, Fraunces + Space Grotesk typography, renamed skill, repo topics. v1 is live and verified. **The 2026 full slate unveils 2026-05-14 8 PM ET (tomorrow); the immediate next step is appending the remaining ~245 games to `src/data/schedule-2026.js`** once it drops.

## 🧠 Codebase Understanding

### Architecture Overview

Single-page Vite + Three.js app. No backend, no router. One scene with a globe Group at origin, OrbitControls for the camera, an animation loop ticking arc travelers. Data flows: `src/data/teams.js` + `src/data/schedule-{year}.js` → `src/schedule.js` builds travel legs → `src/paths.js` builds one `Line` + one animated `Group` (traveler) per leg → mounted under the globe group so they rotate with it. The team panel + season toggle + theme toggle live in plain DOM and call back into the scene.

Globe geometry is a `SphereGeometry` whose diffuse and bump maps are painted at runtime onto offscreen `<canvas>` elements via `d3-geo`'s equirectangular projection. This avoids polygon-triangulation artefacts and gives real country relief.

Themes (`src/themes.js`) hold every theme-dependent colour for the scene: sphere, land/ocean canvas fills, country line colours, limb tint, ambient/key/rim/fill light colours + intensities, ground shadow gradient stops, and a `travelerEmissiveBoost` for the additive glow halos. Toggle calls `applyThemeToGlobe()` (repaints the bump + diffuse canvases, swaps textures on the existing sphere material — no geometry rebuilt) plus `applyThemeToPaths()` plus `applyThemeToLights()`.

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `src/data/schedule-2026.js` | Confirmed 2026 games | **Append-only** when the full slate drops 2026-05-14 |
| `src/data/schedule-2025.js` | Full 2025 reference slate (256 games) | Don't touch — kept as a comparison view |
| `src/data/teams.js` | 32 teams + international venues, coords, accent colours | Add venues here if 2026 introduces new ones |
| `src/schedule.js` | `SCHEDULES` registry, `buildTravelLegs`, `summariseByTeam` | Add a new season by adding a key to `SCHEDULES` |
| `src/globe.js` | Sphere + canvas-painted maps + country lines + shadow disc; theme-aware via `applyThemeToGlobe` | Globe styling lives here |
| `src/paths.js` | Arc lines + home/away markers + animated travelers; `tickTravelers` called per frame | Animation knobs are constants at top of file |
| `src/themes.js` | Light + dark palettes; `getInitialTheme`, `persistTheme` | Add a third theme here if needed |
| `src/main.js` | Scene wiring, OrbitControls, season switcher, theme switcher, animation loop | Single entry point |
| `index.html` | Topbar, panel markup, theme toggle button, inline pre-paint theme script | Inline `<script>` resolves theme before paint to avoid flash |
| `vite.config.js` | `base: '/THREE-JS-NFL-Flight-Paths/'` so GitHub Pages sub-path works | Override with `VITE_BASE` env if forking |
| `.github/workflows/deploy.yml` | Pages deploy on push to main | Already wired |
| `data/countries-110m.json` | Natural Earth world topology | Vite bundles it as a static asset via `new URL('../data/...', import.meta.url)` |

### Key Patterns Discovered

1. **Bake-to-canvas for country shapes** — painting GeoJSON with `d3-geo` onto a 2D canvas then using that canvas as both colour and bump map is much cleaner than triangulating polygons onto a sphere. Tried the fan-triangulation route first (visible facets, especially for concave countries like Norway). The canvas approach renders smoothly at any zoom.

2. **Phase offsets on the traveler animation** — without `pseudoRandomPhase(leg)` derived from team+week+coords, all 22+ travelers depart simultaneously. With phase offsets they form a continuous procession. The phase is deterministic so the same schedule animates the same on every load.

3. **Cycle duration scales with arc length, not is constant** — short divisional trips loop fast, transcontinental hops loop slow. `cycleSeconds = max(2.2, arcAngle / TRAVELER_SPEED_PER_RADIAN)` keeps the visual speed roughly consistent.

4. **Theme switching repaints, doesn't rebuild** — `applyThemeToGlobe` swaps textures on the existing `MeshStandardMaterial` and updates colours on the existing `LineBasicMaterial` instead of recreating geometries. Avoids a hitch on toggle.

5. **Neutral-site games count as legs for both teams** — see `src/schedule.js#buildTravelLegs`. A London game shows as PIT→LON *and* NO→LON.

## 🏁 Work Completed

### Tasks Finished

- [x] Local Vite + Three.js scaffold with GitHub Pages base path
- [x] NFL team data + stadium coordinates + accent colours (all 32 teams)
- [x] 2025 sample-slate schedule (~256 games + 8 international fixtures)
- [x] Clay globe with d3-geo painted land + bump-map relief + ground shadow disc
- [x] Great-circle arcs with arch-height scaling by distance
- [x] OrbitControls drag/zoom with polar limits
- [x] Team filter panel (click/toggle/solo), sorted by total miles
- [x] League-wide + selected-subset mileage totals in header
- [x] 2026 confirmed slate (12 games verified from public NFL announcements)
- [x] 2026 ↔ 2025 toggle in the top bar
- [x] Dark-mode palette + sun/moon toggle + localStorage persistence
- [x] Animated travelers (one per arc) with additive-glow halos + pulse
- [x] More pronounced land elevation (`bumpScale` 0.012 → 0.022/0.024)
- [x] Fraunces + Space Grotesk + JetBrains Mono typography
- [x] Renamed `.claude/skills/capture-museum-media` → `capture-presentational-media`
- [x] GitHub repo topics set (13 topics)
- [x] README in CypherPoet APOD style with light + dark screenshots
- [x] MIT LICENSE
- [x] GitHub Actions workflow deploying on push to main
- [x] Live on GitHub Pages, verified in both themes

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| Everything | Built from scratch this session | Fresh project — see `git log` for the three commit chunks |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Bake countries to a 2D canvas as colour + bump maps | (a) Triangulate polygons onto sphere, (b) MeshLine extrude, (c) canvas paint | Canvas paint via d3-geo gives smooth land outlines with real relief and zero triangulation artefacts; tried (a) first and saw visible facets on concave countries |
| 2026 slate as default, 2025 as toggle | (a) 2025 only with TODO for 2026, (b) 2026 only with stub, (c) registry with both | Registry future-proofs adding seasons; 2025 stays as a denser reference view while 2026 fills in |
| Vendored threejs-* skills locally instead of skill installer | Use skills-lock.json to fetch | The repo with skills is private and the local skills installer doesn't support private GitHub repos cleanly. Vendored copies are pinned and reviewable. |
| Animation: pellet + additive halo, no plane SVG/model | (a) loaded GLB plane model, (b) instanced mesh, (c) simple Mesh per leg | Per-leg `Group` with a sphere + glow is trivial perf for ~25 arcs and keeps the visual abstract — "a dot is the flight" — which matches the data-viz tone |
| Pre-paint theme resolution via inline `<script>` | (a) Default to light + flicker, (b) inline script | Inline script reads localStorage + `prefers-color-scheme` *before* the first frame paints, eliminating the dark→light flash for dark-mode users |
| Renderer.toneMapping = NoToneMapping | ACESFilmic, Linear, None | ACES made the off-white sphere look amber under any directional light. With `NoToneMapping` + neutral white lights, the sphere stays at its painted hue |

## 🚧 Pending Work

### Immediate Next Steps

1. **Tomorrow (2026-05-14) after 8 PM ET**: Append the remaining ~245 games to `src/data/schedule-2026.js`. Same row shape as the existing entries: `{ week, away, home, venue? }`. International venues are already defined in `src/data/teams.js` — only add new ones if a venue not currently listed appears in the slate. Then `git add` + commit + push, and the Actions workflow will redeploy.
2. **Optional verification once the full 2026 slate is wired**: visit the live site, toggle to 2026, and confirm every team has a non-zero mileage total (the team panel is sorted by miles descending — anything still at 0 mi means that team has no away games in the schedule, which would be a data bug).
3. **Optional polish**: add a hover-tooltip on arcs/markers showing the matchup + week. The `userData` is already attached to each line and marker — just need a raycaster + DOM tooltip element (a `.tooltip` class already exists in styles.css, unused).

### Blockers/Open Questions

- None blocking. The visualisation works end-to-end against confirmed data; the 2026 full slate is the one missing input and it's released on a known date.

### Deferred Items

- **Hover tooltips** — pattern is set up (CSS `.tooltip` class, `userData` on every mesh) but not wired to a raycaster.
- **Walkthrough video** — the `capture-presentational-media` skill describes a Playwright-Node-API recording pipeline but it wasn't run for this project (only stills captured). Would be a nice addition for the README.
- **Per-week filter / time scrubber** — every leg already carries `week: number`; would be straightforward to add a week slider.
- **NFC vs AFC quick-select** — division metadata is on every team in `teams.js`; could add division-level group selection to the panel.

## 💡 Context for Resuming Agent

### Important Context

- **The 2026 slate releases 2026-05-14 8 PM ET.** This is the entire point of the project. Verify the date in your system clock before assuming you need to do something else — if it's already past that timestamp and the user is asking you to update, append rows to `src/data/schedule-2026.js` from the official source (`nfl.com/news/2026-nfl-schedule-release/...` or similar). Schema is documented inline in that file.
- **Don't replace `schedule-2025.js`.** It's intentionally kept as a reference slate accessible via the 2025 toggle.
- **Theme is theme-aware everywhere**: scene background, lighting rig, globe textures, bump maps, ground shadow gradient, UI chrome. Adding new visual elements requires extending `THEMES` in `src/themes.js` and respecting the theme in any custom code.
- **The repo is public** (was inadvertently flipped to private mid-session, which disabled Pages on the free plan — flipped back to public + re-enabled Pages via `gh api`). If you see "Pages plan not supported" errors, check visibility first with `gh api repos/CypherPoet/THREE-JS-NFL-Flight-Paths --jq '.visibility'`.
- **`new URL('../data/countries-110m.json', import.meta.url)` in `src/main.js`** is how the TopoJSON is loaded — Vite handles it as a build-time asset reference. If the path changes, the file moves with it.

### Assumptions Made

- 2026 international games are exactly the 9 announced fixtures (Melbourne, Rio, three London, Paris, Madrid, Munich, Mexico City). If the league adds another international game in the May 14 release, add a new venue to `src/data/teams.js` `INTERNATIONAL_VENUES` and a row to `schedule-2026.js`.
- The two-team-fly-in treatment for neutral-site games is correct for the visualisation (both teams' arcs render).
- Brand accent colours are the franchises' published primary colours. Some choices (Cleveland's `#311D00` brown, Las Vegas's `#000000` black) are intentionally dark and may need a dark-mode override if a user complains they're invisible against the navy globe — currently they appear fine because of the additive glow halo, but worth knowing.
- The 12-row 2026 schedule includes only games the NFL has officially confirmed pre-release. Some media reports speculate other early games — those are excluded until the league announces them.

### Potential Gotchas

- **Theme is persisted in localStorage at key `"nfl-flight-paths-theme"`**. Clearing it falls back to `prefers-color-scheme`. Tests may want to clear this between runs.
- **The `playwright-cli` snapshot refs (e3, e27, …) regenerate every call.** When scripting screenshots, run a fresh `snapshot --raw | grep` immediately before each click — don't paste literal refs from earlier in a session.
- **`playwright-cli` screenshot output goes under the project root by default**; it refuses to write to `/tmp/`. Save to `media/_debug-*.png` and `trash` them when done.
- **Vite preview at :4173 is a different origin from dev at :5173**, so localStorage doesn't carry across. Don't be confused if theme resets when switching between them.
- **Country borders use a coastline polygon mesh from world-atlas/countries-110m**. It includes country *borders* but not internal subdivisions (US states, Canadian provinces). If the user asks for state-level borders we'd need a different topology.

## 🌐 Environment State

### Tools/Services Used

- **Node 24.14.1 / npm 11.11.0** — `npm run dev` (port 5173) / `npm run build` / `npm run preview` (port 4173)
- **Three.js r169** (`three@^0.169.0`)
- **d3-geo + topojson-client** for canvas painting
- **gh CLI** (logged in as CypherPoet via SSH/keyring) for repo/pages management
- **playwright-cli 0.1.8** for screenshots
- **GitHub Pages** (Actions source, deploy on push to main)

### Active Processes

- No long-running processes were left running. Dev/preview servers were killed at end of session (`lsof -ti:5173 :4173 | xargs kill -9`). Playwright sessions closed with `playwright-cli close-all`.

### Environment Variables

- `VITE_BASE` — optional; overrides Vite's `base` config for forks/PR previews. Default `'/THREE-JS-NFL-Flight-Paths/'`.

## 📚 Related Resources

- Live: https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/
- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths
- Reference image: `docs/references/globe-concept-01.png`
- Style reference repo (README + skill pattern): https://github.com/CypherPoet/THREE-JS-APOD-Air-and-Space-Museum
- Source of threejs-* skills: https://github.com/CypherPoet/private-custom-agent-skills/tree/add-threejs-skills (private)
- 2026 international games announcement: https://www.nfl.com/news/2026-nfl-schedule-release-nine-international-games-dates-times-matchups
- World topology source: https://github.com/topojson/world-atlas (`countries-110m.json`)

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
