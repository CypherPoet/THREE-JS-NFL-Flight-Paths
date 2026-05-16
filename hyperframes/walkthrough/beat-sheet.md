# Walkthrough Capture Beat Sheet

The 15 seconds of live app footage at the heart of `media/walkthrough.mp4` is produced by driving the running Vite dev server through this scripted beat sheet. The timings below match the `await sleep(N)` calls inside `scripts/record-walkthrough.mjs` — that script is the executable source of truth.

Recapture at any time: `npm run record:walkthrough` (writes to `hyperframes/walkthrough/footage.mp4`).

## Beats

| Time      | Beat                                              | App state             | Driver                                                                         |
| --------- | ------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| 0.0–2.0s  | Globe settles into hero pose                      | Light, "Longest 5"    | Initial 2-second sleep — viewers register the frame                            |
| 2.0–4.5s  | Drag-rotate sweep across the continental US       | Light                 | `mouse.move(700, 540)` → drag to (960, 490), steps=60                          |
| 4.5–6.0s  | Hover the first team row (highlights its arcs)    | Light                 | `#team-list .team-row:first-child` hover                                       |
| 6.0–7.5s  | Click the "International" preset (arc set swaps)  | Light, international  | `[data-preset="international"]` click                                          |
| 7.5–8.0s  | **Click `#theme-toggle`** — light → dark repaint  | Dark                  | `#theme-toggle` click                                                          |
| 8.0–11.0s | Drag pan east, show Atlantic crossings            | Dark, international   | `mouse.move(960, 540)` → drag to (640, 620), steps=60                          |
| 11.0–15s  | Re-hover first team row; travelers run; settle    | Dark                  | second hover + final fill-time sleep                                           |

## Why these beats

- **Light → dark theme switch** is the single most striking demo moment in the app. It lands at the midpoint of the 15s footage and reads as the structural beat the soundtrack should hit (see [music-prompts/](./music-prompts/)).
- **Two drag-rotates** (one per theme) demonstrate interactivity without monopolizing the runtime. The second drag also shifts focus from the US to the Atlantic, motivating the "International" preset change that happened just before.
- **The "International" preset** is chosen over "All" because it produces the most visually distinct arc set — overseas crossings — and it's the cleanest cut from the default "Longest 5" view.
- **Sidebar hover instead of stadium hover** because a stadium hover requires knowing the screen coordinates of a specific 3D marker at runtime; a sidebar row is at a deterministic CSS position. Easier to script, more reliable across re-records.

## Composition timing

The captured footage is 15.5s end to end — the CDP screencast starts right after the loader is dismissed, so there's no pre-roll. The composition reads it with `data-media-start="0"`. Final composition timing:

| Range          | Clip                            |
| -------------- | ------------------------------- |
| 0.0–2.0s       | Intro card                      |
| 2.0–17.4s      | Footage (with 0.4s crossfades)  |
| 17.0–19.0s     | Outro card (with final fade)    |

Total composition runtime: **19.0s**.

The in-footage theme switch (capture beat 7.5s) lands at composition t≈9.5s — that's the structural beat the soundtrack should hit (see [music-prompts/](./music-prompts/)).

## Adjusting the beats

To change a beat without rewriting the script:

1. Open `scripts/record-walkthrough.mjs`.
2. Find the comment block titled `Beat sheet — 15 seconds` (~midway through `main()`).
3. Each beat is a `sleep(ms)` + the action(s) preceding it. Adjust the sleep durations and the mouse coordinates as needed; keep the total close to `BEAT_SHEET_MS` (15 500 ms) — the composition's footage clip is `data-duration="15.4"`, so the script gives ~100ms of buffer.
4. Re-run `npm run record:walkthrough`.
5. Update this doc to reflect the new timings.
