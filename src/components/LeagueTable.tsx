import type { Club, LeagueRow } from "@/lib/types";
import { sortTable } from "@/lib/engine/competition";
import { clubDisplayName } from "@/lib/utils/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Avatar } from "@/components/Tile";

const COLS = "34px 2.3fr .55fr .55fr .55fr .55fr .65fr .65fr .65fr .8fr";

function clubInitials(club: Club): string {
  const name = club.shortName || club.nameKo || club.name;
  return name.slice(0, 2).toUpperCase();
}

type Zone = "top" | "top2" | "bottom" | null;

/** Ratio-based zone thresholds so this scales across league sizes (round-robin groups, mini-leagues, etc). */
function leagueZone(rank: number, total: number): Zone {
  if (total < 6) return null;
  const top = Math.max(1, Math.round(total * 0.15));
  const top2 = Math.max(top + 1, Math.round(total * 0.3));
  const bottom = Math.max(1, Math.round(total * 0.15));
  if (rank <= top) return "top";
  if (rank <= top2) return "top2";
  if (rank > total - bottom) return "bottom";
  return null;
}

function zoneColor(zone: Zone): string {
  switch (zone) {
    case "top": return "var(--mint)";
    case "top2": return "var(--blue)";
    case "bottom": return "var(--red)";
    default: return "transparent";
  }
}

export function LeagueTable({
  table,
  clubs,
  highlightClubId,
  promotionZone,
  relegationZone,
}: {
  table: LeagueRow[];
  clubs: Record<string, Club>;
  highlightClubId?: string;
  /** when set, overrides the default ratio-based ACL/relegation zones with an exact promotion-zone count (e.g. the top 2 rows of a partner division) */
  promotionZone?: number;
  /** when set, overrides the default ratio-based bottom zone with an exact relegation-zone count */
  relegationZone?: number;
}) {
  const { t } = useI18n();
  const sorted = sortTable(table);
  const total = sorted.length;
  const usePromoMode = promotionZone !== undefined || relegationZone !== undefined;
  const showLegend = usePromoMode || total >= 6;

  function zoneFor(rank: number): Zone {
    if (usePromoMode) {
      if (promotionZone && rank <= promotionZone) return "top";
      if (relegationZone && rank > total - relegationZone) return "bottom";
      return null;
    }
    return leagueZone(rank, total);
  }

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      {showLegend && (
        <div
          className="flex flex-wrap items-center gap-4 border-b px-5 py-2.5 text-[10.5px]"
          style={{ borderColor: "var(--border-soft)", color: "var(--muted-2)" }}
        >
          {usePromoMode ? (
            <>
              {promotionZone ? <LegendDot color="var(--mint)" label={t("promotion")} /> : null}
              {relegationZone ? <LegendDot color="var(--red)" label={t("relegation")} /> : null}
            </>
          ) : (
            <>
              <LegendDot color="var(--mint)" label={t("aclDirect")} />
              <LegendDot color="var(--blue)" label={t("aclPlayoff")} />
              <LegendDot color="var(--red)" label={t("relegation")} />
            </>
          )}
        </div>
      )}
      <div
        className="grid items-center gap-0 border-b px-5 py-[9px] text-[10px] font-semibold tracking-wide"
        style={{ gridTemplateColumns: COLS, color: "var(--muted-3)", borderColor: "rgba(255,255,255,.04)" }}
      >
        <div />
        <div>{t("name")}</div>
        <div className="text-right">{t("played")}</div>
        <div className="text-right">{t("won")}</div>
        <div className="text-right">{t("drawn")}</div>
        <div className="text-right">{t("lost")}</div>
        <div className="text-right">{t("goalsFor")}</div>
        <div className="text-right">{t("goalsAgainst")}</div>
        <div className="text-right">{t("goalDiff")}</div>
        <div className="text-right">{t("points")}</div>
      </div>
      {sorted.map((row, i) => {
        const rank = i + 1;
        const club = clubs[row.clubId];
        const zone = zoneFor(rank);
        const isMe = row.clubId === highlightClubId;
        const gd = row.goalsFor - row.goalsAgainst;
        return (
          <div
            key={row.clubId}
            className="grid items-center gap-0 border-b px-5 py-[9px]"
            style={{
              gridTemplateColumns: COLS,
              borderColor: "rgba(255,255,255,.035)",
              background: isMe ? "color-mix(in srgb, var(--mint) 8%, transparent)" : undefined,
              boxShadow: zone ? `inset 3px 0 0 ${zoneColor(zone)}` : undefined,
            }}
          >
            <div className="text-[12.5px] font-semibold" style={{ color: zone ? zoneColor(zone) : "var(--muted-2)" }}>{rank}</div>
            <div className="flex items-center gap-2.5">
              <Avatar initials={club ? clubInitials(club) : "?"} color={isMe ? "var(--mint)" : "var(--muted-2)"} size={26} rounded="7px" />
              <span className="truncate text-[12.5px]" style={{ color: isMe ? "var(--text)" : "#d7dce6", fontWeight: isMe ? 700 : 500 }}>
                {club ? clubDisplayName(club) : row.clubId}
              </span>
            </div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.played}</div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.won}</div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.drawn}</div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.lost}</div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.goalsFor}</div>
            <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{row.goalsAgainst}</div>
            <div
              className="text-right font-display-sm text-xs font-semibold"
              style={{ color: gd > 0 ? "var(--mint)" : gd < 0 ? "var(--red)" : "#9aa4b8" }}
            >
              {gd > 0 ? `+${gd}` : gd}
            </div>
            <div className="text-right font-display text-sm font-bold" style={{ color: "var(--text)" }}>{row.points}</div>
          </div>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
