import * as THREE from "three";
import { TEAMS } from "./data/teams.js";
import { GLOBE_RADIUS, greatCircleArc, latLonToVec3 } from "./geo.js";

const SEGMENTS = 96;

// Build a Group containing every flight-path arc + every stadium marker.
// Each arc and marker is tagged with metadata so the UI layer can toggle
// visibility by team without rebuilding geometry.
export function createFlightPaths(legs) {
  const group = new THREE.Group();
  group.name = "flight-paths";

  const arcsGroup = new THREE.Group();
  arcsGroup.name = "arcs";
  group.add(arcsGroup);

  const markersGroup = new THREE.Group();
  markersGroup.name = "markers";
  group.add(markersGroup);

  // ── Arcs ──────────────────────────────────────────────────────
  const arcRecords = [];
  for (const leg of legs) {
    const points = greatCircleArc(
      leg.fromLat,
      leg.fromLon,
      leg.toLat,
      leg.toLon,
      SEGMENTS,
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const teamColor = new THREE.Color(TEAMS[leg.team].accent);
    const material = new THREE.LineBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.78,
    });
    const line = new THREE.Line(geometry, material);
    line.userData = { team: leg.team, leg, baseOpacity: 0.78 };
    arcsGroup.add(line);
    arcRecords.push({ line, leg });
  }

  // ── Home stadium markers ──────────────────────────────────────
  const homeMarkerRecords = [];
  for (const key of Object.keys(TEAMS)) {
    const team = TEAMS[key];
    const pos = latLonToVec3(team.lat, team.lon, GLOBE_RADIUS * 1.012);
    const geom = new THREE.SphereGeometry(0.008, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(team.accent),
      transparent: true,
      opacity: 0.95,
    });
    const dot = new THREE.Mesh(geom, mat);
    dot.position.copy(pos);
    dot.userData = { team: key, kind: "home" };
    markersGroup.add(dot);

    // Small dark ring underneath for legibility on the lighter globe.
    const ringGeom = new THREE.RingGeometry(0.012, 0.018, 18);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1c1a16,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(pos).multiplyScalar(0.9995);
    ring.lookAt(0, 0, 0);
    ring.userData = { team: key, kind: "home-ring" };
    markersGroup.add(ring);

    homeMarkerRecords.push({ team: key, dot, ring });
  }

  // ── Away venue markers ────────────────────────────────────────
  // De-dupe so neutral sites (e.g. Wembley) don't render six concentric markers.
  const seen = new Map();
  for (const leg of legs) {
    const key = `${leg.toLat.toFixed(3)},${leg.toLon.toFixed(3)}`;
    if (seen.has(key)) {
      seen.get(key).teams.add(leg.team);
      continue;
    }
    const pos = latLonToVec3(leg.toLat, leg.toLon, GLOBE_RADIUS * 1.01);
    const geom = new THREE.RingGeometry(0.005, 0.01, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x514a3d,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geom, mat);
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);
    ring.userData = {
      kind: "away",
      teams: new Set([leg.team]),
      lat: leg.toLat,
      lon: leg.toLon,
    };
    seen.set(key, ring.userData);
    markersGroup.add(ring);
  }

  return { group, arcsGroup, markersGroup, arcRecords, homeMarkerRecords };
}

// Show/hide arcs + markers based on the currently-selected set of teams.
// `active` is a Set of team keys.
export function applyTeamFilter({ arcRecords, homeMarkerRecords }, active) {
  for (const { line, leg } of arcRecords) {
    const visible = active.has(leg.team);
    line.visible = visible;
    line.material.opacity = visible ? line.userData.baseOpacity : 0;
  }
  for (const { team, dot, ring } of homeMarkerRecords) {
    const visible = active.has(team);
    dot.visible = visible;
    ring.visible = visible;
  }
}
