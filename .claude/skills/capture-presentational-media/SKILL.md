---
name: capture-presentational-media
description: Regenerate every screenshot + walkthrough video under media/ for a presentational frontend project (Three.js, WebGL, or any interactive web scene), and keep derived assets (OG image, manifest theme colors) in sync. Use when the scene changes, the HUD restyles, theme variants are added, the brand palette shifts, or anything visual gets refreshed. Triggers on phrases like "refresh the screenshots", "regenerate media", "update the README images", "capture new walkthrough", "social card is stale", or "theme color drifted".
allowed-tools: Bash(playwright-cli:*), Read, Bash(npm:*), Bash(python3:*), Bash(lsof:*), Bash(kill:*), Bash(ls:*), Bash(rm:*), Bash(trash:*), Bash(node:*), Bash(ffmpeg:*), Bash(git:*), Bash(magick:*)
---

# capture-presentational-media

Reusable automation for the screenshots and walkthrough recording committed to `media/`. The skill is project-agnostic — it documents the playwright-cli + Playwright Node API patterns that work for any presentational frontend, plus the gotchas that bite during capture.

## When to use

- The 3D scene, animation, or visual effect was edited
- The HUD, chrome, or theme palette restyled
- A new state, mode, or variant was added that should appear in README
- Typography, layout, or copy in headings changed (screenshots go stale)
- Before tagging a release or sharing a live URL

## Before you start

Gather four things from the project — do not assume.

1. **Dev server URL.** Check `package.json` scripts and run the project's dev command (`npm run dev`, `pnpm dev`, `python3 -m http.server`, etc.). Vite defaults to `http://localhost:5173/`; many projects add a base path (e.g. `/<repo-name>/` for gh-pages). Verify with `lsof -iTCP:<port> -sTCP:LISTEN -P`.
2. **Current `media/` contents.** `ls media/` tells you the filenames to replace. Match the existing naming (don't rename them — README links will break). If `README.md` references images, `grep -n "media/" README.md` confirms which are load-bearing.
3. **What changed visually since the last capture.** `git log --oneline -- media/` shows when media was last touched; `git log --oneline <last-media-commit>..HEAD` shows what's been visually relevant since. This determines whether you need all shots refreshed or just a subset.
4. **How to drive the scene from the outside.** Most projects don't expose `window.__app = { camera, controls }`. You'll usually need to drive the scene via real pointer events on the canvas (rotation, zoom) and DOM clicks on the UI (mode toggles, selections). `grep -n "window\." src/` confirms what's exported.

Then verify `playwright-cli --version` works and Chrome is available.

## Capture loop pattern

For each shot:

1. **Set up** — `playwright-cli close-all 2>/dev/null; playwright-cli open --browser=chrome && playwright-cli resize 1920 1200`
2. **Navigate** — `playwright-cli goto "<url>?cb=$(date +%s)"` (cache-buster avoids stale-asset confusion across iterations)
3. **Wait for the scene to settle** — `sleep 3-5`, longer if assets load over the network. If unsure, `playwright-cli eval` a state check (e.g. `() => document.querySelectorAll('.thing').length`) before screenshotting.
4. **Manipulate the scene** — drag the canvas, click UI elements, toggle themes (see idioms below)
5. **Park the mouse off-canvas** — `playwright-cli mousemove 5 5`. Critical: leaving the cursor over the canvas can leave a hover tooltip visible in the screenshot.
6. **Wait for damping/transition to finish** — `sleep 1-2`. OrbitControls with `dampingFactor: 0.08` needs ~500ms after the last pointer event.
7. **Screenshot** — `playwright-cli screenshot --filename=<absolute-path-inside-project-root>/media/<n>.png`. Paths outside the project root are rejected by playwright-cli's sandbox.
8. **Verify** — `Read` the PNG. Confirm the framing, theme, selection, and tooltips/overlays match expectation. Iterate.

After the last shot: `playwright-cli close` and stop the dev server.

## playwright-cli idioms

| Need | Command |
|---|---|
| Drag the canvas to rotate / pan | `mousemove X1 Y` → `mousedown` → `mousemove X2 Y` (multiple intermediate stops for smoothness) → `mouseup` |
| Zoom (OrbitControls dolly) | `mousewheel 0 dy` (positive `dy` = zoom out in default OrbitControls) |
| Click a button by DOM | `playwright-cli eval "() => document.getElementById('foo').click()"` |
| Click via accessibility ref | `playwright-cli snapshot --raw \| grep "<text>"` to find the ref, then `playwright-cli click eNN` — **refs regenerate every snapshot**, never paste literal refs from a script |
| Read app state | `playwright-cli eval "() => ({ theme: document.documentElement.dataset.theme })"` |
| Toggle theme | usually `eval "() => document.getElementById('theme-toggle').click()"` |
| Press a key | `playwright-cli press Escape` |

Sandbox note: `playwright-cli screenshot --filename=` only accepts paths inside the project root or `.playwright-cli/`. Write final shots straight into `media/`; throw test shots into `.playwright-cli/` (git-ignored).

## Calibrating canvas drag for rotation

OrbitControls' rotation depends on `rotateSpeed`, canvas height, and the drag delta. There's no universal pixel count — calibrate per project:

1. Take a baseline screenshot at the default view.
2. Drag a small distance (e.g. 200 px). Screenshot. Read. Estimate how many drag-units per visible-rotation.
3. Scale up to hit the desired framing.
4. If a drag overshoots, **reload the page** (`goto` with a new cache-buster) rather than trying to drag back — damping makes opposite drags imprecise.

Direction in OrbitControls: dragging right rotates the camera *left* around the target, which makes the scene appear to rotate right (things on the left come to center). Dragging left does the opposite. Vertical drag tilts polar angle.

## Gotchas

- **Stale tooltip in shot.** A hover tooltip lingers if the cursor is over the canvas at screenshot time. Always `mousemove 5 5` after the last drag.
- **Pointer-lock console error.** Expected in headless Chrome; safe to ignore.
- **Background dev server "completed"** in the Bash tool's notification doesn't mean it exited — verify with `lsof -iTCP:<port> -sTCP:LISTEN -P` before assuming it's down.
- **Module-scoped Three.js state.** If `camera`, `controls`, `scene` are module-locals and not put on `window`, you can't read or set them from `eval`. Drive the scene through the same pointer/click events the user would.
- **Damping settle.** After releasing a drag, the view keeps rotating briefly. Always sleep 1-2s before screenshotting.
- **Pre-paint theme scripts.** Some projects set `data-theme` from an inline script reading `localStorage`. If you need a specific theme, clear `localStorage` or set it explicitly before `goto`, then reload.
- **First-load cost.** A cold scene with HDR/glb assets may need 5-8s to look right. Bump the post-`goto` sleep if early shots look unfinished.

## Walkthrough video (optional, Playwright Node API)

Skip if the project doesn't ship a video. When it does, use the Playwright Node API instead of `playwright-cli video-start` — the CLI's video is locked at 800×450 with a gray right-side pad. The Node API lets you set `recordVideo.size` and write smooth camera tweens.

### One-time setup

```bash
npx playwright --version    # installs into ~/.npm/_npx/<hash>/node_modules/
PW_HOME=$(dirname $(dirname $(find ~/.npm/_npx -name playwright -type d -maxdepth 4 | head -1)))
```

Place the capture script inside `$PW_HOME` so `import 'playwright'` resolves naturally.

### Capture script shape

```js
import { chromium } from 'playwright';
import { mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/walkthrough-out';

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1200 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

// If the project exports controls on window, tween the camera directly:
async function tween({ fromPos, toPos, fromTarget, toTarget, duration }) {
  await page.evaluate(({ fromPos, toPos, fromTarget, toTarget, duration }) => {
    return new Promise((res) => {
      const c = window.__app.camera;          // adjust to project's export
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
        c.position.set(
          fromPos[0] + (toPos[0] - fromPos[0]) * e,
          fromPos[1] + (toPos[1] - fromPos[1]) * e,
          fromPos[2] + (toPos[2] - fromPos[2]) * e,
        );
        c.lookAt(
          fromTarget[0] + (toTarget[0] - fromTarget[0]) * e,
          fromTarget[1] + (toTarget[1] - fromTarget[1]) * e,
          fromTarget[2] + (toTarget[2] - fromTarget[2]) * e,
        );
        if (t < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }, { fromPos, toPos, fromTarget, toTarget, duration });
}

// If no window export, use page.mouse.{move,down,up} on the canvas instead.

await page.goto(`${URL}?cb=walkthrough`);
await page.waitForTimeout(2000);

// — project-specific choreography here —

// At the instant the visible action starts, log TRIM_MS:
console.log(`TRIM_MS=${Date.now() - startMs}`);

const videoPath = await page.video().path();
await context.close();
await browser.close();
await rename(videoPath, resolve(OUT, 'walkthrough.webm'));
```

### Trim + interpolate + encode

```bash
TRIM_MS=$(cd "$PW_HOME" && node capture-walkthrough.mjs | grep TRIM_MS | cut -d= -f2)
TRIM_SECONDS=$(echo "scale=3; $TRIM_MS/1000" | bc)

ffmpeg -ss "$TRIM_SECONDS" -i /tmp/walkthrough-out/walkthrough.webm \
  -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir" \
  -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -movflags +faststart -an \
  -y <project-root>/media/walkthrough.mp4

trash /tmp/walkthrough-out
```

Why this shape:

- **Resolution.** `playwright-cli video-start` records at a fixed 800×450 with right-edge gray padding. The Node API's `recordVideo.size` is the only knob that yields 1280×800.
- **Easing.** Cubic ease-in-out via the `t < 0.5 ? 4t³ : 1 - (-2t+2)³/2` shape avoids the linear-tween "robotic" feel.
- **Trim.** Recording starts the moment `context.newPage()` runs, so the first ~1-2s captures layout shift, font swap, and asset load. Log `TRIM_MS` at the visible-action moment and pass to ffmpeg's `-ss` to start the final clip there.
- **25→60 fps.** Playwright caps recordings at 25 fps. `minterpolate` with `mci`/`bidir` synthesizes motion-compensated intermediate frames — buttery pans, no visible artifacts at modal transitions.

## Cleanup

```bash
trash <project-root>/media/.tmp-*.png 2>/dev/null   # any debug shots left in media/
trash <project-root>/.playwright-cli/test-*.png 2>/dev/null   # scratch test shots
```

`.playwright-cli/` is git-ignored — leave it alone otherwise.

## Sync derived assets

Some presentational artifacts are *derived* from `media/` or `styles.css` and silently drift unless re-derived and re-verified at the end of the capture loop. Always run both, in this order:

```bash
npm run media:derive   # regenerates public/og-image.png from media/04-dark-hero.png (idempotent)
npm run media:check    # vitest run tests/presentational-sync.test.mjs — same assertions, Vitest output
```

`media:check` runs under Vitest (one source of truth with the rest of the test suite). `npm run test:run` executes every test file; CI should prefer the full run.

What these cover:

- **OG image.** `public/og-image.png` is a deterministic 1200×630 crop of `media/04-dark-hero.png` (`-strip -resize 1200x -gravity north -crop 1200x630+0+0`). If the dark-hero capture changed, derive rewrites og-image to match; otherwise it's a no-op. The exact transform lives in `scripts/derive-og-image.mjs` and is mirrored read-only inside `tests/presentational-sync.test.mjs`.
- **Chrome colors.** `--bg` in `styles.css` is the source of truth (one value per theme). It must equal: `index.html` `<meta name="theme-color">` for the matching `prefers-color-scheme`, and (light only) `site.webmanifest.theme_color` + `background_color`. Vitest renders a precise diff for every mismatch.

If `media:check` fails:

- **Color drift** → the palette in `styles.css` moved; update `index.html` theme-color meta and `public/site.webmanifest` by hand to match the diff, then re-run.
- **og-image drift** → run `npm run media:derive` to refresh. If the transform itself needs to change (different framing, different crop), edit `scripts/derive-og-image.mjs` *and* the magick args in `tests/presentational-sync.test.mjs` together so they stay in lockstep.

Don't suppress the check by relaxing its assertions; the drift is the signal.
