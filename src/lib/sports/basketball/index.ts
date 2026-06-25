import type { SportModule, Tactics } from "@/lib/types";
import { makeCalcOverall } from "../common/ratings";
import { makeGenerator } from "../common/generate";
import { makeGrowth } from "../common/growth";
import { makeLineup } from "../common/lineup";
import {
  BB_ATTRIBUTE_GROUPS,
  BB_ATTRIBUTE_KEYS,
  BB_FORMATIONS,
  BB_PHYSICAL_ATTRS,
  BB_POSITION_GROUP,
  BB_POSITION_WEIGHTS,
  BB_POSITIONS,
  BB_SQUAD_TEMPLATE,
  BB_TRAINING_FOCUSES,
} from "./constants";
import { BB_PLAYSTYLES, bbPlaystylesFor } from "./playstyles";
import { basketballPresentation } from "./match";
import { finalizeSegments, firstSegment, nextSegment, simulateMatch, simulateSegment } from "./sim";

const calcOverall = makeCalcOverall(BB_POSITION_WEIGHTS, "SF");
const generatePlayer = makeGenerator({
  attributeKeys: BB_ATTRIBUTE_KEYS,
  positionWeights: BB_POSITION_WEIGHTS,
  fallbackPos: "SF",
  playstylesFor: bbPlaystylesFor,
});
const { ageAndDevelop, weeklyTrain } = makeGrowth({
  positionWeights: BB_POSITION_WEIGHTS,
  fallbackPos: "SF",
  physicalAttrs: BB_PHYSICAL_ATTRS,
  trainingFocuses: BB_TRAINING_FOCUSES,
});
const { autoPickLineup, validateLineup } = makeLineup({
  formations: BB_FORMATIONS,
  positionWeights: BB_POSITION_WEIGHTS,
  fallbackPos: "SF",
  positionGroup: BB_POSITION_GROUP,
  benchSize: 7,
});

function defaultTactics(): Tactics {
  return { formation: "스타팅 5", mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal", lineup: [], bench: [] };
}

export const basketballModule: SportModule = {
  id: "basketball",
  name: { ko: "농구", en: "Basketball" },
  available: true,
  positions: BB_POSITIONS,
  attributeGroups: BB_ATTRIBUTE_GROUPS,
  formations: BB_FORMATIONS,
  trainingFocuses: BB_TRAINING_FOCUSES,
  playstyles: BB_PLAYSTYLES,
  squadTemplate: BB_SQUAD_TEMPLATE,
  matchPresentation: basketballPresentation,
  attributeKeys: () => BB_ATTRIBUTE_KEYS,
  playstylesFor: bbPlaystylesFor,
  ageAndDevelop,
  calcOverall,
  defaultTactics,
  autoPickLineup,
  validateLineup,
  simulateMatch,
  simulateSegment,
  finalizeSegments,
  firstSegment,
  nextSegment,
  trainPlayer: weeklyTrain,
  generatePlayer,
};
