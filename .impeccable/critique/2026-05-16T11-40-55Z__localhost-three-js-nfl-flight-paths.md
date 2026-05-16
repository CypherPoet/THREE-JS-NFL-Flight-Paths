---
target: "http://localhost:5173/THREE-JS-NFL-Flight-Paths/"
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-05-16T11-40-55Z
slug: localhost-three-js-nfl-flight-paths
---
---
target: "http://localhost:5173/THREE-JS-NFL-Flight-Paths/"
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-05-16T11-39-05Z
slug: localhost-three-js-nfl-flight-paths
---
# Critique — NFL Flight Paths globe (live, post-PR-15)

**Target**: `http://localhost:5173/THREE-JS-NFL-Flight-Paths/`
**Run date**: 2026-05-16 (post-PR-15)
**Compared against**: May 16 baseline (30/40), persisted at `.impeccable/critique/2026-05-16T08-45-31Z__localhost-three-js-nfl-flight-paths.md`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading bar good; selection state mirrored in chip + faded arcs; URL state writes silently with no toast or read-back of which preset/sort applied |
| 2 | Match System / Real World | 4 | Schedule, divisions, accent colours, stadium photos all match domain expectations; methodology modal carries the haversine + 0.3% honesty note |
| 3 | User Control and Freedom | 3 | Escape closes modal + tooltip; preset "All" recovers; URL captures state. No undo for accidental click-deselect mid-exploration |
| 4 | Consistency and Standards | 3 | `wireModal` shared across modals; chip family is consistent; H1 display-font vs panel H2 tracked-uppercase Geist is intentional but creates two heading grammars to learn |
| 5 | Error Prevention | 2 | EMPTY_HINT catches the all-deselected blank globe well, but no prevention for a user nuking selection and not realizing presets exist |
| 6 | Recognition Rather Than Recall | 3 | Legend uses dot + ring + text; hint enumerates each gesture including the modifier ("shift-click to isolate"). Modifier hint buried in 10px line over the busy globe |
| 7 | Flexibility and Efficiency | 3 | URL state, keyboard activation on team rows, season switch, preset chips, sort toggle. No keyboard shortcut for isolate-this-team beyond click |
| 8 | Aesthetic and Minimalist Design | 3 | Topbar is dense (logo + wordmark + sublabel + season switch + 2 metric cards + 3 icon buttons); chrome could distill further |
| 9 | Error Recovery | 3 | Loading failure message friendly; Escape clears tooltip; EMPTY_HINT explains blank globe; stadium photo 404 now renders the reticle placeholder instead of collapsing |
| 10 | Help and Documentation | 3 | Methodology modal genuinely thorough; hint covers gestures; no in-product onboarding past the hint line |
| **Total** | | **30/40** | Holds the May 16 line. Chrome/globe tonal collision in light mode, default-view overload, and topbar density are the three drags. |

**Trend**: 30 → 28 → 30 → **30**. The May 16 P0 (hint copy mismatch) and four-icon cluster were closed; new findings are the slate-chrome's second-order reading and the always-present default-view density.

## Anti-Patterns Verdict

**Start here. Does this look AI-generated?**

**LLM assessment**: Passes first-order convincingly. Light theme is not navy-glass; dark theme is not neon-on-black. Both palettes commit to a specific cultural reference (FAA sectional cartography, SNF primetime broadcast) and the chrome carries those references through font choices, tracked-uppercase H2 kicker grammar, and a mono numeric voice. The animated planes-on-arcs idea avoids collapsing into generic "data-viz globe with glowing dots"; team-coloured pulses on elevated relief plates and a sodium-vapor halo bias in dark mode read as authored.

Second-order, the slate light register is the riskiest move and isn't fully landing yet. The body chrome (`#eff2f6` / `#e8ebef`) sits in the same dominant tone as the globe ocean (`0xa5c0c8`) and dark continents (`0xe6d4b0`); to a cold viewer the light page reads as a dark scene with a thin paper bezel rather than a sectional chart pinned to a desk. The intent ("chrome lives in the sectional ocean's family") is sound but oblique; a portfolio viewer flipping between themes sees less differentiation than the theme system implies. The empty-state stadium reticle (visible when Wikipedia 404s) and the methodology modal copy are the strongest anti-slop signals in the project.

**Deterministic scan**: `npx impeccable detect --json index.html` returned `[]`. Zero findings. Absolute bans remain clean: no side-stripe borders, no gradient text, no glassmorphism beyond the legitimate modal scrims, no hero-metric template, no identical card grids, no em dashes in UI copy.

## Overall Impression

The post-PR-15 surface holds the 30/40 line, closing the May 16 P0/P1 cluster (hint contract, mobile tooltip clip, mileage wrap, stadium empty-state, icon cluster) without regression. The dark theme continues to be the strongest authored register: sodium-vapor halo, warm graphite ocean, lit-turf relief, and the new dark-only limb vignette all reinforce the primetime-broadcast thesis. The light theme is what's now load-bearing: the slate chrome shift resolved the prior cream/cool mismatch but introduced a new tonal collision where chrome and globe occupy the same cool dominant. The single biggest opportunity is to push the light chrome into either a brighter desk-paper register or a deliberately temperature-contrasted warm-grey so the slate ocean reads as a chart pinned to a surface rather than camouflaged into it.

## What's Working

1. **Mileage modal remains the portfolio set-piece.** Contrails drawing in with team-coloured plane glyphs at the tip, sorted descending, tabular-nums mono mileage. Metaphor is literally "miles flown," motion is purposeful, typography correct for the content. Rewards a click with an animated payoff and a real ranking.
2. **Methodology modal earns trust.** Includes the haversine formula, the 0.3% WGS-84 error honesty note, the neutral-site rule, and pointers to specific source files. Makes the work feel rigorous instead of decorative; most data-viz portfolios skip this kind of disclosure.
3. **The empty-stadium reticle (new this wave).** When Wikipedia returns no thumbnail, the placeholder is a masked SVG sectional crosshair in `--ink-soft`, not a stock no-image glyph. Tier-1 craft detail; the level of finish that separates a craft project from a templated one.

## Priority Issues

**[P1] Light-mode chrome and globe register as the same dominant tone**
- **What**: After the slate chrome shift (`--bg #e8ebef`, `--paper #eff2f6`), the body sits in the same cool family as the globe ocean (`sphereColor: 0xa5c0c8`) and dark continent relief (`0xe6d4b0`). The dominant visual reads "dark scene with a thin paper bezel," not "sectional chart pinned to a desk." A portfolio viewer flipping between themes sees less differentiation than the theme system implies.
- **Why it matters**: The slate move was the strategic reset to live in the broadcast/cool family with the globe. But the value rendering hasn't yet read the intent back: the chrome doesn't frame the sphere, it camouflages into it. Light mode reads as "lighter dark mode" rather than a distinct register.
- **Fix**: Two options. (a) Lift the chrome luminance 4–6% (push `--paper` toward `#f4f6f9`, `--bg` toward `#edf0f3`) so the chrome reads as a brighter desk surface holding the cool sphere. (b) Commit to a deliberate warm-grey desk paper (`#ecedef` → `#e5e7e9` with a touch of warmth) so the chrome/globe relationship becomes a deliberate temperature contrast (warm paper, cool sea) — closer to a real FAA sectional pinned to a desk.
- **Suggested command**: `clarify` (the brand thesis is locked; the value rendering needs to read it back) or `colorize` if option b commits to a temperature axis.

**[P1] Default "All teams" view is visually overloaded**
- **What**: First-paint shows ~270 arcs crossing the lower 48; the Northeast corridor braids into noise even at 2px line width. A first-timer has no prompt to filter, and the data story (which team flies farthest? where do international games sit?) is buried under the braid.
- **Why it matters**: The visualization's hook moments (Longest 5, individual team mileage, international venues) are all behind a filter the user has to discover. Default-view density is the same issue the original Feb baseline flagged; the chrome to filter exists but the first paint doesn't teach the filter.
- **Fix**: Two paths. (a) Ship with the "Longest 5" preset active on first load and let the user expand to All from the preset chip row. (b) Add a brief one-time "Try a preset" nudge on the first preset chip (CSS-only animation, fades after 4s or first interaction). The chrome already supports it; the framing needs to teach the filter at the moment of first paint.
- **Suggested command**: `onboard` (first-paint state is exactly what `onboard` is for) or `clarify` (if the fix is a copy nudge rather than a default-state change).

**[P2] Topbar density competes with the data**
- **What**: At desktop the topbar carries logo + wordmark + season sublabel + season switch + 2 metric cards + 3 icon buttons. That's 8 first-class objects before reaching the globe. The icon buttons (mileage glyph + methodology "i" + theme toggle) read as three near-identical pill chips at the right edge after the coffee-link move out reduced the cluster from four.
- **Why it matters**: The May 16 four-icon-cluster P1 was addressed by relocating coffee, but the residual three-icon cluster still competes with the wordmark + season switch + metric cards for the first read. The chrome works but it's denser than the SNF/sectional registers warrant; both reference families lean spare.
- **Fix**: Two options. (a) Demote the methodology "i" by moving it to the legend or to a footnote-style link from the metric subtitle ("How miles are calculated"). (b) Visually group the three chips as a single attached pill cluster so they read as one tool rail rather than three buttons.
- **Suggested command**: `distill`.

**[P2] Mobile H1 + sublabel sit on top of the globe with no scrim**
- **What**: At 375px the H1 ("NFL Flight Paths", 22px Big Shoulders 700) and the sublabel sit directly over the globe. Contrast is fine on the cream-relief patches behind them but degrades against team-coloured arcs and travelers crossing through the title region. The 1px text-shadow is on `.hint`, not on `.topbar`.
- **Why it matters**: Mobile is the lighter-test viewport for portfolio reviewers thumbing through projects. A wobbly title block on first paint reads as unfinished, even if every other interaction is solid.
- **Fix**: Add a soft radial gradient or text-shadow behind the topbar titles only at `<760px`, or apply `--paper-soft` as a frosted background under the title cluster on mobile. Desktop layout doesn't need it (panel handles the lower-left mass).
- **Suggested command**: `harden` (mobile robustness) or `adapt` (mobile-specific layout treatment).

**[P3] Two heading grammars compete in the chrome**
- **What**: H1 "NFL Flight Paths" uses display-font Big Shoulders at the large display size; panel H2 "TEAMS" uses UI-font Geist at 13px tracked-uppercase; methodology h3s use Geist body weight as a third grammar. The kicker-vs-title intent is real but the page asks the eye to learn three label systems before reading anything.
- **Why it matters**: Lower-priority than P1/P2 because the page is still readable, but the typeset thesis would land harder if section labels consolidated on one grammar. The most authentic broadcast/sectional move is uppercase-tracked Geist sections everywhere with a smaller, lighter display mark.
- **Fix**: Decide whether chrome speaks in display-font or UI-font for section labels and consolidate. Either kick the H1 down and use tracked-uppercase Geist for all section labels, or commit to display-font for all section labels and demote the kicker.
- **Suggested command**: `typeset` or `clarify`.

## Persona Red Flags

**Alex (Power User)**: URL captures state, panel rows are keyboard-activated with team-coloured focus rings, modifier-click isolate now matches the hint copy. Still no keyboard shortcut for isolate-this-team beyond click, no `/`-team-search, no number-row preset hotkeys. Active preset chip clears when selection drifts from canonical — Alex would expect a "custom" badge instead of all chips going inactive.

**Jordan (First-Timer)**: Sees ~270 arcs braided across the lower 48 and a 10px hint line at the bottom enumerating four gestures at once. Doesn't know what story to look for. The "16 teams travel internationally" subtitle in the panel is the best hook on the page; it could be more visually prominent (or read out as the page's lede). The hint copy fix from May 16 helps Jordan understand the click contract once they engage; default-view density is what gets them to disengage before they engage.

**Sam (Mobile/Touch)**: Hint and legend are display:none on mobile, so the "shift-click to isolate" tip is gone, and modifier-tap conventions don't exist anywhere. Tap-on-stadium is supported but tap targets are the 0.03-radius hit proxies, awkward to find without pinch-zoom. The mobile theme-toggle tooltip clip fix (May 16) is intact at 375. H1 contrast over the globe is the new mobile concern.

**Portfolio Reviewer (project-specific)**: This is the primary audience. The reviewer scans the first three seconds: brand mark, wordmark, league total miles, globe with animated arcs. That sequence works. They look for craft details and find the mileage modal contrails, the methodology modal honesty, the dual-season switch, the stadium tooltips. Tier-1 craft project. The unspoken question is "would this hold up in a Pasini / Bestiario / Pitch portfolio?" — the dark mode answers yes; the light mode is still finding the chrome/globe relationship.

## Minor Observations

- The "By division" / "By miles" sort toggle and the season switch share filled-pill active treatment but use different text systems (UI micro vs mono micro on identical button shapes).
- `data-tooltip` chip tooltips have an 80ms reveal delay and 80ms transition — fast enough to teach on first hover, slow enough not to thrash. Well-calibrated.
- The active-state focus ring on team rows uses `var(--accent, var(--ink))` so the keyboard ring carries team identity. Quietly excellent.
- `prefers-reduced-motion` gates the traveler loop, the bar-draw transitions, AND keeps the loading bar animating with an explanatory `!important` override. Textbook.
- The contiguous-US framing rotation (`group.rotation.x = 0.58, .y = 0.1`) is deliberate and lands US visible on load. A 5° downward tilt would prevent lower-48 bottom-clipping on shorter desktop windows.
- The international intl-marker hue (`#7a6b3d` in light, `#f3ecd6` in dark) reads as a distinct material against any team accent — solid solution to a hard problem.
- `.team-row__bar-intl` uses `color-mix(... var(--accent) 35%, transparent)` for the box-shadow ring — modern CSS, won't degrade gracefully on Safari <16.2 but acceptable.
- The vignette-on-dark plus light-direction-bias atmosphere is the dark theme's strongest authorship signal: specifically not the uniform-ring halo a templated globe would have.
- Hint copy uses interpunct separators (`·`); some screen readers verbalize "middle dot middle dot". Mildly noisy but the comma alternative breaks rhythm.

## Cognitive Load

- Fail count: **3/8**
- Verdict: **Moderate**
- Specific fails:
  - Topbar carries 3 metrics + 3 icon buttons + 1 brand cluster + 1 season switch — eight first-class objects competing for the first read.
  - Two heading grammars (display-font H1 + tracked-uppercase H2 "TEAMS") force the eye to learn two label systems on first scan.
  - In "All teams" default view, 22+ arcs braid through the lower 48; no progressive disclosure of the data story.

## Emotional Journey

- **Peak**: First load. Globe spins gently into frame, country relief reads sculpted, arcs animate with team-coloured pulses, mileage tally rolls in. The combination of "this is real schedule data" plus "this is rendered with care" lands instantly.
- **End**: Opening the mileage modal. Contrails draw in with plane glyphs ranking 32 teams; this is the moment the project transcends "neat globe" into "this person actually thought about it."
- **Anxiety spikes**:
  - First-time user lands on default view: 22 braided arcs in lower 48, no obvious "where do I start?" hook.
  - Mobile H1 + sublabel contrast against bright country relief and team-coloured arcs in the title region.
  - Clicking a team row by accident toggles it off; EMPTY_HINT is friendly but no Undo affordance beyond hunting for "All" preset.

## Questions to Consider

1. Should the light theme be lighter, or slate-with-warm-paper-accents? Right now it's slate-on-slate. A genuine FAA sectional has cool sea, warm land, and a true-white or warm-grey desk paper backing. Could the chrome be paper-white (`#f6f5f1`) with a subtle slate tint only on hover states, so the chrome reads as paper and the globe sits ON it instead of IN it?
2. What if the default view filtered itself? If first-load showed Longest 5 with a "View all 32" toggle inline in the panel header, the data story would teach itself in three seconds instead of asking the user to discover it.
3. Could the methodology modal become a permanent rail item rather than a buried "i" button? A small "Methodology" link in the legend (paired with the coffee link) would make the rigor more discoverable. The methodology IS a feature of this project; hiding it behind an icon undersells it.
4. What's the dark theme's payoff moment for a first-time visitor? Right now it's halo + vignette + lit-turf relief. But the moment a portfolio reviewer would screenshot is hard to identify because no single arc draws the eye at the all-teams default. Would a subtle "spotlight team of the week" or "this week's longest flight" cycle reveal that payoff?
