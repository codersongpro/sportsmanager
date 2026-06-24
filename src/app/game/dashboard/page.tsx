"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tile } from "@/components/Tile";
import { Button, ProgressBar, StatBlock, StatusBadge } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { upcomingFixtures, sortTable } from "@/lib/engine/competition";
import { clubDisplayName, formatMoney } from "@/lib/utils/format";

export default function DashboardPage() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const continueGame = useGameStore((s) => s.continue);
  const rollover = useGameStore((s) => s.rolloverSeason);

  if (!state) return null;

  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;
  const upcoming = upcomingFixtures(comp).find(
    (f) => f.homeId === myClub.id || f.awayId === myClub.id,
  );
  const opponentId = upcoming ? (upcoming.homeId === myClub.id ? upcoming.awayId : upcoming.homeId) : null;
  const opponent = opponentId ? state.clubs[opponentId] : null;
  const squad = myClub.squad.map((id) => state.players[id]).filter(Boolean);
  const avgCondition = squad.length ? Math.round(squad.reduce((sum, p) => sum + p.condition, 0) / squad.length) : 0;
  const lowCondition = squad.filter((p) => p.condition < 70).length;
  const unansweredPress = state.press?.filter((p) => !p.answered).length ?? 0;
  const recent = comp.fixtures
    .filter((f) => f.played && f.result && (f.homeId === myClub.id || f.awayId === myClub.id))
    .slice(-5)
    .map((f) => {
      const mine = f.homeId === myClub.id ? f.result!.homeScore : f.result!.awayScore;
      const theirs = f.homeId === myClub.id ? f.result!.awayScore : f.result!.homeScore;
      return mine > theirs ? "W" : mine < theirs ? "L" : "D";
    });

  let position: number | null = null;
  if (comp.format === "league" && comp.table) {
    position = sortTable(comp.table).findIndex((r) => r.clubId === myClub.id) + 1;
  }

  function handleContinue() {
    continueGame();
    const updated = useGameStore.getState().state;
    if (updated?.lastResultFixtureId) {
      router.push(`/game/match/${updated.lastResultFixtureId}`);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{clubDisplayName(myClub)}</h1>
          <p className="text-sm text-soft">
            {t("season")} {state.season} · {t("day")} {state.day}
          </p>
        </div>
        {!state.seasonOver ? (
          <Button onClick={handleContinue} className="px-5">{t("continueBtn")}</Button>
        ) : (
          <Button onClick={() => rollover()} className="px-5">{t("startNewSeason")}</Button>
        )}
      </div>

      {state.seasonOver && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-semibold">{t("seasonComplete")}</p>
          {comp.championId && (
            <p className="text-sm">
              {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
            </p>
          )}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Tile
          title={t("nextMatch")}
          subtitle={upcoming ? `${t("day")} ${upcoming.day}` : undefined}
          action={!state.seasonOver ? <StatusBadge tone="info">{t("continueBtn")}</StatusBadge> : <StatusBadge tone="success">{t("seasonComplete")}</StatusBadge>}
          className="min-h-52"
        >
          {upcoming && opponent ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-soft">{upcoming.homeId === myClub.id ? t("home") : t("away")} {t("vs")}</p>
                  <p className="truncate text-3xl font-black tracking-tight">{clubDisplayName(opponent)}</p>
                </div>
                <Button onClick={handleContinue}>{t("advanceToMatch")}</Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <StatBlock label={t("condition")} value={`${avgCondition}%`} detail={`${lowCondition} < 70`} />
                <StatBlock
                  label={comp.format === "league" ? t("leaguePosition") : t("nextRound")}
                  value={comp.format === "league" ? (position ?? "-") : (comp.bracket?.[comp.currentRound] ? tl(comp.bracket[comp.currentRound].name) : "-")}
                />
                <StatBlock label={t("recentForm")} value={recent.length ? recent.join(" ") : "-"} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-soft">{t("noNews")}</p>
          )}
        </Tile>

        <Tile title={t("news")} subtitle={t("pendingPress")}>
          <div className="flex flex-col gap-2">
            {unansweredPress > 0 ? (
              <Link href="/game/press" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                {t("pendingPress")}: {unansweredPress}
              </Link>
            ) : null}
            {lowCondition > 0 ? (
              <Link href="/game/squad" className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100">
                {t("condition")}: {lowCondition}
              </Link>
            ) : null}
            {unansweredPress === 0 && lowCondition === 0 ? <p className="text-sm text-soft">{t("noNews")}</p> : null}
          </div>
        </Tile>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Tile title={t("competition")} action={<Link href="/game/competition" className="text-sm font-semibold text-blue-600 dark:text-blue-300">{t("competition")}</Link>}>
          <div className="text-2xl font-bold">
            {comp.format === "league" ? (position ?? "-") : (comp.bracket?.[comp.currentRound] ? tl(comp.bracket[comp.currentRound].name) : "-")}
          </div>
          <p className="mt-1 text-sm text-soft">{comp.format === "league" ? t("leaguePosition") : t("nextRound")}</p>
        </Tile>

        <Tile title={t("finances")}>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-soft">{t("balance")}</span>
              <span className="font-semibold">{formatMoney(myClub.finances.balance)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-soft">{t("transferBudget")}</span>
              <span className="font-semibold">{formatMoney(myClub.finances.transferBudget)}</span>
            </div>
            <ProgressBar value={Math.min(100, (myClub.finances.transferBudget / Math.max(1, myClub.finances.balance)) * 100)} tone="success" />
          </div>
        </Tile>

        <Tile title={t("news")}>
          {state.news.length === 0 ? (
            <p className="text-sm text-soft">{t("noNews")}</p>
          ) : (
            <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto text-sm">
              {state.news.slice(0, 6).map((n) => (
                <li key={n.id} className={n.read ? "text-soft" : "font-medium"}>
                  {tl(n.title)}
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>
    </div>
  );
}
