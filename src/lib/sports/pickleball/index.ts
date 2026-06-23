import type { SportModule, Tactics } from "@/lib/types";
import { makeCalcOverall } from "../common/ratings";
import { makeGenerator } from "../common/generate";
import { makeGrowth } from "../common/growth";
import { makeLineup } from "../common/lineup";
import {
  PB_ATTRIBUTE_GROUPS,
  PB_ATTRIBUTE_KEYS,
  PB_FORMATIONS,
  PB_PHYSICAL_ATTRS,
  PB_POSITION_GROUP,
  PB_POSITION_WEIGHTS,
  PB_POSITIONS,
  PB_SQUAD_TEMPLATE,
  PB_TRAINING_FOCUSES,
} from "./constants";
import { PB_PLAYSTYLES, pbPlaystylesFor } from "./playstyles";
import { pickleballPresentation } from "./match";
import { simulateMatch } from "./sim";

const FALLBACK = "BL";
const calcOverall = makeCalcOverall(PB_POSITION_WEIGHTS, FALLBACK);
const generatePlayer = makeGenerator({
  attributeKeys: PB_ATTRIBUTE_KEYS,
  positionWeights: PB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  playstylesFor: pbPlaystylesFor,
});
const { ageAndDevelop, weeklyTrain } = makeGrowth({
  positionWeights: PB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  physicalAttrs: PB_PHYSICAL_ATTRS,
  trainingFocuses: PB_TRAINING_FOCUSES,
});
const { autoPickLineup, validateLineup } = makeLineup({
  formations: PB_FORMATIONS,
  positionWeights: PB_POSITION_WEIGHTS,
  fallbackPos: FALLBACK,
  positionGroup: PB_POSITION_GROUP,
  benchSize: 6,
});

function defaultTactics(): Tactics {
  return { formation: "복식", mentality: "balanced", tempo: "normal", pressing: "medium", width: "normal", lineup: [], bench: [] };
}

export const pickleballModule: SportModule = {
  id: "pickleball",
  name: { ko: "피클볼", en: "Pickleball" },
  available: true,
  positions: PB_POSITIONS,
  attributeGroups: PB_ATTRIBUTE_GROUPS,
  formations: PB_FORMATIONS,
  trainingFocuses: PB_TRAINING_FOCUSES,
  playstyles: PB_PLAYSTYLES,
  squadTemplate: PB_SQUAD_TEMPLATE,
  matchPresentation: pickleballPresentation,
  attributeKeys: () => PB_ATTRIBUTE_KEYS,
  playstylesFor: pbPlaystylesFor,
  ageAndDevelop,
  calcOverall,
  defaultTactics,
  autoPickLineup,
  validateLineup,
  simulateMatch,
  trainPlayer: weeklyTrain,
  generatePlayer,
};
