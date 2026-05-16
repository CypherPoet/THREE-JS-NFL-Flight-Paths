# 🎬 Handoff: Walkthrough video pipeline shipped (PR #22) — scoped to `hyperframes/`

## 🧾 Session Metadata
- Created: 2026-05-16T16:30:00Z
- Project: /Users/ethan/Projects/Motion-Graphics/Data-Visualization/THREE-JS-NFL-Flight-Paths
- Branch at handoff write time: `claude/nested-juggling-church`
- **Resuming branch: `main`.** PR #22 will be merged before the next hyperframes-related session begins; the resuming agent should pull `main` and work from there.
- PR shipped: [PR #22](https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/pull/22), 3 commits.

### Scope

**This handoff is scoped to `hyperframes/walkthrough/` work only** — the walkthrough video pipeline (capture, composition, render). For app-code / design-critique session state, see the general handoff chain (most recent: [2026-05-16-143818-post-pr-17-critique-measurement-shipped.md](./2026-05-16-143818-post-pr-17-critique-measurement-shipped.md)). The two streams are independent; this scoped handoff exists so a future agent picking up video work doesn't have to sift through unrelated app context.

### Recent Commits (this PR)

- `9f59442` Simplify pass: trim narration, hoist brand tokens to CSS vars
- `7f6717d` Optimize walkthrough pipeline: sub-comp split, CDP capture, 4K render
- `1705241` Add walkthrough video pipeline and HyperFrames composition

## 🔗 Handoff Chain (Hyperframes Stream)

- **Continues from**: None — this is the first hyperframes-scoped handoff.
- **Supersedes**: None.

## 📍 Current State Summary

The walkthrough video pipeline ships in two stages:

1. **Capture** (`npm run record:walkthrough`) — Playwright drives the live Vite dev server through a 15.5s scripted beat sheet. Frames stream directly off Chromium's compositor via Chrome DevTools Protocol `Page.startScreencast`, then encode as H.264 mp4 at the captured effective fps (~75fps on this hardware). Output: `hyperframes/walkthrough/footage.mp4` (1920×1080).

2. **Render** (`npx hyperframes render --fps 60 --quality high --resolution 4k`) — A HyperFrames composition at `hyperframes/walkthrough/index.html` wraps the captured footage with an intro card and an outro card. Sub-comps under `compositions/` own each scene's markup, scoped CSS, and entrance timeline. The runtime auto-nests sub-comp timelines into the root, so the root composer only orchestrates clip-level crossfades. Output: `media/walkthrough.mp4` (3840×2160 @ 60fps, ~34 MB, 19.0s).

The composition is brand-tokenized via CSS custom properties (`--bg`, `--fg`, `--accent`, etc.) defined on `#walkthrough` in `index.html`. Sub-comp scoped styles reference them via `var(--*)` so the four reference docs (design.md, beat-sheet.md, MUSIC_PROMPTS.md, RENDER_SETTINGS.md) describe a single source of truth that actually drives the rendered output.

The in-footage light → dark theme switch lands at composition t≈9.5s — that's the structural beat the soundtrack prompts in MUSIC_PROMPTS.md are written to hit.

## 🧠 Codebase Understanding

### Pipeline diagram

```
┌─────────────────────────────────────────────────────────────┐
│ scripts/record-walkthrough.mjs    (npm run record:walkthrough)
│   - launches headful Chromium + --use-angle=metal           │
│   - drives 15.5s scripted beat sheet                        │
│   - CDP Page.startScreencast → jpeg q95 frames              │
│   - ffmpeg encodes at effective fps to mp4                  │
│                                                             │
│ → hyperframes/walkthrough/footage.mp4  (1920×1080 @ ~75fps) │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ hyperframes/walkthrough/                                    │
│   index.html       — root composer (3 clips + crossfades)   │
│   compositions/                                             │
│     intro.html     — intro card sub-comp + timeline         │
│     outro.html     — outro card sub-comp + timeline         │
│                                                             │
│ → npx hyperframes render --fps 60 --quality high            │
│                          --resolution 4k                    │
│                                                             │
│ → media/walkthrough.mp4  (3840×2160 @ 60fps, 19.0s)         │
└─────────────────────────────────────────────────────────────┘
```

### File map

| File | Role |
| ---- | ---- |
| `scripts/record-walkthrough.mjs` | Playwright + CDP recorder. Dev-server reuse logic, beat sheet, screencast handler, ffmpeg encode. |
| `hyperframes/walkthrough/index.html` | Root composer. Three clip hosts (intro/footage/outro) + crossfade timeline. Brand tokens defined here as CSS variables on `#walkthrough`. |
| `hyperframes/walkthrough/compositions/intro.html` | Intro sub-comp. `<template>`-wrapped, scoped CSS via class selectors, own paused GSAP timeline registered to `window.__timelines["intro"]`. |
| `hyperframes/walkthrough/compositions/outro.html` | Outro sub-comp. Same pattern as intro, plus the one allowed exit animation (final fade at sub-comp t=1.5). |
| `hyperframes/walkthrough/design.md` | Brand source of truth: palette tokens (sourced from `src/themes.js` THEMES.dark), typography, motion rules, avoidance rules, the sub-comp-split runbook. |
| `hyperframes/walkthrough/beat-sheet.md` | The 15.5s capture beats with timecodes + selectors. Single source of truth for what the footage shows. |
| `hyperframes/walkthrough/MUSIC_PROMPTS.md` | Five paste-ready prompts (~19s instrumental) in different sonic territories. Each notes the climactic beat at composition t≈9.5s. |
| `hyperframes/walkthrough/RENDER_SETTINGS.md` | Pipeline specs + commands. Authoritative source for which flags to pass. |
| `hyperframes/walkthrough/footage.mp4` | Captured app footage (gitignored — regenerate via `npm run record:walkthrough`). |
| `hyperframes/walkthrough/fonts/` | Symlink to `../../fonts/` so the HyperFrames compiler can embed them at render time. |
| `hyperframes/walkthrough/.gitignore` | Ignores `footage.mp4` and `.tmp-record/`. |
| `media/walkthrough.mp4` | The shipped deliverable. Committed (3840×2160, ~34 MB). |
| `package.json` | `record:walkthrough` npm script + `playwright` devDep. |

### HyperFrames runtime gotchas

These are non-obvious behaviors of the HyperFrames runtime (`hyperframe-runtime.js`) discovered while building this pipeline. The reference docs describe what to do; this section describes **why** to do it.

1. **`npx hyperframes snapshot` is NOT authoritative.** The snapshot command restructures the DOM aggressively (removes clip elements outside the active time window). Sub-comp timelines may appear to be unmounted / pinned to their end state when inspected via snapshot, while the actual `npx hyperframes render` pipeline scrubs cleanly. Verify renders by sampling frames from the rendered mp4 via `ffmpeg -ss <T> -i media/walkthrough.mp4 -frames:v 1 /tmp/check.png`. Do not trust snapshot frames as the source of truth for sub-comp behavior.

2. **Use plain class selectors only in scoped CSS.** The runtime's CSS scoper rewrites `#authored-id` selectors to `[data-hf-authored-id="..."]`, and that attribute is only set when the template's inner root element had a literal `id=` attribute (which the scoper then strips). The easy-to-miss failure: a sub-comp authored with `#intro-content { ... }` scoping silently breaks because no element ends up with `data-hf-authored-id="intro-content"`. Class selectors get the simpler treatment — each rule is prepended with the host's `[data-composition-id="..."]` and matches reliably.

3. **Use `gsap.fromTo()` over `gsap.from()` in sub-comps.** `from()`'s `immediateRender: true` resets state at construction time, which doesn't compose with the runtime's seek-based capture. `fromTo` defines state at both ends and makes every seek position deterministic. This rule is in `design.md` but the underlying reason is here.

4. **CSS custom properties cascade through composition mounts.** Define brand tokens on the root composition (`#walkthrough { --bg: ...; }`). Sub-comp content mounts inside the host element, which is inside `#walkthrough`, so `var(--bg)` references in sub-comp scoped styles resolve correctly through normal CSS inheritance. This is how the four reference docs' design tokens become single-source-of-truth in code (commit `9f59442`).

5. **Exit animations are banned everywhere except the outro's final fade.** Per `design.md` and the skill's "Scene Transitions (Non-Negotiable)" rules, the clip-level crossfade IS the transition between scenes. The outgoing scene must be fully visible at the moment the transition starts. The only exception: the final scene may fade out at the end. Outro fade lives at `compositions/outro.html` line 162.

### Capture pipeline gotchas

1. **`Page.screencastFrameAck` MUST be fire-and-forget.** Awaiting the ack inside the frame handler serializes the handler and stalls delivery. The runtime sends acks asynchronously while the disk write runs in parallel — this is the recommended CDP pattern.

2. **Headful + `--use-angle=metal` is load-bearing.** Headless software-WebGL renders Three.js ~15× slower than GPU-accelerated and stretches the 15s beat sheet into multi-minute footage. The recorder's launch args set `--use-angle=metal --enable-webgl --ignore-gpu-blocklist`. Don't switch to headless.

3. **Encoding at effective fps preserves wallclock timing.** The encoder receives `-framerate <captured_avg_fps>` so the resulting mp4's duration matches the captured wallclock. Caveat: if Chromium delivers frames unevenly within the capture, sub-segment timing may drift slightly (the average is correct, but bursts compress / GPU stalls stretch). Acceptable for the 15.5s clip; would matter more for longer captures.

4. **Pre-roll is zero by design.** The screencast starts AFTER `page.waitForSelector("#loading", state: "detached")`, so source t=0 is the start of the beat sheet's 2s hero hold. The composition uses `data-media-start="0"`. If you re-introduce a different pre-roll skip, update both this attribute and the in-footage theme-switch timing reference in beat-sheet.md and MUSIC_PROMPTS.md.

### Reference docs as single source of truth

Each reference doc owns its slice:

| Doc | Owns |
| --- | ---- |
| design.md | Brand palette + typography + motion rules + avoidance list + the sub-comp-split runbook |
| beat-sheet.md | The 15.5s capture beats and how composition timing maps to them |
| MUSIC_PROMPTS.md | Five 19s instrumental prompts; the climactic-beat target at t≈9.5s; the `<audio>` clip snippet to wire one up |
| RENDER_SETTINGS.md | Pipeline specs + commands + the resolution-preset constraint (integer multiples only) |

When making changes, update the doc that owns the slice. Cross-doc references should be by link, not by duplication.

## 🏁 Work Completed (PR #22)

### Tasks Finished

- [x] Initial `hyperframes/walkthrough/` composition + Playwright recorder (commit `1705241`)
- [x] Split intro and outro scenes into `compositions/intro.html` + `compositions/outro.html` loaded via `data-composition-src`; `index.html` shrinks to root composer
- [x] Diagnosed and worked around HyperFrames runtime CSS-scoping quirks (class-selectors-only, fromTo-not-from)
- [x] Replaced Playwright `recordVideo` with CDP `Page.startScreencast` capture; effective rate jumped 25fps → 75fps
- [x] Re-rendered `media/walkthrough.mp4` at 4K 60fps high quality
- [x] Hoisted brand tokens from hardcoded hex values to CSS custom properties on `#walkthrough`; sub-comps reference via `var(--*)` (commit `9f59442`)
- [x] Trimmed narrating comments, dropped one-shot `BEAT_SHEET_MS` constant, fixed TOCTOU `existsSync` guard, micro-optimized the hot-path frame handler
- [x] Updated all four reference docs to describe the current pipeline (not "current vs planned")
- [x] PR #22 opened and reviewed (`feature-dev:code-reviewer` — no high-confidence issues)

### Files Modified / Added

| File | Net change | Why |
| ---- | ---------- | --- |
| `scripts/record-walkthrough.mjs` | new (~190 lines after simplify) | Playwright + CDP recorder |
| `hyperframes/walkthrough/index.html` | new (~135 lines) | Root composer |
| `hyperframes/walkthrough/compositions/intro.html` | new | Intro sub-comp |
| `hyperframes/walkthrough/compositions/outro.html` | new | Outro sub-comp |
| `hyperframes/walkthrough/design.md` | new | Brand source of truth |
| `hyperframes/walkthrough/beat-sheet.md` | new | Capture beats |
| `hyperframes/walkthrough/MUSIC_PROMPTS.md` | new | Soundtrack prompts |
| `hyperframes/walkthrough/RENDER_SETTINGS.md` | new | Pipeline specs |
| `hyperframes/walkthrough/.gitignore` | new | Ignore footage.mp4, .tmp-record/ |
| `hyperframes/walkthrough/fonts` | new symlink | Embed-able fonts |
| `media/walkthrough.mp4` | new (~34 MB) | 4K 60fps deliverable |
| `package.json` | modified | `record:walkthrough` script, `playwright` devDep |

### Decisions Made

- **4K (3840×2160) over 1440p.** The `--resolution` flag only accepts integer-multiple presets matching the composition's aspect ratio. 1440p would require a 4/3× fractional scale, which HyperFrames doesn't support. 4K is the next supported step from 1080p.
- **Composition authored at 1920×1080, not 2560×1440 native.** Re-authoring the composition (font sizes, layout, drag coordinates in the beat sheet) for higher native resolution would be a much larger change. Supersampling via `deviceScaleFactor: 2` gives the cards genuine 4K rendering with no upscaling cost; the source footage upscales lanczos. Reasonable trade-off.
- **CDP screencast over `--fps 60` flag alone.** With Playwright's 25fps source cap, `--fps 60` would still leave the middle 15s effectively 25fps (just duplicated frames). The CDP rewrite gets us real 70-80fps source frames so the timeline-fps target is meaningful.
- **CSS variables on `#walkthrough`, not on `:root` or `html`.** Defining tokens on the root composition scopes them naturally to walkthrough work. If a future composition shares the brand, copy or extract — don't pollute `:root`.

## 🚧 Pending Work

### Open follow-ups (hyperframes stream)

1. **Wire up an audio soundtrack.** `MUSIC_PROMPTS.md` has five paste-ready prompts for ~19s instrumental tracks in different sonic territories. Once a track is generated and saved to `hyperframes/walkthrough/audio/soundtrack.mp3`:
   - Normalize to roughly **-1 dB peak**, dialog-track loudness (~-14 LUFS).
   - Add a sibling `<audio>` clip to `index.html`:
     ```html
     <audio
       id="soundtrack"
       class="clip"
       data-start="0"
       data-duration="19"
       data-track-index="4"
       data-volume="0.85"
       src="audio/soundtrack.mp3"
     ></audio>
     ```
   - Re-render. The climactic beat lands at composition t≈9.5s.

2. **Parametrize the composition for variations.** Currently single-output. To produce season variants ("2025 Season", "2026 Season"), URL variants, or alternate routes:
   - Add `data-composition-variables` JSON array on `<html>` in `index.html` and sub-comps.
   - Read in scripts via `window.__hyperframes.getVariables()`.
   - Render with `--variables '{"season":"2026"}'` or per-instance `data-variable-values='{...}'` on sub-comp hosts.
   - The HyperFrames skill docs cover the pattern; the runtime is already wired up for it.

3. **Beat-sheet revisions.** If the visual flow needs adjusting (different drag arcs, different preset switch, different theme-switch timing): edit `scripts/record-walkthrough.mjs` directly. The sleep durations + mouse coordinates are inline. Keep the total close to 15500ms (the composition's footage clip is `data-duration="15.4"`, so there's ~100ms buffer at the end). After editing, re-record + re-render + update `beat-sheet.md` to match.

### Won't-fix / explicit non-goals

- **Higher than 4K render.** 6K (`--resolution` 3×) is theoretically possible but the source footage stays 1920×1080; gains would be cosmetic on the cards only and file size would balloon.
- **Native-resolution capture at >1080p.** The Vite dev server's UI layout is sized for 1920×1080. Bumping the capture viewport to 2560×1440 or 3840×2160 would shift mouse coordinates in the beat sheet (drag positions, hover targets). Not worth the complexity for the modest sharpness gain on the WebGL globe.

### Known limitations (won't get fixed without changing approach)

- **`effectiveFps` is a wallclock average.** If Chromium delivers frames unevenly during capture (GPU stalls, compositor jitter), per-segment timing within the resulting mp4 may shift. Net duration is correct.
- **`chromium-headless-shell` would cap CDP screencast below native rate.** The recorder must stay headful to get the GPU-accelerated frame rate. A headless render farm would need a different strategy.

## 🛠️ Common Commands

### Re-record footage

```bash
npm run record:walkthrough
```

Auto-starts the Vite dev server on port 5173 if free; otherwise reuses an existing one. Outputs `hyperframes/walkthrough/footage.mp4`. Look for the line `✓ Done: ... (Nfps, N.NNs)` — `Nfps` should be ≥50 for a clean capture.

### Re-render walkthrough.mp4

```bash
cd hyperframes/walkthrough
npx hyperframes render \
  --fps 60 \
  --quality high \
  --resolution 4k \
  --output ../../media/walkthrough.mp4
```

Takes ~2 min on this hardware. Output: `media/walkthrough.mp4` (3840×2160 @ 60fps, 19.0s).

### Validate render

```bash
ffmpeg -ss <T> -i media/walkthrough.mp4 -frames:v 1 -q:v 2 /tmp/check.png
```

Sample key timestamps: 0.8s (intro entered), 9.5s (in-footage theme switch / climactic beat), 17.3s (outro entering), 18.7s (outro near end).

### Lint composition

```bash
cd hyperframes/walkthrough
npx hyperframes lint
```

Should report `0 errors, 0 warnings` across 3 files (index.html + intro.html + outro.html).

### Do NOT trust

```bash
npx hyperframes snapshot --at <T>   # restructures DOM; not authoritative for sub-comp animations
```

Use real render + ffmpeg extraction instead. See runtime gotcha #1.

## 📋 Reading List for the Resuming Agent

If you're picking up hyperframes work, read in this order:

1. **This handoff** — sets the post-merge state and points at the runtime gotchas.
2. `hyperframes/walkthrough/design.md` — brand source of truth, motion rules, the sub-comp-split runbook.
3. `hyperframes/walkthrough/RENDER_SETTINGS.md` — pipeline specs + commands.
4. `hyperframes/walkthrough/beat-sheet.md` — what's actually in the captured footage.
5. `hyperframes/walkthrough/MUSIC_PROMPTS.md` — if wiring audio.
6. The HyperFrames skill docs (in the npx cache or `/Users/ethan/.claude/plugins/cache/cypherpoet-personal/hyperframes/.../skills/hyperframes/SKILL.md`) — for sub-comp variables, scene transition rules, motion principles.

Don't re-derive the runtime quirks. They're documented above; the discovery cost was real and shouldn't repeat.
