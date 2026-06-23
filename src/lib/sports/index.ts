import type { LocalizedText, SportId, SportModule, Tactics } from "@/lib/types";
import { soccerModule } from "./soccer";

// Stub module for sports that are not yet implemented ("coming soon").
// Implements the interface minimally so the registry/UI can list it without
// crashing; gameplay entry points are gated on `available`.
function comingSoon(id: SportId, name: LocalizedText): SportModule {
  const tactics: Tactics = {
    formation: "",
    mentality: "balanced",
    tempo: "normal",
    pressing: "medium",
    width: "normal",
    lineup: [],
    bench: [],
  };
  const notReady = () => {
    throw new Error(`${id} module is not implemented yet`);
  };
  return {
    id,
    name,
    available: false,
    positions: [],
    attributeGroups: [],
    formations: [],
    trainingFocuses: [],
    playstyles: [],
    attributeKeys: () => [],
    playstylesFor: () => [],
    calcOverall: () => 0,
    defaultTactics: () => tactics,
    autoPickLineup: () => ({ lineup: [], bench: [] }),
    validateLineup: () => ({ valid: false, errors: [] }),
    simulateMatch: notReady,
    trainPlayer: (p) => p,
    ageAndDevelop: (p) => p,
    generatePlayer: notReady,
  };
}

export const SPORTS: Record<SportId, SportModule> = {
  soccer: soccerModule,
  baseball: comingSoon("baseball", { ko: "야구", en: "Baseball" }),
  volleyball: comingSoon("volleyball", { ko: "배구", en: "Volleyball" }),
  pickleball: comingSoon("pickleball", { ko: "피클볼", en: "Pickleball" }),
};

export const SPORT_ORDER: SportId[] = ["soccer", "baseball", "volleyball", "pickleball"];

export function getSport(id: SportId): SportModule {
  return SPORTS[id];
}
