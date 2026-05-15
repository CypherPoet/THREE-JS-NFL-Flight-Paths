# NFL Flight Paths · A Travel-Schedule Globe

![NFL Flight Paths — NFL road trips drawn as great-circle arcs on a clay globe](media/01-hero.png)

<div align="center">

[![Live](https://img.shields.io/badge/Live-cypherpoet.github.io-c2410c?style=for-the-badge&logo=githubpages&logoColor=white)](https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/) [![Built with](https://img.shields.io/badge/Built_with-Three.js-f5efe2?style=for-the-badge&logo=threedotjs&logoColor=04060d)](https://threejs.org/)

</div>

<div align="center">

[![X](https://img.shields.io/badge/%40cypher__poet-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/cypher_poet) [![PayPal](https://img.shields.io/badge/PayPal-003087?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/ncp/payment/L6M553P28YPDY) [![Cash App](https://img.shields.io/badge/Cash_App-00C244?style=for-the-badge&logo=cashapp&logoColor=white)](https://cash.app/$CypherPoet) [![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/cypherpoet) [![Linktree](https://img.shields.io/badge/Linktree-43E660?style=for-the-badge&logo=linktree&logoColor=white)](https://linktr.ee/CypherPoet) [![MIT License](https://img.shields.io/badge/MIT_License-ff7300?style=for-the-badge&logo=opensourceinitiative&logoColor=000000)](https://github.com/CypherPoet/THREE-JS-NFL-Flight-Paths/blob/main/LICENSE)

</div>

A small interactive Three.js scene that plots **every NFL road trip of the 2025 and 2026 seasons** as a great-circle arc on an interactive globe. Pick a team, watch their tour of the league light up, and read off the total air miles they'll log.

→ **Open the live globe · [cypherpoet.github.io/THREE-JS-NFL-Flight-Paths](https://cypherpoet.github.io/THREE-JS-NFL-Flight-Paths/)**

---

## What's Inside

- **A sculpted globe with real country shapes.** Continents are rendered as 3D elevated plates with etched country borders, sitting above a smooth ocean.
- **Animated travelers.** Every arc is ridden by a small team-coloured pellet looping from home stadium to destination venue, with a soft additive glow that pulses in flight.
- **Team-coloured arcs.** Each flight path uses the travelling team's primary brand accent. Stadium markers and travelers match.
- **Stadium tooltips with photos.** Hover any stadium or international venue for venue + team info and a lazy-loaded Wikipedia thumbnail.
- **Light + dark modes.** A toggle in the top bar swaps the whole scene to a coordinated palette and remembers the choice.
- **Filter by clicking.** Click a team to toggle it; _All_ / _None_ for sweeping selections. The team list is sorted by total miles travelled.
- **2025 ↔ 2026 toggle.** Switch seasons from the header.
- **Live mileage tally.** League-wide total + sum of selected teams in the header.
- **Per-team mileage breakdown.** A button in the header opens a modal of all 32 teams as contrail bars with a plane icon at the tip, ordered by miles flown.
- **Methodology modal.** A small "how mileage is calculated" panel explains the chronological-walk model behind the totals.

## A Look Around

|                                                                     |                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ![Atlantic spin showing trans-Atlantic arcs](media/02-atlantic.png) | ![A single team solo'd, showing a long trans-Pacific arc](media/03-pacific.png) |
| ![Dark mode hero](media/04-dark-hero.png)                           | ![Dark mode rotated to the Atlantic](media/05-dark-atlantic.png)                |

## The Schedule

Schedules live in `src/data/schedule-2026.js` (current season) and `src/data/schedule-2025.js`. Stadiums + international venues + team accent colors live in `src/data/teams.js`. A travel leg is the great-circle distance from the away team's home stadium to the destination venue; for international games, **both** teams get a leg since neither plays at home.

## Run It Locally

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

## Acknowledgements

- **[Three.js](https://threejs.org/)** by [Ricardo Cabello](https://mrdoob.com/) & contributors
- **[topojson-client](https://github.com/topojson/topojson-client)** by Mike Bostock — reads the bundled country TopoJSON at runtime
- **[world-atlas](https://github.com/topojson/world-atlas)** — origin of the bundled `data/countries-110m.json` used as the land source
- **2025 schedule data** from [Pro Football Reference](https://www.pro-football-reference.com/years/2025/games.htm) (regular-season subset)
- **2026 schedule data** from [Pro Football Reference](https://www.pro-football-reference.com/years/2026/games.htm) (regular-season subset)
- **Stadium coordinates** are public-domain venue locations; **team brand colours** are the franchises' own. This project is an educational data visualisation and is not affiliated with the NFL.

## License

MIT — see [`LICENSE`](LICENSE). Team marks, logos, and league names are the property of their respective owners and used here under nominative fair use for non-commercial visualisation.

---

If this changed how you think about the AFC West's frequent-flyer balance, click another team. ✈️
