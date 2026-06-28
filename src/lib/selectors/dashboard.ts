// Pure selectors/calculations backing the dashboard ("manager's office") UI.
// Kept free of React/i18n so they can be unit tested in isolation; pages
// translate the returned LocalizedText with their own `tl()`.

import type { Club, GameState, LocalizedText, Player, SportModule } from "@/lib/types";
import { sortTable, upcomingFixtures } from "@/lib/engine/competition";

export type Severity = "danger" | "warning" | "info";

const LOW_CONDITION_THRESHOLD = 60;

export function myClubOf(state: GameState): Club {
  return state.clubs[state.manager.clubId];
}

export function squadOf(state: GameState, club: Club): Player[] {
  return club.squad.map((id) => state.players[id]).filter((p): p is Player => !!p);
}

export function weeklyWageBill(club: Club, players: Record<string, Player>): number {
  return club.squad.reduce((sum, id) => sum + (players[id]?.wage ?? 0), 0);
}

export function weeklyIncomeFor(club: Club, wageBill: number): number {
  return Math.round(club.reputation * 1800 + wageBill * 0.15);
}

export function avgCondition(squad: Player[]): number {
  return squad.length ? squad.reduce((sum, p) => sum + p.condition, 0) / squad.length : 0;
}

export function avgMorale(squad: Player[]): number {
  return squad.length ? squad.reduce((sum, p) => sum + p.morale, 0) / squad.length : 0;
}

/** Last 5 played fixtures for `club`, oldest first. */
export function last5Form(state: GameState, club: Club): ("W" | "D" | "L")[] {
  const fixtures = state.competition.fixtures
    .filter((f) => f.played && f.result && (f.homeId === club.id || f.awayId === club.id))
    .sort((a, b) => a.day - b.day);
  return fixtures.slice(-5).map((f) => {
    const mine = f.homeId === club.id ? f.result!.homeScore : f.result!.awayScore;
    const theirs = f.homeId === club.id ? f.result!.awayScore : f.result!.homeScore;
    if (mine > theirs) return "W";
    if (mine < theirs) return "L";
    return "D";
  });
}

/** 1-based league rank, or null outside league mode. */
export function leaguePosition(state: GameState, club: Club): number | null {
  const comp = state.competition;
  if (comp.format !== "league" || !comp.table) return null;
  return sortTable(comp.table).findIndex((r) => r.clubId === club.id) + 1;
}

// ---------------------------------------------------------------------------
// Issues: the single source of truth behind both the urgent-alerts banner
// and the "today's tasks" list, so the two never drift out of sync.
// ---------------------------------------------------------------------------

interface Issue {
  id: string;
  severity: Severity;
  title: LocalizedText;
  reason: LocalizedText;
  href: string;
}

const SEVERITY_ORDER: Record<Severity, number> = { danger: 0, warning: 1, info: 2 };

function collectIssues(state: GameState, sport: SportModule): Issue[] {
  const club = myClubOf(state);
  const players = state.players;
  const squad = squadOf(state, club);
  const issues: Issue[] = [];

  const validation = sport.validateLineup(club, players);
  if (!validation.valid) {
    issues.push({
      id: "fix_lineup",
      severity: "danger",
      title: { ko: "라인업 수정", en: "Fix your lineup" },
      reason: validation.errors[0] ?? { ko: "현재 라인업이 유효하지 않습니다", en: "Your current lineup is invalid" },
      href: "/game/tactics",
    });
  }

  const unanswered = (state.press ?? []).filter((p) => !p.answered);
  if (unanswered.length > 0) {
    issues.push({
      id: "answer_press",
      severity: "warning",
      title: { ko: "기자회견 답변", en: "Answer the press" },
      reason: { ko: `대기 중인 기자회견 ${unanswered.length}건이 있습니다`, en: `${unanswered.length} pending press conference(s)` },
      href: "/game/press",
    });
  }

  const injured = squad.filter((p) => p.injuredUntilDay != null && p.injuredUntilDay > state.day);
  if (injured.length > 0) {
    issues.push({
      id: "check_injuries",
      severity: "warning",
      title: { ko: "부상자 확인", en: "Check injured players" },
      reason: { ko: `${injured.length}명이 부상으로 결장 중입니다`, en: `${injured.length} player(s) sidelined by injury` },
      href: "/game/training",
    });
  }

  const lowConditionStarters = club.tactics.lineup
    .map((id) => players[id])
    .filter((p): p is Player => !!p && p.condition < LOW_CONDITION_THRESHOLD);
  if (lowConditionStarters.length > 0) {
    issues.push({
      id: "rest_players",
      severity: "warning",
      title: { ko: "체력 관리", en: "Manage fitness" },
      reason: { ko: `선발 ${lowConditionStarters.length}명의 체력이 매우 낮습니다`, en: `${lowConditionStarters.length} starter(s) have very low condition` },
      href: "/game/tactics",
    });
  }

  if (!club.isNational) {
    const wageBill = weeklyWageBill(club, players);
    if (club.finances.balance < 0) {
      issues.push({
        id: "balance_negative",
        severity: "danger",
        title: { ko: "재정 점검", en: "Review finances" },
        reason: { ko: "구단 잔고가 마이너스입니다", en: "Club balance is negative" },
        href: "/game/finances",
      });
    } else if (wageBill > club.finances.wageBudget) {
      issues.push({
        id: "wage_over_budget",
        severity: "warning",
        title: { ko: "재정 점검", en: "Review finances" },
        reason: { ko: "주급 지출이 예산을 초과했습니다", en: "Weekly wages exceed your wage budget" },
        href: "/game/finances",
      });
    }
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export interface DashboardAlert {
  id: string;
  severity: Severity;
  message: LocalizedText;
  href: string;
}

export function urgentAlerts(state: GameState, sport: SportModule): DashboardAlert[] {
  return collectIssues(state, sport).map((i) => ({ id: i.id, severity: i.severity, message: i.reason, href: i.href }));
}

export interface TodayTask {
  id: string;
  label: LocalizedText;
  reason: LocalizedText;
  href: string;
  severity: Severity;
}

/** Max 3 actionable items, most severe first. */
export function todaysTasks(state: GameState, sport: SportModule): TodayTask[] {
  return collectIssues(state, sport)
    .slice(0, 3)
    .map((i) => ({ id: i.id, label: i.title, reason: i.reason, href: i.href, severity: i.severity }));
}

// ---------------------------------------------------------------------------
// Next-match primary action
// ---------------------------------------------------------------------------

export type PrimaryActionKind = "fixLineup" | "startMatch" | "newSeason" | "none";

export interface PrimaryAction {
  kind: PrimaryActionKind;
  label: LocalizedText;
  href: string;
}

export function primaryAction(state: GameState, sport: SportModule): PrimaryAction {
  if (state.seasonOver) {
    return { kind: "newSeason", label: { ko: "새 시즌 시작", en: "Start New Season" }, href: "/game/dashboard" };
  }
  const club = myClubOf(state);
  const validation = sport.validateLineup(club, state.players);
  if (!validation.valid) {
    return { kind: "fixLineup", label: { ko: "라인업 수정하기", en: "Fix your lineup" }, href: "/game/tactics" };
  }
  const upcoming = upcomingFixtures(state.competition).find((f) => f.homeId === club.id || f.awayId === club.id);
  if (upcoming) {
    return { kind: "startMatch", label: { ko: "경기 시작", en: "Start Match" }, href: "/game/dashboard" };
  }
  return { kind: "none", label: { ko: "남은 경기가 없습니다", en: "No fixtures remaining" }, href: "/game/dashboard" };
}

// ---------------------------------------------------------------------------
// Team status summary
// ---------------------------------------------------------------------------

export interface StatusMetric {
  key: "morale" | "condition" | "form" | "rank" | "reputation";
  value: number | null;
  phrase: LocalizedText;
  color: string;
}

const MORALE_GOOD = 70;
const MORALE_OK = 45;
const CONDITION_GOOD = 80;
const CONDITION_OK = 60;
const REP_GOOD = 70;
const REP_OK = 40;

export function teamStatusSummary(state: GameState): StatusMetric[] {
  const club = myClubOf(state);
  const squad = squadOf(state, club);
  const morale = avgMorale(squad);
  const condition = avgCondition(squad);
  const form = last5Form(state, club);
  const wins = form.filter((r) => r === "W").length;
  const rank = leaguePosition(state, club);
  const totalClubs = state.competition.clubIds.length;

  const metrics: StatusMetric[] = [
    {
      key: "morale",
      value: Math.round(morale),
      phrase:
        morale >= MORALE_GOOD
          ? { ko: "사기가 높습니다", en: "Morale is high" }
          : morale >= MORALE_OK
            ? { ko: "사기가 보통입니다", en: "Morale is steady" }
            : { ko: "사기가 낮습니다", en: "Morale is low" },
      color: morale >= MORALE_GOOD ? "var(--mint)" : morale >= MORALE_OK ? "var(--gold)" : "var(--red)",
    },
    {
      key: "condition",
      value: Math.round(condition),
      phrase:
        condition >= CONDITION_GOOD
          ? { ko: "체력이 양호합니다", en: "Squad fitness is good" }
          : condition >= CONDITION_OK
            ? { ko: "체력 관리가 필요합니다", en: "Fitness needs attention" }
            : { ko: "체력이 위험한 수준입니다", en: "Fitness is critically low" },
      color: condition >= CONDITION_GOOD ? "var(--mint)" : condition >= CONDITION_OK ? "var(--gold)" : "var(--red)",
    },
    {
      key: "form",
      value: form.length ? wins : null,
      phrase:
        form.length === 0
          ? { ko: "최근 경기 기록이 없습니다", en: "No recent matches" }
          : wins >= 4
            ? { ko: "최근 5경기 좋은 흐름입니다", en: "In great recent form" }
            : wins >= 2
              ? { ko: "최근 성적이 평범합니다", en: "Mixed recent results" }
              : { ko: "최근 성적이 부진합니다", en: "Struggling for results" },
      color: form.length === 0 ? "var(--muted-2)" : wins >= 4 ? "var(--mint)" : wins >= 2 ? "var(--gold)" : "var(--red)",
    },
    {
      key: "rank",
      value: rank,
      phrase:
        rank == null
          ? { ko: "리그 순위 정보가 없습니다", en: "No league ranking" }
          : rank <= Math.ceil(totalClubs * 0.3)
            ? { ko: "상위권에 위치해 있습니다", en: "Sitting in the upper table" }
            : rank > Math.floor(totalClubs * 0.7)
              ? { ko: "하위권이 우려됩니다", en: "Down in the relegation zone" }
              : { ko: "중위권에 위치해 있습니다", en: "Holding a mid-table spot" },
      color:
        rank == null
          ? "var(--muted-2)"
          : rank <= Math.ceil(totalClubs * 0.3)
            ? "var(--mint)"
            : rank > Math.floor(totalClubs * 0.7)
              ? "var(--red)"
              : "var(--blue)",
    },
    {
      key: "reputation",
      value: Math.round(state.manager.reputation),
      phrase:
        state.manager.reputation >= REP_GOOD
          ? { ko: "감독 평판이 높습니다", en: "Your reputation is strong" }
          : state.manager.reputation >= REP_OK
            ? { ko: "감독 평판이 안정적입니다", en: "Your reputation is stable" }
            : { ko: "감독 평판 관리가 필요합니다", en: "Your reputation needs work" },
      color:
        state.manager.reputation >= REP_GOOD
          ? "var(--mint)"
          : state.manager.reputation >= REP_OK
            ? "var(--gold)"
            : "var(--red)",
    },
  ];
  return metrics;
}

// ---------------------------------------------------------------------------
// Inbox (news + press), unread-first
// ---------------------------------------------------------------------------

export interface InboxEntry {
  id: string;
  day: number;
  kind: "press" | "news";
  title: LocalizedText;
  body?: LocalizedText;
  unread: boolean;
  href?: string;
}

export function recentInbox(state: GameState, limit = 5): InboxEntry[] {
  const press: InboxEntry[] = (state.press ?? [])
    .filter((p) => !p.answered)
    .map((p) => ({
      id: p.id,
      day: p.day,
      kind: "press" as const,
      title: { ko: "기자회견", en: "Press Conference" },
      body: p.question,
      unread: true,
      href: "/game/press",
    }));
  const news: InboxEntry[] = state.news.map((n) => ({
    id: n.id,
    day: n.day,
    kind: "news" as const,
    title: n.title,
    body: n.body,
    unread: !n.read,
    href: undefined,
  }));
  return [...press, ...news]
    .sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return b.day - a.day;
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Finance summary with a risk badge
// ---------------------------------------------------------------------------

export type RiskTone = "success" | "warning" | "danger";

export interface FinanceSummary {
  balance: number;
  wageBudget: number;
  weeklyWageBill: number;
  weeklyIncome: number;
  netWeekly: number;
  riskTone: RiskTone;
  explanation: LocalizedText;
}

export function financeSummary(state: GameState): FinanceSummary {
  const club = myClubOf(state);
  const wageBill = weeklyWageBill(club, state.players);
  const income = weeklyIncomeFor(club, wageBill);
  const net = income - wageBill;

  let riskTone: RiskTone = "success";
  let explanation: LocalizedText = { ko: "재정 상태가 안정적입니다", en: "Finances are healthy" };
  if (club.finances.balance < 0) {
    riskTone = "danger";
    explanation = { ko: "구단 잔고가 마이너스입니다", en: "Club balance is negative" };
  } else if (wageBill > club.finances.wageBudget) {
    riskTone = "warning";
    explanation = { ko: "주급 지출이 예산을 초과했습니다", en: "Weekly wages exceed the wage budget" };
  } else if (net < 0) {
    riskTone = "warning";
    explanation = { ko: "주간 순수익이 적자입니다", en: "Weekly net income is negative" };
  }

  return {
    balance: club.finances.balance,
    wageBudget: club.finances.wageBudget,
    weeklyWageBill: wageBill,
    weeklyIncome: income,
    netWeekly: net,
    riskTone,
    explanation,
  };
}
