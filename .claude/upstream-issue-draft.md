# Upstream issue draft — hyperframes#new (bug template)

Form URL: https://github.com/heygen-com/hyperframes/issues/new?template=bug.yml

Each section below maps to one field in the issue form. Paste them one-for-one.

**Repro is live at https://github.com/CypherPoet/hyperframes-subcomp-blanks-after-timeline-end** — that URL is what goes in the form's "Link to reproduction" field.

---

## Title

```
Sub-composition slot goes black after GSAP timeline ends, regardless of host data-duration
```

---

## Describe the bug

When a sub-composition's internal GSAP timeline runs shorter than its host's `data-duration`, the slot renders correctly during the timeline window, then goes black for the rest of the slot. The runtime's own skill rule says `data-duration` takes precedence over GSAP timeline length — so the sub-comp should hold its final timeline state through the full slot.

Root compositions hold correctly. Only sub-compositions loaded via `data-composition-src` exhibit this.

---

## Link to reproduction

```
https://github.com/CypherPoet/hyperframes-subcomp-blanks-after-timeline-end
```

The repro is two files (one `index.html` plus `compositions/sub.html`), no external assets. Contents shown under "Steps to reproduce" below.

---

## Steps to reproduce

1. Clone the repo above.
2. `npx hyperframes render --fps 60 --quality high --output repro.mp4`
3. Sample frames across the 3s output:
   ```bash
   for t in 0.5 1.0 1.5 2.0 2.5 2.9; do
     ffmpeg -y -loglevel error -ss $t -i repro.mp4 -frames:v 1 frame-${t}.png
   done
   ```
4. Open each PNG.

The repo contains exactly these two files:

**`index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { margin: 0; padding: 0; background: #111; }
      #root { position: relative; width: 1920px; height: 1080px; background: #111; }
      .scene { position: absolute; inset: 0; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="root"
      data-width="1920"
      data-height="1080"
      data-start="0"
      data-duration="3"
    >
      <!-- Host slot is 3s. Sub-comp's internal GSAP timeline runs only 0–1s. -->
      <div
        id="sub-host"
        class="clip scene"
        data-composition-id="sub"
        data-composition-src="compositions/sub.html"
        data-start="0"
        data-duration="3"
        data-track-index="1"
      ></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.set("#sub-host", { opacity: 1 }, 0);
      window.__timelines = window.__timelines || {};
      window.__timelines["root"] = tl;
    </script>
  </body>
</html>
```

**`compositions/sub.html`**

```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /></head>
  <body>
    <template id="sub-template">
      <div data-composition-id="sub" data-width="1920" data-height="1080">
        <style>
          .sub-root {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: #1d2540;
            color: #f8f4e8;
            font: 600 200px/1 system-ui, sans-serif;
          }
        </style>
        <div class="sub-root"><div class="sub-text">HOLD ME</div></div>
        <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
        <script>
          (function () {
            const tl = gsap.timeline({ paused: true });
            // Entrance lands at t=1.0s. No further tweens.
            tl.fromTo(
              ".sub-text",
              { y: 80, opacity: 0 },
              { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
              0,
            );
            window.__timelines = window.__timelines || {};
            window.__timelines["sub"] = tl;
          })();
        </script>
      </div>
    </template>
  </body>
</html>
```

---

## Expected behavior

The sub-composition holds its final timeline state through the full 3s host slot. At every sampled timestamp (0.5s through 2.9s), the rendered frame shows the navy background and "HOLD ME" text — mid-entrance at 0.5s, fully composed from 1.0s onward.

This matches the runtime's documented rule (see "Additional context" below).

---

## Actual behavior

The sub-composition is visible during 0–1s, then the slot goes black for the rest:

| t      | Result                       |
| ------ | ---------------------------- |
| 0.5s   | ✅ Text mid-entrance         |
| 1.0s   | ❌ Black                     |
| 1.5s   | ❌ Black                     |
| 2.0s   | ❌ Black                     |
| 2.5s   | ❌ Black                     |
| 2.9s   | ❌ Black                     |

The slot's `#1d2540` background (on `.sub-root` inside the sub-composition) also disappears — only the root container's `#111` shows through. The sub-composition DOM stops rendering, not just the GSAP-animated elements.

---

## Environment

```shell
hyperframes doctor

  ✓ Version          0.6.14 (latest)
  ✓ Node.js          v24.14.1 (darwin arm64)
  ✓ CPU              16 cores · Apple M4 Max @ 2400MHz
  ✓ Disk             967.7 GB free
  ✓ Environment      non-TTY
  ✓ FFmpeg           ffmpeg version 8.1.1
  ✓ FFprobe          ffprobe version 8.1.1
  ✓ Chrome           cache: chrome-headless-shell mac_arm-147.0.7727.57
```

(Memory check warning and Docker-not-running on my machine are unrelated to the bug — render completes successfully and reproduces the issue regardless.)

---

## Additional context

### What the docs say

The skill documentation that ships with the package (`dist/skills/hyperframes/SKILL.md`) lists this as a non-negotiable rule under "Timeline Contract":

> Duration comes from `data-duration`, not from GSAP timeline length

And under "Composition Clips":

> `data-duration` ... Takes precedence over GSAP timeline duration

Root compositions honor the rule. Sub-compositions don't.

### Workaround

Extending the sub-composition's GSAP timeline past the host's `data-duration` keeps the slot visible. Any tween whose end falls at `t ≥ duration` works — even a no-op tween between identical values:

```js
// Inside the sub-composition's timeline, after the real entrance:
tl.to(".sub-text", { opacity: 1, duration: 2.0 }, 1.0);
```

With this added to the repro, all six sample timestamps render correctly. The entrance state recovers fine — the runtime simply stops seeking into it after the timeline ends.

### Possible fixes

1. **Runtime:** if the GSAP adapter clamps `seek(localTime)` to `timeline.duration()`, clamp to the host's `data-duration` instead — or call `tl.progress(1)` once `localTime >= timeline.duration()`. Either holds the end state.
2. **Docs:** if internal timeline length is intentionally authoritative for sub-comps, the "data-duration takes precedence" rule needs the exception called out, and the workaround needs a name.

Happy to follow up with a PR once you pick a direction.
