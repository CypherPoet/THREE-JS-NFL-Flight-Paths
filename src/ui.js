import {
  TEAMS,
  TEAM_KEYS,
  DIVISIONS,
  teamConference,
  groupTeamsByDivision,
} from "./data/teams.js";

export const numberFormatter = new Intl.NumberFormat("en-US");

export function formatMiles(miles) {
  return numberFormatter.format(Math.round(miles)) + " mi";
}

export function sortTeamsByMiles(summary) {
  return [...TEAM_KEYS].sort(
    (a, b) => summary[b].totalMiles - summary[a].totalMiles,
  );
}

// Build the team list. Renders 32 rows grouped by division (default) or
// flat-sorted by mileage, each row carrying a stacked mileage bar (team
// accent + international segment). Preset chips above the list apply
// canonical filters (All / AFC / NFC / Longest 5 / International / Clear).
//
// Returns { active, refresh, setAll, ... } so main.js can drive header
// metric updates from the same active Set.
export function buildTeamPanel({ summary, intl, listEl, onChange }) {
  const maxMiles = Math.max(
    1,
    ...TEAM_KEYS.map((k) => summary[k].totalMiles),
  );
  const byDivision = groupTeamsByDivision();
  const sortedByMiles = sortTeamsByMiles(summary);
  const longest5 = new Set(sortedByMiles.slice(0, 5));
  const internationalTeams = new Set(
    TEAM_KEYS.filter((k) => summary[k].internationalCount > 0),
  );
  // First-paint default. The bare URL boots showing the five longest-travel
  // teams so the data story leads with the lede; "All" is one chip away.
  const active = new Set(longest5);

  let currentSort = "division";
  const rowsByTeam = {};

  function renderRows() {
    listEl.innerHTML = "";
    for (const k of Object.keys(rowsByTeam)) delete rowsByTeam[k];

    if (currentSort === "division") {
      for (const division of DIVISIONS) {
        const teamsInDivision = byDivision[division];
        const divisionTotal = teamsInDivision.reduce(
          (sum, k) => sum + summary[k].totalMiles,
          0,
        );

        const groupHeader = document.createElement("li");
        groupHeader.className = "team-group__head";
        groupHeader.dataset.division = division;
        groupHeader.innerHTML = `
          <span class="team-group__name">${division}</span>
          <span class="team-group__miles">${formatMiles(divisionTotal)}</span>
        `;
        listEl.appendChild(groupHeader);

        for (const teamKey of teamsInDivision) {
          listEl.appendChild(buildTeamRow(teamKey));
        }
      }
    } else {
      // mileage sort
      for (const teamKey of sortedByMiles) {
        listEl.appendChild(buildTeamRow(teamKey));
      }
    }

    applyActiveState();
  }

  function buildTeamRow(teamKey) {
    const team = TEAMS[teamKey];
    const teamSummary = summary[teamKey];
    const miles = teamSummary.totalMiles;
    const legMiles = teamSummary.legMiles;
    const intlMiles = teamSummary.internationalMiles;
    const pct = (miles / maxMiles) * 100;
    // Bar length scales with the team's sequential-walk total (matches the
    // numeric readout). The international segment within the bar is a
    // legMiles-space ratio — internationalMiles is a subset of legMiles, so
    // the share is bounded ≤ 1 by construction.
    const intlShare = legMiles > 0 ? intlMiles / legMiles : 0;
    const intlSharePct = pct * intlShare;
    const teamPct = pct - intlSharePct;

    const row = document.createElement("li");
    row.className = "team-row";
    row.dataset.team = teamKey;
    row.dataset.active = "true";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-pressed", "true");
    row.setAttribute(
      "aria-label",
      `${team.name} (${team.abbr}), ${formatMiles(miles)}`,
    );
    row.style.setProperty("--accent", team.accent);
    row.style.setProperty("--accent-dark", team.accentDark ?? team.accent);
    row.style.setProperty("--team-pct", `${teamPct.toFixed(2)}%`);
    row.style.setProperty("--intl-pct", `${intlSharePct.toFixed(2)}%`);
    row.innerHTML = `
      <span class="team-row__chip"></span>
      <span class="team-row__abbr">${team.abbr}</span>
      <span class="team-row__name">${team.name}</span>
      <span class="team-row__bar" aria-hidden="true">
        <span class="team-row__bar-team"></span>
        <span class="team-row__bar-intl"></span>
      </span>
      <span class="team-row__miles">${formatMiles(miles)}</span>
    `;
    function toggleFromEvent(modifier) {
      if (modifier) {
        active.clear();
        active.add(teamKey);
      } else if (active.has(teamKey)) {
        active.delete(teamKey);
      } else {
        active.add(teamKey);
      }
      refresh();
    }
    row.addEventListener("click", (e) => {
      toggleFromEvent(e.shiftKey || e.metaKey || e.ctrlKey || e.altKey);
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFromEvent(e.shiftKey || e.metaKey || e.ctrlKey || e.altKey);
      }
    });
    rowsByTeam[teamKey] = row;
    return row;
  }

  function applyActiveState() {
    for (const [key, row] of Object.entries(rowsByTeam)) {
      const on = active.has(key);
      row.dataset.active = on ? "true" : "false";
      row.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function refresh() {
    applyActiveState();
    updatePresetState();
    onChange(active);
  }

  // Each preset corresponds to a canonical Set of teams. "All" sets every
  // team active; "AFC" / "NFC" filter by conference; "Longest 5" picks the
  // top 5 by mileage; "International" picks teams with overseas games;
  // "Clear" empties the selection.
  function applyPreset(preset) {
    active.clear();
    if (preset === "all") {
      for (const k of TEAM_KEYS) active.add(k);
    } else if (preset === "afc") {
      for (const k of TEAM_KEYS) if (teamConference(k) === "AFC") active.add(k);
    } else if (preset === "nfc") {
      for (const k of TEAM_KEYS) if (teamConference(k) === "NFC") active.add(k);
    } else if (preset === "longest5") {
      for (const k of longest5) active.add(k);
    } else if (preset === "international") {
      for (const k of internationalTeams) active.add(k);
    }
    // 'none' leaves active empty.
    refresh();
  }

  // Mark a preset chip "active" only if the current selection exactly
  // matches its canonical set. Custom selections leave every chip inactive.
  function updatePresetState() {
    const presetButtons = document.querySelectorAll(".panel__preset");
    const matched = matchActiveToPreset();
    for (const btn of presetButtons) {
      btn.dataset.active = btn.dataset.preset === matched ? "true" : "false";
    }
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const k of a) if (!b.has(k)) return false;
    return true;
  }

  function matchActiveToPreset() {
    if (active.size === 0) return "none";
    if (active.size === TEAM_KEYS.length) return "all";
    const afc = new Set(TEAM_KEYS.filter((k) => teamConference(k) === "AFC"));
    const nfc = new Set(TEAM_KEYS.filter((k) => teamConference(k) === "NFC"));
    if (setsEqual(active, afc)) return "afc";
    if (setsEqual(active, nfc)) return "nfc";
    if (setsEqual(active, longest5)) return "longest5";
    if (setsEqual(active, internationalTeams)) return "international";
    return null;
  }

  function setSort(sort) {
    if (sort === currentSort) return;
    currentSort = sort;
    for (const btn of document.querySelectorAll(".panel__sort-button")) {
      btn.dataset.active = btn.dataset.sort === sort ? "true" : "false";
    }
    renderRows();
  }

  // Wire the panel-head kicker, the preset chips, and the sort toggle. The
  // kicker carries two facts split into spans: a league total (mobile-only —
  // the desktop topbar metric tile carries it) and the abroad summary (every
  // viewport). CSS visibility handles the desktop/mobile split.
  const intlEl = document.getElementById("panel-intl");
  if (intlEl) {
    intlEl.replaceChildren();
    if (intl && intl.teamCount > 0) {
      const leagueTotal = Object.values(summary).reduce(
        (sum, s) => sum + s.totalMiles,
        0,
      );
      const leagueSpan = document.createElement("span");
      leagueSpan.className = "panel__head-meta__league";
      leagueSpan.textContent = `${formatMiles(leagueTotal)} league · `;
      intlEl.append(leagueSpan);
      const intlSpan = document.createElement("span");
      intlSpan.className = "panel__head-meta__intl";
      intlSpan.textContent = `${intl.teamCount} abroad · ${formatMiles(intl.totalMiles)}`;
      intlEl.append(intlSpan);
      intlEl.hidden = false;
    } else {
      intlEl.hidden = true;
    }
  }

  // Preset/sort buttons are static in index.html; clone-replace drops listeners
  // from prior season switches.
  function rebind(selector, datasetKey, handler) {
    for (const btn of document.querySelectorAll(selector)) {
      const fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      fresh.addEventListener("click", () => handler(fresh.dataset[datasetKey]));
    }
  }
  rebind(".panel__preset", "preset", applyPreset);
  rebind(".panel__sort-button", "sort", setSort);

  renderRows();
  updatePresetState();

  function setAll(on) {
    applyPreset(on ? "all" : "none");
  }

  function isDefault() {
    return setsEqual(active, longest5);
  }

  return { active, refresh, setAll, isDefault };
}

// Header metric cards: League total + International miles (with game count).
// Both display season facts, not filter state — the active filter shapes
// the globe + panel, not the season totals.
export function updateHeaderMetrics({ summary, intl }) {
  const total = Object.values(summary).reduce(
    (sum, s) => sum + s.totalMiles,
    0,
  );
  const leagueEl = document.getElementById("league-miles");
  const intlMilesEl = document.getElementById("international-miles");
  const intlGamesEl = document.getElementById("international-games");
  if (leagueEl) leagueEl.textContent = formatMiles(total);
  if (intlMilesEl) intlMilesEl.textContent = formatMiles(intl.totalMiles);
  if (intlGamesEl) {
    intlGamesEl.textContent = `${intl.gameCount} game${intl.gameCount === 1 ? "" : "s"}`;
  }
}

export function dismissLoading() {
  const el = document.getElementById("loading");
  if (el) {
    el.classList.add("loading--gone");
    setTimeout(() => el.remove(), 400);
  }
}

// Shared open/close/Esc/focus-return plumbing for the project's `data-show`
// modals. `onOpen` runs after the modal is unhidden but before the show
// transition is triggered — a hook for content sync or animation replay.
export function wireModal({
  modal,
  toggle,
  closeSelector,
  lockScroll = false,
  onOpen,
}) {
  if (!modal || !toggle) return;

  function open() {
    modal.hidden = false;
    onOpen?.();
    requestAnimationFrame(() => {
      modal.dataset.show = "true";
    });
    document.addEventListener("keydown", onKey);
    if (lockScroll) document.body.style.overflow = "hidden";
  }

  function close() {
    modal.dataset.show = "false";
    document.removeEventListener("keydown", onKey);
    if (lockScroll) document.body.style.overflow = "";
    setTimeout(() => {
      modal.hidden = true;
      toggle.focus();
    }, 200);
  }

  function onKey(event) {
    if (event.key === "Escape") close();
  }

  toggle.addEventListener("click", open);
  modal
    .querySelectorAll(closeSelector)
    .forEach((el) => el.addEventListener("click", close));
}

export function wireMethodologyModal() {
  wireModal({
    modal: document.getElementById("methodology"),
    toggle: document.getElementById("methodology-toggle"),
    closeSelector: "[data-methodology-close]",
  });
}
