import { TEAMS, INTERNATIONAL_VENUES } from "./data/teams.js";
import { SCHEDULE_2025 } from "./data/schedule-2025.js";
import { SCHEDULE_2026 } from "./data/schedule-2026.js";
import { greatCircleMiles } from "./geo.js";

export const SCHEDULES = {
  "2026": {
    label: "2026 Season",
    sublabel: "Full regular-season schedule",
    games: SCHEDULE_2026,
  },
  "2025": {
    label: "2025 Season",
    sublabel: "Full regular-season schedule",
    games: SCHEDULE_2025,
  },
};

export const DEFAULT_SEASON = "2026";

// Resolve a game row into a travel leg for the away team:
//   away stadium → destination venue (home stadium or international site).
function resolveDestination(row) {
  if (row.venue && INTERNATIONAL_VENUES[row.venue]) {
    const venue = INTERNATIONAL_VENUES[row.venue];
    return {
      lat: venue.lat,
      lon: venue.lon,
      name: venue.name,
      city: venue.city,
      international: true,
      venueKey: row.venue,
    };
  }
  const home = TEAMS[row.home];
  return {
    lat: home.lat,
    lon: home.lon,
    name: home.stadium,
    city: home.city,
    international: false,
    venueKey: null,
  };
}

// Produce a flat list of travel legs, one per away game (one per neutral-site game
// counts as a trip for both teams since both fly in).
export function buildTravelLegs(schedule = SCHEDULE_2026) {
  const legs = [];

  for (const row of schedule) {
    const isNeutral =
      row.venue && INTERNATIONAL_VENUES[row.venue];
    const dest = resolveDestination(row);

    // Away team always travels.
    const away = TEAMS[row.away];
    legs.push({
      week: row.week,
      team: row.away,
      fromLat: away.lat,
      fromLon: away.lon,
      toLat: dest.lat,
      toLon: dest.lon,
      destinationName: dest.name,
      destinationCity: dest.city,
      destinationInternational: dest.international,
      destinationVenueKey: dest.venueKey,
      opponent: row.home,
      miles: greatCircleMiles(away.lat, away.lon, dest.lat, dest.lon),
      neutralSite: !!isNeutral,
    });

    // For neutral-site games the listed "home" team also flies.
    if (isNeutral) {
      const home = TEAMS[row.home];
      legs.push({
        week: row.week,
        team: row.home,
        fromLat: home.lat,
        fromLon: home.lon,
        toLat: dest.lat,
        toLon: dest.lon,
        destinationName: dest.name,
        destinationCity: dest.city,
        destinationInternational: dest.international,
        destinationVenueKey: dest.venueKey,
        opponent: row.away,
        miles: greatCircleMiles(home.lat, home.lon, dest.lat, dest.lon),
        neutralSite: true,
      });
    }
  }

  return legs;
}

// Walk a team's sorted away/neutral legs chronologically to model realistic
// travel: consecutive away weeks connect venue-to-venue (the team stays on the
// road); a gap of one or more weeks means the team was at home in between
// (home game or bye). Implicit trips home at season start and end.
function computeSequentialMiles(teamKey, sortedLegs) {
  if (sortedLegs.length === 0) return 0;
  const home = TEAMS[teamKey];
  let prevLat = home.lat;
  let prevLon = home.lon;
  let prevWeek = 0;
  let total = 0;

  for (const leg of sortedLegs) {
    if (prevWeek > 0 && leg.week > prevWeek + 1) {
      total += greatCircleMiles(prevLat, prevLon, home.lat, home.lon);
      prevLat = home.lat;
      prevLon = home.lon;
    }
    total += greatCircleMiles(prevLat, prevLon, leg.toLat, leg.toLon);
    prevLat = leg.toLat;
    prevLon = leg.toLon;
    prevWeek = leg.week;
  }
  total += greatCircleMiles(prevLat, prevLon, home.lat, home.lon);
  return total;
}

// Per-team aggregate: total miles via the sequential walk above, plus the
// list of legs (sorted by week) and the international-miles breakdown so the
// panel can stack-bar each row.
//
// `internationalMiles` is the raw great-circle distance of legs whose
// destination is a neutral international venue (Wembley, Munich, Sao Paulo,
// …). `totalMiles` is the chronological sequential walk including return
// flights — they live in different accounting spaces, so the international
// share is bar-relative (`internationalMiles / max(legs miles)`), not a
// fraction of `totalMiles`.
export function summariseByTeam(legs) {
  const byTeam = {};
  for (const key of Object.keys(TEAMS)) {
    byTeam[key] = {
      team: key,
      totalMiles: 0,
      legMiles: 0,
      internationalMiles: 0,
      internationalCount: 0,
      legs: [],
    };
  }
  for (const leg of legs) {
    const summary = byTeam[leg.team];
    summary.legs.push(leg);
    summary.legMiles += leg.miles;
    if (leg.destinationInternational) {
      summary.internationalMiles += leg.miles;
      summary.internationalCount += 1;
    }
  }
  for (const summary of Object.values(byTeam)) {
    summary.legs.sort((a, b) => a.week - b.week);
    summary.totalMiles = computeSequentialMiles(summary.team, summary.legs);
  }
  return byTeam;
}

// Roll the per-team summary into one league-wide international view for the
// metric card and the panel-head call-out.
export function summariseInternational(summary) {
  let teamCount = 0;
  let totalMiles = 0;
  let gameCount = 0;
  for (const team of Object.values(summary)) {
    if (team.internationalCount > 0) {
      teamCount += 1;
      totalMiles += team.internationalMiles;
      gameCount += team.internationalCount;
    }
  }
  return { teamCount, totalMiles, gameCount };
}
