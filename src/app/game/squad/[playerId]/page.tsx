"use client";

import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { AttributeBar } from "@/components/AttributeBar";
import { playerDisplayName, formatMoney, clubDisplayName } from "@/lib/utils/format";

export default function PlayerDetailPage() {
  const params = useParams<{ playerId: string }>();
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;
  const player = state.players[params.playerId];
  if (!player) return <p className="text-zinc-500">Player not found.</p>;

  const sport = getSport(state.sportId);
  const overall = sport.calcOverall(player);
  const club = player.clubId ? state.clubs[player.clubId] : null;
  const styles = player.playstyles
    .map((key) => sport.playstyles.find((p) => p.key === key))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{playerDisplayName(player)}</h1>
        <p className="text-sm text-zinc-500">
          {player.positions.join(" / ")} · {player.nationality} · {t("age")} {player.age}
          {club ? ` · ${clubDisplayName(club)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("overall")} value={overall} />
        <Stat label={t("potential")} value={player.potential} />
        <Stat label={t("value")} value={formatMoney(player.value)} />
        <Stat label={t("wage")} value={formatMoney(player.wage)} />
        <Stat label={t("morale")} value={Math.round(player.morale)} />
        <Stat label={t("condition")} value={`${Math.round(player.condition)}%`} />
        <Stat label={t("form")} value={player.form} />
        <Stat label={t("contract")} value={player.contractUntil} />
      </div>

      {styles.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold text-zinc-500">Playstyles</h2>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <span key={s.key} title={tl(s.desc)} className="rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-900">
                {tl(s.label)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold text-zinc-500">{t("attributes")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sport.attributeGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">{tl(group.label)}</h3>
              {group.attributes.map((attr) => (
                <AttributeBar key={attr.key} label={tl(attr.abbr)} value={player.attributes[attr.key] ?? 0} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
