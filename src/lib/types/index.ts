// Shared domain types for the sports manager game.
// The model is split along two orthogonal axes:
//   - SportModule  : rules that differ per sport (soccer / baseball / ...)
//   - Competition  : how fixtures are organised (league / tournament)
// The core game loop only talks to these interfaces, so adding a sport or a
// competition format does not require touching the engine.

import type { RNG } from "@/lib/sim/rng";

export type SportId = "soccer" | "basketball" | "baseball" | "volleyball" | "pickleball";
export type Locale = "ko" | "en";
export type CompetitionFormat = "league" | "tournament";

/** A piece of text available in both supported languages. */
export interface LocalizedText {
  ko: string;
  en: string;
}

// ---------------------------------------------------------------------------
// Players, clubs, tactics
// ---------------------------------------------------------------------------

export type PositionKey = string; // sport-defined, e.g. "GK", "ST", "P", "OH"

export interface Player {
  id: string;
  name: string; // latin / display name
  nameKo?: string; // optional korean transliteration
  nationality: string; // ISO-ish country code, see data/countries
  age: number;
  positions: PositionKey[]; // eligible positions, primary first
  attributes: Record<string, number>; // 0-100 per sport attribute key
  potential: number; // 0-100 ability ceiling
  morale: number; // 0-100
  condition: number; // 0-100 match fitness
  form: number; // -5..+5 recent form modifier
  value: number; // market value (in money units)
  wage: number; // weekly wage
  contractUntil: number; // season year contract expires
  squadNumber?: number;
  clubId: string | null;
  injuredUntilDay?: number; // global day index, if injured
  playstyles: string[]; // position-appropriate play-style trait keys
  /** hidden development speed multiplier (0.6 fast .. 1.4 slow), affects growth */
  devFactor: number;
  /** matches played this season, feeds growth from experience */
  apps?: number;
  /** recent match ratings (most recent last), powers the form card */
  recentForm?: FormEntry[];
}

export interface FormEntry {
  day: number;
  rating: number;
  oppShort: string;
  result: "W" | "D" | "L";
  scoreFor: number;
  scoreAgainst: number;
}

export interface Finances {
  balance: number; // cash on hand
  transferBudget: number; // available to spend on fees
  wageBudget: number; // weekly wage cap
}

export interface Tactics {
  formation: string; // e.g. "4-3-3"
  mentality: "defensive" | "balanced" | "attacking";
  tempo: "slow" | "normal" | "fast";
  pressing: "low" | "medium" | "high";
  width: "narrow" | "normal" | "wide";
  lineup: string[]; // starting player ids, ordered by formation slot
  bench: string[]; // substitute player ids
}

export interface Club {
  id: string;
  name: string;
  nameKo?: string;
  shortName: string;
  leagueId: string;
  country: string;
  reputation: number; // 1-100 strength/prestige tier
  finances: Finances;
  squad: string[]; // player ids
  tactics: Tactics;
  primaryColor?: string;
  isUser?: boolean;
  /** true for national teams (World Cup mode) */
  isNational?: boolean;
}

// ---------------------------------------------------------------------------
// Matches & results
// ---------------------------------------------------------------------------

/** Sport-defined event kind (soccer: "goal", basketball: "three", ...). */
export type MatchEventType = string;

/** Absolute ball/play area (home attacks toward `right`). */
export type PitchZone = "left" | "mid" | "right";

export interface MatchEvent {
  /** progress along the match timeline (sport-defined unit, e.g. 0-90). */
  minute: number;
  type: MatchEventType;
  clubId: string;
  playerId?: string;
  /** secondary player (assist provider, fouled player, etc.) */
  assistId?: string;
  detail?: LocalizedText;
  /** where on the playing surface this happened, for live visualization */
  zone?: PitchZone;
}

export interface MatchStats {
  homePossession: number; // 0-100 (away = 100 - this)
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
}

export interface MatchResult {
  fixtureId: string;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerRatings: Record<string, number>; // playerId -> 0-10 rating
  stats: MatchStats;
  /** decisive winner for knockout ties (after ET / penalties) */
  winnerId?: string;
  decidedBy?: "normal" | "extra_time" | "penalties";
  homePens?: number;
  awayPens?: number;
}

// ---------------------------------------------------------------------------
// Competitions: league table & knockout bracket
// ---------------------------------------------------------------------------

export interface Fixture {
  id: string;
  round: number; // matchday (league) or knockout round index
  homeId: string;
  awayId: string | null; // null = bye (tournament)
  day: number; // global day index the fixture is played
  played: boolean;
  result?: MatchResult;
  /** slot inside the bracket round, for tournament wiring */
  bracketSlot?: number;
}

export interface LeagueRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface BracketMatch {
  fixtureId: string | null;
  homeId: string | null;
  awayId: string | null;
  winnerId: string | null;
}

export interface BracketRound {
  name: LocalizedText; // "Round of 16", "Final", ...
  roundIndex: number;
  matches: BracketMatch[];
}

export interface CompetitionState {
  id: string;
  name: LocalizedText;
  format: CompetitionFormat;
  /** club career vs national-team World Cup */
  kind: "club" | "national";
  country: string;
  clubIds: string[];
  fixtures: Fixture[];
  season: number;
  currentRound: number;
  totalRounds: number;
  championId?: string | null;
  table?: LeagueRow[]; // league only
  bracket?: BracketRound[]; // tournament only
}

// ---------------------------------------------------------------------------
// Manager, news, game state (the save)
// ---------------------------------------------------------------------------

export interface Manager {
  name: string;
  sportId: SportId;
  clubId: string;
  reputation: number;
}

export interface NewsItem {
  id: string;
  day: number;
  title: LocalizedText;
  body?: LocalizedText;
  read: boolean;
}

export interface PressOption {
  text: LocalizedText;
  /** applied to the user squad's morale on choosing this answer */
  moraleDelta: number;
  /** applied to manager reputation */
  repDelta: number;
  reply: LocalizedText;
}

export interface PressItem {
  id: string;
  day: number;
  question: LocalizedText;
  options: PressOption[];
  answered?: boolean;
  chosen?: number;
}

export interface GameState {
  version: number;
  id: string; // save id
  createdAt: number;
  updatedAt: number;
  sportId: SportId;
  locale: Locale;
  day: number; // global day index since season start
  season: number;
  manager: Manager;
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  competition: CompetitionState;
  news: NewsItem[];
  rngState: number; // serialized RNG state for continued determinism
  trainingFocus: string; // user team's weekly training focus key
  lastResultFixtureId?: string; // most recent user match, for highlighting
  seasonOver: boolean;
  /** pending press-conference prompts for the user */
  press?: PressItem[];
  /** optional side competition: national-team World Cup, built from the same player pool */
  worldCup?: {
    competition: CompetitionState;
    clubs: Record<string, Club>;
    /** nation (club id `nat-<code>`) the user is following, if any */
    userNationId?: string;
    rngState: number;
  };
}

// ---------------------------------------------------------------------------
// SportModule interface (the per-sport plugin contract)
// ---------------------------------------------------------------------------

export interface AttributeMeta {
  key: string;
  label: LocalizedText;
  abbr: LocalizedText;
}

export interface AttributeGroup {
  key: string;
  label: LocalizedText;
  attributes: AttributeMeta[];
  /** only relevant for these position groups (e.g. GK attrs) */
  onlyForGroup?: string;
}

export interface PositionMeta {
  key: string;
  label: LocalizedText;
  group: "GK" | "DEF" | "MID" | "FWD" | string;
}

export interface FormationSlot {
  position: PositionKey;
  x: number; // 0-100 across pitch width
  y: number; // 0-100 down pitch length (own goal = 0)
}

export interface FormationDef {
  key: string; // "4-3-3"
  slots: FormationSlot[];
}

export interface TrainingFocus {
  key: string;
  label: LocalizedText;
  attributes: string[]; // attribute keys this focus develops
}

export interface PlayStyleDef {
  key: string;
  label: LocalizedText;
  desc: LocalizedText;
  positions: string[]; // position keys this style suits
  boosts: Record<string, number>; // attribute boosts applied on generation
}

export interface ValidationResult {
  valid: boolean;
  errors: LocalizedText[];
}

export interface MatchTeam {
  club: Club;
  lineup: Player[]; // resolved starting players
}

export interface SimOptions {
  allowDraw?: boolean; // false -> resolve via ET / penalties
  neutralVenue?: boolean; // true -> no home advantage (knockouts)
}

/** How a sport renders its live match (visuals, stats, scoring, clock). */
export interface MatchEventMeta {
  emoji: string;
  label: LocalizedText;
  tone?: "score" | "warn" | "danger" | "info";
}

export interface MatchStatRow {
  label: LocalizedText;
  h: number;
  a: number;
  suffix?: string;
}

export interface MatchPresentation {
  /** playing-surface backdrop for the live viewer */
  venue: "pitch" | "hardwood" | "diamond" | "volleyballCourt" | "pickleballCourt";
  /** sport-specific term for the match's opening moment (kickoff / tip-off / first pitch / first serve) */
  openLabel: LocalizedText;
  /** real regulation length in minutes, used to pace playback consistently by sport */
  regulationMinutes: number;
  /** timeline length the playback clock runs to */
  endProgress: number;
  /** points along the timeline where a break card shows (e.g. half time) */
  breaks: { at: number; label: LocalizedText }[];
  /** running clock/label to show for a given progress value */
  clockLabel: (progress: number, endProgress: number, finished: boolean) => string;
  /** visual + label for an event type */
  eventMeta: (type: MatchEventType) => MatchEventMeta;
  /** running score for a club from the revealed events */
  scoreOf: (events: MatchEvent[], clubId: string) => number;
  /** live stat rows derived from the revealed events */
  liveStats: (events: MatchEvent[], homeId: string, awayId: string) => MatchStatRow[];
}

export interface SquadSlot {
  pos: PositionKey;
  count: number;
}

export interface GenPlayerOpts {
  id: string;
  name: string;
  nameKo?: string;
  nationality: string;
  age?: number;
  position?: PositionKey;
  /** target overall ~ this value, attributes scatter around it */
  targetOverall: number;
  /** optional explicit ability ceiling, else derived from age + target */
  potential?: number;
  clubId: string | null;
}

export interface SportModule {
  id: SportId;
  name: LocalizedText;
  available: boolean; // false => "coming soon"
  positions: PositionMeta[];
  attributeGroups: AttributeGroup[];
  formations: FormationDef[];
  trainingFocuses: TrainingFocus[];
  playstyles: PlayStyleDef[];
  /** roster shape used when generating a club squad (~30 players for soccer) */
  squadTemplate: SquadSlot[];
  /** how the live match is rendered for this sport */
  matchPresentation: MatchPresentation;
  /** flat list of every attribute key the sport uses */
  attributeKeys(): string[];
  /** play styles available to a given position */
  playstylesFor(position: PositionKey): PlayStyleDef[];
  /** yearly growth/decline applied at season rollover; returns a NEW player */
  ageAndDevelop(player: Player, rng: RNG): Player;
  /** overall ability, optionally rated for a specific position */
  calcOverall(player: Player, position?: PositionKey): number;
  defaultTactics(): Tactics;
  /** picks the best available XI for a club into tactics.lineup */
  autoPickLineup(club: Club, players: Record<string, Player>): { lineup: string[]; bench: string[] };
  validateLineup(club: Club, players: Record<string, Player>): ValidationResult;
  simulateMatch(home: MatchTeam, away: MatchTeam, rng: RNG, opts?: SimOptions): MatchResult;
  /** returns a NEW player object with developed attributes */
  trainPlayer(player: Player, focusKey: string, rng: RNG): Player;
  generatePlayer(opts: GenPlayerOpts, rng: RNG): Player;
}
