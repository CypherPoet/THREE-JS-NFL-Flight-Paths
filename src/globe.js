import * as THREE from "three";
import * as topojson from "topojson-client";
import { geoPath, geoEquirectangular } from "d3-geo";
import { GLOBE_RADIUS, latLonToVec3 } from "./geo.js";

// Build the off-white / midnight globe + country outlines + ground shadow disc.
// The land shapes are painted onto a 2D equirectangular canvas which is then
// used as both a subtle colour map *and* a bump map on the sphere — this gives
// real country relief without any triangulation artefacts.
export async function createGlobe({ topoUrl, theme }) {
  const group = new THREE.Group();
  group.name = "globe";

  // ── Topology ─────────────────────────────────────────────────
  const response = await fetch(topoUrl);
  if (!response.ok) {
    throw new Error(`Could not load topojson: ${response.status}`);
  }
  const topo = await response.json();
  const objectKey =
    "countries" in topo.objects ? "countries" : Object.keys(topo.objects)[0];
  const countries = topojson.feature(topo, topo.objects[objectKey]);
  const meshLines = topojson.mesh(topo, topo.objects[objectKey]);

  const cache = { countries, meshLines };

  // ── Painted canvas → diffuse + bump maps ─────────────────────
  const { colorTexture, bumpTexture } = paintWorldCanvas(
    countries,
    meshLines,
    theme,
  );

  // ── Clay sphere ──────────────────────────────────────────────
  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 256, 256);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: theme.sphereColor,
    roughness: 0.95,
    metalness: 0.0,
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: theme.bumpScale,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.name = "globe-sphere";
  group.add(sphere);

  // ── Soft inner limb darkening ────────────────────────────────
  const limbGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 64, 64);
  const limbMat = new THREE.MeshBasicMaterial({
    color: theme.limbColor,
    transparent: true,
    opacity: theme.limbOpacity,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const limb = new THREE.Mesh(limbGeo, limbMat);
  limb.name = "globe-limb";
  group.add(limb);

  // ── Crisp 3D country outlines (silhouette near the limb) ────
  const lineGroup = countryLines(meshLines, theme);
  lineGroup.name = "country-lines";
  group.add(lineGroup);

  // ── Ground shadow disc ───────────────────────────────────────
  const shadow = makeGroundShadow(theme);
  group.add(shadow);

  return {
    group,
    sphere,
    lineGroup,
    limb,
    shadow,
    cache,
  };
}

// Repaint everything theme-dependent on the existing globe meshes — used
// when the user flips the dark-mode toggle. Avoids rebuilding geometry.
export function applyThemeToGlobe(globe, theme) {
  const { sphere, lineGroup, limb, shadow, cache } = globe;

  // Repaint the canvases and swap textures on the sphere material.
  const { colorTexture, bumpTexture } = paintWorldCanvas(
    cache.countries,
    cache.meshLines,
    theme,
  );
  sphere.material.color.set(theme.sphereColor);
  sphere.material.map?.dispose();
  sphere.material.bumpMap?.dispose();
  sphere.material.map = colorTexture;
  sphere.material.bumpMap = bumpTexture;
  sphere.material.bumpScale = theme.bumpScale;
  sphere.material.needsUpdate = true;

  // Country line colour + opacity.
  lineGroup.material.color.set(theme.countryLineColor);
  lineGroup.material.opacity = theme.countryLineOpacity;

  // Limb tint.
  limb.material.color.set(theme.limbColor);
  limb.material.opacity = theme.limbOpacity;

  // Ground shadow gets a fresh canvas because the gradient stops change.
  const newShadowTexture = makeShadowTexture(theme);
  shadow.material.map?.dispose();
  shadow.material.map = newShadowTexture;
  shadow.material.needsUpdate = true;
}

function paintWorldCanvas(countries, meshLines, theme) {
  const width = 4096;
  const height = 2048;

  // ── Colour map ──────────────────────────────────────────────
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cctx = colorCanvas.getContext("2d");

  cctx.fillStyle = theme.oceanFill;
  cctx.fillRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const pathColor = geoPath(projection, cctx);

  cctx.fillStyle = theme.landFill;
  cctx.beginPath();
  pathColor({ type: "FeatureCollection", features: countries.features });
  cctx.fill();

  cctx.strokeStyle = theme.borderStroke;
  cctx.lineWidth = theme.borderWidth;
  cctx.beginPath();
  pathColor(meshLines);
  cctx.stroke();

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.anisotropy = 8;
  colorTexture.wrapS = THREE.RepeatWrapping;

  // ── Bump map — punchier than before for visible land relief ──
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext("2d");
  bctx.fillStyle = theme.bumpOcean;
  bctx.fillRect(0, 0, width, height);

  const pathBump = geoPath(projection, bctx);
  bctx.fillStyle = theme.bumpLand;
  bctx.beginPath();
  pathBump({ type: "FeatureCollection", features: countries.features });
  bctx.fill();

  bctx.strokeStyle = theme.bumpCoast;
  bctx.lineWidth = 1.4;
  bctx.beginPath();
  pathBump(meshLines);
  bctx.stroke();

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.anisotropy = 8;
  bumpTexture.wrapS = THREE.RepeatWrapping;

  return { colorTexture, bumpTexture };
}

function countryLines(meshGeometry, theme) {
  // topojson.mesh() returns a bare GeoJSON geometry (no enclosing Feature).
  const positions = [];
  const consume = (coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      const a = latLonToVec3(coords[i][1], coords[i][0], GLOBE_RADIUS * 1.004);
      const b = latLonToVec3(
        coords[i + 1][1],
        coords[i + 1][0],
        GLOBE_RADIUS * 1.004,
      );
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };

  if (meshGeometry.type === "MultiLineString") {
    for (const line of meshGeometry.coordinates) consume(line);
  } else if (meshGeometry.type === "LineString") {
    consume(meshGeometry.coordinates);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  const material = new THREE.LineBasicMaterial({
    color: theme.countryLineColor,
    transparent: true,
    opacity: theme.countryLineOpacity,
  });

  return new THREE.LineSegments(geometry, material);
}

function makeShadowTexture(theme) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0.0, theme.groundShadow[0]);
  grad.addColorStop(0.25, theme.groundShadow[1]);
  grad.addColorStop(0.55, theme.groundShadow[2]);
  grad.addColorStop(1.0, theme.groundShadow[3]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGroundShadow(theme) {
  const geom = new THREE.PlaneGeometry(GLOBE_RADIUS * 4.6, GLOBE_RADIUS * 4.6);
  const mat = new THREE.MeshBasicMaterial({
    map: makeShadowTexture(theme),
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -GLOBE_RADIUS * 1.04;
  mesh.renderOrder = -1;
  return mesh;
}
