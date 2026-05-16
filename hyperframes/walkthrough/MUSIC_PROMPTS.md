# Walkthrough Soundtrack Prompts

Paste-ready prompts for generating a ~19-second instrumental soundtrack for `media/walkthrough.mp4`. Five distinct sonic territories — pick one (or A/B several), drop the result into `hyperframes/walkthrough/audio/soundtrack.mp3`, then wire a sibling `<audio>` clip into `index.html` (snippet at the bottom of this doc).

## Structural anchors every prompt should honor

- **Total length ~19 seconds.** Most tools generate 30-second minimums; trim the tail to fit.
- **The visual hits its climactic beat at 9–10 seconds in** — the in-footage light → dark theme switch. The music should hit hard there: a drop, a swell, a stinger — whatever the style allows.
- **Arc**: sparse first 2 seconds (intro card) → builds through the footage (2–17s) → calms or resolves on the outro (17–19s).
- **Instrumental only.** No vocals.

---

## 1. Sport-broadcast cinematic

> Make a 19-second cinematic NFL-broadcast intro sting. Big orchestral hits, soaring brass swells, taut staccato strings, deep cinematic drums, hybrid percussion. BPM 110. Start sparse with a sustained brass note and a building string roll; full ensemble enters at 4 seconds; punctuate the change at 9–10 seconds with a powerful drum hit and a brass stab; ride the energy through 15 seconds; resolve with a final brass chord at 17–19s. Confident, heroic, broadcast-ready. Reference vibe: Sunday Night Football intro, Monday Night Football theme, John Williams "Olympic Fanfare."

- **Tools**: Suno, Udio, AIVA
- **BPM**: 110
- **Trim target**: 19s from a 30s render

---

## 2. Hybrid orchestral-electronic

> Generate a 19-second hybrid trailer cue. Hans Zimmer meets ESPN data visualization. Layers: sub-bass synth pulse on every beat, ostinato 16th-note strings, modern percussion (taiko hits + processed claps + reversed reverb cymbals), a synthetic brass-like pad. BPM 128. Start with just sub-bass and ostinato; bring in percussion at 4 seconds; sharp drop at 9–10 seconds where everything cuts to just the sub-bass for one beat before slamming back in; full layered cue 10–16 seconds; outro returns to the opening ostinato fading out. Modern, forward-leaning, sportsbook-energy.

- **Tools**: Suno, Udio
- **BPM**: 128
- **Trim target**: 19s

---

## 3. Modern minimal data-viz

> Compose a 19-second atmospheric electronic piece. Apple-keynote aesthetic; Linear product-launch energy. Sparse and clean. Layers: sine sub-bass pulsing every 2 beats, glassy synth pad sustaining warm chords, occasional bell-tone arpeggio, very subtle glitch percussion that enters at the climax. BPM 90. Start with just the pad and a single sine pulse; layer in a soft bell motif at 4 seconds; introduce a delicate clicking percussion pattern at 9–10 seconds as the focal moment; let the texture breathe through 15 seconds; resolve with a held pad chord 17–19s. Tasteful, premium, restrained.

- **Tools**: Udio, AIVA, Suno
- **BPM**: 90
- **Trim target**: 19s

---

## 4. Synthwave / retro NFL Films

> Make a 19-second instrumental in the spirit of 80s NFL Films production music. Analog poly-synth lead playing a triumphant minor-key melody, gated reverb on snare drums, brass stabs from a synthesizer, warm tape saturation throughout. BPM 100. Start with synth-pad chords and a slow drum machine fill; the lead melody enters at 4 seconds; arrive at the title-card moment at 9–10 seconds with a brass-stab punctuation and a snare crash; ride the lead through 15 seconds; outro fades the snare and lets the pad chord ring out 17–19s. Nostalgic, triumphant, warm. Reference: Sam Spence NFL Films catalog ("Round-Up," "Pony Soldiers"), 80s arena-rock production aesthetics.

- **Tools**: Suno, Udio
- **BPM**: 100
- **Trim target**: 19s

---

## 5. Slow-build cinematic

> Compose a 19-second slow-build cinematic instrumental in the Max Richter / Ólafur Arnalds / Reznor-Ross tradition. Start with a single sustained solo piano note and an ambient pad at 60 BPM. Add a tremolo cello line at 2 seconds. Add a layered string section at 4 seconds. Bring in restrained percussion (felt mallets on toms) at 9–10 seconds — this is the focal moment, the music should feel like it just resolved a long held tension. Full ensemble plays through 14 seconds. Strings drop out at 16 seconds, leaving piano + pad. End on a single sustained note 17–19s. Emotional, reflective, cinematic, modern-classical.

- **Tools**: AIVA (best for orchestral), Udio, Suno
- **BPM**: 60
- **Trim target**: 19s

---

## Integration (when you have a track)

1. Save the generated track as `hyperframes/walkthrough/audio/soundtrack.mp3`. Normalize to roughly **-1 dB peak**, dialog-track loudness (~-14 LUFS) is a safe target.
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
3. Re-run `npx hyperframes render --output ../../media/walkthrough.mp4` from `hyperframes/walkthrough/`.
4. The render now includes audio; spot-check that the climactic music beat lands at ~9.5s alongside the in-footage theme switch.
