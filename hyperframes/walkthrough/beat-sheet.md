# Walkthrough Capture Beat Sheet

The 15 seconds of live app footage at the heart of `media/walkthrough.mp4` is produced by driving the running Vite dev server through this scripted beat sheet. The timings below match the `await sleep(N)` calls inside `scripts/record-walkthrough.mjs` — that script is the executable source of truth.

Recapture at any time: `npm run record:walkthrough` (writes to `hyperframes/walkthrough/footage.mp4`).

## Beats

The footage stays on the US for the first half — exercising the toggle controls and adding teams — then flips to dark mode and rotates east to Europe for the international half. No drag-rotate happens in the light phase (the original opening "tour" rotated into the empty Pacific, which read as drift).

| Time       | Beat                                                 | App state             | Driver                                                                         |
| ---------- | ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| 0.0–1.5s   | Hero pose holds — globe on the US                    | Light, Longest 5      | Initial 1.5s sleep — viewers register the frame                                |
| 1.5–3.0s   | Hover the first team row (chip + arc highlight)      | Light, Longest 5      | `#team-list .team-row:first-child` hover                                       |
| 3.0–4.5s   | Click **"All"** — arcs fill across the US            | Light, All            | `[data-preset="all"]` click                                                    |
| 4.5–6.0s   | Hover a different team row in the dense field        | Light, All            | `#team-list .team-row:nth-child(6)` hover                                      |
| 6.0–7.0s   | **Click `#theme-toggle`** — light → dark repaint     | Dark, All             | `#theme-toggle` click at footage t≈6.5s                                        |
| 7.0–8.5s   | Click **"International"** — overseas arcs only       | Dark, International   | `[data-preset="international"]` click                                          |
| 8.5–11.0s  | Drag-rotate east — globe sweeps toward Europe        | Dark, International   | `mouse.move(1100, 540)` → drag to (380, 580), steps=80                         |
| 11.0–13.0s | Hover team row — highlight an international leg      | Dark, International   | `#team-list .team-row:first-child` hover                                       |
| 13.0–15.5s | Settle, travelers run, final hold                    | Dark, International   | Fill remaining time to 15 500 ms                                               |

## Why these beats

- **Light → dark theme switch** is the single most striking demo moment in the app. It lands at footage t≈6.5s so that — once the 3s intro card is in front — it falls at composition t≈9.5s, which is the structural beat the soundtrack is written to (see [music-prompts/](./music-prompts/)).
- **Light half stays on the US.** The original "drag-rotate to start" landed on the empty Pacific. With the camera held still, the eye stays on the toggle controls and the arc set growing from Longest 5 → All.
- **"All" is the team-add beat.** Going Longest 5 → All adds 27 arcs at once — the densest visual change in the app short of the theme flip.
- **The dark-half rotation is purposeful.** Selecting International first, then rotating east, motivates the camera move: the arcs that just appeared land in Europe as the globe gets there.
- **Sidebar hover instead of stadium hover** because a stadium hover requires knowing the screen coordinates of a specific 3D marker at runtime; a sidebar row is at a deterministic CSS position. Easier to script, more reliable across re-records.

## Composition timing

The captured footage is 15.5s end to end — the CDP screencast starts right after the loader is dismissed, so there's no pre-roll. The composition reads it with `data-media-start="0"`. Final composition timing:

| Range          | Clip                            |
| -------------- | ------------------------------- |
| 0.0–3.0s       | Intro card                      |
| 3.0–18.4s      | Footage (with 0.4s crossfades)  |
| 18.0–21.0s     | Outro card (with final fade)    |

Total composition runtime: **21.0s**.

The in-footage theme switch (capture beat ≈6.5s) lands at composition t≈9.5s — that's the structural beat the soundtrack should hit (see [music-prompts/](./music-prompts/)).

## Adjusting the beats

To change a beat without rewriting the script:

1. Open `scripts/record-walkthrough.mjs`.
2. Find the comment block titled `Beat sheet — 15 seconds` (~midway through `main()`).
3. Each beat is a `sleep(ms)` + the action(s) preceding it. Adjust the sleep durations and the mouse coordinates as needed; keep the total close to `BEAT_SHEET_MS` (15 500 ms) — the composition's footage clip is `data-duration="15.4"`, so the script gives ~100ms of buffer.
4. Re-run `npm run record:walkthrough`.
5. Update this doc to reflect the new timings.
