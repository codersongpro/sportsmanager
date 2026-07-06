"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui";
import { sortTable } from "@/lib/engine/competition";
import { clubDisplayName } from "@/lib/utils/format";
import type { GameState } from "@/lib/types";

/** Full-screen takeover when the board has sacked the manager. The save is preserved; only the "back to title" action is offered. */
export function GameOverScreen({ state }: { state: GameState }) {
  const { t } = useI18n();
  const router = useRouter();
  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;

  const fixtures = comp.fixtures.filter((f) => f.played && f.result && (f.homeId === myClub.id || f.awayId === myClub.id));
  let wins = 0, draws = 0, losses = 0;
  for (const f of fixtures) {
    const mine = f.homeId === myClub.id ? f.result!.homeScore : f.result!.awayScore;
    const theirs = f.homeId === myClub.id ? f.result!.awayScore : f.result!.homeScore;
    if (mine > theirs) wins++;
    else if (mine < theirs) losses++;
    else draws++;
  }
  const rank = comp.format === "league" && comp.table ? sortTable(comp.table).findIndex((r) => r.clubId === myClub.id) + 1 : null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md rounded-2xl border p-8 text-center" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <p className="font-display text-2xl font-bold" style={{ color: "var(--red)" }}>{t("sackedTitle")}</p>
        <p className="mt-1.5 text-[13px]" style={{ color: "var(--muted-2)" }}>{clubDisplayName(myClub)}</p>

        <div className="mt-6 rounded-xl border p-4 text-left text-[12.5px]" style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>{t("finalRecord")}</div>
          <div className="grid grid-cols-2 gap-y-1.5">
            <span style={{ color: "var(--muted-2)" }}>{t("season")}</span>
            <span className="text-right font-semibold">{state.season}</span>
            {rank != null && rank > 0 && (
              <>
                <span style={{ color: "var(--muted-2)" }}>{t("leaguePosition")}</span>
                <span className="text-right font-semibold">#{rank}</span>
              </>
            )}
            <span style={{ color: "var(--muted-2)" }}>W-D-L</span>
            <span className="text-right font-semibold">{wins}-{draws}-{losses}</span>
            <span style={{ color: "var(--muted-2)" }}>{t("metricReputation")}</span>
            <span className="text-right font-semibold">{Math.round(state.manager.reputation)}</span>
          </div>
        </div>

        <Button className="mt-6 w-full" onClick={() => router.push("/")}>{t("backToTitle")}</Button>
      </div>
    </div>
  );
}
