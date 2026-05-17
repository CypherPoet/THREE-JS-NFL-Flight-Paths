# Walkthrough Storyboard

The creative north star for `media/walkthrough.mp4` — what the viewer experiences and why, beat by beat. The mechanical timings below mirror `scripts/record-walkthrough.mjs` (the executable source of truth for capture); the creative direction here is the source of truth for everything else (composition timing, music, future re-shoots).

Shape follows the `website-to-hyperframes` skill's STORYBOARD convention: a Global Direction header + per-beat creative direction + production architecture footer.

Recapture at any time: `npm run record:walkthrough` (writes to `hyperframes/walkthrough/footage.mp4`).

## Global Direction

**Format:** 1920×1080 → upscaled to 4K UHD at render (see [RENDER_SETTINGS.md](./RENDER_SETTINGS.md))
**Audio:** Music underscore only (no narration). Active soundtrack: `assets/audio/soundtrack-01.mp3`. See [music-prompts/](./music-prompts/) for the briefs the soundtrack was generated from.
**Style basis:** [design.md](./design.md) (brand colors, fonts, theme palettes); brand tokens live on the composition root in [index.html](./index.html).

### Concept

<!-- The big idea in 2–3 sentences. What is this 21s video? -->

### Audience

<!-- Recruiter? r/nfl? Portfolio reviewer? Future-you a year from now? -->

### Take-away

<!-- After 21 seconds, what should the viewer think or feel? Be specific —
     "delight at the theme flip" or "I want to play with this" or
     "this is a serious data project". -->

### Mood / tone

<!-- 3–5 adjectives. Cultural / design references welcome.
     e.g. "patient confidence, technical warmth, NFL Films register". -->

### What this video is NOT

<!-- Features deliberately cut from the demo: methodology modal, mileage
     breakdown, season switch, share button. They exist; they're not the story. -->

### Underscore direction

<!-- The HIT — the structural beat the soundtrack lands on — is at composition
     t=9.5s (theme flip). Active soundtrack file + provenance live in the
     header above. -->

## Beats

The footage stays on the US for the first half — exercising the toggle controls and adding teams — then flips to dark mode and rotates east to Europe for the international half. No drag-rotate happens in the light phase (the original opening "tour" rotated into the empty Pacific, which read as drift).

| Time       | Beat                                                 | App state             | Driver                                                                                       |
| ---------- | ---------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| 0.0–1.5s   | Hero pose holds — globe on the US                    | Light, Longest 5      | Initial 1.5s sleep — viewers register the frame                                              |
| 1.5–3.0s   | Hover the first team row (chip + arc highlight)      | Light, Longest 5      | `#team-list .team-row:first-child` hover                                                     |
| 3.0–4.5s   | Click **"All"** — arcs fill across the US            | Light, All            | `[data-preset="all"]` click                                                                  |
| 4.5–6.0s   | Hover a different team row in the dense field        | Light, All            | `#team-list .team-row:nth-child(6)` hover                                                    |
| 6.0–7.0s   | **Click `#theme-toggle`** — light → dark repaint     | Dark, All             | `#theme-toggle` click at footage t=6.5s (visible flip lands on the same frame → composition t≈9.5s)  |
| 7.0–8.5s   | Click **"International"** — overseas arcs only       | Dark, International   | `[data-preset="international"]` click                                                        |
| 8.5–11.0s  | Animate east — globe sweeps toward Europe            | Dark, International   | `window.__animateToView({theta: 1.066, phi: 0.799, r: 2.32, duration: 1500})` (1.5s ease)    |
| 11.0–13.0s | Hover team row — highlight an international leg      | Dark, International   | `#team-list .team-row:first-child` hover                                                     |
| 13.0–15.5s | Settle, travelers run, final hold                    | Dark, International   | Fill remaining time to 15 500 ms                                                             |

## Per-beat creative direction

Each beat below has a row in the table above (mechanical) plus a creative stub here (intent). Fill in as the story crystallizes.

### Beat 1 — Hero pose (0.0–1.5s)

- **Concept:** <!-- What visual WORLD? What should the viewer FEEL on first frame? -->
- **Mood:** <!-- e.g. "calm, anchored, technical" -->
- **SFX cue:** <!-- N/A or note any synced beat -->

### Beat 2 — First team hover (1.5–3.0s)

- **Concept:** <!-- Why this beat? What's the "click" of recognition we're after? -->
- **Mood:**
- **SFX cue:**

### Beat 3 — "All" preset (3.0–4.5s)

- **Concept:** <!-- Densest visual change short of the theme flip. Why does it earn its place? -->
- **Mood:**
- **SFX cue:**

### Beat 4 — Different team hover (4.5–6.0s)

- **Concept:**
- **Mood:**
- **SFX cue:**

### Beat 5 — Theme flip (6.0–7.0s, click at 6.5s → visible flip on the same frame → composition t≈9.5s)

- **Concept:** <!-- The HIT. The "magic" moment. Why does it matter? -->
- **Mood:**
- **SFX cue:** <!-- The structural soundtrack beat lands here. -->

### Beat 6 — "International" preset (7.0–8.5s)

- **Concept:**
- **Mood:**
- **SFX cue:**

### Beat 7 — Animate east to Europe (8.5–11.0s)

- **Concept:** <!-- Camera move motivated by the international arcs needing to land somewhere -->
- **Mood:**
- **SFX cue:**
- **Driver note:** Uses `window.__animateToView` (defined in `src/main.js`) for a precise, repeatable landing on `?view=1.066,0.799,2.32`. Replaces an earlier hand-tuned mouse drag.

### Beat 8 — International team hover (11.0–13.0s)

- **Concept:**
- **Mood:**
- **SFX cue:**

### Beat 9 — Settle and hold (13.0–15.5s)

- **Concept:** <!-- The breath before the outro card. -->
- **Mood:**
- **SFX cue:**

## Why these beats

- **Light → dark theme switch** is the single most striking demo moment in the app. The recorder clicks `#theme-toggle` at footage t=6.5s; the visible flip lands on essentially the same frame because the globe (which fills most of the screen) repaints synchronously via a Three.js material swap. The body's 250ms `background-color` CSS transition runs but is barely perceptible underneath the globe. So — once the 3s intro card is in front — the flip falls at composition t≈9.5s, which is the structural beat the soundtrack is written to (see [music-prompts/](./music-prompts/)).
- **Light half stays on the US.** The original "drag-rotate to start" landed on the empty Pacific. With the camera held still, the eye stays on the toggle controls and the arc set growing from Longest 5 → All.
- **"All" is the team-add beat.** Going Longest 5 → All adds 27 arcs at once — the densest visual change in the app short of the theme flip.
- **The dark-half rotation is purposeful.** Selecting International first, then animating east, motivates the camera move: the arcs that just appeared land in Europe as the globe gets there.
- **Sidebar hover instead of stadium hover** because a stadium hover requires knowing the screen coordinates of a specific 3D marker at runtime; a sidebar row is at a deterministic CSS position. Easier to script, more reliable across re-records.

## Composition timing

The captured footage is 15.5s end to end — the CDP screencast starts right after the loader is dismissed, so there's no pre-roll. The composition reads it with `data-media-start="0"`. Final composition timing:

| Range          | Clip                            |
| -------------- | ------------------------------- |
| 0.0–3.0s       | Intro card                      |
| 3.0–18.4s      | Footage (with 0.4s crossfades)  |
| 18.0–21.0s     | Outro card (with final fade)    |
| 0.0–20.6s      | Soundtrack (mp3, single track)  |

Total composition runtime: **21.0s**. Soundtrack runs 20.565s — the last ~0.4s is silent over the outro tail.

The in-footage theme switch (capture click at t=6.5s, visible flip on the same frame) lands at composition t≈9.5s — that's the structural beat the soundtrack hits.

## Adjusting the beats

To change a beat without rewriting the script:

1. Open `scripts/record-walkthrough.mjs`.
2. Find the beat sequence (~midway through `main()`, anchored by `waitUntil(footageSec)` calls).
3. Each beat is a `waitUntil(t)` + the action(s) preceding it. Adjust the wait targets and the Playwright actions as needed; keep the total close to 15 500 ms — the composition's footage clip is `data-duration="15.4"`, so the script gives ~100ms of buffer.
4. Re-run `npm run record:walkthrough`.
5. Update this doc to reflect the new timings.
