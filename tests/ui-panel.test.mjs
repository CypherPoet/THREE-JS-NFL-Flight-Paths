// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { buildTeamPanel } from "../src/ui.js";
import {
  buildTravelLegs,
  summariseByTeam,
  summariseInternational,
  SCHEDULES,
  DEFAULT_SEASON,
} from "../src/schedule.js";
import { TEAM_KEYS, teamConference } from "../src/data/teams.js";

// Minimal slice of index.html — only the elements buildTeamPanel queries
// from document. Keeps the test independent of unrelated chrome.
const FIXTURE_HTML = `
  <aside class="panel">
    <div class="panel__head">
      <button class="panel__head-clear" data-preset="none">Clear</button>
      <button class="panel__sort-button" data-sort="division" data-active="true" aria-pressed="true">By division</button>
      <button class="panel__sort-button" data-sort="mileage"  data-active="false" aria-pressed="false">By miles</button>
    </div>
    <div class="panel__presets">
      <button class="panel__preset" data-preset="all"           aria-pressed="false">All</button>
      <button class="panel__preset" data-preset="afc"           aria-pressed="false">AFC</button>
      <button class="panel__preset" data-preset="nfc"           aria-pressed="false">NFC</button>
      <button class="panel__preset" data-preset="longest5"      data-active="true" aria-pressed="true">Longest 5</button>
      <button class="panel__preset" data-preset="international" aria-pressed="false">International</button>
    </div>
    <p id="panel-intl"></p>
    <div id="panel-empty" hidden>
      <button id="panel-empty-restore" hidden>Restore last selection</button>
    </div>
    <ol id="team-list"></ol>
  </aside>
`;

function mount() {
  document.body.innerHTML = FIXTURE_HTML;
  const legs = buildTravelLegs(SCHEDULES[DEFAULT_SEASON].games);
  const summary = summariseByTeam(legs);
  const intl = summariseInternational(summary);
  buildTeamPanel({
    summary,
    intl,
    listEl: document.getElementById("team-list"),
    onChange: () => {},
  });
}

const afcKeys = TEAM_KEYS.filter((k) => teamConference(k) === "AFC");
const nfcKeys = TEAM_KEYS.filter((k) => teamConference(k) === "NFC");

describe("team panel ARIA state", () => {
  beforeEach(() => mount());

  it("AFC preset flips data-active AND aria-pressed in lockstep on team rows", () => {
    document.querySelector('.panel__preset[data-preset="afc"]').click();

    for (const k of afcKeys) {
      const row = document.querySelector(`.team-row[data-team="${k}"]`);
      expect(row, `missing row for ${k}`).toBeTruthy();
      expect(row.dataset.active).toBe("true");
      expect(row.getAttribute("aria-pressed")).toBe("true");
    }
    for (const k of nfcKeys) {
      const row = document.querySelector(`.team-row[data-team="${k}"]`);
      expect(row.dataset.active).toBe("false");
      expect(row.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("AFC preset chip itself shows aria-pressed=true and other chips show false", () => {
    document.querySelector('.panel__preset[data-preset="afc"]').click();
    for (const btn of document.querySelectorAll(".panel__preset")) {
      const expected = btn.dataset.preset === "afc" ? "true" : "false";
      expect(btn.getAttribute("aria-pressed"), btn.dataset.preset).toBe(expected);
    }
  });

  it("clicking the mileage sort flips aria-pressed on both sort buttons", () => {
    document.querySelector('.panel__sort-button[data-sort="mileage"]').click();

    const division = document.querySelector('.panel__sort-button[data-sort="division"]');
    const mileage = document.querySelector('.panel__sort-button[data-sort="mileage"]');
    expect(division.getAttribute("aria-pressed")).toBe("false");
    expect(division.dataset.active).toBe("false");
    expect(mileage.getAttribute("aria-pressed")).toBe("true");
    expect(mileage.dataset.active).toBe("true");
  });
});
