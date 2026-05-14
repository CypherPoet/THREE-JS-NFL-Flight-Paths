import * as THREE from "three";
import { TEAMS, INTERNATIONAL_VENUES } from "./data/teams.js";
import { numberFormatter } from "./ui.js";
import { isFrontOfSphere } from "./geo.js";
import { HIT_KIND_HOME, HIT_KIND_INTERNATIONAL } from "./paths.js";

const SHOW_DELAY_MS = 90;
const HIDE_DELAY_MS = 70;
const VIEWPORT_PADDING = 12;
const MARKER_GAP_PX = 14;

// Lazy thumbnail fetcher backed by the Wikipedia REST summary endpoint. The
// promise itself is cached so failed fetches (404, network, slug renamed)
// are remembered as `null` and never retried.
const photoCache = new Map();

function fetchPhoto(wikiSlug) {
  if (!wikiSlug) return Promise.resolve(null);
  if (photoCache.has(wikiSlug)) return photoCache.get(wikiSlug);

  const promise = fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSlug}`,
    { headers: { accept: "application/json" } },
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => data?.thumbnail?.source ?? null)
    .catch(() => null);

  photoCache.set(wikiSlug, promise);
  return promise;
}

export function createTooltip({
  camera,
  getGlobeGroup,
  getCanvasRect,
  isTeamActive,
}) {
  const root = document.createElement("div");
  root.className = "stadium-tooltip";
  root.dataset.show = "false";
  root.setAttribute("role", "tooltip");
  root.setAttribute("aria-hidden", "true");

  const photo = document.createElement("div");
  photo.className = "stadium-tooltip__photo";
  const photoImg = document.createElement("img");
  photoImg.alt = "";
  photoImg.loading = "lazy";
  photo.appendChild(photoImg);

  const body = document.createElement("div");
  body.className = "stadium-tooltip__body";

  root.appendChild(photo);
  root.appendChild(body);
  document.body.appendChild(root);

  let showTimer = null;
  let hideTimer = null;
  let currentHover = null;
  let currentToken = 0;
  let anchor = null;
  // Cached after every render so place() doesn't force layout each frame.
  let tipWidth = 0;
  let tipHeight = 0;

  const screenPos = new THREE.Vector3();
  const worldPos = new THREE.Vector3();
  const globeOrigin = new THREE.Vector3();

  function clearTimers() {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function show() {
    root.dataset.show = "true";
    root.setAttribute("aria-hidden", "false");
  }

  function hide() {
    root.dataset.show = "false";
    root.setAttribute("aria-hidden", "true");
    anchor = null;
    currentHover = null;
  }

  function render(content, hit) {
    body.innerHTML = content.bodyHTML;
    photoImg.src = "";
    photo.dataset.state = "loading";

    const token = ++currentToken;
    fetchPhoto(content.wiki).then((url) => {
      if (token !== currentToken) return;
      if (url) {
        photoImg.src = url;
        photo.dataset.state = "ready";
      } else {
        photo.dataset.state = "empty";
      }
    });

    anchor = { mesh: hit.object, userData: hit.object.userData };
    // Force layout once now that body content is set, then cache the tooltip
    // dimensions for per-frame placement.
    const tipRect = root.getBoundingClientRect();
    tipWidth = tipRect.width;
    tipHeight = tipRect.height;
    place();
  }

  function buildContent(userData) {
    if (userData.kind === HIT_KIND_HOME) {
      const teams = userData.teams.filter(isTeamActive);
      if (teams.length === 0) return null;
      const primary = TEAMS[teams[0]];
      const teamsLine = teams
        .map(
          (k) =>
            `<span class="stadium-tooltip__team" style="--accent:${TEAMS[k].accent}">${TEAMS[k].name}</span>`,
        )
        .join("");
      return {
        wiki: primary.wiki,
        bodyHTML: `
          <h3 class="stadium-tooltip__title">${primary.stadium}</h3>
          <div class="stadium-tooltip__teams">${teamsLine}</div>
          <div class="stadium-tooltip__city">${primary.city}</div>
          ${factsHTML(primary)}
        `,
      };
    }

    if (userData.kind === HIT_KIND_INTERNATIONAL) {
      const venue = INTERNATIONAL_VENUES[userData.venueKey];
      if (!venue) return null;
      const visiting = userData.teams.filter(isTeamActive);
      if (visiting.length === 0) return null;
      const visitingLine = visiting
        .map(
          (k) =>
            `<span class="stadium-tooltip__pill" style="--accent:${TEAMS[k].accent}">${TEAMS[k].abbr}</span>`,
        )
        .join("");
      return {
        wiki: venue.wiki,
        bodyHTML: `
          <h3 class="stadium-tooltip__title">${venue.name}</h3>
          <div class="stadium-tooltip__teams">
            <span class="stadium-tooltip__intl-badge">International venue</span>
          </div>
          <div class="stadium-tooltip__city">${venue.city}</div>
          ${factsHTML(venue)}
          <div class="stadium-tooltip__visitors">
            <span class="stadium-tooltip__visitors-label">Hosting</span>
            ${visitingLine}
          </div>
        `,
      };
    }

    return null;
  }

  function factsHTML(record) {
    const rows = [];
    if (record.capacity) {
      rows.push(`<dt>Capacity</dt><dd>${numberFormatter.format(record.capacity)}</dd>`);
    }
    if (record.opened) {
      rows.push(`<dt>Opened</dt><dd>${record.opened}</dd>`);
    }
    if (record.roof) {
      rows.push(`<dt>Roof</dt><dd>${record.roof}</dd>`);
    }
    if (rows.length === 0) return "";
    return `<dl class="stadium-tooltip__facts">${rows.join("")}</dl>`;
  }

  function setHover(hit) {
    if (!hit) {
      clearTimers();
      if (anchor) scheduleHide();
      else currentHover = null;
      return;
    }
    const userData = hit.object.userData;
    if (currentHover === userData) {
      // Cancel any pending hide so a quick cursor re-entry stays shown. Do
      // NOT touch showTimer here — pointermove fires densely while the cursor
      // is on a marker, and resetting the show delay would prevent the
      // tooltip from ever appearing.
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      return;
    }

    const content = buildContent(userData);
    if (!content) {
      scheduleHide();
      return;
    }

    currentHover = userData;
    clearTimers();
    showTimer = setTimeout(() => {
      render(content, hit);
      show();
    }, anchor ? 0 : SHOW_DELAY_MS);
  }

  function scheduleHide() {
    clearTimers();
    hideTimer = setTimeout(hide, HIDE_DELAY_MS);
  }

  function clear() {
    clearTimers();
    hide();
  }

  function place() {
    if (!anchor) return;
    const globeGroup = getGlobeGroup?.();

    anchor.mesh.getWorldPosition(worldPos);
    if (globeGroup) globeGroup.getWorldPosition(globeOrigin);

    if (!isFrontOfSphere(worldPos, globeOrigin, camera.position)) {
      hide();
      return;
    }

    screenPos.copy(worldPos).project(camera);
    const rect = getCanvasRect();
    const x = rect.left + ((screenPos.x + 1) / 2) * rect.width;
    const y = rect.top + ((-screenPos.y + 1) / 2) * rect.height;

    const halfWidth = tipWidth / 2;

    let placeX = x;
    let placeY = y;
    let translateY = -100;

    if (y - tipHeight - VIEWPORT_PADDING < 0) {
      translateY = 0;
      placeY = y + MARKER_GAP_PX;
    } else {
      placeY = y - MARKER_GAP_PX;
    }

    if (placeX - halfWidth < VIEWPORT_PADDING) {
      placeX = halfWidth + VIEWPORT_PADDING;
    } else if (placeX + halfWidth > window.innerWidth - VIEWPORT_PADDING) {
      placeX = window.innerWidth - halfWidth - VIEWPORT_PADDING;
    }

    root.style.transform = `translate(-50%, ${translateY}%)`;
    root.style.left = `${placeX}px`;
    root.style.top = `${placeY}px`;
  }

  return {
    setHover,
    clear,
    updatePosition: place,
    isVisible: () => root.dataset.show === "true",
  };
}
