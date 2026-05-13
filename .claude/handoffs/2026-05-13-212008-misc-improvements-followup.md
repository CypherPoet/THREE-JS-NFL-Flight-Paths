# 🤝 Handoff: NFL Flight Paths — misc polishes (sans type, atmosphere, US framing) shipped, awaiting full 2026 slate

## 🧾 Session Metadata
- Created: 2026-05-13T21:20:08Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch: main
- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths (PRIVATE — see "Important Context")
- Live URL: ⚠️ OFFLINE — repo is private, GitHub Pages won't serve from a private repo on the free plan. Was live last session, intentionally taken offline this session.

### Recent Commits (for context)
  - c8b66ac US-centered framing, sans typography, atmosphere halo, toggle fix, deps refresh
  - d022c4b Add CLAUDE.md, handoff doc, and data-visualization skill
  - 48272dd Dark mode, animated travelers, more elevation, spirited typography
  - 8b395d7 Wire up the 2026 confirmed slate as the primary view
  - 902ca6f Initial commit: NFL Flight Paths globe

## 🔗 Handoff Chain

- **Continues from**: [2026-05-13-174844-nfl-flight-paths-v1-shipped.md](./2026-05-13-174844-nfl-flight-paths-v1-shipped.md)
  - Previous title: NFL Flight Paths globe — v1 shipped, awaiting 2026 full slate
- **Supersedes**: None

> Review the previous handoff for full project context (architecture, data flow, build patterns). This handoff only documents the deltas from this session.

## 📍 Current State Summary

A polish session on top of v1. Three feedback loops with the user:

1. **First pass** — sans-serif typography, real elevation heightmap, slower travelers, dark-mode atmosphere glow, GitHub repo flipped to private.
2. **Second pass** — user judged the relief still flat and the atmosphere just a flat ring. Reference image attached. Added `displacementMap` with proper Fresnel-gradient atmosphere shader (fixed a shader bug where back-side `dot(N, V) ≤ 0` always, so the `1 - max(dot, 0)` rim factor was constant 1 across the entire annulus).
3. **Third pass** — user dropped elevation entirely (markers were being buried inside displaced mountains), asked for US-centered default framing, reported a select-toggle bug. All three addressed and pushed in `c8b66ac`.

Also bumped dependencies: `three 0.169 → 0.184`, `vite 5.4 → 8.0`. Both required tiny migrations (Clock → Timer, PCFSoftShadowMap → PCFShadowMap). Build/dev both clean.

**The 2026 full slate is still the load-bearing missing data** — same as previous handoff. Was supposed to drop 2026-05-14 8 PM ET (tomorrow as of this writing).

## 🧠 Codebase Understanding

### Architecture Overview

No structural changes from previous handoff — same Vite + Three.js single-page app, same scene wiring, same data registry. The session was entirely about visual polish + bugfixes + dependency hygiene.

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `src/data/schedule-2026.js` | Confirmed 2026 games (still only ~12 pre-release entries) | **Still the immediate next-step** when the full slate drops |
| `src/globe.js` | Sphere + canvas-painted diffuse + country lines + ground shadow + **Fresnel-gradient atmosphere shader** | Atmosphere shader logic lives in `makeAtmosphere()` |
| `src/themes.js` | Theme palettes — added `glowInnerColor`, `glowOuterColor`, `glowIntensity`; **removed** `bumpScale`, `displacementScale`, `bumpOcean`, `bumpLand`, `bumpCoast` | Add atmosphere colour tunables here |
| `src/paths.js` | Arc travelers — `TRAVELER_SPEED_PER_RADIAN` 0.42 → 0.22, `TRAVELER_MIN_CYCLE_SECONDS` 2.2 → 4.5 | Animation speed knobs at top of file |
| `src/main.js` | Scene wiring — `globe.group.rotation = { x: 0.58, y: 0.10 }` for US framing; Timer replaces Clock | Camera/framing defaults live here |
| `src/ui.js` | Team panel — toggle logic now strictly toggles (no more "click soloed team to re-select all" branch) | Selection semantics |
| `index.html` / `styles.css` | Bricolage Grotesque variable sans-serif for display, Space Grotesk for UI body, JetBrains Mono for figures | Typography |

### Key Patterns Discovered

1. **Back-side Fresnel shaders need inverted math.** A back-side sphere only renders far hemisphere faces, where `dot(N, V) ≤ 0` *always*. The classic `1 - max(dot(N, V), 0)` rim formula collapses to a constant `1` across the entire visible annulus, producing a uniform-brightness ring rather than a gradient. The fix: use `-dot(N, V)` (or normalize as `clamp(-dot(N, V) / maxValue, 0, 1)`), which gives a true gradient — brightest at the inner annulus edge (touching the planet), fading to the outer shell silhouette. Burnt an iteration figuring this out — see `src/globe.js#makeAtmosphere`.

2. **`displacementMap` does work in Three.js, but you need enough segments AND visible terrain.** With 256 segments and `displacementScale 0.05`, the Andes are essentially invisible because most of the planet is ocean (zero displacement). Cranking the segment count to 512 + scale to 0.25 showed dramatic relief, but `1.0 + 0.12 = 1.12` displaced peaks then buried the home-stadium markers at `1.012 × GLOBE_RADIUS`. **The data-viz markers + elevation displacement are mutually exclusive** unless you also lift every marker above the max displacement height.

3. **Three.js Timer API.** `THREE.Clock` is deprecated as of r170+. Replacement is `THREE.Timer` (exported from core). API:
   ```js
   const timer = new THREE.Timer();
   timer.connect(document);     // Page Visibility API — pauses delta growth when tab hidden
   // In animate():
   timer.update();
   const delta = timer.getDelta();
   const elapsed = timer.getElapsed();
   ```

4. **Vite 8 uses Rolldown.** The chunk-size warning now references `build.rolldownOptions.output.codeSplitting` instead of `rollupOptions`. Vite 5 → 8 build time roughly halved on this project (630ms → 332ms). No config changes were needed.

## 🏁 Work Completed

### Tasks Finished

- [x] Swap Fraunces (serif) for Bricolage Grotesque (variable sans-serif with `opsz`/`wdth`/`wght` axes)
- [x] Slow arc travelers (`TRAVELER_SPEED_PER_RADIAN` 0.42 → 0.22; `MIN_CYCLE_SECONDS` 2.2 → 4.5)
- [x] **Iteration 1 (later reverted)** — Wire real Natural Earth III elevation heightmap as `bumpMap` + `displacementMap`, with key-light angle lowered for grazing terrain shadows
- [x] Add dark-mode atmospheric glow — Fresnel shader, two-stop gradient (bright cyan-white hot edge → deep blue halo → fade), wide 1.18× shell
- [x] Fix the shader rim-factor bug (the wide gradient that looked like a flat ring before)
- [x] **Iteration 2 (the final state)** — Drop elevation entirely; revert sphere to 128-segment smooth geometry; revert key-light angle; trash the `public/textures/earth-elevation-bump.jpg` asset
- [x] Default camera framing centered on the contiguous US (`rotation.x = 0.58, rotation.y = 0.10`)
- [x] Fix team-panel toggle bug — clicking the only-active team no longer triggers "re-select everything"
- [x] Lighten dark-theme `landFill` to `#3b4660` so continents read against the ocean
- [x] Bump `three 0.169 → 0.184`, fix `THREE.Clock → Timer`, `PCFSoftShadowMap → PCFShadowMap` deprecations
- [x] Bump `vite 5.4 → 8.0` (skipped 6 and 7) — config unchanged
- [x] Commit + push to `origin/main` (two commits: docs/skill + source changes)

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `index.html` | Swap Google Fonts CSS link from Fraunces → Bricolage Grotesque | Sans-serif typography per user direction |
| `styles.css` | `--font-display` now points to Bricolage Grotesque; updated `font-variation-settings` on `.topbar__titles h1` and `.panel__head h2` | Same |
| `src/globe.js` | New `makeAtmosphere()` Fresnel shader with two-stop gradient on a 1.18× back-side shell. Removed `loadElevationTexture()`, removed `displacementMap`/`bumpMap` from sphere material, reverted sphere segments 512 → 128 | Atmosphere halo + elevation removal |
| `src/paths.js` | `TRAVELER_SPEED_PER_RADIAN` 0.42 → 0.22, `TRAVELER_MIN_CYCLE_SECONDS` constant added at 4.5 | Slower travelers |
| `src/themes.js` | Added `glowInnerColor`, `glowOuterColor`, `glowIntensity` per theme. Removed `bumpScale`, `displacementScale`, `bumpOcean`, `bumpLand`, `bumpCoast`. Dark theme `landFill` lightened to `#3b4660` for visible continents | Atmosphere palette + elevation cleanup |
| `src/main.js` | `globe.group.rotation = { x: 0.58, y: 0.10 }` for US framing. `THREE.Clock` → `THREE.Timer` with `timer.connect(document)`. `PCFSoftShadowMap` → `PCFShadowMap`. Removed `ELEVATION_URL` and `elevationUrl` plumbing | Camera framing + deprecation fixes |
| `src/ui.js` | Removed the `active.has(key) && active.size === 1 → re-select everything` branch | Toggle bug fix |
| `package.json` / `package-lock.json` | `three ^0.169 → ^0.184`; `vite ^5.4 → ^8.0` | Dep refresh |
| `public/textures/earth-elevation-bump.jpg` | **Deleted** | Elevation scrapped |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Drop elevation entirely | (a) Keep elevation + lift markers to clear max displacement, (b) drop elevation | User chose (b) explicitly — the markers were getting buried. Cleaner globe also reads better for data-viz purposes; the bumps were never the point |
| Bricolage Grotesque for display | Inter, DM Sans, Geist Sans, Bricolage Grotesque | Bricolage has more letterform character without going theatrical; variable axes (`opsz`, `wdth`, `wght`) let title and panel heading take distinct treatments without loading multiple files |
| US-centered default camera via globe rotation, not camera move | (a) Move camera, (b) rotate globe group | Rotating the globe group keeps the OrbitControls target at origin and the user's drag-to-rotate continues to feel right. Trivial 2-value change |
| Skip Vite 6 + 7, jump to 8 | Stage through majors, jump direct | Config is minimal — `base`, `build.target`, `server` — none of which changed semantics. No reason to stage |
| Commit docs/skill additions separately from source changes | Single commit, two commits | Two commits read better in `git log` — meta-files (handoff doc, CLAUDE.md, skill) are a different concern from the source work |
| Repo stays private | (a) flip back to public to restore Pages, (b) keep private | User asked for private + local experimentation in the original goal directive. They've seen the trade-off (Pages goes offline on free plan) and accepted it |

## 🚧 Pending Work

### Immediate Next Steps

1. **2026 full slate ingestion** — Same as previous handoff. The slate releases 2026-05-14 8 PM ET (today/tomorrow in real time depending on session timing). Append remaining ~245 games to `src/data/schedule-2026.js`. Schema: `{ week, away, home, venue? }`. International venues already defined in `src/data/teams.js` — only add a new one if a venue not currently listed appears. Then `git add`/`commit`/`push`.
2. **Optional verification once full slate is wired** — Toggle to 2026, confirm every team has a non-zero mileage total (panel is sorted by miles descending; anything still at 0 mi means a team has no away games, which would indicate a data bug).
3. **Optional polish** — Hover-tooltip on arcs/markers showing matchup + week. CSS `.tooltip` class already exists in `styles.css` (unused); every line/marker has `userData` attached. Just need raycaster + DOM tooltip element.

### Blockers/Open Questions

- None blocking. The visualisation works end-to-end against the 12 confirmed games; full slate is the one missing input and it's released on a known date.

### Deferred Items

- **Tooltips** — pattern set up, not wired (see above).
- **Walkthrough video** — `.claude/skills/capture-presentational-media/` describes a Playwright pipeline but only stills have been captured.
- **Week scrubber** — every leg carries `week: number`; would be a straightforward addition.
- **NFC vs AFC quick-select** — division metadata is on every team; could add division-level panel groups.
- **Re-add subtle real elevation** — If the user reverses position later, you can layer a low-amplitude `bumpMap` (no `displacementMap`) for surface-shaded relief without disturbing the markers. `bumpScale ≈ 0.03` was the sweet spot for shading-only relief. The Natural Earth III heightmap source: `http://shadedrelief.com/natural3/ne3_data/8192/elev_bump_8k.jpg` (needs `User-Agent` + `Referer` headers to bypass 406; public-domain). Don't re-download to `public/textures/` without confirming the user wants it back.

## 💡 Context for Resuming Agent

### Important Context

- **Repo is PRIVATE again.** Last handoff said "public, Pages restored". User asked this session to flip it back. `gh repo view CypherPoet/THREE-JS-NFL-Flight-Paths --json visibility` to confirm. **Don't flip it back to public without explicit user direction** — they've accepted Pages going dark for now.
- **Live site is OFFLINE** for the same reason. The previous handoff's `Live URL` is no longer reachable. Don't tell the user to visit it.
- **There's been an entire elevation feature lifecycle in this session** — added in the first pass, debugged in the second pass (with `displacementMap` + sphere segment bump), then ripped out entirely in the third pass. Lots of search hits will reference elevation paths/scripts/textures that no longer exist. The current state is the clean smooth sphere; **do not be tempted to restore elevation from the git history** unless the user asks.
- **The atmosphere shader's rim-factor math is non-obvious.** If touching `makeAtmosphere()` in `src/globe.js`, remember: back-side rendering means `dot(N, V) ≤ 0` always, so any "1 - max(dot, 0)" formula will yield constant 1. Use `-dot(N, V)` or `clamp(-dot(N, V) / 0.55, 0, 1)` (0.55 is the max value for our 1.18× shell over a 1.0 planet — `sqrt(1 - (1/1.18)²)`). The shader is annotated with this explanation.
- **The camera framing values `rotation.x = 0.58, rotation.y = 0.10` are intentionally specific** — they place lat 39°N / lon 96°W (≈ Lebanon, KS, the contiguous US geographic centre) on the camera's view ray. If you re-frame, recompute against `latLonToVec3` in `src/geo.js`.
- **Bricolage Grotesque is loaded with explicit `opsz`, `wdth`, `wght` axes.** Don't drop the `font-variation-settings` lines in `styles.css` — they're what gives the title its slight condensed-display feel vs. the body's standard width.
- **`localStorage` key for theme is `"nfl-flight-paths-theme"`.** Clearing it falls back to `prefers-color-scheme`. Tests should clear between runs.

### Assumptions Made

- The user's "scrap elevation" was a definitive choice, not a temporary pause. The texture asset was trashed, not just stashed.
- US-centered framing is the desired default — the user said "have the default camera position centered on the united states" without further qualification. If they want a different anchor (e.g. centered on a particular team's home, or fitted to encompass all teams), revisit `globe.group.rotation` in `src/main.js`.
- The toggle bug fix (removing the auto-reselect-all branch) is the desired final behavior. The user didn't ask for an alternative "click soloed team to un-solo" feature — if they want that back later, gate it behind shift-double-click or a separate button.

### Potential Gotchas

- **Three.js r184's deprecation warnings.** If you `npm install` again, you may see other warnings appear. The Timer API may evolve; `timer.connect(document)` is currently the right way to use Page Visibility.
- **Vite 8 changed bundler internals.** If you need to tune chunking, the option name is `build.rolldownOptions.output.codeSplitting`, not the old `rollupOptions`. The minimal `vite.config.js` doesn't touch either, so it's a non-issue unless you start customising the build.
- **`playwright-cli` snapshot refs (e3, e27, …) regenerate every call.** Always re-snap right before clicking. Same as previous handoff.
- **`playwright-cli` screenshot output is rooted to the working directory of the playwright process.** If you spawn playwright-cli from a different directory than the project root, screenshots will land in the wrong tree (saw this happen mid-session — had to `close-all` and re-open from the project root).
- **The dev server backgrounded by previous tool calls (`b00qpvkhv` at session end) will be killed at session shutdown. Restart with `npm run dev` if needed.**
- **No tests exist.** Visual verification via `playwright-cli screenshot` is the current quality bar. If you start adding tests, the harness will need scaffolding.

## 🌐 Environment State

### Tools/Services Used

- **Node 24.14.1 / npm 11.11.0** — same as previous handoff.
- **Three.js r184** (`three@^0.184.0`) — bumped this session.
- **Vite 8.0.12** (`vite@^8.0.12`) — bumped this session.
- **d3-geo + topojson-client** — unchanged.
- **gh CLI** — logged in as CypherPoet via SSH/keyring; used for the visibility flip.
- **playwright-cli 0.1.8** — for screenshot verification.
- **trash CLI** — used per global preference for deleting files (vs. `rm`).

### Active Processes

- **Dev server may still be running** from background task `b00qpvkhv` (`npm run dev` at port 5173). Will be killed on session shutdown. Restart with `npm run dev` from the project root.
- No other long-running processes.

### Environment Variables

- `VITE_BASE` — optional; overrides Vite's `base` config for forks/PR previews. Default `'/THREE-JS-NFL-Flight-Paths/'`.

## 📚 Related Resources

- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths (private)
- Previous handoff: `.claude/handoffs/2026-05-13-174844-nfl-flight-paths-v1-shipped.md`
- Reference photo for atmosphere look (provided by user mid-session): low-orbit Earth photo showing the wide cyan-to-blue atmospheric gradient. Not stored in repo.
- Source of Natural Earth III bump map (in case elevation is ever revived): http://shadedrelief.com/natural3/ne3_data/8192/elev_bump_8k.jpg (public domain, Tom Patterson).
- World topology source: https://github.com/topojson/world-atlas (`countries-110m.json`) — unchanged.
- 2026 international games announcement (from previous handoff): https://www.nfl.com/news/2026-nfl-schedule-release-nine-international-games-dates-times-matchups

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
