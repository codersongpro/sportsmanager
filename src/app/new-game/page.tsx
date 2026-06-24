"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompetitionFormat, SportId } from "@/lib/types";
import { SPORT_ORDER, getSport } from "@/lib/sports";
import { getClubsForSport, getLeaguesForSport } from "@/data/clubs";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { localizedDisplayName } from "@/lib/utils/format";

type Step = "sport" | "mode" | "league" | "club" | "manager";

export default function NewGamePage() {
  const { t, tl, locale } = useI18n();
  const router = useRouter();
  const startNewGame = useGameStore((s) => s.startNewGame);

  const [step, setStep] = useState<Step>("sport");
  const [sportId, setSportId] = useState<SportId>("soccer");
  const [format, setFormat] = useState<CompetitionFormat>("league");
  const [leagueId, setLeagueId] = useState<string>("eng");
  const [clubId, setClubId] = useState<string>("");
  const [managerName, setManagerName] = useState("");
  const [starting, setStarting] = useState(false);

  const leagues = useMemo(() => getLeaguesForSport(sportId), [sportId]);
  const clubs = useMemo(() => getClubsForSport(sportId), [sportId]);
  const activeLeagueId = leagues.some((l) => l.id === leagueId) ? leagueId : leagues[0]?.id ?? "";
  const clubsInLeague = clubs.filter((c) => c.leagueId === activeLeagueId);

  function chooseSport(id: SportId) {
    const nextLeagues = getLeaguesForSport(id);
    setSportId(id);
    setLeagueId(nextLeagues[0]?.id ?? "");
    setClubId("");
  }

  function start() {
    if (!managerName.trim() || !clubId) return;
    setStarting(true);
    startNewGame({
      sportId,
      format,
      leagueId,
      clubId,
      managerName: managerName.trim(),
      locale,
    });
    if (typeof window !== "undefined") {
      const id = useGameStore.getState().state?.id;
      if (id) localStorage.setItem("sm_last_save_id", id);
    }
    router.push("/game/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("newGame")}</h1>

      {step === "sport" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-500">{t("chooseSport")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {SPORT_ORDER.map((id) => {
              const sport = getSport(id);
              const selected = sportId === id;
              return (
                <button
                  key={id}
                  disabled={!sport.available}
                  onClick={() => chooseSport(id)}
                  className={`surface-panel flex min-h-24 flex-col items-start gap-1 rounded-lg border p-4 text-left disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected ? "surface-selected" : ""
                  }`}
                >
                  <span className="font-semibold">{tl(sport.name)}</span>
                  {!sport.available && <span className="text-xs text-zinc-400">{t("comingSoon")}</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep("mode")} className="self-end rounded-md bg-blue-600 px-4 py-2 text-white">
            {t("next")}
          </button>
        </section>
      )}

      {step === "mode" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-500">{t("chooseMode")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["league", "tournament"] as CompetitionFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`surface-panel flex flex-col items-start gap-1 rounded-lg border p-4 text-left ${
                  format === f ? "surface-selected" : ""
                }`}
              >
                <span className="font-semibold">{f === "league" ? t("leagueMode") : t("tournamentMode")}</span>
                <span className="text-xs text-zinc-500">{f === "league" ? t("leagueModeDesc") : t("tournamentModeDesc")}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep("sport")} className="rounded-md border px-4 py-2">
              {t("back")}
            </button>
            <button onClick={() => setStep("league")} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {t("next")}
            </button>
          </div>
        </section>
      )}

      {step === "league" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-500">{t("chooseClub")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {leagues.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLeagueId(l.id);
                  setClubId("");
                }}
                className={`surface-panel rounded-md border px-3 py-2 text-sm font-medium ${
                  activeLeagueId === l.id ? "surface-selected" : ""
                }`}
              >
                {localizedDisplayName(l.name)}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep("mode")} className="rounded-md border px-4 py-2">
              {t("back")}
            </button>
            <button onClick={() => setStep("club")} className="rounded-md bg-blue-600 px-4 py-2 text-white">
              {t("next")}
            </button>
          </div>
        </section>
      )}

      {step === "club" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-500">{t("chooseClub")}</h2>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {clubsInLeague.map((c) => (
              <button
                key={c.id}
                onClick={() => setClubId(c.id)}
                className={`surface-panel flex min-h-20 flex-col gap-1 rounded-md border px-3 py-2 text-left text-sm ${
                  clubId === c.id ? "surface-selected" : ""
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate">{localizedDisplayName(c.name)}</span>
                </span>
                <span className="text-xs text-zinc-500">REP {c.reputation}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep("league")} className="rounded-md border px-4 py-2">
              {t("back")}
            </button>
            <button
              disabled={!clubId}
              onClick={() => setStep("manager")}
              className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
            >
              {t("next")}
            </button>
          </div>
        </section>
      )}

      {step === "manager" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-500">{t("managerProfile")}</h2>
          <label className="flex flex-col gap-1 text-sm">
            {t("managerName")}
            <input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder={t("managerName")}
            />
          </label>
          <div className="flex justify-between">
            <button onClick={() => setStep("club")} className="rounded-md border px-4 py-2">
              {t("back")}
            </button>
            <button
              disabled={!managerName.trim() || starting}
              onClick={start}
              className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
            >
              {t("startGame")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
