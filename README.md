# NFL Flight Paths · A Travel-Schedule Globe

![NFL Flight Paths — every confirmed 2026 NFL road trip drawn as a great-circle arc on a clay globe](media/01-hero.png)

[![X](https://img.shields.io/badge/%40cypher__poet-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/cypher_poet) [![PayPal](https://img.shields.io/badge/PayPal-003087?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/ncp/payment/L6M553P28YPDY) [![Cash App](https://img.shields.io/badge/Cash_App-00C244?style=for-the-badge&logo=cashapp&logoColor=white)](https://cash.app/$CypherPoet) [![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/cypherpoet) [![Linktree](https://img.shields.io/badge/Linktree-43E660?style=for-the-badge&logo=linktree&logoColor=white)](https://linktr.ee/CypherPoet) [![MIT License](https://img.shields.io/badge/MIT_License-ff7300?style=for-the-badge&logo=opensourceinitiative&logoColor=000000)](https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/blob/main/LICENSE)

[![Live](https://img.shields.io/badge/Live-cypherpoet.github.io-c2410c?style=for-the-badge&logo=githubpages&logoColor=white)](https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/) [![Built with](https://img.shields.io/badge/Built_with-Three.js-f5efe2?style=for-the-badge&logo=threedotjs&logoColor=04060d)](https://threejs.org/) [![Slate](https://img.shields.io/badge/Slate-2026_Confirmed-1c1a16?style=for-the-badge&logo=nfl&logoColor=white)](#the-2026-confirmed-slate)

A small interactive Three.js scene that plots **every confirmed NFL road trip of the 2026 season** as a great-circle arc on a clay-styled globe. Pick a team, watch their tour of the league light up, and read off the total air miles they'll log. Built as a way to stare at travel inequality — Seattle vs. Boston, transatlantic detours, the trans-Pacific haul to Melbourne — without squinting at a spreadsheet.

→ **Open the live globe · [cypherpoet.github.io/THREE-JS-NFL-Flight-Paths](https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/)**

---

## What's inside

- **A clay globe with real country shapes.** Land masses are painted from a world TopoJSON, baked into both a colour map and a bump map so the continents have subtle relief — the same trick the reference concept uses. A soft drop-shadow underneath the sphere sells the 3D.
- **The 2026 confirmed slate.** All 9 international fixtures (Melbourne, Rio, three London games, Paris, Madrid, Munich, Mexico City) plus the four Week 1 / Week 2 primetime games already announced by the league as of 2026-05-13. The full slate unveils 2026-05-14 at 8 PM ET — see [_The 2026 confirmed slate_](#the-2026-confirmed-slate) below for what's wired up.
- **Team-coloured arcs.** Each flight path is painted in the travelling team's primary brand accent (`#E31837` for KC, `#AA0000` for SF, `#4F2683` for Minnesota, and so on). Stadium markers wear the same colour.
- **Filter by clicking.** Click a team to toggle it off; click again to bring it back. **Solo a single team** with Shift/Cmd-click. Use the *All* / *None* buttons at the top of the panel for sweeping selections. The team list is pre-sorted by total miles travelled.
- **2026 ↔ 2025 toggle.** A small switch in the top bar lets you flip between the 2026 confirmed slate and the 2025 reference slate (all 256 regular-season games + 8 international fixtures). The 2025 view is there to give the eye something to chew on while the rest of 2026 trickles in.
- **Live mileage tally.** The header shows the league-wide total and the sum of just the teams you've selected — handy for asking *"how far does the NFC West fly?"*

## A look around

| | |
|---|---|
| ![Spin to the Atlantic to see all the European games at once](media/02-atlantic.png) | ![SF solo — the trans-Pacific arc to Melbourne](media/03-pacific.png) |
| Spin the globe to see Cincinnati's arc to Madrid, the Patriots' to Munich, and Baltimore's plunge south to Rio | San Francisco solo'd — the long red arc curves down across the Pacific to Melbourne for the Week 1 game |
| ![Toggled back to the 2025 reference slate — every road game of last season](media/04-2025-reference.png) | |
| Flip the top-bar switch to **2025** to see last season's full 256-game lattice as a reference | |

## The 2026 confirmed slate

As of 2026-05-13, the NFL has publicly announced these 2026 regular-season games. Every entry below is in `src/data/schedule-2026.js`:

| Week | Matchup | Venue | Note |
|---:|---|---|---|
| 1 | LA Rams vs. SF 49ers | Melbourne Cricket Ground 🇦🇺 | NFL's Australia debut · Netflix |
| 1 | Dallas at NY Giants | MetLife Stadium | Sunday Night Football |
| 1 | Denver at Kansas City | Arrowhead | Monday Night Football |
| 2 | Detroit at Buffalo | Bills' new stadium | Thursday Night Football |
| 3 | Baltimore vs. Dallas | Maracanã, Rio de Janeiro 🇧🇷 | |
| 4 | Washington vs. Indianapolis | Tottenham Hotspur Stadium 🇬🇧 | Oct 4 · London window opens |
| 5 | Philadelphia vs. Jacksonville | Tottenham Hotspur Stadium 🇬🇧 | Oct 11 |
| 6 | Houston vs. Jacksonville | Wembley Stadium 🇬🇧 | Oct 18 · Jags' second London game |
| 7 | Pittsburgh vs. New Orleans | Stade de France, Saint-Denis 🇫🇷 | Oct 25 · first NFL game in France |
| 9 | Cincinnati vs. Atlanta | Santiago Bernabéu, Madrid 🇪🇸 | Nov 8 |
| 10 | New England vs. Detroit | Allianz Arena, Munich 🇩🇪 | Nov 15 |
| 11 | Minnesota vs. SF 49ers | Estadio Banorte, Mexico City 🇲🇽 | 49ers' second international game |

When the rest of the slate drops on May 14, swapping in the remaining ~245 games is a one-file append to `src/data/schedule-2026.js` — no other code needs to move.

A travel leg is the haversine great-circle distance between the away team's home stadium and the destination venue. International games count as a travel leg for **both** teams, since neither plays at home. Coordinates for all 32 stadiums and the international venues live alongside team accent colours in `src/data/teams.js`.

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  Build (vite)                                               │
│   ├── src/data/teams.js          32 teams + intl venues     │
│   ├── src/data/schedule-2026.js  confirmed 2026 games       │
│   ├── src/data/schedule-2025.js  full 2025 reference slate  │
│   └── data/countries-110m.json   world topology @ 110m      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Runtime                                                    │
│   ├── globe.js     paints land to canvas (d3-geo) →         │
│   │                  diffuse + bump map on a SphereGeometry │
│   ├── geo.js       lat/lon → Vector3, great-circle arc      │
│   ├── schedule.js  away-game legs, miles, per-team totals,  │
│   │                  season registry (2026 default / 2025)  │
│   ├── paths.js     one Line per leg, one marker per stadium │
│   ├── ui.js        sortable team list, miles formatter      │
│   └── main.js      camera, OrbitControls, season switcher   │
└─────────────────────────────────────────────────────────────┘
```

### Design system

| Role | Family | Why |
|------|--------|-----|
| Display + body | [Inter](https://fonts.google.com/specimen/Inter) | Modern, neutral; reads small without going stiff |
| Mono | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Tabular figures for the mileage column |

Palette: vellum `#efe9dd`, paper `#f6f1e6`, ink `#1c1a16`, soft ink `#514a3d`. Team accents pulled from each franchise's primary brand colour.

## Run it locally

```bash
git clone git@github.com:CypherPoet/THREE-JS-NFL-Flight-Paths.git
cd THREE-JS-NFL-Flight-Paths
npm install
npm run dev
```

Then open the printed URL (default <http://localhost:5173/THREE-JS-NFL-Flight-Paths/>).

A production build goes to `dist/`:

```bash
npm run build
npm run preview          # serve dist/ at localhost:4173
```

## Deploy

This repo ships with `.github/workflows/deploy.yml`, which on every push to `main`:

1. `npm ci` → `npm run build`
2. Uploads `dist/` as a GitHub Pages artifact
3. Deploys to `https://<owner>.github.io/THREE-JS-NFL-Flight-Paths/`

Make sure GitHub Pages is set to **GitHub Actions** under `Settings → Pages` for the repo.

## Project layout

```
.
├── index.html                       — shell + topbar/panel markup
├── styles.css                       — typography + HUD chrome
├── vite.config.js                   — base path for GitHub Pages
├── data/
│   └── countries-110m.json          — Natural Earth via world-atlas
├── src/
│   ├── main.js                      — scene, lighting, controls, season switch
│   ├── globe.js                     — sphere + painted land + bump map
│   ├── paths.js                     — great-circle arcs + markers
│   ├── schedule.js                  — legs → per-team mileage summary
│   ├── geo.js                       — lat/lon math, arc sampling
│   ├── ui.js                        — team panel + filter wiring
│   └── data/
│       ├── teams.js                 — stadium coords + accent colours
│       ├── schedule-2026.js         — confirmed 2026 games
│       └── schedule-2025.js         — full 2025 reference slate
├── media/                           — README screenshots
├── .claude/skills/                  — capture-museum-media + threejs/* reference skills
└── .github/workflows/deploy.yml     — Pages build/deploy on push to main
```

## Acknowledgements

- **[Three.js](https://threejs.org/)** by [Ricardo Cabello](https://mrdoob.com/) & contributors
- **[d3-geo](https://github.com/d3/d3-geo)** + **[topojson-client](https://github.com/topojson/topojson-client)** by Mike Bostock — for painting the world to a canvas
- **[world-atlas](https://github.com/topojson/world-atlas)** — the 110m TopoJSON used as the land source
- **2026 schedule data** sourced from the league's pre-release announcements on [nfl.com](https://www.nfl.com/news/2026-nfl-schedule-release-nine-international-games-dates-times-matchups)
- **Stadium coordinates** are public-domain venue locations; **team brand colours** are the franchises' own. This project is an unofficial fan visualisation and is not affiliated with the NFL.
- **Typefaces**: [Inter](https://fonts.google.com/specimen/Inter) by Rasmus Andersson; [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) by JetBrains

## License

MIT — see [`LICENSE`](LICENSE). Team marks, logos, and league names are the property of their respective owners and used here under nominative fair use for non-commercial visualisation.

---

If this changed how you think about the AFC West's frequent-flyer balance, click another team. ✈️
