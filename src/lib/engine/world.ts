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

// A full international squad size to backfill the user's guaranteed nation up to.
const GUARANTEED_SQUAD_SIZE = 23;
const MAX_NATIONAL_SQUAD = 26;

/** Position group ("GK"/"DEF"/... or sport equivalent) of a player's primary position. */
function groupOfPlayer(sport: SportModule, p: Player): string {
  const key = p.positions[0] ?? "";
  return sport.positions.find((m) => m.key === key)?.group ?? "";
}

/** How many starters of each position group the national club's default formation needs. */
function formationGroupNeed(sport: SportModule): Record<string, number> {
  const key = sport.defaultTactics().formation;
  const form = sport.formations.find((f) => f.key === key) ?? sport.formations[0];
  const need: Record<string, number> = {};
  for (const slot of form.slots) {
    const g = sport.positions.find((m) => m.key === slot.position)?.group ?? "";
    need[g] = (need[g] ?? 0) + 1;
  }
  return need;
}

/**
 * Pick a national squad that always covers every position group the formation
 * needs, so `autoPickLineup` can field a valid lineup (no missing goalkeeper,
 * pitcher, etc). Players come from the nation's own pool first (best overall),
 * then — only to patch a short/missing group, or to reach `floorSize` for the
 * user's guaranteed nation — the best available players worldwide are borrowed.
 * `claimed` is mutated so no player is ever on two national teams.
 */
function selectNationalSquad(
  sport: SportModule,
  naturalPool: Player[],
  reserve: Player[],
  claimed: Set<string>,
  groupNeed: Record<string, number>,
  floorSize: number,
): Player[] {
  const chosen: Player[] = [];
  const ids = new Set<string>();
  const add = (p: Player) => {
    chosen.push(p);
    ids.add(p.id);
    claimed.add(p.id);
  };
  const natural = naturalPool
    .filter((p) => !claimed.has(p.id))
    .sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
  const groupCount = (g: string) => chosen.reduce((n, p) => n + (groupOfPlayer(sport, p) === g ? 1 : 0), 0);

  // 1) Cover each required position group: own players first, then borrow.
  for (const g of Object.keys(groupNeed)) {
    for (const p of natural) {
      if (groupCount(g) >= groupNeed[g]) break;
      if (!ids.has(p.id) && groupOfPlayer(sport, p) === g) add(p);
    }
    for (const p of reserve) {
      if (groupCount(g) >= groupNeed[g]) break;
      if (!claimed.has(p.id) && groupOfPlayer(sport, p) === g) add(p);
    }
  }

  // 2) Fill out the squad with the nation's remaining best players.
  for (const p of natural) {
    if (chosen.length >= MAX_NATIONAL_SQUAD) break;
    if (!ids.has(p.id)) add(p);
  }

  // 3) Guaranteed nation only: top up to a full squad from the world pool.
  for (const p of reserve) {
    if (chosen.length >= floorSize) break;
    if (!claimed.has(p.id)) add(p);
  }

  return chosen;
}

function buildNationalClub(sport: SportModule, players: Record<string, Player>, country: (typeof COUNTRIES)[number], squadPlayers: Player[]): Club {
  const ranked = [...squadPlayers].sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
  const top = ranked.slice(0, Math.min(16, ranked.length));
  const reputation = top.length ? Math.round(top.reduce((s, p) => s + sport.calcOverall(p), 0) / top.length) : 50;

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
    squad: ranked.map((p) => p.id),
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
 * Only nations with enough players of their own get a team. Returns national
 * clubs keyed by `nat-<code>`; player ids are shared with their domestic clubs.
 *
 * Every squad is made position-complete (see `selectNationalSquad`) so no
 * national side is ever missing the positions its formation needs. The
 * `guaranteedCode` nation, when given, always gets a team — backfilled to a
 * full squad from the rest of the world — so the user's chosen nation is never
 * unplayable.
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

  // Best-first world pool, reused to patch position gaps / backfill thin squads.
  const reserve = Object.values(players).sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
  const groupNeed = formationGroupNeed(sport);
  const nationals: Record<string, Club> = {};
  const claimed = new Set<string>();

  if (guaranteedCode) {
    const country = COUNTRY_BY_CODE[guaranteedCode];
    if (country) {
      const squad = selectNationalSquad(sport, byNation[country.code] ?? [], reserve, claimed, groupNeed, GUARANTEED_SQUAD_SIZE);
      const club = buildNationalClub(sport, players, country, squad);
      nationals[club.id] = club;
    }
  }

  for (const country of COUNTRIES) {
    if (country.code === guaranteedCode) continue;
    const natural = (byNation[country.code] ?? []).filter((p) => !claimed.has(p.id));
    if (natural.length < minSquad) continue;
    // floorSize 0: AI nations fill from their own pool and only borrow to patch
    // a missing position group, keeping their national identity intact.
    const squad = selectNationalSquad(sport, natural, reserve, claimed, groupNeed, 0);
    const club = buildNationalClub(sport, players, country, squad);
    nationals[club.id] = club;
  }
  return nationals;
}
