---
target: "http://localhost:5173/THREE-JS-NFL-Flight-Paths/"
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-05-16T14-23-48Z
slug: localhost-three-js-nfl-flight-paths
---
# Critique — NFL Flight Paths globe (live, post-PR-16)

**Target**: `http://localhost:5173/THREE-JS-NFL-Flight-Paths/`
**Run date**: 2026-05-16 (post-PR-16)
**Compared against**: May 16 PM baseline (30/40), persisted at `.impeccable/critique/2026-05-16T11-40-55Z__localhost-three-js-nfl-flight-paths.md`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading shimmer + animated travelers + active-chip state read cleanly; URL silently mutates with no toast/read-back. Fine for power users, opaque to first-timers. |
| 2 | Match System / Real World | 4 | "League total miles", "International miles · 16 games", division headers, "By division / By miles", methodology haversine + 0.3% honesty all speak the domain. Locked. |
| 3 | User Control and Freedom | 3 | Esc closes modal + tooltip, theme persists, URL captures state. No undo for accidental click-deselect or for the "None" preset. |
| 4 | Consistency and Standards | 4 | Three chrome surfaces (chips, sort, icons) share paper/line/radius/shadow tokens. Tooltip + focus-ring + toggle patterns hold. The topbar icon cluster now reads as one tool rail. |
| 5 | Error Prevention | 2 | "None" preset sits in the same chip row as constructive presets and clears the selection with no confirmation or undo path. EMPTY_HINT catches the all-deselected state but does not prevent it. |
| 6 | Recognition Rather Than Recall | 3 | Tooltips on icon-only buttons label them on hover/focus; the panel intl callout names the headline number. Shift-click-to-isolate is documented only in the 10px bottom hint, which is hidden on mobile. Detector confirmed the hint's tiny-text. |
| 7 | Flexibility and Efficiency | 3 | URL state shareable, season toggle, presets, keyboard activation on rows. Missing: per-team search, "copy share link" affordance, keyboard shortcut for isolate, number-row preset hotkeys. |
| 8 | Aesthetic and Minimalist Design | 4 | Big Shoulders display reserved for H1 + division kickers, Departure Mono on every numeric, Geist body + chrome. Three type families with clear roles. Topbar still carries 8 first-class objects at desktop, but the icon cluster + paper-soft mobile scrim defuse most of the prior density complaint. |
| 9 | Error Recovery | 2 | Stadium 404s land on the reticle placeholder (good) but with no inter-state signal. Globe topo fetch failure shows static text, no retry. |
| 10 | Help and Documentation | 3 | Methodology modal is genuinely thorough; no first-run tour to that modal. |
| **Total** | | **31/40** | The warm-grey chrome + Longest-5 default close the May 16 PM chrome/globe collision and default-density P1s; new ceiling is recovery affordances and on-surface discoverability of the gesture contract. |

**Trend**: 30 → 28 → 30 → 30 → **31**. The May 16 PM P1 cluster (chrome/globe tonal collision, default-view braid) is closed; P2s (topbar density, mobile H1 contrast) are also closed; the deferred P3 (heading grammar) has resolved organically (heuristic 8 now scores 4 with three type families "with clear roles"). The new load-bearing items are recovery + recall.

## Anti-Patterns Verdict

**Start here. Does this look AI-generated?**

**LLM assessment**: Passes first-order convincingly. Light theme is now a deliberate warm-grey desk paper holding a cool sectional sphere — the inverse of the "data-viz globe" reflex (cool chrome + cool sphere). Reads as "FAA sectional pinned to a desk," not cream/teal SaaS. Dark theme is warm-graphite + sodium-vapor amber, not navy + neon. Both registers commit away from category defaults. The mileage modal plane-on-trail animation, the methodology modal's haversine + 0.3% disclosure, and the stadium reticle empty-state are the three strongest anti-slop signals. The mobile H1 paper-soft scrim is functional (without it, dark text on the cool-blue ocean fails contrast) and reuses the modal scrim recipe rather than reflexing to "make it frosted" — sits on the right side of the glassmorphism ban.

Second-order, the warm-grey chrome's temperature contrast against the cool sphere is the project's single most-distinctive design move. The chrome and the globe sit on different temperature axes; flipping themes now reads as "two authored registers" rather than "lighter dark mode." The PR #16 chrome shift was the right call.

**Deterministic scan**: `npx impeccable detect --json index.html src/` returned `[]` (zero findings) at the markup level. A separate `--json styles.css` scan caught **1** project-code finding: `styles.css:1511 transition: width` on `.mileage-row__trail`. Animating `width` is a layout-property transition (causes layout thrash); the visual outcome the user wants is achievable with `transform: scaleX(...)` from a fixed-width container, `clip-path`, or `grid-template-rows`. This is the same trail animation the LLM review cited as a strongest-craft moment, so the fix is about the underlying transition target, not removing the effect.

**Live overlay scan**: `npx impeccable live` injection caught **1** in-browser finding: `#hint.hint` is rendered body text at `font-size: 10px` (`--text-micro: 0.625rem`). The CLI HTML scan didn't flag it because jsdom doesn't resolve the var to computed pixels; the live DOM does. Reinforces the LLM review's heuristic-6 concern that shift-click-to-isolate is documented only in chrome that is small enough to be ignored and hidden entirely on mobile.

Absolute bans: no side-stripe borders, no gradient text, no glassmorphism as default beyond the legitimate modal/topbar scrims, no hero-metric template, no identical card grids, no em dashes in UI copy. Project code is clean.

## Overall Impression

PR #16's two thesis-level moves (warm-grey chrome on a different temperature axis from the globe; Longest-5 first paint instead of all-32) close the May 16 PM P1 cluster outright. The score lifts from 30 to 31 on Consistency (4) and Aesthetic (4) where the chrome retune + cluster + scrim land cleanly. What's now load-bearing is the recovery layer: an undestructible "None" chip, a power-gesture (shift-click isolate) that lives only in 10px desktop chrome, a URL share artifact with no on-surface verb, and asset failures that degrade silently. The Three.js craft (mileage modal trail animation, atmosphere shells, stadium reticle empty-state) continues to be the strongest signal. The single biggest opportunity is to turn the URL-as-share-mechanism from invisible plumbing into a deliberate affordance — one icon in the cluster, "copy link" with a "captures filter + camera" tooltip, picks up the project's most-impressive technical detail and surfaces it for the 60-second portfolio scan.

## What's Working

1. **The temperature-contrast color decision in light mode.** Warm-grey paper chrome (`--bg #e8e7e3`) against the cool sectional ocean (`sphereColor 0xa5c0c8`) is the single most-distinctive design move. Reads as authored — pilots' charts, not SaaS. Without that decision the project would slot into the data-viz globe category instantly; with it, the brain has to slow down to place the aesthetic. Closes the May 16 PM P1.
2. **The mileage modal's plane-on-trail micro-animation.** Restrained delight done correctly: trails draw in with a soft cubic ease, plane glyph parks at the end. Each row's `--accent` color is reused on the trail gradient, the plane fill, and the drop-shadow tint. Three different surfaces hold the same per-team identity. (Footnote: the transition animates `width`, which the detector correctly flags as a perf concern. See P3.)
3. **Type hierarchy discipline.** Big Shoulders reserved for H1 + division kickers, Departure Mono on every numeric, Geist body + chrome. The deferred P3 from May 16 PM ("two heading grammars compete") has resolved organically — three type families now read with clear roles, not three label systems competing.

## Priority Issues

**[P1] "None" preset is destructive with no undo path**
- **What**: Clicking "None" in the panel preset row clears the active Set to empty, blanks every arc on the globe, and the only recovery is to find and click a non-"None" preset. EMPTY_HINT explains the empty state but offers no "restore previous selection" affordance. Sitting in the same chip row as constructive presets (All / AFC / NFC / Longest 5 / International) makes it indistinguishable as a destructive action.
- **Why it matters**: A user who taps "None" to "see what it does" cannot undo without losing whatever custom selection they had. The "I just lost my work" beat is the single biggest UX failure on the page — it converts an exploratory tap into a frustration moment. Drives the Error Prevention score down to 2.
- **Fix**: Two options. (a) Cache the prior `active` Set on transition to empty and surface "Restore last selection" as an inline link inside EMPTY_HINT, dismissible once the user makes any new selection. (b) Replace "None" with a "Clear" button that toasts a 5-second undo. Option (a) preserves the chip-row visual rhythm; option (b) is more explicit but introduces a new control type.
- **Suggested command**: `harden`

**[P1] Shift-click-to-isolate has no on-surface discovery beyond a 10px hint that hides on mobile**
- **What**: The power-user gesture (modifier-click a row to isolate that team) is documented only in `.hint` at the bottom of the desktop view. The detector live-overlay flagged `.hint` as 10px tiny-text (`--text-micro: 0.625rem`). On mobile, `.hint` is `display: none` entirely — the entire isolate workflow is invisible. On desktop, the 10px chrome becomes ambient and gets ignored.
- **Why it matters**: A first-time visitor or mobile reviewer never learns the project's most useful gesture. Drives Recognition score to 3 and contributes to the Power-User persona red flag. The LLM review and the detector both converged on this — strong signal.
- **Fix**: Two layers. (a) Add a contextual tooltip to team rows on hover: `data-tooltip="Click to toggle · ⇧-click to isolate"` so the affordance is recall-free at point of use. (b) On mobile, substitute a long-press to isolate with a one-time toast on first row interaction explaining the gesture.
- **Suggested command**: `clarify`

**[P2] Mobile vertical budget is over-committed by chrome**
- **What**: At 375×812, topbar = ~162px (20% of viewport height); panel = ~308px (38%). The globe gets a ~260px clear vertical band sandwiched between them. Transcontinental arcs (SF→London, MIA→FRA) render outside the visible globe disc and clip into the panel.
- **Why it matters**: Mobile is the lighter-test viewport for portfolio link recipients. On a small phone the sandwich layout risks the first impression being "this is a list app with a globe wedged in," which undersells the central object.
- **Fix**: Collapse the topbar to a single 56px row on mobile (push the two metric tiles into a swipeable strip or merge "International miles" into the panel intl callout that already names the figure). Let the panel be a peek-up sheet defaulting to ~28% of viewport with a drag handle to expand. Desktop layout doesn't change.
- **Suggested command**: `layout` or `adapt`

**[P2] URL is the share artifact but has no on-surface affordance**
- **What**: The URL silently grows `?teams=...&view=...&season=...` as the user interacts; the address bar IS the share mechanism but nothing in the UI tells the user that. A reviewer who shares the bare link loses the curated camera angle they composed.
- **Why it matters**: The round-trip state in the URL is one of the project's most-impressive technical details for a portfolio audience. Keeping it invisible costs the project its single best 60-second-scan trump card.
- **Fix**: Add a single icon-only "Share link" button to the `.topbar__icons` cluster (fourth icon, paired with mileage / methodology / theme). On click, copy `location.href` to clipboard with a 1.2s tooltip: "Link copied — captures filter + camera". The existing tooltip system handles the surface. Reuses the cluster pattern that PR #16 introduced.
- **Suggested command**: `delight` or `clarify`

**[P3] Mileage trail animation uses `transition: width` (layout-property animation)**
- **What**: `.mileage-row__trail { transition: width 780ms cubic-bezier(0.18, 0.7, 0.22, 1) }` at `styles.css:1511`. Detector caught this; the LLM review cited the trail draw as one of the strongest-craft moments in the project — both are right.
- **Why it matters**: Animating `width` triggers layout passes on every frame, causing thrash on slower devices and competing with the Three.js render loop for the main thread. The visual effect (trail growing left-to-right with a plane glyph at the tip) is exactly right; the underlying transition target is the perf risk.
- **Fix**: Switch the implementation to a fixed-width container with `transform: scaleX(...)` from `transform-origin: left`, or use `clip-path: inset(0 calc(100% - var(--pct)) 0 0)`. Either preserves the existing visual outcome on the GPU instead of the layout engine. The plane glyph position needs to follow the transformed end; recalculate via the same `--pct` variable.
- **Suggested command**: `optimize` or `polish`

## Persona Red Flags

**Portfolio Reviewer (60-second skim)**: The URL feature is the most-impressive technical detail and is invisible without interacting. They'll close the tab not knowing it exists. The mileage modal plane animation is the second-best moment and lives behind an icon they may not click. The five-clause hint at the bottom asks them to memorize a contract before they engage.

**NFL Sports Fan (came in via link, doesn't care about chrome)**: First paint hides 27 of 32 teams (Longest-5 default). A Bears or Browns fan sees no Bears/Browns arcs and has to (a) notice their team is dim in the panel and (b) realize they need to click their team's row or switch to "All". The Longest-5 default is correct as a data lede but slightly fights the team-fan persona; geolocation-guessing the user's local team for a soft promote would resolve both.

**Mobile/Touch (Twitter link on a phone)**: Topbar + panel consume nearly 60% of vertical viewport. Globe canvas band is narrow. Shift-click-to-isolate is unreachable on touch with no long-press fallback. The `.hint` strip that explains gestures is `display: none` on mobile, so the only on-surface explanation of how to interact is hidden. Tapping icon-only buttons to read a tooltip then re-tapping to invoke is a two-tap discovery cost.

**Power User (kept from prior runs)**: URL captures state, panel rows are keyboard-activated with team-coloured focus rings, modifier-click isolate matches the hint copy. No keyboard shortcut for isolate-this-team beyond click, no `/`-team-search, no number-row preset hotkeys. Active preset chip clears when selection drifts from canonical — Alex would expect a "custom" badge instead of all chips going inactive.

## Minor Observations

- The empty-state hint "No teams selected. Pick All, AFC, or a division to bring arcs back" names "division" but the panel groups by division behind the chip row, not via a chip. A user scanning chips for the word "division" comes up empty. Either rewrite the copy or surface a "divisions" chip set.
- `index.html` favicon `<link>` paths are root-relative (e.g. `/favicon-32.png`) but the app deploys under `/THREE-JS-NFL-Flight-Paths/`. Worth verifying these resolve on GitHub Pages (Vite rewrites root-relative paths in `index.html` with the configured base, per the auto-memory note, but worth confirming the production build).
- The `.season-switch` 2026/2025 toggle is unlabelled visible chrome — `aria-label="Season"` handles SR, but a sighted user gets nothing. A small "SEASON" tracked-uppercase kicker (matching the panel TEAMS pattern) would clarify without adding much density.
- `.team-row[data-active="false"] { opacity: 0.36 }` sits at the dim edge — on the warm-grey light theme, inactive rows still read but a 0.42-0.45 would soften the active/inactive contrast slightly without losing the dim-out cue.
- The methodology modal subtitle "How travel miles are calculated" duplicates the page H2 ("Methodology"). The subtitle is a missed opportunity for a one-sentence summary ("Great-circle air distance, walked in week order").
- `--intl-marker: #7a6b3d` in light is close enough to `reliefColor 0xe6d4b0` that the international bar segment can blur into the relief on the globe. Verify the segment reads against every team accent at the 3px bar width.
- `vignetteColor: 0x18191b` at `src/themes.js:31` carries the OLD slate ink value (warm-grey ink is `0x1c1a17`). Currently inert because `vignetteIntensity: 0` in light, but if the surface ever wakes up the color will clash with warm-grey chrome. Carried from May 16 PM deferred bucket.
- The URL-state header comment at `src/main.js:32-37` still describes the old "omit `teams=` when all 32 are active" contract; the inline `writeUrlState` comment at lines 85-86 has the truthful "omit when Longest 5 is active" version. Carried from May 16 PM deferred bucket.

## Cognitive Load

- Fail count: **3/8**
- Verdict: **Moderate**
- Specific fails:
  - Teams panel surfaces 11 simultaneous controls at first paint (2 sort buttons + 6 preset chips + a season switch in topbar + the 32-row list). Power users read it fast; first-timers parse for a beat.
  - Progressive disclosure is absent: shift-click isolate, URL `view=` round-trip, season toggle, mileage modal are all peer-level chrome with no "advanced" gating. The 10px `.hint` is the only progressive-disclosure mechanism and it's text, not an interaction.
  - Mobile information density: at 375px, topbar (20%) + panel (38%) leave the globe ~260px tall and clipped against the panel above.

## Emotional Journey

- **Evoked emotion**: focused authority, mid-game broadcast attentiveness. The cool sphere on warm paper is unusually calm for "data-viz with animation" — no neon, no parallax, no scroll-jacking.
- **Peak**: opening the mileage modal. Contrails draw in with plane glyphs ranking 32 teams; this is the moment the project transcends "neat globe" into "this person actually thought about it." Aligned with peak-end rule.
- **End**: ambiguous because the experience is exploratory; the Coffee link in the bottom-right legend is the closest thing to a session terminator and it's correctly understated.
- **Anxiety spikes**:
  - Pressing "None" empties the globe with no undo. Mild but real, and recurring from May 16 AM.
  - Mobile sandwich layout makes the globe feel squeezed on first paint.
  - Shift-clicking by accident on desktop isolates a team — the inverse of the destructive case but equally non-recoverable without re-pressing a preset.

## Questions to Consider

1. **The URL is the share artifact, but the address bar is a dev-shaped surface.** Most consumer apps treat sharing as an explicit verb. Does the project's portfolio-review audience justify keeping the affordance invisible, or does it cost more than it saves? A fourth icon in the cluster ("Share link") would let the project surface its single most-impressive technical move in the first three seconds.
2. **Is "Longest 5" the right narrative default, or is it just the safest one?** It optimizes for "show the lede" but a team-fan landing on a shared link wants their team. Would a geolocation guess (or a hover-to-preview division on the chip row) bring the user's team into first paint instead?
3. **What does the first 1.2 seconds buy you?** Right now the loading shimmer hands off to a fully populated panel + 5-team globe. Would a one-beat camera tilt or arc-draw-on animation make the peak earlier, before a Twitter-link viewer's attention budget expires?
4. **The dark theme is locked to "SNF primetime" — is there a third register the data wants?** The light theme is sectional-chart cartographic. The dark theme is broadcast editorial. The 4am / pre-kickoff register isn't represented and could be the most distinctive third option if a season starts to feel undifferentiated.
