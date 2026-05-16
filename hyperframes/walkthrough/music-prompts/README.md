# Walkthrough Soundtrack Prompts

Paste-ready prompts for generating an instrumental soundtrack for `media/walkthrough.mp4`. Five sonic territories — pick one, copy the prompt from the corresponding file into Suno/Udio/AIVA, save the result to `../audio/soundtrack.mp3`, then wire it into the composition (see [Integration](#integration) below).

## The five styles

1. [Sport-broadcast cinematic](./1-sport-broadcast-cinematic.md) — big orchestral, SNF/MNF theme vibe
2. [Hybrid orchestral-electronic](./2-hybrid-orchestral-electronic.md) — Zimmer × ESPN
3. [Modern minimal data-viz](./3-modern-minimal-data-viz.md) — Apple-keynote / Linear-launch aesthetic
4. [Synthwave / retro NFL Films](./4-synthwave-retro-nfl-films.md) — 80s analog, gated drums
5. [Slow-build cinematic](./5-slow-build-cinematic.md) — Max Richter / Reznor-Ross feel

## What you're scoring

**Total: 19 seconds.** One climactic structural beat at 9.5s — the on-screen light → dark theme toggle.

| Time           | What's on screen                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 0.0 – 2.0s     | Intro card. "NFL FLIGHT PATHS" title staggers in.                                               |
| 2.0 – 6.5s     | Live app footage, light theme. Globe drag-rotates across the US.                                |
| 6.5 – 9.5s     | "International" preset clicks, new arc set draws. Tension builds.                               |
| **9.5s**       | **THE HIT.** Theme toggles light → dark. UI flashes black; arcs glow against the dark sphere.   |
| 9.5 – 17.0s    | Dark theme. Camera pans east; Atlantic crossings, travelers running along the great circles.    |
| 17.0 – 19.0s   | Outro card. Glyph, URL, "Built with Three.js" tagline. Final 0.5s fades to black.               |

## Universal constraints

These apply to every prompt and are already embedded inside each prompt's text — repeated here for human awareness:

- **Length: 19 seconds.** Most generators produce 30s minimums; trim the tail.
- **Instrumental only. No vocals, no lyrics, no spoken word, no choir, no vocal samples.**
- **The big musical event lands at 9.5s** — drop, stinger, swell, full-ensemble entry, whatever the genre allows. Non-negotiable; it's the visual's climax.
- **Arc**: sparse 0–2s, build 2–9s, hit at 9.5s, sustain 9.5–17s, resolve to silence 17–19s.

## Integration

1. Save the generated track as `../audio/soundtrack.mp3`. Normalize to roughly **-1 dB peak**, around **-14 LUFS** integrated loudness.
2. Add an `<audio>` clip to `../index.html` as a sibling to the existing clips:
   ```html
   <audio
     id="soundtrack"
     class="clip"
     data-start="0"
     data-duration="19"
     data-track-index="4"
     data-volume="0.85"
     src="audio/soundtrack.mp3"
   ></audio>
   ```
3. Re-render from `hyperframes/walkthrough/`:
   ```bash
   npx hyperframes render --fps 60 --quality high --resolution 4k --output ../../media/walkthrough.mp4
   ```
4. Spot-check the rendered mp4: the climactic music beat should land at ~9.5s alongside the on-screen theme switch.

## If a generator misbehaves

- **Outputs longer than 19s.** Trim with `ffmpeg -i in.mp3 -t 19 -c copy out.mp3` or in your DAW.
- **Sneaks in vocals.** Re-prompt with "purely instrumental, absolutely no singing, no speech, no vocal pads."
- **Misses the 9.5s hit.** Re-prompt with "the single most important moment is the impact at 9 seconds in — do not soften it, the rest of the piece exists to set up and sustain that moment."
- **Wrong overall length.** Models can't reliably hit exact durations; generate at the tool's natural length and trim or loop the resolution.
