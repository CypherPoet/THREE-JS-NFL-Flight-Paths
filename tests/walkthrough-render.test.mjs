// Render-output invariants for media/walkthrough.mp4.
//
// Asserts that the committed walkthrough render matches the contract
// documented in hyperframes/walkthrough/RENDER_SETTINGS.md and STORYBOARD.md:
//   · ~21s total duration (data-duration="21" on the composition root)
//   · file size in the 10–60 MB band (catches catastrophic encoder failures)
//   · video stream is 3840×2160 @ 60fps (4K UHD, --resolution 4k --fps 60)
//   · audio stream is AAC stereo with duration ≥ 20.5s (soundtrack-01.mp3
//     is 20.565s; the composition runs 21s total with a silent outro tail)
//   · theme-flip transition crosses (light → dark midpoint) inside the
//     composition [9.40, 9.60] window — the soundtrack's HIT lands at 9.5s
//
// Preconditions (ffprobe + ffmpeg on PATH, media/walkthrough.mp4 present)
// drive Vitest `describe.skipIf` so missing-tool environments report
// SKIPPED rather than vacuously PASSED.
//
// Theme-flip luma thresholds are calibrated from the known-good render:
// the light plateau sits at ~109, the dark plateau at ~54, with a near-
// instantaneous step transition (the Three.js material swap on the globe
// dominates the body's 250ms CSS transition). See PR #22 commit `3d202c0`
// for the empirical measurement.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MP4 = join(ROOT, "media", "walkthrough.mp4");

const ffprobeOk = spawnSync("which", ["ffprobe"]).status === 0;
const ffmpegOk = spawnSync("which", ["ffmpeg"]).status === 0;
const mp4Exists = existsSync(MP4);
const toolsReady = ffprobeOk && ffmpegOk && mp4Exists;

function ffprobeJson(args) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", ...args, MP4],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

// Sample the average luma of a 16×16 center-cropped patch at `t`. ffmpeg
// emits raw gray bytes; average them in JS. 16×16 over a 320×320 crop is
// robust against UI-chip placement (a 1×1 sample can land on a tooltip,
// a team chip, or a high-contrast edge and lie about the globe's luma).
function sampleLumaAt(t) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-ss",
      String(t),
      "-i",
      MP4,
      "-frames:v",
      "1",
      "-vf",
      "crop=320:320:(iw-320)/2:(ih-320)/2,scale=16:16,format=gray",
      "-f",
      "rawvideo",
      "-",
    ],
    { encoding: "buffer" },
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg sample failed at t=${t}: ${result.stderr}`);
  }
  const bytes = result.stdout;
  if (bytes.length !== 256) {
    throw new Error(
      `expected 256 luma samples at t=${t}, got ${bytes.length}`,
    );
  }
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) sum += bytes[i];
  return sum / bytes.length;
}

describe.skipIf(!toolsReady)("walkthrough.mp4 render contract", () => {
  it("file size is in the 10–60 MB band", () => {
    const bytes = statSync(MP4).size;
    expect(bytes).toBeGreaterThan(10 * 1024 * 1024);
    expect(bytes).toBeLessThan(60 * 1024 * 1024);
  });

  it("total duration is 21.0s (±0.1s)", () => {
    const meta = ffprobeJson(["-show_entries", "format=duration"]);
    const duration = Number.parseFloat(meta.format.duration);
    expect(duration).toBeGreaterThan(20.9);
    expect(duration).toBeLessThan(21.1);
  });

  it("video stream is 3840×2160 @ 60fps", () => {
    const meta = ffprobeJson([
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,r_frame_rate",
    ]);
    const v = meta.streams[0];
    expect(v.width).toBe(3840);
    expect(v.height).toBe(2160);
    // r_frame_rate is "num/den" (e.g. "60/1").
    const [num, den] = v.r_frame_rate.split("/").map(Number);
    expect(num / den).toBe(60);
  });

  it("audio stream is AAC stereo with duration ≥ 20.5s", () => {
    const meta = ffprobeJson([
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=codec_name,channels,duration",
    ]);
    expect(meta.streams).toHaveLength(1);
    const a = meta.streams[0];
    expect(a.codec_name).toBe("aac");
    expect(a.channels).toBe(2);
    expect(Number.parseFloat(a.duration)).toBeGreaterThanOrEqual(20.5);
  });

  it("theme-flip transition crosses inside composition [9.40, 9.60]", () => {
    // Light/dark anchors — generous margins from the calibrated plateaus
    // (light ≈ 109, dark ≈ 54). If these fail, something has structurally
    // shifted (palette, beat order) rather than just drifted by a frame.
    const lightLuma = sampleLumaAt(9.3);
    const darkLuma = sampleLumaAt(9.7);
    expect(lightLuma).toBeGreaterThanOrEqual(90);
    expect(darkLuma).toBeLessThanOrEqual(80);

    // Sweep [9.30, 9.70] at 0.05s; find the first frame whose luma falls
    // below the midpoint between the two plateaus. That's where the visible
    // flip lands. The soundtrack HIT is at 9.5s, so ±0.10s tolerance.
    const cutoff = (lightLuma + darkLuma) / 2;
    let crossing = null;
    for (let t = 9.3; t <= 9.7 + 1e-9; t += 0.05) {
      const luma = sampleLumaAt(Number(t.toFixed(2)));
      if (luma < cutoff) {
        crossing = Number(t.toFixed(2));
        break;
      }
    }
    expect(crossing, "no light→dark transition found in [9.30, 9.70]")
      .not.toBeNull();
    expect(crossing).toBeGreaterThanOrEqual(9.4);
    expect(crossing).toBeLessThanOrEqual(9.6);
  });
});
