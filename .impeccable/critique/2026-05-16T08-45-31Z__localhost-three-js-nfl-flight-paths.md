---
target: "http://localhost:5173/THREE-JS-NFL-Flight-Paths/"
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-05-16T08-45-31Z
slug: localhost-three-js-nfl-flight-paths
---
# Critique — NFL Flight Paths globe (live)

**Target**: `http://localhost:5173/THREE-JS-NFL-Flight-Paths/`
**Run date**: 2026-05-16
**Compared against**: May 15 baseline (28/40), persisted at `.impeccable/critique/2026-05-15T06-50-43Z__localhost-three-js-nfl-flight-paths.md`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | URL state writes happen silently; no toast or share-link affordance signals the URL is now portable |
| 2 | Match System / Real World | 4 | NFL-fan vocabulary throughout (division headings, accents, abbrs); haversine isolated behind a labelled methodology modal |
| 3 | User Control and Freedom | 2 | Hint copy promises "click a team to isolate" but plain click toggles a single team in/out of the active set; isolation requires undocumented shift/cmd/ctrl/alt modifier |
| 4 | Consistency and Standards | 3 | Panel-sort + panel-preset tooltips fire on top of chips while topbar tooltips fire below the icon row, two different reveal grammars from the same `data-tooltip` pattern |
| 5 | Error Prevention | 4 | Baked data, clamped camera, graceful empty-state copy when zero teams are active, modal scrim + Esc both close |
| 6 | Recognition Rather Than Recall | 2 | Four icon-only topbar buttons in identical 38px chrome (mileage glyph still bespoke, methodology generic info circle, sun/moon, coffee); no per-icon label visible without hover |
| 7 | Flexibility and Efficiency | 3 | URL state, season switch, presets, modifier-click isolate exist, but the modifier-click is invisible in chrome and there is no team-name search across 32 rows |
| 8 | Aesthetic and Minimalist Design | 4 | Single dominant idea per theme; chrome reduced to two scrims; metrics carry their own register via Departure Mono |
| 9 | Error Recovery | 2 | Boot-failure copy improved, but no in-app retry button, no stadium-photo fallback diagnostic, no recovery from a malformed `?teams=` value beyond silently emptying the set |
| 10 | Help and Documentation | 3 | Methodology modal is excellent; preset chips got tooltips; the panel itself has no first-run; the modifier-key isolate is undocumented anywhere |
| **Total** | | **30/40** | Solid. Click-contract copy mismatch, icon-cluster discoverability, and recovery-state thin spots are the three drags. |

**Trend**: 30 → 28 → **30**. The two-point lift comes from the May 15 P0 keyboard fix and the empty-state copy rewrite.

## Anti-Patterns Verdict

**Start here. Does this look AI-generated?**

**LLM assessment**: No, both themes pass first-order and second-order AI-slop. Light mode commits to FAA sectional cream paper with sea-green water + slate ink (the generic NFL-viz reflex would be blue ocean + red/yellow team dots on white). Dark mode commits to a Sunday Night Football register via asymmetric sodium-vapor halo + warm graphite ocean + relief that reads like lit turf, off the SaaS-navy and neon-on-black lanes. The May 15 sphere-color wobble on light mode is tuned out at the current values.

**Deterministic scan**: `npx impeccable detect --json index.html` returned `[]`. Zero findings. Absolute bans are clean: no side-stripe borders, no gradient text, no glassmorphism beyond the two legitimate-use modal scrims, no hero-metric template, no identical card grids, no em dashes in user-facing copy.

## Overall Impression

The interface holds together and reads as a distinct visualization rather than another globe-on-a-cream-card. The two-theme thesis (sectional cartography for day, primetime broadcast for night) is now load-bearing across palette, lighting, typography, and atmospheric treatment — both themes earn their place. The remaining issues are not about register or composition; they are about a single contract mismatch between hint copy and interaction behavior, and about chrome discoverability on a four-icon row.

The single biggest opportunity: align the hint copy and the click handler. Either default click should isolate (matching the copy), or the copy should name the modifier.

## What's Working

1. **Dark mode commits decisively to the primetime-broadcast thesis.** Sodium-vapor halo asymmetry on the lit limb does work no copy could; warm graphite ocean + dark-relief continents + team-accent city dots all read as broadcast graphic rather than SaaS Earth.
2. **Keyboard reach into the team panel is real and beautifully themed.** Every `.team-row` is `role="button" tabindex="0"` with Enter/Space handlers; the focus ring is `outline: 2px solid var(--accent)` with `outline-offset: -2px`, so focus reads as a team-coloured frame on the row. Theme-aware without extra plumbing. May 15 P0 fully addressed.
3. **The mileage breakdown modal is still the strongest narrative artifact.** Staggered 780ms plane-trail animations from shortest to longest, gradient trails coloured by team accent, plane emoji terminating each track. Earns its place against a flat bar chart twice over.

## Priority Issues

**[P0] Hint copy lies about the click contract**
- **What**: Persistent bottom hint reads "Drag to rotate · scroll to zoom · hover a stadium · click a team to isolate". Plain click toggles a single team in/out of the active set (handler in `src/ui.js:130-132`, `toggleFromEvent(e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)`). Isolation requires a modifier.
- **Why it matters**: Headline interaction for the whole panel. First-time users execute the documented action and observe the opposite of the promise (31 other teams still drawn), with no signal that a modifier exists. Mental model breaks at the first decision point.
- **Fix**: Pick one. (a) Change default click to isolate, use shift to additively toggle, match the copy. (b) Change the copy to surface the modifier visibly ("click to toggle, shift-click to isolate") and accept the more verbose hint. Option (a) is the bolder commit and matches the brand register (broadcast graphics isolate); option (b) is the lower-risk path.
- **Suggested command**: `clarify` (if option b) or `craft` (if option a is a real interaction redesign).

**[P1] Mobile theme tooltip clips past the viewport edge**
- **What**: At 375×812, the theme-toggle tooltip ("Toggle dark mode") is anchored `right: 0` to its button at the right edge of the topbar. The tooltip content is wider than the available space to its left at that viewport and overflows. Same `data-tooltip` pattern is used for mileage/methodology icons in the wrapped second row.
- **Why it matters**: On phone, focusing or hovering the theme toggle produces broken text orphans, not a clean affordance. The desktop tooltip pattern was never adapted for the mobile two-row topbar.
- **Fix**: Inside `@media (max-width: 760px)`, switch the relevant `[data-tooltip]::after` anchoring from `right: 0` to centered (or left-anchored at the rightmost icon) and add `max-width: calc(100vw - 24px)` so the bubble can't overshoot the viewport.
- **Suggested command**: `adapt`.

**[P1] Four-icon topbar cluster still high cognitive load**
- **What**: Mileage, methodology, theme, coffee. Four 38px buttons in identical chrome. Mileage glyph is three horizontal lines reading as "menu / list" rather than "table of mileage by team"; methodology icon is a generic info circle; coffee competes with the two data-explainer icons at the same chrome weight.
- **Why it matters**: First-timer hovers each in sequence to learn the affordances. Tooltips help once you know to wait, but the cluster's identical weight gives no scent of which icons carry data, which carries social, which carries theme. Coffee at the rightmost slot reads as the "last action" by visual position, which it isn't.
- **Fix**: Either (a) demote coffee further (drop opacity to ~0.5, or tuck below the icon row into the panel footer); (b) give methodology a stronger glyph than a circled-i (a haversine arc fragment or √ symbol mapping to the actual content); (c) consolidate mileage + methodology behind a single "About this data" entry with tabs inside.
- **Suggested command**: `clarify` + `delight` (glyph rework).

**[P2] Mileage modal value column wraps awkwardly on mobile**
- **What**: At 375px, the mileage row's value (e.g. `35,093 mi`) wraps to two lines, with `mi` orphaned under the number. Caused by the mobile grid `130px 1fr 70px` and the value cell not having `white-space: nowrap`.
- **Why it matters**: The mileage modal is the project's strongest narrative artifact; a wrapping value column undercuts the rhythm of the airplane-flying-to-its-value animation. Every row doubles in height.
- **Fix**: Add `white-space: nowrap` to `.mileage-row__value` and bump the third grid column to ~78–82px in the mobile rule; alternatively format with `numberFormatter` then drop the ` mi` suffix on mobile and let the header carry the unit.
- **Suggested command**: `adapt`.

**[P2] Stadium-tooltip Wikipedia photo failure is still silent**
- **What**: When a stadium photo 404s, the tooltip's `data-state` transitions to `empty` and the top half stays blank or the tooltip collapses, with no diagnostic copy.
- **Why it matters**: Reads as a half-broken feature on the most-discoverable interaction after the panel.
- **Fix**: When `data-state="empty"`, render a venue-typography placeholder (monospaced city + lat/long) rather than collapsing. Treat the absence as a designed state.
- **Suggested command**: `harden`.

## Persona Red Flags

**Alex (Power User)**: URL state works for `view` + `teams` + `season` — genuinely good for sharing assemblies. No keyboard-shortcut sheet (no `?`-key cheat sheet, no `/`-team-search, no number-row preset hotkeys). The shift-click isolate is invisible in any chrome surface. Alex will discover it by accident or never.

**Jordan (First-Timer)**: Reads the hint, clicks Kansas City, expects KC isolated, sees 31 other teams still drawn. Probably tries clicking again, hovers icons one at a time to figure out the topbar cluster, eventually finds the Longest 5 preset which sort of does what they wanted. May never discover modifier-click. The icon cluster requires four serial hovers.

**Sam (Mobile/Touch + keyboard)**: Team rows tabbable with the beautiful team-accent focus ring — prior P0 solved. Mobile theme toggle works but the tooltip clips as text orphans. Modifier-click isolate is unreachable on touch (no shift-tap convention). The only path to single-team isolation on touch is `Longest 5` (which isn't isolation) or tapping every other team off, which is 31 taps. Touch isolation is functionally absent.

## Minor Observations

- Hint copy uses three interpunct separators (`·`); some screen readers verbalize "middle dot middle dot middle dot". Mildly noisy.
- Empty-state hint ("No teams selected. Pick All, AFC, or a division to bring arcs back.") is excellent copy. Short, names recovery options, no lecture.
- Light theme limb (`limbOpacity: 0.22`) is whisper-quiet; the globe edge against cream is doing limb work mostly through ambient lighting falloff rather than the explicit halo. Reads correctly.
- Modal close `×` at 22px with hover background works; Esc-to-close is in the shared `wireModal` plumbing, good fix from the prior critique.
- Coffee link reuses the `.theme-toggle` class plus `--quiet` modifier; misleading class name, no impact on metrics, can stay.
- `font-synthesis: none` continues to be set globally; nothing in the codebase relies on synthetic italic so the side effect stays inert.
- `prefers-reduced-motion` correctly freezes WebGL travelers and disables CSS transitions, with the loading-bar slide preserved by `animation-duration: 1.1s !important` override.
- The away-marker legend dot in the bottom right is a 1.5px ring on a transparent dot; readable in light, but on dark it's a thin sand-colored ring against navy that reads as faint. Consider boosting `--ink-soft` opacity or thickening to 2px on dark.

## Cognitive Load

- Fail count: **1/8**
- Verdict: **Low**
- Specific fail: Recognition rather than recall is partial. Four undifferentiated 38px icon buttons in a row force serial hover-to-learn. The other seven check out: presets are five visible chips (≤4 is technically violated by one chip but they chunk as canonical-vs-none), grouping by division is visible, recognition over recall holds for the team list, defaults land at All + division sort, consistency holds within each surface.

## Emotional Journey

- **Peak**: Mileage modal's plane-trail animation. Strongest narrative beat in the project.
- **End**: Wherever the user lands on the globe after toggling teams. Empty-state hint copy now catches the worst trough.
- **Anxiety spike**: One. First-timer reads "click a team to isolate", clicks Kansas City, sees 31 teams still drawn, infers the UI is broken or that they misunderstood the action. The hint is making a promise the default click does not keep.

## Questions to Consider

1. If the hint says "click a team to isolate", is the default behavior the bug or is the copy the bug? Pick one and commit. The current shape is fence-sitting and the cost is paid by every first-timer.
2. Is mobile a first-class target or a graceful degradation? The panel works, the modals adapt, but the isolation interaction has no touch path. Either add a long-press-to-isolate gesture, or accept that mobile is read-only-with-presets and surface that contract in the chrome.
3. The mileage modal animation is the strongest narrative beat. The globe's flight-path travelers are continuous and ambient rather than narrative. Is there a "play the season" mode where weeks 1 through 18 walk forward in time and arcs draw progressively? The infrastructure (`tickTravelers`, `buildTravelLegs` with week numbers) is already in place.
4. Four icon buttons argue for differentiation by glyph alone. Two of them (mileage, methodology) belong to the same conceptual family (data explainers). Is there a frame where they share one entry point, freeing chrome budget for what's actually distinct?
