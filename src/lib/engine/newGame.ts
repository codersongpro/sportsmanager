import type { CompetitionFormat, GameState, Locale, Manager, SportId } from "@/lib/types";
import { createRng, hashSeed } from "@/lib/sim/rng";
import { getSport } from "@/lib/sports";
import { getLeaguesForSport } from "@/data/clubs";
import { buildWorld } from "./world";
import { createLeague, createTournament } from "./competition";

export interface NewGameOptions {
  sportId: SportId;
  format: CompetitionFormat;
  leagueId: string;
  clubId: string;
  managerName: string;
  locale: Locale;
  startSeason?: number;
}

export function createNewGame(opts: NewGameOptions): GameState {
  const sport = getSport(opts.sportId);
  const startSeason = opts.startSeason ?? new Date().getFullYear();
  const rng = createRng(hashSeed(`${opts.managerName}|${opts.clubId}|${Date.now()}`));

  const world = buildWorld(sport, rng, startSeason);
  const leagues = getLeaguesForSport(opts.sportId);
  const league = leagues.find((l) => l.id === opts.leagueId) ?? leagues[0];
  const clubsInLeague = Object.values(world.clubs).filter((c) => c.leagueId === league.id);
  for (const club of clubsInLeague) club.isUser = club.id === opts.clubId;

  const competition =
    opts.format === "league"
      ? createLeague(`${league.id}-${startSeason}`, league.name, league.country, clubsInLeague, startSeason)
      : createTournament(`${league.id}-${startSeason}`, league.name, league.country, "club", clubsInLeague, startSeason);

  const manager: Manager = {
    name: opts.managerName,
    sportId: opts.sportId,
    clubId: opts.clubId,
    reputation: 50,
  };

  const now = Date.now();
  return {
    version: 1,
    id: `save_${now}_${Math.floor(rng.next() * 1e6)}`,
    createdAt: now,
    updatedAt: now,
    sportId: opts.sportId,
    locale: opts.locale,
    day: 0,
    season: startSeason,
    manager,
    clubs: world.clubs,
    players: world.players,
    competition,
    news: [
      {
        id: "n0",
        day: 0,
        title: { ko: "새 시즌이 시작되었습니다", en: "A new season has begun" },
        read: false,
      },
    ],
    rngState: rng.state(),
    trainingFocus: "balanced",
    seasonOver: false,
  };
}
