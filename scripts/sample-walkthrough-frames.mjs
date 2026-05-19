#!/usr/bin/env node
// Dumps hero frames from media/walkthrough.mp4 to the OS temp directory for
// human inspection after a re-render. Run via `npm run media:walkthrough:frames`
// (also chained inside `npm run media:walkthrough`).
//
// Timestamps map to STORYBOARD.md beats — one frame per beat, plus dense
// samples around the t=9.5s theme flip so a misaligned soundtrack HIT is
// obvious by eye. The Vitest suite at tests/walkthrough-render.test.mjs is
// the authoritative regression check; these PNG dumps are for the human in
// the loop.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MP4 = join(ROOT, "media", "walkthrough.mp4");

const HERO_TIMESTAMPS = [
  1.5, // intro card mid-hold
  4.5, // beat 3: "All" preset filled the US
  9.3, // pre-flip (light)
  9.5, // theme-flip HIT
  9.7, // post-flip (dark)
  11.0, // beat 7 settled on Europe view
  14.0, // beat 8: international team hover
  19.5, // outro card mid-hold
];

if (!existsSync(MP4)) {
  console.error(
    `media/walkthrough.mp4 not found — run \`npm run media:walkthrough:render\` first.`,
  );
  process.exit(1);
}

if (spawnSync("which", ["ffmpeg"]).status !== 0) {
  console.error("ffmpeg not on PATH — install with: brew install ffmpeg");
  process.exit(1);
}

const outDir = tmpdir();
const written = [];

for (const t of HERO_TIMESTAMPS) {
  const outPath = join(outDir, `walkthrough-${t.toFixed(2)}.png`);
  const result = spawnSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(t),
    "-i",
    MP4,
    "-frames:v",
    "1",
    outPath,
  ]);
  if (result.status !== 0) {
    console.error(`ffmpeg failed at t=${t}: ${result.stderr?.toString() ?? ""}`);
    process.exit(1);
  }
  written.push(outPath);
}

console.log(`Wrote ${written.length} hero frames:`);
for (const p of written) console.log(`  ${p}`);
