// Centralised colour palettes for the scene. Both themes paint the same
// elements; only the values change so the globe + scene background stay
// coherent across the toggle.
export const THEMES = {
  // Light theme: FAA sectional chart fused with broadcast graphic
  // legibility. Ocean reads as muted sectional blue-grey, continents stay
  // warm sand. Inverts the usual globe palette logic (water cool, land
  // warm-saturated). The fusion of "travel cartography" (sectionals are
  // literal aviation route maps that pilots fly) with "modern sports
  // broadcast" (typography + chrome carry the broadcast-graphic register).
  light: {
    sceneBg: 0xe8ebef,
    sphereColor: 0xa5c0c8,
    reliefColor: 0xe6d4b0,
    // Country line ink pushed toward proper sectional-chart authority:
    // slightly darker brown, slightly higher opacity, so borders read as
    // cartographic ink rather than decorative outline.
    countryLineColor: 0x2d1f0e,
    countryLineOpacity: 0.7,
    limbColor: 0x8aa0a8,
    limbOpacity: 0.22,
    // Cool atmospheric halo at very low intensity. The sectional ocean
    // already provides cool framing for the limb; the halo just lifts the
    // edge a touch so the sphere doesn't read flat against the page.
    glowInnerColor: 0xf0f5f8,
    glowOuterColor: 0xb8c8d0,
    glowIntensity: 0.2,
    // Lighting tuned for the sectional palette: cool overhead ambient lets
    // the sphere's intrinsic blue-grey carry, neutral-grey ground bounce
    // stops the warm cream rebound from washing the water. The key light
    // stays warm-white so it reads as "sun on the chart" against the cool
    // diffuse fill.
    ambientSky: 0xf0f6fa,
    ambientGround: 0xa8a8a4,
    ambientIntensity: 1.05,
    keyColor: 0xffffff,
    keyIntensity: 0.95,
    rimColor: 0xeef1f5,
    rimIntensity: 0.55,
    fillColor: 0xfff2e1,
    fillIntensity: 0.25,
    groundShadow: [
      "rgba(28, 26, 22, 0.62)",
      "rgba(28, 26, 22, 0.38)",
      "rgba(28, 26, 22, 0.14)",
      "rgba(28, 26, 22, 0.0)",
    ],
    travelerEmissiveBoost: 1.0,
  },
  // Dark theme — Sunday Night Football primetime broadcast.
  // Scene sentence: stadium lights spilling onto turf, broadcast camera high
  // in the rafters at kickoff. Warm graphite tunnel, lit-turf relief, sodium-
  // vapor halo biased toward the key light. Deliberately not navy / not
  // "Earth from orbit" — those are the SaaS-globe defaults this theme avoids.
  dark: {
    sceneBg: 0x0f0d0a,
    sphereColor: 0x1a1612,
    reliefColor: 0x3a3025,
    countryLineColor: 0xe8e2d0,
    countryLineOpacity: 0.45,
    limbColor: 0x070504,
    limbOpacity: 0.4,
    glowInnerColor: 0xfff2c4,
    glowOuterColor: 0x5a3a14,
    glowIntensity: 0.65,
    ambientSky: 0xf8e8c0,
    ambientGround: 0x1a1612,
    ambientIntensity: 0.6,
    keyColor: 0xfff4d4,
    keyIntensity: 1.25,
    rimColor: 0xc89060,
    rimIntensity: 0.6,
    fillColor: 0x3a2818,
    fillIntensity: 0.3,
    groundShadow: [
      "rgba(15, 11, 7, 0.88)",
      "rgba(15, 11, 7, 0.55)",
      "rgba(15, 11, 7, 0.2)",
      "rgba(15, 11, 7, 0.0)",
    ],
    travelerEmissiveBoost: 2.4,
  },
};

export function getInitialTheme() {
  const saved = localStorage.getItem("nfl-flight-paths-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function persistTheme(name) {
  try {
    localStorage.setItem("nfl-flight-paths-theme", name);
  } catch {
    // localStorage may be unavailable (private mode, embedded contexts) —
    // theme still flips for the session, just won't persist.
  }
}
