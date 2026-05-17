import { describe, it, expect } from "vitest";
import {
  SCHEDULES,
  DEFAULT_SEASON,
  buildTravelLegs,
  summariseByTeam,
} from "../src/schedule.js";
import { TEAMS, INTERNATIONAL_VENUES } from "../src/data/teams.js";
import { greatCircleMiles } from "../src/geo.js";

describe("SCHEDULES / DEFAULT_SEASON", () => {
  it("DEFAULT_SEASON keys into SCHEDULES with a non-empty games array", () => {
    const season = SCHEDULES[DEFAULT_SEASON];
    expect(season).toBeDefined();
    expect(Array.isArray(season.games)).toBe(true);
    expect(season.games.length).toBeGreaterThan(0);
  });
});

describe("buildTravelLegs", () => {
  it("a row with `venue` produces a travel leg for BOTH teams (neutral-site invariant)", () => {
    const venueKey = Object.keys(INTERNATIONAL_VENUES)[0];
    expect(venueKey).toBeDefined();
    const legs = buildTravelLegs([
      { week: 1, away: "KC", home: "MIA", venue: venueKey },
    ]);
    expect(legs).toHaveLength(2);
    const teams = legs.map((l) => l.team).sort();
    expect(teams).toEqual(["KC", "MIA"]);
    for (const leg of legs) {
      expect(leg.destinationInternational).toBe(true);
      expect(leg.neutralSite).toBe(true);
      expect(leg.destinationVenueKey).toBe(venueKey);
    }
  });

  it("a non-venue row produces a single leg from the away team's home to the home team's stadium", () => {
    const legs = buildTravelLegs([{ week: 1, away: "KC", home: "BUF" }]);
    expect(legs).toHaveLength(1);
    expect(legs[0].team).toBe("KC");
    expect(legs[0].destinationInternational).toBe(false);
    expect(legs[0].neutralSite).toBe(false);
  });
});

describe("summariseByTeam", () => {
  it("each team's legMiles equals the sum of its leg distances", () => {
    const legs = buildTravelLegs(SCHEDULES[DEFAULT_SEASON].games);
    const summary = summariseByTeam(legs);
    for (const team of Object.values(summary)) {
      const sum = team.legs.reduce((acc, l) => acc + l.miles, 0);
      expect(team.legMiles).toBeCloseTo(sum, 6);
    }
  });

  it("totalMiles is the chronological walk — at least as large as legMiles for any team with ≥1 away game", () => {
    // The sequential walk includes return-home flights when bye/home weeks
    // sit between road weeks, so it can only equal or exceed the leg sum.
    const legs = buildTravelLegs(SCHEDULES[DEFAULT_SEASON].games);
    const summary = summariseByTeam(legs);
    for (const team of Object.values(summary)) {
      if (team.legs.length === 0) continue;
      expect(team.totalMiles).toBeGreaterThanOrEqual(team.legMiles - 1e-6);
    }
  });

  it("consecutive road weeks return home in between when the home detour is modest (hub-and-spoke default)", () => {
    // KC plays at BUF (week 1) and MIA (week 2). Both venues are within a
    // reasonable detour of Kansas City, so the realistic model flies KC
    // home between the two road games rather than chaining BUF → MIA.
    const legs = buildTravelLegs([
      { week: 1, away: "KC", home: "BUF" },
      { week: 2, away: "KC", home: "MIA" },
    ]);
    const summary = summariseByTeam(legs);
    const kc = TEAMS.KC;
    const buf = TEAMS.BUF;
    const mia = TEAMS.MIA;
    const expectedHubAndSpoke =
      greatCircleMiles(kc.lat, kc.lon, buf.lat, buf.lon) +
      greatCircleMiles(buf.lat, buf.lon, kc.lat, kc.lon) +
      greatCircleMiles(kc.lat, kc.lon, mia.lat, mia.lon) +
      greatCircleMiles(mia.lat, mia.lon, kc.lat, kc.lon);
    expect(summary.KC.totalMiles).toBeCloseTo(expectedHubAndSpoke, 6);
  });

  it("consecutive road weeks stay on the road when going home would add more than 1,500 mi", () => {
    // SF plays at NYG (week 1) and BUF (week 2). Flying back to California
    // and out again would add thousands of miles vs. hopping NYG → BUF, so
    // the model keeps SF on the road for the back-to-back.
    const legs = buildTravelLegs([
      { week: 1, away: "SF", home: "NYG" },
      { week: 2, away: "SF", home: "BUF" },
    ]);
    const summary = summariseByTeam(legs);
    const sf = TEAMS.SF;
    const nyg = TEAMS.NYG;
    const buf = TEAMS.BUF;
    const expectedStayOnRoad =
      greatCircleMiles(sf.lat, sf.lon, nyg.lat, nyg.lon) +
      greatCircleMiles(nyg.lat, nyg.lon, buf.lat, buf.lon) +
      greatCircleMiles(buf.lat, buf.lon, sf.lat, sf.lon);
    expect(summary.SF.totalMiles).toBeCloseTo(expectedStayOnRoad, 6);
  });

  it("a bye/home week between two road games always forces a return-home flight", () => {
    // Even if the gap weeks could in principle be "stayed through", an
    // intervening week (gap > 1) breaks the trip — the team is at home for
    // that week, so the previous road trip ends home and the next starts home.
    const legs = buildTravelLegs([
      { week: 1, away: "SF", home: "NYG" },
      { week: 3, away: "SF", home: "BUF" },
    ]);
    const summary = summariseByTeam(legs);
    const sf = TEAMS.SF;
    const nyg = TEAMS.NYG;
    const buf = TEAMS.BUF;
    const expectedTwoRoundTrips =
      greatCircleMiles(sf.lat, sf.lon, nyg.lat, nyg.lon) +
      greatCircleMiles(nyg.lat, nyg.lon, sf.lat, sf.lon) +
      greatCircleMiles(sf.lat, sf.lon, buf.lat, buf.lon) +
      greatCircleMiles(buf.lat, buf.lon, sf.lat, sf.lon);
    expect(summary.SF.totalMiles).toBeCloseTo(expectedTwoRoundTrips, 6);
  });
});
