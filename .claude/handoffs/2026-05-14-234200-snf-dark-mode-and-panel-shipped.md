# 🤝 Handoff: SNF dark mode + division grouping + international story shipped via PR #10; typography + chrome distillation deferred

## 🧾 Session Metadata
- Created: 2026-05-14T23:42:00Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch: `main` (this handoff arrived via PR #10)
- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths (PRIVATE)
- Source PR: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/10

### Recent Commits (for context)
  - PR #10 (this handoff's source) — two commits, fast-forward or merge depending on settings:
    - Repaint dark mode to a Sunday Night Football broadcast and group the team panel by division
    - Fix stacked-bar international share denominator and add session handoff (this file)
  - 7b49a68 Merge pull request #9 from CypherPoet/worktree-bugfix-01 (upstream — tooltip fix)
  - 799d8fa Drop dead guards left behind by the tooltip filter removal (upstream)
  - 902770a Show stadium tooltips regardless of team-filter selection (upstream)
  - 178e874 Add Claude Preview launch config for the Vite dev/preview servers

## 🔗 Handoff Chain

- **Continues from**: [2026-05-13-212008-misc-improvements-followup.md](./2026-05-13-212008-misc-improvements-followup.md)
  - Previous title: NFL Flight Paths — misc polishes (sans type, atmosphere, US framing) shipped, awaiting full 2026 slate
- **Supersedes**: None

> Read the previous handoff for project architecture, data flow, build patterns. This handoff documents only this session's deltas + the deferred work that remains.

## 📍 Current State Summary

This was a `/impeccable critique` driven session. The user invoked the critique skill, received a 30/40 health-score audit, picked the dark-mode + panel grouping + international-story tracks (deferring chrome distillation, typography, and most P2/P3 polish), and the PR #10 work shipped all three.

The full critique is preserved at `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md` — that file contains the heuristic scoring, anti-pattern verdict, persona red flags, every priority issue, and the chosen-scope action plan. **It is the source of truth for what's deferred.** Read it before tackling any follow-up.

**What shipped in PR #10:**

1. **Dark mode → Sunday Night Football primetime broadcast.** The previous dark mode (navy sphere + cyan-white Fresnel halo) was the first-order training reflex for "globe in 3D" — Cloudflare Radar / Datadog map / generic SaaS landing page. Repainted around a "stadium lights spilling onto turf" thesis: warm-graphite tunnel sphere (`#1a1612` not navy), warm-white country line engravings (was 1.4:1 contrast against the old navy, now ~3:1+), warm sodium-vapor halo. The atmosphere shader gained a `lightDir` uniform so the halo brightens toward the lit hemisphere instead of ringing the planet uniformly — directional spill, not orbital ring.

2. **Team panel grouped by AFC/NFC division** (8 groups × 4 teams) with summed division mileage on each header, plus a `By division` ↔ `By miles` sort toggle. Replaced All / None buttons with preset chips: `All · AFC · NFC · Longest 5 · International · Clear`. Each row gained a stacked mileage bar so the first 5 seconds answer "which teams travel the farthest" without a click.

3. **International miles is now first-class** instead of a deferred detail. Replaced the duplicate `Selected / Total` mileage cards with `League total miles` + `International miles · N games`. Panel-head call-out: *"16 teams travel internationally · 79,365 mi total."* Each team row's bar shows the international portion as a contrasting cream segment (`--intl-marker` CSS variable, theme-aware).

Re-captured `media/04-dark-hero.png` and `media/05-dark-atlantic.png` via the `capture-presentational-media` skill. Light-mode shots untouched.

**Code review** (via `/code-review:code-review` skill) flagged ONE issue at confidence ≥ 80 (the stacked-bar international share was computed against `totalMiles` instead of `legMiles` — different accounting spaces, so the cream segment under-represented international travel). Fixed in commit `3e0e6f5` by switching the denominator to `legMiles` and dropping the now-unnecessary `Math.min` clamp. Two real-but-lower-priority items remain below threshold and are listed under "Deferred Items."

## 🧠 Codebase Understanding

### Architecture Overview

No architectural change from the previous handoff — same Vite + Three.js single-page app, same scene-wiring contract (createGlobe → applyThemeTo* for in-place repaints, no geometry rebuild on theme switch). Only material changes:

- `src/globe.js` — `makeAtmosphere` now takes a `lightDir` Vector3; `createGlobe` accepts a `keyLightPosition` option that gets normalized into the shader uniform
- `src/schedule.js` — `summariseByTeam` now also returns `legMiles`, `internationalMiles`, `internationalCount` per team; new `summariseInternational` rollup
- `src/data/teams.js` — added `DIVISIONS`, `CONFERENCES`, `splitDivision`, `teamConference`, `groupTeamsByDivision` helpers (derived from existing `team.division` strings — no per-team field added)
- `src/ui.js` — `buildTeamPanel` rewritten around the division/preset/sort/stacked-bar IA; `updateHeaderMetrics` simplified to season-fact reads (League total + International), no longer mutates with filter state
- `src/main.js` — passes `lights.key.position` into `createGlobe`; metric updates moved out of the panel `onChange` callback (filter no longer mutates the topbar cards)

### Critical Files

| File | Purpose | Relevance for follow-ups |
|------|---------|-----------|
| `src/themes.js` | Per-theme palette dict (sphere/relief/lines/limb/atmosphere uniforms/light colors+intensities/ground shadow stops/`travelerEmissiveBoost`) | **Dark theme is now SNF — don't drift back to navy.** Add new theme-aware values here only, never inline. |
| `src/globe.js` | Globe + atmosphere shader (`makeAtmosphere` now uses `lightDir` + `dot(N, V)` Fresnel + lit-side spill bias) + relief + country lines + ground shadow + `applyThemeToGlobe` | **`applyThemeToGlobe` does NOT update `lightDir` today.** Latent gap if anyone makes the key light position theme-dependent. Score-50 finding from code review. |
| `src/schedule.js` | `buildTravelLegs(games)`, `summariseByTeam(legs)` (now with `legMiles` + `internationalMiles` + `internationalCount`), `summariseInternational(summary)` | **Contract above `summariseByTeam` (lines 124-134) is load-bearing.** It documents that international share must be computed in `legMiles` space, not `totalMiles` space. Read before touching the bar code. |
| `src/ui.js` | `buildTeamPanel` (division grouping, presets, sort toggle, stacked bars, intl call-out), `updateHeaderMetrics`, `wireModal` | The stacked-bar denominator bug from code review was fixed; two lower-priority items (listener stacking on season switch, dead `rowsByTeam.length = 0` line) remain — see Deferred Items. |
| `src/data/teams.js` | TEAMS dict + `INTERNATIONAL_VENUES` + new `DIVISIONS` / `groupTeamsByDivision` helpers. Each team has `division: "NFC West"`-style string; conference is derived (`splitDivision`, `teamConference`). | If you add per-team data later, follow the existing `division: "<conf> <region>"` pattern — `splitDivision` parses it. |
| `src/main.js` | Scene wiring, OrbitControls config, theme toggle, season switch, panel/metric/modal wiring | Listener stacking issue lives at the panel-build call site (see Immediate Next Steps). |
| `index.html` | Topbar metric cards (now `League total miles` + `International miles` with `metric__sub` for game count), panel structure (`.panel__sort` + `.panel__intl` + `.panel__presets` + `.team-list`), modal markup. Methodology copy was rewritten to match new metric labels. | Don't reintroduce `selected-miles` IDs — they're gone. |
| `styles.css` | Massive additions for `.panel__sort`, `.panel__intl`, `.panel__presets`, `.team-group__head`, stacked bar (`.team-row__bar` + `.team-row__bar-team` + `.team-row__bar-intl`), `--intl-marker` theme variable, `.metric__sub`. Also: dark-theme `:root` variables rewritten around warm-graphite axis. | `--intl-marker` is theme-aware (light: `#7a6b3d` mustard; dark: `#f3ecd6` cream). Don't replace with team accent. |
| `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md` | Full `/impeccable critique` output + chosen-scope action plan + deferred items list | **READ FIRST** for any follow-up — has heuristic scoring, anti-pattern verdict, all priority issues, persona red flags, and the rationale for what shipped vs deferred. |

### Key Patterns Discovered

1. **Atmosphere shader light-direction bias.** A pure Fresnel halo on a back-side sphere produces a uniform rim around the planet — exactly the SaaS-globe cliché. Adding a `lightDir` world-space uniform and multiplying alpha by `mix(0.18, 1.0, dot(vWorldNormal, lightDir) * 0.5 + 0.5)` makes the halo brightest on the lit hemisphere, fading to ~18% on the night side. Critical: `vWorldNormal` must be computed via `mat3(modelMatrix) * normal` (model-only transform), NOT `normalMatrix` which includes the view matrix and would make the lit side track the camera. Reads as "stadium light spilling outward," not "Earth from orbit."

2. **Two mile-accounting spaces, two purposes.** `legMiles` (raw great-circle of outbound legs) and `totalMiles` (chronological sequential walk with return flights between non-consecutive away weeks) are not interchangeable. Documented in `src/schedule.js:124-134`. Mixing them — e.g. dividing `internationalMiles` (in legMiles space) by `totalMiles` (sequential space) — silently understates ratios. The contract exists because this is easy to get wrong. **Code-review finding #1 was exactly this mistake** in the bar computation; see Immediate Next Steps.

3. **Glassmorphism count is actively tracked.** The critique flagged 8 `backdrop-filter: blur()` surfaces as the "rare and purposeful" anti-pattern. New chrome added in this PR (preset chips, sort toggle, intl call-out, group headers) deliberately uses **plain text/borders** with no blur — to avoid bumping the count from 8 to 12. Future chrome should follow the same rule until chrome distillation runs.

4. **Division parsing from existing `division` strings.** `data/teams.js` already had `division: "NFC West"`-style strings on every team. Rather than adding a separate `conference` field to all 32 entries, this PR added `splitDivision` / `teamConference` / `groupTeamsByDivision` helpers that parse the existing strings. Single source of truth, no duplicated data.

5. **The team panel is rebuilt on every season switch.** `loadSeason()` calls `buildTeamPanel()` which queries the static `.panel__preset` and `.panel__sort-button` DOM nodes (declared in `index.html`) and binds click handlers. Each call adds another listener layer. **Latent listener-stacking bug** — documented in Deferred Items as item 0a. The previous `wireSelectAllNone` had the same shape on 2 buttons; PR #10 expanded the surface area.

## 🏁 Work Completed

### Tasks Finished

- [x] `/impeccable critique` of the current globe scene → 30/40 health score, written to plan file
- [x] Plan iteration with user — picked dark mode + panel grouping + international story tracks; deferred typography, chrome, and P2/P3 polish
- [x] Dark theme repaint to SNF broadcast aesthetic (`src/themes.js` `dark` block + `[data-theme="dark"]` CSS variables)
- [x] Atmosphere shader rewrite — added `lightDir` uniform with lit-side spill bias (`src/globe.js`)
- [x] `summariseByTeam` extended with `legMiles` + `internationalMiles` + `internationalCount`; new `summariseInternational` rollup (`src/schedule.js`)
- [x] `data/teams.js` helpers (`DIVISIONS`, `splitDivision`, `teamConference`, `groupTeamsByDivision`)
- [x] `buildTeamPanel` rewrite — division grouping + sort toggle + preset chips + stacked mileage bars + intl call-out (`src/ui.js`)
- [x] Replace duplicate Selected / Total metric cards with League total + International (with game count sublabel) (`index.html` + `src/ui.js`)
- [x] Methodology modal copy rewritten to match new metric semantics (`index.html`)
- [x] Re-captured `media/04-dark-hero.png` and `media/05-dark-atlantic.png` at 1920×1200 via playwright-cli
- [x] Rebased onto current main, resolved conflict in `src/main.js` (both sides converged on dropping `tooltip.refreshActive()` and the inline `updateHeaderMetrics({active, summary})`)
- [x] PR #10 opened with detailed body + test plan
- [x] `/code-review:code-review` invoked on PR #10 — 1 issue ≥ 80 confidence posted as comment
- [x] Stacked-bar international share denominator fixed (commit `3e0e6f5`) — switched from `intlMiles / totalMiles` to `intlMiles / legMiles`, dropped the `Math.min` clamp; visually verified across both themes with the (more complete) 2025 schedule data
- [x] This handoff drafted and committed alongside the bug fix

### Files Modified

- `index.html` — topbar metrics, panel structure, methodology modal copy, `<meta theme-color>` for dark
- `src/data/teams.js` — added DIVISIONS / CONFERENCES / splitDivision / teamConference / groupTeamsByDivision exports
- `src/globe.js` — atmosphere shader lightDir uniform + spill bias
- `src/main.js` — pass `keyLightPosition` to createGlobe; remove `tooltip.refreshActive` + inline metric update from onChange callback; pass `intl` to buildTeamPanel + updateHeaderMetrics; drop `wireSelectAllNone` import
- `src/schedule.js` — extend summariseByTeam, add summariseInternational
- `src/themes.js` — rewrite dark block (warm graphite + sodium-vapor halo)
- `src/ui.js` — full buildTeamPanel rewrite, updateHeaderMetrics rewrite, wireSelectAllNone removed; second-round edit in commit `3e0e6f5` to fix the bar denominator
- `styles.css` — `--intl-marker` theme variable; metric__sub; panel head + sort + intl + presets; team-group + stacked bar; reduced-motion clause for bars; dark theme `:root` variables rewritten around warm-graphite axis
- `media/04-dark-hero.png` — re-captured
- `media/05-dark-atlantic.png` — re-captured

### Decisions Made

- **Skipped the 3-comp typography exploration the original plan included.** User answered the dark-mode-thesis question directly with "NFL night game / Sunday Night Football broadcast" — no need to A/B Night-Flight-Deck vs. Chalk-Chartroom vs. Plotter-Pen. Went straight to making SNF concrete.
- **Skipped Track 2 (typography) entirely** in favor of bundling it as its own follow-up PR. Reason: typography touches every text node, deserves prototyping against both registers (light museum-cartography + dark SNF), and fits cleanly behind `/impeccable typeset`. Bundling with this PR risked blurring the dark-mode + panel wins behind unrelated layout shifts.
- **Pulled the duplicate-metric fix INTO scope** mid-flight when user flagged international miles as "the emerging story of the season." Replacement matches that framing (League total + International with game count).
- **Bar length encoded to `totalMiles`, not `legMiles`,** so the bar visually correlates with the per-team mileage readout to the right of it. The international segment WITHIN the bar is a `legMiles`-space ratio (per the contract documented above `summariseByTeam`). The first commit (`9138d7c`) accidentally divided into `totalMiles` and clamped with `Math.min`; commit `3e0e6f5` corrected the denominator to `legMiles` and dropped the clamp.
- **Plain text + 1px border for new chrome (preset chips, sort toggle, group headers)** to avoid bumping the glassmorphism-surface count from 8 to 12+.
- **Deferred to follow-up:** chrome distillation, typography refresh, light-mode atmosphere intentionality, arc spaghetti / fat-line shaders, prefers-reduced-motion ignoring the traveler animation loop, URL state, back-side arc/marker bleed-through in the Pacific view, icon-only methodology / mileage button labels, title cluster density.

## 🚧 Pending Work

### Immediate Next Steps

**Start a fresh session for `/impeccable typeset`** — the highest-impact deferred item. Manrope (body) and JetBrains Mono are both saturated picks in the data-viz space; the plan recommends prototyping **Geist + Departure Mono** as the primary candidate, **General Sans + Berkeley/Departure Mono** as fallback. Brief-voice words: *"broadcast, technical, slightly mechanical, weekend-evening."* Pin the choice against both registers (light museum-cartography + dark SNF). The full guidance is in the deferred-items section of the [critique plan](/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md).

The two lower-confidence code-review items from PR #10 (listener stacking on season switch; the dead `rowsByTeam.length = 0` line) are below the merge-blocking threshold and live at the top of "Deferred Items" — pick them up alongside the typeset work or in a separate cleanup pass.

### Blockers/Open Questions

None blocking. The bar-denominator fix is straightforward.

### Deferred Items

In rough priority order. All sourced from `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md` except the first two, which came from the PR #10 code review and scored below the merge-blocking threshold.

0a. **(Code review, score 75) Fix listener stacking in `src/ui.js` `buildTeamPanel`.** Each call rebinds click handlers to the static `.panel__preset` and `.panel__sort-button` DOM nodes (declared in `index.html`, not recreated per call), so each `loadSeason` invocation stacks another layer of listeners holding stale closures. Practical impact today is small — only 2 seasons exposed — but it will bite if more seasons are added or someone switches seasons several times during dev. Cleanest fix: hoist the preset/sort wiring out of `buildTeamPanel` into a one-time `wirePanelControls` function called from `main.js` startup that dispatches into the *current* panel via a top-level lookup (e.g. `currentPanel?.applyPreset(...)`). Alternative: clone-and-replace the buttons inside `buildTeamPanel` to drop existing listeners before re-binding.

0b. **(Code review, score 50) Drop `rowsByTeam.length = 0`** in `src/ui.js` (early in `renderRows`). `rowsByTeam` is a plain object, not an array; the line is a no-op. The next `for (const k of Object.keys(rowsByTeam)) delete rowsByTeam[k];` does the actual clear. Pure cleanup.

1. **`/impeccable typeset`** — Manrope (body) and JetBrains Mono are getting saturated in the data-viz space. The plan recommends prototyping **Geist + Departure Mono** as primary candidate, **General Sans + Berkeley/Departure Mono** as fallback. Unbounded for display can stay (it has voice). Brief-voice words: *"broadcast, technical, slightly mechanical, weekend-evening."* Pin the choice against both registers (light museum-cartography + dark SNF broadcast).

2. **`/impeccable distill`** — Chrome distillation. 8 glassmorphic surfaces (`.season-switch`, `.metric`, `.theme-toggle`, `.panel`, `.hint`, `.legend`, `.stadium-tooltip`, `.methodology__scrim`, `.mileage__scrim`) → ~2. Differentiate by role rather than visual sameness. Keep blur on modals, drop it everywhere else. Also relieves GPU compositing cost.

3. **Repeated uppercase-tracked label cleanup** — pick one kicker slot (probably the panel `TEAMS` head) and demote others (`2025 SEASON · …`, bottom hint pill, modal h3s) to sentence case. The new typography pass + the panel rewrite already dented this; remaining surfaces are smaller.

4. **Light-mode atmosphere intentionality.** `glowIntensity: 0.0` in the light theme today. Either commit to "light mode has no halo as voice" deliberately, or add a subtle warm halo (e.g. `glowOuterColor: 0xf3e6c8` at intensity 0.25) for limb depth.

5. **`prefers-reduced-motion` ignoring the traveler animation loop.** The CSS rule only stops DOM transitions; the WebGL `tickTravelers(...)` loop still spins. Add a check at the top of `tickTravelers` (or skip the call from `animate`).

6. **URL state / share links.** Refresh wipes filter selection + camera rotation. Cheap to add a query-param round-trip.

7. **Back-side traveler / arc bleed-through** seen in `media/03-pacific.png` — investigate whether `LineBasicMaterial` with `transparent: true, opacity: 0.78` is correctly depth-writing. Probably needs `depthWrite: true` on the line material, or move the arcs slightly above the sphere surface.

8. **Icon-only methodology + mileage buttons** in topbar lack labels. Jordan persona fails — needs visible text or hover tooltip (currently `aria-label` only). Either add labels or surface the affordance another way.

9. **Title cluster density** — logo mark + H1 + season pill + uppercase subtitle in 280×80px. Drop-shadow on the mark adds a faint halo. Demote the subtitle line.

10. **The 0-mile teams in the panel.** The 2026 schedule data is partial — many AFC East / AFC West teams show "0 mi" with empty bars. Either surface as "Schedule TBA" copy, hide those rows by default, or wait until the full slate drops (the previous handoff noted this was expected ~2026-05-14).

11. **Re-run `/impeccable critique` after the typography + chrome work lands** to see the score move and surface what's still load-bearing.

## 💡 Context for Resuming Agent

### Important Context

- **The full critique lives at `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`.** Read it first — it's the source of truth for what was deferred and why.
- **This work was done in a worktree** (`.claude/worktrees/priceless-dhawan-364436/`) on branch `claude/priceless-dhawan-364436`, then shipped via PR #10. New sessions should branch off main in a fresh worktree; the priceless-dhawan worktree can be cleaned up if it hasn't been already.
- **CLAUDE.md global rule observed this session:** Three.js reference skills installed under `.claude/skills/threejs-*` were used implicitly; reach for them when working with Three APIs.
- **The user collaborates by editing the plan file inline** sometimes. If a "file modified" reminder appears for the plan file mid-session, re-read it before responding.
- **The user dislikes em dashes and architectural metaphors in prose.** Plain concrete sentences only.
- **The 2026 schedule data is partial** — many teams show "0 mi" by design, not bug. Was supposed to drop ~2026-05-14 8 PM ET.
- **`gh pr merge --delete-branch` from a worktree has been observed to leave the remote branch alive** — verify after merging.

### Assumptions Made

- PR #10 shipped with the bar denominator bug fixed and the listener-stacking + dead-line items deferred (intentional scope decision after weighing the code-review confidence scores).
- The user is open to typography rework but wants it as a separate `/impeccable typeset`-driven PR with proper ideation, not bundled with this one.
- The handoff doc was committed alongside the bug fix on the same branch (Option A from the session-handoff discussion) so it travels into main with the work it documents.

### Potential Gotchas

- **Don't drift dark mode back to navy.** If anyone touches `themes.dark` later, the SNF aesthetic comment above the block should make the intent clear. The values were chosen specifically to avoid the SaaS-Earth reflex.
- **The atmosphere shader's `lightDir` is set ONCE at globe creation.** `applyThemeToGlobe` doesn't update it. If you ever make `lights.key.position` theme-dependent, also update `applyThemeToGlobe` to refresh the uniform (`atmosphere.material.uniforms.lightDir.value.copy(newPos).normalize()`).
- **Don't reintroduce `wireSelectAllNone`** — the buttons it wired (`#select-all`, `#select-none`) no longer exist in the HTML. If you re-add them, also re-add the import in `main.js`.
- **The new chrome (preset chips, sort toggle, intl call-out, group headers) deliberately has NO `backdrop-filter: blur(...)`.** This is to avoid bumping the glassmorphism count above 8 (already an "absolute ban" violation per the critique). Wait for the chrome distillation pass before adding any blur.
- **`legMiles` is in the schedule.js summary for a reason** (the bar's intl-share denominator). Don't remove it as "unused" — the bug fix above starts using it.
- **Light mode WAS verified unchanged** during this session. If you touch `themes.dark` or any of the new dark-only CSS, sanity-check light mode after.
- **Vite's HMR keeps a console-error buffer that includes stale errors from intermediate edit states.** Don't trust the error log without a fresh reload + a fresh-state DOM query (`document.querySelectorAll('.team-row').length` etc.).

## 🌐 Environment State

### Tools/Services Used

- **`gh` CLI** — PR #10 was opened with `gh pr create`; code review comment posted via `gh pr comment`. Auth: SSH, account `CypherPoet`.
- **`playwright-cli`** — used by the `capture-presentational-media` skill to re-capture the dark-mode hero shots at 1920×1200.
- **`mcp__Claude_Preview__*`** — Vite dev server preview on port 5173. Used for browser verification of dark mode + panel state during development.
- **`/impeccable critique`** — produced the plan file at `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`.
- **`/code-review:code-review`** — multi-agent review of PR #10 surfacing the bar-denominator bug at confidence 85.

### Active Processes

- A Vite dev server was running on `http://localhost:5173/THREE-JS-NFL-Flight-Paths/` during the source session via the project's `dev` launch config. New sessions should start one with `mcp__Claude_Preview__preview_start({ name: 'dev' })` (the `.claude/launch.json` entry already exists).
- A `playwright-cli` Chrome instance was opened and explicitly closed during the screenshot capture; nothing should be persistent.

### Environment Variables

None set this session.

## 📚 Related Resources

- **PR**: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/10
- **Code review comment**: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/10#issuecomment-4455582765
- **Critique plan file**: `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`
- **Previous handoff**: [`2026-05-13-212008-misc-improvements-followup.md`](./2026-05-13-212008-misc-improvements-followup.md)
- **Project CLAUDE.md**: `./CLAUDE.md` (in the repo root)
- **User global CLAUDE.md**: `/Users/ethan/.claude/CLAUDE.md`
- **`/impeccable` skill reference**: `.claude/skills/impeccable/SKILL.md` (and `reference/critique.md`, `reference/brand.md`)
