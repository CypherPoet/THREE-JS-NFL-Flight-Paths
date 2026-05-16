#!/usr/bin/env node
// Records ~15s of the live NFL Flight Paths app to
// hyperframes/walkthrough/footage.mp4 via CDP Page.startScreencast.
//
// Headful + --use-angle=metal is load-bearing: headless software-WebGL
// renders Three.js ~15× slower and stretches the beat sheet into
// multi-minute footage.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outDir = resolve(projectRoot, "hyperframes/walkthrough");
const tmpDir = resolve(outDir, ".tmp-record");
const framesDir = resolve(tmpDir, "frames");
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

  mkdirSync(outDir, { recursive: true });
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

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

  // Ack is required and fire-and-forget: without it Chromium back-pressures
  // and silently drops frames; awaiting it would serialize the handler.
  console.log("Starting CDP screencast (jpeg q95)...");
  const cdp = await context.newCDPSession(page);
  const framePrefix = `${framesDir}/frame_`;
  let frameIndex = 0;
  const writes = [];
  cdp.on("Page.screencastFrame", ({ data, sessionId }) => {
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    const idx = frameIndex++;
    const framePath = `${framePrefix}${String(idx).padStart(6, "0")}.jpg`;
    writes.push(writeFile(framePath, data, "base64"));
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    everyNthFrame: 1,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
  });

  // Beats are documented in hyperframes/walkthrough/beat-sheet.md.
  console.log("Recording 15.5s beat sheet...");
  const captureStartMs = Date.now();
  // Drag-safe area: left half of the viewport (sidebar is on the right).
  const dragY = 540;

  await sleep(2000);

  await page.mouse.move(700, dragY);
  await page.mouse.down();
  await page.mouse.move(960, dragY - 50, { steps: 60 });
  await page.mouse.up();
  await sleep(900);

  await page.locator("#team-list .team-row").first().hover().catch(() => {});
  await sleep(1500);

  await page.locator('[data-preset="international"]').click();
  await sleep(1500);

  await page.locator("#theme-toggle").click();
  await sleep(500);

  await page.mouse.move(960, dragY);
  await page.mouse.down();
  await page.mouse.move(640, dragY + 80, { steps: 60 });
  await page.mouse.up();
  await sleep(1500);

  await page.locator("#team-list .team-row").first().hover().catch(() => {});
  const elapsed = Date.now() - captureStartMs;
  await sleep(Math.max(0, 15500 - elapsed));

  const captureEndMs = Date.now();
  await cdp.send("Page.stopScreencast");
  await browser.close();

  console.log("Flushing frame writes...");
  await Promise.all(writes);

  const captureSeconds = (captureEndMs - captureStartMs) / 1000;
  const effectiveFps = Math.max(1, Math.round(frameIndex / captureSeconds));
  console.log(
    `Captured ${frameIndex} frames in ${captureSeconds.toFixed(2)}s → ${effectiveFps}fps effective`,
  );

  // Encode at the captured effective fps so wallclock timing is preserved.
  // Dense GOP (1s) because HyperFrames seeks every frame at render time.
  console.log(`Transcoding ${frameIndex} frames → ${finalPath}...`);
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate", String(effectiveFps),
      "-i", resolve(framesDir, "frame_%06d.jpg"),
      "-c:v", "libx264",
      "-crf", "18",
      "-preset", "slow",
      "-pix_fmt", "yuv420p",
      "-g", String(effectiveFps),
      "-keyint_min", String(effectiveFps),
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
  console.log(`✓ Done: ${finalPath} (${effectiveFps}fps, ${captureSeconds.toFixed(2)}s)`);

  if (devServer) {
    devServer.kill("SIGTERM");
    await sleep(300);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
