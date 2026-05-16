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

## Sub-composition split (deferred)

The Phase 2 plan called for extracting the intro and outro scenes into `compositions/intro.html` and `compositions/outro.html` sub-comps loaded via `data-composition-src`. That refactor was attempted and reverted in the same session: the sub-comps mounted into the DOM (lint passed, `hyperframes inspect` saw the elements with their text) but their scoped `<style>` rules weren't applying to the mounted content in the renderer, leaving cards as black-on-black. Root cause traced to the runtime's CSS scoping function (`Un` in `hyperframe-runtime.js`) interacting with `#intro` / `[data-composition-id="intro"]` selectors in a way I couldn't pin down inside the time budget.

`index.html` remains monolithic — both intro and outro scenes live inline. When picking the split back up, things worth knowing:

- The runtime auto-nests sub-comp GSAP timelines via `window.__timelines["<comp-id>"]` registration, so each sub-comp's animations *do* progress alongside the root.
- Sub-comp `<style>` and `<script>` blocks are extracted from the template, scoped, and re-injected. The scoping is where the bug lives.
- Sub-comps loaded via `data-composition-src` must use `gsap.fromTo()` rather than `gsap.from()` (per the skill docs; `immediateRender: true` in `from()` doesn't compose cleanly with auto-nesting).
- The four reference docs (`design.md`, `beat-sheet.md`, `MUSIC_PROMPTS.md`, `RENDER_SETTINGS.md`) deliver the structural value the split was meant to provide — they document what each scene is, how it's parameterized, and how to reach for higher quality.
