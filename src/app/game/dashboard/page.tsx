"use client";

import { useRouter } from "next/navigation";
import { Avatar, FormChip, RatingNumber, Tile, groupColor, ratingColorHex } from "@/components/Tile";
import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { upcomingFixtures, sortTable } from "@/lib/engine/competition";
import { clubDisplayName, playerDisplayName, playerInitials } from "@/lib/utils/format";

export default function DashboardPage() {
  const { t, tl, locale } = useI18n();
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const continueGame = useGameStore((s) => s.continue);
  const rollover = useGameStore((s) => s.rolloverSeason);

  if (!state) return null;

  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;
  const sport = getSport(state.sportId);
  const groupOf = (positionKey: string | undefined) => sport.positions.find((p) => p.key === positionKey)?.group ?? "MID";

  const upcoming = upcomingFixtures(comp).find(
    (f) => f.homeId === myClub.id || f.awayId === myClub.id,
  );
  const opponentId = upcoming ? (upcoming.homeId === myClub.id ? upcoming.awayId : upcoming.homeId) : null;
  const opponent = opponentId ? state.clubs[opponentId] : null;
  const isHome = upcoming?.homeId === myClub.id;

  const myFixtures = comp.fixtures
    .filter((f) => f.played && f.result && (f.homeId === myClub.id || f.awayId === myClub.id))
    .sort((a, b) => a.day - b.day);
  const recent = myFixtures.slice(-5).map((f) => {
    const mine = f.homeId === myClub.id ? f.result!.homeScore : f.result!.awayScore;
    const theirs = f.homeId === myClub.id ? f.result!.awayScore : f.result!.homeScore;
    return mine > theirs ? ("W" as const) : mine < theirs ? ("L" as const) : ("D" as const);
  });
  let unbeatenStreak = 0;
  for (let i = myFixtures.length - 1; i >= 0; i--) {
    const f = myFixtures[i];
    const mine = f.homeId === myClub.id ? f.result!.homeScore : f.result!.awayScore;
    const theirs = f.homeId === myClub.id ? f.result!.awayScore : f.result!.homeScore;
    if (mine < theirs) break;
    unbeatenStreak++;
  }

  let position: number | null = null;
  const myRow = comp.format === "league" && comp.table ? comp.table.find((r) => r.clubId === myClub.id) : null;
  if (comp.format === "league" && comp.table) {
    position = sortTable(comp.table).findIndex((r) => r.clubId === myClub.id) + 1;
  }
  const goalsFor = myRow ? myRow.goalsFor : myFixtures.reduce((sum, f) => sum + (f.homeId === myClub.id ? f.result!.homeScore : f.result!.awayScore), 0);

  const seasonStats =
    comp.format === "league" && myRow && position
      ? [
          { label: t("leaguePosition"), value: locale === "ko" ? `${position}위` : `#${position}`, color: "var(--mint)" },
          { label: t("points"), value: myRow.points, color: "var(--text)" },
          { label: t("goalsFor"), value: goalsFor, color: "var(--text)" },
          { label: t("unbeaten"), value: unbeatenStreak, color: "var(--gold)" },
        ]
      : [
          { label: t("nextRound"), value: comp.bracket?.[comp.currentRound] ? tl(comp.bracket[comp.currentRound].name) : "-", color: "var(--mint)" },
          { label: t("won"), value: myFixtures.filter((f) => (f.homeId === myClub.id ? f.result!.homeScore > f.result!.awayScore : f.result!.awayScore > f.result!.homeScore)).length, color: "var(--text)" },
          { label: t("lost"), value: myFixtures.filter((f) => (f.homeId === myClub.id ? f.result!.homeScore < f.result!.awayScore : f.result!.awayScore < f.result!.homeScore)).length, color: "var(--text)" },
          { label: t("goalsFor"), value: goalsFor, color: "var(--gold)" },
        ];

  const inboxItems = [
    ...(state.press ?? []).filter((p) => !p.answered).map((p) => ({
      id: p.id,
      day: p.day,
      title: t("pressConference"),
      body: tl(p.question),
      unread: true,
      iconColor: "var(--blue)",
      href: "/game/press",
    })),
    ...state.news.map((n) => ({
      id: n.id,
      day: n.day,
      title: tl(n.title),
      body: n.body ? tl(n.body) : "",
      unread: !n.read,
      iconColor: "var(--purple)",
      href: undefined,
    })),
  ]
    .sort((a, b) => b.day - a.day)
    .slice(0, 4);
  const unreadCount = inboxItems.filter((i) => i.unread).length;

  const squad = myClub.squad.map((id) => state.players[id]).filter(Boolean);
  const topPerformers = [...squad]
    .map((p) => {
      const avgRating = p.recentForm?.length ? p.recentForm.reduce((sum, f) => sum + f.rating, 0) / p.recentForm.length : 0;
      return { player: p, score: avgRating || sport.calcOverall(p) / 10, avgRating };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  function handleContinue() {
    continueGame();
    const updated = useGameStore.getState().state;
    if (updated?.lastResultFixtureId) {
      router.push(`/game/match/${updated.lastResultFixtureId}`);
    }
  }

  if (state.seasonOver) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <p className="font-display text-xl font-bold">{t("seasonComplete")}</p>
          {comp.championId && (
            <p className="mt-1 text-sm text-soft">
              {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
            </p>
          )}
          <Button className="mt-4" onClick={() => rollover()}>{t("startNewSeason")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-[18px] lg:grid-cols-[1.7fr_1fr]">
      {/* next match hero */}
      <div
        className="relative col-span-full overflow-hidden rounded-2xl border"
        style={{ borderColor: "rgba(255,255,255,.07)", background: "linear-gradient(115deg,#10243a 0%,#0d1727 45%,#131822 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(600px 200px at 18% 120%, rgba(24,226,154,.18), transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-6 p-[22px] sm:px-[26px]">
          {upcoming && opponent ? (
            <>
              <div className="flex flex-col gap-1">
                <div className="inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[1.5px]" style={{ color: "var(--mint)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--mint)" }} />
                  {t("nextMatch")} · {tl(comp.name)}
                </div>
                <div className="mt-1 text-[12.5px]" style={{ color: "var(--muted-2)" }}>
                  {t("day")} {upcoming.day}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-[30px]">
                <div className="text-center">
                  <Avatar
                    initials={myClub.shortName?.slice(0, 2).toUpperCase() ?? "??"}
                    color={myClub.primaryColor ?? "var(--blue)"}
                    size={60}
                    rounded="14px"
                  />
                  <div className="mt-2 text-sm font-bold">{clubDisplayName(myClub)}</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                    {isHome ? t("home") : t("away")}
                  </div>
                </div>
                <div className="font-display text-[22px] font-semibold" style={{ color: "var(--muted-3)" }}>
                  {t("vs")}
                </div>
                <div className="text-center">
                  <Avatar
                    initials={opponent.shortName?.slice(0, 2).toUpperCase() ?? "??"}
                    color={opponent.primaryColor ?? "var(--red)"}
                    size={60}
                    rounded="14px"
                  />
                  <div className="mt-2 text-sm font-bold">{clubDisplayName(opponent)}</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                    {isHome ? t("away") : t("home")}
                  </div>
                </div>
              </div>
              <div className="ml-0 flex flex-col gap-2 sm:ml-[30px]">
                <Button onClick={handleContinue} className="px-[22px] py-[11px] text-[13.5px]">
                  {t("startMatch")}
                </Button>
                <Button variant="secondary" onClick={() => router.push("/game/tactics")} className="px-[22px] py-[11px] text-[13.5px]">
                  {t("checkTactics")}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted-2)" }}>{t("noFixturesLeft")}</p>
          )}
        </div>
      </div>

      {/* season status */}
      <Tile title={t("seasonStatus")} action={
        <button onClick={() => router.push("/game/competition")} className="text-[11.5px] font-semibold" style={{ color: "var(--mint)" }}>
          {t("viewStandings")} →
        </button>
      }>
        <div className="grid grid-cols-4 gap-[10px]">
          {seasonStats.map((st, i) => (
            <div key={i} className="rounded-[11px] border px-[10px] py-3 text-center" style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}>
              <div className="font-display text-[26px] font-bold leading-none" style={{ color: st.color }}>{st.value}</div>
              <div className="mt-[6px] text-[10.5px]" style={{ color: "var(--muted-2)" }}>{st.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-[9px] text-[11px]" style={{ color: "var(--muted-2)" }}>{t("recentForm")}</div>
          <div className="flex gap-[7px]">
            {recent.length ? recent.map((r, i) => <FormChip key={i} result={r} />) : <span className="text-xs text-soft">-</span>}
          </div>
        </div>
      </Tile>

      {/* inbox */}
      <Tile title={t("inbox")} action={
        unreadCount > 0 ? (
          <span className="rounded-[9px] px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--red)", color: "#fff" }}>
            {unreadCount} {t("newCount")}
          </span>
        ) : null
      }>
        <div className="flex flex-col gap-0.5">
          {inboxItems.length ? inboxItems.map((m) => (
            <div
              key={m.id}
              onClick={() => m.href && router.push(m.href)}
              className={`flex items-start gap-[11px] rounded-[9px] px-2 py-[11px] ${m.href ? "cursor-pointer hover:bg-white/[0.04]" : ""}`}
            >
              <div
                className="h-[30px] w-[30px] shrink-0 rounded-lg"
                style={{ background: `color-mix(in srgb, ${m.iconColor} 15%, transparent)` }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[7px]">
                  <span className="text-[13px] font-semibold">{m.title}</span>
                  {m.unread ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--mint)" }} /> : null}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--muted-2)" }}>{m.body}</div>
              </div>
              <div className="whitespace-nowrap text-[10.5px]" style={{ color: "var(--muted-3)" }}>
                {t("day")} {m.day}
              </div>
            </div>
          )) : <p className="text-sm text-soft">{t("noNews")}</p>}
        </div>
      </Tile>

      {/* top performers */}
      <Tile title={t("topPerformers")} className="col-span-full" action={
        <button onClick={() => router.push("/game/squad")} className="text-[11.5px] font-semibold" style={{ color: "var(--mint)" }}>
          {t("viewFullSquad")} →
        </button>
      }>
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
          {topPerformers.map(({ player, avgRating }) => {
            const group = groupOf(player.positions[0]);
            const color = groupColor(group);
            const rating = avgRating || sport.calcOverall(player) / 10;
            return (
              <div
                key={player.id}
                onClick={() => router.push(`/game/squad/${player.id}`)}
                className="flex cursor-pointer items-center gap-[13px] rounded-xl border p-[14px] hover:border-[color-mix(in_srgb,var(--mint)_35%,transparent)]"
                style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}
              >
                <Avatar initials={playerInitials(player)} color={color} size={46} rounded="11px" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{playerDisplayName(player)}</div>
                  <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                    {player.positions[0]} · {avgRating ? `${t("avgRating")} ${avgRating.toFixed(2)}` : t("overall")}
                  </div>
                </div>
                <div className="text-center">
                  <RatingNumber value={rating.toFixed(2)} color={ratingColorHex(rating)} size="text-xl" />
                  <div className="mt-0.5 text-[9px]" style={{ color: "var(--muted-3)" }}>{t("rating")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Tile>
    </div>
  );
}
