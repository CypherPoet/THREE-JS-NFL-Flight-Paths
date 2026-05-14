import * as THREE from "three";
import { TEAMS, INTERNATIONAL_VENUES } from "./data/teams.js";

const SHOW_DELAY_MS = 90;
const HIDE_DELAY_MS = 70;
const VIEWPORT_PADDING = 12;

// Lazy thumbnail fetcher backed by the Wikipedia REST summary endpoint. We
// cache by article slug so re-hovering the same venue is instant. A failed
// fetch (404, network error, slug renamed) is also cached so we don't keep
// retrying — the tooltip just renders without a photo.
const photoCache = new Map();
const numberFormatter = new Intl.NumberFormat("en-US");

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

export function createTooltip({ camera, renderer, getGlobeGroup }) {
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
  let currentHover = null; // last hovered hit userData
  let currentToken = 0;    // bumped on every hover change to invalidate stale fetches
  let anchor = null;       // { mesh, key } currently being tracked

  // Cached so we can hide if the marker swings to the back of the globe.
  const screenPos = new THREE.Vector3();
  const worldPos = new THREE.Vector3();
  const globeOrigin = new THREE.Vector3(); // markers parented to globe.group, origin at scene root

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
      if (token !== currentToken) return; // hovered something else mid-fetch
      if (url) {
        photoImg.src = url;
        photo.dataset.state = "ready";
      } else {
        photo.dataset.state = "empty";
      }
    });

    anchor = { mesh: hit.object, userData: hit.object.userData };
    // Place the tooltip before the opacity transition starts so it never
    // flashes from the previous position.
    place();
  }

  function buildContent(userData, isActive) {
    if (userData.kind === "home") {
      // Aggregate co-located teams (LAR/LAC, NYG/NYJ).
      const teams = userData.teams.filter(isActive);
      if (teams.length === 0) return null;
      const primary = TEAMS[teams[0]];
      const teamsLine = teams
        .map((k) => `<span class="stadium-tooltip__team" style="--accent:${TEAMS[k].accent}">${TEAMS[k].name}</span>`)
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

    if (userData.kind === "international") {
      const venue = INTERNATIONAL_VENUES[userData.venueKey];
      if (!venue) return null;
      const visiting = [...userData.teams].filter(isActive);
      if (visiting.length === 0) return null;
      const visitingLine = visiting
        .map((k) => `<span class="stadium-tooltip__pill" style="--accent:${TEAMS[k].accent}">${TEAMS[k].abbr}</span>`)
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

  function setHover(hit, isActive) {
    if (!hit) {
      // Leaving a marker (or hovering empty space) — drop any pending show
      // and schedule the hide so a quick re-entry can cancel it.
      clearTimers();
      if (anchor) scheduleHide();
      else currentHover = null;
      return;
    }
    const userData = hit.object.userData;
    if (currentHover === userData) {
      // Same anchor as before — cancel any pending hide so a quick cursor
      // re-entry stays shown. Crucially do NOT touch showTimer here: every
      // pointermove on a hovered marker would otherwise reset the 90 ms
      // delay and the tooltip would never appear.
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      return;
    }

    const content = buildContent(userData, isActive);
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

  // Project the anchored marker's world position to screen coords; flip the
  // tooltip across the cursor if it would overflow viewport edges. Hide it
  // when the anchor swings around to the far side of the globe.
  function place() {
    if (!anchor) return;
    const globeGroup = getGlobeGroup ? getGlobeGroup() : null;

    anchor.mesh.getWorldPosition(worldPos);
    if (globeGroup) globeGroup.getWorldPosition(globeOrigin);

    // Visible iff the marker's outward normal (M − G) points the same way as
    // the camera vector (C − G) — same sign of the dot product.
    const facing =
      (worldPos.x - globeOrigin.x) * (camera.position.x - globeOrigin.x) +
      (worldPos.y - globeOrigin.y) * (camera.position.y - globeOrigin.y) +
      (worldPos.z - globeOrigin.z) * (camera.position.z - globeOrigin.z);
    if (facing < 0) {
      // Marker is on the far side of the globe — hide without delay.
      hide();
      return;
    }

    screenPos.copy(worldPos).project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const x = rect.left + ((screenPos.x + 1) / 2) * rect.width;
    const y = rect.top + ((-screenPos.y + 1) / 2) * rect.height;

    // Default: tooltip sits above the marker, centred. Flip below if it
    // would clip the top of the viewport. Clamp horizontally.
    const tipRect = root.getBoundingClientRect();
    const halfWidth = tipRect.width / 2;
    const tipHeight = tipRect.height;

    let placeX = x;
    let placeY = y;
    let translateY = -100;

    if (y - tipHeight - VIEWPORT_PADDING < 0) {
      translateY = 0;
      placeY = y + 14;
    } else {
      placeY = y - 14;
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
