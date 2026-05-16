import * as THREE from "three";
import * as topojson from "topojson-client";
import { GLOBE_RADIUS, RELIEF_LIFT, latLonToVec3 } from "./geo.js";
import { makeContinentRelief } from "./relief.js";

// Default atmosphere light direction (world space). The dark-theme halo
// brightens toward this vector so the halo reads as light spilling from the
// key light side, not a uniform orbit ring. Kept in sync with main.js's key
// light position via createGlobe's `keyLightPosition` option.
const DEFAULT_LIGHT_DIR = new THREE.Vector3(-2.6, 3.4, 3.2).normalize();

// Build the off-white / midnight globe: a smooth ocean sphere with each
// landmass extruded as a slightly-elevated 3D plate (the "relief"), country
// borders etched as darker engravings sitting on top of the plate, plus
// atmosphere halo, limb darkening and ground shadow.
export async function createGlobe({ topoUrl, theme, keyLightPosition }) {
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

  // ── Smooth ocean sphere ──────────────────────────────────────
  // No diffuse map any more — landmasses are real 3D plates on top.
  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: theme.sphereColor,
    roughness: 0.95,
    metalness: 0.0,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.name = "globe-sphere";
  group.add(sphere);

  // ── Elevated continent plates (3D relief) ────────────────────
  const relief = makeContinentRelief({ countries, theme });
  relief.mesh.name = "continent-relief";
  group.add(relief.mesh);

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
  const lightDir = keyLightPosition
    ? new THREE.Vector3().copy(keyLightPosition).normalize()
    : DEFAULT_LIGHT_DIR.clone();
  const atmosphere = makeAtmosphere(theme, lightDir);
  group.add(atmosphere);

  // ── Limb vignette (framed-studio-shot edge darkening) ────────
  const vignette = makeLimbVignette(theme);
  group.add(vignette);

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
    relief,
    lineGroup,
    limb,
    atmosphere,
    vignette,
    shadow,
  };
}

// Repaint everything theme-dependent on the existing globe meshes — used
// when the user flips the dark-mode toggle. Avoids rebuilding geometry.
export function applyThemeToGlobe(globe, theme) {
  const { sphere, relief, lineGroup, limb, atmosphere, vignette, shadow } =
    globe;

  sphere.material.color.set(theme.sphereColor);
  sphere.material.needsUpdate = true;
  relief.applyTheme(theme);

  // Atmosphere shader uniforms.
  atmosphere.material.uniforms.innerColor.value.set(theme.glowInnerColor);
  atmosphere.material.uniforms.outerColor.value.set(theme.glowOuterColor);
  atmosphere.material.uniforms.intensity.value = theme.glowIntensity;
  atmosphere.visible = theme.glowIntensity > 0;

  // Limb vignette uniforms + visibility (skipped entirely when intensity is 0).
  vignette.material.uniforms.vignetteColor.value.set(theme.vignetteColor);
  vignette.material.uniforms.vignetteIntensity.value = theme.vignetteIntensity;
  vignette.visible = theme.vignetteIntensity > 0;

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

function makeAtmosphere(theme, lightDir) {
  // Wide back-side shell with a two-stop Fresnel gradient: a hot stadium-
  // cream edge hugging the planet's silhouette, fading through warm amber,
  // then softly out. The `lightDir` uniform biases the halo brightness
  // toward the lit hemisphere — so the warm spill reads as stadium lights
  // catching the limb, not a uniform "Earth from orbit" ring.
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.18, 96, 96);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      innerColor: { value: new THREE.Color(theme.glowInnerColor) },
      outerColor: { value: new THREE.Color(theme.glowOuterColor) },
      intensity: { value: theme.glowIntensity },
      lightDir: { value: lightDir.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        // World-space normal, used to bias the halo toward the lit side.
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 innerColor;
      uniform vec3 outerColor;
      uniform float intensity;
      uniform vec3 lightDir;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
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
        float halo = pow(t, 0.7);                  // wide soft warm spill
        float hot  = smoothstep(0.65, 1.0, t);     // bright cream edge
        vec3 color = mix(outerColor, innerColor, hot);

        // Bias toward the key-light direction so the halo isn't a uniform
        // orbital ring. Remap dot(N, L) from [-1, 1] to [0, 1], then keep a
        // floor so the unlit side is dim but not pitch black.
        float lit = clamp(dot(vWorldNormal, lightDir) * 0.5 + 0.5, 0.0, 1.0);
        float spill = mix(0.18, 1.0, lit);

        float alpha = (halo * 0.7 + hot * 0.55) * intensity * spill;
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

// Front-side sphere just above the continent plates that paints a darkening
// pass strongest at the limb (where surface normal is perpendicular to the
// view direction) and transparent at the centre of the visible disc.
// Reads as a framed studio shot: the sphere sits with a touch more weight
// at its edges, focusing the eye toward the centre.
function makeLimbVignette(theme) {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.026, 96, 96);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      vignetteColor: { value: new THREE.Color(theme.vignetteColor) },
      vignetteIntensity: { value: theme.vignetteIntensity },
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
      uniform vec3 vignetteColor;
      uniform float vignetteIntensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        // dot(N, V): 1 at the centre of the visible disc, 0 at the limb.
        // pow(1 - facing, 3.0) gives a soft falloff that stays out of the
        // way of the centre and concentrates the darkening near the edge.
        float facing = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
        float vignette = pow(1.0 - facing, 3.0);
        float alpha = vignette * vignetteIntensity;
        gl_FragColor = vec4(vignetteColor, alpha);
      }
    `,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "globe-vignette";
  mesh.renderOrder = 3;
  mesh.visible = theme.vignetteIntensity > 0;
  return mesh;
}

function countryLines(meshGeometry, theme) {
  // Country borders sit just above the relief plate top, so they read as
  // darker engravings carved into the elevated land rather than floating
  // above the ocean.
  const lineRadius = GLOBE_RADIUS * (1 + RELIEF_LIFT + 0.0008);
  // topojson.mesh() returns a bare GeoJSON geometry (no enclosing Feature).
  const positions = [];
  const consume = (coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      const a = latLonToVec3(coords[i][1], coords[i][0], lineRadius);
      const b = latLonToVec3(coords[i + 1][1], coords[i + 1][0], lineRadius);
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
