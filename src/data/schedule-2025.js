// 2025 NFL regular season sample slate.
// Each row is a single game; `away` flies to `home`'s stadium.
// `venue` overrides the home stadium when a game is played at an international site.
// (The 2026 slate is published 2026-05-14 — once it drops this file will be swapped out.)

export const SCHEDULE_2025 = [
  // ── International games ───────────────────────────────────────
  { week: 1, away: "LAC", home: "KC", venue: "SAO" }, // Friday night São Paulo
  { week: 4, away: "MIN", home: "PIT", venue: "DUB" }, // Dublin
  { week: 5, away: "MIN", home: "CLE", venue: "LON_TOT" },
  { week: 6, away: "DEN", home: "NYJ", venue: "LON_TOT" },
  { week: 7, away: "LAR", home: "JAX", venue: "LON_WEM" },
  { week: 10, away: "ATL", home: "IND", venue: "MAD" },
  { week: 10, away: "WAS", home: "MIA", venue: "MAD" },
  { week: 10, away: "IND", home: "ATL", venue: "MUN" },

  // ── AFC East divisional pairs ─────────────────────────────────
  { week: 2, away: "MIA", home: "NE" },
  { week: 3, away: "NYJ", home: "BUF" },
  { week: 7, away: "NE", home: "MIA" },
  { week: 9, away: "BUF", home: "MIA" },
  { week: 11, away: "NYJ", home: "NE" },
  { week: 13, away: "MIA", home: "NYJ" },
  { week: 15, away: "NE", home: "BUF" },
  { week: 16, away: "BUF", home: "NYJ" },

  // ── AFC North divisional pairs ────────────────────────────────
  { week: 2, away: "CLE", home: "BAL" },
  { week: 4, away: "BAL", home: "CIN" },
  { week: 6, away: "PIT", home: "CLE" },
  { week: 7, away: "CIN", home: "PIT" },
  { week: 10, away: "CLE", home: "PIT" },
  { week: 13, away: "BAL", home: "CLE" },
  { week: 14, away: "CIN", home: "BAL" },
  { week: 16, away: "PIT", home: "CIN" },

  // ── AFC South divisional pairs ────────────────────────────────
  { week: 2, away: "JAX", home: "HOU" },
  { week: 3, away: "IND", home: "TEN" },
  { week: 6, away: "TEN", home: "JAX" },
  { week: 9, away: "HOU", home: "IND" },
  { week: 13, away: "JAX", home: "IND" },
  { week: 14, away: "IND", home: "HOU" },
  { week: 15, away: "HOU", home: "TEN" },
  { week: 17, away: "TEN", home: "HOU" },

  // ── AFC West divisional pairs ─────────────────────────────────
  { week: 4, away: "KC", home: "LV" },
  { week: 5, away: "LAC", home: "DEN" },
  { week: 6, away: "DEN", home: "KC" }, // (already an intl LON game wk6 — keep as alt)
  { week: 11, away: "LV", home: "DEN" },
  { week: 12, away: "KC", home: "LAC" },
  { week: 14, away: "LAC", home: "KC" },
  { week: 15, away: "DEN", home: "LV" },
  { week: 17, away: "LV", home: "LAC" },

  // ── NFC East divisional pairs ─────────────────────────────────
  { week: 2, away: "WAS", home: "DAL" },
  { week: 3, away: "PHI", home: "NYG" },
  { week: 5, away: "NYG", home: "PHI" },
  { week: 7, away: "DAL", home: "WAS" },
  { week: 10, away: "WAS", home: "NYG" },
  { week: 13, away: "DAL", home: "PHI" },
  { week: 16, away: "PHI", home: "DAL" },
  { week: 17, away: "NYG", home: "WAS" },

  // ── NFC North divisional pairs ────────────────────────────────
  { week: 2, away: "DET", home: "GB" },
  { week: 4, away: "MIN", home: "CHI" },
  { week: 8, away: "GB", home: "MIN" },
  { week: 11, away: "CHI", home: "DET" },
  { week: 13, away: "GB", home: "DET" },
  { week: 14, away: "DET", home: "MIN" },
  { week: 15, away: "MIN", home: "GB" },
  { week: 17, away: "CHI", home: "MIN" },

  // ── NFC South divisional pairs ────────────────────────────────
  { week: 2, away: "ATL", home: "CAR" },
  { week: 3, away: "TB", home: "NO" },
  { week: 5, away: "NO", home: "ATL" },
  { week: 9, away: "CAR", home: "TB" },
  { week: 12, away: "ATL", home: "NO" },
  { week: 13, away: "CAR", home: "ATL" },
  { week: 15, away: "TB", home: "CAR" },
  { week: 17, away: "NO", home: "TB" },

  // ── NFC West divisional pairs ─────────────────────────────────
  { week: 2, away: "SF", home: "ARI" },
  { week: 4, away: "SEA", home: "LAR" },
  { week: 7, away: "LAR", home: "SF" },
  { week: 8, away: "ARI", home: "SEA" },
  { week: 10, away: "SF", home: "SEA" },
  { week: 12, away: "LAR", home: "ARI" },
  { week: 14, away: "SEA", home: "ARI" },
  { week: 16, away: "SF", home: "LAR" },

  // ── AFC East ↔ NFC West ───────────────────────────────────────
  { week: 1, away: "ARI", home: "NE" },
  { week: 1, away: "SEA", home: "MIA" },
  { week: 4, away: "BUF", home: "LAR" },
  { week: 5, away: "NYJ", home: "SF" },
  { week: 9, away: "LAR", home: "MIA" },
  { week: 11, away: "ARI", home: "BUF" },
  { week: 14, away: "NE", home: "SEA" },
  { week: 16, away: "SF", home: "BUF" },

  // ── AFC North ↔ NFC South ─────────────────────────────────────
  { week: 1, away: "BAL", home: "TB" },
  { week: 3, away: "NO", home: "CLE" },
  { week: 5, away: "CAR", home: "PIT" },
  { week: 8, away: "BAL", home: "CAR" },
  { week: 9, away: "ATL", home: "CIN" },
  { week: 12, away: "CIN", home: "NO" },
  { week: 14, away: "TB", home: "CLE" },
  { week: 17, away: "PIT", home: "ATL" },

  // ── AFC South ↔ NFC North ─────────────────────────────────────
  { week: 1, away: "HOU", home: "CHI" },
  { week: 3, away: "GB", home: "JAX" },
  { week: 6, away: "IND", home: "DET" },
  { week: 8, away: "DET", home: "TEN" },
  { week: 11, away: "JAX", home: "GB" },
  { week: 12, away: "TEN", home: "MIN" },
  { week: 16, away: "MIN", home: "HOU" },
  { week: 17, away: "IND", home: "CHI" },

  // ── AFC West ↔ NFC East ───────────────────────────────────────
  { week: 1, away: "DAL", home: "DEN" },
  { week: 3, away: "WAS", home: "KC" },
  { week: 5, away: "DEN", home: "PHI" },
  { week: 6, away: "LAC", home: "NYG" },
  { week: 8, away: "NYG", home: "LV" },
  { week: 12, away: "LV", home: "DAL" },
  { week: 14, away: "PHI", home: "LAC" },
  { week: 16, away: "KC", home: "WAS" },

  // ── AFC East ↔ AFC North ──────────────────────────────────────
  { week: 1, away: "PIT", home: "NYJ" },
  { week: 4, away: "MIA", home: "BAL" },
  { week: 8, away: "CLE", home: "BUF" },
  { week: 12, away: "NE", home: "CIN" },

  // ── AFC South ↔ AFC West ──────────────────────────────────────
  { week: 4, away: "TEN", home: "KC" },
  { week: 8, away: "IND", home: "DEN" },
  { week: 9, away: "JAX", home: "LV" },
  { week: 11, away: "HOU", home: "LAC" },

  // ── NFC East ↔ NFC South ──────────────────────────────────────
  { week: 5, away: "NYG", home: "NO" },
  { week: 8, away: "TB", home: "WAS" },
  { week: 11, away: "DAL", home: "ATL" },
  { week: 12, away: "PHI", home: "CAR" },

  // ── NFC North ↔ NFC West ──────────────────────────────────────
  { week: 1, away: "SF", home: "GB" },
  { week: 9, away: "DET", home: "SEA" },
  { week: 11, away: "MIN", home: "LAR" },
  { week: 12, away: "CHI", home: "ARI" },

  // ── 17th game (intra-conf, opp-division cross) ────────────────
  { week: 18, away: "KC", home: "PHI" },
  { week: 18, away: "LAC", home: "ATL" },
  { week: 18, away: "BAL", home: "MIN" },
  { week: 18, away: "PIT", home: "DET" },
  { week: 18, away: "HOU", home: "SF" },
  { week: 18, away: "BUF", home: "WAS" },
  { week: 18, away: "MIA", home: "TB" },
  { week: 18, away: "NE", home: "GB" },
  { week: 18, away: "NYJ", home: "DAL" },
  { week: 18, away: "CIN", home: "CAR" },
  { week: 18, away: "CLE", home: "CHI" },
  { week: 18, away: "JAX", home: "SEA" },
  { week: 18, away: "IND", home: "LAR" },
  { week: 18, away: "TEN", home: "ARI" },
  { week: 18, away: "DEN", home: "NO" },
  { week: 18, away: "LV", home: "NYG" },
];
