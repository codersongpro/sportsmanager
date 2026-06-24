import type { SportModule, Tactics } from "@/lib/types";
import {
  SOCCER_ATTRIBUTE_GROUPS,
  SOCCER_ATTRIBUTE_KEYS,
  SOCCER_FORMATIONS,
  SOCCER_POSITIONS,
  SOCCER_SQUAD_TEMPLATE,
  SOCCER_TRAINING_FOCUSES,
} from "./constants";
import { SOCCER_PLAYSTYLES, playstylesForPosition } from "./playstyles";
import { calcOverall } from "./ratings";
import { generatePlayer } from "./generate";
import { ageAndDevelop, weeklyTrain } from "./growth";
import { simulateMatch } from "./sim";
import { autoPickLineup, validateLineup } from "./lineup";
import { soccerPresentation } from "./match";
import { tacticTags } from "./tactics";

export function defaultSoccerTactics(): Tactics {
  return {
    formation: "4-3-3",
    mentality: "balanced",
    tempo: "normal",
    pressing: "medium",
    width: "normal",
    lineup: [],
    bench: [],
  };
}

export const soccerModule: SportModule = {
  id: "soccer",
  name: { ko: "축구", en: "Football" },
  available: true,
  positions: SOCCER_POSITIONS,
  attributeGroups: SOCCER_ATTRIBUTE_GROUPS,
  formations: SOCCER_FORMATIONS,
  trainingFocuses: SOCCER_TRAINING_FOCUSES,
  playstyles: SOCCER_PLAYSTYLES,
  squadTemplate: SOCCER_SQUAD_TEMPLATE,
  matchPresentation: soccerPresentation,
  attributeKeys: () => SOCCER_ATTRIBUTE_KEYS,
  playstylesFor: playstylesForPosition,
  calcOverall,
  defaultTactics: defaultSoccerTactics,
  tacticTags,
  autoPickLineup,
  validateLineup,
  simulateMatch,
  trainPlayer: weeklyTrain,
  ageAndDevelop,
  generatePlayer,
};
