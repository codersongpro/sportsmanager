import { describe, expect, it } from "vitest";
import { getSport } from "@/lib/sports";
import { getClubsForSport } from "@/data/clubs";
import { createNewGame } from "@/lib/engine/newGame";
import { continueGame } from "@/lib/engine/season";
import {
  avgCondition,
  avgMorale,
  financeSummary,
  last5Form,
  myClubOf,
  primaryAction,
  recentInbox,
  squadOf,
  teamStatusSummary,
  todaysTasks,
  urgentAlerts,
} from "./dashboard";

describe("dashboard selectors", () => {
  const sport = getSport("soccer");
  const korClub = getClubsForSport("soccer").find((c) => c.leagueId === "kor")!;

  function freshGame() {
    return createNewGame({
      sportId: "soccer",
      format: "league",
      leagueId: "kor",
      clubId: korClub.id,
      managerName: "Test Manager",
      locale: "ko",
    });
  }

  it("computes average condition and morale from the squad only", () => {
    const state = freshGame();
    const club = myClubOf(state);
    const squad = squadOf(state, club);
    expect(squad.length).toBe(club.squad.length);

    const expectedCondition = squad.reduce((s, p) => s + p.condition, 0) / squad.length;
    const expectedMorale = squad.reduce((s, p) => s + p.morale, 0) / squad.length;
    expect(avgCondition(squad)).toBeCloseTo(expectedCondition);
    expect(avgMorale(squad)).toBeCloseTo(expectedMorale);
    expect(avgCondition([])).toBe(0);
    expect(avgMorale([])).toBe(0);
  });

  it("derives last-5 form strictly from the user club's played fixtures", () => {
    let state = freshGame();
    const club = myClubOf(state);
    let guard = 0;
    // Play through enough days to accumulate a few results.
    while (state.competition.fixtures.filter((f) => f.played && (f.homeId === club.id || f.awayId === club.id)).length < 3 && guard++ < 60) {
      state = continueGame(state, sport);
    }
    const form = last5Form(state, club);
    expect(form.length).toBeLessThanOrEqual(5);
    expect(form.every((r) => r === "W" || r === "D" || r === "L")).toBe(true);

    const played = state.competition.fixtures
      .filter((f) => f.played && f.result && (f.homeId === club.id || f.awayId === club.id))
      .sort((a, b) => a.day - b.day);
    expect(form.length).toBe(Math.min(5, played.length));
  });

  it("returns a fixLineup primary action when the lineup is invalid", () => {
    const state = freshGame();
    const club = myClubOf(state);
    club.tactics.lineup = club.tactics.lineup.slice(0, 5); // break it: fewer than 11
    const action = primaryAction(state, sport);
    expect(action.kind).toBe("fixLineup");
  });

  it("returns a startMatch primary action when the lineup is valid and fixtures remain", () => {
    const state = freshGame();
    const action = primaryAction(state, sport);
    expect(action.kind).toBe("startMatch");
  });

  it("surfaces an urgent alert and a matching today's task when the lineup breaks", () => {
    const state = freshGame();
    const club = myClubOf(state);
    club.tactics.lineup = club.tactics.lineup.slice(0, 5);
    const alerts = urgentAlerts(state, sport);
    const tasks = todaysTasks(state, sport);
    expect(alerts.some((a) => a.id === "fix_lineup")).toBe(true);
    expect(tasks.some((t) => t.id === "fix_lineup")).toBe(true);
    expect(tasks.length).toBeLessThanOrEqual(3);
  });

  it("computes a team status summary with one phrase per metric", () => {
    const state = freshGame();
    const metrics = teamStatusSummary(state);
    expect(metrics.map((m) => m.key)).toEqual(["morale", "condition", "form", "rank", "reputation"]);
    for (const m of metrics) {
      expect(m.phrase.ko.length).toBeGreaterThan(0);
      expect(m.phrase.en.length).toBeGreaterThan(0);
    }
  });

  it("flags a danger finance risk when balance goes negative", () => {
    const state = freshGame();
    const club = myClubOf(state);
    club.finances.balance = -1000;
    const summary = financeSummary(state);
    expect(summary.riskTone).toBe("danger");
  });

  it("sorts the inbox unread-first and caps it at the given limit", () => {
    const state = freshGame();
    state.news = [
      { id: "n1", day: 1, title: { ko: "오래된 읽은 소식", en: "old read" }, read: true },
      { id: "n2", day: 5, title: { ko: "새 소식", en: "new unread" }, read: false },
      { id: "n3", day: 4, title: { ko: "또다른 읽은 소식", en: "another read" }, read: true },
    ];
    const inbox = recentInbox(state, 2);
    expect(inbox.length).toBe(2);
    expect(inbox[0].unread).toBe(true);
  });
});
