---
target: "http://localhost:5173/THREE-JS-NFL-Flight-Paths/"
total_score: 28
p0_count: 1
p1_count: 2
timestamp: 2026-05-15T06-50-43Z
slug: localhost-three-js-nfl-flight-paths
---
# Critique — NFL Flight Paths globe (May 2026 follow-up)

## Anti-Patterns Verdict

**Does this look AI-generated?**

The two themes carry different verdicts.

**Light theme.** Passes first-order, passes second-order with one tunable wobble. The vellum-cream paper sphere with extruded continent plates and a warm sodium halo doesn't land where a category reflex would aim for an NFL travel viz. The second-order trap (editorial cartography, Penguin endpaper) is the explicit thesis, so the brand has named the reference rather than drifted into it. The wobble: the rendered ocean tone (`sphere: #ddd2b4`) is more saturated khaki than "vellum," and the relief plates (`#f3ead4`) read dramatically lighter than the ocean, which nudges the actual artifact toward Stamen Terrain or National Geographic field-guide territory. The thesis is committed; the resolved colors are one tuning away from drifting.

**Dark theme.** Passes first-order, passes second-order cleanly. The reflex for "sports broadcast globe" is navy or black with primary-color city dots; the reflex for "data viz globe" is the SaaS Earth-from-orbit blue. This is neither. The warm graphite plus sodium-vapor plus brown-shadow palette commits to a different lane. The second-tier trap (deep-purple-with-neon or terminal-green-on-black) is also avoided. The asymmetric halo bias on the lit hemisphere does the work that copy alone couldn't, reading as stadium lights catching the limb rather than orbital atmosphere.

**Absolute bans check.**

- Side-stripe borders: not present. Division group headers use a top-border separator at full width.
- Gradient text: not present. All title and metric copy uses solid `var(--ink)`.
- Glassmorphism as default: not present. Two surfaces remain (`.methodology__scrim`, `.mileage__scrim`); both are modal scrims, which is the legitimate-use exception.
- Hero-metric template: partially present. The two topbar metrics (`568,478 mi` plus `79,365 mi`) follow the big-number-small-label pattern. Mitigations: monospace numerals, no gradient, sit in a 38-tall chrome cluster instead of a centered fold. Still recognizable.
- Identical card grids: not present. The team list is row-stripe with grouped headers; the mileage modal uses ranked rows with trail bars.
- Modal as first thought: not present. Both modals are secondary surfaces triggered from icon buttons.

**Deterministic scan.** `npx impeccable detect --json index.html` ran clean (0 findings in both jsdom and `--fast` modes). The detector covers 27 markup-level patterns and cannot see the WebGL canvas, runtime-toggled DOM, or `styles.css`. A clean detector result here is signal that the HUD shell is tidy, not coverage of the marquee surface.

## Overall Impression

The chrome distillation, the SNF dark mode, and the typography refresh all landed. Eight glassmorphic surfaces are now two scrims; the dark theme reads as primetime broadcast instead of SaaS Earth; the topbar metrics are no longer duplicates. What's pulled into focus by removing those distractions is accessibility: keyboard reach into the panel doesn't exist, and the mobile topbar breaks. The single biggest opportunity now is making the headline interaction (per-team isolation) reachable by keyboard, which is also the lowest-cost intervention.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | URL state updates silently; no visual confirmation that the share link is recording |
| 2 | Match System / Real World | 4 | NFL-fan language throughout; haversine isolated to the methodology modal |
| 3 | User Control and Freedom | 2 | "Clear" actually deselects all (empty globe), not "reset to all-on"; Esc only clears tooltip |
| 4 | Consistency and Standards | 3 | Icon-button tooltips use fast `data-tooltip` (~220ms); panel-sort buttons still use native `title=` (~1s) |
| 5 | Error Prevention | 3 | Baked data; filter degrades gracefully; URL `view=` clamped to OrbitControls limits |
| 6 | Recognition Rather Than Recall | 2 | Four icon-only topbar buttons in identical 38px chrome; mileage glyph is bespoke and ambiguous |
| 7 | Flexibility and Efficiency | 2 | URL state is the lone keyboard-friendly accelerator; no shortcuts, no team search, no tab order through 32 rows |
| 8 | Aesthetic and Minimalist Design | 4 | Single dominant idea; chrome reduced to two surfaces; metrics no longer duplicate |
| 9 | Error Recovery | 2 | "Failed to load, see console" copy; no retry; no empty state for zero-team filter |
| 10 | Help and Documentation | 3 | Methodology modal is excellent; no first-run for the panel itself; preset meanings ("Longest 5", "International") unlabeled |
| **Total** | | **28/40** | **Good. Accessibility + keyboard are the dragging weight.** |

**Cognitive load checklist:** 0 fails, 1 partial (Minimal choices: five preset chips plus 32 team rows visible simultaneously). **Low.**

## What's Working

1. **The mileage modal animation.** Each team row is a left-anchored color-tinted trail with a small airplane glyph that flies to the team's mileage position on staggered 780ms ease-out curves. It earns its place by giving the league hierarchy narrative weight a static bar chart wouldn't carry.
2. **The Departure Mono + Geist + Unbounded triplet.** Three families is usually a smell. Here each carries a distinct register: Unbounded for display, Geist for chrome and copy, Departure Mono for every miles count. The mono is the move that keeps the design from drifting into editorial-typographic lane; mono reads as voice here because the project is literally about distance counting.
3. **The dark-mode atmosphere shader's `lightDir` bias.** The fragment shader biases halo brightness toward the key-light hemisphere, so the warm spill is asymmetric (visible at the bottom-right limb in Pacific rotation, dim at top-left). That asymmetry is what stops the halo from reading as the SaaS-globe cliché. The shader work carries the brand thesis where copy alone couldn't.

## Priority Issues

### [P0] Team rows are unreachable by keyboard

**What.** All 32 `.team-row` elements have `tabIndex=-1`, no `role="button"`, no keyboard handler. The hint copy says "click a team to isolate"; that primary interaction has no keyboard path.

**Why it matters.** The interface advertises an interaction (single-team isolation) a keyboard-only user cannot perform. Filter presets work because they're real `<button>` elements, but the granular per-team selection that makes the panel useful is gated behind pointer-only access. This is a WCAG 2.1 SC 2.1.1 (Keyboard) failure and Sam cannot use the headline affordance.

**Fix.** Promote `.team-row` to `<button>` (or add `role="button" tabindex="0"` and Enter/Space handlers in `src/ui.js:buildTeamPanel`). Add a `:focus-visible` outline that respects the team accent.

**Command:** `/impeccable harden`

### [P1] Mobile topbar breaks: icon cluster clipped, metrics truncated

**What.** At 375×812 the right-hand `.topbar__meta` flex group overflows or breaks lines without preserving the icon cluster. Header metrics clip to `League t…` and `Internat…`; the four icon buttons (mileage, methodology, coffee, theme) wrap behind the title cluster or run off-screen. Theme switching is impossible on a phone.

**Why it matters.** The `@media (max-width: 760px)` block adjusts flex-direction and shrinks `.metric` min-width but does not handle the icon cluster. The mobile experience cannot toggle themes or open the data explainers.

**Fix.** In the mobile media query, either dock the icon cluster to a fixed bottom-right above the panel, or wrap it as a second row inside the topbar. Reduce or hide the season tabs at mobile sizes since they're not load-bearing for a first read.

**Command:** `/impeccable adapt`

### [P1] "Clear" filter copy is misleading

**What.** The "Clear" pill at the right end of the preset row deselects all teams, producing an empty globe. Users intending to reset the filter expect "Clear" to mean "go back to all-on," which is what the "All" pill does. The visual treatment compounds the problem: `border-color: transparent` reads as disabled.

**Why it matters.** Riley will probe this and discover that "Clear" produces an empty globe with no copy explaining the void. The mismatch between expected meaning ("clear the narrowing filter") and actual meaning ("select nothing") is both a Nielsen-3 (user control) and Nielsen-2 (match real world) miss.

**Fix.** Either rename "Clear" to "None" or "Hide all" (matching actual behavior), or remove the chip and let "All" double as the reset. If the empty-state must be reachable, add copy in the hint position: "0 teams selected. Try All, AFC, or a division."

**Command:** `/impeccable clarify`

### [P2] Icon button glyphs don't communicate function

**What.** The four icon-only buttons in the topbar sit in identical 38px circular chrome. The mileage icon is a stylized airplane that reads as "flight tracking," not "table of mileage by team." The methodology icon is a generic info circle. CSS `::after` tooltips fire after 220ms, which mitigates but doesn't solve.

**Why it matters.** Jordan hovers each in sequence to figure out what they do. That's extraneous cognitive load across four buttons, and the coffee donation icon competes with two data-explainer icons for the same visual rail.

**Fix.** Either (a) add persistent text labels in a wider topbar layout, (b) consolidate mileage and methodology into one "About this data" icon that opens a tabbed modal, or (c) swap the mileage icon for a horizontal-bar-chart glyph that's category-conventional. Move the coffee icon to a less prominent position.

**Command:** `/impeccable clarify`

### [P2] Light-mode sphere reads closer to "field guide" than "Penguin endpaper"

**What.** The thesis names "vellum-cream paper" but the resolved palette (`sphere: #ddd2b4`, `relief: #f3ead4`) renders as a saturated khaki with the relief plates reading dramatically lighter than the ocean. The contrast between khaki ocean and cream landmass does legibility work appropriate to a topographic-field-guide aesthetic, not to an antique-atlas endpaper where ocean and land share one paper tone and only border ink separates them.

**Why it matters.** This is the second-order slop wobble. The brand thesis is committed; the rendered artifact is one tuning away from drifting into the saturated category-reflex lane (Stamen Terrain, National Geographic). Dark mode commits more decisively to its thesis than light mode does to its.

**Fix.** Either tighten the light theme (pull `sphereColor` toward `#e8dfc8` and `reliefColor` toward `#ece2cc` so they share a paper tone, letting country line ink plus relief shadow carry legibility, the true endpaper move), or commit harder the other way (deepen the ocean toward sepia `#c8b48a`, push the cream higher, update the thesis copy to match).

**Command:** `/impeccable bolder` (or `/impeccable quieter` on the relief contrast)

## Persona Red Flags

**Jordan (confused first-timer):**
- Four topbar icon buttons. Three look like generic chrome; the mileage icon is bespoke and unreadable.
- "Longest 5" and "International" preset meanings are unlabeled. Longest 5: longest schedule, longest single trip, top five international travelers? International: teams playing abroad, all teams that have crossed a border?
- "Clear" produces an empty globe with no copy. Likely refresh-and-retry response.
- "Click a team to isolate" hint copy doesn't surface a button affordance on the rows themselves; team rows look like data-display, not control.

**Riley (stress tester):**
- `?teams=none` URL loads an empty globe with no recovery copy.
- Filter and season change in the same tick: data-active row states may not survive the rebuild cleanly.
- Away-ring markers at opacity 0.55 against the dark globe in Pacific rotation are barely visible; likely to read as "missing."
- Wikipedia photo 404 swallows silently; tooltip becomes text-only with no diagnostic, reads as broken feature.

**Sam (vestibular sensitivity + keyboard / screen reader):**
- Zero of 32 team rows are tabbable. This is the P0.
- `prefers-reduced-motion` correctly freezes the WebGL travelers and disables CSS transitions, but the mileage modal's airplane glyphs still translate via `left:` property change (transition removal makes the translation instant, doesn't remove the movement). Verify on a real reduced-motion system.
- No `:focus-visible` outline rule in `styles.css`. The browser default ring against cream or charcoal chrome may be invisible.
- Stadium tooltip uses `role="tooltip"` but anchors to a canvas hover; no equivalent keyboard surface for stadium discovery.

## Minor Observations

- Hint copy uses interpunct (`·`) separators; some screen readers verbalize as "middle dot." Mildly noisy.
- Logo image has `alt=""` and `aria-hidden="true"`; correct since "NFL Flight Paths" follows in the H1.
- Season tabs use `role="tablist"` and `role="tab"` but no `role="tabpanel"` is wired to the season. Correct in spirit since the globe itself is the panel, but a screen reader expects the relationship.
- `font-synthesis: none` is set globally; responsible for Geist's weight rendering correctly. Side effect: places relying on browser-synthesized italic would produce upright text silently (no such places in this codebase).
- `--intl-marker` resolves to `#7a6b3d` light, `#f3ecd6` dark; reads as a distinct material against team accents.
- "Failed to load, see console" copy is too generic. Suggested: "Failed to load globe data. Refresh to try again or check your network."
- Methodology modal close button uses `×` at 22px. Fine, but Esc-to-close isn't wired (only the tooltip listens for Escape).
- Tooltip 90ms show / 70ms hide is a tight stadium-hover budget; nice tuning.
- The coffee-icon `<a>` reuses the `.theme-toggle` class for layout convenience; misleading class name, no impact on metrics.
- The `prefers-reduced-motion` CSS rule sets `animation-duration: 0ms !important` globally, which kills the loading bar's slide animation. On a slow connection a reduced-motion user sees a static "Loading globe" bar with no indication anything is happening. Consider exempting `.loading__bar::before`.

## Questions to Consider

1. **Is the brand thesis already two theses?** Light mode names museum cartography and antique atlas; dark mode names Sunday Night Football primetime broadcast. They share typefaces and chrome, but the visual rhetoric pivots between *quiet historical reference document* and *loud broadcast graphic*. Intentional duality (theme as context switch), or an unresolved identity? If intentional, lean further into the contrast.
2. **Why is per-team selection mouse-only when the rest of the UI was clearly designed with accessibility in mind?** Reduced-motion gating, the tooltip role, the season tablist, the icon-button aria-labels: someone cared enough to do those things. The team-row tabindex gap looks like an oversight.
3. **What is the preset row teaching that the team list can't?** Both presets compute filter results reachable by clicking individual teams. If the panel is good enough to make filtering granular, the presets read as shortcuts. If the presets are the primary entry, why is the panel always showing 32 rows?
4. **The mileage modal trail animation is the strongest narrative moment in the project. What does it suggest about where the design could go?** That animation has weight (airplanes fly from shortest to longest in staggered order; you can feel the league hierarchy). The globe doesn't have a comparable narrative moment. Is there a guided-tour mode, a week-by-week season flythrough this modal hints at as the next horizon?
