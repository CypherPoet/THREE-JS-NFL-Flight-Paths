import * as THREE from "three";

export const GLOBE_RADIUS = 1.0;
const EARTH_RADIUS_MILES = 3958.8;

// Lat/lon in degrees → unit-sphere XYZ at GLOBE_RADIUS.
export function latLonToVec3(lat, lon, radius = GLOBE_RADIUS, target) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  if (target) return target.set(x, y, z);
  return new THREE.Vector3(x, y, z);
}

// Great-circle distance between two lat/lon points, in miles.
export function greatCircleMiles(latA, lonA, latB, lonB) {
  const toRad = Math.PI / 180;
  const dLat = (latB - latA) * toRad;
  const dLon = (lonB - lonA) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * toRad) *
      Math.cos(latB * toRad) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

// Sample N+1 points along a great-circle arc, lifted into a smooth bezier-style
// arch above the globe. Returns an array of THREE.Vector3 in scene coordinates.
export function greatCircleArc(
  startLat,
  startLon,
  endLat,
  endLon,
  segments = 64,
  archHeight = null,
) {
  const start = latLonToVec3(startLat, startLon).normalize();
  const end = latLonToVec3(endLat, endLon).normalize();
  const angle = start.angleTo(end);

  // Arc height scales with great-circle distance so a transcontinental hop
  // arches noticeably higher than a divisional rivalry.
  const lift =
    archHeight ?? GLOBE_RADIUS * (0.05 + 0.42 * Math.sin(angle / 2));

  const points = [];
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Spherical linear interpolation between the two unit vectors.
    const sinAngle = Math.sin(angle);
    let s1, s2;
    if (sinAngle < 1e-6) {
      s1 = 1 - t;
      s2 = t;
    } else {
      s1 = Math.sin((1 - t) * angle) / sinAngle;
      s2 = Math.sin(t * angle) / sinAngle;
    }
    tmp.copy(start).multiplyScalar(s1).addScaledVector(end, s2);
    tmp.normalize();
    // Lift along the arc — peak at t=0.5, zero at the endpoints.
    const liftAmount = lift * Math.sin(Math.PI * t);
    const radius = GLOBE_RADIUS + liftAmount + 0.004; // tiny offset above surface
    points.push(tmp.clone().multiplyScalar(radius));
  }
  return points;
}
