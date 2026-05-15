# 🤝 Handoff: Typeset (Geist + Departure Mono + scale + kicker rationing) and PR #10 cleanups shipped via PR #11; chrome distillation + reduced-motion + URL state remain

## 🧾 Session Metadata
- Created: 2026-05-15T02:20:40Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch: `claude/jolly-wu-f8b2e6` (this handoff lives here pending PR #11 merge)
- Repo: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths (PRIVATE)
- Source PR: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/11

### Recent Commits (for context)
  - `f2e9b05` Drop dead clear-line and stop stacking panel listeners on season switch — PR #10 code-review cleanup, bundled into this PR
  - `f341770` Refresh typography to Geist + Departure Mono and rationalize the scale — main typeset commit
  - `d1ca844` Merge pull request #10 from CypherPoet/claude/priceless-dhawan-364436 (upstream)
  - `d9048aa` Fix stacked-bar international share denominator and add session handoff (upstream)
  - `9138d7c` Repaint dark mode to a Sunday Night Football broadcast and group the team panel by division (upstream)

## 🔗 Handoff Chain

- **Continues from**: [2026-05-14-234200-snf-dark-mode-and-panel-shipped.md](./2026-05-14-234200-snf-dark-mode-and-panel-shipped.md)
  - Previous title: SNF dark mode + division grouping + international story shipped via PR #10; typography + chrome distillation deferred
- **Supersedes**: None

> Read the previous handoff for project architecture, the SNF dark-mode rationale, the data-flow contract above `summariseByTeam`, and the full deferred-items list. This handoff documents only this session's deltas.

## 📍 Current State Summary

The session picked up the **highest-priority deferred item** (`/impeccable typeset`) and the two PR #10 code-review items that scored below the merge-blocking threshold. All three shipped in PR #11.

**What shipped:**

1. **Body / UI font swap.** Manrope → **Geist** (Vercel, OFL — single variable woff2, 70KB, weights 100–900). Geometric humanist with mechanical character; reads as "broadcast technical." Wired up via a `data-typeset="A"|"B"` runtime A/B against **General Sans** (ITF Fontshare, FFL — per-weight woff2s); user flipped between them in the browser via dev-tools and picked Geist.

2. **Numerals font swap.** JetBrains Mono → **Departure Mono** (helena.zhang permissive license — single 22KB woff2). Early-LCD scoreboard voice. Adopted by every numeric readout including `.season-switch__button` (the `2026` / `2025` chips) which now read as scoreboard pills, not generic uppercase tabs. Unbounded retained for display.

3. **Scale rationalization.** Eight ad-hoc px sizes (9, 10, 10.5, 11, 11.5, 12, 13, 16, 27) collapsed into a five-step `rem` token system at ~1.25 ratio: `--text-micro` (10px), `--text-meta` (13px), `--text-base` (16px), `--text-section` (20px), `--text-display` (clamp 24–32px H1 only). Tokens declared in `:root` in `styles.css`.

4. **Kicker rationing.** Six tracked-uppercase chrome surfaces collapsed to one. `.panel__head h2` ("TEAMS") keeps the kicker grammar (uppercase + 0.14em tracking). Five other surfaces demoted to sentence case so hierarchy comes from family + size against the body, not caps + tracking: topbar season sublabel, metric label + sub, hint pill, methodology h3s, mileage subtitle, stadium tooltip badge + dt + visitors-label, loading text, panel sort buttons, preset chips. **The source HTML for all of these was already sentence case** — CSS `text-transform: uppercase` was forcing the kicker treatment.

5. **PR #10 code-review cleanups** (separate commit on the same branch): (a) `rowsByTeam.length = 0` no-op deleted from `renderRows` (object, not array). (b) `buildTeamPanel`'s preset chip + sort button wiring now uses `cloneNode(true)` + `parentNode.replaceChild()` to drop existing listeners before binding fresh — was leaking a new listener layer per `loadSeason` call.

6. **All 5 README screenshots re-captured** at 1920×1200 via `capture-presentational-media` skill.

Net `styles.css` change: −135 lines (kicker grammar collapsed). New `fonts/geist/` (74KB) + `fonts/departure-mono/` (27KB), removed `fonts/manrope/` + `fonts/jetbrains-mono/`.

## 🧠 Codebase Understanding

### Architecture Overview

No architectural change from the previous handoff — same Vite + Three.js single-page app. Type-system additions only:

- `styles.css` (`:root`) now holds `--text-*` size tokens (5 steps, rem-based, ~1.25 ratio). All chrome `font-size` declarations reference tokens; literal `px` is gone except the two close-button "×" glyphs at lines 1020/1187.
- Display token uses bounded `clamp(1.5rem, 1.25rem + 1vw, 2rem)` — only the H1 flexes; everything else is fixed rem for spatial predictability per the typography reference.
- `--font-ui` was Manrope, now Geist. `--font-mono` was JetBrains Mono, now Departure Mono. `--font-display` unchanged (Unbounded).

### Critical Files

| File | Purpose | Relevance for follow-ups |
|------|---------|-----------|
| `styles.css` (lines 1–18 + 117–127) | New `@font-face` blocks (Geist, Departure Mono — Unbounded latin/latin-ext blocks unchanged) and the `--text-*` token declarations | **Don't reintroduce ad-hoc `px` font-sizes.** Add a new role to the token system if the existing five rungs don't cover. |
| `styles.css` (`.panel__head h2`, ~line 350) | The one kept kicker — uppercase + 0.14em tracking + display family at `--text-meta`. | **If you're adding a new chrome label, do not give it tracked-uppercase treatment.** Use sentence case + family/size hierarchy. The TEAMS slot is the only one carrying that voice. |
| `src/ui.js` (`buildTeamPanel`, lines 211–225) | Clone-and-replace listener wiring on `.panel__preset` and `.panel__sort-button` | **If you add another button class that's recreated by `buildTeamPanel`, follow the same clone-and-replace pattern.** Naive `addEventListener` will leak a closure per season switch. |
| `fonts/geist/`, `fonts/departure-mono/` | New self-hosted families. Geist ships as a single variable woff2; Departure Mono is single-weight; both have license files (`OFL.txt` for Geist, `LICENSE` for Departure). | **Departure Mono's license is the helena.zhang permissive license, NOT SIL OFL.** The git rename detector confused the file with Manrope's OFL.txt during commit; the actual file content is correct. Don't "normalize" the filename to OFL.txt thinking it's a typo. |
| `index.html` (inline first-paint script, line 8–18) | Theme bootstrap from localStorage. Phase-1 typeset bootstrap was added then removed in this session — the file is back to its original shape. | If you re-introduce a runtime theme/typeset toggle, follow the same data-attribute pattern (`data-theme`, `data-typeset`) + `localStorage` persistence + inline pre-paint resolution. |
| `src/main.js` (keydown handler, line 170–172) | Currently only handles Escape (clears tooltip). Phase-1 typeset T-toggle was added then removed. | Same as above — re-add and remove cleanly if needed for future A/Bs. |
| `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md` | Full `/impeccable critique` output + chosen-scope action plan + deferred items list | **READ FIRST** for any follow-up. Still the source of truth for what's deferred and the rationale. |
| `/Users/ethan/.claude/plans/resume-from-the-most-clever-scone.md` | This session's typeset implementation plan | Reference for the scale token decisions and the A/B teardown sequence. |

### Key Patterns Discovered

1. **Clone-and-replace for stripping listeners on static DOM.** When a JS function rebinds handlers to DOM nodes that aren't recreated (e.g. nodes living in `index.html`), repeat invocations stack listeners. The standard fix without restructuring is `cloneNode(true)` + `parentNode.replaceChild(fresh, btn)` to drop all existing handlers, then bind one fresh handler to the clone. `cloneNode` does NOT copy event listeners by design. Used in `src/ui.js:212–224`.

2. **Variable-font woff2 with `format("woff2-variations")`.** Geist ships a single `Geist[wght].woff2` file covering weights 100–900. Declared as one `@font-face` with `font-weight: 100 900` and `format("woff2-variations")`. Massively simpler than the Google-Fonts pattern of per-weight files split by unicode-range that Manrope used. **Browsers with brotli support handle the variations format natively** — no extra tooling required to subset, but per-script subsetting is sacrificed (the single file is 70KB covering all latin).

3. **Departure Mono carries chip-like UI elements, not just numerals.** The `.season-switch__button` was originally `letter-spacing: 0.08em; text-transform: uppercase` Manrope — generic uppercase tab grammar. Recasting it as `var(--font-mono)` with `font-variant-numeric: tabular-nums` makes the year text feel like scoreboard digits. Same pattern fits the stadium-tooltip pill (`.stadium-tooltip__pill`) which was already mono. **Mono isn't only for numerals; it's for any "fixed-grid scoreboard chip" voice.**

4. **The H1 `clamp()` should NOT mirror the marketing pattern.** Initial draft used `clamp(1.75rem, 2.4vw + 1rem, 2.25rem)` (28–36px) which would balloon the H1 by ~30%. For a tool with a fixed-position panel + topbar, that throws off the title cluster proportions. Settled on `clamp(1.5rem, 1.25rem + 1vw, 2rem)` (24–32px) — center is ~28–30px, only +1–3px over the original 27px. **For dense data-viz UIs, fluid type should breathe gently if at all.**

5. **`text-transform: uppercase` was doing all the kicker work.** All five demoted kickers had sentence-case source strings ("2026 Season · Confirmed slate", "Drag to rotate · scroll to zoom · …", "International venue", etc.). The CSS was the kicker. Removing `text-transform: uppercase` and the `letter-spacing: 0.08–0.12em` was sufficient to demote — no source-string edits needed. **Check the source HTML/JS before assuming a kicker label needs a copy edit; it's usually pure CSS.**

## 🏁 Work Completed

### Tasks Finished

- [x] Read previous handoff + critique plan, mapped current typography surface
- [x] User decision: A/B Geist vs General Sans (with Departure Mono as shared mono) before committing
- [x] Downloaded Geist (gh release) + General Sans (Fontshare API, user-approved past auto-classifier deny) + Departure Mono (departuremono.com)
- [x] Phase 1: wired both pairings via `data-typeset="A"|"B"` toggle, T keyboard shortcut, localStorage persistence, pre-paint bootstrap
- [x] Captured 4 A/B states (A/B × light/dark) at 1600×1000 for the comparison
- [x] User picked Pairing A (Geist) via dev-tools inspector flip in their own browser
- [x] Phase 2: tore down all A/B scaffolding (toggle, keybind, bootstrap, indicator div, General Sans @font-face blocks, fonts/general-sans/, fonts/manrope/, fonts/jetbrains-mono/)
- [x] Added five `--text-*` size tokens to `:root`, replaced ~30 literal `px` font-sizes with token references
- [x] Demoted five of six tracked-uppercase kicker surfaces to sentence case (TEAMS preserved as the kept slot)
- [x] Re-captured all 5 README hero shots at 1920×1200 via `capture-presentational-media` (playwright-cli, drag-rotate calibration per skill notes)
- [x] PR #11 opened with detailed body covering all three tracks (font swap, scale, kicker rationing)
- [x] PR #10 code-review fix 0a: clone-and-replace listener wiring in `buildTeamPanel`
- [x] PR #10 code-review fix 0b: dropped no-op `rowsByTeam.length = 0`
- [x] Pushed both code-review fixes as `f2e9b05` to the same branch — PR #11 picks them up automatically

### Files Modified

- `styles.css` — new `@font-face` blocks, `--font-ui` + `--font-mono` updated, `--text-*` tokens added, ~30 type rules converted to tokens, kicker properties stripped from 9 selectors
- `src/ui.js` — clone-and-replace wiring (lines 211–224), dropped `rowsByTeam.length = 0` (line 46)
- `media/01-hero.png` through `media/05-dark-atlantic.png` — re-captured
- `fonts/geist/` (new): `geist-variable.woff2` + `OFL.txt`
- `fonts/departure-mono/` (new): `departure-mono.woff2` + `LICENSE` (helena.zhang permissive — git renamed-detected from Manrope's OFL.txt due to license-text similarity, but the actual file content is correct)
- `fonts/manrope/` — deleted (3 files via `trash`)
- `fonts/jetbrains-mono/` — deleted (3 files via `trash`)

### Decisions Made

- **A/B'd Geist vs General Sans live, did not commit blind.** User explicitly asked for live A/B over straight commitment. The fallback pairing's mono (Berkeley Mono) was paid; substituted Departure Mono for both pairings to isolate the body-family signal.
- **Bundled the two PR #10 code-review fixes into PR #11** as a separate commit (`f2e9b05`) rather than opening a third PR. Same pattern as PR #10's `3e0e6f5` bundling the bar-denominator fix with the handoff. Trivial cleanup that wouldn't benefit from independent review.
- **Used `cloneNode(true)` + `replaceChild` rather than restructuring `buildTeamPanel`.** The handoff's preferred fix was hoisting wiring out of the function entirely. Chose the alternative (clone-and-replace) for minimal blast radius — the surrounding function is structurally fine, the bug is purely listener accumulation.
- **Set the H1 clamp at `clamp(1.5rem, 1.25rem + 1vw, 2rem)` (24–32px) instead of the more aggressive 28–36px.** Original H1 was 27px; aggressive clamp would have shifted the title cluster proportions noticeably. Settled on a gentle +1–3px range.
- **Used `--text-meta` (13px) for the kept TEAMS kicker** instead of `--text-section` (20px). 20px uppercase tracked would have been too loud. The "earned" kicker still benefits from sitting in the meta size range, slightly larger than the demoted kickers it once shared a row with.
- **Did not invoke `/impeccable teach`** despite the skill saying to when PRODUCT.md/DESIGN.md are missing. The previous critique session had already established the brand thesis (museum cartography light + SNF broadcast dark) without those files; running teach would have been redundant.
- **Did not pre-subset Geist or General Sans by latin/latin-ext.** Brotli for fonttools wasn't installable on python3.14 (system pyexpat broken). Used Geist's distributed variable woff2 (70KB full latin) and General Sans's per-weight woff2s as-shipped. Phase 1 was just A/B; Phase 2 ships only Geist as a single 70KB file. **If asset weight matters later, install brotli (`brew install brotli`) and re-subset Geist via `pyftsubset`.**

## 🚧 Pending Work

### Immediate Next Steps

**Once PR #11 merges**, the next-session priority is `/impeccable distill` — the chrome distillation pass deferred from the original critique. Still 8 glassmorphic surfaces (`.season-switch`, `.metric`, `.theme-toggle`, `.panel`, `.hint`, `.legend`, `.stadium-tooltip`, `.methodology__scrim`, `.mileage__scrim`); the goal is ~2. Differentiate by role rather than visual sameness — keep blur on modal scrims only, drop it everywhere else. The kicker rationing this session lowers the *grammar* duplication; the chrome work would lower the *material* duplication.

After distill, **re-run `/impeccable critique`** to see the score move (was 30/40 before this session's work + the dark mode shipped in PR #10). Should now be in the 33–35/40 range with typeset, kicker rationing, and the panel grouping all addressed; distill should push it to 36+.

Other follow-ups in roughly priority order, all from the previous handoff's list:

### Blockers/Open Questions

None blocking. PR #11 awaits review/merge.

### Deferred Items

In rough priority order. All but #1 carry forward from the previous handoff's list (#1 was added this session). Sourced from `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md` deferred-items section.

1. **Geist subsetting** (this session's residue). Geist is currently shipped as a single 70KB `geist-variable.woff2` covering all latin. Manrope/JetBrains Mono used to ship as latin (~24KB) + latin-ext (~15KB) splits per Google Fonts' pattern. To restore that pattern: `brew install brotli && python3 -m pip install --user brotli && pyftsubset fonts/geist/geist-variable.woff2 --output-file=...` with the unicode-range subsets the old `@font-face` blocks used (preserved in git history at commit `d1ca844`). Worth maybe 35KB savings. Low priority — this is a portfolio piece, not a high-traffic site.

2. **`/impeccable distill`** — Chrome distillation. 8 glassmorphic surfaces → ~2. Differentiate by role. Keep blur on modals, drop it everywhere else. Also relieves GPU compositing cost. **Highest-impact remaining item per the critique.**

3. **Light-mode atmosphere intentionality.** `glowIntensity: 0.0` in light theme today. Either commit to "light mode has no halo as voice" deliberately, or add a subtle warm halo (e.g. `glowOuterColor: 0xf3e6c8` at intensity 0.25) for limb depth.

4. **`prefers-reduced-motion` ignoring the traveler animation loop.** The CSS rule only stops DOM transitions; the WebGL `tickTravelers(...)` loop still spins. Add a check at the top of `tickTravelers` (in `src/paths.js`) or skip the call from `animate` in `src/main.js`. Sam-with-vestibular-sensitivity persona fail.

5. **URL state / share links.** Refresh wipes filter selection + camera rotation. Cheap to add a query-param round-trip for active teams + globe rotation.

6. **Back-side traveler / arc bleed-through** seen in `media/03-pacific.png`. Investigate whether `LineBasicMaterial` with `transparent: true, opacity: 0.78` is correctly depth-writing. Probably needs `depthWrite: true` on the line material, or move the arcs slightly above the sphere surface.

7. **Icon-only methodology + mileage buttons** in topbar lack visible labels (only `aria-label`). Jordan persona fails — needs visible text or hover tooltip (currently `aria-label` only). Either add labels or surface the affordance differently.

8. **Title cluster density** — logo mark + H1 + season pill + uppercase subtitle (now sentence case after this session) in 280×80px. Drop-shadow on the mark adds a faint halo. The kicker rationing dented this; demoting the subtitle to mute color helped. Remaining: the logo's drop-shadow halo and the still-tight cluster.

9. **0-mile teams in the panel.** The 2026 schedule data is partial — many AFC East / AFC West teams show "0 mi" with empty bars. Either surface as "Schedule TBA" copy, hide those rows by default, or wait until the full slate drops. **Was supposed to drop ~2026-05-14 8 PM ET per the previous handoff — verify if it's now available.**

10. **Re-run `/impeccable critique`** after distill lands to see the updated score and surface what's still load-bearing.

## 💡 Context for Resuming Agent

### Important Context

- **PR #11 awaits review/merge.** Branch is `claude/jolly-wu-f8b2e6`. Two commits: typeset (`f341770`) + cleanup (`f2e9b05`). New sessions should branch off main in a fresh worktree once PR #11 merges; the jolly-wu worktree can be cleaned up after.
- **The full critique still lives at `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`** — source of truth for what's deferred. **Read it first.**
- **The previous handoff is required reading too** — it has the full SNF dark-mode rationale, the data-flow contract above `summariseByTeam`, and the architectural overview not repeated here.
- **The user collaborates by editing the plan file inline** sometimes, and reviews via `/impeccable critique` periodically. Both behaviors documented in user memory.
- **The user dislikes em dashes and architectural metaphors in prose.** Plain concrete sentences only.
- **The 2026 schedule data is partial** — many teams show "0 mi" by design. Was supposed to drop ~2026-05-14 8 PM ET; verify in `src/data/schedule-2026.js` if that's been updated.
- **`gh pr merge --delete-branch` from a worktree has been observed to leave the remote branch alive** — verify after merging.
- **Brotli for python3.14 is broken on this machine.** `python3 -m pip install brotli` fails on a system-level pyexpat ImportError (`_XML_SetAllocTrackerActivationThreshold` symbol not found). Workaround: `brew install brotli` + use the CLI tool, or use a different Python version.

### Assumptions Made

- **PR #11 will be reviewed and merged before the next session.** New work should branch off main, not stack on `claude/jolly-wu-f8b2e6`.
- **The kicker rationing won't be revisited** — TEAMS is the kept slot, others are demoted, and that's the design. If a future pass wants a different "earned" kicker (e.g. rationing TEAMS too), it'd need to commit to using ONLY family/size/weight for hierarchy.
- **Departure Mono pairs well with both registers** (light museum-cartography + dark SNF broadcast) per the visual checks this session. If the Phase 2 Departure-vs-Geist-Mono fallback in the original plan needs revisiting (e.g. if Departure feels too costume in the museum-cartography light register on closer inspection), Geist Mono is already available via Vercel's same package — only needs an `@font-face` swap.
- **The bundled cleanup commit is appropriate scope for PR #11.** If the reviewer would prefer it split, the commits are clean enough to cherry-pick into a follow-up PR.

### Potential Gotchas

- **Don't reintroduce `px` font-sizes.** Use the `--text-*` tokens. Add a new role to the token system if the existing five rungs don't cover.
- **Don't introduce another tracked-uppercase kicker.** TEAMS is the kept slot; new chrome should use sentence case + family/size hierarchy. The brand-bans list explicitly flagged "Repeated tiny uppercase tracked labels as section grammar."
- **Don't extend the `clamp()` pattern beyond the H1.** All other chrome is fixed `rem`. Fluid sizing in dense data-viz panels breaks spatial predictability.
- **The Departure Mono LICENSE file is NOT SIL OFL.** It's the helena.zhang permissive license (terms in the file itself). Don't rename to `OFL.txt` or assume it's the same boilerplate. Git's rename-detection pattern matched it against Manrope's OFL.txt during commit — that's a diff representation, not a content collision.
- **`@font-face format("woff2-variations")`** is required for Geist's variable axis to work. Just `format("woff2")` would treat it as a static font and weight requests outside the chosen master would behave unpredictably. Currently set correctly in `styles.css`.
- **The `season-switch__button` is now mono** (Departure Mono). If you change its font-family back to UI font for any reason, also re-add `letter-spacing` and other tracking that the mono setup obviates.
- **The mobile h1 override at line 944 was deleted** in favor of the clamp's built-in min. If you ever want the mobile H1 to be smaller than 24px, lower the clamp's min, don't re-add a media-query override (it'll fight the clamp).
- **Vite's HMR keeps a console-error buffer that includes stale errors from intermediate edit states.** Don't trust the error log without a fresh reload + a fresh-state DOM query.
- **Light mode WAS verified unchanged** during this session. If you touch the type tokens or any of the new text rules, sanity-check both registers (light museum-cartography + dark SNF broadcast).

## 🌐 Environment State

### Tools/Services Used

- **`gh` CLI** — PR #11 was opened with `gh pr create`. Auth: SSH, account `CypherPoet`.
- **`playwright-cli` (v0.1.8)** — used by `capture-presentational-media` to re-capture all 5 hero shots at 1920×1200.
- **`mcp__Claude_Preview__*`** — Vite dev server preview on port 5173. Used throughout development for verification + the A/B comparison screenshots.
- **`pyftsubset`** (from `/opt/homebrew/bin/fonttools`) — attempted to subset General Sans + Geist to latin/latin-ext woff2 splits, blocked by missing brotli (see Important Context).
- **`trash`** instead of `rm` — used per the global rule to delete the obsolete `fonts/manrope/` and `fonts/jetbrains-mono/` directories.

### Active Processes

- **Vite dev server on `http://localhost:5173/THREE-JS-NFL-Flight-Paths/`** is running in the background (`mcp__Claude_Preview__preview_start name="dev"`). serverId `266aefec-c25a-41ff-995c-402aa3dc2b81`. Safe to leave running for the next session via `mcp__Claude_Preview__preview_list` discovery.
- **Playwright-cli Chrome instance** was opened during media capture and explicitly closed at the end. Nothing should be persistent.

### Environment Variables

None set this session.

## 📚 Related Resources

- **PR**: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/11
- **Critique plan file**: `/Users/ethan/.claude/plans/critique-the-current-globe-eager-stream.md`
- **This session's plan file**: `/Users/ethan/.claude/plans/resume-from-the-most-clever-scone.md`
- **Previous handoff**: [`2026-05-14-234200-snf-dark-mode-and-panel-shipped.md`](./2026-05-14-234200-snf-dark-mode-and-panel-shipped.md)
- **Previous-previous handoff** (project architecture + data-flow contract): [`2026-05-13-212008-misc-improvements-followup.md`](./2026-05-13-212008-misc-improvements-followup.md)
- **Project CLAUDE.md**: `./CLAUDE.md`
- **User global CLAUDE.md**: `/Users/ethan/.claude/CLAUDE.md`
- **`/impeccable` skill reference**: `.claude/skills/impeccable/SKILL.md` (and `reference/typeset.md`, `reference/typography.md`, `reference/brand.md`)
- **Geist source**: https://github.com/vercel/geist-font (release 1.8.0)
- **Departure Mono source**: https://departuremono.com/
- **General Sans source** (for Phase 1 A/B, no longer in repo): https://www.fontshare.com/fonts/general-sans
