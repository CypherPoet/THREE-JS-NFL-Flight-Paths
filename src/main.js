import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createGlobe, applyThemeToGlobe } from "./globe.js";
import {
  createFlightPaths,
  applyTeamFilter,
  tickTravelers,
  applyThemeToPaths,
} from "./paths.js";
import {
  buildTravelLegs,
  summariseByTeam,
  summariseInternational,
  SCHEDULES,
  DEFAULT_SEASON,
} from "./schedule.js";
import {
  buildTeamPanel,
  updateHeaderMetrics,
  dismissLoading,
  wireMethodologyModal,
} from "./ui.js";
import { wireMileageModal } from "./mileage-modal.js";
import { createTooltip } from "./tooltip.js";
import { isFrontOfSphere } from "./geo.js";
import { THEMES, getInitialTheme, persistTheme } from "./themes.js";
import { TEAM_KEYS } from "./data/teams.js";

const canvas = document.getElementById("scene-canvas");

// ── URL state ───────────────────────────────────────────────────
// Round-trip filter + season + camera through the URL so a link captures the
// scene the user assembled. `teams=` is omitted when all 32 are active so the
// default URL stays clean; `view=` is omitted when the camera sits at its
// boot framing within rounding tolerance. Writes go through replaceState so
// rotation/filter changes don't pollute history.
const urlParams = new URLSearchParams(window.location.search);

function parseTeamsParam(raw) {
  if (raw === null) return null;
  if (raw === "none") return new Set();
  if (raw === "all") return new Set(TEAM_KEYS);
  const teamSet = new Set(TEAM_KEYS);
  const picked = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((k) => teamSet.has(k));
  return new Set(picked);
}

function parseSeasonParam(raw) {
  if (raw && Object.prototype.hasOwnProperty.call(SCHEDULES, raw)) return raw;
  return null;
}

function parseViewParam(raw) {
  if (!raw) return null;
  const parts = raw.split(",").map((s) => Number.parseFloat(s));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return { theta: parts[0], phi: parts[1], r: parts[2] };
}

const urlTeams = parseTeamsParam(urlParams.get("teams"));
const urlSeason = parseSeasonParam(urlParams.get("season"));
const urlView = parseViewParam(urlParams.get("view"));

// ── Display-font thesis exploration ────────────────────────────
// `?display=<key>` swaps the H1 / display family to a candidate that
// might fuse aviation-chart authority with broadcast-graphic register.
// Fonts load lazily from Google Fonts only when the param is present, so
// the default page stays on the existing self-hosted Unbounded.
const DISPLAY_VARIANTS = {
  geist: {
    label: "Geist (single family)",
    cssStack: '"Geist", system-ui, sans-serif',
    googleQuery: null,
    h1Weight: 800,
    h1Letterspacing: "-0.026em",
  },
  "big-shoulders": {
    label: "Big Shoulders Display",
    cssStack: '"Big Shoulders Display", "Unbounded", system-ui, sans-serif',
    googleQuery: "Big+Shoulders+Display:wght@700",
    h1Weight: 700,
    h1Letterspacing: "-0.012em",
  },
  bricolage: {
    label: "Bricolage Grotesque",
    cssStack: '"Bricolage Grotesque", "Unbounded", system-ui, sans-serif',
    googleQuery: "Bricolage+Grotesque:wght@700",
    h1Weight: 700,
    h1Letterspacing: "-0.022em",
  },
  "funnel-display": {
    label: "Funnel Display",
    cssStack: '"Funnel Display", "Unbounded", system-ui, sans-serif',
    googleQuery: "Funnel+Display:wght@700",
    h1Weight: 700,
    h1Letterspacing: "-0.018em",
  },
};

const urlDisplay = urlParams.get("display");
if (urlDisplay && DISPLAY_VARIANTS[urlDisplay]) {
  const variant = DISPLAY_VARIANTS[urlDisplay];
  document.documentElement.dataset.display = urlDisplay;
  if (variant.googleQuery) {
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.gstatic.com";
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = `https://fonts.googleapis.com/css2?family=${variant.googleQuery}&display=swap`;
    document.head.appendChild(fontLink);
  }
}

// Serializers. Each writes its slice into a shared mutable URLSearchParams
// pulled fresh from window.location at call time, so they compose without
// stomping each other when filter + season + camera change in the same tick.
// Swap the bottom hint copy when the user filters down to no teams (the globe
// goes empty otherwise, with no copy to explain it). All other selection
// states keep the default canvas-gesture hint.
const DEFAULT_HINT =
  "Drag to rotate · scroll to zoom · hover a stadium · click a team to isolate";
const EMPTY_HINT = "No teams selected. Pick All, AFC, or a division to bring arcs back.";

function updateHintForSelection(active) {
  const hint = document.getElementById("hint");
  if (!hint) return;
  hint.textContent = active.size === 0 ? EMPTY_HINT : DEFAULT_HINT;
}

function writeUrlState({ active, season, controls }) {
  const params = new URLSearchParams(window.location.search);

  if (active.size === TEAM_KEYS.length) params.delete("teams");
  else if (active.size === 0) params.set("teams", "none");
  else params.set("teams", [...active].join(","));

  if (season === DEFAULT_SEASON) params.delete("season");
  else params.set("season", season);

  if (controls) {
    const theta = controls.getAzimuthalAngle();
    const phi = controls.getPolarAngle();
    const r = controls.getDistance();
    params.set(
      "view",
      `${theta.toFixed(3)},${phi.toFixed(3)},${r.toFixed(2)}`,
    );
  }

  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

// Theme is resolved before paint by the inline script in index.html; we just
// read it here so the scene's first frame is already in the right palette.
let currentThemeName = document.documentElement.dataset.theme || getInitialTheme();
document.documentElement.dataset.theme = currentThemeName;

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEMES[currentThemeName].sceneBg);

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.01,
  50,
);
camera.position.set(0, 0.4, 3.6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// ── Lighting ────────────────────────────────────────────────────
const lights = makeLights(THEMES[currentThemeName]);
for (const light of lights.all) scene.add(light);

function makeLights(theme) {
  const ambient = new THREE.HemisphereLight(
    theme.ambientSky,
    theme.ambientGround,
    theme.ambientIntensity,
  );

  const key = new THREE.DirectionalLight(theme.keyColor, theme.keyIntensity);
  key.position.set(-2.6, 3.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0006;

  const rim = new THREE.DirectionalLight(theme.rimColor, theme.rimIntensity);
  rim.position.set(3.0, 1.5, -2.5);

  const fill = new THREE.DirectionalLight(theme.fillColor, theme.fillIntensity);
  fill.position.set(0.5, -1.6, 2.0);

  return { ambient, key, rim, fill, all: [ambient, key, rim, fill] };
}

function applyThemeToLights(theme) {
  lights.ambient.color.set(theme.ambientSky);
  lights.ambient.groundColor.set(theme.ambientGround);
  lights.ambient.intensity = theme.ambientIntensity;
  lights.key.color.set(theme.keyColor);
  lights.key.intensity = theme.keyIntensity;
  lights.rim.color.set(theme.rimColor);
  lights.rim.intensity = theme.rimIntensity;
  lights.fill.color.set(theme.fillColor);
  lights.fill.intensity = theme.fillIntensity;
}

// ── Controls ────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.55;
controls.enablePan = false;
controls.minDistance = 1.6;
controls.maxDistance = 5.5;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = Math.PI - 0.45;

// Restore camera from `view=` if present (clamped by OrbitControls' own
// min/max distance + polar limits when update() runs).
if (urlView) {
  const spherical = new THREE.Spherical(urlView.r, urlView.phi, urlView.theta);
  camera.position.setFromSpherical(spherical).add(controls.target);
  controls.update();
}

// ── Build the world ─────────────────────────────────────────────
let globe = null;
let currentFlightPaths = null;
let currentPanel = null;
let currentSeason = urlSeason ?? DEFAULT_SEASON;

// ── Stadium tooltip + hover raycaster ───────────────────────────
// Cache the canvas rect — both the tooltip's per-frame anchoring and the
// pointermove handler read it, and getBoundingClientRect forces layout.
let canvasRect = renderer.domElement.getBoundingClientRect();
function refreshCanvasRect() {
  canvasRect = renderer.domElement.getBoundingClientRect();
}

const tooltip = createTooltip({
  camera,
  getGlobeGroup: () => globe?.group ?? null,
  getCanvasRect: () => canvasRect,
});
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const hitWorld = new THREE.Vector3();
const globeWorld = new THREE.Vector3();
let pointerInside = false;

function isFrontFacing(hit) {
  if (!globe) return true;
  hit.object.getWorldPosition(hitWorld);
  globe.group.getWorldPosition(globeWorld);
  return isFrontOfSphere(hitWorld, globeWorld, camera.position);
}

function updateHover() {
  if (!currentFlightPaths || !pointerInside) {
    tooltip.setHover(null);
    return;
  }
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(
    currentFlightPaths.hitTestGroup.children,
    false,
  );
  tooltip.setHover(hits.find(isFrontFacing) ?? null);
}

renderer.domElement.addEventListener("pointermove", (event) => {
  pointerNDC.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
  pointerNDC.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
  pointerInside = true;
  updateHover();
});

renderer.domElement.addEventListener("pointerleave", () => {
  pointerInside = false;
  tooltip.setHover(null);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") tooltip.clear();
});

async function start() {
  const TOPO_URL = new URL(
    "../data/countries-110m.json",
    import.meta.url,
  ).toString();

  globe = await createGlobe({
    topoUrl: TOPO_URL,
    theme: THEMES[currentThemeName],
    keyLightPosition: lights.key.position,
  });
  scene.add(globe.group);

  // Frame the contiguous US (≈ 39°N, 96°W) at view centre.
  globe.group.rotation.y = 0.1;
  globe.group.rotation.x = 0.58;

  const listEl = document.getElementById("team-list");
  const sublabelEl = document.getElementById("season-sublabel");
  const mileageModal = wireMileageModal();

  function loadSeason(seasonKey) {
    const meta = SCHEDULES[seasonKey];
    if (!meta) return;

    currentSeason = seasonKey;
    sublabelEl.textContent = `${meta.label} · ${meta.sublabel}`;

    if (currentFlightPaths) {
      globe.group.remove(currentFlightPaths.group);
      currentFlightPaths.group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const legs = buildTravelLegs(meta.games);
    const summary = summariseByTeam(legs);
    const intl = summariseInternational(summary);
    currentFlightPaths = createFlightPaths(legs, THEMES[currentThemeName]);
    globe.group.add(currentFlightPaths.group);
    if (prefersReducedMotion) tickTravelers(currentFlightPaths, 0);

    currentPanel = buildTeamPanel({
      summary,
      intl,
      listEl,
      onChange: (active) => {
        applyTeamFilter(currentFlightPaths, active);
        updateHover();
        writeUrlState({ active, season: currentSeason, controls });
        updateHintForSelection(active);
      },
    });

    // Apply `teams=` from the URL once the panel is built. Mutating the
    // active Set directly + calling refresh() drives the same code path a
    // click would (applyActiveState → updatePresetState → onChange).
    if (initialUrlTeamsApplied === false && urlTeams) {
      currentPanel.active.clear();
      for (const k of urlTeams) currentPanel.active.add(k);
      currentPanel.refresh();
      initialUrlTeamsApplied = true;
    }

    updateHeaderMetrics({ summary, intl });
    mileageModal.setSummary(summary, `${meta.label} · regular-season totals`);
    updateHintForSelection(currentPanel.active);
  }

  // Sync season-switch button data-active to whatever URL state resolved to,
  // before the wiring loop below caches the initial active button.
  for (const btn of document.querySelectorAll(".season-switch__button")) {
    btn.dataset.active = btn.dataset.season === currentSeason ? "true" : "false";
  }

  let initialUrlTeamsApplied = false;
  loadSeason(currentSeason);

  // ── Season switch wiring ───────────────────────────────────
  for (const btn of document.querySelectorAll(".season-switch__button")) {
    btn.addEventListener("click", () => {
      const target = btn.dataset.season;
      if (target === currentSeason) return;
      for (const other of document.querySelectorAll(".season-switch__button")) {
        other.dataset.active = other === btn ? "true" : "false";
      }
      loadSeason(target);
      writeUrlState({ active: currentPanel.active, season: target, controls });
    });
  }

  // ── Camera → URL (debounced) ───────────────────────────────
  // OrbitControls fires 'change' on every damped frame (~60Hz). Debounce so a
  // single rotate/zoom gesture writes once when motion settles, not 60 times
  // per second mid-drag.
  let cameraWriteTimer = 0;
  controls.addEventListener("change", () => {
    window.clearTimeout(cameraWriteTimer);
    cameraWriteTimer = window.setTimeout(() => {
      if (!currentPanel) return;
      writeUrlState({ active: currentPanel.active, season: currentSeason, controls });
    }, 220);
  });

  // ── Theme toggle wiring ────────────────────────────────────
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = currentThemeName === "light" ? "dark" : "light";
    setTheme(next);
  });

  wireMethodologyModal();

  if (urlDisplay && DISPLAY_VARIANTS[urlDisplay]) {
    buildDisplayBanner(urlDisplay);
  }

  dismissLoading();
}

// ── Display-font preview banner ──────────────────────────────
// Renders a chip at bottom-center listing the active display variant and
// links to switch between every candidate (plus a "Default" link that
// drops the param). Mirrors the in-session palette switcher shape.
function buildDisplayBanner(activeKey) {
  const banner = document.createElement("div");
  banner.id = "display-banner";
  banner.setAttribute("role", "complementary");
  banner.setAttribute("aria-label", "Display-font preview");

  const label = document.createElement("span");
  label.className = "display-banner__label";
  label.textContent = `Display preview · ${DISPLAY_VARIANTS[activeKey].label}`;
  banner.appendChild(label);

  const switcher = document.createElement("span");
  switcher.className = "display-banner__switcher";
  for (const key of Object.keys(DISPLAY_VARIANTS)) {
    if (key === activeKey) continue;
    const link = document.createElement("a");
    const url = new URL(window.location.href);
    url.searchParams.set("display", key);
    link.href = url.toString();
    link.textContent = DISPLAY_VARIANTS[key].label;
    link.className = "display-banner__link";
    switcher.appendChild(link);
  }
  const defaultLink = document.createElement("a");
  const defaultUrl = new URL(window.location.href);
  defaultUrl.searchParams.delete("display");
  defaultLink.href = defaultUrl.toString();
  defaultLink.textContent = "Default (Unbounded)";
  defaultLink.className = "display-banner__link display-banner__link--default";
  switcher.appendChild(defaultLink);

  banner.appendChild(switcher);
  document.body.appendChild(banner);
}

function setTheme(name) {
  if (name === currentThemeName) return;
  currentThemeName = name;
  document.documentElement.dataset.theme = name;
  persistTheme(name);

  const theme = THEMES[name];
  scene.background = new THREE.Color(theme.sceneBg);
  applyThemeToLights(theme);
  if (globe) applyThemeToGlobe(globe, theme);
  if (currentFlightPaths) applyThemeToPaths(currentFlightPaths, theme);
}

// ── Animation loop ──────────────────────────────────────────────
const timer = new THREE.Timer();
timer.connect(document); // pause delta accumulation when tab is hidden

// Respect prefers-reduced-motion for the WebGL traveler loop. The CSS rule
// only stops DOM transitions; travelers spin in their own rAF until we gate
// them here. When reduced motion is on we still position them once (at
// elapsed=0) so they stay visible as static markers along each arc.
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener("change", (event) => {
  prefersReducedMotion = event.matches;
  if (prefersReducedMotion && currentFlightPaths) {
    tickTravelers(currentFlightPaths, 0);
  }
});

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();
  controls.update(delta);
  if (currentFlightPaths && !prefersReducedMotion) {
    tickTravelers(currentFlightPaths, elapsed);
  }
  if (tooltip.isVisible()) tooltip.updatePosition();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  refreshCanvasRect();
  // LineMaterial computes screen-space pixel width from the resolution
  // uniform, so every arc needs a fresh viewport on resize or the lines
  // render at the wrong thickness.
  if (currentFlightPaths) {
    for (const { line } of currentFlightPaths.arcRecords) {
      line.material.resolution.set(window.innerWidth, window.innerHeight);
    }
  }
});

start().catch((err) => {
  console.error("Failed to start scene:", err);
  const loading = document.getElementById("loading");
  if (loading) {
    loading.querySelector("span").textContent =
      "Couldn't load the globe. Refresh to try again or check your network.";
  }
});

animate();
