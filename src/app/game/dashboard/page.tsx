"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{clubDisplayName(myClub)}</h1>
          <p className="text-sm text-zinc-500">
            {t("season")} {state.season} · {t("day")} {state.day}
          </p>
        </div>
        {!state.seasonOver ? (
          <button onClick={handleContinue} className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
            {t("continueBtn")}
          </button>
        ) : (
          <button onClick={() => rollover()} className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
            {t("startNewSeason")}
          </button>
        )}
      </div>

      {state.seasonOver && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="font-semibold">{t("seasonComplete")}</p>
          {comp.championId && (
            <p className="text-sm">
              {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
            </p>
          )}
        </div>
      )}

      {(state.press?.some((p) => !p.answered) ?? false) && (
        <Link href="/game/press" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          🎙 {t("pendingPress")}: {state.press!.filter((p) => !p.answered).length} →
        </Link>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 font-semibold text-zinc-500">{t("nextMatch")}</h2>
          {upcoming && opponent ? (
            <p>
              {upcoming.homeId === myClub.id ? t("home") : t("away")} {t("vs")} {clubDisplayName(opponent)} · {t("day")} {upcoming.day}
            </p>
          ) : (
            <p className="text-zinc-400">—</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 font-semibold text-zinc-500">{comp.format === "league" ? t("leaguePosition") : t("nextRound")}</h2>
          {comp.format === "league" ? (
            <p className="text-2xl font-bold">{position ?? "—"}</p>
          ) : (
            <p>{comp.bracket?.[comp.currentRound] ? tl(comp.bracket[comp.currentRound].name) : "—"}</p>
          )}
          <Link href="/game/competition" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            {t("competition")} →
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 font-semibold text-zinc-500">{t("finances")}</h2>
          <p className="text-sm">
            {t("balance")}: {formatMoney(myClub.finances.balance)}
          </p>
          <p className="text-sm">
            {t("transferBudget")}: {formatMoney(myClub.finances.transferBudget)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 font-semibold text-zinc-500">{t("news")}</h2>
          {state.news.length === 0 ? (
            <p className="text-zinc-400">{t("noNews")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {state.news.slice(0, 6).map((n) => (
                <li key={n.id} className={n.read ? "text-zinc-400" : ""}>
                  {tl(n.title)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
