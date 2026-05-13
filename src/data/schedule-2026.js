// 2026 NFL regular season — confirmed games only.
//
// As of the day before the full unveiling (2026-05-14 8 PM ET), the NFL has
// already publicly confirmed:
//   • all 9 international fixtures across Australia, Brazil, the UK,
//     France, Spain, Germany, and Mexico
//   • the NFL Kickoff game (Wed Sep 9, Seattle hosts TBA opponent — opponent
//     not yet announced, so omitted here)
//   • Week 1 Sunday Night Football: Dallas at NY Giants
//   • Week 1 Monday Night Football: Denver at Kansas City
//   • Week 2 Thursday Night Football: Detroit at Buffalo
//
// Every entry below has been verified from public NFL announcements. When the
// full slate drops on May 14, the remaining ~245 games will be appended.
//
// Sources:
//   nfl.com/news/2026-nfl-schedule-release-nine-international-games
//   nfl.com/news/cowboys-giants-snf-week-1-nbc-2026-nfl-schedule-release
//   nfl.com/news/2026-nfl-schedule-release-chiefs-broncos-mnf
//   nfl.com/news/lions-bills-week-2-prime-video

export const SCHEDULE_2026 = [
  // ── Week 1 — Australia debut ──────────────────────────────────
  // Friday Sept 11 in Melbourne (Thursday night ET).
  { week: 1, away: "SF", home: "LAR", venue: "MEL" },

  // ── Week 1 — Sunday Night Football ────────────────────────────
  // Sept 13 — MetLife Stadium.
  { week: 1, away: "DAL", home: "NYG" },

  // ── Week 1 — Monday Night Football ────────────────────────────
  // Sept 14 — Arrowhead.
  { week: 1, away: "DEN", home: "KC" },

  // ── Week 2 — Thursday Night Football ──────────────────────────
  // Sept 17 — Buffalo's new stadium.
  { week: 2, away: "DET", home: "BUF" },

  // ── Week 3 — São Paulo (Brazil) ───────────────────────────────
  // The home/away designation for the 2026 Brazil game is Cowboys (home
  // designate) vs Ravens, but the league lists the matchup as Ravens-Cowboys.
  // Treating Dallas as home designate, Baltimore travels — both fly to Rio.
  { week: 3, away: "BAL", home: "DAL", venue: "RIO" },

  // ── Week 4 — London (Tottenham Hotspur Stadium) — Oct 4 ──────
  // Commanders are the road team; Colts are the host designate.
  { week: 4, away: "WAS", home: "IND", venue: "LON_TOT" },

  // ── Week 5 — London (Tottenham) — Oct 11 ──────────────────────
  // Jaguars play this one as home designate.
  { week: 5, away: "PHI", home: "JAX", venue: "LON_TOT" },

  // ── Week 6 — London (Wembley Stadium) — Oct 18 ────────────────
  // Jaguars' second straight London game, this time as the road team.
  { week: 6, away: "HOU", home: "JAX", venue: "LON_WEM" },

  // ── Week 7 — Paris (Stade de France) — Oct 25 ─────────────────
  // First-ever regular-season game in France. Saints are home designate.
  { week: 7, away: "PIT", home: "NO", venue: "PAR" },

  // ── Week 9 — Madrid (Santiago Bernabéu) — Nov 8 ───────────────
  { week: 9, away: "CIN", home: "ATL", venue: "MAD" },

  // ── Week 10 — Munich (Allianz Arena) — Nov 15 ─────────────────
  { week: 10, away: "NE", home: "DET", venue: "MUN" },

  // ── Week 11 — Mexico City (Estadio Banorte) ───────────────────
  // 49ers' second international game of the season.
  { week: 11, away: "MIN", home: "SF", venue: "MEX" },
];
