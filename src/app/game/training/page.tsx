"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { Avatar, StatBar, Tile, conditionColor, groupColor } from "@/components/Tile";
import { playerDisplayName, playerInitials } from "@/lib/utils/format";

const FOCUS_COLORS = ["var(--mint)", "var(--blue)", "var(--red)", "var(--gold)", "var(--purple)", "#9aa4b8"];

export default function TrainingPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const setTrainingFocus = useGameStore((s) => s.setTrainingFocus);

  if (!state) return null;
  const sport = getSport(state.sportId);
  const myClub = state.clubs[state.manager.clubId];
  const squad = myClub.squad.map((id) => state.players[id]).filter(Boolean);

  const avgCondition = squad.length ? squad.reduce((sum, p) => sum + p.condition, 0) / squad.length : 0;
  const injured = squad
    .filter((p) => p.injuredUntilDay != null && p.injuredUntilDay > state.day)
    .sort((a, b) => (a.injuredUntilDay ?? 0) - (b.injuredUntilDay ?? 0));

  function attrAbbr(key: string): string {
    for (const g of sport.attributeGroups) {
      const a = g.attributes.find((attr) => attr.key === key);
      if (a) return tl(a.abbr);
    }
    return key;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-[18px]">
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_340px]">
        <Tile title={t("trainingFocus")} subtitle={t("teamFocus")}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {sport.trainingFocuses.map((focus, i) => {
              const selected = state.trainingFocus === focus.key;
              const color = FOCUS_COLORS[i % FOCUS_COLORS.length];
              return (
                <button
                  key={focus.key}
                  onClick={() => setTrainingFocus(focus.key)}
                  className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left"
                  style={
                    selected
                      ? { borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 12%, transparent)` }
                      : { borderColor: "var(--border-soft)", background: "var(--panel-2)" }
                  }
                >
                  <span className="font-display text-[14.5px] font-bold" style={{ color: selected ? color : "var(--text)" }}>
                    {tl(focus.label)}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {focus.attributes.slice(0, 6).map((a) => (
                      <span
                        key={a}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
                      >
                        {attrAbbr(a)}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Tile>

        <Tile title={t("fitnessReport")}>
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px]" style={{ color: "var(--muted-2)" }}>{t("avgCondition")}</span>
                <span className="font-display text-sm font-bold" style={{ color: conditionColor(avgCondition) }}>
                  {Math.round(avgCondition)}%
                </span>
              </div>
              <StatBar value={avgCondition} color={conditionColor(avgCondition)} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-3)" }}>
                {t("injured")}
              </span>
              {injured.length === 0 ? (
                <div className="text-[12.5px]" style={{ color: "var(--muted-3)" }}>{t("noInjuries")}</div>
              ) : (
                injured.map((p) => {
                  const group = sport.positions.find((meta) => meta.key === p.positions[0])?.group ?? "";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                      style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)" }}
                    >
                      <Avatar initials={playerInitials(p)} color={groupColor(group)} size={30} rounded="8px" />
                      <div className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{playerDisplayName(p)}</div>
                      <span className="shrink-0 text-[11px] font-semibold" style={{ color: "var(--red)" }}>
                        {t("day")} {p.injuredUntilDay}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Tile>
      </div>
    </div>
  );
}
