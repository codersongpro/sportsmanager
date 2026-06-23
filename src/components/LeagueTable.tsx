import type { Club, LeagueRow } from "@/lib/types";
import { sortTable } from "@/lib/engine/competition";
import { clubDisplayName } from "@/lib/utils/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LeagueTable({
  table,
  clubs,
  highlightClubId,
}: {
  table: LeagueRow[];
  clubs: Record<string, Club>;
  highlightClubId?: string;
}) {
  const { t } = useI18n();
  const sorted = sortTable(table);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-300 text-left text-zinc-500 dark:border-zinc-700">
          <th className="py-1 pr-2">#</th>
          <th className="py-1 pr-2">{t("name")}</th>
          <th className="py-1 px-1 text-right">{t("played")}</th>
          <th className="py-1 px-1 text-right">{t("won")}</th>
          <th className="py-1 px-1 text-right">{t("drawn")}</th>
          <th className="py-1 px-1 text-right">{t("lost")}</th>
          <th className="py-1 px-1 text-right">{t("goalDiff")}</th>
          <th className="py-1 pl-1 text-right">{t("points")}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => {
          const club = clubs[row.clubId];
          return (
            <tr
              key={row.clubId}
              className={`border-b border-zinc-100 dark:border-zinc-800 ${row.clubId === highlightClubId ? "bg-blue-50 dark:bg-blue-950/40 font-medium" : ""}`}
            >
              <td className="py-1 pr-2">{i + 1}</td>
              <td className="py-1 pr-2">{club ? clubDisplayName(club) : row.clubId}</td>
              <td className="py-1 px-1 text-right tabular-nums">{row.played}</td>
              <td className="py-1 px-1 text-right tabular-nums">{row.won}</td>
              <td className="py-1 px-1 text-right tabular-nums">{row.drawn}</td>
              <td className="py-1 px-1 text-right tabular-nums">{row.lost}</td>
              <td className="py-1 px-1 text-right tabular-nums">{row.goalsFor - row.goalsAgainst}</td>
              <td className="py-1 pl-1 text-right font-semibold tabular-nums">{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
