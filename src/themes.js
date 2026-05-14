// Centralised colour palettes for the scene. Both themes paint the same
// elements; only the values change so the globe + scene background stay
// coherent across the toggle.
export const THEMES = {
  light: {
    sceneBg: 0xefe9dd,
    sphereColor: 0xddd2b4,
    reliefColor: 0xf3ead4,
    countryLineColor: 0x6e5b3f,
    countryLineOpacity: 0.55,
    limbColor: 0xc4b89f,
    limbOpacity: 0.18,
    glowInnerColor: 0xeef6ff,
    glowOuterColor: 0xa5cfe8,
    glowIntensity: 0.0,
    ambientSky: 0xffffff,
    ambientGround: 0xb8b09c,
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
