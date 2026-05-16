# Render Settings — Walkthrough Composition

How the walkthrough video gets rendered today, and how to crank up quality when you're ready. Phase 1 shipped at HyperFrames' `standard` defaults; this doc captures both the easy bumps (just render flags) and the bigger lift required for genuinely smooth 60fps footage (a capture-side rewrite).

## (a) Current render

Today's command, run from `hyperframes/walkthrough/`:

```bash
npx hyperframes render --output ../../media/walkthrough.mp4
```

Output specs:

| Dimension     | Value                                  |
| ------------- | -------------------------------------- |
| Resolution    | 1920×1080                              |
| Frame rate    | 30fps                                  |
| Bitrate       | ~4 Mbps (9.4 MB / 19s)                 |
| Codec         | H.264 / AVC1 High Profile, yuv420p     |
| Audio         | none                                   |
| Duration      | 19.0s                                  |

This is what's currently at `media/walkthrough.mp4`.

## (b) Quick wins — render flags only (no recorder changes)

These flags compose freely and don't touch the capture pipeline. Worth trying first.

| Flag                             | What it does                                                    | Cost                          |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| `--fps 60`                       | Render the timeline at 60fps. Cards become twice as smooth.     | File size ≈2×                 |
| `--quality high`                 | Higher bitrate target; less compression noise on vignettes.     | File size up; render time up  |
| `--width 2560 --height 1440`     | 1440p output. Cards render natively; footage upscales lanczos.  | File size up; modest gain     |

**Combined recommended call when bumping quality:**

```bash
npx hyperframes render \
  --fps 60 \
  --quality high \
  --output ../../media/walkthrough.mp4
```

**Important nuance**: with `--fps 60` the intro and outro cards become genuinely smoother (real GSAP frames at twice the rate), but the **middle 15 seconds of footage stays effectively 25fps** because the source mp4 was captured at that rate (Playwright's `recordVideo` cap). The render fps just controls how the timeline samples — it can't manufacture motion the source didn't have. To genuinely improve the footage smoothness, see §(c).

## (c) Capture-side improvement — CDP screencast (chosen path)

When `--fps 60` alone isn't enough — when the 25fps stutter in the middle of the video becomes visible — rewrite the capture layer of `scripts/record-walkthrough.mjs` to drive the Chrome DevTools Protocol directly instead of using Playwright's `recordVideo`.

The dev-server logic, mouse drags, beat sheet, and theme toggle stay identical. Only the *how-frames-get-saved* layer changes.

### Concrete diff

**Remove (~15 lines):**
- The `recordVideo: { dir, size }` option on `context = await browser.newContext({...})`.
- The post-capture `spawnSync("ffmpeg", [..., "-i", webmPath, ...])` webm→mp4 transcode.

**Add (~40–80 lines):**
- A CDP session: `const cdp = await context.newCDPSession(page);`
- Start screencast right after the loader is dismissed and just before the beat sheet:
  ```js
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    everyNthFrame: 1,
  });
  let frameIndex = 0;
  cdp.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const framePath = resolve(
      framesDir,
      `frame_${String(frameIndex++).padStart(6, "0")}.jpg`,
    );
    await writeFile(framePath, Buffer.from(data, "base64"));
    await cdp.send("Page.screencastFrameAck", { sessionId });
  });
  ```
- After the beat sheet, just before `context.close()`:
  ```js
  await cdp.send("Page.stopScreencast");
  ```

**Change the encode step:**

```diff
- ffmpeg -y -i in.webm -vf "scale=1920:1080:flags=lanczos" -r 30 \
-   -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
-   -g 30 -keyint_min 30 -movflags +faststart -an out.mp4
+ ffmpeg -y -framerate 60 -i frames/frame_%06d.jpg \
+   -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
+   -g 60 -keyint_min 60 -movflags +faststart -an out.mp4
```

Output filename and codec settings unchanged.

### Net code change

Roughly +60 / –15 lines. The Playwright API surface area we use grows by 3–4 CDP calls. **No new dependencies** (CDP support is built into Playwright).

### What gets better

- Real 60fps capture — no frame duplication.
- Deterministic frame snapshots, not subject to Chromium's internal screencast frame-rate throttling.
- Aligns the *source* fps with whatever the HyperFrames `--fps` target is, so the middle 15s is genuinely smoother end-to-end.

### What stays the same

- Every beat in the existing beat sheet (`beat-sheet.md`).
- The dev-server reuse logic (auto-start if port 5173 is free, otherwise reuse).
- The file the composition reads (`hyperframes/walkthrough/footage.mp4`).

### Caveats

- `chromium-headless-shell` may still cap CDP screencast below 60fps. The recorder already launches headful with `--use-angle=metal` flags for GPU acceleration, which should give native frame rates. Worth measuring once executed (count files in `frames/` after a 15s capture — expect ≈900 at 60fps).
- JPEG quality 95 is near-visually-lossless. If on-disk frame size becomes an issue during longer captures, drop to JPEG quality 85 or use PNG (slower, larger, lossless).
- `Page.screencastFrameAck(sessionId)` is required — without it, Chromium back-pressures and silently drops frames.

## Order of operations when you execute

1. **First**, just add the (b) flags (`--fps 60 --quality high`) to the existing render command. Re-render. If the result looks good, ship.
2. **Only if** the 25fps stutter in the middle is visibly bothering you, do the (c) CDP screencast rewrite. Re-record, re-render, ship.

## Alternatives considered and rejected

For traceability — these were not chosen, but documented so future-you doesn't re-evaluate from scratch:

- **macOS native window capture** via `ffmpeg -f avfoundation` capturing the browser window at 60fps. Smaller code change but fragile to anything else happening on screen — notifications, accidental window focus changes, mouse cursor overlay. Best when CI/automation doesn't matter; not the right tradeoff here.
- **Three.js-side frame export** — instrument `src/main.js`'s render loop with a `?record=1` mode that writes `canvas.toBlob()` snapshots to disk. Cleanest possible output (no compositor jitter, frame-perfect determinism) but invasive on production app code for a presentational gain.
