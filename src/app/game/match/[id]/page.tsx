"use client";

import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { clubDisplayName, playerDisplayName } from "@/lib/utils/format";
import type { Fixture } from "@/lib/types";

export default function MatchResultPage() {
  const params = useParams<{ id: string }>();
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const fixture: Fixture | undefined =
    state.competition.fixtures.find((f) => f.id === params.id) ??
    state.worldCup?.competition.fixtures.find((f) => f.id === params.id);

  if (!fixture || !fixture.result) return <p className="text-zinc-500">{t("matchResult")} —</p>;

  const clubs = state.worldCup?.competition.fixtures.some((f) => f.id === params.id)
    ? state.worldCup.clubs
    : state.clubs;

  const r = fixture.result;
  const home = clubs[r.homeId];
  const away = clubs[r.awayId];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("matchResult")}</h1>

      <div className="flex items-center justify-center gap-6 rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <div className="flex-1">
          <p className="font-semibold">{clubDisplayName(home)}</p>
        </div>
        <div className="text-3xl font-bold tabular-nums">
          {r.homeScore} - {r.awayScore}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{clubDisplayName(away)}</p>
        </div>
      </div>

      {r.decidedBy && r.decidedBy !== "normal" && (
        <p className="text-center text-sm text-zinc-500">
          {r.decidedBy === "penalties"
            ? `${t("afterPenalties")} (${r.homePens ?? 0}-${r.awayPens ?? 0})`
            : t("afterExtraTime")}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("possession")} home={`${r.stats.homePossession}%`} away={`${100 - r.stats.homePossession}%`} />
        <Stat label={t("shots")} home={r.stats.homeShots} away={r.stats.awayShots} />
        <Stat label={t("shotsOnTarget")} home={r.stats.homeShotsOnTarget} away={r.stats.awayShotsOnTarget} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-zinc-500">{t("events")}</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {r.events.map((e, i) => {
            const player = e.playerId ? state.players[e.playerId] : null;
            const club = clubs[e.clubId];
            const label = e.type === "goal" ? t("goal") : e.type === "yellow" ? t("yellowCard") : e.type === "red" ? t("redCard") : e.type === "injury" ? t("injury") : tl(e.detail ?? { ko: "", en: "" });
            return (
              <li key={i} className="flex items-center gap-2 rounded-md border border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
                <span className="w-10 shrink-0 font-mono text-xs text-zinc-500">{e.minute}&apos;</span>
                <span className="flex-1">
                  {label} — {player ? playerDisplayName(player) : club ? clubDisplayName(club) : ""}
                </span>
              </li>
            );
          })}
          {r.events.length === 0 && <li className="text-zinc-400">—</li>}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-zinc-500">{t("ratings")}</h2>
        <div className="grid gap-1 sm:grid-cols-2">
          {Object.entries(r.playerRatings)
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, rating]) => {
              const player = state.players[playerId];
              if (!player) return null;
              return (
                <div key={playerId} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-1.5 text-sm dark:border-zinc-800">
                  <span>{playerDisplayName(player)}</span>
                  <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, home, away }: { label: string; home: string | number; away: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{home}</span>
        <span>{away}</span>
      </div>
    </div>
  );
}
