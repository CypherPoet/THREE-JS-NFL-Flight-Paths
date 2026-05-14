import { TEAMS } from "./data/teams.js";
import {
  formatMiles,
  numberFormatter,
  sortTeamsByMiles,
  wireModal,
} from "./ui.js";

const PLANE_SVG = `<svg class="mileage-row__plane" viewBox="-14 -10 28 20" fill="currentColor" aria-hidden="true">
  <path d="M13 0L0 -1.8L-4 -8L-6 -8L-3 -1.8L-10 -1.8L-12 -4L-13 -4L-11 0L-13 4L-12 4L-10 1.8L-3 1.8L-6 8L-4 8L0 1.8Z"/>
</svg>`;

function renderRows(listEl, summary) {
  const sorted = sortTeamsByMiles(summary);
  const maxMiles = summary[sorted[0]].totalMiles || 1;

  listEl.innerHTML = "";
  for (const key of sorted) {
    const team = TEAMS[key];
    const miles = summary[key].totalMiles;
    const pct = (miles / maxMiles) * 100;

    const row = document.createElement("li");
    row.className = "mileage-row";
    row.style.setProperty("--accent-light", team.accent);
    row.style.setProperty("--accent-dark", team.accentDark ?? team.accent);
    row.style.setProperty("--pct", `${pct.toFixed(2)}%`);
    row.innerHTML = `
      <div class="mileage-row__label">
        <span class="mileage-row__chip"></span>
        <span class="mileage-row__abbr">${team.abbr}</span>
        <span class="mileage-row__name">${team.name}</span>
      </div>
      <div class="mileage-row__track" aria-hidden="true">
        <span class="mileage-row__trail"></span>
        ${PLANE_SVG}
      </div>
      <div class="mileage-row__value" aria-label="${numberFormatter.format(Math.round(miles))} miles">
        ${formatMiles(miles)}
      </div>
    `;
    listEl.appendChild(row);
  }
}

export function wireMileageModal() {
  const modal = document.getElementById("mileage");
  const toggle = document.getElementById("mileage-toggle");
  const listEl = document.getElementById("mileage-list");
  const subtitleEl = document.getElementById("mileage-subtitle");
  if (!modal || !toggle || !listEl) return { setSummary: () => {} };

  let currentSummary = null;
  let currentSubtitle = null;
  let renderedSummary = null;

  function syncRows() {
    if (currentSummary && currentSummary !== renderedSummary) {
      renderRows(listEl, currentSummary);
      renderedSummary = currentSummary;
    }
    if (subtitleEl && currentSubtitle) {
      subtitleEl.textContent = currentSubtitle;
    }
  }

  wireModal({
    modal,
    toggle,
    closeSelector: "[data-mileage-close]",
    lockScroll: true,
    onOpen: () => {
      syncRows();
      // Replay the contrail draw-in: strip the `drawn` class, force a
      // layout flush, then re-add on the next frame so the width transition
      // runs every time the modal opens.
      const rows = listEl.querySelectorAll(".mileage-row");
      rows.forEach((row) => row.classList.remove("mileage-row--drawn"));
      void listEl.offsetWidth;
      requestAnimationFrame(() => {
        rows.forEach((row) => row.classList.add("mileage-row--drawn"));
      });
    },
  });

  return {
    setSummary(summary, subtitle) {
      currentSummary = summary;
      currentSubtitle = subtitle;
      if (!modal.hidden) syncRows();
    },
  };
}
