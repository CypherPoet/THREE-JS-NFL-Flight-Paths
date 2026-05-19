# Render Settings — Walkthrough Composition

The final deliverable, `media/walkthrough.mp4`, is built in two stages:

| Stage | Command | Produces | Reads |
| ----- | ------- | -------- | ----- |
| **Capture** | `npm run media:walkthrough:capture` | `hyperframes/walkthrough/footage.mp4` (raw app footage) | the live Vite dev server + [storyboard](./STORYBOARD.md) |
| **Render** | `npx hyperframes render …` | `media/walkthrough.mp4` (final 4K 60fps) | the HyperFrames composition + `footage.mp4` |

Capture is project-specific — it drives the live app through a scripted beat sheet to record fresh footage of the actual UI. Render is the standard HyperFrames build step — it composites the intro card + footage + outro card into the final mp4 using the timeline in `index.html`.

## Which command should I run?

The honest answer for most edits is **just render**. Capture is slow (~30s for a 15s walkthrough, plus a headful Chromium window) and only needs to run when the footage itself is stale.

| If you changed…                                       | Re-capture? | Command |
| ----------------------------------------------------- | ----------- | ------- |
| Intro or outro card (HTML, CSS, GSAP timing)          | no          | `npm run media:walkthrough` |
| Composition timing (`data-duration`, crossfades)      | no          | `npm run media:walkthrough` |
| Music wiring or soundtrack file                       | no          | `npm run media:walkthrough` |
| Render flags (`--fps`, `--quality`, `--resolution`)   | no          | `npm run media:walkthrough` |
| Beat sheet (`scripts/record-walkthrough.mjs`)         | **yes**     | `npm run media:walkthrough:full` |
| App UI in `src/` (colors, layout, theme tokens, …)    | **yes**     | `npm run media:walkthrough:full` |
| First time on a fresh checkout, no `footage.mp4` yet  | **yes**     | `npm run media:walkthrough:full` |

When in doubt: `npm run media:walkthrough` is safe — if `footage.mp4` no longer matches the app, you'll see it in the rendered video and know to re-capture with `:full`.

## Render — `npm run media:walkthrough`

The repeatable rebuild is `npm run media:walkthrough` (from the repo root). It renders, runs the verify suite, and dumps hero frames to `os.tmpdir()` for inspection. See `package.json` for the underlying chain — the canonical render command is:

```bash
# what media:walkthrough:render runs under the hood
cd hyperframes/walkthrough && npx hyperframes render \
  --fps 60 \
  --quality high \
  --resolution 4k \
  --output ../../media/walkthrough.mp4
```

Use `npm run media:walkthrough:render` to render-only (no verify, no frame dump), `npm run media:walkthrough:verify` to re-check the committed mp4, or `npm run media:walkthrough:full` to re-capture footage first (macOS only). The verify suite lives at [`tests/walkthrough-render.test.mjs`](../../tests/walkthrough-render.test.mjs) and is included in `npm run test:run` so CI catches drift on the committed mp4 every PR.

Output specs:

| Dimension | Value |
| --------- | ----- |
| Resolution | 3840×2160 (4K UHD) |
| Frame rate | 60fps |
| Codec | H.264 / AVC1 High Profile, yuv420p |
| Bitrate | ~15 Mbps |
| Audio | AAC stereo, derived from `assets/audio/soundtrack-01.mp3` (see [STORYBOARD.md](./STORYBOARD.md) "Underscore direction") |
| Duration | 21.0s |
| File size | ~40 MB |

What each flag does:

- `--fps 60` — render the timeline at 60fps. Both the intro/outro cards and the captured footage have real frames at every step (cards from GSAP, footage from the 75fps source).
- `--quality high` — bumps the encoder bitrate target. The dark vignettes and bronze gradients pick up less compression noise.
- `--resolution 4k` — composition is authored at 1920×1080; HyperFrames supersamples via `deviceScaleFactor: 2` and captures at 3840×2160 natively. The cards render at 4K (no upscaling), and the 1080p footage upscales lanczos.

### Resolution-flag specifics

`--resolution` only accepts integer-multiple presets that match the composition's aspect ratio. For 16:9 (1920×1080):

- `landscape` / `1080p` — 1920×1080
- `landscape-4k` / `4k` / `uhd` — 3840×2160

1440p (2560×1440) is not available — it would require a fractional scale, which HyperFrames doesn't support. The next step from 1080p is 4K.

## Capture — `npm run media:walkthrough:capture`

`scripts/record-walkthrough.mjs` drives the live Vite dev server through the [storyboard](./STORYBOARD.md) and captures frames directly off Chromium's compositor via the Chrome DevTools Protocol (`Page.startScreencast`). Playwright's `recordVideo` is not used — it throttles to ~25fps regardless of GPU acceleration.

Capture specs:

| Dimension | Value |
| --------- | ----- |
| Resolution | 1920×1080 |
| Frame rate | ~75fps effective (native compositor rate; GPU-accelerated WebGL via `--use-angle=metal`) |
| Format | JPEG quality 95 frame sequence → H.264 mp4 (libx264, CRF 18, dense GOP) |
| Output | `hyperframes/walkthrough/footage.mp4` |

The screencast starts right after the loader is dismissed and stops at the end of the 15.5s beat sheet, so the source has no pre-roll (`data-media-start="0"` in `index.html`). The encoder uses the captured effective fps, not a fixed value — each beat lands at its captured wallclock time in the resulting mp4.

Caveats worth knowing:

- `Page.screencastFrameAck(sessionId)` is mandatory. Without it, Chromium back-pressures and silently drops frames. The recorder fires acks fire-and-forget so the disk write doesn't gate the next frame.
- `chromium-headless-shell` may cap the screencast below 60fps. The recorder launches headful with `--use-angle=metal` for GPU acceleration, which is what gets us the 70-80fps effective rate. Running headless would be slower.
- JPEG quality 95 is near-visually-lossless. If on-disk frame size becomes a problem during longer captures, drop to 85 or switch to PNG (slower, larger, lossless).
