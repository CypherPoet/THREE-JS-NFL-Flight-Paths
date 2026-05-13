import { TEAMS, INTERNATIONAL_VENUES } from "./data/teams.js";
import { SCHEDULE_2025 } from "./data/schedule-2025.js";
import { SCHEDULE_2026 } from "./data/schedule-2026.js";
import { greatCircleMiles } from "./geo.js";

export const SCHEDULES = {
  "2026": {
    label: "2026 Season",
    sublabel: "Confirmed slate — full release 2026-05-14",
    games: SCHEDULE_2026,
  },
  "2025": {
    label: "2025 Season",
    sublabel: "Sample reference slate",
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
    };
  }
  const home = TEAMS[row.home];
  return {
    lat: home.lat,
    lon: home.lon,
    name: home.stadium,
    city: home.city,
    international: false,
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
        opponent: row.away,
        miles: greatCircleMiles(home.lat, home.lon, dest.lat, dest.lon),
        neutralSite: true,
      });
    }
  }

  return legs;
}

// Per-team aggregate: total miles, leg count, list of legs (sorted by week).
export function summariseByTeam(legs) {
  const byTeam = {};
  for (const key of Object.keys(TEAMS)) {
    byTeam[key] = { team: key, totalMiles: 0, legs: [] };
  }
  for (const leg of legs) {
    byTeam[leg.team].totalMiles += leg.miles;
    byTeam[leg.team].legs.push(leg);
  }
  for (const summary of Object.values(byTeam)) {
    summary.legs.sort((a, b) => a.week - b.week);
  }
  return byTeam;
}
