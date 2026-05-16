# 🤝 Handoff: Critique follow-up wave 2 (PR #15) shipped: click contract + mobile + slate chrome + dark vignette

## 🧾 Session Metadata
- Created: 2026-05-16T11:18:42Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch at handoff write time: `claude/stupefied-raman-207f58` (worktree at `.claude/worktrees/stupefied-raman-207f58`)
- **Resuming branch: `main`**. PR #15 will be merged before the next session begins; the resuming agent should pull `main` and work from there.
- PR shipped: [PR #15](https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/15), 9 commits.

### Recent Commits (for context)
  - `fb4fb74` Simplify pass: trim narrating comments, DRY reticle mask, halve vignette segments
  - `0e93f22` Add dark-only limb vignette for the SNF framed-spotlit register
  - `05daa26` Land slate chrome tint for light mode
  - `a8dcd74` Add ?chrome= switcher for chrome cool-tint exploration
  - `80f28e7` Move coffee link out of topbar into the bottom-right legend
  - `0037755` Track the May 16 /impeccable critique snapshot
  - `c188273` Critique follow-up: mobile tooltip, mileage value, icon cluster, stadium empty
  - `f156294` Align hint copy with the actual click contract

## 🔗 Handoff Chain

- **Continues from**: [2026-05-16-071723-impeccable-followups-after-typeset.md](./2026-05-16-071723-impeccable-followups-after-typeset.md)
  - Previous title: Impeccable follow-ups after the sectional + Big Shoulders + typeset pass
- **Supersedes**: None

> Read the previous handoff for the measurement-step framing and the PR #14 outcome. This handoff captures the second wave of shipping that followed the May 16 measurement step.

## 📍 Current State Summary

The previous session was a measurement step (re-run `/impeccable critique` against post-PR-14 state, score 30/40) plus the start of a follow-up wave that asked the user to triage from the report's recommended actions. The user picked the P0 + all four P1/P2 items + the chrome cool tint deferred item + the atmosphere shader deferred item.

This session shipped that wave in PR #15. The May 16 critique's full priority list closed; one deferred-list item landed (slate chrome); the dark-only limb vignette landed; the terminator-line atmosphere move was prototyped and dropped (aesthetic-only with no data binding, viewers couldn't read what it represented). A simplify pass cleaned narrating comments and DRY'd the reticle mask URL. `/code-review:code-review` ran a five-agent review (CLAUDE.md, shallow bug scan, git history, prior PR feedback, in-file comments) against the final state and returned **no issues**.

The next session's primary job is measurement again. Re-run `/impeccable critique` against the post-PR-15 state and diff it against the May 16 28→30 baseline. The slate chrome + dark vignette + coffee relocation + hint contract fix are all major surface changes; the new critique should both confirm the closes and surface what's now load-bearing underneath.

## 🧠 Codebase Understanding

### Architecture Overview

No structural changes this session. The architecture is unchanged from the post-PR-14 handoff. New context layered on top:

- **Chrome lives in the sectional ocean's family now**, both visually and via tokens. `--bg` (`#e8ebef`), `--paper` (`#eff2f6`), `--ink` (`#18191b`), and the soft/mute/line/shadow variants are all cool slate-toned. The Three.js `sceneBg` in `THEMES.light` and the `<meta name="theme-color">` light value were updated to match (`0xe8ebef`). Dark theme tokens are untouched; SNF chrome stays locked.
- **The atmosphere pipeline now has two front-side shells** beyond the existing back-side Fresnel halo: the limb vignette in dark mode only (front-side sphere at `r = GLOBE_RADIUS * 1.026`, gated `mesh.visible = vignetteIntensity > 0`). The plumbing exactly mirrors `makeAtmosphere`'s pattern: per-theme uniforms in `themes.js`, a `makeXxx` factory in `globe.js`, and `applyThemeToGlobe` updates the uniforms + visibility in place. Future atmosphere-shell additions should mirror this pattern.
- **The coffee link is no longer in the topbar.** It lives in `.legend` at the bottom-right, styled as `.legend__link` at micro typography with `--ink-soft` color. The topbar icon rail is now exactly three buttons: mileage / methodology / theme. There is no `.theme-toggle--quiet` modifier anymore.
- **`.impeccable/critique/` snapshot stream has two entries** now: May 15 (28/40) and May 16 (30/40). Trend `localhost-three-js-nfl-flight-paths`: 30 → 28 → 30.

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| [src/themes.js](src/themes.js) | Per-theme palette + atmosphere uniforms | Now carries `vignetteColor` + `vignetteIntensity` per theme. Light intensity is `0` (gated invisible); dark is `0.35`. Future atmosphere additions go through the same per-theme uniform pattern. |
| [src/globe.js](src/globe.js) | Globe construction + per-theme repaint | `makeLimbVignette` lives here (~line 200). The factory + uniform + visibility-gate pattern is intentional for atmosphere shells. `renderOrder` is 1 = country lines, 2 = (reserved, terminator was here), 3 = vignette; pick 4+ for new passes. |
| [styles.css](styles.css) | Single-file CSS, all chrome + tooltips + responsive | Slate light tokens at lines 42-54. New `.legend__link` rules at ~759. Mobile tooltip override inside `@media (max-width: 760px)` block. Reticle mask SVG is now a `--reticle-mask` custom property scoped to the stadium-tooltip empty state. |
| [index.html](index.html) | HTML shell | Topbar icon rail is mileage/methodology/theme only. Legend at the bottom-right includes the coffee link. Hint copy reads "click a team to toggle · shift-click to isolate". `theme-color` meta updated to `#e8ebef`. |
| [src/main.js](src/main.js) | Boot, scene wiring, URL state, theme toggle | `DEFAULT_HINT` matches the HTML default. No `?chrome=` parser anymore (the switcher was stripped at landing). |
| `.impeccable/critique/2026-05-16T08-45-31Z__localhost-three-js-nfl-flight-paths.md` | Persisted May 16 snapshot (30/40) | Comparison anchor for the next critique. |
| `/Users/ethan/.claude/plans/critique-after-pr-14-may-2026.md` | May 16 comparison report | Documents the 28 → 30 trend + closed items + new load-bearing findings. |

### Key Patterns Discovered

1. **URL-param switcher is now a confirmed three-time-winning pattern** (`?palette=`, `?display=`, `?chrome=`). Workflow: define candidates in a single object, parse the param at module top, apply via `data-` attribute on `<html>` with CSS variants scoped under `[data-theme="light"][data-x="variant"]`, render a bottom-center banner with click-through links that preserve other URL params, strip everything in a follow-up commit once a direction is picked. The CSS-variant approach (vs. inline-style mutation) keeps the dark theme cascade untouched and lets theme-swap continue to work mid-exploration. Keep using this for thesis-level decisions where comparison matters.
2. **Opacity dimming on a still-clickable element is the disabled-look anti-pattern.** Tried `opacity: 0.5` on the coffee button as a demotion mechanism; the user immediately flagged it as reading disabled. The fix is structural (move the element to a less-prominent location) rather than visual (dim it). Don't reach for `opacity` to demote interactive elements; either relocate, resize, or remove chrome (border + shadow). Recorded in memory.
3. **Aesthetic-only shader/visual elements need to earn their weight.** The terminator line was implemented, demoed, then dropped because viewers couldn't read what it represented (no data binding, no clear referent). The vignette was kept because it's atmospheric framing rather than a graphic element that pretends to communicate something specific. Rule of thumb: if you're adding a visual element that has a shape someone might try to interpret, it needs a data binding; if it's purely tonal/framing, aesthetic-only is defensible.
4. **`mesh.visible = false` in Three.js is a true skip.** WebGLRenderer's `projectObject` early-returns before adding the mesh to the render list, so a hidden mesh costs one boolean per frame in scene traversal — not a draw call, not a shader bind. Safe to keep gated meshes in the scene graph for theme-swap rather than dynamically add/remove.
5. **CSS custom properties can scope a complex value (like a long inline SVG mask URL) to a single rule.** Setting `--reticle-mask: <full url declaration>` on `.stadium-tooltip__photo[data-state="empty"]` and referencing `var(--reticle-mask)` from both `-webkit-mask` and `mask` keeps the URL in one place without polluting the global token namespace. Useful when the value is too local for `:root` but appears more than once in a single rule block.

## 🏁 Work Completed

### Tasks Finished

- [x] Re-read prior handoff + comparison report; verified worktree is fresh off post-PR-14 main
- [x] Pre-flight: dev server confirmed running at the worktree cwd
- [x] Ran `/impeccable critique`: twin isolated sub-agents (LLM design review + `npx impeccable detect`), synthesized into a 30/40 report
- [x] Persisted snapshot at `.impeccable/critique/2026-05-16T08-45-31Z__localhost-three-js-nfl-flight-paths.md`
- [x] Wrote comparison report at `/Users/ethan/.claude/plans/critique-after-pr-14-may-2026.md`
- [x] Triaged recommended actions with the user (P0 path = rewrite copy, P1+P1+P2+P2 bundle = all in)
- [x] Shipped P0 hint copy fix: "click a team to toggle · shift-click to isolate" in both `index.html` and `src/main.js`
- [x] Shipped P1 mobile tooltip clip fix: re-anchored topbar tooltips centered on button inside `@media (max-width: 760px)` with `max-width: calc(100vw - 24px)` and `white-space: normal`
- [x] Shipped P2 mileage value wrap fix: `white-space: nowrap` on `.mileage-row__value` + bumped mobile grid column 70px → 82px
- [x] Shipped P1 icon-cluster polish: initial opacity-based coffee demotion, then reverted on user feedback and moved coffee out of the topbar entirely into the legend
- [x] Shipped P2 stadium-tooltip empty state: designed reticle SVG placeholder at 16/6 aspect on a sectional-tinted gradient, masked via theme-aware `--ink-soft`
- [x] Tracked the May 16 critique snapshot in git
- [x] Built `?chrome=` switcher with 4 candidates (warm baseline, neutral, slate, deep-slate)
- [x] User picked `slate`; stripped the switcher scaffolding; landed slate values into `:root, [data-theme="light"]`; updated `themes.js` `sceneBg` and `index.html` `theme-color` meta to match
- [x] Prototyped atmosphere terminator line; user dropped it on the "viewers can't read what it is" critique; reverted from working tree
- [x] Implemented limb vignette; tuned dark-only after user feedback (`vignetteIntensity: 0` in light, `0.35` in dark, `mesh.visible` gated on intensity)
- [x] Ran `/simplify` pass: three parallel review agents flagged comment narration + redundant `background` declaration + duplicated mask URL + overkill vignette geometry segments (96 → 48). All findings applied in commit `fb4fb74`.
- [x] Ran `/code-review:code-review` skill: five-agent review (CLAUDE.md, shallow bug scan, git history, prior PR comments, in-file comment guidance). All clean. Posted "No issues found" comment on PR #15.
- [x] PR #15 ready to merge

### Files Modified

| File | Net change | Why |
|------|---------|-----|
| `index.html` | +24 / -32 | Hint copy fix, coffee link removed from topbar + added to legend, theme-color meta updated to slate |
| `src/main.js` | +1 / -1 | DEFAULT_HINT copy fix |
| `src/themes.js` | +12 / -2 | Slate `sceneBg`, `vignetteColor` + `vignetteIntensity` per theme |
| `src/globe.js` | +57 / -4 | `makeLimbVignette` factory + wiring through `createGlobe` + `applyThemeToGlobe` |
| `styles.css` | +97 / -45 | Slate light tokens, mobile tooltip override, mileage value nowrap + grid bump, `.legend__link` rules, stadium-tooltip empty-state reticle, removed `.theme-toggle--quiet` |
| `.impeccable/critique/<filename>` | new | May 16 snapshot |

### Decisions Made

- **Slate over warm/neutral/deep-slate for light chrome.** User picked slate after click-through evaluation in `?chrome=` switcher. Reason: resolves the "cream paper around blue chart" mismatch the handoff flagged, lives in the broadcast/cool register, doesn't over-commit to enterprise-instrument-panel like deep-slate does. The bold-but-not-aggressive middle commit.
- **Coffee link moved out of topbar entirely; no opacity-based demotion.** Original move was opacity 0.5 + transparent border. User flagged the disabled-look anti-pattern. Reverted; moved the element to the bottom-right legend at micro typography. The topbar icon rail is now data-only.
- **Atmosphere terminator line dropped after prototyping.** Implemented as a front-side sphere at r=1.025 with a thin band where `dot(normal, lightDir) ≈ 0`. Visible in dark mode (warm cream arc) but a viewer can't read what it represents without context. Pure aesthetic, no data binding. Reverted from working tree. Re-deferred with a new framing: only worth picking up if tied to real data (game time, season scrubber, real sun position).
- **Limb vignette kept for dark mode only.** Light intensity held at `0` because the cool sectional sphere on slate chrome already reads framed. Dark intensity at `0.35` reads as a stadium-spotlit ball framed against the SNF tunnel. Gating uses `mesh.visible = theme.vignetteIntensity > 0` mirroring the existing `atmosphere.visible = theme.glowIntensity > 0` pattern.
- **Simplify pass dropped narrating comments + DRY'd duplicated artifacts.** Tightened `makeLimbVignette` comments to load-bearing rationale only (renderOrder, exponent choice). DRY'd the reticle SVG URL via a local `--reticle-mask` custom property. Removed a redundant background gradient declaration on the empty-state selector (it inherits from the shared empty+loading rule). Halved vignette sphere segments 96 → 48 (visually identical, fewer triangles at boot).
- **The `?chrome=` switcher commits stay in branch history.** Same pattern as `?palette=` and `?display=`: scaffolding commit (`a8dcd74`) preserved so the comparison can be re-run; landing commit (`05daa26`) strips everything.

## 🚧 Pending Work

### Immediate Next Steps

1. **Pull `main` and start clean.** PR #15 is merged. Cut a fresh worktree off main or work from the main checkout directly. Verify the worktree-merge remote-cleanup gotcha doesn't leave the merged branch alive on origin (`git ls-remote --heads origin`; delete if needed).
2. **Re-run `/impeccable critique`.** Same shape as the May 16 measurement: twin isolated sub-agents, persist a fresh snapshot, write a comparison report at `/Users/ethan/.claude/plans/critique-<date-and-slug>.md` against the May 16 baseline. The slate chrome + dark vignette + coffee relocation + hint contract fix are major surface changes; the new critique should both confirm the closes and surface what's now load-bearing underneath.
3. **Decide based on the new critique** which of the remaining deferred items (or new findings) to tackle next. The atmosphere terminator move stays on the deferred list with the data-binding gate; if the next critique flags a missing "time/season" beat, the terminator becomes the cheap path forward.

### Blockers/Open Questions

- **None blocking.** PR #15 merged. The `/code-review:code-review` skill returned no issues.

### Deferred Items

In rough priority order. These remain parked unless a future critique re-opens them:

1. **Atmosphere terminator line (with data binding)** — Implemented and reverted this session. Re-deferred with a new framing: pick this up if the next critique surfaces a missing "time/season" beat. The cheap moves are (a) tie sun position to a selected game's local kickoff (terminator becomes "where day/night was at this game") or (b) "play the season" scrubber that drives the sun across 18 weeks. Either earns the visual; pure aesthetic does not.
2. **Atmosphere limb vignette — light mode** — Currently `vignetteIntensity: 0` in light; the mesh sits in the scene graph but is invisible. If the next critique flags the light sphere as feeling flat against the slate chrome, bring it back; budget intensity ~0.1 max to stay subtle.
3. **Team accent saturation pass** — User said "leave as-is (broadcast graphics SHOULD pop)" in the May 16 cycle. Unchanged.
4. **Typography family for body/mono.** Geist + Departure Mono still not re-evaluated. Critique has not surfaced them as load-bearing. Park.
5. **Geist font subsetting** (~30KB first-paint savings via `pyftsubset`). Park until a critique flags first-paint payload.

## 💡 Context for Resuming Agent

### Important Context

- **PR #15 is merged.** Work from `main`. The merged worktree branch was `claude/stupefied-raman-207f58`; verify it was cleaned up at merge per the worktree-merge gotcha.
- **Brand thesis is now sectional in BOTH the sphere AND the chrome on light mode.** Both share the cool slate palette. Dark mode is SNF primetime broadcast. These are locked. Critique runs measure against these theses; they do not re-propose direction.
- **Coffee link is in the bottom-right legend, not the topbar.** Do not move it back. Do not dim it with opacity. The legend is hidden on mobile (per the existing `@media (max-width: 760px)` rule); that's an accepted tradeoff for mobile.
- **The `.theme-toggle--quiet` modifier no longer exists.** Don't reach for it as a demotion mechanism. If you need to demote a clickable element, relocate it or strip chrome (border + shadow); never `opacity`.
- **NO em dashes in prose anywhere** (commit messages, comments, plan files, PR descriptions, user-facing copy). Use commas, colons, semicolons, periods, or parentheses.
- **NO architectural metaphors in prose** (user memory `feedback_avoid_writerly_metaphor.md`).
- **NO "ship" framing in commit messages** when the user is working in a "commit-per-step, present-for-review" rhythm. "Ship" reads as merging/releasing; the user works in atomic commits to an open PR until they merge it themselves.
- **The user reviews plans/handoffs by editing them inline** (user memory `feedback_user_reviews_via_plan_file_edits.md`). Re-read when the "file modified" reminder appears.
- **The user dislikes silently dropping dependents** (user memory `feedback_dont_silently_drop_dependents.md`). When removing X, surface alternatives for any Y that depended on X.
- **Aesthetic-only visual elements with no data binding need to earn their weight.** The terminator was killed for this reason. Tonal/framing-only is fine (vignette); graphic elements that look like they should mean something must mean something.
- **`/impeccable critique` snapshots stay tracked in git.** Do not propose gitignoring `.impeccable/critique/`.
- **The `renderOrder` budget for atmosphere shells**: country lines at 1, [terminator slot at 2 if re-added], vignette at 3. New passes pick 4+ to avoid silent draw-order conflicts.
- **`makeAtmosphere` is the canonical template for new atmosphere-shell additions.** Per-theme uniform pair in `themes.js`, factory in `globe.js`, repaint in `applyThemeToGlobe`. Mirror this pattern; don't invent a parallel system.

### Assumptions Made

- **The next session will run `/impeccable critique` again.** The trend stream is established (30 → 28 → 30) and re-running is the natural cadence.
- **PR #15 merges cleanly.** No conflicts with main; the `/code-review:code-review` returned clean.
- **The user's design lead role continues.** Thesis-level decisions (chrome direction, atmosphere additions, typography swaps) go through the user; small implementation choices (CSS specificity, ARIA selection) don't.

### Potential Gotchas

- **The vignette mesh exists in light mode at `visible: false`.** Three.js's renderer correctly skips it, so it's free per frame. But: if a future change conditionally enables the vignette in light mode, double-check the uniforms are still correct via `applyThemeToGlobe` (the color is `0x18191b` which is a dark slate; appropriate for both themes' inks). Don't accidentally introduce light-theme darkening without checking the resolved values.
- **`mesh.renderOrder` is a soft contract.** Future atmosphere/overlay additions should pick `renderOrder >= 4` to avoid silent visual conflicts.
- **The reticle SVG mask uses a local CSS custom property `--reticle-mask`.** Inheriting elements (`.stadium-tooltip__photo[data-state="empty"]::before`) read it via `var()`. Don't promote this var to `:root` thinking it's a token; it's a one-use local.
- **Preview MCP console buffer stays stale** (user memory `feedback_preview_console_buffer_is_stale.md`). After an HMR-prone change, verify visual state directly rather than trusting the console log.
- **Vite HMR can cache module-top URL-param resolution.** If you re-add another URL-param switcher (`?palette=`, `?display=`, `?chrome=` were all this pattern), `window.location.replace('...?cb=<ts>')` is the proven cache-buster.
- **`gh pr merge --delete-branch` from a worktree has been observed to leave the remote branch alive.** Verify with `git ls-remote --heads origin` post-merge.

## 🌐 Environment State

### Tools/Services Used

- **`gh` CLI** for PR #15 creation, body updates, and code-review comment. SSH auth, account `CypherPoet`.
- **`mcp__Claude_Preview__*`** Vite dev server preview. The serverId during this session was `2137fc6a-c632-417b-b3ab-fa8e1dc05613` at port 5173, cwd at the worktree path. Restart from main (or a fresh worktree off main) for the next session.
- **`npx impeccable detect` (v2.1.7)** for the deterministic-detector half of the critique. Will be needed for the next critique re-run.
- **`/code-review:code-review` skill** ran the five-agent review against PR #15's final state; clean.
- **`/simplify` skill** ran three parallel review agents during the PR; findings applied in commit `fb4fb74`.

### Active Processes

- **Vite dev server** likely still running at end-of-session on serverId `2137fc6a-c632-417b-b3ab-fa8e1dc05613`. Cwd is the worktree path. Safe to leave; restart from main if the next session uses a fresh checkout.
- No playwright-cli session active.

### Environment Variables

None set this session beyond what the Vite dev server reads.

## 📚 Related Resources

- **PR #15**: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/15
- **PR #14** (prior wave, merged 2026-05-16): https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/14
- **May 16 comparison report**: `/Users/ethan/.claude/plans/critique-after-pr-14-may-2026.md`
- **May 15 comparison report**: `/Users/ethan/.claude/plans/critique-after-deferred-cleanup-may-2026.md`
- **Original Feb 2026 baseline critique**: `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`
- **May 16 critique snapshot** (30/40): `.impeccable/critique/2026-05-16T08-45-31Z__localhost-three-js-nfl-flight-paths.md`
- **May 15 critique snapshot** (28/40): `.impeccable/critique/2026-05-15T06-50-43Z__localhost-three-js-nfl-flight-paths.md`
- **Previous handoff**: `.claude/handoffs/2026-05-16-071723-impeccable-followups-after-typeset.md`
- **Earlier handoffs in the chain**:
  - `2026-05-15-061122-rerun-impeccable-critique-and-compare.md` (measurement framing)
  - `2026-05-15-022040-typeset-and-cleanup-shipped.md` (typeset + cleanup)
  - `2026-05-14-234200-snf-dark-mode-and-panel-shipped.md` (SNF dark + grouping)
  - `2026-05-13-212008-misc-improvements-followup.md` (misc polish)
  - `2026-05-13-174844-nfl-flight-paths-v1-shipped.md` (architecture + v1)
- **Critique skill methodology**: `.claude/skills/impeccable/reference/critique.md`
- **Brand register reference**: `.claude/skills/impeccable/reference/brand.md`
- **Heuristics scoring rubric**: `.claude/skills/impeccable/reference/heuristics-scoring.md`

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
