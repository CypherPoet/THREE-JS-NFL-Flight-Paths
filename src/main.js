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
  SCHEDULES,
  DEFAULT_SEASON,
} from "./schedule.js";
import {
  buildTeamPanel,
  wireSelectAllNone,
  updateHeaderMetrics,
  dismissLoading,
} from "./ui.js";
import { createTooltip } from "./tooltip.js";
import { isFrontOfSphere } from "./geo.js";
import { THEMES, getInitialTheme, persistTheme } from "./themes.js";

const canvas = document.getElementById("scene-canvas");

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

// ── Build the world ─────────────────────────────────────────────
let globe = null;
let currentFlightPaths = null;
let currentPanel = null;
let currentSeason = DEFAULT_SEASON;

// ── Stadium tooltip + hover raycaster ───────────────────────────
function teamIsActive(teamKey) {
  return currentPanel ? currentPanel.active.has(teamKey) : true;
}

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
  isTeamActive: teamIsActive,
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
  });
  scene.add(globe.group);

  // Frame the contiguous US (≈ 39°N, 96°W) at view centre.
  globe.group.rotation.y = 0.1;
  globe.group.rotation.x = 0.58;

  const listEl = document.getElementById("team-list");
  const sublabelEl = document.getElementById("season-sublabel");

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
    currentFlightPaths = createFlightPaths(legs, THEMES[currentThemeName]);
    globe.group.add(currentFlightPaths.group);

    currentPanel = buildTeamPanel({
      summary,
      listEl,
      onChange: (active) => {
        applyTeamFilter(currentFlightPaths, active);
        updateHeaderMetrics({ active, summary });
        updateHover();
      },
    });
    wireSelectAllNone(currentPanel);
    updateHeaderMetrics({ active: currentPanel.active, summary });
  }

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
    });
  }

  // ── Theme toggle wiring ────────────────────────────────────
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = currentThemeName === "light" ? "dark" : "light";
    setTheme(next);
  });

  dismissLoading();
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
function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();
  controls.update(delta);
  if (currentFlightPaths) tickTravelers(currentFlightPaths, elapsed);
  if (tooltip.isVisible()) tooltip.updatePosition();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  refreshCanvasRect();
});

start().catch((err) => {
  console.error("Failed to start scene:", err);
  const loading = document.getElementById("loading");
  if (loading) {
    loading.querySelector("span").textContent = "Failed to load — see console";
  }
});

animate();
