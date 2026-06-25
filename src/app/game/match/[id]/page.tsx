"use client";

import { useParams, useRouter } from "next/navigation";
import { MatchViewer } from "@/components/MatchViewer";
import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore } from "@/lib/store/gameStore";
import type { Fixture } from "@/lib/types";

export default function MatchResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const continueGame = useGameStore((s) => s.continue);

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

  // Only the user's own most-recently-resolved fixture can be "continued" from here;
  // older results browsed via history are just read-only.
  const canContinue = !inWorldCup && !state.activeMatch && state.lastResultFixtureId === fixture.id;

  function handleContinueToNext() {
    continueGame();
    const updated = useGameStore.getState().state;
    if (updated?.seasonOver) {
      router.push("/game/dashboard");
    } else if (updated?.activeMatch && !updated.activeMatch.finished) {
      router.push("/game/match/live");
    } else if (updated?.lastResultFixtureId) {
      router.push(`/game/match/${updated.lastResultFixtureId}`);
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden">
      {canContinue && (
        <div className="flex shrink-0 justify-end p-2 pb-0">
          <Button onClick={handleContinueToNext} className="px-3 py-1.5 text-sm">
            {t("continueToNextMatchBtn")}
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <MatchViewer result={fixture.result} home={home} away={away} players={state.players} sportId={state.sportId} />
      </div>
    </div>
  );
}
