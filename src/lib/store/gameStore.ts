import { create } from "zustand";
import type { Club, GameState, LocalizedText, Locale, Tactics } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { createNewGame, type NewGameOptions } from "@/lib/engine/newGame";
import { continueGame, rolloverSeason } from "@/lib/engine/season";
import { advanceActiveMatch, beginActiveMatch } from "@/lib/engine/activeMatch";
import { createWorldCup, simulateWorldCupRound, createClubCup, simulateClubCupRound, findUserPendingFixture } from "@/lib/engine/worldcup";
import { TEAM_TALK_OPTIONS } from "@/lib/data/teamTalks";
import { saveGame } from "./persistence";

interface GameStoreState {
  state: GameState | null;
  hydrated: boolean;
  setHydrated: () => void;
  loadFromSave: (save: GameState) => void;
  startNewGame: (opts: NewGameOptions) => void;
  continue: () => void;
  playNextSegment: () => void;
  makeSubstitution: (outId: string, inId: string) => TransferResult;
  giveTeamTalk: (optionKey: string) => TransferResult;
  rolloverSeason: () => void;
  setLocale: (locale: Locale) => void;
  setTrainingFocus: (key: string) => void;
  setTactics: (patch: Partial<Tactics>) => void;
  setLineup: (lineup: string[], bench: string[]) => void;
  autoPickLineup: () => void;
  markNewsRead: (id: string) => void;
  buyPlayer: (playerId: string) => TransferResult;
  sellPlayer: (playerId: string) => void;
  answerPress: (itemId: string, optionIndex: number) => void;
  startWorldCup: (userNationId?: string) => void;
  simulateWorldCupRound: () => void;
  playWorldCupMatch: () => void;
  startClubCup: () => void;
  simulateClubCupRound: () => void;
  playClubCupMatch: () => void;
}

export interface TransferResult {
  ok: boolean;
  message: LocalizedText;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Negotiated transfer fee: higher manager reputation = a better price. */
export function negotiatedFee(value: number, managerRep: number): number {
  const factor = 1.12 - managerRep / 500; // rep 50 -> 1.02x, rep 90 -> 0.94x
  return Math.max(50000, Math.round((value * factor) / 50000) * 50000);
}

function persist(state: GameState) {
  saveGame(state).catch(() => {
    /* best-effort autosave; ignore quota/availability errors */
  });
}

/**
 * The club the user is currently directing tactics/subs/team-talk for: their
 * domestic club normally, or (mid an interactive World Cup match) their
 * nation, which lives in a separate `worldCup.clubs` registry. Club Cup
 * matches need no special case since entrants are domestic clubs already in
 * `clubs`, controlled by the same manager.
 */
function controlledClub(state: GameState): { clubId: string; clubs: Record<string, Club> } | null {
  if (state.activeMatch?.scope === "worldcup") {
    const clubId = state.worldCup?.userNationId;
    return clubId ? { clubId, clubs: state.worldCup!.clubs } : null;
  }
  return { clubId: state.manager.clubId, clubs: state.clubs };
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),

  loadFromSave: (save) => set({ state: save }),

  startNewGame: (opts) => {
    const next = createNewGame(opts);
    set({ state: next });
    persist(next);
  },

  continue: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    // The engine pauses here when it reaches the user's own fixture
    // (`activeMatch`); the Match Center page then steps through it segment
    // by segment via `playNextSegment`.
    const next = continueGame(cur, sport);
    set({ state: next });
    persist(next);
  },

  playNextSegment: () => {
    const cur = get().state;
    if (!cur || !cur.activeMatch || cur.activeMatch.finished) return;
    const sport = getSport(cur.sportId);
    const next = advanceActiveMatch(cur, sport);
    set({ state: next });
    persist(next);
  },

  makeSubstitution: (outId, inId) => {
    const fail = (ko: string, en: string): TransferResult => ({ ok: false, message: { ko, en } });
    const cur = get().state;
    if (!cur) return fail("", "");
    const active = cur.activeMatch;
    if (!active || active.finished) return fail("진행 중인 경기가 없습니다", "No match in progress");
    const maxSubs = getSport(cur.sportId).matchPresentation.maxSubs ?? 5;
    if (active.subsMade >= maxSubs) return fail("교체 횟수를 모두 사용했습니다", "No substitutions remaining");
    if (active.subbedOffIds.includes(outId)) return fail("이미 교체되어 나간 선수입니다", "That player has already been substituted off");

    const ref = controlledClub(cur);
    if (!ref) return fail("", "");
    const myClub = ref.clubs[ref.clubId];
    if (!myClub.tactics.lineup.includes(outId)) return fail("선발 명단에 없는 선수입니다", "That player isn't in the lineup");
    if (!myClub.tactics.bench.includes(inId) || active.subbedOffIds.includes(inId)) {
      return fail("교체로 투입할 수 없는 선수입니다", "That player can't be brought on");
    }

    const next: GameState = structuredClone(cur);
    const club = active.scope === "worldcup" ? next.worldCup!.clubs[ref.clubId] : next.clubs[ref.clubId];
    club.tactics.lineup = club.tactics.lineup.map((id) => (id === outId ? inId : id));
    club.tactics.bench = club.tactics.bench.filter((id) => id !== inId);
    next.activeMatch!.subsMade += 1;
    next.activeMatch!.subbedOffIds = [...next.activeMatch!.subbedOffIds, outId];
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
    return { ok: true, message: { ko: "교체를 완료했습니다", en: "Substitution made" } };
  },

  giveTeamTalk: (optionKey) => {
    const fail = (ko: string, en: string): TransferResult => ({ ok: false, message: { ko, en } });
    const cur = get().state;
    if (!cur) return fail("", "");
    const active = cur.activeMatch;
    if (!active || active.finished) return fail("진행 중인 경기가 없습니다", "No match in progress");
    if (active.teamTalkGiven) return fail("이미 팀토크를 진행했습니다", "You've already given a team talk this match");
    const option = TEAM_TALK_OPTIONS.find((o) => o.key === optionKey);
    if (!option) return fail("알 수 없는 선택지입니다", "Unknown team talk option");
    const ref = controlledClub(cur);
    if (!ref) return fail("", "");

    const next: GameState = structuredClone(cur);
    const myClub = active.scope === "worldcup" ? next.worldCup!.clubs[ref.clubId] : next.clubs[ref.clubId];
    for (const id of myClub.tactics.lineup) {
      const p = next.players[id];
      if (p) p.morale = clamp(p.morale + option.moraleDelta, 0, 100);
    }
    next.activeMatch!.teamTalkGiven = true;
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
    return { ok: true, message: option.label };
  },

  rolloverSeason: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const next = rolloverSeason(cur, sport);
    set({ state: next });
    persist(next);
  },

  setLocale: (locale) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = { ...cur, locale, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  setTrainingFocus: (key) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = { ...cur, trainingFocus: key, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  setTactics: (patch) => {
    const cur = get().state;
    if (!cur) return;
    const ref = controlledClub(cur);
    if (!ref) return;
    const club = ref.clubs[ref.clubId];
    if (!club) return;
    const next: GameState = structuredClone(cur);
    const targetClub = cur.activeMatch?.scope === "worldcup" ? next.worldCup!.clubs[ref.clubId] : next.clubs[ref.clubId];
    targetClub.tactics = { ...club.tactics, ...patch };
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  setLineup: (lineup, bench) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    next.clubs[cur.manager.clubId].tactics.lineup = lineup;
    next.clubs[cur.manager.clubId].tactics.bench = bench;
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  autoPickLineup: () => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const next: GameState = structuredClone(cur);
    const club = next.clubs[cur.manager.clubId];
    const picked = sport.autoPickLineup(club, next.players);
    club.tactics.lineup = picked.lineup;
    club.tactics.bench = picked.bench;
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  markNewsRead: (id) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    const item = next.news.find((n) => n.id === id);
    if (item) item.read = true;
    set({ state: next });
    persist(next);
  },

  buyPlayer: (playerId) => {
    const fail = (ko: string, en: string): TransferResult => ({ ok: false, message: { ko, en } });
    const cur = get().state;
    if (!cur) return fail("", "");
    const player = cur.players[playerId];
    const myClub = cur.clubs[cur.manager.clubId];
    if (!player || !player.clubId || player.clubId === myClub.id) return fail("영입할 수 없는 선수입니다", "Player cannot be signed");
    const seller = cur.clubs[player.clubId];
    if (!seller) return fail("영입할 수 없는 선수입니다", "Player cannot be signed");

    const sport = getSport(cur.sportId);
    const rep = cur.manager.reputation;
    const fee = negotiatedFee(player.value, rep);
    const label = player.nameKo ?? player.name;
    if (myClub.finances.transferBudget < fee) return fail(`이적 예산이 부족합니다`, "Insufficient transfer budget");

    // Sign probability: club appeal + manager reputation vs the player's ambition.
    const appeal = myClub.reputation + rep * 0.5;
    const resistance = sport.calcOverall(player) + seller.reputation * 0.3;
    const prob = clamp(1 / (1 + Math.exp(-(appeal - resistance + 16) / 12)), 0.05, 0.97);

    const next: GameState = structuredClone(cur);
    if (Math.random() > prob) {
      next.news.unshift({ id: `n_t${Date.now()}`, day: next.day, title: { ko: `${label} 영입 협상 결렬`, en: `${player.name} rejected your approach` }, read: false });
      next.updatedAt = Date.now();
      set({ state: next });
      persist(next);
      return fail(`${label} 영입 협상이 결렬되었습니다 (감독 영향력 부족)`, `${player.name} turned down the move`);
    }

    const me = next.clubs[myClub.id];
    const from = next.clubs[player.clubId];
    me.finances.transferBudget -= fee;
    me.finances.balance -= fee;
    from.finances.balance += fee;
    from.squad = from.squad.filter((id) => id !== playerId);
    me.squad.push(playerId);
    next.players[playerId] = { ...player, clubId: me.id };
    next.news.unshift({ id: `n_t${Date.now()}`, day: next.day, title: { ko: `${label} 영입 완료`, en: `Signed ${player.name}` }, read: false });
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
    return { ok: true, message: { ko: `${label} 영입 완료`, en: `Signed ${player.name}` } };
  },

  sellPlayer: (playerId) => {
    const cur = get().state;
    if (!cur) return;
    const player = cur.players[playerId];
    const myClub = cur.clubs[cur.manager.clubId];
    if (!player || player.clubId !== myClub.id) return;

    const next: GameState = structuredClone(cur);
    const me = next.clubs[myClub.id];
    const fee = Math.round(player.value * 0.9);
    me.finances.balance += fee;
    me.finances.transferBudget += fee;
    me.squad = me.squad.filter((id) => id !== playerId);
    next.players[playerId] = { ...player, clubId: null };
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  answerPress: (itemId, optionIndex) => {
    const cur = get().state;
    if (!cur) return;
    const next: GameState = structuredClone(cur);
    const item = next.press?.find((p) => p.id === itemId);
    if (!item || item.answered) return;
    const opt = item.options[optionIndex];
    if (!opt) return;
    item.answered = true;
    item.chosen = optionIndex;

    const myClub = next.clubs[next.manager.clubId];
    for (const id of myClub.squad) {
      const p = next.players[id];
      if (p) p.morale = clamp(p.morale + opt.moraleDelta, 0, 100);
    }
    next.manager.reputation = clamp(Math.round((next.manager.reputation + opt.repDelta) * 10) / 10, 1, 99);
    next.news.unshift({ id: `n_p${Date.now()}`, day: next.day, title: opt.reply, read: false });
    next.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  startWorldCup: (userNationId) => {
    const cur = get().state;
    if (!cur) return;
    const sport = getSport(cur.sportId);
    const worldCup = createWorldCup(cur.players, sport, cur.season, userNationId);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  simulateWorldCupRound: () => {
    const cur = get().state;
    if (!cur || !cur.worldCup || cur.activeMatch) return;
    const sport = getSport(cur.sportId);
    const { worldCup } = simulateWorldCupRound(cur.worldCup, cur.players, sport);
    const next: GameState = { ...cur, worldCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  playWorldCupMatch: () => {
    const cur = get().state;
    if (!cur || !cur.worldCup || cur.activeMatch) return;
    const fixture = findUserPendingFixture(cur.worldCup.competition, cur.worldCup.userNationId);
    if (!fixture) return;
    const sport = getSport(cur.sportId);
    const next: GameState = { ...cur, activeMatch: beginActiveMatch(cur, fixture, sport, "worldcup"), updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  startClubCup: () => {
    const cur = get().state;
    if (!cur) return;
    const clubCup = createClubCup(cur.clubs, cur.season, cur.manager.clubId);
    const next: GameState = { ...cur, clubCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  simulateClubCupRound: () => {
    const cur = get().state;
    if (!cur || !cur.clubCup || cur.activeMatch) return;
    const sport = getSport(cur.sportId);
    const { clubCup } = simulateClubCupRound(cur.clubCup, cur.clubs, cur.players, sport);
    const next: GameState = { ...cur, clubCup, updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },

  playClubCupMatch: () => {
    const cur = get().state;
    if (!cur || !cur.clubCup || cur.activeMatch) return;
    const fixture = findUserPendingFixture(cur.clubCup.competition, cur.clubCup.userClubId);
    if (!fixture) return;
    const sport = getSport(cur.sportId);
    const next: GameState = { ...cur, activeMatch: beginActiveMatch(cur, fixture, sport, "clubcup"), updatedAt: Date.now() };
    set({ state: next });
    persist(next);
  },
}));
