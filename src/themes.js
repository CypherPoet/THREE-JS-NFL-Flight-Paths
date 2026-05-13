// Centralised colour palettes for the scene. Both themes paint the same
// elements; only the values change so the globe + scene background stay
// coherent across the toggle.
export const THEMES = {
  light: {
    sceneBg: 0xefe9dd,
    sphereColor: 0xffffff,
    landFill: "#ece4d1",
    oceanFill: "#f4eee0",
    borderStroke: "rgba(74, 66, 52, 0.62)",
    borderWidth: 1.6,
    bumpOcean: "#0e0e0e",
    bumpLand: "#e2e2e2",
    bumpCoast: "rgba(0, 0, 0, 0.78)",
    bumpScale: 0.022,
    countryLineColor: 0x5d503e,
    countryLineOpacity: 0.5,
    limbColor: 0xc4b89f,
    limbOpacity: 0.18,
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
    sphereColor: 0xffffff,
    landFill: "#2a3142",
    oceanFill: "#1a2030",
    borderStroke: "rgba(220, 226, 240, 0.42)",
    borderWidth: 1.4,
    bumpOcean: "#070a12",
    bumpLand: "#dfe2ec",
    bumpCoast: "rgba(0, 0, 0, 0.85)",
    bumpScale: 0.024,
    countryLineColor: 0xc7cee0,
    countryLineOpacity: 0.32,
    limbColor: 0x06080e,
    limbOpacity: 0.55,
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
