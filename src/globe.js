import * as THREE from "three";
import * as topojson from "topojson-client";
import { geoPath, geoEquirectangular } from "d3-geo";
import { GLOBE_RADIUS, latLonToVec3 } from "./geo.js";

// Build the off-white globe + country outlines + ground shadow disc.
// The land shapes are painted onto a 2D equirectangular canvas which is then
// used as both a subtle colour map *and* a bump map on the sphere — this gives
// the reference image's subtle land-relief without any triangulation artefacts.
export async function createGlobe({ topoUrl }) {
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

  // ── 1. Painted equirectangular canvas → diffuse + bump maps ──
  const { colorTexture, bumpTexture } = paintWorldCanvas(countries, meshLines);

  // ── 2. Clay sphere ───────────────────────────────────────────
  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 256, 256);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.012,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.name = "globe-sphere";
  group.add(sphere);

  // Soft inner limb darkening.
  const limbGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 64, 64);
  const limbMat = new THREE.MeshBasicMaterial({
    color: 0xc4b89f,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const limb = new THREE.Mesh(limbGeo, limbMat);
  group.add(limb);

  // ── 3. Crisp 3D country outlines for the silhouette near the limb ──
  const lineGroup = countryLines(meshLines);
  lineGroup.name = "country-lines";
  group.add(lineGroup);

  // ── 4. Ground shadow disc ────────────────────────────────────
  const shadow = makeGroundShadow();
  group.add(shadow);

  return { group, sphere, lineGroup };
}

// Render the world map flat with d3-geo, then bake to two textures:
//   • a colour map that gives land a touch more warmth than the ocean
//   • a bump map where land is brighter than ocean → subtle relief
function paintWorldCanvas(countries, meshLines) {
  const width = 4096;
  const height = 2048;

  // ── Colour map ──────────────────────────────────────────────
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cctx = colorCanvas.getContext("2d");

  // Ocean fill — almost-white off-white (slightly cooler).
  cctx.fillStyle = "#f4eee0";
  cctx.fillRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const pathColor = geoPath(projection, cctx);

  // Land fill — a faint warm cream so countries are visible but subtle.
  cctx.fillStyle = "#ece4d1";
  cctx.beginPath();
  pathColor({ type: "FeatureCollection", features: countries.features });
  cctx.fill();

  // Country borders — soft brown.
  cctx.strokeStyle = "rgba(74, 66, 52, 0.6)";
  cctx.lineWidth = 1.6;
  cctx.beginPath();
  pathColor(meshLines);
  cctx.stroke();

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.anisotropy = 8;
  colorTexture.wrapS = THREE.RepeatWrapping;

  // ── Bump map ────────────────────────────────────────────────
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext("2d");
  bctx.fillStyle = "#1a1a1a"; // ocean = low
  bctx.fillRect(0, 0, width, height);

  const pathBump = geoPath(projection, bctx);
  bctx.fillStyle = "#d0d0d0"; // land = raised
  bctx.beginPath();
  pathBump({ type: "FeatureCollection", features: countries.features });
  bctx.fill();

  // Slight inner shadow at the coastline to emphasise the relief.
  bctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  bctx.lineWidth = 0.8;
  bctx.beginPath();
  pathBump(meshLines);
  bctx.stroke();

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.anisotropy = 8;
  bumpTexture.wrapS = THREE.RepeatWrapping;

  return { colorTexture, bumpTexture };
}

function countryLines(meshGeometry) {
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
    color: 0x5d503e,
    transparent: true,
    opacity: 0.55,
  });

  return new THREE.LineSegments(geometry, material);
}

function makeGroundShadow() {
  // Soft pool of shadow under the globe — what really sells the 3D appearance
  // in the reference image. Painted as a radial gradient onto a plane.
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
  grad.addColorStop(0.0, "rgba(28, 26, 22, 0.6)");
  grad.addColorStop(0.25, "rgba(28, 26, 22, 0.35)");
  grad.addColorStop(0.55, "rgba(28, 26, 22, 0.12)");
  grad.addColorStop(1.0, "rgba(28, 26, 22, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geom = new THREE.PlaneGeometry(GLOBE_RADIUS * 4.6, GLOBE_RADIUS * 4.6);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -GLOBE_RADIUS * 1.04;
  mesh.renderOrder = -1;
  return mesh;
}
