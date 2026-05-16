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
    sceneBg: 0xe8e7e3,
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
    // Held at 0 in light: the cool sphere on warm-grey chrome already reads
    // framed by the temperature contrast, and the dark-mode pass swaps both
    // uniforms via applyThemeToGlobe.
    vignetteColor: 0x18191b,
    vignetteIntensity: 0,
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
    // Marker ring tints behind the home dots and around the away venues.
    // Theme-driven so the dark pass can shift to cool-tinted neutrals against
    // the warm sphere; light values preserve the original sectional tones.
    homeRingColor: 0x1c1a16,
    awayRingColor: 0x514a3d,
  },
  // Dark theme — Sunday Night Football primetime broadcast.
  // Scene sentence: stadium lights spilling onto turf, broadcast camera high
  // in the rafters at kickoff. Warm sodium-vapor key/rim on the lit side,
  // deep teal-graphite tunnel-shadow on the unlit side — the temperature
  // counterpoint a real primetime broadcast uses, not the flat warm-graphite
  // monochrome an "Earth from orbit" SaaS globe would land on.
  dark: {
    sceneBg: 0x081420,
    sphereColor: 0x1a1612,
    reliefColor: 0x4a3826,
    countryLineColor: 0xe8e2d0,
    countryLineOpacity: 0.45,
    limbColor: 0x050a14,
    limbOpacity: 0.4,
    glowInnerColor: 0xfff2c4,
    // Saturated amber sunset rim — the warm opponent to the cool tunnel
    // void, so the halo registers as a chromatic spread rather than a
    // tone-match wash.
    glowOuterColor: 0x8a3a14,
    glowIntensity: 0.65,
    // Limb vignette: cool near-black instead of pure black so the
    // darkening sits on the same hue axis as sceneBg.
    vignetteColor: 0x04080c,
    vignetteIntensity: 0.35,
    ambientSky: 0xf8e8c0,
    // Cool ground bounce — opposes the warm hemisphere sky so the sphere
    // gets temperature shading across the terminator.
    ambientGround: 0x143048,
    ambientIntensity: 0.7,
    keyColor: 0xfff4d4,
    keyIntensity: 1.25,
    rimColor: 0xc89060,
    rimIntensity: 0.6,
    // Fill light: saturated cool at near-key intensity. This is the unlit
    // side of the SNF tunnel — without it the cool tokens above have
    // nothing actually lighting the sphere shadow side and the change
    // reads as invisible. Bumped intensity 0.3 → 0.7 is the load-bearing
    // change, not the hex value.
    fillColor: 0x305a85,
    fillIntensity: 0.7,
    groundShadow: [
      "rgba(15, 11, 7, 0.88)",
      "rgba(15, 11, 7, 0.55)",
      "rgba(15, 11, 7, 0.2)",
      "rgba(15, 11, 7, 0.0)",
    ],
    travelerEmissiveBoost: 2.4,
    homeRingColor: 0x101828,
    awayRingColor: 0x6a7a8c,
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
