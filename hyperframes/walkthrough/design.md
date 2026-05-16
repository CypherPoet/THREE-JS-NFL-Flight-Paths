# Walkthrough Composition — Design System

The brand source of truth for the `hyperframes/walkthrough/` composition. The intro and outro cards descend from the dark Sunday-Night-Football palette the live app already uses, so the bookends feel like a continuation of the application rather than a separate broadcast wrapper.

Every color below is pulled directly from `src/themes.js` (the app's `THEMES.dark` entry). Don't invent new colors here — if you need a tone that isn't listed, source it from `THEMES.dark` first.

## Palette

| Token            | Hex       | Source                          | Use                                              |
| ---------------- | --------- | ------------------------------- | ------------------------------------------------ |
| `--bg`           | `#0f0d0a` | `THEMES.dark.sceneBg`           | Composition root background                      |
| `--bg-card`      | `#1a1612` | `THEMES.dark.sphereColor`       | Card interior at vignette center                 |
| `--bg-deep`      | `#050402` | Derived from `sceneBg`          | Vignette outer ring                              |
| `--fg`           | `#fff2c4` | `THEMES.dark.glowInnerColor`    | Headline / hero text (sodium-glow warm cream)    |
| `--fg-muted`     | `#e8e2d0` | `THEMES.dark.countryLineColor`  | Body, URLs, labels (warmer cream)                |
| `--accent`       | `#c89060` | `THEMES.dark.rimColor`          | Arc strokes, accent rules, eyebrow text          |
| `--accent-muted` | `#5a3a14` | `THEMES.dark.glowOuterColor`    | Deeper glow tones, recessive accents             |

## Typography

All three families are self-hosted under `../../fonts/` and symlinked into `./fonts/` so the HyperFrames compiler can embed them.

| Role        | Family                  | Weight    | File                                                             |
| ----------- | ----------------------- | --------- | ---------------------------------------------------------------- |
| Display     | Big Shoulders Display   | 600–800   | `fonts/big-shoulders-display/big-shoulders-display-latin.woff2`  |
| UI / body   | Geist                   | variable  | `fonts/geist/geist-variable.woff2`                               |
| Mono        | Departure Mono          | 400       | `fonts/departure-mono/departure-mono.woff2`                      |

Use Big Shoulders for headline display only (the intro title). Use Geist for body text and the outro URL. Use Departure Mono for eyebrows and small all-caps labels.

## Corners

Sharp. No `border-radius` anywhere on cards. The app's HUD uses subtle rounding in some places, but the video cards stay flat-broadcast.

## Depth

Radial vignettes only. No box-shadows. Headlines may use a sodium-glow text-shadow:

```css
text-shadow:
  0 0 28px rgba(255, 242, 196, 0.25),
  0 0 64px rgba(200, 144, 96, 0.22);
```

**Banned**: full-screen linear gradients on dark backgrounds — they band severely under H.264. Hairline rules at narrow scale (≤1px) on a thin element are fine; the dithering is acceptable when localized.

## Spacing

Medium density:
- **Intro content**: 28px gap between stacked elements (eyebrow → title → rule → subtitle)
- **Outro content**: 40px gap (looser, calmer pacing for the closing breath)

## Motion

| Rule                                  | Why                                                 |
| ------------------------------------- | --------------------------------------------------- |
| At least 3 different eases per scene  | Avoid the "everything uses `power2.out`" feel       |
| Entrance animations only, never exit  | The clip-level crossfade IS the transition          |
| Final scene may fade out at the end   | The outro's last 0.5s is the one exception          |
| First entrance offset ≥ 0.1s          | Avoid simultaneity at t=0; gives the eye a target   |

Eases in active use:
- `power3.out` — primary "settle" ease (sweeps, arc draws)
- `expo.out` — sharp arrivals (word stagger, URL lift)
- `back.out(1.6–2.2)` — playful spring (intro arc dot, outro glyph rotation)
- `power2.out` / `power2.inOut` — subdued, secondary text and crossfades

## Avoidance rules

- No full-screen linear gradients on dark backgrounds (H.264 banding).
- No `repeat: -1` on any timeline or tween — the capture engine requires finite repeats.
- No exit animations except the final outro fade.
- Never animate the `<video>` element's `width`/`height` directly; wrap in a div and animate the wrapper instead.
- No `<br>` in card content — let text wrap via `max-width` and natural line breaks.
- No `Math.random()`, `Date.now()`, or time-based logic in timelines (capture engine requires determinism).

## Sub-composition split

The intro and outro scenes live in `compositions/intro.html` and `compositions/outro.html`, loaded by `index.html` via `data-composition-src`. The root composer holds only the three clip hosts (intro, footage video, outro) and the clip-level crossfade tweens. Each sub-comp owns its own markup, scoped `<style>`, and its own paused GSAP timeline registered to `window.__timelines["intro"]` / `["outro"]`. The runtime auto-nests those into the root timeline so seeking the root progresses the sub-comps in sync.

What made the split work after the first attempt failed:

- **Plain class selectors only in scoped CSS.** No `#id` selectors. The runtime's CSS scoper (`zn` in `hyperframe-runtime.js`) rewrites `#authored-id` into `[data-hf-authored-id="..."]`, and that attribute is only ever set when the template's inner root carried a literal `id=` attribute — easy to get wrong. Class selectors get the simpler treatment: each rule is prepended with the host's `[data-composition-id="..."]` and matches reliably.
- **`<template id="<comp-id>-template">` wrapper** around the inner composition `<div data-composition-id="<comp-id>" data-width="1920" data-height="1080">`. Standalone `index.html` does NOT use a template wrapper — only sub-comps loaded via `data-composition-src` do.
- **`gsap.fromTo()` instead of `gsap.from()`** in every entrance tween. `from()`'s `immediateRender: true` resets state at construction time, which doesn't compose cleanly with seek-based rendering. `fromTo` defines state at both ends and makes every seek position deterministic.
- **Don't trust `npx hyperframes snapshot` to validate sub-comp timeline progression.** The snapshot tool restructures the DOM aggressively (it removes elements outside the active clip window) and that interferes with how nested sub-comp timelines appear at scrub points. The actual `render` pipeline scrubs cleanly. Validate by sampling frames from `ffmpeg -ss <t> -i media/walkthrough.mp4` instead.

Each sub-comp's timeline uses its own local time (sub-comp t=0 corresponds to the host's `data-start`). The outro's final 0.5s fade is the one allowed exception to the no-exit-animations rule (final scene only).
