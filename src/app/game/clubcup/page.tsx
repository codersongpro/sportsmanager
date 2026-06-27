"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { BracketView } from "@/components/BracketView";
import { LeagueTable } from "@/components/LeagueTable";
import { clubDisplayName } from "@/lib/utils/format";

export default function ClubCupPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const startClubCup = useGameStore((s) => s.startClubCup);
  const simulateRound = useGameStore((s) => s.simulateClubCupRound);

  if (!state) return null;
  const cc = state.clubCup;

  if (!cc) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-bold">{t("clubCup")}</h1>
        <p className="text-sm text-zinc-500">{t("clubCupDesc")}</p>
        <button
          onClick={() => startClubCup()}
          className="self-start rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {t("startClubCup")}
        </button>
      </div>
    );
  }

  const comp = cc.competition;
  const userClub = cc.userClubId ? state.clubs[cc.userClubId] : null;
  const done = !!comp.championId;
  const userEliminated =
    !done &&
    !!userClub &&
    comp.bracket?.some((round) =>
      round.matches.some(
        (m) =>
          (m.homeId === userClub.id || m.awayId === userClub.id) &&
          m.winnerId !== null &&
          m.winnerId !== userClub.id,
      ),
    );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tl(comp.name)}</h1>
        {!done && (
          <button onClick={() => simulateRound()} className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
            {t("simulateRound")}
          </button>
        )}
      </div>

      {done && comp.championId && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="font-semibold">
            {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
          </p>
        </div>
      )}
      {!done && userEliminated && userClub && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/40">
          <p className="font-semibold">
            {clubDisplayName(userClub)}: {t("eliminated")}
          </p>
        </div>
      )}

      {comp.groups && !comp.bracket && (
        <div className="grid gap-4 sm:grid-cols-2">
          {comp.groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold" style={{ color: "var(--muted-2)" }}>{tl(g.name)}</h2>
              <LeagueTable table={g.table} clubs={state.clubs} highlightClubId={cc.userClubId} />
            </div>
          ))}
        </div>
      )}

      {comp.bracket && <BracketView bracket={comp.bracket} clubs={state.clubs} userClubId={cc.userClubId} />}

      <Link href="/game/competition" className="text-sm text-blue-600 hover:underline">
        ← {t("competition")}
      </Link>
    </div>
  );
}
