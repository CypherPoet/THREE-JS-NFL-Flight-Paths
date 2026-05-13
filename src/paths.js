import * as THREE from "three";
import { TEAMS } from "./data/teams.js";
import { GLOBE_RADIUS, greatCircleArc, latLonToVec3 } from "./geo.js";

const SEGMENTS = 96;
const TRAVELER_BASE_RADIUS = 0.0075;
const TRAVELER_GLOW_RADIUS = 0.018;
const TRAVELER_SPEED_PER_RADIAN = 0.22; // radians traversed per second
const TRAVELER_MIN_CYCLE_SECONDS = 4.5;

// Build a Group containing every flight-path arc + every stadium marker
// + an animated "traveler" sphere riding each arc. Each child is tagged with
// metadata so the UI layer can toggle visibility by team without rebuilding
// geometry.
export function createFlightPaths(legs, theme) {
  const group = new THREE.Group();
  group.name = "flight-paths";

  const arcsGroup = new THREE.Group();
  arcsGroup.name = "arcs";
  group.add(arcsGroup);

  const markersGroup = new THREE.Group();
  markersGroup.name = "markers";
  group.add(markersGroup);

  const travelersGroup = new THREE.Group();
  travelersGroup.name = "travelers";
  group.add(travelersGroup);

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

    // ── Traveler riding this arc ──────────────────────────────
    // A small bright sphere (the "plane") with a soft glow halo behind it.
    // The traveler moves t ∈ [0, 1] along the same sampled points each frame.
    const start = latLonToVec3(leg.fromLat, leg.fromLon).normalize();
    const end = latLonToVec3(leg.toLat, leg.toLon).normalize();
    const arcAngle = start.angleTo(end);

    const coreGeom = new THREE.SphereGeometry(TRAVELER_BASE_RADIUS, 14, 14);
    const coreMat = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 1.0,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);

    const glowGeom = new THREE.SphereGeometry(TRAVELER_GLOW_RADIUS, 14, 14);
    const glowMat = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.18 * theme.travelerEmissiveBoost,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);

    const traveler = new THREE.Group();
    traveler.name = `traveler-${leg.team}-${leg.week}`;
    traveler.add(glow);
    traveler.add(core);

    // Stagger start positions so all 22+ travelers don't depart simultaneously.
    const phase = pseudoRandomPhase(leg);
    const cycleSeconds = Math.max(
      TRAVELER_MIN_CYCLE_SECONDS,
      arcAngle / TRAVELER_SPEED_PER_RADIAN,
    );

    traveler.userData = {
      team: leg.team,
      leg,
      points,
      phase,
      cycleSeconds,
      glowBaseOpacity: 0.18 * theme.travelerEmissiveBoost,
      core,
      glow,
    };
    // Seed initial position so frame 0 isn't all at the start point.
    setTravelerPosition(traveler, 0);
    travelersGroup.add(traveler);

    arcRecords.push({ line, leg, traveler });
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

    // Soft dark/light ring behind the dot for legibility.
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

  return {
    group,
    arcsGroup,
    markersGroup,
    travelersGroup,
    arcRecords,
    homeMarkerRecords,
  };
}

// Show/hide arcs + markers + travelers based on the currently-selected set
// of teams. `active` is a Set of team keys.
export function applyTeamFilter({ arcRecords, homeMarkerRecords }, active) {
  for (const { line, leg, traveler } of arcRecords) {
    const visible = active.has(leg.team);
    line.visible = visible;
    line.material.opacity = visible ? line.userData.baseOpacity : 0;
    traveler.visible = visible;
  }
  for (const { team, dot, ring } of homeMarkerRecords) {
    const visible = active.has(team);
    dot.visible = visible;
    ring.visible = visible;
  }
}

// Advance every traveler along its arc. Called once per frame from main.js.
export function tickTravelers(flightPaths, elapsed) {
  for (const traveler of flightPaths.travelersGroup.children) {
    if (!traveler.visible) continue;
    const { phase, cycleSeconds, glowBaseOpacity, glow } = traveler.userData;
    const t = (((elapsed + phase) / cycleSeconds) % 1 + 1) % 1;
    setTravelerPosition(traveler, t);

    // Gentle pulse — peaks halfway through the trip, dims at the endpoints.
    const pulse = 0.55 + 0.45 * Math.sin(t * Math.PI);
    glow.material.opacity = glowBaseOpacity * pulse;
  }
}

// Move a traveler to t ∈ [0, 1] along its sampled arc, interpolating between
// the two nearest points. Cheap; no curve allocation per frame.
function setTravelerPosition(traveler, t) {
  const points = traveler.userData.points;
  const last = points.length - 1;
  const f = t * last;
  const i = Math.floor(f);
  const j = Math.min(i + 1, last);
  const lerpT = f - i;
  traveler.position.x =
    points[i].x + (points[j].x - points[i].x) * lerpT;
  traveler.position.y =
    points[i].y + (points[j].y - points[i].y) * lerpT;
  traveler.position.z =
    points[i].z + (points[j].z - points[i].z) * lerpT;
}

// Deterministic per-leg phase so the same schedule always animates the same.
function pseudoRandomPhase(leg) {
  let h = 0;
  const s = `${leg.team}:${leg.week}:${leg.toLat.toFixed(1)}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

// Refresh every traveler glow's base opacity when the theme changes.
export function applyThemeToPaths(flightPaths, theme) {
  for (const traveler of flightPaths.travelersGroup.children) {
    const base = 0.18 * theme.travelerEmissiveBoost;
    traveler.userData.glowBaseOpacity = base;
    traveler.userData.glow.material.opacity = base;
  }
}
