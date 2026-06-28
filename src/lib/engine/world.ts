import type { Club, Finances, Player, SportId, SportModule, Tactics } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/data/countries";
import { getClubsForSport, getNameArchetypesForSport, type ClubSeed } from "@/data/clubs";

export interface World {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
}

const STRENGTH_WEIGHTS = COUNTRIES.map((c) => c.strength);

function pickNationality(seed: ClubSeed, rng: RNG): string {
  // ~55% home nation, else a foreign nation weighted by football strength
  if (rng.bool(0.55)) return seed.country;
  return rng.weighted(
    COUNTRIES.map((c) => c.code),
    STRENGTH_WEIGHTS,
  );
}

function nameFromCountry(country: (typeof COUNTRIES)[number], fi: number, li: number): { name: string; nameKo: string } {
  const first = country.firstNames[fi];
  const last = country.lastNames[li];
  const firstKo = country.firstNamesKo[fi];
  const lastKo = country.lastNamesKo[li];
  const name = `${first} ${last}`;
  // Korean names render family-name-first with no space, matching local convention.
  const nameKo = country.code === "KR" ? `${lastKo}${firstKo}` : `${firstKo} ${lastKo}`;
  return { name, nameKo };
}

/**
 * Generates a player name guaranteed not to collide with any name already
 * handed out this world build, so players on different teams never share a
 * name. Tries the player's own nation first, then falls through every other
 * nation's name pool before finally disambiguating with a numeric suffix
 * (which should only ever happen once every combination is exhausted).
 */
function makeName(sportId: SportId, code: string, rng: RNG, usedNames: Set<string>, preferArchetype = false): { name: string; nameKo: string } {
  const archetypes = getNameArchetypesForSport(sportId);
  const availableArchetypes = archetypes.filter((a) => !usedNames.has(a.name));
  if (availableArchetypes.length > 0 && (preferArchetype || rng.bool(0.18))) {
    const choice = availableArchetypes[rng.int(0, availableArchetypes.length - 1)];
    usedNames.add(choice.name);
    return choice;
  }

  const country = COUNTRY_BY_CODE[code] ?? COUNTRIES[0];
  for (let attempt = 0; attempt < 30; attempt++) {
    const fi = rng.int(0, country.firstNames.length - 1);
    const li = rng.int(0, country.lastNames.length - 1);
    const candidate = nameFromCountry(country, fi, li);
    if (!usedNames.has(candidate.name)) {
      usedNames.add(candidate.name);
      return candidate;
    }
  }
  // The home nation's pool is exhausted (rare); search every other nation's pool.
  for (const fallback of COUNTRIES) {
    for (let fi = 0; fi < fallback.firstNames.length; fi++) {
      for (let li = 0; li < fallback.lastNames.length; li++) {
        const candidate = nameFromCountry(fallback, fi, li);
        if (!usedNames.has(candidate.name)) {
          usedNames.add(candidate.name);
          return candidate;
        }
      }
    }
  }
  // Every combination in every nation is taken (extreme edge case): disambiguate.
  let n = 2;
  const candidate = nameFromCountry(country, 0, 0);
  while (usedNames.has(`${candidate.name} ${n}`)) n++;
  usedNames.add(`${candidate.name} ${n}`);
  return { name: `${candidate.name} ${n}`, nameKo: `${candidate.nameKo}${n}` };
}

function clubFinances(reputation: number, weeklyWageTotal: number): Finances {
  const transferBudget = Math.max(
    1_000_000,
    Math.round((reputation - 60) ** 2 * 220_000),
  );
  return {
    balance: Math.round(transferBudget * 1.4),
    transferBudget,
    wageBudget: Math.round(weeklyWageTotal * 1.25),
  };
}

/** Build the full club world: every club populated with ~30 players. */
export function buildWorld(sport: SportModule, rng: RNG, startSeason: number): World {
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};
  const usedNames = new Set<string>();

  for (const seed of getClubsForSport(sport.id)) {
    const squad: string[] = [];
    let number = 1;
    let depthIndex = 0;

    for (const slot of sport.squadTemplate) {
      for (let i = 0; i < slot.count; i++) {
        // first-choice players near club reputation, depth weaker
        const depthPenalty = i === 0 ? rng.range(-1, 4) : -rng.range(3, 11);
        const target = Math.max(40, Math.min(94, seed.reputation + depthPenalty + rng.gaussian(0, 3)));
        const nat = pickNationality(seed, rng);
        const nm = makeName(sport.id, nat, rng, usedNames, sport.id !== "soccer" && i === 0);
        const id = `p_${seed.id}_${depthIndex++}`;
        const player = sport.generatePlayer(
          {
            id,
            name: nm.name,
            nameKo: nm.nameKo,
            nationality: nat,
            position: slot.pos,
            targetOverall: Math.round(target),
            clubId: seed.id,
          },
          rng,
        );
        player.contractUntil = startSeason + rng.int(1, 4);
        player.squadNumber = number++;
        players[id] = player;
        squad.push(id);
      }
    }

    const weeklyWageTotal = squad.reduce((s, id) => s + players[id].wage, 0);
    const tactics: Tactics = sport.defaultTactics();
    const club: Club = {
      id: seed.id,
      name: seed.name.en,
      nameKo: seed.name.ko,
      shortName: seed.short,
      leagueId: seed.leagueId,
      country: seed.country,
      reputation: seed.reputation,
      finances: clubFinances(seed.reputation, weeklyWageTotal),
      squad,
      tactics,
      primaryColor: seed.color,
    };
    const picked = sport.autoPickLineup(club, players);
    club.tactics = { ...tactics, lineup: picked.lineup, bench: picked.bench };
    clubs[seed.id] = club;
  }

  return { clubs, players };
}

function buildNationalClub(sport: SportModule, players: Record<string, Player>, country: (typeof COUNTRIES)[number], pool: Player[]): Club {
  pool.sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
  const squadPlayers = pool.slice(0, 26);
  const top = squadPlayers.slice(0, 16);
  const reputation = Math.round(top.reduce((s, p) => s + sport.calcOverall(p), 0) / top.length);

  const id = `nat-${country.code}`;
  const club: Club = {
    id,
    name: country.name.en,
    nameKo: country.name.ko,
    shortName: country.code,
    leagueId: "world",
    country: country.code,
    reputation,
    finances: { balance: 0, transferBudget: 0, wageBudget: 0 },
    squad: squadPlayers.map((p) => p.id),
    tactics: sport.defaultTactics(),
    primaryColor: "#2b6cb0",
    isNational: true,
  };
  const picked = sport.autoPickLineup(club, players);
  club.tactics = { ...club.tactics, lineup: picked.lineup, bench: picked.bench };
  return club;
}

/**
 * Build national teams from the club player pool, grouped by nationality.
 * Only nations with enough players get a team. Returns national clubs keyed by
 * `nat-<code>`; player ids are shared with their domestic clubs.
 *
 * `guaranteedCode`, when given, always gets a team regardless of its natural
 * pool size — if that pool can't even fill a starting squad (per the sport's
 * `squadTemplate` total), it's backfilled with the best available players
 * from the rest of the world so the user's chosen nation is never unplayable.
 */
export function buildNationalTeams(
  sport: SportModule,
  players: Record<string, Player>,
  minSquad = 16,
  guaranteedCode?: string,
): Record<string, Club> {
  const byNation: Record<string, Player[]> = {};
  for (const p of Object.values(players)) {
    (byNation[p.nationality] ??= []).push(p);
  }

  const nationals: Record<string, Club> = {};
  const claimed = new Set<string>();

  if (guaranteedCode) {
    const country = COUNTRY_BY_CODE[guaranteedCode];
    if (country) {
      const pool = (byNation[country.code] ?? []).slice();
      const requiredMin = sport.squadTemplate.reduce((s, slot) => s + slot.count, 0);
      if (pool.length < requiredMin) {
        const have = new Set(pool.map((p) => p.id));
        const rest = Object.values(players)
          .filter((p) => !have.has(p.id))
          .sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
        for (const p of rest) {
          if (pool.length >= requiredMin) break;
          pool.push(p);
        }
      }
      const club = buildNationalClub(sport, players, country, pool);
      nationals[club.id] = club;
      for (const id of club.squad) claimed.add(id);
    }
  }

  for (const country of COUNTRIES) {
    if (country.code === guaranteedCode) continue;
    const pool = (byNation[country.code] ?? []).filter((p) => !claimed.has(p.id));
    if (pool.length < minSquad) continue;
    const club = buildNationalClub(sport, players, country, pool);
    nationals[club.id] = club;
  }
  return nationals;
}
