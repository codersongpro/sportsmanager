"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { LeagueTable } from "@/components/LeagueTable";
import { BracketView } from "@/components/BracketView";
import { clubDisplayName } from "@/lib/utils/format";

export default function CompetitionPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{tl(comp.name)}</h1>
        <p className="text-sm text-zinc-500">
          {t("season")} {comp.season}
        </p>
      </div>

      {comp.championId && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="font-semibold">
            {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
          </p>
        </div>
      )}

      {comp.format === "league" && comp.table && (
        <div>
          <h2 className="mb-2 font-semibold text-zinc-500">{t("standings")}</h2>
          <LeagueTable table={comp.table} clubs={state.clubs} highlightClubId={myClub.id} />
        </div>
      )}

      {comp.format === "tournament" && comp.bracket && (
        <div>
          <h2 className="mb-2 font-semibold text-zinc-500">{t("bracket")}</h2>
          <BracketView bracket={comp.bracket} clubs={state.clubs} userClubId={myClub.id} />
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-1 font-semibold text-zinc-500">{t("worldCup")}</h2>
        <p className="mb-2 text-sm text-zinc-500">{t("worldCupDesc")}</p>
        <Link href="/game/worldcup" className="inline-block text-sm text-blue-600 hover:underline">
          {t("worldCup")} →
        </Link>
      </div>
    </div>
  );
}
