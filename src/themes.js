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
  dark: {
    sceneBg: 0x10131a,
    sphereColor: 0x171c2a,
    reliefColor: 0x3f4a64,
    countryLineColor: 0x232b3e,
    countryLineOpacity: 0.7,
    limbColor: 0x06080e,
    limbOpacity: 0.35,
    glowInnerColor: 0xcfe6ff,
    glowOuterColor: 0x2a73d8,
    glowIntensity: 1.0,
    ambientSky: 0xc8d1e6,
    ambientGround: 0x10131a,
    ambientIntensity: 0.55,
    keyColor: 0xffeed2,
    keyIntensity: 1.1,
    rimColor: 0x6a8fc9,
    rimIntensity: 0.55,
    fillColor: 0x2a3756,
    fillIntensity: 0.25,
    groundShadow: [
      "rgba(0, 0, 0, 0.85)",
      "rgba(0, 0, 0, 0.5)",
      "rgba(0, 0, 0, 0.18)",
      "rgba(0, 0, 0, 0.0)",
    ],
    travelerEmissiveBoost: 1.8,
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
