"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { LeagueTable } from "@/components/LeagueTable";
import { BracketView } from "@/components/BracketView";
import { clubDisplayName } from "@/lib/utils/format";

export default function CompetitionPage() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-[18px]">
      {comp.championId && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "color-mix(in srgb, var(--mint) 35%, transparent)", background: "color-mix(in srgb, var(--mint) 10%, transparent)" }}
        >
          <p className="text-[13px] font-semibold" style={{ color: "var(--mint)" }}>
            {t("champion")}: {clubDisplayName(state.clubs[comp.championId])}
          </p>
        </div>
      )}

      {comp.format === "league" && comp.table && (
        <div>
          <h2 className="mb-2.5 font-display text-base font-bold">{t("standings")}</h2>
          <LeagueTable table={comp.table} clubs={state.clubs} highlightClubId={myClub.id} />
        </div>
      )}

      {comp.format === "tournament" && comp.bracket && (
        <div>
          <h2 className="mb-2.5 font-display text-base font-bold">{t("bracket")}</h2>
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <BracketView bracket={comp.bracket} clubs={state.clubs} userClubId={myClub.id} />
          </div>
        </div>
      )}

      {state.sportId === "soccer" && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <h2 className="font-display mb-1.5 text-[15px] font-bold">{t("worldCup")}</h2>
          <p className="mb-3 text-[12.5px]" style={{ color: "var(--muted-2)" }}>{t("worldCupDesc")}</p>
          <Link href="/game/worldcup" className="inline-block text-[12.5px] font-semibold" style={{ color: "var(--mint)" }}>
            {t("worldCup")} →
          </Link>
        </div>
      )}
    </div>
  );
}
