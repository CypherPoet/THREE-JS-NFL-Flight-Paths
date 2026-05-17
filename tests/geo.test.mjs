import { describe, it, expect } from "vitest";
import { greatCircleMiles, isFrontOfSphere } from "../src/geo.js";

// JFK and LAX airport coordinates; haversine distance at R=3958.8 yields
// ~2470 mi (varies by a few mi vs. Great Circle Mapper because GCM uses the
// WGS84 ellipsoid, not a sphere).
const JFK = { lat: 40.6413, lon: -73.7781 };
const LAX = { lat: 33.9416, lon: -118.4085 };

describe("greatCircleMiles", () => {
  it("returns 0 for identical points", () => {
    expect(greatCircleMiles(40, -74, 40, -74)).toBe(0);
  });

  it("is symmetric: A→B equals B→A", () => {
    const ab = greatCircleMiles(JFK.lat, JFK.lon, LAX.lat, LAX.lon);
    const ba = greatCircleMiles(LAX.lat, LAX.lon, JFK.lat, JFK.lon);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it("matches the JFK → LAX reference distance (~2470 mi)", () => {
    const d = greatCircleMiles(JFK.lat, JFK.lon, LAX.lat, LAX.lon);
    expect(d).toBeGreaterThan(2465);
    expect(d).toBeLessThan(2475);
  });
});

describe("isFrontOfSphere", () => {
  // Unit sphere at origin, camera looking down the +z axis from (0, 0, 5).
  // This matches the scene's "camera in front of globe" framing.
  const center = { x: 0, y: 0, z: 0 };
  const camera = { x: 0, y: 0, z: 5 };

  it("returns true for the front pole (point closest to camera)", () => {
    expect(isFrontOfSphere({ x: 0, y: 0, z: 1 }, center, camera)).toBe(true);
  });

  it("returns false for the back pole (point opposite the camera)", () => {
    expect(isFrontOfSphere({ x: 0, y: 0, z: -1 }, center, camera)).toBe(false);
  });

  it("returns false at the limb (point perpendicular to camera direction)", () => {
    // dot product is exactly 0; the `> 0` predicate must reject equality.
    expect(isFrontOfSphere({ x: 1, y: 0, z: 0 }, center, camera)).toBe(false);
  });

  it("returns true within 1° of the limb on the camera side", () => {
    // Regression test for the past `(M − G) · (M − C) < 0` bug, which
    // rejected ~15° at the limb. The correct `(M − G) · (C − G) > 0`
    // predicate must accept every point on the front hemisphere up to the
    // limb itself — a 1° offset stays well above float epsilon while
    // catching any predicate that's even slightly stricter at the limb.
    const theta = (89 * Math.PI) / 180;
    const point = { x: Math.sin(theta), y: 0, z: Math.cos(theta) };
    expect(isFrontOfSphere(point, center, camera)).toBe(true);
  });
});
