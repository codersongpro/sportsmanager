"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { LeagueTable } from "@/components/LeagueTable";
import { BracketView } from "@/components/BracketView";
import { clubDisplayName } from "@/lib/utils/format";
import { PROMOTION_RELEGATION_COUNT } from "@/lib/engine/season";

export default function CompetitionPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const myClub = state.clubs[state.manager.clubId];
  const comp = state.competition;
  const partner = state.partnerCompetition;
  const hasPromotionRelegation = comp.format === "league" && !!comp.table && !!partner?.table;

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

      {state.lastPromotions && state.lastPromotions.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <p className="mb-1.5 text-[12.5px] font-semibold" style={{ color: "var(--muted-2)" }}>
            {t("promotion")} / {t("relegation")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            {state.lastPromotions.map((entry) => {
              const club = state.clubs[entry.clubId];
              if (!club) return null;
              return (
                <span key={entry.clubId} style={{ color: entry.direction === "promoted" ? "var(--mint)" : "var(--red)" }}>
                  {clubDisplayName(club)} {entry.direction === "promoted" ? `↑ ${t("promoted")}` : `↓ ${t("relegated")}`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {comp.format === "league" && comp.table && (
        <div>
          <h2 className="mb-2.5 font-display text-base font-bold">{t("standings")}</h2>
          <LeagueTable
            table={comp.table}
            clubs={state.clubs}
            highlightClubId={myClub.id}
            relegationZone={hasPromotionRelegation ? PROMOTION_RELEGATION_COUNT : undefined}
          />
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

      {hasPromotionRelegation && partner?.table && (
        <div>
          <h2 className="mb-2.5 font-display text-base font-bold">{tl(partner.name)}</h2>
          <LeagueTable
            table={partner.table}
            clubs={state.clubs}
            promotionZone={PROMOTION_RELEGATION_COUNT}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <h2 className="font-display mb-1.5 text-[15px] font-bold">{t("worldCup")}</h2>
          <p className="mb-3 text-[12.5px]" style={{ color: "var(--muted-2)" }}>{t("worldCupDesc")}</p>
          <Link href="/game/worldcup" className="inline-block text-[12.5px] font-semibold" style={{ color: "var(--mint)" }}>
            {t("worldCup")} →
          </Link>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <h2 className="font-display mb-1.5 text-[15px] font-bold">{t("clubCup")}</h2>
          <p className="mb-3 text-[12.5px]" style={{ color: "var(--muted-2)" }}>{t("clubCupDesc")}</p>
          <Link href="/game/clubcup" className="inline-block text-[12.5px] font-semibold" style={{ color: "var(--mint)" }}>
            {t("clubCup")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
