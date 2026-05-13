import * as THREE from "three";
import * as topojson from "topojson-client";
import { geoPath, geoEquirectangular } from "d3-geo";
import { GLOBE_RADIUS, latLonToVec3 } from "./geo.js";

// Build the off-white / midnight globe + country outlines + ground shadow disc.
// Country shapes are painted onto a 2D equirectangular canvas used as the
// sphere's diffuse map (with the borders strokes baked in). The sphere itself
// stays geometrically smooth — markers + arc dots sit cleanly on a perfect
// sphere instead of getting buried by displaced mountain ranges.
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

  // ── Painted canvas → themed diffuse map ──────────────────────
  const colorTexture = paintWorldCanvas(countries, meshLines, theme);

  // ── Clay sphere ──────────────────────────────────────────────
  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: theme.sphereColor,
    roughness: 0.95,
    metalness: 0.0,
    map: colorTexture,
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

  // ── Atmospheric Fresnel halo (subtle in light, prominent in dark) ──
  const atmosphere = makeAtmosphere(theme);
  group.add(atmosphere);

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
    atmosphere,
    shadow,
    cache,
  };
}

// Repaint everything theme-dependent on the existing globe meshes — used
// when the user flips the dark-mode toggle. Avoids rebuilding geometry.
export function applyThemeToGlobe(globe, theme) {
  const { sphere, lineGroup, limb, atmosphere, shadow, cache } = globe;

  const colorTexture = paintWorldCanvas(
    cache.countries,
    cache.meshLines,
    theme,
  );
  sphere.material.color.set(theme.sphereColor);
  sphere.material.map?.dispose();
  sphere.material.map = colorTexture;
  sphere.material.needsUpdate = true;

  // Atmosphere shader uniforms.
  atmosphere.material.uniforms.innerColor.value.set(theme.glowInnerColor);
  atmosphere.material.uniforms.outerColor.value.set(theme.glowOuterColor);
  atmosphere.material.uniforms.intensity.value = theme.glowIntensity;
  atmosphere.visible = theme.glowIntensity > 0;

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

  return colorTexture;
}

function makeAtmosphere(theme) {
  // Wide back-side shell with a two-stop Fresnel gradient: a hot near-white
  // edge hugging the planet's silhouette, fading through a saturated mid
  // blue, then softly to black. Mirrors low-orbit photos of Earth.
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.18, 96, 96);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      innerColor: { value: new THREE.Color(theme.glowInnerColor) },
      outerColor: { value: new THREE.Color(theme.glowOuterColor) },
      intensity: { value: theme.glowIntensity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 innerColor;
      uniform vec3 outerColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        // BackSide rendering: only the far hemisphere of the shell paints,
        // and the planet blocks everything inside its silhouette — what we
        // see is the annulus between r_planet and r_shell.
        //
        // For visible back-faces, dot(N, V) is in [-~0.55, 0]:
        //   ≈ 0 at the OUTER shell silhouette,
        //   ≈ -0.55 right where the annulus touches the planet (when shell ≈ 1.18 × planet).
        // We want the gradient bright near the planet, fading outward.
        float t = clamp(-dot(vNormal, vViewDir) / 0.55, 0.0, 1.0);
        float halo = pow(t, 0.7);                  // wide soft blue
        float hot  = smoothstep(0.65, 1.0, t);     // bright cyan-white edge
        vec3 color = mix(outerColor, innerColor, hot);
        float alpha = (halo * 0.7 + hot * 0.55) * intensity;
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "globe-atmosphere";
  mesh.visible = theme.glowIntensity > 0;
  return mesh;
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
