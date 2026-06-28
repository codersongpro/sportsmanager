import type { CompetitionFormat, CompetitionState, GameState, Locale, Manager, SportId } from "@/lib/types";
import { createRng, hashSeed } from "@/lib/sim/rng";
import { getSport } from "@/lib/sports";
import { getLeaguesForSport } from "@/data/clubs";
import { COUNTRY_BY_CODE } from "@/data/countries";
import { buildWorld, buildNationalTeams } from "./world";
import { createLeague, createTournament } from "./competition";

export interface NewGameOptions {
  sportId: SportId;
  format: CompetitionFormat;
  entityType?: "club" | "nation";
  leagueId?: string;
  clubId?: string;
  countryCode?: string;
  managerName: string;
  locale: Locale;
  startSeason?: number;
}

export function createNewGame(opts: NewGameOptions): GameState {
  const sport = getSport(opts.sportId);
  const startSeason = opts.startSeason ?? new Date().getFullYear();
  const rng = createRng(hashSeed(`${opts.managerName}|${opts.clubId ?? opts.countryCode}|${Date.now()}`));

  const world = buildWorld(sport, rng, startSeason);

  let competition: CompetitionState;
  let partnerCompetition: CompetitionState | undefined;
  let managerClubId: string;

  if (opts.entityType === "nation") {
    const countryCode = opts.countryCode!;
    const country = COUNTRY_BY_CODE[countryCode];
    const nationalClubs = buildNationalTeams(sport, world.players, 16, countryCode);
    Object.assign(world.clubs, nationalClubs);
    managerClubId = `nat-${countryCode}`;
    world.clubs[managerClubId].isUser = true;

    const entrants = Object.values(nationalClubs);
    const compId = `nat-${countryCode}-${startSeason}`;
    const compName = country ? country.name : { ko: "월드 챔피언십", en: "World Championship" };
    competition =
      opts.format === "league"
        ? createLeague(compId, compName, "world", entrants, startSeason, "national")
        : createTournament(compId, compName, "world", "national", entrants, startSeason);
  } else {
    const leagues = getLeaguesForSport(opts.sportId);
    const league = leagues.find((l) => l.id === opts.leagueId) ?? leagues[0];
    const clubsInLeague = Object.values(world.clubs).filter((c) => c.leagueId === league.id);
    for (const club of clubsInLeague) club.isUser = club.id === opts.clubId;
    managerClubId = opts.clubId!;

    competition =
      opts.format === "league"
        ? createLeague(`${league.id}-${startSeason}`, league.name, league.country, clubsInLeague, startSeason, "club")
        : createTournament(`${league.id}-${startSeason}`, league.name, league.country, "club", clubsInLeague, startSeason);

    const partnerLeague = leagues.find((l) => l.divisionId === league.id && l.id !== league.id);
    partnerCompetition = partnerLeague
      ? createLeague(
          `${partnerLeague.id}-${startSeason}`,
          partnerLeague.name,
          partnerLeague.country,
          Object.values(world.clubs).filter((c) => c.leagueId === partnerLeague.id),
          startSeason,
          "club",
        )
      : undefined;
  }

  const manager: Manager = {
    name: opts.managerName,
    sportId: opts.sportId,
    clubId: managerClubId,
    reputation: 50,
  };

  const now = Date.now();
  return {
    version: 2,
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
    partnerCompetition,
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
