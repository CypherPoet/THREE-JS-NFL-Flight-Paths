import * as THREE from "three";
import { GLOBE_RADIUS, RELIEF_LIFT, latLonToVec3 } from "./geo.js";

// Build a 3D "relief" of every continent as a single mesh — each landmass is
// a slightly-elevated cap with vertical skirt walls down to sea level. Gives
// the globe a sculptural plate-of-porcelain look with a visible coastline
// silhouette at the limb (instead of just a painted-on canvas).
//
// Inputs:
//   countries: a GeoJSON FeatureCollection (from topojson.feature on the
//              world-atlas 110m countries object).
//   theme:     a THEMES entry — supplies reliefColor.
//   lift:      fractional radius elevation for the cap top (e.g. 0.015 = 1.5%).
//
// Returns: { mesh, applyTheme(theme) }
//   - mesh: a THREE.Mesh with merged top-cap + skirt geometry.
//   - applyTheme(): repaints material colours when the theme toggles.
//
// Implementation notes:
//   - Triangulation runs in lon/lat space via THREE.ShapeUtils. Vertices are
//     then projected onto the sphere at top/base radius.
//   - Long edges in lon/lat get subdivided so the triangulated cap follows
//     the sphere instead of cutting chords through it.
//   - Antimeridian-crossing rings are normalised by unwrapping longitudes —
//     a vertex at -179° next to one at +179° is shifted to +181° so the
//     polygon stays continuous in lon space.
//   - Top cap uses radial normals (smooth, sphere-like shading).
//     Skirt uses computed face normals so the bevel catches the key light.

const MAX_EDGE_DEG = 2.0; // subdivide ring edges longer than this in lon/lat
// Cap on triangle edges (including interior triangulation edges). A flat
// triangle spanning θ° in lon/lat chords through the sphere by about
// (1 - cos(θ/2)) when projected. For θ=20° that's a 0.015 sag — already
// comparable to RELIEF_LIFT, so a large flat triangle dips below the cap
// elevation and the plate visibly caves in. Refining to 3° keeps the sag
// well below 0.001.
const MAX_TRI_EDGE_DEG = 3.0;

export function makeContinentRelief({ countries, theme, lift = RELIEF_LIFT }) {
  const topRadius = GLOBE_RADIUS * (1 + lift);
  const baseRadius = GLOBE_RADIUS * 1.0005; // a hair above the painted sphere

  const topPositions = [];
  const topNormals = [];
  const skirtPositions = [];
  const skirtNormals = [];

  for (const feature of countries.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];

    for (const polygon of polygons) {
      const rings = polygon.map((ring, i) => {
        // Outer rings need CCW winding, holes CW, for ShapeUtils to produce
        // outward-facing triangles. The 110m world-atlas data is mixed
        // (shapefile-origin), so we normalise here. Without this, some
        // landmasses (the contiguous US in particular) get back-face culled
        // and show the ocean sphere through the missing top cap.
        const processed = subdivideRing(unwrapRing(ring), MAX_EDGE_DEG);
        const wantCCW = i === 0;
        return enforceWinding(processed, wantCCW);
      });

      const outer = rings[0];
      const holes = rings.slice(1);

      // Build contour + holes as Vector2 arrays in (lon, lat) space.
      // ShapeUtils.triangulateShape expects rings without the closing point.
      const contour2D = ringToVector2(outer);
      const holes2D = holes.map(ringToVector2);

      let triangles;
      try {
        triangles = THREE.ShapeUtils.triangulateShape(contour2D, holes2D);
      } catch {
        continue; // degenerate ring — skip
      }

      // ShapeUtils returns indices into a flat array of [contour, ...holes].
      const flatPoints = contour2D.concat(...holes2D);

      // Refine long interior edges so big polygons (US, Russia, Antarctica,
      // ...) don't get triangulated into giant flat triangles that chord
      // through the sphere when projected.
      const refined = refineTriangles(flatPoints, triangles, MAX_TRI_EDGE_DEG);

      for (const tri of refined.triangles) {
        for (const idx of tri) {
          const v2 = refined.points[idx];
          const v3 = latLonToVec3(v2.y, v2.x, topRadius);
          topPositions.push(v3.x, v3.y, v3.z);
          // Smooth radial normal — top cap reads as part of the sphere.
          const inv = 1 / topRadius;
          topNormals.push(v3.x * inv, v3.y * inv, v3.z * inv);
        }
      }

      // Skirt: walk every ring's edges, emit two triangles per edge.
      for (const ring of rings) {
        emitSkirtQuads(ring, baseRadius, topRadius, skirtPositions, skirtNormals);
      }
    }
  }

  // Merge top + skirt into a single BufferGeometry. Top vertex normals point
  // radially outward (sphere-like); skirt vertex normals point outward along
  // the wall (perpendicular to radial, ~horizontal) — together they give a
  // crisp bevel at the coastline.
  const allPositions = new Float32Array(
    topPositions.length + skirtPositions.length,
  );
  allPositions.set(topPositions, 0);
  allPositions.set(skirtPositions, topPositions.length);

  const allNormals = new Float32Array(
    topNormals.length + skirtNormals.length,
  );
  allNormals.set(topNormals, 0);
  allNormals.set(skirtNormals, topNormals.length);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(allPositions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(allNormals, 3));

  const material = new THREE.MeshStandardMaterial({
    color: theme.reliefColor,
    roughness: 0.92,
    metalness: 0.0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.name = "continent-relief";
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    mesh,
    applyTheme(nextTheme) {
      material.color.set(nextTheme.reliefColor);
    },
  };
}

// Walk a ring's coordinates and "unwrap" longitudes so consecutive points
// never differ by more than 180°. Required for polygons that cross the
// antimeridian (e.g. Russia, Fiji, NZ, Alaska) — otherwise a +179 → -179
// jump in lon/lat space generates triangles that wrap the whole world.
function unwrapRing(ring) {
  const out = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    const prevLon = out[i - 1][0];
    let lon = ring[i][0];
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

// Insert intermediate points along any edge longer than maxEdge degrees,
// measured as max(|Δlon|, |Δlat|). Without this, long lon-lat edges become
// straight chords through the sphere when projected, producing visible
// dimples and triangle-spanning artefacts.
function subdivideRing(ring, maxEdge) {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    const [aLon, aLat] = ring[i - 1];
    const [bLon, bLat] = ring[i];
    const dLon = bLon - aLon;
    const dLat = bLat - aLat;
    const span = Math.max(Math.abs(dLon), Math.abs(dLat));
    const steps = Math.max(1, Math.ceil(span / maxEdge));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push([aLon + dLon * t, aLat + dLat * t]);
    }
  }
  return out;
}

// Iteratively split any triangle whose longest edge (in lon/lat) exceeds
// maxEdge. Adds midpoint vertices and replaces the triangle with two smaller
// ones along the long edge. Outputs a denser triangulation whose edges all
// project to small arcs on the sphere, so each triangle hugs the cap radius
// instead of chording underneath it.
function refineTriangles(seedPoints, seedTriangles, maxEdge) {
  const points = seedPoints.slice();
  // Cache subdivision midpoints so adjacent triangles share new vertices —
  // otherwise we'd create T-junctions that crack the surface.
  const midpointCache = new Map();
  const midpointIndex = (a, b) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const cached = midpointCache.get(key);
    if (cached !== undefined) return cached;
    const pa = points[a];
    const pb = points[b];
    const idx = points.length;
    points.push(new THREE.Vector2((pa.x + pb.x) * 0.5, (pa.y + pb.y) * 0.5));
    midpointCache.set(key, idx);
    return idx;
  };

  // BFS by working off a queue; each split enqueues two children.
  const queue = seedTriangles.map((t) => [t[0], t[1], t[2]]);
  const out = [];
  while (queue.length > 0) {
    const [a, b, c] = queue.pop();
    const pa = points[a];
    const pb = points[b];
    const pc = points[c];
    const dAB = Math.max(Math.abs(pb.x - pa.x), Math.abs(pb.y - pa.y));
    const dBC = Math.max(Math.abs(pc.x - pb.x), Math.abs(pc.y - pb.y));
    const dCA = Math.max(Math.abs(pa.x - pc.x), Math.abs(pa.y - pc.y));
    const maxD = Math.max(dAB, dBC, dCA);
    if (maxD <= maxEdge) {
      out.push([a, b, c]);
      continue;
    }
    // Rotate so [p, q, r] places the longest edge as p→q.
    let p, q, r;
    if (dAB === maxD) {
      p = a;
      q = b;
      r = c;
    } else if (dBC === maxD) {
      p = b;
      q = c;
      r = a;
    } else {
      p = c;
      q = a;
      r = b;
    }
    const m = midpointIndex(p, q);
    queue.push([p, m, r]);
    queue.push([m, q, r]);
  }
  return { points, triangles: out };
}

// Compute the signed area of a closed ring (last == first allowed) via the
// shoelace formula. Positive ⇒ counter-clockwise in standard (+x right, +y
// up) coords; negative ⇒ clockwise.
function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return a * 0.5;
}

// Reverse the ring in place if its current winding doesn't match the desired
// orientation (CCW for outer rings, CW for holes).
function enforceWinding(ring, wantCCW) {
  const area = signedArea(ring);
  const isCCW = area > 0;
  if (isCCW !== wantCCW) ring.reverse();
  return ring;
}

// Convert a ring (closed: first == last) into a Vector2 array dropping the
// duplicated closing point — ShapeUtils.triangulateShape wants open rings.
function ringToVector2(ring) {
  const last = ring.length - 1;
  const closed =
    ring[0][0] === ring[last][0] && ring[0][1] === ring[last][1];
  const end = closed ? last : ring.length;
  const out = new Array(end);
  for (let i = 0; i < end; i++) out[i] = new THREE.Vector2(ring[i][0], ring[i][1]);
  return out;
}

// For one closed ring, emit two skirt triangles per edge (base→top→top, base→top→base).
// Skirt normals are computed per-quad and shared by all four vertices of that
// quad, giving smooth shading along the coastline while keeping the bevel
// edge crisp against the top cap.
function emitSkirtQuads(ring, baseRadius, topRadius, positions, normals) {
  const len = ring.length;
  // Use ring vertices in order; the closing duplicate is fine — we read pairs.
  for (let i = 0; i < len - 1; i++) {
    const [aLon, aLat] = ring[i];
    const [bLon, bLat] = ring[i + 1];

    const aBase = latLonToVec3(aLat, aLon, baseRadius);
    const bBase = latLonToVec3(bLat, bLon, baseRadius);
    const aTop = latLonToVec3(aLat, aLon, topRadius);
    const bTop = latLonToVec3(bLat, bLon, topRadius);

    // Quad normal: outward-perpendicular to the wall. Compute via the cross
    // product of the wall's "up" (aTop - aBase) and "across" (bBase - aBase),
    // then negate if it points inward.
    const upX = aTop.x - aBase.x,
      upY = aTop.y - aBase.y,
      upZ = aTop.z - aBase.z;
    const acX = bBase.x - aBase.x,
      acY = bBase.y - aBase.y,
      acZ = bBase.z - aBase.z;
    let nx = upY * acZ - upZ * acY;
    let ny = upZ * acX - upX * acZ;
    let nz = upX * acY - upY * acX;
    // Flip outward if needed (positive dot with the wall midpoint radial).
    const midX = (aBase.x + bBase.x) * 0.5;
    const midY = (aBase.y + bBase.y) * 0.5;
    const midZ = (aBase.z + bBase.z) * 0.5;
    if (nx * midX + ny * midY + nz * midZ < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const inv = 1 / Math.hypot(nx, ny, nz);
    nx *= inv;
    ny *= inv;
    nz *= inv;

    // Triangle 1: aBase, bBase, bTop
    positions.push(aBase.x, aBase.y, aBase.z);
    positions.push(bBase.x, bBase.y, bBase.z);
    positions.push(bTop.x, bTop.y, bTop.z);
    // Triangle 2: aBase, bTop, aTop
    positions.push(aBase.x, aBase.y, aBase.z);
    positions.push(bTop.x, bTop.y, bTop.z);
    positions.push(aTop.x, aTop.y, aTop.z);
    for (let k = 0; k < 6; k++) normals.push(nx, ny, nz);
  }
}
