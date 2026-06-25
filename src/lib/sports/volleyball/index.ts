import type { SportModule, Tactics } from "@/lib/types";
import { makeCalcOverall } from "../common/ratings";
import { makeGenerator } from "../common/generate";
import { makeGrowth } from "../common/growth";
import { makeLineup } from "../common/lineup";
import {
  VB_ATTRIBUTE_GROUPS,
  VB_ATTRIBUTE_KEYS,
  VB_FORMATIONS,
  VB_PHYSICAL_ATTRS,
  VB_POSITION_GROUP,
  VB_POSITION_WEIGHTS,
  VB_POSITIONS,
  VB_SQUAD_TEMPLATE,
  VB_TRAINING_FOCUSES,
} from "./constants";
import { VB_PLAYSTYLES, vbPlaystylesFor } from "./playstyles";
import { volleyballPresentation } from "./match";
import { finalizeSegments, firstSegment, nextSegment, simulateMatch, simulateSegment } from "./sim";

const FALLBACK = "OH";
const calcOverall = makeCalcOverall(VB_POSITION_WEIGHTS, FALLBACK);
const generatePlayer = makeGenerator({
  attributeKeys: VB_ATTRIBUTE_KEYS,
  positionWeights: VB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  playstylesFor: vbPlaystylesFor,
});
const { ageAndDevelop, weeklyTrain } = makeGrowth({
  positionWeights: VB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  physicalAttrs: VB_PHYSICAL_ATTRS,
  trainingFocuses: VB_TRAINING_FOCUSES,
});
const { autoPickLineup, validateLineup } = makeLineup({
  formations: VB_FORMATIONS,
  positionWeights: VB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  positionGroup: VB_POSITION_GROUP,
  requiredGroups: [{ group: "SET", min: 1, labelKo: "세터", labelEn: "setter" }],
  benchSize: 6,
});

function defaultTactics(): Tactics {
  return { formation: "스타팅 6", mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal", lineup: [], bench: [] };
}

export const volleyballModule: SportModule = {
  id: "volleyball",
  name: { ko: "배구", en: "Volleyball" },
  available: true,
  positions: VB_POSITIONS,
  attributeGroups: VB_ATTRIBUTE_GROUPS,
  formations: VB_FORMATIONS,
  trainingFocuses: VB_TRAINING_FOCUSES,
  playstyles: VB_PLAYSTYLES,
  squadTemplate: VB_SQUAD_TEMPLATE,
  matchPresentation: volleyballPresentation,
  attributeKeys: () => VB_ATTRIBUTE_KEYS,
  playstylesFor: vbPlaystylesFor,
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
