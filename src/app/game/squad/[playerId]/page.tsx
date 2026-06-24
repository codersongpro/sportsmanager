"use client";

import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { Avatar, Badge, RatingNumber, StatBar, attributeTierColor, groupColor, overallColor } from "@/components/Tile";
import { PlayerFormCard } from "@/components/PlayerFormCard";
import { playerDisplayName, playerInitials, formatMoney, clubDisplayName } from "@/lib/utils/format";

const ACCENTS = ["var(--mint)", "var(--blue)", "var(--red)", "var(--gold)"];

function moraleColor(morale: number): string {
  if (morale >= 85) return "var(--mint)";
  if (morale >= 65) return "#7ee0bd";
  if (morale >= 40) return "var(--gold)";
  return "var(--red)";
}

export default function PlayerDetailPage() {
  const params = useParams<{ playerId: string }>();
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const player = state.players[params.playerId];
  if (!player) return <p className="text-soft">Player not found.</p>;

  const sport = getSport(state.sportId);
  const overall = sport.calcOverall(player);
  const club = player.clubId ? state.clubs[player.clubId] : null;
  const group = sport.positions.find((p) => p.key === player.positions[0])?.group ?? "";
  const styles = player.playstyles
    .map((key) => sport.playstyles.find((p) => p.key === key))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const attrGroups = sport.attributeGroups.filter((g) => !g.onlyForGroup || g.onlyForGroup === group);

  const form = player.recentForm ?? [];
  const avgRating = form.length ? form.reduce((sum, f) => sum + f.rating, 0) / form.length : null;
  const won = form.filter((f) => f.result === "W").length;
  const drawn = form.filter((f) => f.result === "D").length;
  const lost = form.filter((f) => f.result === "L").length;

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-[18px] lg:grid-cols-[340px_1fr]">
      {/* identity + contract + playstyles */}
      <div className="flex flex-col gap-[18px]">
        <div
          className="relative overflow-hidden rounded-2xl border p-[22px]"
          style={{ borderColor: "rgba(255,255,255,.07)", background: "linear-gradient(160deg,#14241c,#131822 55%)" }}
        >
          {player.squadNumber != null && (
            <div
              className="font-display pointer-events-none absolute -right-5 -top-7 text-[150px] font-bold leading-none"
              style={{ color: "rgba(24,226,154,.06)" }}
            >
              {player.squadNumber}
            </div>
          )}
          <div className="relative flex items-center gap-4">
            <Avatar initials={playerInitials(player)} color={groupColor(group)} size={78} rounded="18px" />
            <div>
              <div className="text-[22px] font-bold tracking-wide">{playerDisplayName(player)}</div>
              <div className="mt-[3px] text-[12.5px]" style={{ color: "var(--muted-2)" }}>
                {player.age} · {player.nationality}
                {club ? ` · ${clubDisplayName(club)}` : ""}
              </div>
              <div className="mt-[9px] flex flex-wrap gap-1.5">
                {player.positions.map((pos) => (
                  <Badge key={pos} color={groupColor(group)}>{pos}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl px-[13px] py-[13px] text-center" style={{ background: "rgba(0,0,0,.25)" }}>
              <RatingNumber value={overall} color={overallColor(overall)} size="text-[32px]" />
              <div className="mt-[5px] text-[10.5px]" style={{ color: "var(--muted-2)" }}>{t("overall")}</div>
            </div>
            <div className="rounded-xl px-[13px] py-[13px] text-center" style={{ background: "rgba(0,0,0,.25)" }}>
              <RatingNumber value={player.potential} color="var(--purple)" size="text-[32px]" />
              <div className="mt-[5px] text-[10.5px]" style={{ color: "var(--muted-2)" }}>{t("potential")}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.07)", background: "var(--panel)" }}>
          <div className="font-display mb-3.5 text-[15px] font-bold">{t("contractInfo")}</div>
          <div className="flex flex-col gap-[11px] text-[12.5px]">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-2)" }}>{t("marketValue")}</span>
              <span className="font-semibold" style={{ color: "var(--mint)" }}>{formatMoney(player.value)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-2)" }}>{t("wage")}</span>
              <span className="font-semibold">{formatMoney(player.wage)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-2)" }}>{t("contractExpiry")}</span>
              <span className="font-semibold">{player.contractUntil}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-2)" }}>{t("morale")}</span>
              <span className="flex items-center gap-[7px] font-semibold">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: moraleColor(player.morale) }} />
                {Math.round(player.morale)}
              </span>
            </div>
          </div>
        </div>

        {styles.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.07)", background: "var(--panel)" }}>
            <div className="font-display mb-[13px] text-[15px] font-bold">{t("playstyles")}</div>
            <div className="flex flex-wrap gap-[7px]">
              {styles.map((s) => (
                <span
                  key={s.key}
                  title={tl(s.desc)}
                  className="rounded-lg px-[11px] py-[5px] text-[11.5px]"
                  style={{ color: "#b6bfcf", background: "rgba(76,141,255,.12)", border: "1px solid rgba(76,141,255,.25)" }}
                >
                  {tl(s.label)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* attributes + form + season record */}
      <div className="flex flex-col gap-[18px]">
        <div className="rounded-2xl border p-[22px]" style={{ borderColor: "rgba(255,255,255,.07)", background: "var(--panel)" }}>
          <div className="mb-[18px] flex items-center justify-between">
            <div className="font-display text-base font-bold">{t("attributes")}</div>
            <div className="flex gap-3.5 text-[10.5px]" style={{ color: "var(--muted-2)" }}>
              <span className="flex items-center gap-[5px]"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--mint)" }} />{t("attrExcellent")}</span>
              <span className="flex items-center gap-[5px]"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--gold)" }} />{t("attrGood")}</span>
              <span className="flex items-center gap-[5px]"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--red)" }} />{t("attrWeak")}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {attrGroups.map((g, i) => (
              <div key={g.key} className="flex flex-col gap-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ACCENTS[i % ACCENTS.length] }}>
                  {tl(g.label)}
                </div>
                <div className="flex flex-col gap-2.5">
                  {g.attributes.map((attr) => {
                    const value = player.attributes[attr.key] ?? 0;
                    const color = attributeTierColor(value);
                    return (
                      <div key={attr.key}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11.5px]" style={{ color: "#b6bfcf" }}>{tl(attr.abbr)}</span>
                          <span className="font-display text-sm font-bold" style={{ color }}>{Math.round(value)}</span>
                        </div>
                        <StatBar value={value} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.3fr_1fr]">
          <PlayerFormCard player={player} />
          <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,.07)", background: "var(--panel)" }}>
            <div className="font-display mb-4 text-[15px] font-bold">{t("seasonRecord")}</div>
            <div className="grid grid-cols-2 gap-[13px]">
              <SeasonStat label={t("played")} value={player.apps ?? 0} />
              <SeasonStat label={t("rating")} value={avgRating !== null ? avgRating.toFixed(2) : "-"} />
              <SeasonStat label={t("won")} value={won} />
              <SeasonStat label={t("drawn")} value={drawn} />
              <SeasonStat label={t("lost")} value={lost} />
              <SeasonStat label={t("form")} value={player.form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>{label}</span>
      <span className="font-display text-xl font-bold">{value}</span>
    </div>
  );
}
