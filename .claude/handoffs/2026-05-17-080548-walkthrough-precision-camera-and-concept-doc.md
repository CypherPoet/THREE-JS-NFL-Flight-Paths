# 🤝 Handoff: Walkthrough precision camera, theme-flip alignment, concept doc

## 🧾 Session Metadata
- Created: 2026-05-17T08:05:48Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths/.claude/worktrees/nested-juggling-church
- Branch: worktree-nested-juggling-church
- PR: #22 (open, 32 commits ahead of `origin/claude/nested-juggling-church`)

### Recent Commits (for context)
  - 0ac1241 Merge remote-tracking branch 'origin/main' into worktree-nested-juggling-church
  - 1bea97d Polish walkthrough timing and clarify capture-vs-render docs
  - 982c5f9 Merge pull request #26 from CypherPoet/claude/confident-goldberg-b3eaa7
  - 52526dd Merge remote-tracking branch 'origin/main' into claude/confident-goldberg-b3eaa7
  - 168c03d Simplify: source overseas count from intl, drop dead key field

## 🔗 Handoff Chain

- **Continues from**: [2026-05-16-163000-walkthrough-video-pipeline-shipped.md](./2026-05-16-163000-walkthrough-video-pipeline-shipped.md)
  - Previous title: Walkthrough video pipeline shipped (PR #22) — scoped to `hyperframes/`
- **Supersedes**: None

> Read the previous handoff for the walkthrough pipeline's architecture, design.md philosophy, and music-prompts structure before filling this one in.

## 📍 Current State Summary

The walkthrough pipeline (intro card + 15.4s footage + outro card → 21s 4K render) is shipping a fresh render captured against the latest `main`, but the post-merge app introduced three loose ends we planned to fix and never executed. A plan exists at `/Users/ethan/.claude/plans/streamed-watching-quokka.md` covering precise solutions for all three; the user explicitly chose **animate** (GSAP-style RAF tween) for the Europe rotation and **stubs-only** for the new concept doc. The session was paused in plan mode before executing any of those changes. The current `media/walkthrough.mp4` (committed on `1bea97d`, then re-rendered post-merge in working tree) has the theme flip landing at composition t≈9.85s instead of the target 9.5s, and a hand-drag east instead of the bookmarked Europe view.

## 🧠 Codebase Understanding

### Architecture Overview

Two-stage pipeline, documented in `hyperframes/walkthrough/RENDER_SETTINGS.md`:

1. **Capture** (`npm run record:walkthrough`) — Playwright + CDP `Page.startScreencast` drives the live Vite dev server through `scripts/record-walkthrough.mjs`'s beat sheet. Anchors against absolute footage time via a `waitUntil(t)` helper, so Playwright click/hover wallclock overhead doesn't drift later beats. Writes `hyperframes/walkthrough/footage.mp4` (gitignored).

2. **Render** (`npx hyperframes render`) — composites intro card (`compositions/intro.html`) + footage + outro card (`compositions/outro.html`) at 4K 60fps. Each sub-comp's `<template>` wrapper holds CSS-scoped GSAP timelines registered on `window.__timelines[<id>]`.

URL state in the live app: `?view=θ,φ,r` sets spherical camera coords. The URL is auto-written when the camera changes (debounced 220ms; `flushUrlStateImmediate` bypasses for share-link). Source: `src/main.js:57-62` (parse), `src/main.js:84-97` (write), `src/main.js:230-234` (apply on load).

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `/Users/ethan/.claude/plans/streamed-watching-quokka.md` | The execution plan to resume from | **Start here. The plan is the source of truth.** |
| `src/main.js:57-62` | `parseViewParam` — URL `?view=` → `{theta, phi, r}` | Reuse the Spherical math when adding `window.__animateToView` |
| `src/main.js:84-92` | `writeUrlState` writes `?view=` from `controls` | `controls.update()` triggers this, so the tweener gets URL sync free |
| `src/main.js:113-116` | `flushUrlStateImmediate` | Call at tween end to bypass the 220ms debounce |
| `src/main.js:230-234` | Where `urlView` is applied at boot | Append `window.__animateToView` right after |
| `scripts/record-walkthrough.mjs` | Recorder with beat-sheet-anchored `waitUntil(t)` | Two surgical edits per the plan |
| `hyperframes/walkthrough/beat-sheet.md` | Beat sheet (15.5s) + composition timing | Update beat 5 + beat 7 driver rows |
| `hyperframes/walkthrough/RENDER_SETTINGS.md` | Pipeline docs | No changes needed |
| `hyperframes/walkthrough/concept.md` | **Does not exist yet** — the plan creates it as a stub | New file |

### Key Patterns Discovered

- **Sub-comp slot hold trap (HyperFrames quirk):** a sub-composition whose internal GSAP timeline runs shorter than its host's `data-duration` goes black for the rest of the slot. Counter-intuitive vs the documented "data-duration takes precedence" rule. Workaround: extend the sub-comp's timeline with any tween whose end falls at `t ≥ duration`. The intro composition uses a yoyo dot pulse for this; see `compositions/intro.html:199-212`.
- **Upstream issue filed:** https://github.com/CypherPoet/hyperframes-subcomp-blanks-after-timeline-end has the minimal repro. The issue draft (paste-ready for `heygen-com/hyperframes` bug template) lives at `.claude/upstream-issue-draft.md`.
- **CSS transitions matter for capture timing.** Post-merge `main` introduced a 250ms `background-color` transition on theme switch. Combined with Playwright's `click()` actionability overhead (~100ms), the visible flip lands ~0.35s after the click fires. Compensate by firing the click earlier (`waitUntil(6.1)` instead of `waitUntil(6.5)`).

## 🏁 Work Completed

### Tasks Finished

- [x] Pulled latest main into the worktree (clean merge — no conflicts)
- [x] Re-captured footage against the post-merge app (15.50s @ 90fps effective)
- [x] Re-rendered `media/walkthrough.mp4` (21.0s, 4K 60fps, 27.9 MB) — captured the timing drift but didn't fix it
- [x] Identified root cause of theme-flip drift (250ms CSS transition + Playwright click overhead)
- [x] Wrote the execution plan at `/Users/ethan/.claude/plans/streamed-watching-quokka.md`
- [x] Refactored `RENDER_SETTINGS.md` to lead with the Capture vs Render mental model + decision table
- [x] Filed minimal repro repo for the hyperframes sub-comp duration bug
- [x] Drafted bug report body matching `heygen-com/hyperframes` bug template (`.claude/upstream-issue-draft.md`)

### Files Modified (in working tree, not yet committed)

| File | Changes | Rationale |
|------|---------|-----------|
| `media/walkthrough.mp4` | Re-rendered against latest main | Captures the new app UI; has the drift bugs documented above |
| `.claude/upstream-issue-draft.md` | New file (untracked) | Paste-ready bug report for the sub-comp duration issue |
| `hyperframes/walkthrough/.thumbnails/` | New dir (untracked) | Render artifact; consider gitignoring |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| **Animate the Europe rotation** (not snap) | snap (1 frame) vs animate (1.5s ease) | Smoother feel; user preference. RAF tweener is ~25 lines, no GSAP dep. |
| **Use a `window.__animateToView` hook** in src/main.js | URL navigation, expose camera/controls globals, message channel | Navigation re-triggers loader. Exposing internals is too broad. A scoped `__animateToView` is one entry point that already mirrors the existing URL→spherical math. |
| **`concept.md` as stub** (not pre-filled) | full draft, stub-only, no file at all | Stub respects the user's voice. Concept docs that feel ghostwritten get rewritten or ignored. |
| **`concept.md` over `brief.md` / `direction.md`** | three naming conventions | "Concept" reads as design-domain, fits sibling docs (design.md). |
| **Fix click timing by `waitUntil(6.1)`** (not 6.0 or 6.2) | -0.3, -0.4, -0.5 from 6.5 | 250ms CSS transition + 100ms click ≈ 350ms; centering the visible flip on t=9.5s requires the click ~400ms early. |

## 🚧 Pending Work

### Immediate Next Steps

1. **Re-read the plan** at `/Users/ethan/.claude/plans/streamed-watching-quokka.md`. It has the exact code blocks for each edit.
2. **Add `window.__animateToView`** to `src/main.js` after line 234. Verify it works via `npm run dev` + browser console:
   ```js
   window.__animateToView({ theta: 1.066, phi: 0.799, r: 2.32, duration: 1500 })
   ```
   Globe rotates east over 1.5s; URL ends at `?view=1.066,0.799,2.32`.
3. **Edit `scripts/record-walkthrough.mjs`**: theme-click `waitUntil(6.5)` → `waitUntil(6.1)`; replace beat 7's mouse-drag block with `page.evaluate(() => window.__animateToView({...}))`.
4. **Update `hyperframes/walkthrough/beat-sheet.md`**: beat 5 + beat 7 row changes; add `concept.md` cross-link.
5. **Create `hyperframes/walkthrough/concept.md`** with the section stubs from the plan (pitch / audience / take-away / narrative arc / mood / key moments / what this is NOT).
6. **Re-capture and re-render**:
   ```bash
   npm run record:walkthrough
   cd hyperframes/walkthrough && npx hyperframes render --fps 60 --quality high --resolution 4k --output ../../media/walkthrough.mp4
   ```
7. **Verify**:
   - Sample composition frames at t=9.3, 9.5, 9.7, 9.9 — visible darkening midpoint on 9.5s ±0.1s.
   - Sample t≈14s — camera framing matches the bookmarked `?view=1.066,0.799,2.32` URL view.
8. **Commit** the changes as one logical commit. Then push and update PR #22.

### Blockers/Open Questions

- [ ] **`__animateToView` exposure scope.** The plan exposes it unconditionally on `window`. Worth gating on `?recording=1` URL param to keep the surface area smaller? User wasn't asked. Probably fine unconditional — it's a hidden double-underscore convention and the URL already mirrors camera state.
- [ ] **`concept.md` first draft.** User chose stubs-only. The user will fill it in; do not pre-author the content. If the user later asks to draft, draw from the existing music-prompts README which has the structural narrative, and from beat-sheet.md's "Why these beats" section.
- [ ] **Should `.thumbnails/` be gitignored?** It's a render artifact. Not blocking.

### Deferred Items

- Wiring an actual soundtrack mp3 into the composition (still TODO; awaits the user picking one of the 5 music prompts).
- Variable parametrization of the composition (still TODO from prior handoff).
- Beat sheet revisions to keep the capture viewport at 1920×1080 (per prior handoff).

## 💡 Context for Resuming Agent

### Important Context

**The plan is the contract.** Do not re-plan. Execute `/Users/ethan/.claude/plans/streamed-watching-quokka.md` as written. The user reviewed and chose options (animate, stub-only) before the plan was finalized.

**Don't get ambitious with `concept.md`.** The user explicitly chose "section stubs, you fill in the voice" — meaning they fill in the voice, not the agent. Create the file with headings + brief HTML-comment explanatory hints. Empty bodies under each heading. Resist the urge to draft prose.

**Music prompts target composition t=9.5s for the HIT.** The whole point of the theme-click timing fix is to align with that. If the rendered output has the visible darkening midpoint at 9.5s ±0.1s, the music sync will work when a soundtrack is wired up.

**Europe view target is exact: `theta=1.066, phi=0.799, r=2.32`.** Don't round, don't tweak. The user supplied this URL specifically.

**The previous render committed at `1bea97d` had the OLD beat sheet hitting the OLD app.** The render in the working tree (uncommitted) has the OLD beat sheet hitting the NEW app — which is what created the drift. After executing the plan, the next render will have the FIXED beat sheet hitting the NEW app.

### Assumptions Made

- The user owns the `?view=1.066,0.799,2.32` view — i.e., they manually rotated to that view and want the recorder to land there exactly. They won't change their mind on this number.
- The 250ms CSS transition timing won't change between sessions (i.e., `main` won't move further before this work is resumed). If it does, re-measure the visible flip start/end times in raw footage and re-tune `waitUntil(...)`.
- `controls.update()` inside the RAF tween fires the `change` event each tick, which would write the URL each tick if not debounced. The existing 220ms debounce handles this — we don't have to worry about URL spam, but `flushUrlStateImmediate` at tween end ensures the final URL is correct.

### Potential Gotchas

- **`page.evaluate(fn)` awaits the returned Promise** — Playwright will block until `window.__animateToView` resolves. If the function name is wrong or the page hasn't fully loaded, you'll silently get stuck waiting. Verify the tween works in the browser console first.
- **The dev server needs to be running for capture.** `record:walkthrough` will auto-start it if port 5173 is free.
- **`window.__animateToView` must be defined before the recorder reaches beat 7.** The script waits for the loader to detach + `#team-list .team-row` to render, then starts the screencast. By that point `main.js` has executed and the global is set. Don't add the assignment inside an `async` or `setTimeout` block — keep it synchronous after `controls.update()`.
- **Sub-composition slot duration trap** (see Key Patterns above) — if anyone adds new sub-comps, remember to extend the timeline.

## 🌐 Environment State

### Tools/Services Used

- `hyperframes` 0.6.14 (latest; from npm via `npx`)
- Playwright (bundled in this project)
- Three.js (project dep, used via ES module import)
- ffmpeg / ffprobe 8.1.1 (for frame sampling during verification)
- Node v24.14.1

### Active Processes

- None expected. The Vite dev server should be stopped between sessions. The recorder will spin it up.

### Environment Variables

- None project-specific.

## 📚 Related Resources

- **The plan**: `/Users/ethan/.claude/plans/streamed-watching-quokka.md`
- **Upstream bug repro**: https://github.com/CypherPoet/hyperframes-subcomp-blanks-after-timeline-end
- **Upstream issue draft**: `.claude/upstream-issue-draft.md`
- **HyperFrames recommended workflow**: https://hyperframes.heygen.com/guides/prompting#recommended-workflow
- **HyperFrames bug template** (when filing the upstream issue): https://github.com/heygen-com/hyperframes/issues/new?template=bug.yml
- **HyperFrames init agent ran for context**: scaffolds only `index.html` + shared `CLAUDE.md/AGENTS.md`. The walkthrough project is already richer than the init.
- **Previous walkthrough handoff**: [2026-05-16-163000-walkthrough-video-pipeline-shipped.md](./2026-05-16-163000-walkthrough-video-pipeline-shipped.md)

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
