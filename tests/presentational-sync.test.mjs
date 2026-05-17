// Cross-file sync invariants for presentational artifacts.
//
// Asserts that:
//   · styles.css --bg (light) === index.html theme-color (light)
//                              === site.webmanifest.theme_color
//                              === site.webmanifest.background_color
//   · styles.css --bg (dark)  === index.html theme-color (dark)
//   · public/og-image.png is 1200×630 and byte-matches a fresh derivation
//     from media/04-dark-hero.png
//
// Preconditions (og-image present, `magick` on PATH) drive Vitest `it.skipIf`
// so missing-tool environments report SKIPPED rather than vacuously PASSED.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ROOT,
  OG_SOURCE,
  OG_TARGET,
  magickArgs,
  isMagickAvailable,
} from "../scripts/derive-og-image.mjs";

// Top-level sync reads — `it.skipIf` evaluates the condition at registration
// time, which is before `beforeAll` would run. Reading files at module load
// also keeps the test suite cheap to skip on missing preconditions.
const css = readFileSync(join(ROOT, "styles.css"), "utf8");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(ROOT, "public", "site.webmanifest"), "utf8"));
const ogBytes = existsSync(OG_TARGET) ? readFileSync(OG_TARGET) : null;
const magickOk = isMagickAvailable();

// The file declares --bg exactly twice: light first, dark second. If a third
// theme is ever added, scope this by selector before extracting.
const bgMatches = [...css.matchAll(/--bg:\s*(#[0-9a-fA-F]+)/g)].map((m) => m[1].toLowerCase());
const [bgLight, bgDark] = bgMatches.length === 2 ? bgMatches : [null, null];

describe("chrome colors mirror styles.css --bg", () => {
  it("styles.css declares exactly two --bg values (light + dark)", () => {
    expect(bgMatches).toHaveLength(2);
  });

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

  it.skipIf(!ogBytes)("public/og-image.png is 1200×630", () => {
    expect(ogBytes.readUInt32BE(16)).toBe(1200);
    expect(ogBytes.readUInt32BE(20)).toBe(630);
  });

  it.skipIf(!ogBytes || !magickOk)(
    "public/og-image.png bytes match a fresh derivation from media/04-dark-hero.png",
    async () => {
      const staging = join(tmpdir(), `og-image-check-${process.pid}.png`);
      const result = spawnSync("magick", magickArgs(OG_SOURCE, staging), {
        stdio: "inherit",
      });
      expect(result.status, "magick re-derivation failed").toBe(0);
      const fresh = await readFile(staging);
      await rm(staging, { force: true });
      expect(
        fresh.equals(ogBytes),
        `og-image.png drift — run \`npm run media:derive\` (fresh: ${fresh.byteLength}B, committed: ${ogBytes.byteLength}B)`,
      ).toBe(true);
    },
  );
});
