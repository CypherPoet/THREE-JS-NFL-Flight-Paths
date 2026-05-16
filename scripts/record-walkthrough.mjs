#!/usr/bin/env node
// Records ~15s of the live NFL Flight Paths app via Playwright, then
// transcodes the result to a HyperFrames-friendly H.264 mp4.
//
// Output: hyperframes/walkthrough/footage.mp4

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outDir = resolve(projectRoot, "hyperframes/walkthrough");
const tmpDir = resolve(outDir, ".tmp-record");
const finalPath = resolve(outDir, "footage.mp4");

const PORT = 5173;
const DEV_URL = `http://localhost:${PORT}/THREE-JS-NFL-Flight-Paths/`;
const WIDTH = 1920;
const HEIGHT = 1080;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function probePortFree(port) {
  return new Promise((resolveFn) => {
    const server = net.createServer();
    server.once("error", () => resolveFn(false));
    server.once("listening", () => server.close(() => resolveFn(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function ensureFfmpeg() {
  const which = spawnSync("which", ["ffmpeg"]);
  if (which.status !== 0) {
    console.error("ffmpeg not found on PATH — install with: brew install ffmpeg");
    process.exit(1);
  }
}

async function main() {
  ensureFfmpeg();

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });

  let devServer = null;
  const portFree = await probePortFree(PORT);

  if (portFree) {
    console.log(`Port ${PORT} free — starting npm run dev`);
    devServer = spawn("npm", ["run", "dev"], {
      cwd: projectRoot,
      stdio: ["ignore", "ignore", "inherit"],
    });
    await waitForUrl(DEV_URL, 30000);
  } else {
    console.log(`Port ${PORT} in use — assuming dev server is already serving`);
    await waitForUrl(DEV_URL, 5000);
  }

  console.log("Launching Chromium (headful, GPU-accelerated WebGL)...");
  // Headful + Metal/ANGLE so Three.js renders at proper speed; the headless
  // shell's software WebGL is ~15× slower and stretches the 15s beat sheet
  // into multi-minute footage.
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--window-size=1920,1080",
      "--window-position=0,0",
      "--use-angle=metal",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--no-default-browser-check",
      "--no-first-run",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    recordVideo: { dir: tmpDir, size: { width: WIDTH, height: HEIGHT } },
  });

  await context.addInitScript(() => {
    try {
      localStorage.setItem("nfl-flight-paths-theme", "light");
    } catch {}
  });

  const page = await context.newPage();
  console.log(`Navigating to ${DEV_URL}`);
  await page.goto(DEV_URL, { waitUntil: "load" });

  // Loader fades out + removes itself ~400ms after dismissLoading() fires.
  await page.waitForSelector("#loading", { state: "detached", timeout: 20000 });
  // Make sure at least one team row has rendered before we try to hover one.
  await page.waitForSelector("#team-list .team-row", { timeout: 5000 });

  console.log("Recording 15s beat sheet...");
  const t0 = Date.now();
  // Drag-safe area: left half of the viewport (sidebar is on the right).
  const dragY = 540;

  // 0.0 – 2.0s: initial hold — let viewers register what they're looking at.
  await sleep(2000);

  // 2.0 – 4.5s: drag right + slight up tilt (camera pans across the US).
  await page.mouse.move(700, dragY);
  await page.mouse.down();
  await page.mouse.move(960, dragY - 50, { steps: 60 });
  await page.mouse.up();
  await sleep(900);

  // 4.5 – 6.0s: hover first team row → highlights that team's arcs.
  await page.locator("#team-list .team-row").first().hover().catch(() => {});
  await sleep(1500);

  // 6.0 – 7.5s: switch preset to "International" — new arc set draws.
  await page.locator('[data-preset="international"]').click();
  await sleep(1500);

  // 7.5 – 8.0s: theme toggle (light → dark).
  await page.locator("#theme-toggle").click();
  await sleep(500);

  // 8.0 – 11.0s: drag left + down tilt — camera swings to Atlantic / Europe.
  await page.mouse.move(960, dragY);
  await page.mouse.down();
  await page.mouse.move(640, dragY + 80, { steps: 60 });
  await page.mouse.up();
  await sleep(1500);

  // 11.0 – 15.0s: settle on hero. Hover the first team again to add a touch
  // of life and let arc travelers run.
  await page.locator("#team-list .team-row").first().hover().catch(() => {});
  const elapsed = Date.now() - t0;
  const remaining = Math.max(0, 15000 - elapsed);
  await sleep(remaining);

  console.log("Closing page → flushing video...");
  await page.close();
  await context.close();
  await browser.close();

  const webms = readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
  if (webms.length === 0) {
    console.error(`No .webm produced in ${tmpDir}`);
    process.exit(1);
  }
  const webmPath = resolve(tmpDir, webms[0]);
  console.log(`Captured: ${webmPath}`);

  console.log(`Transcoding to ${finalPath}...`);
  // Dense keyframes (-g 30 -keyint_min 30 with -r 30) — HyperFrames seeks
  // every frame during render and warns about "sparse keyframes" / frame
  // freezing on the default 250-frame GOP that libx264 uses.
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i", webmPath,
      "-vf", `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      "-r", "30",
      "-c:v", "libx264",
      "-crf", "18",
      "-preset", "slow",
      "-pix_fmt", "yuv420p",
      "-g", "30",
      "-keyint_min", "30",
      "-movflags", "+faststart",
      "-an",
      finalPath,
    ],
    { stdio: "inherit" },
  );

  if (ff.status !== 0) {
    console.error("ffmpeg failed");
    process.exit(1);
  }

  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`✓ Done: ${finalPath}`);

  if (devServer) {
    devServer.kill("SIGTERM");
    // give vite a moment to exit cleanly
    await sleep(300);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
