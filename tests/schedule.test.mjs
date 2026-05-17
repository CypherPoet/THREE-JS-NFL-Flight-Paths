import { describe, it, expect } from "vitest";
import {
  SCHEDULES,
  DEFAULT_SEASON,
  buildTravelLegs,
  summariseByTeam,
} from "../src/schedule.js";
import { INTERNATIONAL_VENUES } from "../src/data/teams.js";

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
});
