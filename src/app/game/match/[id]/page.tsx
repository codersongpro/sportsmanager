"use client";

import { useParams } from "next/navigation";
import { MatchViewer } from "@/components/MatchViewer";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
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
    return <p className="p-4 text-soft">{t("matchResult")}</p>;
  }

  const clubs = inWorldCup ? state.worldCup!.clubs : state.clubs;
  const home = clubs[fixture.result.homeId];
  const away = clubs[fixture.result.awayId];
  if (!home || !away) return <p className="p-4 text-soft">{t("matchResult")}</p>;

  return (
    <div className="h-full w-full">
      <MatchViewer result={fixture.result} home={home} away={away} players={state.players} sportId={state.sportId} />
    </div>
  );
}
