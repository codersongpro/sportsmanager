"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { BracketView } from "@/components/BracketView";
import { LeagueTable } from "@/components/LeagueTable";
import { clubDisplayName } from "@/lib/utils/format";
import { COUNTRIES } from "@/data/countries";
import { findUserPendingFixture } from "@/lib/engine/worldcup";

export default function WorldCupPage() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const startWorldCup = useGameStore((s) => s.startWorldCup);
  const simulateRound = useGameStore((s) => s.simulateWorldCupRound);
  const playMyMatch = useGameStore((s) => s.playWorldCupMatch);
  const [nationCode, setNationCode] = useState(COUNTRIES[0]?.code ?? "");

  if (!state) return null;
  const wc = state.worldCup;

  if (!wc) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-bold">{t("worldCup")}</h1>
        <p className="text-sm text-zinc-500">{t("worldCupDesc")}</p>
        <label className="flex flex-col gap-1 text-sm">
          {t("chooseNation")}
          <select
            value={nationCode}
            onChange={(e) => setNationCode(e.target.value)}
            className="rounded-md border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {tl(c.name)}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => startWorldCup(`nat-${nationCode}`)}
          className="self-start rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {t("startWorldCup")}
        </button>
      </div>
    );
  }

  const comp = wc.competition;
  const userClub = wc.userNationId ? wc.clubs[wc.userNationId] : null;
  const done = !!comp.championId;
  const myPendingFixture = findUserPendingFixture(comp, wc.userNationId);
  const hasActiveMatch = !!state.activeMatch;

  function handlePlayMyMatch() {
    playMyMatch();
    router.push("/game/match/live");
  }

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
          <div className="flex flex-wrap gap-2">
            {hasActiveMatch && state.activeMatch?.scope === "worldcup" ? (
              <Link href="/game/match/live" className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
                {t("continueMatchBtn")}
              </Link>
            ) : (
              myPendingFixture && !hasActiveMatch && (
                <button onClick={handlePlayMyMatch} className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
                  {t("playMyMatch")}
                </button>
              )
            )}
            <button
              onClick={() => simulateRound()}
              disabled={hasActiveMatch}
              className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t("simulateRound")}
            </button>
          </div>
        )}
      </div>

      {done && comp.championId && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="font-semibold">
            {t("champion")}: {clubDisplayName(wc.clubs[comp.championId])}
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
              <LeagueTable table={g.table} clubs={wc.clubs} highlightClubId={wc.userNationId} />
            </div>
          ))}
        </div>
      )}

      {comp.bracket && <BracketView bracket={comp.bracket} clubs={wc.clubs} userClubId={wc.userNationId} />}

      <Link href="/game/competition" className="text-sm text-blue-600 hover:underline">
        ← {t("competition")}
      </Link>
    </div>
  );
}
