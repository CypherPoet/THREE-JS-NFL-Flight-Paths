# Walkthrough Soundtrack Prompts

Paste-ready prompts for generating a soundtrack for `media/walkthrough.mp4`. Five sonic territories — pick one (or A/B several), drop the result into `hyperframes/walkthrough/audio/soundtrack.mp3`, then wire a sibling `<audio>` clip into `index.html` (snippet at the bottom).

## The visual you're scoring

**Total length: exactly 19 seconds.** Three sections, with one structural climax:

| Time           | What's on screen                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **0.0 – 2.0s** | Intro card. "NFL FLIGHT PATHS" title staggers in over a soft globe-arc graphic. Eyebrow → title words → subtitle.         |
| **2.0 – 6.5s** | Live app footage (light theme). Globe drag-rotates across the US; a team row gets highlighted on hover.                   |
| **6.5 – 9.5s** | "International" preset clicks at ~8.5s and a new arc set draws in. Light theme still — tension building.                  |
| **~9.5s**      | **THE HIT.** Theme toggles light → dark on screen. UI flashes to black; international arcs glow against the dark sphere. |
| **9.5 – 17.0s** | Dark theme. Camera pans east, Atlantic crossings, arcs running, travelers animating along the great circles.            |
| **17.0 – 19.0s** | Outro card. Glyph rotates in, "github.com/CypherPoet/THREE-JS-NFL-Flight-Paths" URL slides up, "Built with Three.js" tagline. Final 0.5s fades to black. |

## Universal constraints — apply to every prompt

- **Total length: 19 seconds.** Most tools generate 30s minimums; trim the tail.
- **Instrumental only. No vocals, no lyrics, no spoken word, no choir, no vocal samples.**
- **The big musical event lands at 9.5 seconds** — drop, stinger, swell, full-ensemble entry. Whatever the genre allows. This is non-negotiable; it's the visual's structural climax.
- **Energy arc**: sparse 0–2s (under the title), gradual build 2–9s, peak hit at 9.5s, sustain 9.5–17s, resolve to silence 17–19s.

---

## 1. Sport-broadcast cinematic

> Make a 19-second instrumental cinematic NFL-broadcast intro sting. **No vocals, no lyrics, no choir.** Big orchestral hits, soaring brass swells, taut staccato strings, deep cinematic drums, hybrid percussion. BPM around 110. Timing map: **0–2s** opens sparse with a sustained brass note and a quietly building string roll; **2–6s** introduces taut staccato strings and a low timpani pulse; **6–9s** builds anticipation with a rising string ostinato; **at 9.5s, hit hard** — full brass stab + powerful drum strike, full ensemble enters — this is the climactic moment; **9.5–15s** rides at full ensemble; **15–17s** eases off slightly; **17–19s** resolves with a final sustained brass chord that fades to silence. Confident, heroic, broadcast-ready. Reference vibe: Sunday Night Football intro, Monday Night Football theme, John Williams "Olympic Fanfare."

- **Tools**: Suno, Udio, AIVA
- **BPM**: ~110

---

## 2. Hybrid orchestral-electronic

> Generate a 19-second instrumental hybrid trailer cue. **No vocals, no lyrics.** Hans Zimmer meets ESPN data visualization. Layers: sub-bass synth pulse on every beat, ostinato 16th-note strings, modern percussion (taiko hits + processed claps + reversed reverb cymbals), a synthetic brass-like pad. BPM 128. Timing map: **0–2s** opens with just the sub-bass pulse and a faint ostinato; **2–6s** adds the ostinato strings at full volume; **6–9s** layers percussion in, building toward a peak; **at 9.5s, sharp 1-beat drop to just the sub-bass — then everything slams back in** with a heavy taiko hit + brass stab; **9.5–15s** the full layered cue rides at peak intensity; **15–17s** the ostinato thins out; **17–19s** returns to just the opening sub-bass and a sustained pad, fading to silence. Modern, forward-leaning, sportsbook-energy.

- **Tools**: Suno, Udio
- **BPM**: 128

---

## 3. Modern minimal data-viz

> Compose a 19-second instrumental atmospheric electronic piece. **No vocals, no lyrics, no choir.** Apple-keynote aesthetic; Linear product-launch energy. Sparse and clean — no big drops. Layers: sine sub-bass pulsing every 2 beats, glassy synth pad sustaining warm chords, occasional bell-tone arpeggio, very subtle glitch percussion. BPM around 90. Timing map: **0–2s** just the pad and a single sine pulse, very quiet; **2–4s** a soft bell motif enters; **4–9s** the bell pattern develops as the pad warms; **at 9.5s, a delicate clicking percussion pattern enters and the bell motif resolves into a held major chord** — restrained but distinct, this is the focal moment; **9.5–15s** the texture breathes with the percussion riding underneath; **15–17s** percussion drops out; **17–19s** a single held pad chord resolves and fades to silence. Tasteful, premium, restrained.

- **Tools**: Udio, AIVA, Suno
- **BPM**: ~90

---

## 4. Synthwave / retro NFL Films

> Make a 19-second instrumental piece in the spirit of 80s NFL Films production music. **No vocals, no lyrics.** Analog poly-synth lead playing a triumphant minor-key melody, gated reverb on snare drums, brass stabs from a synthesizer, warm tape saturation throughout. BPM 100. Timing map: **0–2s** opens with synth-pad chords and a slow drum machine fill; **2–4s** the lead melody begins; **4–9s** the melody develops with gated snare building energy; **at 9.5s, hit with a powerful brass-stab + crashing gated snare** — the lead reaches its high point; **9.5–15s** the lead rides through with the full kit at peak; **15–17s** the snare drops out and the lead simplifies; **17–19s** let the pad chord ring out into silence. Nostalgic, triumphant, warm. Reference: Sam Spence NFL Films catalog ("Round-Up," "Pony Soldiers"), 80s arena-rock production aesthetics.

- **Tools**: Suno, Udio
- **BPM**: 100

---

## 5. Slow-build cinematic

> Compose a 19-second instrumental slow-build cinematic piece in the Max Richter / Ólafur Arnalds / Reznor-Ross tradition. **No vocals, no lyrics, no choir.** BPM 60. Timing map: **0–2s** starts with a single sustained solo piano note and a quiet ambient pad; **2–4s** a tremolo cello line enters; **4–9s** layered strings build with restrained intensity; **at 9.5s, bring in restrained percussion — felt mallets on toms — and the strings swell to their peak** — this should feel like a long-held tension just resolved; **9.5–14s** the full ensemble plays through; **14–16s** strings begin to thin; **16–17s** only piano + pad remain; **17–19s** ends on a single sustained piano note that fades to silence. Emotional, reflective, cinematic, modern-classical.

- **Tools**: AIVA (best for orchestral), Udio, Suno
- **BPM**: 60

---

## Integration — wiring up the audio

1. Save the generated track as `hyperframes/walkthrough/audio/soundtrack.mp3`. Normalize to roughly **-1 dB peak**, around **-14 LUFS** integrated loudness.
2. Add an `<audio>` clip to `hyperframes/walkthrough/index.html` as a sibling to the existing clips:
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
3. Re-run `npx hyperframes render --fps 60 --quality high --resolution 4k --output ../../media/walkthrough.mp4` from `hyperframes/walkthrough/`.
4. Spot-check the rendered mp4: the climactic music beat should land at ~9.5s alongside the in-footage theme switch.
