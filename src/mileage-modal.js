import { TEAMS, TEAM_KEYS } from "./data/teams.js";
import {
  formatMiles,
  numberFormatter,
  sortTeamsByMiles,
  wireModal,
} from "./ui.js";

const PLANE_SVG = `<svg class="mileage-row__plane" viewBox="-14 -10 28 20" fill="currentColor" aria-hidden="true">
  <path d="M13 0L0 -1.8L-4 -8L-6 -8L-3 -1.8L-10 -1.8L-12 -4L-13 -4L-11 0L-13 4L-12 4L-10 1.8L-3 1.8L-6 8L-4 8L0 1.8Z"/>
</svg>`;

// mdi:house — sits at the bar origin for teams with zero international miles.
const HOUSE_SVG = `<svg class="mileage-row__house" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>
</svg>`;

const VIEW_FIELD = {
  regular: "totalMiles",
  international: "internationalMiles",
};

function renderRows(listEl, summary, mode) {
  const field = VIEW_FIELD[mode] ?? VIEW_FIELD.regular;
  const sorted = sortTeamsByMiles(summary, field);
  const maxMiles = Math.max(1, summary[sorted[0]][field]);

  listEl.innerHTML = "";
  for (const key of sorted) {
    const team = TEAMS[key];
    const miles = summary[key][field];
    const pctRatio = maxMiles > 0 ? miles / maxMiles : 0;
    const stateside = mode === "international" && miles === 0;

    const row = document.createElement("li");
    row.className = stateside
      ? "mileage-row mileage-row--stateside"
      : "mileage-row";
    row.style.setProperty("--accent-light", team.accent);
    row.style.setProperty("--accent-dark", team.accentDark ?? team.accent);
    row.style.setProperty("--pct-scale", pctRatio.toFixed(4));

    const icon = stateside ? HOUSE_SVG : PLANE_SVG;
    const valueLabel = stateside
      ? "0 international miles"
      : `${numberFormatter.format(Math.round(miles))} miles`;
    const valueText = stateside ? "—" : formatMiles(miles);

    row.innerHTML = `
      <div class="mileage-row__label">
        <span class="mileage-row__chip"></span>
        <span class="mileage-row__abbr">${team.abbr}</span>
        <span class="mileage-row__name">${team.name}</span>
      </div>
      <div class="mileage-row__track" aria-hidden="true">
        <span class="mileage-row__trail">
          <span class="mileage-row__trail-fill"></span>
        </span>
        ${icon}
      </div>
      <div class="mileage-row__value" aria-label="${valueLabel}">
        ${valueText}
      </div>
    `;
    listEl.appendChild(row);
  }
}

function buildSubtitle(mode, scope, summary) {
  if (mode === "international") {
    const overseasCount = TEAM_KEYS.reduce(
      (n, k) => n + (summary[k].internationalCount > 0 ? 1 : 0),
      0,
    );
    return `${scope} · overseas travel · ${overseasCount} teams`;
  }
  return `${scope} · regular-season totals`;
}

export function wireMileageModal() {
  const modal = document.getElementById("mileage");
  const toggle = document.getElementById("mileage-toggle");
  const listEl = document.getElementById("mileage-list");
  const subtitleEl = document.getElementById("mileage-subtitle");
  const viewButtons = modal
    ? Array.from(modal.querySelectorAll("[data-mileage-view]"))
    : [];
  if (!modal || !toggle || !listEl) return { setSummary: () => {} };

  let currentSummary = null;
  let currentScope = null;
  let currentMode = "regular";
  let lastRendered = null;

  function replayContrails() {
    const rows = listEl.querySelectorAll(".mileage-row");
    rows.forEach((row) => row.classList.remove("mileage-row--drawn"));
    void listEl.offsetWidth;
    requestAnimationFrame(() => {
      rows.forEach((row) => row.classList.add("mileage-row--drawn"));
    });
  }

  function syncSubtitle() {
    if (subtitleEl && currentScope) {
      subtitleEl.textContent = buildSubtitle(
        currentMode,
        currentScope,
        currentSummary,
      );
    }
  }

  function syncButtons() {
    for (const btn of viewButtons) {
      const active = btn.dataset.mileageView === currentMode;
      btn.dataset.active = active ? "true" : "false";
      btn.setAttribute("aria-selected", active ? "true" : "false");
    }
  }

  function syncRows({ animate = false } = {}) {
    if (!currentSummary) return;
    const key = `${currentMode}:${currentSummary === lastRendered?.summary ? "same" : "new"}`;
    if (lastRendered?.mode === currentMode && lastRendered?.summary === currentSummary) {
      if (animate) replayContrails();
      return;
    }
    renderRows(listEl, currentSummary, currentMode);
    lastRendered = { summary: currentSummary, mode: currentMode, key };
    if (animate) replayContrails();
  }

  for (const btn of viewButtons) {
    btn.addEventListener("click", () => {
      const next = btn.dataset.mileageView;
      if (!next || next === currentMode) return;
      currentMode = next;
      syncButtons();
      syncRows({ animate: true });
      syncSubtitle();
    });
  }

  wireModal({
    modal,
    toggle,
    closeSelector: "[data-mileage-close]",
    lockScroll: true,
    onOpen: () => {
      // Modal always opens in regular-season view; close/reopen resets it.
      currentMode = "regular";
      syncButtons();
      syncRows();
      syncSubtitle();
      replayContrails();
    },
  });

  return {
    setSummary(summary, scope) {
      currentSummary = summary;
      currentScope = scope;
      if (!modal.hidden) {
        syncRows();
        syncSubtitle();
      }
    },
  };
}
