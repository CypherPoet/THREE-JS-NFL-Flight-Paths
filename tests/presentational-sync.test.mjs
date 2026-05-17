// Cross-file sync invariants for presentational artifacts.
// Replaces the standalone scripts/check-presentational-sync.mjs.
//
// Asserts that:
//   · styles.css --bg (light) === index.html theme-color (light)
//                              === site.webmanifest.theme_color
//                              === site.webmanifest.background_color
//   · styles.css --bg (dark)  === index.html theme-color (dark)
//   · public/og-image.png is 1200×630 and byte-matches a fresh derivation
//     from media/04-dark-hero.png (skipped with a warning if `magick`
//     isn't on PATH so CI without ImageMagick still gets color checks)

import { describe, it, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let css, html, manifest, ogBytes;
let bgLight, bgDark;

beforeAll(async () => {
  css = await readFile(join(ROOT, "styles.css"), "utf8");
  html = await readFile(join(ROOT, "index.html"), "utf8");
  manifest = JSON.parse(await readFile(join(ROOT, "public", "site.webmanifest"), "utf8"));
  try { ogBytes = await readFile(join(ROOT, "public", "og-image.png")); }
  catch { ogBytes = null; }

  // The file declares --bg exactly twice: light first, dark second. If a third
  // theme is ever added, scope this by selector before extracting.
  const matches = [...css.matchAll(/--bg:\s*(#[0-9a-fA-F]+)/g)].map((m) => m[1].toLowerCase());
  expect(matches, "styles.css must declare exactly 2 --bg values").toHaveLength(2);
  [bgLight, bgDark] = matches;
});

describe("chrome colors mirror styles.css --bg", () => {
  it("index.html theme-color (light) matches --bg (light)", () => {
    const m = html.match(
      /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]+)"\s+media="\(prefers-color-scheme:\s*light\)"/i,
    );
    expect(m, "index.html missing theme-color meta (light)").toBeTruthy();
    expect(m[1].toLowerCase()).toBe(bgLight);
  });

  it("index.html theme-color (dark) matches --bg (dark)", () => {
    const m = html.match(
      /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]+)"\s+media="\(prefers-color-scheme:\s*dark\)"/i,
    );
    expect(m, "index.html missing theme-color meta (dark)").toBeTruthy();
    expect(m[1].toLowerCase()).toBe(bgDark);
  });

  it("site.webmanifest theme_color matches --bg (light)", () => {
    expect(manifest.theme_color?.toLowerCase()).toBe(bgLight);
  });

  it("site.webmanifest background_color matches --bg (light)", () => {
    expect(manifest.background_color?.toLowerCase()).toBe(bgLight);
  });
});

describe("og-image is derived from the latest dark hero", () => {
  it("public/og-image.png exists", () => {
    expect(ogBytes, "run `npm run media:derive`").not.toBeNull();
  });

  it("public/og-image.png is 1200×630", () => {
    if (!ogBytes) return;
    expect(ogBytes.readUInt32BE(16)).toBe(1200);
    expect(ogBytes.readUInt32BE(20)).toBe(630);
  });

  it("public/og-image.png bytes match a fresh derivation from media/04-dark-hero.png", async () => {
    if (!ogBytes) return;
    const magickOk = spawnSync("magick", ["-version"], { stdio: "ignore" }).status === 0;
    if (!magickOk) {
      console.warn("presentational-sync: `magick` not on PATH; skipping byte check.");
      return;
    }
    const source = join(ROOT, "media", "04-dark-hero.png");
    const staging = join(tmpdir(), `og-image-check-${process.pid}.png`);
    // Must match scripts/derive-og-image.mjs::magickArgs.
    const result = spawnSync("magick", [
      source,
      "-strip",
      "-resize", "1200x",
      "-gravity", "north",
      "-crop", "1200x630+0+0",
      "+repage",
      staging,
    ], { stdio: "inherit" });
    expect(result.status, "magick re-derivation failed").toBe(0);
    const fresh = await readFile(staging);
    await rm(staging, { force: true });
    expect(
      fresh.equals(ogBytes),
      `og-image.png drift — run \`npm run media:derive\` (fresh: ${fresh.byteLength}B, committed: ${ogBytes.byteLength}B)`,
    ).toBe(true);
  });
});
