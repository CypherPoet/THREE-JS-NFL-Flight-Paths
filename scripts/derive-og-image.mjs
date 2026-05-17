#!/usr/bin/env node
// Regenerate public/og-image.png from media/04-dark-hero.png.
//
// Canonical transform; tests/presentational-sync.test.mjs re-runs `magickArgs`
// and byte-compares the result against the committed og-image to catch drift.
//
// Requires ImageMagick `magick` on PATH (brew install imagemagick).
// Idempotent: only writes the destination when the produced bytes differ.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const OG_SOURCE = join(ROOT, "media", "04-dark-hero.png");
export const OG_TARGET = join(ROOT, "public", "og-image.png");

// Resize the 1920×1200 hero to 1200×750, then top-crop to 1200×630 so the
// brand banner, team panel, and globe stay framed in the social card.
// `-strip` removes PNG metadata so two runs produce byte-identical output —
// which the sync check relies on.
export function magickArgs(source, target) {
  return [
    source,
    "-strip",
    "-resize", "1200x",
    "-gravity", "north",
    "-crop", "1200x630+0+0",
    "+repage",
    target,
  ];
}

// Module loaded by another file (e.g. the sync test) just gets the exports.
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

async function main() {
  const probe = spawnSync("magick", ["-version"], { stdio: "ignore" });
  if (probe.status !== 0) {
    console.error("derive-og-image: ImageMagick `magick` not on PATH.");
    console.error("                 install via: brew install imagemagick");
    process.exit(2);
  }

  if (!existsSync(OG_SOURCE)) {
    console.error(`derive-og-image: source missing: ${OG_SOURCE}`);
    console.error("                 regenerate media/ via the capture-presentational-media skill.");
    process.exit(2);
  }

  const staging = join(tmpdir(), `og-image-staging-${process.pid}.png`);
  const result = spawnSync("magick", magickArgs(OG_SOURCE, staging), { stdio: "inherit" });
  if (result.status !== 0) {
    await rm(staging, { force: true });
    process.exit(result.status ?? 1);
  }

  const fresh = await readFile(staging);
  let current = null;
  try { current = await readFile(OG_TARGET); } catch { /* missing */ }

  if (current && current.equals(fresh)) {
    await rm(staging, { force: true });
    console.log(`og-image.png unchanged (${fresh.byteLength} bytes)`);
    return;
  }

  await rename(staging, OG_TARGET);
  console.log(`og-image.png ${current ? "updated" : "written"} (${fresh.byteLength} bytes)`);
}
