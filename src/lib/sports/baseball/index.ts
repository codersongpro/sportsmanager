import type { SportModule, Tactics } from "@/lib/types";
import { makeCalcOverall } from "../common/ratings";
import { makeGenerator } from "../common/generate";
import { makeGrowth } from "../common/growth";
import { makeLineup } from "../common/lineup";
import {
  BSB_ATTRIBUTE_GROUPS,
  BSB_ATTRIBUTE_KEYS,
  BSB_BATTER_ATTRS,
  BSB_FORMATIONS,
  BSB_PHYSICAL_ATTRS,
  BSB_PITCHER_ATTRS,
  BSB_POSITION_GROUP,
  BSB_POSITION_WEIGHTS,
  BSB_POSITIONS,
  BSB_SQUAD_TEMPLATE,
  BSB_TRAINING_FOCUSES,
} from "./constants";
import { BSB_PLAYSTYLES, bsbPlaystylesFor } from "./playstyles";
import { baseballPresentation } from "./match";
import { finalizeSegments, firstSegment, nextSegment, simulateMatch, simulateSegment } from "./sim";

const FALLBACK = "CF";
const calcOverall = makeCalcOverall(BSB_POSITION_WEIGHTS, FALLBACK);
const generatePlayer = makeGenerator({
  attributeKeys: BSB_ATTRIBUTE_KEYS,
  positionWeights: BSB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  playstylesFor: bsbPlaystylesFor,
  specialistGroups: [
    { positions: ["SP", "RP"], ownAttrs: BSB_PITCHER_ATTRS },
    { positions: ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"], ownAttrs: BSB_BATTER_ATTRS },
  ],
});
const { ageAndDevelop, weeklyTrain } = makeGrowth({
  positionWeights: BSB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  physicalAttrs: BSB_PHYSICAL_ATTRS,
  trainingFocuses: BSB_TRAINING_FOCUSES,
});
const { autoPickLineup, validateLineup } = makeLineup({
  formations: BSB_FORMATIONS,
  positionWeights: BSB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  positionGroup: BSB_POSITION_GROUP,
  requiredGroups: [{ group: "P", min: 1, labelKo: "투수", labelEn: "pitcher" }],
  benchSize: 8,
});

function defaultTactics(): Tactics {
  return { formation: "선발 9인", mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal", lineup: [], bench: [] };
}

export const baseballModule: SportModule = {
  id: "baseball",
  name: { ko: "야구", en: "Baseball" },
  available: true,
  positions: BSB_POSITIONS,
  attributeGroups: BSB_ATTRIBUTE_GROUPS,
  formations: BSB_FORMATIONS,
  trainingFocuses: BSB_TRAINING_FOCUSES,
  playstyles: BSB_PLAYSTYLES,
  squadTemplate: BSB_SQUAD_TEMPLATE,
  matchPresentation: baseballPresentation,
  attributeKeys: () => BSB_ATTRIBUTE_KEYS,
  playstylesFor: bsbPlaystylesFor,
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
