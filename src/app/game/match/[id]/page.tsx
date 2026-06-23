"use client";

import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { MatchViewer } from "@/components/MatchViewer";
import type { Fixture } from "@/lib/types";

export default function MatchResultPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const inWorldCup = state.worldCup?.competition.fixtures.some((f) => f.id === params.id) ?? false;
  const fixture: Fixture | undefined = inWorldCup
    ? state.worldCup!.competition.fixtures.find((f) => f.id === params.id)
    : state.competition.fixtures.find((f) => f.id === params.id);

  if (!fixture || !fixture.result || fixture.awayId === null) {
    return <p className="text-zinc-500">{t("matchResult")} —</p>;
  }

  const clubs = inWorldCup ? state.worldCup!.clubs : state.clubs;
  const home = clubs[fixture.result.homeId];
  const away = clubs[fixture.result.awayId];
  if (!home || !away) return <p className="text-zinc-500">{t("matchResult")} —</p>;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-bold">{t("watchMatch")}</h1>
      <MatchViewer result={fixture.result} home={home} away={away} players={state.players} sportId={state.sportId} />
    </div>
  );
}
