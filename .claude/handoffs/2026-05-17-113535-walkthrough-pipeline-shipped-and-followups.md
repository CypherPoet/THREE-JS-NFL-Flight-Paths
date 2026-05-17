# 🤝 Handoff: Walkthrough pipeline shipped — post-PR-22 follow-ups

## 🧾 Session Metadata
- Created: 2026-05-17T11:35:35Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths/.claude/worktrees/nested-juggling-church
- Branch: `main` (post-merge — this handoff assumes PR #22 has landed)
- PR: #22 (merged)

### Recent Commits (assumed post-merge state)
  - `<merge sha>` Merge pull request #22 (walkthrough video pipeline)
  - b944b69 Simplify pass: hoist Spherical allocation out of __animateToView tick
  - 3d202c0 Polish walkthrough: precise camera, soundtrack, storyboard shape
  - 99af89a Merge remote-tracking branch 'origin/main' into worktree-nested-juggling-church
  - 6040965 Fix spelling of "visualisation" to "visualization" in README.md

## 🔗 Handoff Chain

- **Continues from**: [2026-05-17-080548-walkthrough-precision-camera-and-concept-doc.md](./2026-05-17-080548-walkthrough-precision-camera-and-concept-doc.md)
  - Previous title: Walkthrough precision camera, theme-flip alignment, concept doc
- **Supersedes**: None (the prior handoff's three loose ends were all executed and shipped on PR #22)

> Read the previous handoff for the camera + theme + concept-doc context. Read [2026-05-16-163000-walkthrough-video-pipeline-shipped.md](./2026-05-16-163000-walkthrough-video-pipeline-shipped.md) for the original pipeline architecture.

## 📍 Current State Summary

PR #22 (walkthrough video pipeline) is merged. The pipeline ships a 21s 4K walkthrough with:
- Precise camera tween (`window.__animateToView` in `src/main.js`) replacing the hand-tuned mouse drag at beat 7. Tween lands exactly on the bookmarked Europe view `?view=1.066,0.799,2.32` every re-record.
- Active soundtrack: `hyperframes/walkthrough/assets/audio/soundtrack-01.mp3` (20.565s, 64 kbps stereo, generated from `music-prompts/3-modern-minimal-data-viz.md`), wired into the composition at `data-track-index="0"`.
- `STORYBOARD.md` (renamed from `beat-sheet.md`) reshaped to match the `website-to-hyperframes` skill's storyboard convention: global direction header (concept / audience / take-away / mood / underscore) + per-beat creative-direction sections + the original mechanical beats table. **Narrative bodies are intentional stubs** — the agent shipped scaffolding, the user fills the voice.
- Theme-flip timing: `waitUntil(6.5)` in the recorder lands the visible flip at composition t≈9.52s — verified empirically against the rendered output. (The prior handoff's hypothesis that a 250ms CSS transition was shifting the flip 0.35s late turned out to be wrong; the globe's synchronous Three.js material swap masks the body's transition.)

Nothing in the pipeline is broken or in-progress. This handoff is a forward-looking punch list for the next session.

## 🧠 Codebase Understanding

### Architecture Overview

Two-stage pipeline (unchanged from prior handoff):
1. **Capture** (`npm run record:walkthrough`) — Playwright + CDP `Page.startScreencast` drives the live Vite dev server through `scripts/record-walkthrough.mjs`'s beat sheet. Anchors against absolute footage time via `waitUntil(t)`. Writes `hyperframes/walkthrough/footage.mp4` (gitignored).
2. **Render** (`npx hyperframes render`) — composites intro card + footage + outro card + soundtrack track at 4K 60fps. Sub-comps use `<template>` wrappers; soundtrack uses a top-level `<audio>` element with `data-track-index="0"`.

URL state contract in `src/main.js`: `?view=θ,φ,r` sets spherical camera coords; debounced 220ms write on camera change; `flushUrlStateImmediate` bypasses for share/share-link/tween-end. `window.__animateToView({theta, phi, r, duration})` exposed as a hook for the recorder — RAF tween with shortest-path theta wrap.

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `hyperframes/walkthrough/STORYBOARD.md` | Storyboard + narrative direction | Narrative bodies are stubs — user fills, or next agent drafts a pass from `design.md` + `music-prompts/3-modern-minimal-data-viz.md` for user to edit |
| `hyperframes/walkthrough/index.html` | Composition root | New `<audio>` element wired at `data-track-index="0"`. Has `data-composition-variables` opportunity — currently none declared |
| `src/main.js:236-269` | `window.__animateToView` | Camera tween hook. Uses `controls.update()` no-arg (vs main loop's `controls.update(delta)`). Minor inconsistency surfaced by code review — non-blocking |
| `.claude/upstream-issue-draft.md` | Bug report draft for `heygen-com/hyperframes` | Body was used to file issue [#911](https://github.com/heygen-com/hyperframes/issues/911). File can be deleted — see "Cleanup housekeeping" |
| `hyperframes/walkthrough/compositions/intro.html:199-212` | Yoyo dot pulse | Workaround for [hyperframes#911](https://github.com/heygen-com/hyperframes/issues/911) — extends the timeline past `data-duration`. Keep until upstream fix lands. Inline comment doesn't yet reference the issue # — see "Cleanup housekeeping" |
| `tests/presentational-sync.test.mjs` | New Vitest suite from main-merge | Worktree never ran `npm install` post-merge; vitest/happy-dom not installed locally |

### Key Patterns Discovered

- **Recorder-hook pattern via `window.__*`.** Exposing `window.__animateToView` is the project's idiom for "deterministic, scriptable from Playwright" — hidden double-underscore convention. URL `?view=` already mirrors camera state, so this isn't a new exposure of internal state, just a more ergonomic write path.
- **Audio is `<audio>`, not video-with-sound.** Hyperframes rule (from skill `SKILL.md` "Video and Audio"). Even when the video also has audio content, audio is always a separate element. The walkthrough's `footage.mp4` is `muted` and the soundtrack rides on a separate audio track.
- **Empirical > guessed timing.** The prior handoff's diagnosis of a 350ms theme-flip lag was wrong because it didn't account for the Three.js material swap dominating the visual. **Always sample the rendered output before tuning recorder timings.**
- **`.thumbnails/` and `.waveform-cache/`** are hyperframes render artifacts — both gitignored in this PR. If new render artifacts appear in `hyperframes/walkthrough/`, default-gitignore them.

## 🏁 Work Completed (PR #22 final state)

### Tasks Finished

- [x] `window.__animateToView` RAF tween in `src/main.js` with shortest-path theta wrap
- [x] Recorder beat 7: replaced 80-step mouse drag with `page.evaluate(__animateToView(...))`
- [x] Recorder beat 5 timing: empirically verified `waitUntil(6.5)` lands the visible flip at composition t≈9.52s (within ±0.1s target)
- [x] Wired `soundtrack-01.mp3` into the composition as a `<audio data-track-index="0">` element
- [x] Renamed `beat-sheet.md` → `STORYBOARD.md` and expanded to match `website-to-hyperframes` skill's shape
- [x] Updated cross-references in `scripts/record-walkthrough.mjs` + `RENDER_SETTINGS.md`
- [x] Annotated `music-prompts/README.md` with active soundtrack + provenance
- [x] Gitignored `.thumbnails/` and `.waveform-cache/` render artifacts
- [x] Re-rendered `media/walkthrough.mp4` (35.5MB, 4K 60fps, 21s, includes soundtrack)
- [x] Simplify pass: hoisted `THREE.Spherical()` allocation out of tween tick loop
- [x] Multi-agent code review (`/code-review:code-review`) — no issues scored ≥80 threshold; not posted

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Rename `beat-sheet.md` → `STORYBOARD.md` | keep name / rename / add separate file | User chose alignment with `website-to-hyperframes` blessed convention. Cross-refs updated; rename shows as A+D in git (content diverged >50%) — `git log --follow --find-renames=20%` traces it |
| Wire soundtrack at `data-volume="1"` | 1.0 / 0.85 (per earlier README spec) | Final source is pre-normalized; full volume is appropriate. README updated to match implementation |
| `controls.update()` no-arg in tween | with-delta / without-delta | Tween drives position directly each frame — damping has no observable effect. Code review flagged consistency but scored 50/100 (sub-threshold). Deferred |
| Keep handoff files in-place when renaming `beat-sheet.md` | Update all refs / leave handoffs as historical | Per memory `feedback_dont_strip_handoff_documentation.md`: don't rewrite history. Only updated live code refs |

## 🚧 Pending Work

### Immediate Next Steps

1. **`npm install` housekeeping.** The main-merge brought in vitest + happy-dom + a `tests/` suite, but this worktree's `node_modules` only has playwright. Run `npm install`, then `npm run test:run` and `npm run media:check` to confirm the local env matches CI. Surface any failures before they bite.

2. **Draft the STORYBOARD narrative voice.** The user said they'd fill in the section stubs themselves (Concept / Audience / Take-away / Mood / NOT / per-beat Concept+Mood+SFX). If they ask for a draft, source material is:
   - `hyperframes/walkthrough/design.md` (brand voice)
   - `hyperframes/walkthrough/music-prompts/3-modern-minimal-data-viz.md` (mood prose)
   - The "Why these beats" section already in `STORYBOARD.md`
   - **Don't pre-fill without being asked** — per the original plan, the user owns the voice.

### Cleanup housekeeping (low-priority)

Upstream sub-comp duration bug was filed as [heygen-com/hyperframes#911](https://github.com/heygen-com/hyperframes/issues/911) ("Sub-composition slot goes black after GSAP timeline ends, regardless of host data-duration"). Two follow-ups are pending:

- **Delete `.claude/upstream-issue-draft.md`.** Body was used; draft is no longer needed.
- **Link issue #911 from the workaround comment** at `hyperframes/walkthrough/compositions/intro.html:199-212` (the yoyo dot pulse). Future readers will want to know which upstream bug the workaround tracks and when to remove it.

### Blockers/Open Questions

- [ ] **Should `controls.update(delta)` be passed in `__animateToView`?** Currently no-arg. No observable bug today; matters only if OrbitControls damping is tightened or the tween becomes interruptible. Sub-threshold per code review. Fix is one line — defer unless adjacent work touches the area.
- [ ] **Should `data-volume="1"` be tuned down?** Listen to the rendered walkthrough — if the soundtrack is hot relative to a typical viewer's chrome volume, drop to 0.85 (the original README target). Quick A/B with two renders.
- [ ] **Should `hyperframes/walkthrough/` get its own `CLAUDE.md`?** It now has STORYBOARD + design + render-settings + music-prompts + composition + recorder + soundtrack — a self-contained sub-project with its own conventions (sub-comp duration trap, track-index allocations, audio is `<audio>`, etc.). A scoped CLAUDE.md would help future agents avoid re-learning these. Not blocking.

### Deferred Items

- **Variable parametrization of the composition** (still TODO from the original handoff). Hyperframes supports `data-composition-variables` on the `<html>` root + `window.__hyperframes.getVariables()` inside scripts + `--variables '{...}'` at render time. Would let the same composition be re-rendered with different titles, themes, or season labels. Scope: ~50-100 lines across `index.html` + `compositions/intro.html` + `compositions/outro.html`.
- **Beat sheet revisions for 1920×1080 viewport** (still TODO from the original handoff). Some captured frames may have UI elements arranged for a different viewport size. Worth a visual audit pass.
- **Walkthrough as a CI artifact.** Currently the .mp4 is committed (35.5MB). Consider a GitHub Action that re-renders on `src/`/`hyperframes/walkthrough/` changes and uploads as a workflow artifact instead of bloating git history. Trade-off: easy preview via committed mp4 vs. growing repo size.

## 💡 Context for Resuming Agent

### Important Context

**The walkthrough is production-quality.** Don't re-tune, re-render, or re-storyboard unless the user asks. The render at `media/walkthrough.mp4` is the artifact PR #22 shipped — it should not be regenerated casually because each render bloats git history by ~36MB.

**STORYBOARD narrative bodies are intentionally empty.** The user owns the voice. Don't draft prose into those `<!-- ... -->` HTML-comment hints unless explicitly asked.

**Upstream bug is filed** as [heygen-com/hyperframes#911](https://github.com/heygen-com/hyperframes/issues/911). The draft file and the workaround comment haven't been linked to the issue yet — see "Cleanup housekeeping" in Pending Work. Don't take destructive cleanup actions (file deletion, comment rewrites) without confirming with the user.

**Empirical verification matters more than reasoning from CSS specs.** The theme-flip timing taught us this — the prior handoff's "click delay = CSS transition + actionability" model was plausible but wrong. Sample the actual rendered output before tuning.

### Assumptions Made

- PR #22 merged cleanly without squash/edits — commits `3d202c0` and `b944b69` are in main with their messages intact.
- `claude/nested-juggling-church` branch was deleted after merge (per typical `gh pr merge --delete-branch` flow). The worktree at `.claude/worktrees/nested-juggling-church/` may be stale — check before resuming.
- No further commits to `main` between this handoff's creation and the next session — if there are, re-check critical line numbers (`src/main.js:236` for `__animateToView`) before any patch.

### Potential Gotchas

- **Sub-composition slot duration trap.** A sub-comp whose internal GSAP timeline runs shorter than its host's `data-duration` goes black for the rest of the slot. The intro composition extends its timeline via a yoyo dot pulse (`intro.html:199-212`) to work around this. If you add a new sub-comp, mirror the workaround until the upstream issue is fixed.
- **Hyperframes ships its own audio waveform cache.** `.waveform-cache/` appears after the first render with an audio track. Gitignored — but if you see it untracked, that's why.
- **Port 5173 collisions across worktrees.** If another worktree is running `npm run dev` on 5173, the recorder will hit that worktree's code instead of this one. Check `lsof -i :5173 -t` + `lsof -p <pid> | grep cwd` before recording. (Happened during PR #22 development.)
- **Hyperframes Spherical.set arg order is `(radius, phi, theta)`** — not the same as the constructor's documented order in some examples. Triple-check when extending camera math.
- **Inline-image agents trust the handoff over the code.** The PR #22 code review surfaced two reviewer findings that cited the prior handoff's *hypothesis* about theme-flip drift, even though the commit message documented the empirical correction. When reviewing similar pipelines, agents should prefer rendered-output measurements over handoff text.

## 🌐 Environment State

### Tools/Services Used

- `hyperframes` 0.6.16 (latest at PR #22 merge; installed via `npx`)
- Playwright (devDep; chromium with `--use-angle=metal` for GPU-accelerated WebGL)
- Three.js 0.184.0
- ffmpeg / ffprobe 8.1.1 (for frame sampling + audio inspection during verification)
- Node v24.14.1
- Vitest + happy-dom (devDeps from main-merge; not installed in this worktree)

### Active Processes

- None expected. Dev server should be stopped between sessions; recorder spawns its own on port 5173.

### Environment Variables

- None project-specific.

## 📚 Related Resources

- **PR #22 (merged)**: https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/22
- **Upstream bug (filed)**: https://github.com/heygen-com/hyperframes/issues/911
- **Upstream bug repro**: https://github.com/CypherPoet/hyperframes-subcomp-blanks-after-timeline-end
- **Hyperframes recommended workflow**: https://hyperframes.heygen.com/guides/prompting#recommended-workflow
- **`website-to-hyperframes` skill STORYBOARD format**: `~/.claude/plugins/cache/temp_github_*/skills/website-to-hyperframes/references/step-4-storyboard.md`
- **Previous handoff (plan that became PR #22)**: [2026-05-17-080548-walkthrough-precision-camera-and-concept-doc.md](./2026-05-17-080548-walkthrough-precision-camera-and-concept-doc.md)
- **Original pipeline handoff**: [2026-05-16-163000-walkthrough-video-pipeline-shipped.md](./2026-05-16-163000-walkthrough-video-pipeline-shipped.md)

---

**Security Reminder**: Before finalizing, run `validate_handoff.py` to check for accidental secret exposure.
