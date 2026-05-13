import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createGlobe } from "./globe.js";
import { createFlightPaths, applyTeamFilter } from "./paths.js";
import { buildTravelLegs, summariseByTeam } from "./schedule.js";
import {
  buildTeamPanel,
  wireSelectAllNone,
  updateHeaderMetrics,
  dismissLoading,
} from "./ui.js";

const canvas = document.getElementById("scene-canvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefe9dd);

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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ── Lighting ────────────────────────────────────────────────────
// Studio-style: bright neutral key from upper-left, soft cool fill, soft rim.
const ambient = new THREE.HemisphereLight(0xffffff, 0xb8b09c, 1.05);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 0.85);
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
scene.add(key);

const rim = new THREE.DirectionalLight(0xeef1f5, 0.55);
rim.position.set(3.0, 1.5, -2.5);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xfff2e1, 0.25);
fill.position.set(0.5, -1.6, 2.0);
scene.add(fill);

// ── Controls ────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.55;
controls.enablePan = false;
controls.minDistance = 1.6;
controls.maxDistance = 5.5;
// Don't let users tip the globe under the shadow.
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = Math.PI - 0.45;

// ── Build the world ─────────────────────────────────────────────
async function start() {
  const TOPO_URL = new URL(
    "../data/countries-110m.json",
    import.meta.url,
  ).toString();

  const globe = await createGlobe({ topoUrl: TOPO_URL });
  scene.add(globe.group);

  // Initial tilt — frame the continental US so opening view shows most teams.
  globe.group.rotation.y = 0;
  globe.group.rotation.x = -0.18;

  const legs = buildTravelLegs();
  const summary = summariseByTeam(legs);
  const flightPaths = createFlightPaths(legs);
  globe.group.add(flightPaths.group);

  // ── UI wiring ─────────────────────────────────────────────────
  const listEl = document.getElementById("team-list");
  const panel = buildTeamPanel({
    summary,
    listEl,
    onChange: (active) => {
      applyTeamFilter(flightPaths, active);
      updateHeaderMetrics({ active, summary });
    },
  });
  wireSelectAllNone(panel);
  updateHeaderMetrics({ active: panel.active, summary });

  dismissLoading();
}

// ── Animation loop ──────────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

start().catch((err) => {
  console.error("Failed to start scene:", err);
  const loading = document.getElementById("loading");
  if (loading) {
    loading.querySelector("span").textContent = "Failed to load — see console";
  }
});

animate();
