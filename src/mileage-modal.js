import { TEAMS, TEAM_KEYS } from "./data/teams.js";
import { formatMiles, numberFormatter } from "./ui.js";

const PLANE_SVG = `<svg class="mileage-row__plane" viewBox="-14 -10 28 20" fill="currentColor" aria-hidden="true">
  <path d="M13 0L0 -1.8L-4 -8L-6 -8L-3 -1.8L-10 -1.8L-12 -4L-13 -4L-11 0L-13 4L-12 4L-10 1.8L-3 1.8L-6 8L-4 8L0 1.8Z"/>
</svg>`;

// Render once per summary change; the contrail widths are driven by CSS via
// custom properties so reopening the modal replays the draw animation without
// rebuilding the DOM.
function renderRows(listEl, summary) {
  const sorted = [...TEAM_KEYS].sort(
    (a, b) => summary[b].totalMiles - summary[a].totalMiles,
  );
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

  let pendingSummary = null;
  let pendingSubtitle = null;
  let renderedSummary = null;

  function syncRows() {
    if (pendingSummary && pendingSummary !== renderedSummary) {
      renderRows(listEl, pendingSummary);
      renderedSummary = pendingSummary;
    }
    if (subtitleEl && pendingSubtitle) {
      subtitleEl.textContent = pendingSubtitle;
    }
  }

  function open() {
    if (!pendingSummary) return;
    syncRows();
    modal.hidden = false;
    // Replay the contrail draw-in: force layout reset before flipping
    // data-show so the width transition runs every time the modal opens.
    listEl
      .querySelectorAll(".mileage-row")
      .forEach((row) => row.classList.remove("mileage-row--drawn"));
    void listEl.offsetWidth;
    requestAnimationFrame(() => {
      modal.dataset.show = "true";
      listEl
        .querySelectorAll(".mileage-row")
        .forEach((row) => row.classList.add("mileage-row--drawn"));
    });
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.dataset.show = "false";
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
    setTimeout(() => {
      modal.hidden = true;
      toggle.focus();
    }, 220);
  }

  function onKey(event) {
    if (event.key === "Escape") close();
  }

  toggle.addEventListener("click", open);
  modal
    .querySelectorAll("[data-mileage-close]")
    .forEach((el) => el.addEventListener("click", close));

  return {
    setSummary(summary, subtitle) {
      pendingSummary = summary;
      pendingSubtitle = subtitle ?? pendingSubtitle;
      // Refresh in place if the modal is currently open.
      if (!modal.hidden) syncRows();
    },
  };
}
