import { TEAMS, TEAM_KEYS } from "./data/teams.js";

export const numberFormatter = new Intl.NumberFormat("en-US");

export function formatMiles(miles) {
  return numberFormatter.format(Math.round(miles)) + " mi";
}

// Build the team list, return { setActive, getActive, onChange }.
export function buildTeamPanel({ summary, listEl, onChange }) {
  const active = new Set(TEAM_KEYS);

  // Sort by total miles descending so the most-travelled team is on top.
  const sorted = [...TEAM_KEYS].sort(
    (a, b) => summary[b].totalMiles - summary[a].totalMiles,
  );

  listEl.innerHTML = "";
  const rowsByTeam = {};

  for (const key of sorted) {
    const team = TEAMS[key];
    const row = document.createElement("li");
    row.className = "team-row";
    row.dataset.team = key;
    row.dataset.active = "true";
    row.innerHTML = `
      <span class="team-row__chip" style="background:${team.accent}"></span>
      <span class="team-row__name">
        <span class="team-row__abbr">${team.abbr}</span>${team.name.replace(`${team.abbr.length > 0 ? "" : ""}`, "")}
      </span>
      <span class="team-row__miles">${formatMiles(summary[key].totalMiles)}</span>
    `;
    row.addEventListener("click", (e) => {
      // Shift-click → solo; plain click → toggle.
      if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
        active.clear();
        active.add(key);
      } else if (active.has(key)) {
        active.delete(key);
      } else {
        active.add(key);
      }
      refresh();
    });
    listEl.appendChild(row);
    rowsByTeam[key] = row;
  }

  function refresh() {
    for (const [key, row] of Object.entries(rowsByTeam)) {
      row.dataset.active = active.has(key) ? "true" : "false";
    }
    onChange(active);
  }

  function setAll(on) {
    active.clear();
    if (on) for (const k of TEAM_KEYS) active.add(k);
    refresh();
  }

  return { active, refresh, setAll };
}

export function wireSelectAllNone(panel) {
  document
    .getElementById("select-all")
    .addEventListener("click", () => panel.setAll(true));
  document
    .getElementById("select-none")
    .addEventListener("click", () => panel.setAll(false));
}

export function updateHeaderMetrics({ active, summary }) {
  const selected = [...active].reduce(
    (sum, key) => sum + summary[key].totalMiles,
    0,
  );
  const total = Object.values(summary).reduce(
    (sum, s) => sum + s.totalMiles,
    0,
  );
  document.getElementById("selected-miles").textContent = formatMiles(selected);
  document.getElementById("league-miles").textContent = formatMiles(total);
}

export function dismissLoading() {
  const el = document.getElementById("loading");
  if (el) {
    el.classList.add("loading--gone");
    setTimeout(() => el.remove(), 400);
  }
}

export function wireMethodologyModal() {
  const modal = document.getElementById("methodology");
  const toggle = document.getElementById("methodology-toggle");
  if (!modal || !toggle) return;

  function open() {
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.dataset.show = "true";
    });
    document.addEventListener("keydown", onKey);
  }

  function close() {
    modal.dataset.show = "false";
    document.removeEventListener("keydown", onKey);
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
    .querySelectorAll("[data-methodology-close]")
    .forEach((el) => el.addEventListener("click", close));
}
